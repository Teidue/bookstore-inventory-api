import type { Book, LibroPayload } from '../../types/api';

export interface ValoresFormularioLibro {
  title: string;
  author: string;
  isbn: string;
  cost_usd: string;
  stock_quantity: string;
  category: string;
  supplier_country: string;
}

export const VALORES_VACIOS: ValoresFormularioLibro = {
  title: '',
  author: '',
  isbn: '',
  cost_usd: '',
  stock_quantity: '0',
  category: '',
  supplier_country: '',
};

export type ErroresFormulario = Partial<Record<keyof ValoresFormularioLibro, string>>;

/** Mismo criterio que el backend: se ignoran guiones y espacios. */
function normalizarIsbn(isbn: string): string {
  return isbn.replace(/[\s-]/g, '').toUpperCase();
}

/**
 * Validación de cliente.
 *
 * Duplica a propósito las reglas del backend, pero sólo para responder al
 * instante: la validación que decide es la del servidor, y por eso el
 * formulario también muestra el error que éste devuelva.  Si alguna vez las
 * dos discrepan, manda el servidor.
 */
export function validarFormularioLibro(valores: ValoresFormularioLibro): ErroresFormulario {
  const errores: ErroresFormulario = {};

  if (!valores.title.trim()) errores.title = 'El título es obligatorio.';
  if (!valores.author.trim()) errores.author = 'El autor es obligatorio.';
  if (!valores.category.trim()) errores.category = 'La categoría es obligatoria.';

  const isbn = normalizarIsbn(valores.isbn);
  if (!isbn) {
    errores.isbn = 'El ISBN es obligatorio.';
  } else if (!/^\d{13}$/.test(isbn) && !/^\d{9}[\dX]$/.test(isbn)) {
    errores.isbn = 'El ISBN debe tener 10 o 13 dígitos (se admiten guiones).';
  }

  const coste = Number(valores.cost_usd);
  if (!valores.cost_usd.trim() || Number.isNaN(coste) || coste <= 0) {
    errores.cost_usd = 'El coste debe ser un número mayor que 0.';
  } else if (!/^\d+([.,]\d{1,2})?$/.test(valores.cost_usd.trim())) {
    errores.cost_usd = 'El coste admite como máximo 2 decimales.';
  }

  const stock = Number(valores.stock_quantity);
  if (!Number.isInteger(stock) || stock < 0) {
    errores.stock_quantity = 'El stock debe ser un entero mayor o igual que 0.';
  }

  if (!/^[A-Za-z]{2}$/.test(valores.supplier_country.trim())) {
    errores.supplier_country = 'Usa un código de país de 2 letras, por ejemplo ES.';
  }

  return errores;
}

export function aPayload(valores: ValoresFormularioLibro): LibroPayload {
  return {
    title: valores.title.trim(),
    author: valores.author.trim(),
    isbn: valores.isbn.trim(),
    cost_usd: Number(valores.cost_usd.replace(',', '.')),
    stock_quantity: Number(valores.stock_quantity),
    category: valores.category.trim(),
    supplier_country: valores.supplier_country.trim().toUpperCase(),
  };
}

export function aValoresFormulario(libro: Book): ValoresFormularioLibro {
  return {
    title: libro.title,
    author: libro.author,
    isbn: libro.isbn,
    cost_usd: libro.cost_usd.toFixed(2),
    stock_quantity: String(libro.stock_quantity),
    category: libro.category,
    supplier_country: libro.supplier_country,
  };
}
