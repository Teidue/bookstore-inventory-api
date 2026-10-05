const formateadorUsd = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formateadorEntero = new Intl.NumberFormat('es-ES');

/** Formatea un importe en la moneda que indique la API (EUR, MXN, VES...). */
export function formatearMoneda(valor: number, moneda: string): string {
  try {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: moneda,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valor);
  } catch {
    // Un código de moneda desconocido no debe romper la pantalla.
    return `${valor.toFixed(2)} ${moneda}`;
  }
}

export function formatearUsd(valor: number): string {
  return formateadorUsd.format(valor);
}

export function formatearNumero(valor: number): string {
  return formateadorEntero.format(valor);
}

export function formatearFecha(iso: string): string {
  const fecha = new Date(iso);
  return Number.isNaN(fecha.getTime())
    ? iso
    : fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatearFechaHora(iso: string): string {
  const fecha = new Date(iso);
  return Number.isNaN(fecha.getTime())
    ? iso
    : fecha.toLocaleString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
}
