import { useCallback, useEffect, useState } from 'react';
import { RequestError } from '../services/apiClient';

/**
 * Estado de una lectura contra la API, como unión discriminada.
 *
 * Modelarlo así y no con booleanos sueltos hace que los estados imposibles
 * —cargando y con error a la vez— no se puedan ni representar, y obliga a cada
 * vista a decidir qué pinta en cada caso: es lo que impide que un fallo de la
 * API acabe en un indicador de carga infinito.
 */
export type QueryState<T> =
  | { status: 'loading'; data: T | null; error: null }
  | { status: 'success'; data: T; error: null }
  | { status: 'error'; data: T | null; error: RequestError };

export interface QueryResult<T> {
  state: QueryState<T>;
  refetch: () => void;
}

/**
 * Ejecuta una lectura y expone su estado.
 *
 * Cada ejecución aborta la anterior: sin eso, teclear en el buscador dispara
 * varias peticiones y la más lenta puede llegar la última y sobrescribir el
 * resultado correcto con uno viejo.
 */
export function useQuery<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  dependencies: readonly unknown[],
): QueryResult<T> {
  const [state, setState] = useState<QueryState<T>>({
    status: 'loading',
    data: null,
    error: null,
  });
  const [reloadCount, setReloadCount] = useState(0);

  const refetch = useCallback(() => setReloadCount((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();

    // Se conservan los datos anteriores mientras se recarga para que la tabla
    // no parpadee a vacío en cada cambio de filtro.
    setState((previous) => ({ status: 'loading', data: previous.data, error: null }));

    fetcher(controller.signal)
      .then((data) => setState({ status: 'success', data, error: null }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;

        setState((previous) => ({
          status: 'error',
          data: previous.data,
          error:
            error instanceof RequestError
              ? error
              : new RequestError(0, 'UNKNOWN_ERROR', 'Ha ocurrido un error inesperado.'),
        }));
      });

    return () => controller.abort();
    // `fetcher` se recrea en cada render, así que las dependencias reales son
    // las que declara quien llama al hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, reloadCount]);

  return { state, refetch };
}
