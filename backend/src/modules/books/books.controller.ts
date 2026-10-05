import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RespuestaPaginada } from '../../common/dto/respuesta-paginada.dto';
import { BooksService } from './books.service';
import { ActualizarLibroDto } from './dto/actualizar-libro.dto';
import { CalculoPrecioRespuesta } from './dto/calculo-precio-respuesta.dto';
import { CrearLibroDto } from './dto/crear-libro.dto';
import { FiltrarLibrosDto } from './dto/filtrar-libros.dto';
import { LibroRespuesta } from './dto/libro-respuesta.dto';

/**
 * Controlador delgado: traduce HTTP a llamadas al servicio y nada más.
 * Ninguna regla de negocio vive aquí.
 *
 * El orden de las rutas importa: `/books/search` y `/books/low-stock` se
 * declaran antes que `/books/:id`, porque si no Nest intentaría interpretar
 * "search" como un identificador.
 */
@ApiTags('books')
@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Post()
  @ApiOperation({ summary: 'Crea un libro. El precio de venta nace nulo.' })
  @ApiResponse({ status: 201, description: 'Libro creado.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  @ApiResponse({ status: 409, description: 'Ya existe un libro con ese ISBN.' })
  crear(@Body() dto: CrearLibroDto): Promise<LibroRespuesta> {
    return this.booksService.crear(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista libros con paginación y filtros opcionales.' })
  listar(@Query() filtros: FiltrarLibrosDto): Promise<RespuestaPaginada<LibroRespuesta>> {
    return this.booksService.listar(filtros);
  }

  @Get('search')
  @ApiOperation({ summary: 'Busca libros por categoría. Admite paginación.' })
  buscar(@Query() filtros: FiltrarLibrosDto): Promise<RespuestaPaginada<LibroRespuesta>> {
    return this.booksService.listar(filtros);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Libros con inventario bajo. Umbral por defecto: 10.' })
  stockBajo(@Query() filtros: FiltrarLibrosDto): Promise<RespuestaPaginada<LibroRespuesta>> {
    // El enunciado documenta el parámetro como `threshold` y fija 10 por
    // defecto en este endpoint.  Se modifica la instancia en vez de
    // esparcirla, porque `offset` es un getter y un literal lo perdería.
    filtros.low_stock_threshold = filtros.threshold ?? filtros.low_stock_threshold ?? 10;
    return this.booksService.listar(filtros);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtiene un libro por su identificador.' })
  @ApiResponse({ status: 404, description: 'El libro no existe.' })
  obtener(@Param('id', ParseIntPipe) id: number): Promise<LibroRespuesta> {
    return this.booksService.obtenerPorId(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualiza por completo un libro existente.' })
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarLibroDto,
  ): Promise<LibroRespuesta> {
    return this.booksService.actualizar(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina un libro.' })
  eliminar(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.booksService.eliminar(id);
  }

  @Post(':id/calculate-price')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calcula el precio de venta con la tasa de cambio actual y lo guarda.',
  })
  @ApiResponse({ status: 200, description: 'Cálculo realizado.' })
  @ApiResponse({ status: 404, description: 'El libro no existe.' })
  @ApiResponse({ status: 503, description: 'Tasas no disponibles y sin respaldo configurado.' })
  calcularPrecio(@Param('id', ParseIntPipe) id: number): Promise<CalculoPrecioRespuesta> {
    return this.booksService.calcularPrecio(id);
  }
}
