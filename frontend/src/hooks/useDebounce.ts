import { useEffect, useState } from 'react';

/**
 * Retrasa la propagación de un valor.
 *
 * El buscador lo usa para no lanzar una consulta por cada pulsación: sin esto,
 * escribir "Cervantes" serían nueve peticiones de las que ocho no le interesan
 * a nadie.
 */
export function useDebounce<T>(value: T, milliseconds = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), milliseconds);
    return () => window.clearTimeout(timer);
  }, [value, milliseconds]);

  return debounced;
}
