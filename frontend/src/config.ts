/**
 * Moneda local en la que la API calcula los precios de venta.
 *
 * El backend es quien decide (variable LOCAL_CURRENCY); aquí sólo se necesita
 * para dar formato a los importes ya calculados que llegan en el listado,
 * donde la respuesta no repite el código de moneda. Las respuestas del cálculo
 * sí lo traen, y en ese caso se usa el de la respuesta.
 */
export const LOCAL_CURRENCY = import.meta.env.VITE_LOCAL_CURRENCY ?? 'EUR';

/** Umbral por debajo del cual el inventario se considera bajo. */
export const LOW_STOCK_THRESHOLD = 10;
