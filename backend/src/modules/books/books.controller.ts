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
import { PaginatedResponse } from '../../common/dto/paginated-response.dto';
import { BooksService } from './books.service';
import { UpdateBookDto } from './dto/update-book.dto';
import { PriceCalculationResponse } from './dto/price-calculation-response.dto';
import { CreateBookDto } from './dto/create-book.dto';
import { FilterBooksDto } from './dto/filter-books.dto';
import { BookResponse } from './dto/book-response.dto';

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
  create(@Body() dto: CreateBookDto): Promise<BookResponse> {
    return this.booksService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista libros con paginación y filtros opcionales.' })
  list(@Query() filters: FilterBooksDto): Promise<PaginatedResponse<BookResponse>> {
    return this.booksService.list(filters);
  }

  @Get('search')
  @ApiOperation({ summary: 'Busca libros por categoría. Admite paginación.' })
  search(@Query() filters: FilterBooksDto): Promise<PaginatedResponse<BookResponse>> {
    return this.booksService.list(filters);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Libros con inventario bajo. Umbral por defecto: 10.' })
  lowStock(@Query() filters: FilterBooksDto): Promise<PaginatedResponse<BookResponse>> {
    // El enunciado documenta el parámetro como `threshold` y fija 10 por
    // defecto en este endpoint.  Se modifica la instancia en vez de
    // esparcirla, porque `offset` es un getter y un literal lo perdería.
    filters.low_stock_threshold = filters.threshold ?? filters.low_stock_threshold ?? 10;
    return this.booksService.list(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtiene un libro por su identificador.' })
  @ApiResponse({ status: 404, description: 'El libro no existe.' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<BookResponse> {
    return this.booksService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Actualiza por completo un libro existente.',
    description:
      'Sustituye todos los campos del libro. `selling_price_local` no se acepta en el cuerpo: ' +
      'si `cost_usd` cambia, el precio ya calculado vuelve a `null` (sin calcular) porque corresponde al coste anterior; ' +
      'si no cambia, se conserva.',
  })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBookDto): Promise<BookResponse> {
    return this.booksService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina un libro.' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.booksService.remove(id);
  }

  @Post(':id/calculate-price')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calcula el precio de venta con la tasa de cambio actual y lo guarda.',
  })
  @ApiResponse({ status: 200, description: 'Cálculo realizado.' })
  @ApiResponse({ status: 404, description: 'El libro no existe.' })
  @ApiResponse({ status: 503, description: 'Tasas no disponibles y sin respaldo configurado.' })
  calculatePrice(@Param('id', ParseIntPipe) id: number): Promise<PriceCalculationResponse> {
    return this.booksService.calculatePrice(id);
  }
}
