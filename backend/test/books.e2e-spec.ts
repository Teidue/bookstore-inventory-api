import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  AplicacionPrueba,
  crearAplicacionPrueba,
  isbnUnico,
  libroValido,
} from './utilidades/aplicacion-prueba';

describe('CRUD de libros (e2e)', () => {
  let contexto: AplicacionPrueba;
  let app: INestApplication;

  const api = () => request(app.getHttpServer());

  beforeAll(async () => {
    contexto = await crearAplicacionPrueba();
    app = contexto.app;
  });

  afterAll(async () => {
    await contexto.cerrar();
  });

  describe('POST /books', () => {
    it('crea un libro con la forma exacta del contrato', async () => {
      const respuesta = await api().post('/books').send(libroValido()).expect(201);

      expect(respuesta.body).toMatchObject({
        title: 'El Quijote',
        author: 'Miguel de Cervantes',
        isbn: '978-84-376-0494-7',
        cost_usd: 15.99,
        selling_price_local: null,
        stock_quantity: 25,
        category: 'Literatura Clásica',
        supplier_country: 'ES',
      });
      expect(typeof respuesta.body.id).toBe('number');
      expect(new Date(respuesta.body.created_at).toString()).not.toBe('Invalid Date');
      // La columna interna de unicidad no forma parte del contrato público.
      expect(respuesta.body).not.toHaveProperty('isbn_normalizado');
    });

    it('nace sin precio de venta aunque lo intenten enviar en el body', async () => {
      const respuesta = await api()
        .post('/books')
        .send(libroValido({ isbn: isbnUnico(1), selling_price_local: 999.99 }))
        .expect(201);

      expect(respuesta.body.selling_price_local).toBeNull();
    });

    it('rechaza un ISBN ya existente aunque cambien los guiones -> 409', async () => {
      await api()
        .post('/books')
        .send(libroValido({ isbn: '978-0-307-47472-8' }))
        .expect(201);

      const respuesta = await api()
        .post('/books')
        .send(libroValido({ isbn: '9780307474728' }))
        .expect(409);

      expect(respuesta.body.code).toBe('ISBN_DUPLICADO');
    });

    const casosInvalidos: [Record<string, unknown>, string][] = [
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

    it.each(casosInvalidos)('rechaza datos inválidos (%s): %s -> 400', async (sobrescribir) => {
      const respuesta = await api()
        .post('/books')
        .send(libroValido({ isbn: isbnUnico(99), ...sobrescribir }))
        .expect(400);

      expect(respuesta.body.code).toBe('VALIDACION');
      expect(respuesta.body).toHaveProperty('path', '/books');
      expect(respuesta.body).toHaveProperty('timestamp');
    });

    it('normaliza el país del proveedor a mayúsculas', async () => {
      const respuesta = await api()
        .post('/books')
        .send(libroValido({ isbn: isbnUnico(2), supplier_country: 'mx' }))
        .expect(201);

      expect(respuesta.body.supplier_country).toBe('MX');
    });
  });

  describe('GET /books', () => {
    beforeAll(async () => {
      // Catálogo suficiente para que la paginación y los filtros tengan algo
      // que repartir.
      for (let indice = 0; indice < 12; indice += 1) {
        await api()
          .post('/books')
          .send(
            libroValido({
              title: `Libro de prueba ${indice}`,
              author: indice % 2 === 0 ? 'Autora Par' : 'Autor Impar',
              isbn: isbnUnico(100 + indice),
              category: indice % 3 === 0 ? 'Técnico' : 'Novela',
              stock_quantity: indice,
            }),
          )
          .expect(201);
      }
    });

    it('pagina con metadatos calculados en la base de datos', async () => {
      const pagina1 = await api().get('/books?page=1&limit=5').expect(200);

      expect(pagina1.body.data).toHaveLength(5);
      expect(pagina1.body.meta.page).toBe(1);
      expect(pagina1.body.meta.limit).toBe(5);
      expect(pagina1.body.meta.total).toBeGreaterThanOrEqual(12);
      expect(pagina1.body.meta.total_pages).toBe(Math.ceil(pagina1.body.meta.total / 5));

      const pagina2 = await api().get('/books?page=2&limit=5').expect(200);
      const ids1 = (pagina1.body.data as { id: number }[]).map((l) => l.id);
      const ids2 = (pagina2.body.data as { id: number }[]).map((l) => l.id);

      expect(ids1.some((id) => ids2.includes(id))).toBe(false);
    });

    it('rechaza una paginación abusiva -> 400', async () => {
      await api().get('/books?limit=5000').expect(400);
      await api().get('/books?page=0').expect(400);
    });

    it('filtra por categoría sin distinguir mayúsculas', async () => {
      const respuesta = await api().get('/books?category=técnico&limit=100').expect(200);

      const categorias = (respuesta.body.data as { category: string }[]).map((l) => l.category);
      expect(categorias.length).toBeGreaterThan(0);
      expect(categorias.every((c) => c === 'Técnico')).toBe(true);
    });

    it('busca por título o autor', async () => {
      const respuesta = await api().get('/books?search=Autora Par&limit=100').expect(200);

      const autores = (respuesta.body.data as { author: string }[]).map((l) => l.author);
      expect(autores.length).toBeGreaterThan(0);
      expect(autores.every((a) => a === 'Autora Par')).toBe(true);
    });
  });

  describe('GET /books/search y /books/low-stock', () => {
    it('search?category= devuelve sólo esa categoría', async () => {
      const respuesta = await api().get('/books/search?category=Novela&limit=100').expect(200);

      const categorias = (respuesta.body.data as { category: string }[]).map((l) => l.category);
      expect(categorias.length).toBeGreaterThan(0);
      expect(categorias.every((c) => c === 'Novela')).toBe(true);
    });

    it('low-stock usa 10 como umbral por defecto', async () => {
      const respuesta = await api().get('/books/low-stock?limit=100').expect(200);

      const stocks = (respuesta.body.data as { stock_quantity: number }[]).map(
        (l) => l.stock_quantity,
      );
      expect(stocks.length).toBeGreaterThan(0);
      expect(stocks.every((s) => s <= 10)).toBe(true);
    });

    it('low-stock admite un umbral propio', async () => {
      const respuesta = await api().get('/books/low-stock?threshold=3&limit=100').expect(200);
      const stocks = (respuesta.body.data as { stock_quantity: number }[]).map(
        (l) => l.stock_quantity,
      );

      expect(stocks.every((s) => s <= 3)).toBe(true);
      expect(respuesta.body.meta.total).toBeLessThan(
        (await api().get('/books/low-stock?limit=100').expect(200)).body.meta.total,
      );
    });
  });

  describe('GET /books/:id', () => {
    it('devuelve el libro pedido', async () => {
      const creado = await api()
        .post('/books')
        .send(libroValido({ isbn: isbnUnico(300) }))
        .expect(201);

      const respuesta = await api().get(`/books/${creado.body.id}`).expect(200);
      expect(respuesta.body.id).toBe(creado.body.id);
    });

    it('responde 404 con código identificable si no existe', async () => {
      const respuesta = await api().get('/books/999999').expect(404);
      expect(respuesta.body.code).toBe('LIBRO_NO_ENCONTRADO');
    });

    it('responde 400 si el identificador no es un número', async () => {
      await api().get('/books/no-es-un-id').expect(400);
    });
  });

  describe('PUT /books/:id', () => {
    it('sustituye los datos del libro', async () => {
      const creado = await api()
        .post('/books')
        .send(libroValido({ isbn: isbnUnico(400) }))
        .expect(201);

      const respuesta = await api()
        .put(`/books/${creado.body.id}`)
        .send(
          libroValido({
            isbn: isbnUnico(400),
            title: 'Título corregido',
            stock_quantity: 99,
            cost_usd: 30.5,
          }),
        )
        .expect(200);

      expect(respuesta.body).toMatchObject({
        id: creado.body.id,
        title: 'Título corregido',
        stock_quantity: 99,
        cost_usd: 30.5,
      });
    });

    it('responde 404 si el libro no existe', async () => {
      await api()
        .put('/books/999999')
        .send(libroValido({ isbn: isbnUnico(401) }))
        .expect(404);
    });

    it('rechaza dejar dos libros con el mismo ISBN -> 409', async () => {
      const primero = await api()
        .post('/books')
        .send(libroValido({ isbn: isbnUnico(500) }))
        .expect(201);
      await api()
        .post('/books')
        .send(libroValido({ isbn: isbnUnico(501) }))
        .expect(201);

      const respuesta = await api()
        .put(`/books/${primero.body.id}`)
        .send(libroValido({ isbn: isbnUnico(501) }))
        .expect(409);

      expect(respuesta.body.code).toBe('ISBN_DUPLICADO');
    });
  });

  describe('DELETE /books/:id', () => {
    it('elimina el libro y deja de encontrarse', async () => {
      const creado = await api()
        .post('/books')
        .send(libroValido({ isbn: isbnUnico(600) }))
        .expect(201);

      await api().delete(`/books/${creado.body.id}`).expect(204);
      await api().get(`/books/${creado.body.id}`).expect(404);
      await api().delete(`/books/${creado.body.id}`).expect(404);
    });
  });
});
