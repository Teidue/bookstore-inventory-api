/**
 * Catálogo de arranque.
 *
 * Sin datos no se pueden evaluar ni la paginación ni los filtros, así que el
 * reparto no es decorativo: 14 libros, 5 categorías, 6 países de proveedor y
 * varios por debajo del umbral de stock bajo (10), incluido uno agotado.
 * El primero es el ejemplo literal del enunciado.
 */
export interface BookSeed {
  title: string;
  author: string;
  isbn: string;
  cost_usd: string;
  stock_quantity: number;
  category: string;
  supplier_country: string;
}

export const BOOKS: readonly BookSeed[] = [
  {
    title: 'El Quijote',
    author: 'Miguel de Cervantes',
    isbn: '978-84-376-0494-7',
    cost_usd: '15.99',
    stock_quantity: 25,
    category: 'Literatura Clásica',
    supplier_country: 'ES',
  },
  {
    title: 'Cien años de soledad',
    author: 'Gabriel García Márquez',
    isbn: '978-0-307-47472-8',
    cost_usd: '18.50',
    stock_quantity: 12,
    category: 'Literatura Clásica',
    supplier_country: 'CO',
  },
  {
    title: 'La sombra del viento',
    author: 'Carlos Ruiz Zafón',
    isbn: '978-84-08-04364-5',
    cost_usd: '21.00',
    stock_quantity: 7,
    category: 'Novela',
    supplier_country: 'ES',
  },
  {
    title: 'Rayuela',
    author: 'Julio Cortázar',
    isbn: '978-84-376-0495-4',
    cost_usd: '17.25',
    stock_quantity: 3,
    category: 'Literatura Clásica',
    supplier_country: 'AR',
  },
  {
    title: 'Pedro Páramo',
    author: 'Juan Rulfo',
    isbn: '978-607-16-1234-2',
    cost_usd: '12.80',
    stock_quantity: 40,
    category: 'Literatura Clásica',
    supplier_country: 'MX',
  },
  {
    title: 'Clean Code',
    author: 'Robert C. Martin',
    isbn: '978-0-13-235088-4',
    cost_usd: '44.99',
    stock_quantity: 9,
    category: 'Técnico',
    supplier_country: 'US',
  },
  {
    title: 'The Pragmatic Programmer',
    author: 'Andrew Hunt',
    isbn: '978-0-13-595705-9',
    cost_usd: '49.95',
    stock_quantity: 5,
    category: 'Técnico',
    supplier_country: 'US',
  },
  {
    title: 'Designing Data-Intensive Applications',
    author: 'Martin Kleppmann',
    isbn: '978-1-4493-7332-0',
    cost_usd: '59.99',
    stock_quantity: 0,
    category: 'Técnico',
    supplier_country: 'US',
  },
  {
    title: 'Sapiens: De animales a dioses',
    author: 'Yuval Noah Harari',
    isbn: '978-84-9992-622-3',
    cost_usd: '23.40',
    stock_quantity: 31,
    category: 'Ensayo',
    supplier_country: 'ES',
  },
  {
    title: 'El infinito en un junco',
    author: 'Irene Vallejo',
    isbn: '978-84-17860-79-0',
    cost_usd: '26.10',
    stock_quantity: 18,
    category: 'Ensayo',
    supplier_country: 'ES',
  },
  {
    title: 'El principito',
    author: 'Antoine de Saint-Exupéry',
    isbn: '978-0-15-601219-5',
    cost_usd: '9.99',
    stock_quantity: 60,
    category: 'Infantil',
    supplier_country: 'FR',
  },
  {
    title: 'Donde viven los monstruos',
    author: 'Maurice Sendak',
    isbn: '978-84-261-2654-2',
    cost_usd: '14.50',
    stock_quantity: 8,
    category: 'Infantil',
    supplier_country: 'ES',
  },
  {
    title: 'Crónica de una muerte anunciada',
    author: 'Gabriel García Márquez',
    isbn: '8439700016',
    cost_usd: '11.75',
    stock_quantity: 22,
    category: 'Novela',
    supplier_country: 'CO',
  },
  {
    title: 'Los detectives salvajes',
    author: 'Roberto Bolaño',
    isbn: '978-84-339-6868-5',
    cost_usd: '19.90',
    stock_quantity: 6,
    category: 'Novela',
    supplier_country: 'CL',
  },
];
