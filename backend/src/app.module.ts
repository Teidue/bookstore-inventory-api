import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExceptionsFilter } from './common/filters/exceptions.filter';
import { validateEnvironment } from './config/env.validation';
import { buildDatabaseOptions } from './config/database-options';
import { BooksModule } from './modules/books/books.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // En tests la configuración viene del entorno, nunca del .env del
      // desarrollador: ConfigModule da prioridad al archivo, así que sin esto
      // un .env local podría cambiar el resultado de los tests (por ejemplo,
      // reactivando una tasa de respaldo que el test quiere desactivar).
      ignoreEnvFile: process.env.NODE_ENV === 'test',
      // El proceso no arranca con una configuración inválida: es preferible un
      // fallo ruidoso al iniciar que un 500 sorpresa en la primera petición
      // que toque la variable que faltaba.
      validate: validateEnvironment,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        buildDatabaseOptions({
          host: configService.getOrThrow<string>('DB_HOST'),
          port: configService.getOrThrow<number>('DB_PORT'),
          username: configService.getOrThrow<string>('DB_USER'),
          password: configService.getOrThrow<string>('DB_PASSWORD'),
          database: configService.getOrThrow<string>('DB_NAME'),
          schema: configService.get<string>('DB_SCHEMA'),
        }),
    }),
    BooksModule,
  ],
  providers: [
    // Salida única de errores: una sola forma de respuesta en toda la API,
    // incluidos los fallos que nadie previó.
    { provide: APP_FILTER, useClass: ExceptionsFilter },
  ],
})
export class AppModule {}
