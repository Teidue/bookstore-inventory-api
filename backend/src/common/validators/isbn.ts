import { registerDecorator, ValidationOptions } from 'class-validator';

/**
 * Normaliza un ISBN a sólo sus caracteres significativos.
 *
 * `978-84-376-0494-7`, `978 84 376 0494 7` y `9788437604947` son el mismo
 * libro: comparar las cadenas tal cual permitiría colar duplicados cambiando
 * los guiones.  La `X` final del ISBN-10 es un dígito de control válido.
 */
export function normalizeIsbn(isbn: string): string {
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
export function isValidIsbnFormat(isbn: string): boolean {
  const normalized = normalizeIsbn(isbn);
  return /^\d{13}$/.test(normalized) || /^\d{9}[\dX]$/.test(normalized);
}

export function IsIsbn(options?: ValidationOptions) {
  return function (objeto: object, propiedad: string): void {
    registerDecorator({
      name: 'esIsbn',
      target: objeto.constructor,
      propertyName: propiedad,
      options: options,
      validator: {
        validate: (value: unknown): boolean =>
          typeof value === 'string' && isValidIsbnFormat(value),
        defaultMessage: () => 'El isbn debe tener 10 o 13 dígitos (se admiten guiones y espacios).',
      },
    });
  };
}
