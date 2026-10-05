import { DataSource } from 'typeorm';
import { Book } from '../../modules/books/book.entity';
import { normalizarIsbn } from '../../common/validators/isbn';
import dataSource from '../data-source';
import { LIBROS } from './datos-semilla';

/**
 * Carga el catálogo de arranque.
 *
 * Es idempotente: cada libro se busca por su ISBN normalizado, que es su
 * clave natural, y sólo se inserta si falta.  Volver a ejecutar `npm run
 * seed` no duplica nada ni falla, que es lo que uno espera al reconstruir un
 * entorno local.
 */
export async function sembrar(
  origen: DataSource,
): Promise<{ creados: number; existentes: number }> {
  const repositorio = origen.getRepository(Book);
  let creados = 0;

  for (const semilla of LIBROS) {
    const isbnNormalizado = normalizarIsbn(semilla.isbn);
    const existente = await repositorio.findOne({ where: { isbnNormalizado } });
    if (existente) continue;

    await repositorio.save(
      repositorio.create({
        title: semilla.title,
        author: semilla.author,
        isbn: semilla.isbn,
        isbnNormalizado,
        costUsd: semilla.cost_usd,
        sellingPriceLocal: null,
        stockQuantity: semilla.stock_quantity,
        category: semilla.category,
        supplierCountry: semilla.supplier_country,
      }),
    );
    creados += 1;
  }

  return { creados, existentes: LIBROS.length - creados };
}

async function principal(): Promise<void> {
  console.log('Sembrando catálogo de arranque...');
  const origen = await dataSource.initialize();

  try {
    const { creados, existentes } = await sembrar(origen);
    console.log(`  libros: ${creados} creados, ${existentes} ya existían`);
    console.log('Seed completado.');
  } finally {
    await origen.destroy();
  }
}

// Sólo arranca si se ejecuta como script; importarlo desde los tests no
// dispara nada.
if (require.main === module) {
  principal().catch((error: unknown) => {
    console.error('El seed ha fallado:', error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
