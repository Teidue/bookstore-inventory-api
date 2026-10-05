/** Origen de la tasa usada en un cálculo, para que la respuesta sea honesta. */
export enum OrigenTasa {
  /** Consulta en vivo a la API de tasas de cambio. */
  Api = 'exchange_api',
  /** Respuesta cacheada de una consulta anterior todavía vigente. */
  Cache = 'cache',
  /** La API falló y se usó la tasa de respaldo configurada. */
  Respaldo = 'fallback',
}

/**
 * Respuesta de `POST /books/{id}/calculate-price`.
 *
 * Los campos y sus nombres son los del enunciado.  `rate_source` se añade
 * porque el propio enunciado admite calcular con una tasa de respaldo cuando
 * la API falla: sin este dato, el cliente no podría distinguir un precio
 * calculado con la tasa real de uno calculado con la de respaldo.
 */
export interface CalculoPrecioRespuesta {
  book_id: number;
  cost_usd: number;
  exchange_rate: number;
  cost_local: number;
  margin_percentage: number;
  selling_price_local: number;
  currency: string;
  calculation_timestamp: string;
  rate_source: OrigenTasa;
}
