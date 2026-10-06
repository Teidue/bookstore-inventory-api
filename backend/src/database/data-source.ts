import { config as loadDotenv } from 'dotenv';
import { DataSource } from 'typeorm';
import { buildDatabaseOptions } from '../config/database-options';

// La CLI de TypeORM arranca fuera de Nest, así que carga el .env por su cuenta.
// `quiet` evita que su banner ensucie la salida de migraciones y seeds.
loadDotenv({ quiet: true });

function required(clave: string): string {
  const value = process.env[clave];
  if (!value) {
    throw new Error(`Falta la variable de entorno ${clave}. Copia .env.example a .env.`);
  }
  return value;
}

export const dataSourceOptions = buildDatabaseOptions({
  host: required('DB_HOST'),
  port: Number(process.env.DB_PORT ?? 5432),
  username: required('DB_USER'),
  password: process.env.DB_PASSWORD ?? '',
  database: required('DB_NAME'),
  schema: process.env.DB_SCHEMA || undefined,
});

/** Export por defecto que consume `typeorm -d src/database/data-source.ts`. */
const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
