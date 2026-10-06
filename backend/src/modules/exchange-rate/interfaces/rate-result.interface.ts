import { RateSource } from '../../books/dto/price-calculation-response.dto';

export interface RateResult {
  /** Cuántas unidades de la moneda local equivalen a 1 USD. */
  rate: number;
  /** De dónde salió: API en vivo, caché o tasa de respaldo. */
  source: RateSource;
  /** Momento en que se obtuvo de la API (no en que se leyó de la caché). */
  fetchedAt: Date;
}
