/** Umbral por debajo del cual el inventario se considera bajo. */
export const UMBRAL_STOCK_BAJO = 10;

interface PropsEtiquetaStock {
  cantidad: number;
  umbral?: number;
}

/**
 * Estado del inventario de un libro.
 *
 * El enunciado pide "visualizar rápidamente los libros con inventario bajo":
 * el color hace ese trabajo, y el texto lo explica para quien no distinga los
 * colores.
 */
export function EtiquetaStock({ cantidad, umbral = UMBRAL_STOCK_BAJO }: PropsEtiquetaStock) {
  if (cantidad === 0) {
    return <span className="etiqueta etiqueta--peligro">Agotado</span>;
  }

  if (cantidad <= umbral) {
    return <span className="etiqueta etiqueta--aviso">{cantidad} · stock bajo</span>;
  }

  return <span className="etiqueta etiqueta--exito">{cantidad} en stock</span>;
}
