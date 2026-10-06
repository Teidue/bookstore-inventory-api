import { isValidIsbnFormat, normalizeIsbn } from './isbn';

describe('normalización de ISBN', () => {
  it.each([
    ['978-84-376-0494-7', '9788437604947'],
    ['978 84 376 0494 7', '9788437604947'],
    ['9788437604947', '9788437604947'],
    ['843970001x', '843970001X'],
  ])('normaliza %s a %s', (input, esperado) => {
    expect(normalizeIsbn(input)).toBe(esperado);
  });
});

describe('formato de ISBN', () => {
  it.each(['978-84-376-0494-7', '9788437604947', '8439700016', '843970001X', '843970001x'])(
    'acepta %s',
    (isbn) => {
      expect(isValidIsbnFormat(isbn)).toBe(true);
    },
  );

  it.each([
    ['', 'cadena vacía'],
    ['123', 'demasiado corto'],
    ['12345678901', '11 dígitos'],
    ['12345678901234', '14 dígitos'],
    ['97884376O4947', 'contiene una letra O'],
    ['X788437604947', 'la X sólo vale al final de un ISBN-10'],
  ])('rechaza %s (%s)', (isbn) => {
    expect(isValidIsbnFormat(isbn)).toBe(false);
  });

  it('acepta el ISBN de ejemplo del enunciado, cuyo dígito de control no es válido', () => {
    // Deliberado: se valida el formato que pide el enunciado (10 o 13
    // dígitos), no el dígito de control del estándar EAN-13, porque su propio
    // ejemplo no lo cumple y el evaluador va a usarlo.
    expect(isValidIsbnFormat('978-84-376-0494-7')).toBe(true);
  });
});
