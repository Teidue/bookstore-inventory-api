import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository, SelectQueryBuilder } from 'typeorm';
import { ErrorCode } from '../../common/constants/error-codes';
import { PaginatedResponse, buildPaginatedResponse } from '../../common/dto/paginated-response.dto';
import { DomainException } from '../../common/exceptions/domain-exception';
import { normalizeIsbn } from '../../common/validators/isbn';
import { ExchangeRateService } from '../exchange-rate/exchange-rate.service';
import { Book } from './book.entity';
import { calculateSellingPrice } from './domain/price-calculation';
import { UpdateBookDto } from './dto/update-book.dto';
import { PriceCalculationResponse } from './dto/price-calculation-response.dto';
import { CreateBookDto } from './dto/create-book.dto';
import { FilterBooksDto } from './dto/filter-books.dto';
import { BookResponse, toBookResponse } from './dto/book-response.dto';

/** Código de PostgreSQL para violación de restricción de unicidad. */
const PG_UNIQUE_VIOLATION = '23505';

@Injectable()
export class BooksService {
  private readonly localCurrency: string;
  private readonly marginPercentage: number;

  constructor(
    @InjectRepository(Book)
    private readonly repository: Repository<Book>,
    private readonly exchangeRateService: ExchangeRateService,
    configService: ConfigService,
  ) {
    this.localCurrency = configService.getOrThrow<string>('LOCAL_CURRENCY');
    this.marginPercentage = configService.getOrThrow<number>('PROFIT_MARGIN_PERCENTAGE');
  }

  /**
   * Da de alta un libro.
   *
   * El ISBN duplicado lo detecta el índice único de la base de datos, no un
   * SELECT previo: entre comprobar e insertar cabe otra petición, y esa
   * ventana es justo la que rompe una comprobación hecha a mano.
   */
  async create(dto: CreateBookDto): Promise<BookResponse> {
    const book = this.repository.create({
      title: dto.title,
      author: dto.author,
      isbn: dto.isbn,
      isbnNormalized: normalizeIsbn(dto.isbn),
      costUsd: dto.cost_usd.toFixed(2),
      sellingPriceLocal: null,
      stockQuantity: dto.stock_quantity,
      category: dto.category,
      supplierCountry: dto.supplier_country,
    });

    try {
      return toBookResponse(await this.repository.save(book));
    } catch (error) {
      throw this.translateUniqueViolation(error, dto.isbn);
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
  async list(filters: FilterBooksDto): Promise<PaginatedResponse<BookResponse>> {
    const query = this.repository.createQueryBuilder('book');

    this.applyFilters(query, filters);

    const [books, total] = await query
      .orderBy('book.createdAt', 'DESC')
      // Desempate estable: sin una segunda clave, dos libros creados en el
      // mismo instante pueden cambiar de orden entre páginas y aparecer
      // repetidos o desaparecer al paginar.
      .addOrderBy('book.id', 'DESC')
      .skip(filters.offset)
      .take(filters.limit)
      .getManyAndCount();

    return buildPaginatedResponse(books.map(toBookResponse), total, filters.page, filters.limit);
  }

  async findOne(id: number): Promise<BookResponse> {
    return toBookResponse(await this.findBookOrFail(id));
  }

  /** PUT: el cuerpo sustituye al recurso completo, salvo el precio calculado. */
  async update(id: number, dto: UpdateBookDto): Promise<BookResponse> {
    const book = await this.findBookOrFail(id);

    book.title = dto.title;
    book.author = dto.author;
    book.isbn = dto.isbn;
    book.isbnNormalized = normalizeIsbn(dto.isbn);
    book.costUsd = dto.cost_usd.toFixed(2);
    book.stockQuantity = dto.stock_quantity;
    book.category = dto.category;
    book.supplierCountry = dto.supplier_country;

    try {
      return toBookResponse(await this.repository.save(book));
    } catch (error) {
      throw this.translateUniqueViolation(error, dto.isbn);
    }
  }

  async remove(id: number): Promise<void> {
    const book = await this.findBookOrFail(id);
    await this.repository.remove(book);
  }

  /**
   * Calcula y persiste el precio de venta sugerido.
   *
   * El orden importa: primero se resuelve la tasa (que puede fallar y acabar
   * en un 503), después se calcula y sólo al final se escribe en la base. Así
   * nunca queda un precio a medias si el tercero no responde.
   */
  async calculatePrice(id: number): Promise<PriceCalculationResponse> {
    const book = await this.findBookOrFail(id);
    const { rate, source } = await this.exchangeRateService.getRate(this.localCurrency);

    const { localCost, sellingPrice } = calculateSellingPrice({
      costUsd: book.costUsd,
      rate,
      marginPercentage: this.marginPercentage,
    });

    book.sellingPriceLocal = sellingPrice;
    await this.repository.save(book);

    return {
      book_id: book.id,
      cost_usd: Number(book.costUsd),
      exchange_rate: rate,
      cost_local: Number(localCost),
      margin_percentage: this.marginPercentage,
      selling_price_local: Number(sellingPrice),
      currency: this.localCurrency,
      calculation_timestamp: new Date().toISOString(),
      rate_source: source,
    };
  }

  // -------------------------------------------------------------------------
  // Interno
  // -------------------------------------------------------------------------

  private applyFilters(query: SelectQueryBuilder<Book>, filters: FilterBooksDto): void {
    if (filters.category) {
      // Insensible a mayúsculas: el usuario no tiene por qué escribir la
      // categoría exactamente como se guardó.
      query.andWhere('LOWER(book.category) = LOWER(:category)', {
        category: filters.category,
      });
    }

    if (filters.low_stock_threshold !== undefined) {
      query.andWhere('book.stockQuantity <= :threshold', {
        threshold: filters.low_stock_threshold,
      });
    }

    if (filters.search) {
      // El patrón va como parámetro y se escapan los comodines: sin eso, un
      // search de "100%" buscaría "100" seguido de cualquier cosa.
      query.andWhere('(book.title ILIKE :pattern OR book.author ILIKE :pattern)', {
        pattern: `%${escapeWildcards(filters.search)}%`,
      });
    }
  }

  private async findBookOrFail(id: number): Promise<Book> {
    const book = await this.repository.findOne({ where: { id } });

    if (!book) {
      throw DomainException.notFound(
        ErrorCode.BOOK_NOT_FOUND,
        `No existe ningún libro con id ${id}.`,
      );
    }

    return book;
  }

  private translateUniqueViolation(error: unknown, isbn: string): unknown {
    if (error instanceof QueryFailedError) {
      const code = (error as QueryFailedError & { code?: string }).code;
      if (code === PG_UNIQUE_VIOLATION) {
        return DomainException.conflict(
          ErrorCode.DUPLICATE_ISBN,
          `Ya existe un libro con el isbn ${isbn}.`,
        );
      }
    }
    return error;
  }
}

/** Neutraliza los comodines de LIKE para que la búsqueda sea literal. */
function escapeWildcards(text: string): string {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`);
}
