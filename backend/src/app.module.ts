import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FiltroExcepciones } from './common/filters/filtro-excepciones.filter';
import { validarEntorno } from './config/env.validation';
import { construirOpcionesBaseDatos } from './config/opciones-base-datos';
import { BooksModule } from './modules/books/books.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // El proceso no arranca con una configuración inválida: es preferible un
      // fallo ruidoso al iniciar que un 500 sorpresa en la primera petición
      // que toque la variable que faltaba.
      validate: validarEntorno,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        construirOpcionesBaseDatos({
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
    { provide: APP_FILTER, useClass: FiltroExcepciones },
  ],
})
export class AppModule {}
