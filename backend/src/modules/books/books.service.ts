import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository, SelectQueryBuilder } from 'typeorm';
import { CodigoError } from '../../common/constants/codigos-error';
import {
  RespuestaPaginada,
  construirRespuestaPaginada,
} from '../../common/dto/respuesta-paginada.dto';
import { ExcepcionDominio } from '../../common/exceptions/excepcion-dominio';
import { normalizarIsbn } from '../../common/validators/isbn';
import { ExchangeRateService } from '../exchange-rate/exchange-rate.service';
import { Book } from './book.entity';
import { calcularPrecioVenta } from './domain/calculo-precio';
import { ActualizarLibroDto } from './dto/actualizar-libro.dto';
import { CalculoPrecioRespuesta } from './dto/calculo-precio-respuesta.dto';
import { CrearLibroDto } from './dto/crear-libro.dto';
import { FiltrarLibrosDto } from './dto/filtrar-libros.dto';
import { LibroRespuesta, aLibroRespuesta } from './dto/libro-respuesta.dto';

/** Código de PostgreSQL para violación de restricción de unicidad. */
const PG_VIOLACION_UNICIDAD = '23505';

@Injectable()
export class BooksService {
  private readonly monedaLocal: string;
  private readonly margenPorcentaje: number;

  constructor(
    @InjectRepository(Book)
    private readonly repositorio: Repository<Book>,
    private readonly exchangeRateService: ExchangeRateService,
    configService: ConfigService,
  ) {
    this.monedaLocal = configService.getOrThrow<string>('LOCAL_CURRENCY');
    this.margenPorcentaje = configService.getOrThrow<number>('PROFIT_MARGIN_PERCENTAGE');
  }

  /**
   * Da de alta un libro.
   *
   * El ISBN duplicado lo detecta el índice único de la base de datos, no un
   * SELECT previo: entre comprobar e insertar cabe otra petición, y esa
   * ventana es justo la que rompe una comprobación hecha a mano.
   */
  async crear(dto: CrearLibroDto): Promise<LibroRespuesta> {
    const libro = this.repositorio.create({
      title: dto.title,
      author: dto.author,
      isbn: dto.isbn,
      isbnNormalizado: normalizarIsbn(dto.isbn),
      costUsd: dto.cost_usd.toFixed(2),
      sellingPriceLocal: null,
      stockQuantity: dto.stock_quantity,
      category: dto.category,
      supplierCountry: dto.supplier_country,
    });

    try {
      return aLibroRespuesta(await this.repositorio.save(libro));
    } catch (error) {
      throw this.traducirErrorUnicidad(error, dto.isbn);
    }
  }

  /**
   * Listado paginado y filtrable.
   *
   * Todo se resuelve en una consulta: los `WHERE` los aplica PostgreSQL, el
   * total viene de un COUNT y el recorte de página de LIMIT/OFFSET.  Traer la
   * tabla entera para filtrarla en memoria funcionaría con el seed y se
   * hundiría con un inventario real.
   */
  async listar(filtros: FiltrarLibrosDto): Promise<RespuestaPaginada<LibroRespuesta>> {
    const consulta = this.repositorio.createQueryBuilder('book');

    this.aplicarFiltros(consulta, filtros);

    const [libros, total] = await consulta
      .orderBy('book.createdAt', 'DESC')
      // Desempate estable: sin una segunda clave, dos libros creados en el
      // mismo instante pueden cambiar de orden entre páginas y aparecer
      // repetidos o desaparecer al paginar.
      .addOrderBy('book.id', 'DESC')
      .skip(filtros.offset)
      .take(filtros.limit)
      .getManyAndCount();

    return construirRespuestaPaginada(
      libros.map(aLibroRespuesta),
      total,
      filtros.page,
      filtros.limit,
    );
  }

  async obtenerPorId(id: number): Promise<LibroRespuesta> {
    return aLibroRespuesta(await this.obtenerEntidad(id));
  }

  /** PUT: el cuerpo sustituye al recurso completo, salvo el precio calculado. */
  async actualizar(id: number, dto: ActualizarLibroDto): Promise<LibroRespuesta> {
    const libro = await this.obtenerEntidad(id);

    libro.title = dto.title;
    libro.author = dto.author;
    libro.isbn = dto.isbn;
    libro.isbnNormalizado = normalizarIsbn(dto.isbn);
    libro.costUsd = dto.cost_usd.toFixed(2);
    libro.stockQuantity = dto.stock_quantity;
    libro.category = dto.category;
    libro.supplierCountry = dto.supplier_country;

    try {
      return aLibroRespuesta(await this.repositorio.save(libro));
    } catch (error) {
      throw this.traducirErrorUnicidad(error, dto.isbn);
    }
  }

  async eliminar(id: number): Promise<void> {
    const libro = await this.obtenerEntidad(id);
    await this.repositorio.remove(libro);
  }

  /**
   * Calcula y persiste el precio de venta sugerido.
   *
   * El orden importa: primero se resuelve la tasa (que puede fallar y acabar
   * en un 503), después se calcula y sólo al final se escribe en la base. Así
   * nunca queda un precio a medias si el tercero no responde.
   */
  async calcularPrecio(id: number): Promise<CalculoPrecioRespuesta> {
    const libro = await this.obtenerEntidad(id);
    const { tasa, origen } = await this.exchangeRateService.obtenerTasa(this.monedaLocal);

    const { costeLocal, precioVenta } = calcularPrecioVenta({
      costeUsd: libro.costUsd,
      tasa,
      margenPorcentaje: this.margenPorcentaje,
    });

    libro.sellingPriceLocal = precioVenta;
    await this.repositorio.save(libro);

    return {
      book_id: libro.id,
      cost_usd: Number(libro.costUsd),
      exchange_rate: tasa,
      cost_local: Number(costeLocal),
      margin_percentage: this.margenPorcentaje,
      selling_price_local: Number(precioVenta),
      currency: this.monedaLocal,
      calculation_timestamp: new Date().toISOString(),
      rate_source: origen,
    };
  }

  // -------------------------------------------------------------------------
  // Interno
  // -------------------------------------------------------------------------

  private aplicarFiltros(consulta: SelectQueryBuilder<Book>, filtros: FiltrarLibrosDto): void {
    if (filtros.category) {
      // Insensible a mayúsculas: el usuario no tiene por qué escribir la
      // categoría exactamente como se guardó.
      consulta.andWhere('LOWER(book.category) = LOWER(:category)', {
        category: filtros.category,
      });
    }

    if (filtros.low_stock_threshold !== undefined) {
      consulta.andWhere('book.stockQuantity <= :umbral', {
        umbral: filtros.low_stock_threshold,
      });
    }

    if (filtros.search) {
      // El patrón va como parámetro y se escapan los comodines: sin eso, un
      // search de "100%" buscaría "100" seguido de cualquier cosa.
      consulta.andWhere('(book.title ILIKE :patron OR book.author ILIKE :patron)', {
        patron: `%${escaparComodines(filtros.search)}%`,
      });
    }
  }

  private async obtenerEntidad(id: number): Promise<Book> {
    const libro = await this.repositorio.findOne({ where: { id } });

    if (!libro) {
      throw ExcepcionDominio.noEncontrado(
        CodigoError.LIBRO_NO_ENCONTRADO,
        `No existe ningún libro con id ${id}.`,
      );
    }

    return libro;
  }

  private traducirErrorUnicidad(error: unknown, isbn: string): unknown {
    if (error instanceof QueryFailedError) {
      const codigo = (error as QueryFailedError & { code?: string }).code;
      if (codigo === PG_VIOLACION_UNICIDAD) {
        return ExcepcionDominio.conflicto(
          CodigoError.ISBN_DUPLICADO,
          `Ya existe un libro con el isbn ${isbn}.`,
        );
      }
    }
    return error;
  }
}

/** Neutraliza los comodines de LIKE para que la búsqueda sea literal. */
function escaparComodines(texto: string): string {
  return texto.replace(/[\\%_]/g, (caracter) => `\\${caracter}`);
}
