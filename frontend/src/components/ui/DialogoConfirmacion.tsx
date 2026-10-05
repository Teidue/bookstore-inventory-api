import { TriangleAlert } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';

interface PropsDialogoConfirmacion {
  titulo: string;
  descripcion: ReactNode;
  textoConfirmar: string;
  textoProcesando: string;
  procesando: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

/**
 * Confirmación de una acción destructiva, sobre `<dialog>` nativo.
 *
 * El elemento nativo ya resuelve lo difícil de un modal accesible: atrapa el
 * foco dentro, lo devuelve al cerrar y se cierra con Escape.  Se monta sólo
 * mientras está abierto, así que no deja texto oculto en la página.
 */
export function DialogoConfirmacion({
  titulo,
  descripcion,
  textoConfirmar,
  textoProcesando,
  procesando,
  onConfirmar,
  onCancelar,
}: PropsDialogoConfirmacion) {
  const referencia = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialogo = referencia.current;
    if (dialogo && !dialogo.open) dialogo.showModal();
    return () => dialogo?.close();
  }, []);

  return (
    <dialog
      ref={referencia}
      className="dialogo"
      aria-labelledby="dialogo-titulo"
      aria-describedby="dialogo-descripcion"
      onCancel={(evento) => {
        // Escape cierra a través del estado del padre, y nunca mientras la
        // petición está en curso.
        evento.preventDefault();
        if (!procesando) onCancelar();
      }}
    >
      <div className="dialogo__cuerpo">
        <span className="dialogo__icono" aria-hidden="true">
          <TriangleAlert size={20} />
        </span>
        <div>
          <h2 id="dialogo-titulo" className="dialogo__titulo">
            {titulo}
          </h2>
          <p id="dialogo-descripcion" className="dialogo__descripcion">
            {descripcion}
          </p>
        </div>
      </div>

      <div className="dialogo__pie">
        <button
          type="button"
          className="boton boton--secundario"
          onClick={onCancelar}
          disabled={procesando}
        >
          Cancelar
        </button>
        <button
          type="button"
          className="boton boton--peligro"
          onClick={onConfirmar}
          disabled={procesando}
        >
          {procesando ? textoProcesando : textoConfirmar}
        </button>
      </div>
    </dialog>
  );
}
