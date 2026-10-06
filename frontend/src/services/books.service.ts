import type {
  Book,
  CalculoPrecio,
  FiltrosLibros,
  LibroPayload,
  RespuestaPaginada,
} from '../types/api';
import { peticion } from './clienteApi';

/**
 * Elige el endpoint que mejor describe la consulta.
 *
 * La API ofrece tres rutas de lectura y la interfaz las usa todas: cuando el
 * usuario filtra sólo por inventario bajo o sólo por categoría, se llama al
 * endpoint específico; para cualquier combinación, al listado general, que
 * admite los mismos filtros. Las tres devuelven la misma envoltura paginada.
 */
function rutaDeListado(filtros: FiltrosLibros): { ruta: string; parametros: Record<string, string | number | undefined> } {
  const comunes = { page: filtros.page, limit: filtros.limit };
  const soloStockBajo =
    filtros.low_stock_threshold !== '' && filtros.category === '' && filtros.search === '';
  const soloCategoria =
    filtros.category !== '' && filtros.low_stock_threshold === '' && filtros.search === '';

  if (soloStockBajo) {
    return { ruta: '/books/low-stock', parametros: { ...comunes, threshold: filtros.low_stock_threshold } };
  }

  if (soloCategoria) {
    return { ruta: '/books/search', parametros: { ...comunes, category: filtros.category } };
  }

  return {
    ruta: '/books',
    parametros: {
      ...comunes,
      category: filtros.category,
      search: filtros.search,
      low_stock_threshold: filtros.low_stock_threshold,
    },
  };
}

export const booksServicio = {
  /**
   * Listado paginado.  Los filtros viajan como parámetros y los aplica
   * PostgreSQL: el cliente nunca recibe el catálogo entero para recortarlo.
   */
  listar: (filtros: FiltrosLibros, señal?: AbortSignal): Promise<RespuestaPaginada<Book>> => {
    const { ruta, parametros } = rutaDeListado(filtros);
    return peticion<RespuestaPaginada<Book>>(ruta, { parametros, señal });
  },

  obtener: (id: number, señal?: AbortSignal): Promise<Book> =>
    peticion<Book>(`/books/${id}`, { señal }),

  crear: (datos: LibroPayload): Promise<Book> =>
    peticion<Book>('/books', { metodo: 'POST', cuerpo: datos }),

  actualizar: (id: number, datos: LibroPayload): Promise<Book> =>
    peticion<Book>(`/books/${id}`, { metodo: 'PUT', cuerpo: datos }),

  eliminar: (id: number): Promise<void> =>
    peticion<void>(`/books/${id}`, { metodo: 'DELETE' }),

  /** Dispara la integración externa y devuelve el desglose del cálculo. */
  calcularPrecio: (id: number): Promise<CalculoPrecio> =>
    peticion<CalculoPrecio>(`/books/${id}/calculate-price`, { metodo: 'POST' }),
};
