import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import type { ToastType } from '../../contexts/ToastsContext';
import { useToasts } from '../../hooks/useToasts';

const ICON = {
  success: CircleCheck,
  error: CircleAlert,
  info: Info,
} as const;

const ACCENT: Record<ToastType, string> = {
  success: 'text-emerald-600',
  error: 'text-red-600',
  info: 'text-blue-600',
};

/**
 * Pila de notificaciones.
 *
 * `aria-live="polite"` hace que un lector de pantalla anuncie el resultado de
 * la operación: si no, el aviso sólo existiría para quien puede verlo.
 */
export function Toasts() {
  const { toasts, dismiss } = useToasts();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed right-4 bottom-4 z-50 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2"
      role="region"
      aria-live="polite"
      aria-label="Notificaciones"
    >
      {toasts.map(({ id, type, title, detail }) => {
        const Icon = ICON[type];

        return (
          <div
            key={id}
            className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-white px-3.5 py-3 shadow-lg"
            data-testid="toast"
            data-toast-type={type}
          >
            <Icon size={18} className={`mt-0.5 shrink-0 ${ACCENT[type]}`} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-slate-900">{title}</p>
              {detail && <p className="mt-0.5 text-xs text-slate-600">{detail}</p>}
            </div>
            <button
              type="button"
              className="-m-1 rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
              onClick={() => dismiss(id)}
              aria-label="Cerrar notificación"
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
