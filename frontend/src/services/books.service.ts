import type {
  Book,
  BookFilters,
  BookPayload,
  PaginatedResponse,
  PriceCalculation,
} from '../types/api';
import { request } from './apiClient';

/**
 * Elige el endpoint que mejor describe la consulta.
 *
 * La API ofrece tres rutas de lectura y la interfaz las usa todas: cuando el
 * usuario filtra sólo por inventario bajo o sólo por categoría, se llama al
 * endpoint específico; para cualquier combinación, al listado general, que
 * admite los mismos filtros. Las tres devuelven la misma envoltura paginada.
 */
function listRoute(filters: BookFilters): {
  path: string;
  params: Record<string, string | number | undefined>;
} {
  const common = { page: filters.page, limit: filters.limit };
  const onlyLowStock =
    filters.low_stock_threshold !== '' && filters.category === '' && filters.search === '';
  const onlyCategory =
    filters.category !== '' && filters.low_stock_threshold === '' && filters.search === '';

  if (onlyLowStock) {
    return { path: '/books/low-stock', params: { ...common, threshold: filters.low_stock_threshold } };
  }

  if (onlyCategory) {
    return { path: '/books/search', params: { ...common, category: filters.category } };
  }

  return {
    path: '/books',
    params: {
      ...common,
      category: filters.category,
      search: filters.search,
      low_stock_threshold: filters.low_stock_threshold,
    },
  };
}

export const booksService = {
  /**
   * Listado paginado. Los filtros viajan como parámetros y los aplica
   * PostgreSQL: el cliente nunca recibe el catálogo entero para recortarlo.
   */
  list: (filters: BookFilters, signal?: AbortSignal): Promise<PaginatedResponse<Book>> => {
    const { path, params } = listRoute(filters);
    return request<PaginatedResponse<Book>>(path, { params, signal });
  },

  get: (id: number, signal?: AbortSignal): Promise<Book> => request<Book>(`/books/${id}`, { signal }),

  create: (data: BookPayload): Promise<Book> =>
    request<Book>('/books', { method: 'POST', body: data }),

  update: (id: number, data: BookPayload): Promise<Book> =>
    request<Book>(`/books/${id}`, { method: 'PUT', body: data }),

  remove: (id: number): Promise<void> => request<void>(`/books/${id}`, { method: 'DELETE' }),

  /** Dispara la integración externa y devuelve el desglose del cálculo. */
  calculatePrice: (id: number): Promise<PriceCalculation> =>
    request<PriceCalculation>(`/books/${id}/calculate-price`, { method: 'POST' }),
};
