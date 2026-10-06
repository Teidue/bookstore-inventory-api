import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { config as loadDotenv } from 'dotenv';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { buildDatabaseOptions } from '../../src/config/database-options';
import { setupApplication } from '../../src/application-setup';

loadDotenv({ quiet: true });

export interface TestApplication {
  app: INestApplication;
  dataSource: DataSource;
  schema: string;
  close: () => Promise<void>;
}

export interface TestOptions {
  /** Tasa de respaldo; `null` arranca la app sin ninguna, para probar el 503. */
  fallbackRate?: number | null;
}

function credentials(schema?: string) {
  return {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'bookstore_inventory',
    schema: schema,
  };
}

/**
 * Levanta la aplicación completa contra PostgreSQL real, aislada en su propio
 * esquema efímero.
 *
 * Se prueba contra la base de verdad y no contra un mock porque lo que hay que
 * verificar —el COUNT de la paginación, los filtros, el índice único del ISBN
 * y los CHECK— es justamente lo que un repositorio simulado no ejecuta.  El
 * esquema se crea al empezar y se destruye al terminar, así que los tests
 * nunca tocan los datos de desarrollo.
 */
export async function createTestApplication(options: TestOptions = {}): Promise<TestApplication> {
  const schema = `e2e_${Date.now()}_${Math.floor(Math.random() * 10_000)}`;

  const admin = new DataSource({ type: 'postgres', ...credentials() });
  await admin.initialize();
  await admin.query(`CREATE SCHEMA "${schema}"`);
  await admin.destroy();

  // La configuración de la app se fija por entorno antes de construirla:
  // ConfigModule lee process.env, y dotenv no pisa lo que ya está definido.
  process.env.NODE_ENV = 'test';
  process.env.DB_SCHEMA = schema;
  process.env.LOCAL_CURRENCY = 'EUR';
  process.env.PROFIT_MARGIN_PERCENTAGE = '40';
  process.env.EXCHANGE_CACHE_TTL_SECONDS = '600';
  process.env.EXCHANGE_FALLBACK_RATE =
    options.fallbackRate === null ? '' : String(options.fallbackRate ?? 0.92);

  const dataSource = new DataSource(buildDatabaseOptions(credentials(schema)));
  await dataSource.initialize();
  await dataSource.runMigrations();

  const testingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = testingModule.createNestApplication();
  setupApplication(app);
  await app.init();

  return {
    app,
    dataSource,
    schema,
    close: async () => {
      await app.close();
      await dataSource.query(`DROP SCHEMA "${schema}" CASCADE`);
      await dataSource.destroy();
    },
  };
}

/** Cuerpo válido de ejemplo, para no repetirlo en cada test. */
export function validBook(overrides: Record<string, unknown> = {}) {
  return {
    title: 'El Quijote',
    author: 'Miguel de Cervantes',
    isbn: '978-84-376-0494-7',
    cost_usd: 15.99,
    stock_quantity: 25,
    category: 'Literatura Clásica',
    supplier_country: 'ES',
    ...overrides,
  };
}

/** ISBN-13 sintético y único, para los tests que crean varios libros. */
export function uniqueIsbn(index: number): string {
  return `978${String(index).padStart(10, '0')}`;
}
