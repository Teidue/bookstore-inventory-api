import { DataSourceOptions } from 'typeorm';

export interface DatabaseCredentials {
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
/** Un esquema sólo puede ser un identificador simple: va dentro de search_path. */
const VALID_SCHEMA = /^[a-z_][a-z0-9_]{0,62}$/;

export function buildDatabaseOptions(credentials: DatabaseCredentials): DataSourceOptions {
  const { schema, ...connection } = credentials;

  if (schema && !VALID_SCHEMA.test(schema)) {
    throw new Error(`DB_SCHEMA "${schema}" no es válido: usa minúsculas, dígitos y guiones bajos.`);
  }

  return {
    type: 'postgres',
    ...connection,
    schema,
    // `schema` sólo afecta a las consultas que genera TypeORM; el SQL escrito a
    // mano en las migraciones no lleva prefijo y acabaría en el search_path de
    // la sesión, que por defecto es `public`.  Fijarlo en la conexión hace que
    // todo —migraciones incluidas— caiga en el esquema configurado.
    ...(schema ? { extra: { options: `-c search_path=${schema}` } } : {}),
    synchronize: false,
    migrationsRun: false,
    entities: [__dirname + '/../modules/**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
    migrationsTableName: 'migrations',
    logging: process.env.NODE_ENV === 'development' ? ['error', 'warn', 'migration'] : ['error'],
  };
}
