import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

/**
 * Configuración común de la aplicación.
 *
 * La comparten `main.ts` y los tests de integración: así los tests ejercitan
 * exactamente la misma validación y el mismo manejo de errores que producción,
 * en vez de una copia que se desincroniza con el tiempo.
 */
export function setupApplication(app: INestApplication): void {
  const configService = app.get(ConfigService);

  app.use(helmet());

  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', 'http://localhost:5173').split(','),
  });

  app.useGlobalPipes(
    new ValidationPipe({
      // whitelist: descarta todo campo que no declare el DTO. Es lo que impide
      // que un `selling_price_local` inyectado en el body llegue al servicio.
      whitelist: true,
      // No se activa `forbidNonWhitelisted`: sobrar un campo no debería tumbar
      // la petición, basta con ignorarlo.
      forbidNonWhitelisted: false,
      // Instancia los DTO de verdad, para que @Type y los valores por defecto
      // se apliquen: sin esto, `page` llegaría como el string "2".
      transform: true,
    }),
  );

  // Cierra el pool de conexiones al recibir SIGTERM en lugar de perder las
  // peticiones en vuelo (importante dentro de un contenedor).
  app.enableShutdownHooks();
}

export function setupSwagger(app: INestApplication): void {
  const configuration = new DocumentBuilder()
    .setTitle('Bookstore Inventory API')
    .setDescription(
      'Gestión de inventario de librerías con cálculo de precio de venta a partir de la ' +
        'tasa de cambio actual.',
    )
    .setVersion('1.0')
    .build();

  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, configuration), {
    swaggerOptions: { persistAuthorization: true },
  });
}
