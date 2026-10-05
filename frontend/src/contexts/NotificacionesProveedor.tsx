import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  NotificacionesContexto,
  type Notificacion,
  type TipoNotificacion,
  type ValorNotificaciones,
} from './NotificacionesContexto';

/** Cuánto permanece visible una notificación antes de desaparecer sola. */
const DURACION_MS = 6000;

/**
 * Proveedor de notificaciones (toasts).
 *
 * El enunciado pide informar del éxito de las operaciones y comunicar los
 * errores de la API.  Centralizarlo aquí evita que cada pantalla invente su
 * propia forma de avisar, y permite que varias convivan apiladas.
 */
export function NotificacionesProveedor({ children }: { children: ReactNode }) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const siguienteId = useRef(1);
  // Los temporizadores se guardan para poder cancelarlos si el usuario cierra
  // la notificación a mano, y no dejar trabajo pendiente tras desmontar.
  const temporizadores = useRef(new Map<number, number>());

  const descartar = useCallback((id: number) => {
    setNotificaciones((actuales) => actuales.filter((n) => n.id !== id));

    const temporizador = temporizadores.current.get(id);
    if (temporizador !== undefined) {
      window.clearTimeout(temporizador);
      temporizadores.current.delete(id);
    }
  }, []);

  const notificar = useCallback(
    (tipo: TipoNotificacion, titulo: string, detalle?: string) => {
      const id = siguienteId.current++;
      setNotificaciones((actuales) => [...actuales, { id, tipo, titulo, detalle }]);

      const temporizador = window.setTimeout(() => descartar(id), DURACION_MS);
      temporizadores.current.set(id, temporizador);
    },
    [descartar],
  );

  const valor = useMemo<ValorNotificaciones>(
    () => ({ notificaciones, notificar, descartar }),
    [notificaciones, notificar, descartar],
  );

  return (
    <NotificacionesContexto.Provider value={valor}>{children}</NotificacionesContexto.Provider>
  );
}
