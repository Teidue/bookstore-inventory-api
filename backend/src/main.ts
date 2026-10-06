import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupApplication, setupSwagger } from './application-setup';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  setupApplication(app);
  setupSwagger(app);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  // '0.0.0.0' y no 'localhost': dentro de un contenedor, escuchar sólo en la
  // interfaz local haría la API inalcanzable desde fuera.
  await app.listen(port, '0.0.0.0');

  Logger.log(`API escuchando en http://localhost:${port}`, 'Bootstrap');
  Logger.log(`Documentación en http://localhost:${port}/docs`, 'Bootstrap');
}

void bootstrap();
