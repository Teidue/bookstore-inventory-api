import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsPositive,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { IsIsbn } from '../../../common/validators/isbn';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

/**
 * Alta de libro.
 *
 * Obsérvese lo que NO está aquí: `selling_price_local`.  No es un dato que se
 * escriba, sino el resultado de `POST /books/{id}/calculate-price`; si llega
 * en el body, el `whitelist` del ValidationPipe lo descarta antes de que
 * ningún servicio lo vea.
 */
export class CreateBookDto {
  @IsString()
  @Transform(trim)
  @MinLength(1, { message: 'El title es obligatorio.' })
  @MaxLength(255)
  title: string;

  @IsString()
  @Transform(trim)
  @MinLength(1, { message: 'El author es obligatorio.' })
  @MaxLength(255)
  author: string;

  @IsString()
  @Transform(trim)
  @MaxLength(20)
  @IsIsbn()
  isbn: string;

  /**
   * Dos decimales como máximo: la columna es `numeric(10,2)` y, sin esta
   * comprobación, PostgreSQL redondearía en silencio y el coste guardado no
   * sería el enviado.
   */
  @IsNumber(
    { maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false },
    { message: 'cost_usd debe ser un número con un máximo de 2 decimales.' },
  )
  @IsPositive({ message: 'cost_usd debe ser mayor que 0.' })
  @Max(99_999_999.99, { message: 'cost_usd excede el máximo admitido.' })
  cost_usd: number;

  @IsInt({ message: 'stock_quantity debe ser un número entero.' })
  @Min(0, { message: 'stock_quantity no puede ser negativo.' })
  @Max(2_147_483_647)
  stock_quantity: number;

  @IsString()
  @Transform(trim)
  @MinLength(1, { message: 'La category es obligatoria.' })
  @MaxLength(120)
  category: string;

  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @Length(2, 2, { message: 'supplier_country debe ser un código ISO 3166-1 alfa-2.' })
  @Matches(/^[A-Z]{2}$/, {
    message: 'supplier_country debe ser un código ISO 3166-1 alfa-2, por ejemplo ES.',
  })
  supplier_country: string;
}
