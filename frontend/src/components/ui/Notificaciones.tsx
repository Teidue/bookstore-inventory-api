import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import type { TipoNotificacion } from '../../contexts/NotificacionesContexto';

const ICONO = {
  exito: CircleCheck,
  error: CircleAlert,
  info: Info,
} as const;

/**
 * Pila de notificaciones.
 *
 * `aria-live="polite"` hace que un lector de pantalla anuncie el resultado de
 * la operación: si no, el aviso sólo existiría para quien puede verlo.
 */
export function Notificaciones() {
  const { notificaciones, descartar } = useNotificaciones();

  if (notificaciones.length === 0) return null;

  return (
    <div className="notificaciones" role="region" aria-live="polite" aria-label="Notificaciones">
      {notificaciones.map(({ id, tipo, titulo, detalle }) => {
        const Icono = ICONO[tipo as TipoNotificacion];

        return (
          <div key={id} className={`notificacion notificacion--${tipo}`}>
            <Icono className="notificacion__icono" size={18} aria-hidden="true" />
            <div className="notificacion__contenido">
              <p className="notificacion__titulo">{titulo}</p>
              {detalle && <p className="notificacion__detalle">{detalle}</p>}
            </div>
            <button
              type="button"
              className="notificacion__cerrar"
              onClick={() => descartar(id)}
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
