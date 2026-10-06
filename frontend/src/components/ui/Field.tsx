import type { ReactNode } from 'react';

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

/**
 * Envoltorio de campo de formulario.
 *
 * Asocia etiqueta, ayuda y error al control por `id`, para que el mensaje de
 * validación lo anuncie también un lector de pantalla y no sólo se vea.
 */
export function Field({ id, label, error, hint, children }: FieldProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label className="text-[13px] font-medium text-ink" htmlFor={id}>
        {label}
      </label>
      {children}
      {hint && !error && (
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
