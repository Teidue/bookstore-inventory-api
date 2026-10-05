/**
 * Contrato de la API, declarado a mano y en snake_case porque así lo fija el
 * enunciado.  No hay `any` en ninguna respuesta: si el backend cambia una
 * forma, lo señala el compilador en lugar de romperse en tiempo de ejecución.
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

export interface MetadatosPaginacion {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface RespuestaPaginada<T> {
  data: T[];
  meta: MetadatosPaginacion;
}

/** De dónde salió la tasa usada en un cálculo. */
export type OrigenTasa = 'exchange_api' | 'cache' | 'fallback';

export interface CalculoPrecio {
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

/** Cuerpo de error que devuelve el filtro global de la API. */
export interface ErrorApi {
  statusCode: number;
  code: string;
  message: string;
  path: string;
  timestamp: string;
  details?: string[];
}

/** Cuerpo que acepta la API al crear o actualizar un libro. */
export interface LibroPayload {
  title: string;
  author: string;
  isbn: string;
  cost_usd: number;
  stock_quantity: number;
  category: string;
  supplier_country: string;
}

export interface FiltrosLibros {
  page: number;
  limit: number;
  category: string;
  search: string;
  /** Vacío significa "sin filtro de stock bajo". */
  low_stock_threshold: string;
}
