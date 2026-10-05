import type { ReactNode } from 'react';

interface PropsCampo {
  id: string;
  etiqueta: string;
  error?: string;
  ayuda?: string;
  children: ReactNode;
}

/**
 * Envoltorio de campo de formulario.
 *
 * Asocia etiqueta, ayuda y error al control por `id`, para que el mensaje de
 * validación lo anuncie también un lector de pantalla y no sólo se vea.
 */
export function Campo({ id, etiqueta, error, ayuda, children }: PropsCampo) {
  return (
    <div className="campo">
      <label className="campo__etiqueta" htmlFor={id}>
        {etiqueta}
      </label>
      {children}
      {ayuda && !error && (
        <span className="campo__ayuda" id={`${id}-ayuda`}>
          {ayuda}
        </span>
      )}
      {error && (
        <span className="campo__error" id={`${id}-error`}>
          {error}
        </span>
      )}
    </div>
  );
}
