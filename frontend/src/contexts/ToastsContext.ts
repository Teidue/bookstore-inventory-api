import { createContext } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  title: string;
  detail?: string;
}

export interface ToastsValue {
  toasts: Toast[];
  notify: (type: ToastType, title: string, detail?: string) => void;
  dismiss: (id: number) => void;
}

export const ToastsContext = createContext<ToastsValue | null>(null);
