/**
 * Moneda local en la que la API calcula los precios de venta.
 *
 * El backend es quien decide realmente (variable LOCAL_CURRENCY); aquí sólo
 * se necesita para dar formato a los importes ya calculados que vienen en el
 * listado, donde la respuesta no repite el código de moneda.  Las respuestas
 * del cálculo sí lo traen, y en ese caso se usa el de la respuesta.
 */
export const MONEDA_LOCAL = import.meta.env.VITE_LOCAL_CURRENCY ?? 'EUR';
