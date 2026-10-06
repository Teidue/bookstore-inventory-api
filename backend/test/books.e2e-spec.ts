import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  TestApplication,
  createTestApplication,
  uniqueIsbn,
  validBook,
} from './utils/test-application';

describe('CRUD de libros (e2e)', () => {
  let context: TestApplication;
  let app: INestApplication;

  const api = () => request(app.getHttpServer());

  beforeAll(async () => {
    context = await createTestApplication();
    app = context.app;
  });

  afterAll(async () => {
    await context.close();
  });

  describe('POST /books', () => {
    it('crea un libro con la forma exacta del contrato', async () => {
      const response = await api().post('/books').send(validBook()).expect(201);

      expect(response.body).toMatchObject({
        title: 'El Quijote',
        author: 'Miguel de Cervantes',
        isbn: '978-84-376-0494-7',
        cost_usd: 15.99,
        selling_price_local: null,
        stock_quantity: 25,
        category: 'Literatura Clásica',
        supplier_country: 'ES',
      });
      expect(typeof response.body.id).toBe('number');
      expect(new Date(response.body.created_at).toString()).not.toBe('Invalid Date');
      // La columna interna de unicidad no forma parte del contrato público.
      expect(response.body).not.toHaveProperty('isbn_normalized');
    });

    it('nace sin precio de venta aunque lo intenten enviar en el body', async () => {
      const response = await api()
        .post('/books')
        .send(validBook({ isbn: uniqueIsbn(1), selling_price_local: 999.99 }))
        .expect(201);

      expect(response.body.selling_price_local).toBeNull();
    });

    it('rechaza un ISBN ya existente aunque cambien los guiones -> 409', async () => {
      await api()
        .post('/books')
        .send(validBook({ isbn: '978-0-307-47472-8' }))
        .expect(201);

      const response = await api()
        .post('/books')
        .send(validBook({ isbn: '9780307474728' }))
        .expect(409);

      expect(response.body.code).toBe('DUPLICATE_ISBN');
    });

    const invalidCases: [Record<string, unknown>, string][] = [
      [{ cost_usd: 0 }, 'cost_usd igual a 0'],
      [{ cost_usd: -5 }, 'cost_usd negativo'],
      [{ cost_usd: 10.555 }, 'cost_usd con 3 decimales'],
      [{ stock_quantity: -1 }, 'stock negativo'],
      [{ stock_quantity: 1.5 }, 'stock decimal'],
      [{ isbn: '12345' }, 'isbn de 5 dígitos'],
      [{ isbn: '12345678901' }, 'isbn de 11 dígitos'],
      [{ title: '' }, 'título vacío'],
      [{ supplier_country: 'ESP' }, 'país de 3 letras'],
    ];

    it.each(invalidCases)('rechaza datos inválidos (%s): %s -> 400', async (overrides) => {
      const response = await api()
        .post('/books')
        .send(validBook({ isbn: uniqueIsbn(99), ...overrides }))
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(response.body).toHaveProperty('path', '/books');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('normaliza el país del proveedor a mayúsculas', async () => {
      const response = await api()
        .post('/books')
        .send(validBook({ isbn: uniqueIsbn(2), supplier_country: 'mx' }))
        .expect(201);

      expect(response.body.supplier_country).toBe('MX');
    });
  });

  describe('GET /books', () => {
    beforeAll(async () => {
      // Catálogo suficiente para que la paginación y los filtros tengan algo
      // que repartir.
      for (let index = 0; index < 12; index += 1) {
        await api()
          .post('/books')
          .send(
            validBook({
              title: `Libro de prueba ${index}`,
              author: index % 2 === 0 ? 'Autora Par' : 'Autor Impar',
              isbn: uniqueIsbn(100 + index),
              category: index % 3 === 0 ? 'Técnico' : 'Novela',
              stock_quantity: index,
            }),
          )
          .expect(201);
      }
    });

    it('pagina con metadatos calculados en la base de datos', async () => {
      const firstPage = await api().get('/books?page=1&limit=5').expect(200);

      expect(firstPage.body.data).toHaveLength(5);
      expect(firstPage.body.meta.page).toBe(1);
      expect(firstPage.body.meta.limit).toBe(5);
      expect(firstPage.body.meta.total).toBeGreaterThanOrEqual(12);
      expect(firstPage.body.meta.total_pages).toBe(Math.ceil(firstPage.body.meta.total / 5));

      const secondPage = await api().get('/books?page=2&limit=5').expect(200);
      const ids1 = (firstPage.body.data as { id: number }[]).map((l) => l.id);
      const ids2 = (secondPage.body.data as { id: number }[]).map((l) => l.id);

      expect(ids1.some((id) => ids2.includes(id))).toBe(false);
    });

    it('rechaza una paginación abusiva -> 400', async () => {
      await api().get('/books?limit=5000').expect(400);
      await api().get('/books?page=0').expect(400);
    });

    it('filtra por categoría sin distinguir mayúsculas', async () => {
      const response = await api().get('/books?category=técnico&limit=100').expect(200);

      const categories = (response.body.data as { category: string }[]).map((l) => l.category);
      expect(categories.length).toBeGreaterThan(0);
      expect(categories.every((c) => c === 'Técnico')).toBe(true);
    });

    it('busca por título o autor', async () => {
      const response = await api().get('/books?search=Autora Par&limit=100').expect(200);

      const authors = (response.body.data as { author: string }[]).map((l) => l.author);
      expect(authors.length).toBeGreaterThan(0);
      expect(authors.every((a) => a === 'Autora Par')).toBe(true);
    });
  });

  describe('GET /books/search y /books/low-stock', () => {
    it('search?category= devuelve sólo esa categoría', async () => {
      const response = await api().get('/books/search?category=Novela&limit=100').expect(200);

      const categories = (response.body.data as { category: string }[]).map((l) => l.category);
      expect(categories.length).toBeGreaterThan(0);
      expect(categories.every((c) => c === 'Novela')).toBe(true);
    });

    it('low-stock usa 10 como umbral por defecto', async () => {
      const response = await api().get('/books/low-stock?limit=100').expect(200);

      const stocks = (response.body.data as { stock_quantity: number }[]).map(
        (l) => l.stock_quantity,
      );
      expect(stocks.length).toBeGreaterThan(0);
      expect(stocks.every((s) => s <= 10)).toBe(true);
    });

    it('low-stock admite un umbral propio', async () => {
      const response = await api().get('/books/low-stock?threshold=3&limit=100').expect(200);
      const stocks = (response.body.data as { stock_quantity: number }[]).map(
        (l) => l.stock_quantity,
      );

      expect(stocks.every((s) => s <= 3)).toBe(true);
      expect(response.body.meta.total).toBeLessThan(
        (await api().get('/books/low-stock?limit=100').expect(200)).body.meta.total,
      );
    });
  });

  describe('GET /books/:id', () => {
    it('devuelve el libro pedido', async () => {
      const created = await api()
        .post('/books')
        .send(validBook({ isbn: uniqueIsbn(300) }))
        .expect(201);

      const response = await api().get(`/books/${created.body.id}`).expect(200);
      expect(response.body.id).toBe(created.body.id);
    });

    it('responde 404 con código identificable si no existe', async () => {
      const response = await api().get('/books/999999').expect(404);
      expect(response.body.code).toBe('BOOK_NOT_FOUND');
    });

    it('responde 400 si el identificador no es un número', async () => {
      await api().get('/books/no-es-un-id').expect(400);
    });
  });

  describe('PUT /books/:id', () => {
    it('sustituye los datos del libro', async () => {
      const created = await api()
        .post('/books')
        .send(validBook({ isbn: uniqueIsbn(400) }))
        .expect(201);

      const response = await api()
        .put(`/books/${created.body.id}`)
        .send(
          validBook({
            isbn: uniqueIsbn(400),
            title: 'Título corregido',
            stock_quantity: 99,
            cost_usd: 30.5,
          }),
        )
        .expect(200);

      expect(response.body).toMatchObject({
        id: created.body.id,
        title: 'Título corregido',
        stock_quantity: 99,
        cost_usd: 30.5,
      });
    });

    it('responde 404 si el libro no existe', async () => {
      await api()
        .put('/books/999999')
        .send(validBook({ isbn: uniqueIsbn(401) }))
        .expect(404);
    });

    it('rechaza dejar dos libros con el mismo ISBN -> 409', async () => {
      const first = await api()
        .post('/books')
        .send(validBook({ isbn: uniqueIsbn(500) }))
        .expect(201);
      await api()
        .post('/books')
        .send(validBook({ isbn: uniqueIsbn(501) }))
        .expect(201);

      const response = await api()
        .put(`/books/${first.body.id}`)
        .send(validBook({ isbn: uniqueIsbn(501) }))
        .expect(409);

      expect(response.body.code).toBe('DUPLICATE_ISBN');
    });
  });

  describe('DELETE /books/:id', () => {
    it('elimina el libro y deja de encontrarse', async () => {
      const created = await api()
        .post('/books')
        .send(validBook({ isbn: uniqueIsbn(600) }))
        .expect(201);

      await api().delete(`/books/${created.body.id}`).expect(204);
      await api().get(`/books/${created.body.id}`).expect(404);
      await api().delete(`/books/${created.body.id}`).expect(404);
    });
  });
});
