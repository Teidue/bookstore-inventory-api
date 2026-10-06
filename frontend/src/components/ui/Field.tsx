import { CircleAlert, CircleCheck } from 'lucide-react';
import type { ReactNode } from 'react';

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  /** Comentario no bloqueante: sustituye a la ayuda y cede ante un error. */
  note?: { tone: 'success' | 'warning'; text: string } | null;
  children: ReactNode;
}

/**
 * Envoltorio de campo de formulario.
 *
 * Asocia etiqueta, ayuda y error al control por `id`, para que el mensaje de
 * validación lo anuncie también un lector de pantalla y no sólo se vea.
 */
export function Field({ id, label, error, hint, note, children }: FieldProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label className="text-[13px] font-medium text-ink" htmlFor={id}>
        {label}
      </label>
      {children}
      {note && !error && (
        <span
          className={`flex items-start gap-1.5 text-[12px] leading-snug font-medium ${
            note.tone === 'success' ? 'text-positive' : 'text-caution'
          }`}
          id={`${id}-note`}
          data-testid="field-note"
          data-tone={note.tone}
        >
          {note.tone === 'success' ? (
            <CircleCheck size={13} className="mt-px shrink-0" aria-hidden="true" />
          ) : (
            <CircleAlert size={13} className="mt-px shrink-0" aria-hidden="true" />
          )}
          {note.text}
        </span>
      )}
      {hint && !error && !note && (
        <span className="text-[12px] leading-snug text-ink-subtle" id={`${id}-hint`}>
          {hint}
        </span>
      )}
      {error && (
        <span
          className="text-[12px] leading-snug font-medium text-critical"
          id={`${id}-error`}
          data-testid="field-error"
        >
          {error}
        </span>
      )}
    </div>
  );
}
