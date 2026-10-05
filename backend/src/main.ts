import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configurarAplicacion, configurarDocumentacion } from './configurar-aplicacion';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  configurarAplicacion(app);
  configurarDocumentacion(app);

  const configService = app.get(ConfigService);
  const puerto = configService.get<number>('PORT', 3000);

  // '0.0.0.0' y no 'localhost': dentro de un contenedor, escuchar sólo en la
  // interfaz local haría la API inalcanzable desde fuera.
  await app.listen(puerto, '0.0.0.0');

  Logger.log(`API escuchando en http://localhost:${puerto}`, 'Bootstrap');
  Logger.log(`Documentación en http://localhost:${puerto}/docs`, 'Bootstrap');
}

void bootstrap();
