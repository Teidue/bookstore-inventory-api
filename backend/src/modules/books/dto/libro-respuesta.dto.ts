import { Book } from '../book.entity';

/**
 * Forma pública de un libro, exactamente la que fija el enunciado.
 *
 * Es un tipo explícito y no un `Partial<Book>` para que el compilador impida
 * que una columna interna (como `isbn_normalizado`) se cuele en la respuesta
 * por el mero hecho de existir en la entidad.
 */
export interface LibroRespuesta {
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
export function aLibroRespuesta(libro: Book): LibroRespuesta {
  return {
    id: libro.id,
    title: libro.title,
    author: libro.author,
    isbn: libro.isbn,
    cost_usd: Number(libro.costUsd),
    selling_price_local: libro.sellingPriceLocal === null ? null : Number(libro.sellingPriceLocal),
    stock_quantity: libro.stockQuantity,
    category: libro.category,
    supplier_country: libro.supplierCountry,
    created_at: libro.createdAt.toISOString(),
    updated_at: libro.updatedAt.toISOString(),
  };
}
