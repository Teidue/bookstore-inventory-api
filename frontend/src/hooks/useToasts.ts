import { useContext } from 'react';
import { ToastsContext, type ToastsValue } from '../contexts/ToastsContext';

export function useToasts(): ToastsValue {
  const context = useContext(ToastsContext);

  if (!context) {
    throw new Error('useToasts debe usarse dentro de <ToastsProvider>.');
  }

  return context;
}
