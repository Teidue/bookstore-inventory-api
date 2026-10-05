import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Parámetros de paginación comunes a los listados.
 *
 * `limit` tiene techo: sin él, `?limit=1000000` es una denegación de servicio
 * trivial contra la base de datos.
 */
export class PaginacionQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page debe ser un número entero.' })
  @Min(1, { message: 'page debe ser mayor o igual que 1.' })
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit debe ser un número entero.' })
  @Min(1, { message: 'limit debe ser mayor o igual que 1.' })
  @Max(100, { message: 'limit no puede ser mayor que 100.' })
  limit: number = 10;

  get offset(): number {
    return (this.page - 1) * this.limit;
  }
}
