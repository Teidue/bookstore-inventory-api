import { Book } from '../book.entity';

/**
 * Forma pública de un libro, exactamente la que fija el enunciado.
 *
 * Es un tipo explícito y no un `Partial<Book>` para que el compilador impida
 * que una columna interna (como `isbn_normalized`) se cuele en la respuesta
 * por el mero hecho de existir en la entidad.
 */
export interface BookResponse {
  id: number;
  title: string;
  author: string;
  isbn: string;
  cost_usd: number;
  selling_price_local: number | null;
  stock_quantity: number;
  category: string;
  supplier_country: string;
  created_at: string;
  updated_at: string;
}

/**
 * Los importes se guardan como `numeric` y el driver los entrega como string
 * para no perder precisión.  El contrato del enunciado los expone como
 * número, así que la conversión ocurre aquí, en el último paso, y nunca antes
 * de hacer cuentas con ellos.
 */
export function toBookResponse(book: Book): BookResponse {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    isbn: book.isbn,
    cost_usd: Number(book.costUsd),
    selling_price_local: book.sellingPriceLocal === null ? null : Number(book.sellingPriceLocal),
    stock_quantity: book.stockQuantity,
    category: book.category,
    supplier_country: book.supplierCountry,
    created_at: book.createdAt.toISOString(),
    updated_at: book.updatedAt.toISOString(),
  };
}
