import { config as cargarDotenv } from 'dotenv';
import { DataSource } from 'typeorm';

cargarDotenv({ quiet: true });

/**
 * El nombre acaba interpolado en CREATE DATABASE, que no admite parámetros,
 * así que se valida antes de usarlo.
 */
const IDENTIFICADOR_VALIDO = /^[a-z_][a-z0-9_]{0,62}$/;

/** Base que existe siempre en PostgreSQL y desde la que se puede crear otra. */
const BASE_MANTENIMIENTO = 'postgres';

function requerido(clave: string): string {
  const valor = process.env[clave];
  if (!valor) {
    throw new Error(`Falta la variable de entorno ${clave}. Copia .env.example a .env.`);
  }
  return valor;
}

/**
 * `npm run db:crear`: deja lista la base de datos vacía antes de migrar.
 *
 * Existe para que todo el ciclo —crear, migrar y sembrar— se haga con
 * comandos npm, sin ningún .sql que haya que ejecutar a mano.  Es idempotente:
 * si la base ya existe, no la toca.
 */
async function principal(): Promise<void> {
  const nombre = requerido('DB_NAME');

  if (!IDENTIFICADOR_VALIDO.test(nombre)) {
    throw new Error(`DB_NAME "${nombre}" no es válido: usa minúsculas, dígitos y guiones bajos.`);
  }

  const mantenimiento = new DataSource({
    type: 'postgres',
    host: requerido('DB_HOST'),
    port: Number(process.env.DB_PORT ?? 5432),
    username: requerido('DB_USER'),
    password: process.env.DB_PASSWORD ?? '',
    database: BASE_MANTENIMIENTO,
  });

  await mantenimiento.initialize();

  try {
    // `query()` devuelve `any`: se trata como `unknown` y se comprueba su forma.
    const resultado: unknown = await mantenimiento.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [nombre],
    );

    if (Array.isArray(resultado) && resultado.length > 0) {
      console.log(`La base de datos "${nombre}" ya existe; no se modifica.`);
    } else {
      await mantenimiento.query(`CREATE DATABASE "${nombre}" ENCODING 'UTF8'`);
      console.log(`Base de datos "${nombre}" creada.`);
    }
  } finally {
    await mantenimiento.destroy();
  }
}

principal().catch((error: unknown) => {
  const motivo = error instanceof Error ? error.message : String(error);
  console.error(`No se pudo preparar la base de datos: ${motivo}`);

  if (/permission denied to create database/i.test(motivo)) {
    console.error(
      'DB_USER no tiene permiso para crear bases de datos. Usa un usuario que lo tenga ' +
        '(por ejemplo postgres) o crea la base con: createdb -U postgres bookstore_inventory',
    );
  }

  process.exit(1);
});
