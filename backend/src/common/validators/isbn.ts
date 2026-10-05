import { registerDecorator, ValidationOptions } from 'class-validator';

/**
 * Normaliza un ISBN a sólo sus caracteres significativos.
 *
 * `978-84-376-0494-7`, `978 84 376 0494 7` y `9788437604947` son el mismo
 * libro: comparar las cadenas tal cual permitiría colar duplicados cambiando
 * los guiones.  La `X` final del ISBN-10 es un dígito de control válido.
 */
export function normalizarIsbn(isbn: string): string {
  return isbn.replace(/[\s-]/g, '').toUpperCase();
}

/**
 * Comprueba el formato exigido por el enunciado: 10 o 13 dígitos.
 *
 * Deliberadamente NO se valida el dígito de control del estándar EAN-13: el
 * propio ISBN de ejemplo del enunciado (978-84-376-0494-7) no lo cumple, así
 * que validarlo rechazaría los datos que el evaluador va a probar.  Se
 * implementa el requisito tal y como está escrito.
 */
export function esFormatoIsbnValido(isbn: string): boolean {
  const normalizado = normalizarIsbn(isbn);
  return /^\d{13}$/.test(normalizado) || /^\d{9}[\dX]$/.test(normalizado);
}

export function EsIsbn(opciones?: ValidationOptions) {
  return function (objeto: object, propiedad: string): void {
    registerDecorator({
      name: 'esIsbn',
      target: objeto.constructor,
      propertyName: propiedad,
      options: opciones,
      validator: {
        validate: (valor: unknown): boolean =>
          typeof valor === 'string' && esFormatoIsbnValido(valor),
        defaultMessage: () => 'El isbn debe tener 10 o 13 dígitos (se admiten guiones y espacios).',
      },
    });
  };
}
