import { plainToInstance, Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  Length,
  Max,
  Min,
  validateSync,
} from 'class-validator';

export enum Entorno {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}

/** Una variable vacía en el `.env` equivale a no haberla definido. */
const vacioEsIndefinido = ({ value }: { value: unknown }): unknown =>
  value === '' ? undefined : value;

/**
 * Contrato de las variables de entorno.
 *
 * Se valida al arrancar: si algo falta o es inválido el proceso muere
 * inmediatamente, en vez de fallar más tarde con un error incomprensible en
 * mitad de una petición.
 */
export class VariablesEntorno {
  @IsEnum(Entorno)
  NODE_ENV: Entorno = Entorno.Development;

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  @IsString()
  @IsNotEmpty()
  DB_HOST: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  DB_PORT: number = 5432;

  @IsString()
  @IsNotEmpty()
  DB_USER: string;

  @IsString()
  DB_PASSWORD: string;

  @IsString()
  @IsNotEmpty()
  DB_NAME: string;

  /** Sólo lo usan los tests de integración, para aislarse en su propio esquema. */
  @IsOptional()
  @Transform(vacioEsIndefinido)
  @IsString()
  @IsNotEmpty()
  DB_SCHEMA?: string;

  /** Código ISO 4217 de la moneda a la que se convierte el coste en USD. */
  @IsString()
  @Length(3, 3, { message: 'LOCAL_CURRENCY debe ser un código ISO 4217 de 3 letras.' })
  LOCAL_CURRENCY: string = 'EUR';

  @IsNumber()
  @Min(0)
  @Max(1000)
  PROFIT_MARGIN_PERCENTAGE: number = 40;

  @IsUrl({ require_tld: false })
  EXCHANGE_API_URL: string = 'https://api.exchangerate-api.com/v4/latest/USD';

  @IsInt()
  @Min(100)
  EXCHANGE_TIMEOUT_MS: number = 5000;

  @IsInt()
  @Min(0)
  EXCHANGE_CACHE_TTL_SECONDS: number = 600;

  /**
   * Tasa de respaldo cuando la API externa falla, como exige el enunciado.
   *
   * Es opcional a propósito: sin ella la API responde 503 en lugar de
   * calcular un precio con un dato inventado.  Quien despliega decide qué
   * prefiere, y la respuesta dice siempre qué origen se usó.
   */
  @IsOptional()
  @Transform(vacioEsIndefinido)
  @IsNumber()
  @IsPositive()
  EXCHANGE_FALLBACK_RATE?: number;

  @IsString()
  @IsNotEmpty()
  CORS_ORIGIN: string = 'http://localhost:5173';
}

export function validarEntorno(configuracion: Record<string, unknown>): VariablesEntorno {
  const validada = plainToInstance(VariablesEntorno, configuracion, {
    enableImplicitConversion: true,
    exposeDefaultValues: true,
  });

  const errores = validateSync(validada, { skipMissingProperties: false });

  if (errores.length > 0) {
    const detalle = errores
      .map((e) => `  - ${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`)
      .join('\n');
    throw new Error(`Configuración de entorno inválida:\n${detalle}`);
  }

  return validada;
}
