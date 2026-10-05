import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { PaginacionQueryDto } from '../../../common/dto/paginacion-query.dto';

/**
 * Filtros del listado de libros.
 *
 * Los dos endpoints opcionales del enunciado (`/books/search?category=` y
 * `/books/low-stock?threshold=`) se apoyan en estos mismos filtros, de modo
 * que el dashboard puede combinarlos con la paginación en una sola consulta
 * en lugar de tener que elegir entre filtrar o paginar.
 */
export class FiltrarLibrosDto extends PaginacionQueryDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @MaxLength(120)
  category?: string;

  /**
   * Alias de `low_stock_threshold` con el nombre que documenta el enunciado
   * para `/books/low-stock?threshold=10`.
   *
   * Tiene que estar declarado aquí: el ValidationPipe funciona en modo
   * whitelist y descarta cualquier parámetro que no aparezca en el DTO, así
   * que sin esta propiedad el umbral llegaría siempre vacío.
   */
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (value === '' ? undefined : Number(value)))
  @IsInt({ message: 'threshold debe ser un número entero.' })
  @Min(0, { message: 'threshold no puede ser negativo.' })
  threshold?: number;

  /** Devuelve sólo los libros con `stock_quantity` menor o igual al umbral. */
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (value === '' ? undefined : Number(value)))
  @IsInt({ message: 'low_stock_threshold debe ser un número entero.' })
  @Min(0, { message: 'low_stock_threshold no puede ser negativo.' })
  low_stock_threshold?: number;

  /** Texto libre sobre título o autor; útil para el buscador del dashboard. */
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @MaxLength(255)
  search?: string;
}
