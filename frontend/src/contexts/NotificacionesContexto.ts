import { createContext } from 'react';

export type TipoNotificacion = 'exito' | 'error' | 'info';

export interface Notificacion {
  id: number;
  tipo: TipoNotificacion;
  titulo: string;
  detalle?: string;
}

export interface ValorNotificaciones {
  notificaciones: Notificacion[];
  notificar: (tipo: TipoNotificacion, titulo: string, detalle?: string) => void;
  descartar: (id: number) => void;
}

export const NotificacionesContexto = createContext<ValorNotificaciones | null>(null);
