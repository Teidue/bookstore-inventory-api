import { INestApplication } from '@nestjs/common';
import nock from 'nock';
import request from 'supertest';
import {
  TestApplication,
  createTestApplication,
  uniqueIsbn,
  validBook,
} from './utils/test-application';

const HOST_TASAS = 'https://api.exchangerate-api.com';
const RUTA_TASAS = '/v4/latest/USD';

describe('POST /books/:id/calculate-price (e2e)', () => {
  beforeAll(() => {
    // Ninguna petición de red real sale de los tests: si algo intentara salir
    // sin estar simulado, fallaría en vez de depender de un tercero.
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
  });

  afterAll(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  describe('con la API de tasas disponible', () => {
    let contexto: TestApplication;
    let app: INestApplication;
    const api = () => request(app.getHttpServer());

    beforeAll(async () => {
      contexto = await createTestApplication({ fallbackRate: 0.92 });
      app = contexto.app;
    });

    afterAll(async () => {
      await contexto.close();
    });

    it('reproduce el cálculo del enunciado y lo persiste', async () => {
      nock(HOST_TASAS)
        .get(RUTA_TASAS)
        .reply(200, { rates: { EUR: 0.85 } });

      const book = await api()
        .post('/books')
        .send(validBook({ isbn: uniqueIsbn(700), cost_usd: 15.99 }))
        .expect(201);

      const response = await api().post(`/books/${book.body.id}/calculate-price`).expect(200);

      expect(response.body).toMatchObject({
        book_id: book.body.id,
        cost_usd: 15.99,
        exchange_rate: 0.85,
        cost_local: 13.59,
        margin_percentage: 40,
        selling_price_local: 19.03,
        currency: 'EUR',
        rate_source: 'exchange_api',
      });
      expect(new Date(response.body.calculation_timestamp).toString()).not.toBe('Invalid Date');

      // El precio queda guardado: el enunciado pide actualizar el libro.
      const recargado = await api().get(`/books/${book.body.id}`).expect(200);
      expect(recargado.body.selling_price_local).toBe(19.03);
    });

    it('reutiliza la tasa cacheada en el siguiente cálculo', async () => {
      // No se registra ninguna simulación nueva: si el servicio volviera a
      // salir a la red, la petición fallaría y el origen no sería la caché.
      const book = await api()
        .post('/books')
        .send(validBook({ isbn: uniqueIsbn(701), cost_usd: 10 }))
        .expect(201);

      const response = await api().post(`/books/${book.body.id}/calculate-price`).expect(200);

      expect(response.body.rate_source).toBe('cache');
      expect(response.body.selling_price_local).toBe(11.9);
    });

    it('responde 404 si el libro no existe', async () => {
      const response = await api().post('/books/999999/calculate-price').expect(404);
      expect(response.body.code).toBe('BOOK_NOT_FOUND');
    });
  });

  describe('cuando la API de tasas falla', () => {
    let contexto: TestApplication;
    let app: INestApplication;
    const api = () => request(app.getHttpServer());

    beforeAll(async () => {
      contexto = await createTestApplication({ fallbackRate: 0.92 });
      app = contexto.app;
    });

    afterAll(async () => {
      await contexto.close();
    });

    it('calcula con la tasa de respaldo y lo declara en la respuesta', async () => {
      nock(HOST_TASAS).get(RUTA_TASAS).reply(500, 'boom');

      const book = await api()
        .post('/books')
        .send(validBook({ isbn: uniqueIsbn(800), cost_usd: 10 }))
        .expect(201);

      const response = await api().post(`/books/${book.body.id}/calculate-price`).expect(200);

      expect(response.body).toMatchObject({
        exchange_rate: 0.92,
        cost_local: 9.2,
        selling_price_local: 12.88,
        rate_source: 'fallback',
      });
    });

    it('también usa el respaldo si la conexión se corta', async () => {
      nock(HOST_TASAS).get(RUTA_TASAS).replyWithError({ code: 'ECONNREFUSED' });

      const book = await api()
        .post('/books')
        .send(validBook({ isbn: uniqueIsbn(801), cost_usd: 20 }))
        .expect(201);

      const response = await api().post(`/books/${book.body.id}/calculate-price`).expect(200);

      expect(response.body.rate_source).toBe('fallback');
    });
  });

  describe('cuando la API falla y no hay tasa de respaldo', () => {
    let contexto: TestApplication;
    let app: INestApplication;
    const api = () => request(app.getHttpServer());

    beforeAll(async () => {
      contexto = await createTestApplication({ fallbackRate: null });
      app = contexto.app;
    });

    afterAll(async () => {
      await contexto.close();
    });

    it('responde 503 en vez de inventar un precio', async () => {
      nock(HOST_TASAS).get(RUTA_TASAS).reply(503, 'service unavailable');

      const book = await api()
        .post('/books')
        .send(validBook({ isbn: uniqueIsbn(900) }))
        .expect(201);

      const response = await api().post(`/books/${book.body.id}/calculate-price`).expect(503);

      expect(response.body.code).toBe('EXCHANGE_RATE_UNAVAILABLE');

      // Y el libro sigue sin precio de venta: no se guarda nada a medias.
      const recargado = await api().get(`/books/${book.body.id}`).expect(200);
      expect(recargado.body.selling_price_local).toBeNull();
    });
  });
});
