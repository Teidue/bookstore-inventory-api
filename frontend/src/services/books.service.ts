import type {
  Book,
  CalculoPrecio,
  FiltrosLibros,
  LibroPayload,
  RespuestaPaginada,
} from '../types/api';
import { peticion } from './clienteApi';

export const booksServicio = {
  /**
   * Listado paginado.  Los filtros viajan como parámetros y los aplica
   * PostgreSQL: el cliente nunca recibe el catálogo entero para recortarlo.
   */
  listar: (filtros: FiltrosLibros, señal?: AbortSignal): Promise<RespuestaPaginada<Book>> =>
    peticion<RespuestaPaginada<Book>>('/books', {
      parametros: {
        page: filtros.page,
        limit: filtros.limit,
        category: filtros.category,
        search: filtros.search,
        low_stock_threshold: filtros.low_stock_threshold,
      },
      señal,
    }),

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
