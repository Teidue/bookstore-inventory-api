import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { ToastsContext, type Toast, type ToastType, type ToastsValue } from './ToastsContext';

/** Cuánto permanece visible una notificación antes de desaparecer sola. */
const DURATION_MS = 6000;

/**
 * Proveedor de notificaciones.
 *
 * El enunciado pide informar del éxito de las operaciones y comunicar los
 * errores de la API. Centralizarlo evita que cada pantalla invente su propia
 * forma de avisar, y permite que varias convivan apiladas.
 */
export function ToastsProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  // Los temporizadores se guardan para poder cancelarlos si el usuario cierra
  // la notificación a mano, y no dejar trabajo pendiente tras desmontar.
  const timers = useRef(new Map<number, number>());

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));

    const timer = timers.current.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const notify = useCallback(
    (type: ToastType, title: string, detail?: string) => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, type, title, detail }]);
      timers.current.set(id, window.setTimeout(() => dismiss(id), DURATION_MS));
    },
    [dismiss],
  );

  const value = useMemo<ToastsValue>(() => ({ toasts, notify, dismiss }), [toasts, notify, dismiss]);

  return <ToastsContext.Provider value={value}>{children}</ToastsContext.Provider>;
}
