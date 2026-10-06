import { config as loadDotenv } from 'dotenv';
import { DataSource } from 'typeorm';

loadDotenv({ quiet: true });

/**
 * El nombre acaba interpolado en CREATE DATABASE, que no admite parámetros,
 * así que se valida antes de usarlo.
 */
const VALID_IDENTIFIER = /^[a-z_][a-z0-9_]{0,62}$/;

/** Base que existe siempre en PostgreSQL y desde la que se puede crear otra. */
const MAINTENANCE_DATABASE = 'postgres';

function required(clave: string): string {
  const value = process.env[clave];
  if (!value) {
    throw new Error(`Falta la variable de entorno ${clave}. Copia .env.example a .env.`);
  }
  return value;
}

/**
 * `npm run db:create`: deja lista la base de datos vacía antes de migrar.
 *
 * Existe para que todo el ciclo —crear, migrar y sembrar— se haga con
 * comandos npm, sin ningún .sql que haya que ejecutar a mano.  Es idempotente:
 * si la base ya existe, no la toca.
 */
async function main(): Promise<void> {
  const name = required('DB_NAME');

  if (!VALID_IDENTIFIER.test(name)) {
    throw new Error(`DB_NAME "${name}" no es válido: usa minúsculas, dígitos y guiones bajos.`);
  }

  const maintenance = new DataSource({
    type: 'postgres',
    host: required('DB_HOST'),
    port: Number(process.env.DB_PORT ?? 5432),
    username: required('DB_USER'),
    password: process.env.DB_PASSWORD ?? '',
    database: MAINTENANCE_DATABASE,
  });

  await maintenance.initialize();

  try {
    // `query()` devuelve `any`: se trata como `unknown` y se comprueba su forma.
    const result: unknown = await maintenance.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [name],
    );

    if (Array.isArray(result) && result.length > 0) {
      console.log(`La base de datos "${name}" ya existe; no se modifica.`);
    } else {
      await maintenance.query(`CREATE DATABASE "${name}" ENCODING 'UTF8'`);
      console.log(`Base de datos "${name}" creada.`);
    }
  } finally {
    await maintenance.destroy();
  }
}

main().catch((error: unknown) => {
  const reason = error instanceof Error ? error.message : String(error);
  console.error(`No se pudo preparar la base de datos: ${reason}`);

  if (/permission denied to create database/i.test(reason)) {
    console.error(
      'DB_USER no tiene permiso para crear bases de datos. Usa un usuario que lo tenga ' +
        '(por ejemplo postgres) o crea la base con: createdb -U postgres bookstore_inventory',
    );
  }

  process.exit(1);
});
