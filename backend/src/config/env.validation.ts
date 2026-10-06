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

export enum Environment {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}

/** Una variable vacía en el `.env` equivale a no haberla definido. */
const emptyToUndefined = ({ value }: { value: unknown }): unknown =>
  value === '' ? undefined : value;

/**
 * Contrato de las variables de entorno.
 *
 * Se valida al arrancar: si algo falta o es inválido el proceso muere
 * inmediatamente, en vez de fallar más tarde con un error incomprensible en
 * mitad de una petición.
 */
export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

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
  @Transform(emptyToUndefined)
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
  @IsNumber()
  @IsPositive()
  EXCHANGE_FALLBACK_RATE?: number;

  @IsString()
  @IsNotEmpty()
  CORS_ORIGIN: string = 'http://localhost:5173';
}

/**
 * Variables numéricas opcionales que, vacías, significan «no configurada».
 *
 * Hay que descartarlas ANTES de convertir. Con `enableImplicitConversion`,
 * class-transformer convierte `''` en `0` antes de que un `@Transform` llegue a
 * verlo, así que `emptyToUndefined` no puede resolverlo a nivel de campo y una
 * variable vacía hacía fallar el arranque aunque la documentación la presenta
 * como la forma de pedir un 503 en lugar de un precio con tasa de respaldo.
 */
const BLANK_MEANS_UNSET = ['EXCHANGE_FALLBACK_RATE'] as const;

export function validateEnvironment(configuration: Record<string, unknown>): EnvironmentVariables {
  const normalized = { ...configuration };
  for (const key of BLANK_MEANS_UNSET) {
    const value = normalized[key];
    if (typeof value === 'string' && value.trim() === '') delete normalized[key];
  }

  const validated = plainToInstance(EnvironmentVariables, normalized, {
    enableImplicitConversion: true,
    exposeDefaultValues: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    const detail = errors
      .map((e) => `  - ${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`)
      .join('\n');
    throw new Error(`Configuración de entorno inválida:\n${detail}`);
  }

  return validated;
}
