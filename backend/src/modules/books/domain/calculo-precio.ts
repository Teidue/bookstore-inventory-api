import Decimal from 'decimal.js';

export interface ParametrosCalculo {
  /** Coste en USD. Llega como string desde la base para no perder precisión. */
  costeUsd: string | number;
  /** Unidades de moneda local por cada USD. */
  tasa: number;
  /** Margen de ganancia en porcentaje, por ejemplo 40. */
  margenPorcentaje: number;
}

export interface ResultadoCalculo {
  /** Coste convertido a moneda local, redondeado a 2 decimales. */
  costeLocal: string;
  /** Precio de venta con el margen aplicado, redondeado a 2 decimales. */
  precioVenta: string;
}

const DECIMALES_MONETARIOS = 2;

/**
 * Calcula el precio de venta sugerido.
 *
 * Función pura: no sabe de HTTP, ni de base de datos, ni de quién le da la
 * tasa.  Por eso se puede probar exhaustivamente sin levantar nada.
 *
 * Usa `Decimal` y no aritmética de punto flotante porque son importes: con
 * `number`, 15.99 * 0.85 da 13.591499999999998 y los redondeos empiezan a
 * desviarse en cuanto se encadenan operaciones.
 *
 * El redondeo es HALF_UP y se aplica en dos pasos —primero el coste local y
 * sobre él el margen—, que es como se obtiene el resultado del ejemplo del
 * enunciado: 15.99 USD a 0.85 son 13.59, y con un 40% de margen, 19.03.
 */
export function calcularPrecioVenta({
  costeUsd,
  tasa,
  margenPorcentaje,
}: ParametrosCalculo): ResultadoCalculo {
  const coste = new Decimal(costeUsd);
  const costeLocal = coste.times(tasa).toDecimalPlaces(DECIMALES_MONETARIOS, Decimal.ROUND_HALF_UP);

  const multiplicador = new Decimal(margenPorcentaje).dividedBy(100).plus(1);
  const precioVenta = costeLocal
    .times(multiplicador)
    .toDecimalPlaces(DECIMALES_MONETARIOS, Decimal.ROUND_HALF_UP);

  return {
    costeLocal: costeLocal.toFixed(DECIMALES_MONETARIOS),
    precioVenta: precioVenta.toFixed(DECIMALES_MONETARIOS),
  };
}
