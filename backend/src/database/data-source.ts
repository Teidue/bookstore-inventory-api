import { config as cargarDotenv } from 'dotenv';
import { DataSource } from 'typeorm';
import { construirOpcionesBaseDatos } from '../config/opciones-base-datos';

// La CLI de TypeORM arranca fuera de Nest, así que carga el .env por su cuenta.
// `quiet` evita que su banner ensucie la salida de migraciones y seeds.
cargarDotenv({ quiet: true });

function requerido(clave: string): string {
  const valor = process.env[clave];
  if (!valor) {
    throw new Error(`Falta la variable de entorno ${clave}. Copia .env.example a .env.`);
  }
  return valor;
}

export const opcionesDataSource = construirOpcionesBaseDatos({
  host: requerido('DB_HOST'),
  port: Number(process.env.DB_PORT ?? 5432),
  username: requerido('DB_USER'),
  password: process.env.DB_PASSWORD ?? '',
  database: requerido('DB_NAME'),
  schema: process.env.DB_SCHEMA || undefined,
});

/** Export por defecto que consume `typeorm -d src/database/data-source.ts`. */
const dataSource = new DataSource(opcionesDataSource);
export default dataSource;
