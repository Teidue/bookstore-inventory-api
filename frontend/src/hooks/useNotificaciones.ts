import { useContext } from 'react';
import {
  NotificacionesContexto,
  type ValorNotificaciones,
} from '../contexts/NotificacionesContexto';

export function useNotificaciones(): ValorNotificaciones {
  const contexto = useContext(NotificacionesContexto);

  if (!contexto) {
    throw new Error('useNotificaciones debe usarse dentro de <NotificacionesProveedor>.');
  }

  return contexto;
}
