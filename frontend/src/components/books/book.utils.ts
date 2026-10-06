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
    isbn: book.isbn,
    cost_usd: book.cost_usd.toFixed(2),
    stock_quantity: String(book.stock_quantity),
    category: book.category,
    supplier_country: book.supplier_country,
  };
}
