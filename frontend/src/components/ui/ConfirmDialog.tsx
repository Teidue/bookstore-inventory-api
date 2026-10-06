import { TriangleAlert } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { Button } from './Button';

interface ConfirmDialogProps {
  title: string;
  description: ReactNode;
  confirmLabel: string;
  pendingLabel: string;
  pending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Confirmación de una acción destructiva, sobre `<dialog>` nativo.
 *
 * El elemento nativo ya resuelve lo difícil de un modal accesible: atrapa el
 * foco dentro, lo devuelve al cerrar y se cierra con Escape. Se monta sólo
 * mientras está abierto, así que no deja texto oculto en la página.
 */
export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  pendingLabel,
  pending,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="m-auto w-[min(27rem,calc(100vw-2rem))] rounded-xl border border-line bg-surface p-0 text-ink shadow-overlay"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      data-testid="confirm-dialog"
      onCancel={(event) => {
        // Escape cierra a través del estado del padre, y nunca mientras la
        // petición está en curso.
        event.preventDefault();
        if (!pending) onCancel();
      }}
    >
      <div className="flex gap-3.5 p-5">
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-critical-soft text-critical ring-1 ring-critical/15"
          aria-hidden="true"
        >
          <TriangleAlert size={18} />
        </span>
        <div className="min-w-0">
          <h2 id="confirm-dialog-title" className="text-[15px] font-semibold tracking-[-0.01em]">
            {title}
          </h2>
          <p
            id="confirm-dialog-description"
            className="mt-1.5 text-[13px] leading-relaxed text-ink-muted"
          >
            {description}
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-line bg-sunken px-5 py-3.5">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
        <Button type="button" variant="danger" onClick={onConfirm} disabled={pending}>
          {pending ? pendingLabel : confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
