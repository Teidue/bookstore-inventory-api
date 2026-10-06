import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import type { ToastType } from '../../contexts/ToastsContext';
import { useToasts } from '../../hooks/useToasts';

const ICON = {
  success: CircleCheck,
  error: CircleAlert,
  info: Info,
} as const;

const ACCENT: Record<ToastType, string> = {
  success: 'text-positive',
  error: 'text-critical',
  info: 'text-accent',
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
      className="fixed right-5 bottom-5 z-50 flex w-[min(23rem,calc(100vw-2.5rem))] flex-col gap-2"
      role="region"
      aria-live="polite"
      aria-label="Notificaciones"
    >
      {toasts.map(({ id, type, title, detail }) => {
        const Icon = ICON[type];

        return (
          <div
            key={id}
            className="animate-toast-in flex items-start gap-3 rounded-xl border border-line bg-surface/95 px-4 py-3 shadow-overlay backdrop-blur"
            data-testid="toast"
            data-toast-type={type}
          >
            <Icon size={17} className={`mt-px shrink-0 ${ACCENT[type]}`} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] leading-snug font-semibold text-ink">{title}</p>
              {detail && (
                <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">{detail}</p>
              )}
            </div>
            <button
              type="button"
              className="-m-1 rounded-md p-1 text-ink-subtle transition-colors hover:bg-ink/5 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35"
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
