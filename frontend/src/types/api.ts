/**
 * Contrato de la API, declarado a mano y en snake_case porque así lo fija el
 * enunciado. No hay `any` en ninguna respuesta: si el backend cambia una
 * forma, lo señala el compilador.
 */

export interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  cost_usd: number;
  selling_price_local: number | null;
  stock_quantity: number;
  category: string;
  supplier_country: string;
  created_at: string;
  updated_at: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/** De dónde salió la tasa usada en un cálculo. */
export type RateSource = 'exchange_api' | 'cache' | 'fallback';

export interface PriceCalculation {
  book_id: number;
  cost_usd: number;
  exchange_rate: number;
  cost_local: number;
  margin_percentage: number;
  selling_price_local: number;
  currency: string;
  calculation_timestamp: string;
  rate_source: RateSource;
}

/** Cuerpo de error que devuelve el filtro global de la API. */
export interface ApiError {
  statusCode: number;
  code: string;
  message: string;
  path: string;
  timestamp: string;
  details?: string[];
}

/** Cuerpo que acepta la API al crear o actualizar un libro. */
export interface BookPayload {
  title: string;
  author: string;
  isbn: string;
  cost_usd: number;
  stock_quantity: number;
  category: string;
  supplier_country: string;
}

export interface BookFilters {
  page: number;
  limit: number;
  category: string;
  search: string;
  /** Vacío significa "sin filtro de stock bajo". */
  low_stock_threshold: string;
}
