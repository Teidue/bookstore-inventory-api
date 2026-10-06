import { DataSource } from 'typeorm';
import { Book } from '../../modules/books/book.entity';
import { normalizeIsbn } from '../../common/validators/isbn';
import appDataSource from '../data-source';
import { BOOKS } from './seed-data';

/**
 * Carga el catálogo de arranque.
 *
 * Es idempotente: cada libro se busca por su ISBN normalizado, que es su
 * clave natural, y sólo se inserta si falta.  Volver a ejecutar `npm run
 * seed` no duplica nada ni falla, que es lo que uno espera al reconstruir un
 * entorno local.
 */
export async function seedBooks(
  dataSource: DataSource,
): Promise<{ created: number; existing: number }> {
  const repository = dataSource.getRepository(Book);
  let created = 0;

  for (const seed of BOOKS) {
    const isbnNormalizado = normalizeIsbn(seed.isbn);
    const existing = await repository.findOne({ where: { isbnNormalizado } });
    if (existing) continue;

    await repository.save(
      repository.create({
        title: seed.title,
        author: seed.author,
        isbn: seed.isbn,
        isbnNormalizado,
        costUsd: seed.cost_usd,
        sellingPriceLocal: null,
        stockQuantity: seed.stock_quantity,
        category: seed.category,
        supplierCountry: seed.supplier_country,
      }),
    );
    created += 1;
  }

  return { created, existing: BOOKS.length - created };
}

async function main(): Promise<void> {
  console.log('Sembrando catálogo de arranque...');
  const dataSource = await appDataSource.initialize();

  try {
    const { created, existing } = await seedBooks(dataSource);
    console.log(`  libros: ${created} creados, ${existing} ya existían`);
    console.log('Seed completado.');
  } finally {
    await dataSource.destroy();
  }
}

// Sólo arranca si se ejecuta como script; importarlo desde los tests no
// dispara nada.
if (require.main === module) {
  main().catch((error: unknown) => {
    console.error('El seed ha fallado:', error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
