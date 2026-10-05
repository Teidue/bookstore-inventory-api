import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { config as cargarDotenv } from 'dotenv';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { construirOpcionesBaseDatos } from '../../src/config/opciones-base-datos';
import { configurarAplicacion } from '../../src/configurar-aplicacion';

cargarDotenv({ quiet: true });

export interface AplicacionPrueba {
  app: INestApplication;
  origen: DataSource;
  esquema: string;
  cerrar: () => Promise<void>;
}

export interface OpcionesPrueba {
  /** Tasa de respaldo; `null` arranca la app sin ninguna, para probar el 503. */
  tasaRespaldo?: number | null;
}

function credenciales(esquema?: string) {
  return {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'bookstore_inventory',
    schema: esquema,
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
export async function crearAplicacionPrueba(
  opciones: OpcionesPrueba = {},
): Promise<AplicacionPrueba> {
  const esquema = `e2e_${Date.now()}_${Math.floor(Math.random() * 10_000)}`;

  const administracion = new DataSource({ type: 'postgres', ...credenciales() });
  await administracion.initialize();
  await administracion.query(`CREATE SCHEMA "${esquema}"`);
  await administracion.destroy();

  // La configuración de la app se fija por entorno antes de construirla:
  // ConfigModule lee process.env, y dotenv no pisa lo que ya está definido.
  process.env.NODE_ENV = 'test';
  process.env.DB_SCHEMA = esquema;
  process.env.LOCAL_CURRENCY = 'EUR';
  process.env.PROFIT_MARGIN_PERCENTAGE = '40';
  process.env.EXCHANGE_CACHE_TTL_SECONDS = '600';
  process.env.EXCHANGE_FALLBACK_RATE =
    opciones.tasaRespaldo === null ? '' : String(opciones.tasaRespaldo ?? 0.92);

  const origen = new DataSource(construirOpcionesBaseDatos(credenciales(esquema)));
  await origen.initialize();
  await origen.runMigrations();

  const moduloPrueba = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduloPrueba.createNestApplication();
  configurarAplicacion(app);
  await app.init();

  return {
    app,
    origen,
    esquema,
    cerrar: async () => {
      await app.close();
      await origen.query(`DROP SCHEMA "${esquema}" CASCADE`);
      await origen.destroy();
    },
  };
}

/** Cuerpo válido de ejemplo, para no repetirlo en cada test. */
export function libroValido(sobrescribir: Record<string, unknown> = {}) {
  return {
    title: 'El Quijote',
    author: 'Miguel de Cervantes',
    isbn: '978-84-376-0494-7',
    cost_usd: 15.99,
    stock_quantity: 25,
    category: 'Literatura Clásica',
    supplier_country: 'ES',
    ...sobrescribir,
  };
}

/** ISBN-13 sintético y único, para los tests que crean varios libros. */
export function isbnUnico(indice: number): string {
  return `978${String(indice).padStart(10, '0')}`;
}
