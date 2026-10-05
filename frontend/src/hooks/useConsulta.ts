import { useCallback, useEffect, useState } from 'react';
import { ErrorPeticion } from '../services/clienteApi';

/**
 * Estado de una lectura contra la API, como unión discriminada.
 *
 * Modelarlo así y no con booleanos sueltos hace que los estados imposibles
 * —cargando y con error a la vez— no se puedan ni representar, y obliga a
 * cada vista a decidir qué pinta en cada caso: es lo que impide que un fallo
 * de la API acabe en un indicador de carga infinito.
 */
export type EstadoConsulta<T> =
  | { situacion: 'cargando'; datos: T | null; error: null }
  | { situacion: 'exito'; datos: T; error: null }
  | { situacion: 'error'; datos: T | null; error: ErrorPeticion };

export interface ResultadoConsulta<T> {
  estado: EstadoConsulta<T>;
  recargar: () => void;
}

/**
 * Ejecuta una lectura y expone su estado.
 *
 * Cada ejecución aborta la anterior: sin eso, teclear en el buscador dispara
 * varias peticiones y la más lenta puede llegar la última y sobrescribir el
 * resultado correcto con uno viejo.
 */
export function useConsulta<T>(
  consultar: (señal: AbortSignal) => Promise<T>,
  dependencias: readonly unknown[],
): ResultadoConsulta<T> {
  const [estado, setEstado] = useState<EstadoConsulta<T>>({
    situacion: 'cargando',
    datos: null,
    error: null,
  });
  const [contadorRecarga, setContadorRecarga] = useState(0);

  const recargar = useCallback(() => setContadorRecarga((valor) => valor + 1), []);

  useEffect(() => {
    const controlador = new AbortController();

    // Se conservan los datos anteriores mientras se recarga para que la tabla
    // no parpadee a vacío en cada cambio de filtro.
    setEstado((anterior) => ({ situacion: 'cargando', datos: anterior.datos, error: null }));

    consultar(controlador.signal)
      .then((datos) => setEstado({ situacion: 'exito', datos, error: null }))
      .catch((error: unknown) => {
        if (controlador.signal.aborted) return;

        setEstado((anterior) => ({
          situacion: 'error',
          datos: anterior.datos,
          error:
            error instanceof ErrorPeticion
              ? error
              : new ErrorPeticion(0, 'ERROR_DESCONOCIDO', 'Ha ocurrido un error inesperado.'),
        }));
      });

    return () => controlador.abort();
    // `consultar` se recrea en cada render, así que las dependencias reales
    // son las que declara quien llama al hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencias, contadorRecarga]);

  return { estado, recargar };
}
