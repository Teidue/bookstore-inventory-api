import { useEffect, useState } from 'react';

/**
 * Retrasa la propagación de un valor.
 *
 * El buscador lo usa para no lanzar una consulta por cada pulsación: sin
 * esto, escribir "Cervantes" serían nueve peticiones de las que ocho no le
 * interesan a nadie.
 */
export function useRetardo<T>(valor: T, milisegundos = 400): T {
  const [valorRetardado, setValorRetardado] = useState(valor);

  useEffect(() => {
    const temporizador = window.setTimeout(() => setValorRetardado(valor), milisegundos);
    return () => window.clearTimeout(temporizador);
  }, [valor, milisegundos]);

  return valorRetardado;
}
