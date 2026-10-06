import type { Book, BookPayload } from '../../types/api';

export interface BookFormValues {
  title: string;
  author: string;
  isbn: string;
  cost_usd: string;
  stock_quantity: string;
  category: string;
  supplier_country: string;
}

export const EMPTY_VALUES: BookFormValues = {
  title: '',
  author: '',
  isbn: '',
  cost_usd: '',
  stock_quantity: '0',
  category: '',
  supplier_country: '',
};

export type FormErrors = Partial<Record<keyof BookFormValues, string>>;

/** Mismo criterio que el backend: se ignoran guiones y espacios. */
function normalizeIsbn(isbn: string): string {
  return isbn.replace(/[\s-]/g, '').toUpperCase();
}

/** Reparto fijo de los guiones, sea cual sea el ISBN que se escriba. */
const ISBN_GROUPS = [3, 2, 3, 4, 1];

/** Un ISBN-13 tiene 13 dígitos; el ISBN-10 es un prefijo suyo de 10 con una X posible. */
const ISBN_MAX_LENGTH = 13;
const ISBN10_LENGTH = 10;

/**
 * Máscara de entrada del ISBN.
 *
 * Deja pasar sólo dígitos, corta en 13 y reparte los guiones al escribir o
 * pegar, también cuando lo pegado trae guiones o espacios de otro formato.
 * La `X` se admite únicamente como décimo carácter, que es donde la lleva un
 * ISBN-10 como dígito de control, y cierra la entrada.
 *
 * El reparto es SIEMPRE el mismo. Una versión anterior lo elegía según el
 * primer dígito (978/979 o no), y el resultado era que el mismo campo agrupaba
 * a veces de 3 en 3 y a veces de 2 en 2, y que un ISBN-13 que no empezara por
 * 978 no se podía ni escribir, aunque el backend lo acepta. Los guiones son de
 * agrupación visual: el tamaño real de cada grupo depende del país y de la
 * editorial y exigiría una tabla oficial de rangos. Lo que cuenta son los
 * dígitos, y el backend ignora los guiones al comparar.
 */
export function formatIsbnInput(raw: string): string {
  const kept: string[] = [];

  for (const char of raw.toUpperCase()) {
    // La X es el último carácter posible: tras ella no cabe nada más.
    if (kept[kept.length - 1] === 'X') break;

    if (/\d/.test(char)) {
      if (kept.length < ISBN_MAX_LENGTH) kept.push(char);
    } else if (char === 'X' && kept.length === ISBN10_LENGTH - 1) {
      kept.push(char);
    }
  }

  const groups: string[] = [];
  let start = 0;

  for (const size of ISBN_GROUPS) {
    if (start >= kept.length) break;
    groups.push(kept.slice(start, start + size).join(''));
    start += size;
  }

  // Los guiones sólo aparecen entre grupos con contenido: al borrar hacia
  // atrás nunca queda un guion colgando que obligue a borrar dos veces.
  return groups.join('-');
}

/** Cuántos caracteres significativos hay antes de `position`; guía al cursor. */
export function countIsbnChars(text: string, position: number): number {
  return text.slice(0, position).replace(/[^0-9Xx]/g, '').length;
}

/** Posición del cursor tras `count` caracteres significativos en `formatted`. */
export function caretAfterIsbnChars(formatted: string, count: number): number {
  if (count === 0) return 0;

  let seen = 0;
  for (let index = 0; index < formatted.length; index += 1) {
    if (formatted[index] !== '-') seen += 1;
    if (seen === count) return index + 1;
  }

  return formatted.length;
}

/**
 * Validación de cliente.
 *
 * Duplica a propósito las reglas del backend, pero sólo para responder al
 * instante: la validación que decide es la del servidor, y por eso el
 * formulario también muestra el error que éste devuelva. Si alguna vez las
 * dos discrepan, manda el servidor.
 */
export function validateBookForm(values: BookFormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.title.trim()) errors.title = 'El título es obligatorio.';
  if (!values.author.trim()) errors.author = 'El autor es obligatorio.';
  if (!values.category.trim()) errors.category = 'La categoría es obligatoria.';

  const isbn = normalizeIsbn(values.isbn);
  if (!isbn) {
    errors.isbn = 'El ISBN es obligatorio.';
  } else if (!/^\d{13}$/.test(isbn) && !/^\d{9}[\dX]$/.test(isbn)) {
    errors.isbn = 'El ISBN debe tener 10 o 13 dígitos (se admiten guiones).';
  }

  const cost = Number(values.cost_usd);
  if (!values.cost_usd.trim() || Number.isNaN(cost) || cost <= 0) {
    errors.cost_usd = 'El coste debe ser un número mayor que 0.';
  } else if (!/^\d+([.,]\d{1,2})?$/.test(values.cost_usd.trim())) {
    errors.cost_usd = 'El coste admite como máximo 2 decimales.';
  }

  const stock = Number(values.stock_quantity);
  if (!Number.isInteger(stock) || stock < 0) {
    errors.stock_quantity = 'El stock debe ser un entero mayor o igual que 0.';
  }

  if (!/^[A-Za-z]{2}$/.test(values.supplier_country.trim())) {
    errors.supplier_country = 'Usa un código de país de 2 letras, por ejemplo ES.';
  }

  return errors;
}

export function toPayload(values: BookFormValues): BookPayload {
  return {
    title: values.title.trim(),
    author: values.author.trim(),
    isbn: values.isbn.trim(),
    cost_usd: Number(values.cost_usd.replace(',', '.')),
    stock_quantity: Number(values.stock_quantity),
    category: values.category.trim(),
    supplier_country: values.supplier_country.trim().toUpperCase(),
  };
}

export function toFormValues(book: Book): BookFormValues {
  return {
    title: book.title,
    author: book.author,
    isbn: formatIsbnInput(book.isbn),
    cost_usd: book.cost_usd.toFixed(2),
    stock_quantity: String(book.stock_quantity),
    category: book.category,
    supplier_country: book.supplier_country,
  };
}
