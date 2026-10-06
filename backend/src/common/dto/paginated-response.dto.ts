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

/**
 * Construye la envoltura paginada a partir de un `findAndCount`.
 * El `total` sale siempre de un COUNT en base de datos, nunca de la longitud
 * del array ya cargado en memoria.
 */
export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResponse<T> {
  return {
    data,
    meta: {
      total,
      page,
      limit,
      total_pages: limit > 0 ? Math.ceil(total / limit) : 0,
    },
  };
}
