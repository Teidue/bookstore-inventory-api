# Bookstore Inventory API

Sistema de gestión de inventario de librerías con cálculo del precio de venta
sugerido a partir de la tasa de cambio del día.

| Capa | Tecnología |
|---|---|
| Backend | NestJS 11 · TypeScript · TypeORM · PostgreSQL |
| Frontend | React 19 · TypeScript · Vite · React Router · Tailwind CSS 4 |
| Integración | [exchangerate-api.com](https://api.exchangerate-api.com/v4/latest/USD) |
| Entorno | Docker Compose · Node 22 |

> **Sobre el framework.** El enunciado permite elegir ("el framework de tu
> elección", con preferencia por Django) y se ha usado **NestJS + TypeScript**,
> que es donde tengo experiencia real. La organización es equivalente a la que
> tendría un proyecto Django bien estructurado: módulos por dominio, capa de
> servicios con la lógica de negocio, DTO para validar la entrada, migraciones
> versionadas y seeds.

```
bookstore-inventory-api/
├── backend/      API REST (NestJS)
├── frontend/     Interfaz web (React + Vite)
├── postman/      Colección exportada
├── docker-compose.yml
└── README.md
```

---

## 1. Puesta en marcha con Docker (recomendado)

Un solo comando levanta base de datos, API y cliente web:

```bash
docker compose up --build
```

| Servicio | URL |
|---|---|
| Interfaz web | <http://localhost:8080> |
| API | <http://localhost:3000> |
| Documentación (Swagger) | <http://localhost:3000/docs> |

La API aplica las migraciones y carga el catálogo de ejemplo (14 libros) al
arrancar. Ambos pasos son idempotentes: reiniciar no duplica datos.

El contenedor de PostgreSQL publica el puerto **55432** en el host, para poder
conectarse con un cliente gráfico o lanzar los tests de integración contra él
sin chocar con un PostgreSQL local que ya ocupe el 5432:

```bash
npm --prefix backend run test:e2e   # con DB_PORT=55432 en el entorno
```

Para parar y borrar también los datos:

```bash
docker compose down -v
```

---

## 2. Puesta en marcha local (sin Docker)

### 2.1 Requisitos previos

- **Node.js 20 o superior** (probado con 24) y npm 10+
- **PostgreSQL 14 o superior** (probado con 18) en ejecución

### 2.2 Backend

```bash
cd backend
cp .env.example .env     # revisa DB_USER y DB_PASSWORD
npm install
npm run db:preparar      # crea la base + migraciones + datos de ejemplo
npm run start:dev        # http://localhost:3000
```

`db:preparar` encadena tres comandos que también puedes ejecutar por separado:

| Comando | Qué hace |
|---|---|
| `npm run db:crear` | Crea la base `DB_NAME` si no existe |
| `npm run migration:run` | Crea el esquema con las migraciones de TypeORM |
| `npm run seed` | Carga el catálogo de ejemplo |

> Si tu usuario de PostgreSQL no puede crear bases de datos, créala a mano con
> `createdb -U postgres bookstore_inventory` y ejecuta los otros dos comandos.

### 2.3 Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev              # http://localhost:5173
```

---

## 3. Variables de entorno

### Backend (`backend/.env`)

| Variable | Obligatoria | Por defecto | Descripción |
|---|---|---|---|
| `DB_HOST` | sí | — | Host de PostgreSQL |
| `DB_PORT` | no | `5432` | Puerto de PostgreSQL |
| `DB_USER` | sí | — | Usuario de PostgreSQL |
| `DB_PASSWORD` | sí | — | Contraseña de ese usuario |
| `DB_NAME` | sí | — | Nombre de la base: `bookstore_inventory` |
| `DB_SCHEMA` | no | `public` | Esquema. Lo usan los tests de integración |
| `PORT` | no | `3000` | Puerto de la API |
| `NODE_ENV` | no | `development` | `development`, `test` o `production` |
| `LOCAL_CURRENCY` | no | `EUR` | Moneda a la que se convierte el coste (ISO 4217) |
| `PROFIT_MARGIN_PERCENTAGE` | no | `40` | Margen aplicado sobre el coste |
| `EXCHANGE_API_URL` | no | API pública de tasas | Origen de las tasas de cambio |
| `EXCHANGE_TIMEOUT_MS` | no | `5000` | Espera máxima de la API externa |
| `EXCHANGE_CACHE_TTL_SECONDS` | no | `600` | Reutilización de una tasa ya consultada |
| `EXCHANGE_FALLBACK_RATE` | no | `0.92` | Tasa de respaldo si la API falla. Vacía ⇒ responde 503 |
| `CORS_ORIGIN` | no | `http://localhost:5173` | Orígenes permitidos, separados por comas |

### Frontend (`frontend/.env`)

| Variable | Obligatoria | Por defecto | Descripción |
|---|---|---|---|
| `VITE_API_URL` | no | `http://localhost:3000` | URL base de la API |
| `VITE_LOCAL_CURRENCY` | no | `EUR` | Moneda para dar formato; debe coincidir con `LOCAL_CURRENCY` |

---

## 4. Endpoints y ejemplos de uso

### 4.1 Resumen

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/books` | Crea un libro |
| `GET` | `/books` | Lista con paginación y filtros |
| `GET` | `/books/search?category=` | Busca por categoría |
| `GET` | `/books/low-stock?threshold=10` | Libros con inventario bajo |
| `GET` | `/books/{id}` | Obtiene un libro |
| `PUT` | `/books/{id}` | Actualiza un libro completo |
| `DELETE` | `/books/{id}` | Elimina un libro |
| `POST` | `/books/{id}/calculate-price` | Calcula y guarda el precio de venta |

### 4.2 Crear un libro

```bash
curl -X POST http://localhost:3000/books \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "El Quijote",
    "author": "Miguel de Cervantes",
    "isbn": "978-84-376-0494-7",
    "cost_usd": 15.99,
    "stock_quantity": 25,
    "category": "Literatura Clásica",
    "supplier_country": "ES"
  }'
```

```json
{
  "id": 1,
  "title": "El Quijote",
  "author": "Miguel de Cervantes",
  "isbn": "978-84-376-0494-7",
  "cost_usd": 15.99,
  "selling_price_local": null,
  "stock_quantity": 25,
  "category": "Literatura Clásica",
  "supplier_country": "ES",
  "created_at": "2026-10-05T10:30:00.000Z",
  "updated_at": "2026-10-05T10:30:00.000Z"
}
```

`selling_price_local` nace nulo: no existe hasta que se calcula. Si se envía en
el cuerpo, se ignora.

### 4.3 Listar con paginación y filtros

```bash
curl "http://localhost:3000/books?page=1&limit=10"
curl "http://localhost:3000/books?category=Técnico"
curl "http://localhost:3000/books?search=Cervantes"
curl "http://localhost:3000/books?low_stock_threshold=5"
```

```json
{
  "data": [ { "id": 1, "title": "El Quijote", "…": "…" } ],
  "meta": { "total": 14, "page": 1, "limit": 10, "total_pages": 2 }
}
```

| Parámetro | Valores | Por defecto |
|---|---|---|
| `page` | entero ≥ 1 | `1` |
| `limit` | 1–100 | `10` |
| `category` | texto; no distingue mayúsculas | — |
| `search` | texto libre sobre título o autor | — |
| `low_stock_threshold` | entero ≥ 0 | — |

### 4.4 Endpoints opcionales

```bash
curl "http://localhost:3000/books/search?category=Novela"
curl "http://localhost:3000/books/low-stock?threshold=10"
```

Ambos devuelven la misma envoltura paginada, así que se pueden combinar con
`page` y `limit`. En `low-stock`, el umbral por defecto es 10.

### 4.5 Calcular el precio de venta

```bash
curl -X POST http://localhost:3000/books/1/calculate-price
```

```json
{
  "book_id": 1,
  "cost_usd": 15.99,
  "exchange_rate": 0.85,
  "cost_local": 13.59,
  "margin_percentage": 40,
  "selling_price_local": 19.03,
  "currency": "EUR",
  "calculation_timestamp": "2026-10-05T10:30:00.000Z",
  "rate_source": "exchange_api"
}
```

La lógica es la del enunciado: se toma `cost_usd`, se consulta la tasa USD →
moneda local, se aplica un margen del 40%, se guarda `selling_price_local` y se
devuelve el desglose.

`rate_source` es un campo añadido que indica de dónde salió la tasa:

| Valor | Significado |
|---|---|
| `exchange_api` | Consulta en vivo a la API de tasas |
| `cache` | Tasa reutilizada de una consulta reciente (TTL configurable) |
| `fallback` | La API falló y se usó `EXCHANGE_FALLBACK_RATE` |

Sin ese campo, el cliente no podría distinguir un precio calculado con la tasa
real de uno calculado con la de respaldo.

### 4.6 Actualizar y eliminar

```bash
curl -X PUT http://localhost:3000/books/1 \
  -H 'Content-Type: application/json' \
  -d '{"title":"El Quijote","author":"Miguel de Cervantes","isbn":"978-84-376-0494-7","cost_usd":18.50,"stock_quantity":30,"category":"Literatura Clásica","supplier_country":"ES"}'

curl -X DELETE http://localhost:3000/books/1   # 204 sin cuerpo
```

`PUT` sustituye el recurso completo, así que el cuerpo debe traer todos los
campos.

---

## 5. Reglas de negocio

Todas se aplican en el backend, y las que afectan a la integridad de los datos
también como restricción en la base:

1. `cost_usd` debe ser mayor que 0 (DTO + `CHECK`).
2. `stock_quantity` no puede ser negativo (DTO + `CHECK`).
3. `isbn` debe tener 10 o 13 dígitos; se admiten guiones y espacios.
4. No se permiten dos libros con el mismo ISBN: la unicidad se impone sobre el
   ISBN **normalizado**, así que `978-84-376-0494-7` y `9788437604947` son el
   mismo libro.
5. Si la API de tasas falla, se usa la tasa de respaldo configurada; si no hay
   ninguna, la API responde `503` en lugar de inventar un precio.

> **Qué se valida del ISBN, y qué no.** La API acepta cualquier número de 10 o
> 13 dígitos (los guiones se ignoran), que es lo que pide el enunciado: rechazar
> lo que el contrato admite rompería a los clientes que lo cumplen, y esto
> incluye a quien pruebe con un ISBN inventado de 13 cifras. El formulario sí
> comprueba el prefijo (978/979) y el dígito de control, pero como **aviso no
> bloqueante**: sirve para detectar erratas de tecleo, no para impedir guardar.
> Qué significa cada grupo del ISBN (país, editorial) no se comprueba: exigiría
> la tabla oficial de rangos de la agencia ISBN, que se actualiza y daría falsos
> errores con una copia desfasada.

### Códigos de error

Todas las respuestas de error tienen la misma forma:

```json
{
  "statusCode": 404,
  "code": "LIBRO_NO_ENCONTRADO",
  "message": "No existe ningún libro con id 999999.",
  "path": "/books/999999",
  "timestamp": "2026-10-05T10:30:00.000Z"
}
```

| HTTP | `code` | Cuándo |
|---|---|---|
| `400` | `VALIDACION` | Datos inválidos o identificador no numérico |
| `404` | `LIBRO_NO_ENCONTRADO` | El libro no existe |
| `409` | `ISBN_DUPLICADO` | Ya hay un libro con ese ISBN |
| `503` | `TASA_CAMBIO_NO_DISPONIBLE` | Tasas no disponibles y sin respaldo configurado |
| `500` | `ERROR_INTERNO` | Fallo no previsto (sin filtrar detalles al cliente) |

---

## 6. Interfaz web

La SPA consume todos los endpoints de la API:

- **Dashboard de inventario**: tabla con paginación del servidor, panel de
  filtros por categoría, búsqueda por título o autor e interruptor de
  inventario bajo con umbral configurable. Usa los tres endpoints de lectura:
  `/books/search` cuando sólo se filtra por categoría, `/books/low-stock`
  cuando sólo se filtra por inventario bajo, y `/books` para el resto de
  combinaciones.
- **Gestión de libros**: formularios validados en cliente (ISBN de 10 o 13
  dígitos, coste mayor que 0 con 2 decimales, stock entero no negativo) para
  crear y actualizar, y borrado con diálogo de confirmación.
- **Cálculo de precio**: acción explícita en el listado y en el detalle, con el
  desglose completo (coste original, tasa aplicada, margen y precio final) y un
  aviso cuando la tasa proviene del respaldo.
- **Estados y errores**: esqueletos de carga, estados vacío y de error con
  reintento, y notificaciones (toasts) para el éxito y para los errores que
  devuelve la API.

---

## 7. Colección de Postman

`postman/bookstore-inventory-api.postman_collection.json`

Impórtala desde **Import → File**. Define la variable `base_url`
(`http://localhost:3000`) y guarda automáticamente el `book_id` del libro creado,
de modo que la colección se puede ejecutar de arriba abajo con el Runner.

Incluye las peticiones de CRUD, los dos endpoints de búsqueda, el cálculo de
precio y una carpeta de errores esperados (400, 404 y 409) con tests que
comprueban el código de estado y el `code` devuelto.

---

## 8. Tests

```bash
cd backend
npm test          # unitarios (no necesitan base de datos)
npm run test:e2e  # integración (necesita PostgreSQL)
```

**Unitarios**: el cálculo de precio como función pura (incluido el ejemplo
exacto del enunciado y los casos de redondeo), la validación y normalización de
ISBN, y el servicio de tasas con sus cuatro caminos (API, caché, respaldo y
503).

**Integración**: levantan la aplicación completa contra PostgreSQL real y la
atacan por HTTP. Cada archivo crea su propio esquema efímero, lo migra y lo
destruye al terminar, así que no tocan los datos de desarrollo. La API de tasas
se simula con `nock` y la red real queda deshabilitada, lo que permite forzar
sus fallos y comprobar el respaldo y el 503.

---

## 9. Decisiones técnicas

**Importes en `numeric`, no en `float`.** El coste se multiplica por la tasa y
por el margen; en coma flotante, `15.99 * 0.85` da `13.591499999999998` y el
error se arrastra. Se guardan como `numeric` y se calculan con `decimal.js`,
redondeando a 2 decimales en dos pasos, que es como se obtiene el resultado del
ejemplo del enunciado.

**La integración externa está aislada.** Toda la fragilidad de depender de un
tercero (tiempo de espera, caché, avalancha de peticiones simultáneas, respaldo)
vive en un único servicio. El resto de la aplicación pide una tasa y recibe
además de dónde salió.

**La tasa se cachea.** Las tasas cambian una vez al día; pedirlas en cada
cálculo gastaría la cuota del servicio sin ganar nada. Si varias peticiones
coinciden con la caché vencida, se comparte una sola consulta.

**El ISBN duplicado lo detecta la base de datos.** Entre un `SELECT` de
comprobación y el `INSERT` cabe otra petición; el índice único no tiene esa
ventana, y el error se traduce a un 409 limpio.

**`PUT` exige el recurso completo.** Es lo que significa el verbo; admitir
campos sueltos sería un `PATCH`, que el enunciado no pide.

### Deuda técnica asumida

- **Sin autenticación**: el enunciado no la pide, pero una API de inventario
  real necesitaría proteger la escritura.
- **La caché de tasas es de proceso**: con varias instancias, cada una tendría
  la suya. Con más tráfico convendría un almacén compartido (Redis).
- **Paginación por OFFSET**: suficiente a esta escala; con cientos de miles de
  libros convendría paginar por cursor.
- **Sin tests automatizados del frontend**: la API tiene unitarios y de
  integración; la interfaz se ha verificado a mano.
- **Aviso de `npm audit`**: queda un aviso en `braces`, dependencia transitiva
  **de jest** (sólo desarrollo, nunca en la imagen de producción). No existe
  versión corregida publicada: 3.0.3 es la última y el aviso las cubre todas.
