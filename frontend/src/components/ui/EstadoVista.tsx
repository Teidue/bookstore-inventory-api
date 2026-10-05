import { CircleAlert, Inbox, RotateCw, TriangleAlert, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { ErrorPeticion } from '../../services/clienteApi';

/**
 * Los tres estados que toda vista que consume datos debe saber pintar.
 * Viven en un único sitio para que ninguna pantalla se olvide del error o del
 * vacío y acabe mostrando un indicador de carga que no termina nunca.
 */

type Variante = 'panel' | 'plano';

const claseVista = (variante: Variante): string =>
  variante === 'panel' ? 'estado-vista estado-vista--panel' : 'estado-vista';

export function Cargando({ mensaje = 'Cargando...' }: { mensaje?: string }) {
  return (
    <div className="estado-vista" role="status" aria-live="polite">
      <div className="girador" aria-hidden="true" />
      <p>{mensaje}</p>
    </div>
  );
}

interface PropsErrorVista {
  error: ErrorPeticion;
  onReintentar?: () => void;
  variante?: Variante;
  children?: ReactNode;
}

export function ErrorVista({ error, onReintentar, variante = 'panel', children }: PropsErrorVista) {
  return (
    <div className={claseVista(variante)} role="alert">
      <span className="estado-vista__icono estado-vista__icono--error" aria-hidden="true">
        <TriangleAlert size={22} />
      </span>
      <p className="estado-vista__titulo">No se han podido cargar los datos</p>
      <p className="estado-vista__descripcion">{error.message}</p>
      {/* Un error sin salida deja al usuario atrapado: siempre hay reintento. */}
      {(onReintentar || children) && (
        <div className="estado-vista__acciones">
          {onReintentar && (
            <button type="button" className="boton boton--secundario" onClick={onReintentar}>
              <RotateCw size={16} aria-hidden="true" />
              Reintentar
            </button>
          )}
          {children}
        </div>
      )}
    </div>
  );
}

interface PropsVacio {
  titulo: string;
  descripcion?: string;
  icono?: LucideIcon;
  variante?: Variante;
  children?: ReactNode;
}

export function Vacio({
  titulo,
  descripcion,
  icono: Icono = Inbox,
  variante = 'panel',
  children,
}: PropsVacio) {
  return (
    <div className={claseVista(variante)}>
      <span className="estado-vista__icono" aria-hidden="true">
        <Icono size={22} />
      </span>
      <p className="estado-vista__titulo">{titulo}</p>
      {descripcion && <p className="estado-vista__descripcion">{descripcion}</p>}
      {children && <div className="estado-vista__acciones">{children}</div>}
    </div>
  );
}

export function AlertaError({ mensaje }: { mensaje: string }) {
  return (
    <div className="alerta alerta--error" role="alert">
      <CircleAlert size={16} aria-hidden="true" />
      <span>{mensaje}</span>
    </div>
  );
}
