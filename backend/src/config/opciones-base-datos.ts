import { DataSourceOptions } from 'typeorm';

export interface CredencialesBaseDatos {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  schema?: string;
}

/**
 * Única definición de cómo se conecta la aplicación a PostgreSQL.
 *
 * La comparten el arranque de Nest y la CLI de TypeORM (migraciones y seeds),
 * de modo que es imposible que la aplicación y las migraciones acaben
 * apuntando a bases distintas.
 *
 * `synchronize` no se activa en ningún entorno: el esquema cambia sólo por
 * migración, revisable en el diff y reversible.
 */
export function construirOpcionesBaseDatos(credenciales: CredencialesBaseDatos): DataSourceOptions {
  const { schema, ...conexion } = credenciales;

  return {
    type: 'postgres',
    ...conexion,
    schema,
    synchronize: false,
    migrationsRun: false,
    entities: [__dirname + '/../modules/**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
    migrationsTableName: 'migraciones',
    logging: process.env.NODE_ENV === 'development' ? ['error', 'warn', 'migration'] : ['error'],
  };
}
