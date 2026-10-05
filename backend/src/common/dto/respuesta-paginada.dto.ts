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

/**
 * Construye la envoltura paginada a partir de un `findAndCount`.
 * El `total` sale siempre de un COUNT en base de datos, nunca de la longitud
 * del array ya cargado en memoria.
 */
export function construirRespuestaPaginada<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): RespuestaPaginada<T> {
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
