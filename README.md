# Bookstore Inventory API

Sistema de gestión de inventario de librerías con cálculo del precio de venta
sugerido a partir de la tasa de cambio del día. Incluye una API REST, una
interfaz web (SPA) que la consume y una colección de Postman.

| Capa | Tecnología |
|---|---|
| Backend | NestJS 11 · TypeScript (estricto) · TypeORM 0.3 · PostgreSQL |
| Frontend | React 19 · TypeScript · Vite · React Router 7 · Tailwind CSS 4 |
| Integración | [exchangerate-api.com](https://api.exchangerate-api.com/v4/latest/USD) |
| Entorno | Docker Compose · Node 22 · PostgreSQL 16 (en Docker) |

> **Sobre el framework.** El enunciado permite elegir ("el framework de tu
> elección", con preferencia por Django) y se ha usado **NestJS + TypeScript**,
> que es donde tengo experiencia real. La organización es la equivalente a la de
> un proyecto Django bien estructurado: módulos por dominio, capa de servicios
> con la lógica de negocio, DTO para validar la entrada, migraciones versionadas
> y seeds. Es la única desviación respecto a lo que el documento prefiere; el
> resto de decisiones están justificadas en la [sección 9](#9-cumplimiento-del-enunciado).

```
bookstore-inventory-api/
├── backend/      API REST (NestJS)
├── frontend/     Interfaz web (React + Vite + Tailwind)
├── postman/      Colección exportada
├── docker-compose.yml
└── README.md
```

**Contenido:** [1. Docker](#1-puesta-en-marcha-con-docker-recomendado) ·
[2. Sin Docker](#2-puesta-en-marcha-local-sin-docker) ·
[3. Variables](#3-variables-de-entorno) ·
[4. Endpoints](#4-endpoints-y-ejemplos-de-uso) ·
[5. Reglas y errores](#5-reglas-de-negocio) ·
[6. Interfaz](#6-interfaz-web) ·
[7. Postman](#7-colección-de-postman) ·
[8. Tests](#8-tests-y-verificación) ·
[9. Cumplimiento del enunciado](#9-cumplimiento-del-enunciado) ·
[10. Arquitectura y decisiones](#10-arquitectura-y-decisiones-técnicas)

---

## 1. Puesta en marcha con Docker (recomendado)

Requisito: **Docker** con Compose v2. Un solo comando levanta base de datos, API
y cliente web:

```bash
docker compose up --build
```

| Servicio | URL |
|---|---|
| Interfaz web | <http://localhost:8080> |
| API | <http://localhost:3000> |
| Documentación (Swagger) | <http://localhost:3000/docs> |

La API aplica las migraciones y carga el catálogo de ejemplo (14 libros) al
arrancar. Ambos pasos son idempotentes: reiniciar no duplica datos. Los servicios
arrancan en orden (la API espera a que PostgreSQL esté sano, y la web a que lo
esté la API) gracias a los `healthcheck`.

El contenedor de PostgreSQL publica el puerto **55432** en el host, para poder
conectarse con un cliente gráfico o lanzar los tests de integración contra él
sin chocar con un PostgreSQL local que ya ocupe el 5432.

Para parar y borrar también los datos (volumen `postgres-data`):

```bash
docker compose down -v
```

> Si ya tenías una base poblada con una versión anterior, recrea el volumen con
> el comando de arriba: el seed es idempotente por ISBN y no corrige datos
> existentes, sólo añade los que faltan.

---

## 2. Puesta en marcha local (sin Docker)

### 2.1 Requisitos previos

- **Node.js 20 o superior** (probado con 22 y 24) y npm 10+
- **PostgreSQL 14 o superior** en ejecución (probado con 16 y 18)

### 2.2 Backend

```bash
cd backend
cp .env.example .env     # revisa DB_USER y DB_PASSWORD
npm install
npm run db:setup         # crea la base + migraciones + datos de ejemplo
npm run start:dev        # http://localhost:3000
```

`db:setup` encadena tres comandos que también puedes ejecutar por separado:

| Comando | Qué hace |
|---|---|
| `npm run db:create` | Crea la base `DB_NAME` si no existe |
| `npm run migration:run` | Crea el esquema con las migraciones de TypeORM |
| `npm run seed` | Carga el catálogo de ejemplo |

> Si tu usuario de PostgreSQL no puede crear bases de datos, créala a mano con
> `createdb -U postgres bookstore_inventory` y ejecuta los otros dos comandos.

Para ejecutar la versión compilada, como en producción:

```bash
npm run build && npm run start:prod
```

### 2.3 Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev              # http://localhost:5173
```

Otros scripts: `npm run build` (compila a `dist/`), `npm run preview` y
`npm run lint`.

---

## 3. Variables de entorno

### Backend (`backend/.env`)

La API valida todas las variables al arrancar: si falta una obligatoria o tiene
un valor inválido, no arranca y dice cuál es.

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

La documentación interactiva (Swagger) está en <http://localhost:3000/docs>.

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
el cuerpo, se ignora. Responde `201`.

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
| `category` | texto; **coincidencia parcial**, sin distinguir mayúsculas | — |
| `search` | texto libre sobre título o autor; coincidencia parcial | — |
| `low_stock_threshold` | entero ≥ 0; devuelve los de stock **menor o igual** | — |

Los filtros se combinan entre sí y con la paginación en una sola consulta; el
`total` corresponde al conjunto filtrado completo, no a la página.

### 4.4 Endpoints opcionales

```bash
curl "http://localhost:3000/books/search?category=Novela"
curl "http://localhost:3000/books/low-stock?threshold=10"
```

Ambos devuelven la misma envoltura paginada, así que se pueden combinar con
`page` y `limit`. La búsqueda por categoría es parcial (`Literatura` encuentra
`Literatura Clásica`). En `low-stock`, el umbral por defecto es 10.

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
devuelve el desglose. El ejemplo del PDF (15,99 USD a 0,85 → 13,59 → 19,03) está
fijado en un test unitario.

**Cómo se calcula.** `cost_local = round(cost_usd × tasa, 2)` y
`selling_price_local = round(cost_local × 1,40, 2)`. El margen del 40% es un
*recargo sobre el coste* (markup), no un porcentaje del precio de venta: de cada
13,59 € de coste se ganan 5,44 € (el 40% del coste, no del precio final).

`rate_source` es un campo **añadido** (el enunciado no lo pide) que indica de
dónde salió la tasa:

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
campos. `selling_price_local` no se acepta en el cuerpo: ese valor sólo lo
escribe el cálculo.

**Si el `PUT` cambia `cost_usd`, el precio de venta ya calculado vuelve a
`null`** (sin calcular), porque correspondía al coste anterior y mostrarlo junto
al coste nuevo sería un dato falso. Si el coste no cambia (aunque se envíe con
otra forma, como `15.9` en lugar de `15.90`), el precio se conserva. El nuevo
precio se obtiene volviendo a llamar a `calculate-price`.

---

## 5. Reglas de negocio

Todas se aplican en el backend, y las que afectan a la integridad de los datos
también como restricción en la base:

1. `cost_usd` debe ser mayor que 0 (DTO + `CHECK`).
2. `stock_quantity` no puede ser negativo (DTO + `CHECK`).
3. `isbn` debe tener 10 o 13 dígitos; se admiten guiones y espacios (validador +
   `CHECK` sobre el valor normalizado).
4. No se permiten dos libros con el mismo ISBN: la unicidad se impone sobre el
   ISBN **normalizado**, así que `978-84-376-0494-7` y `9788437604947` son el
   mismo libro. La impone un índice único en la base, no una comprobación previa.
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
  "code": "BOOK_NOT_FOUND",
  "message": "No existe ningún libro con id 999999.",
  "path": "/books/999999",
  "timestamp": "2026-10-06T06:42:42.898Z"
}
```

Los errores de validación añaden `details` con un mensaje por cada campo
incorrecto. El `code` es el identificador estable sobre el que deben decidir los
clientes; el `message` está pensado para personas y puede cambiar.

| HTTP | `code` | Cuándo |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Datos inválidos o identificador no numérico |
| `404` | `BOOK_NOT_FOUND` | El libro no existe |
| `409` | `DUPLICATE_ISBN` | Ya hay un libro con ese ISBN |
| `503` | `EXCHANGE_RATE_UNAVAILABLE` | Tasas no disponibles y sin respaldo configurado |
| `500` | `INTERNAL_ERROR` | Fallo no previsto (sin filtrar detalles al cliente) |

El `409` no figura en el enunciado, que sólo enumera 400, 404, 500 y 503. Se usa
para el ISBN duplicado porque es el código HTTP que describe un conflicto con el
estado actual del recurso.

---

## 6. Interfaz web

SPA en React que consume los 8 endpoints de la API. Con Docker está en
<http://localhost:8080>; en local, en <http://localhost:5173>.

- **Dashboard de inventario**: tabla con **paginación del servidor** y panel de
  filtros por categoría y por stock máximo, más tres cifras de cabecera
  (catálogo, inventario bajo y agotados). Las dos cifras de aviso son además
  atajos del filtro de stock: al pulsarlas rellenan el campo «Stock máximo».
  Usa los tres endpoints de lectura: `/books/search` cuando sólo se filtra por
  categoría, `/books/low-stock` cuando sólo se filtra por stock, y `/books` para
  el resto de combinaciones.
- **Gestión de libros**: formularios validados en cliente **antes de enviar**
  (coste mayor que 0 con 2 decimales, stock entero no negativo, ISBN de 10 o 13
  dígitos) para crear y actualizar, y borrado con diálogo de confirmación.
- **Campo ISBN**: aplica una máscara de entrada. Sólo admite dígitos (y una `X`
  como décimo carácter), corta en 13 y reparte los guiones al escribir o pegar.
  Al completar el número avisa, sin bloquear, si el prefijo o el dígito de
  control no cuadran.
- **Cálculo de precio**: acción explícita en el listado y en el detalle, con el
  desglose completo (coste original, tasa aplicada, margen y precio final) y un
  aviso cuando la tasa proviene del respaldo.
- **Estados y errores**: esqueletos de carga y *spinners* en las acciones,
  estados vacío y de error con reintento, y notificaciones (toasts) para el
  éxito y para los errores que devuelve la API (400, 404, 409, 500, 503).
- **Tema claro y oscuro**: interruptor en la barra superior. Recuerda la elección
  y, si nunca se eligió, sigue la del sistema. Respeta `prefers-reduced-motion`.

### 6.1 Cómo probarla a mano

1. Abre <http://localhost:8080>. Verás el catálogo, con 7 libros de inventario
   bajo (uno de ellos agotado).
2. **Filtros**: escribe `Novela` en «Categoría» y verás los 3 libros de esa
   categoría (la búsqueda es parcial: `Nove` también funciona). Pulsa
   «Limpiar». Pulsa la tarjeta «Inventario bajo»: el campo «Stock máximo» se
   rellena con 10 y la tabla se reduce a esos libros.
3. **Paginación**: sin filtros, cambia a la página 2 con los botones inferiores.
4. **Crear**: «Añadir libro». Envía el formulario vacío y verás los errores en
   cada campo. Escribe `9780306406157` en ISBN: se formatea solo y aparece
   «ISBN válido». Rellena el resto (coste 20, país `ES`) y crea el libro.
5. **Duplicado**: repite la operación con el mismo ISBN y verás el error 409.
6. **Calcular precio**: en el detalle, «Calcular precio de venta». Aparece el
   desglose con coste, tasa, margen (+40%) y precio final, y un aviso de éxito.
7. **Editar** el libro (botón «Editar»). Cambia solo el título y guarda: el
   precio calculado se conserva. Vuelve a editar y cambia el **coste**: el precio
   vuelve a «Sin calcular» y un aviso lo explica.
8. **Eliminar** con el botón del detalle: pide confirmación; `Escape` cancela.
9. **Errores**: abre <http://localhost:8080/books/999999> (404 con reintento) y
   <http://localhost:8080/ruta-inventada> (página 404).
10. **Fallo de la API externa** (con Docker): simula que el servicio de tasas
    no responde recreando la API con otra URL:

    ```bash
    EXCHANGE_API_URL=http://localhost:9 docker compose up -d --force-recreate api
    ```

    Vuelve a calcular un precio: el aviso indica que se usó la tasa de respaldo
    (`rate_source: "fallback"`). Para ver el error 503, deja además vacía la tasa
    de respaldo:

    ```bash
    EXCHANGE_API_URL=http://localhost:9 EXCHANGE_FALLBACK_RATE= \
      docker compose up -d --force-recreate api
    ```

    Recrear la API vacía su caché de tasas, que de lo contrario seguiría
    sirviendo la última tasa real durante diez minutos. Para volver a la
    configuración normal: `docker compose up -d --force-recreate api`.

---

## 7. Colección de Postman

`postman/bookstore-inventory-api.postman_collection.json`

Impórtala desde **Import → File**. Define la variable `base_url`
(`http://localhost:3000`) y se ejecuta de arriba abajo con el Runner sin tocar
nada. Se puede repetir las veces que haga falta: cada ejecución genera su propio
ISBN válido y borra al final el libro que crea.

18 peticiones y 43 aserciones, organizadas en cinco carpetas:

1. **CRUD de libros**: crear, listar paginado, obtener, actualizar.
2. **Búsquedas**: por categoría y por stock bajo (con umbral y por defecto),
   comprobando que los resultados cumplen el filtro.
3. **Cálculo de precio**: desglose completo, margen del 40%, que el precio
   queda guardado en el libro y que editar el coste lo reinicia.
4. **Errores esperados**: 400 (ISBN, coste, stock), 404 y 409, comprobando el
   código de estado, el `code` y la forma uniforme del error.
5. **Limpieza**: borrado y comprobación de que ya no existe.

Desde la terminal, sin abrir Postman:

```bash
npx newman run postman/bookstore-inventory-api.postman_collection.json \
  --env-var base_url=http://localhost:3000
```

El `503` no está en la colección porque no se puede provocar desde Postman con
la API externa disponible; lo cubren los tests de integración (sección 8).

---

## 8. Tests y verificación

```bash
cd backend
npm test          # unitarios (no necesitan base de datos)
npm run test:e2e  # integración (necesita PostgreSQL)
```

Para lanzar los de integración contra el PostgreSQL de Docker:

```bash
DB_HOST=localhost DB_PORT=55432 DB_USER=bookstore DB_PASSWORD=bookstore \
DB_NAME=bookstore_inventory npm run test:e2e
```

**43 unitarios**: el cálculo de precio como función pura (incluido el ejemplo
exacto del enunciado y los casos de redondeo), la validación y normalización de
ISBN, el filtro global de excepciones, la validación del entorno al arrancar
(incluida la tasa de respaldo vacía), y el servicio de tasas con sus cuatro
caminos (API, caché, respaldo y 503).

**38 de integración**: levantan la aplicación completa contra PostgreSQL real y
la atacan por HTTP. Cada archivo crea su propio esquema efímero, lo migra y lo
destruye al terminar, así que no tocan los datos de desarrollo. La API de tasas
se simula con `nock` y la red real queda deshabilitada, lo que permite forzar
sus fallos y comprobar el respaldo (`rate_source: "fallback"`) y el `503`.
Cubren el CRUD, las reglas de negocio, la paginación y los filtros, el ISBN
duplicado (incluido con distintos guiones), el reinicio del precio al cambiar el
coste, y el cálculo de precio.

**Colección de Postman**: 43 aserciones, ejecutables con `newman` (sección 7).

**Interfaz**: no tiene tests automatizados en el repositorio. Se verificó durante
el desarrollo con un navegador real (Chrome controlado por script): flujo
completo de alta, edición, cálculo y borrado, validación antes de enviar,
paginación y filtros contra el servidor, y los errores 400, 404, 409, 500 y 503
inyectados en las respuestas de la API.

---

## 9. Cumplimiento del enunciado

Cada requisito del documento, cómo se cumple y por qué se hizo así. ✅ cumplido ·
⚠️ cumplido con una desviación o matiz que se explica.

### Getting Started

- ✅ **Carpeta `bookstore-inventory-api`**: es la raíz del repositorio.
- ⚠️ **Framework de tu elección (preferencia Django)**: se usó **NestJS con
  TypeScript**. *Por qué:* prioricé entregar un trabajo cuidado con un framework
  que domino, en lugar de aprender uno nuevo contrarreloj. El enunciado lo
  permite; la estructura es equivalente.
- ✅ **Commit inicial**: `chore: inicializa bookstore-inventory-api con NestJS y
  TypeScript`. El historial es incremental, por capas (configuración, capa
  común, módulos, integración, Docker, interfaz).
- ✅ **PLUS dockerizado**: `docker compose up --build` levanta base de datos,
  API y web. *Cómo:* imágenes multi-etapa (sin compilador, tests ni código fuente en la
  imagen final), la API corre con un usuario no root y tiene `HEALTHCHECK`, y
  el arranque se ordena con `depends_on` por condición de salud. La web se
  sirve con nginx.

### 1. Modelo de datos

- ✅ **Modelo `Book` con los 11 campos del enunciado**: `id`, `title`, `author`,
  `isbn`, `cost_usd`, `selling_price_local` (nulo al crear), `stock_quantity`,
  `category`, `supplier_country`, `created_at`, `updated_at`. *Por qué así:* los
  importes son `numeric` y no `float`, porque `15.99 × 0.85` en coma flotante da
  `13.591499999999998` y el error se arrastra; la API los devuelve como número
  JSON, como en el ejemplo. Los timestamps son `timestamptz` en UTC.
  *Matiz:* incluyen milisegundos (`…T10:30:00.123Z`), que sigue siendo ISO 8601.

### 2. Endpoints CRUD

- ✅ **`POST /books`** → `201`. Valida con DTO; `selling_price_local` no se
  acepta en el cuerpo (`whitelist`).
- ✅ **`GET /books`** con paginación → `{ data, meta }`. *Por qué:* la paginación
  y los filtros se resuelven en PostgreSQL (`LIMIT/OFFSET` más un `COUNT`), no en
  memoria, de modo que el `total` es del conjunto filtrado completo. `limit`
  tiene techo de 100: sin él, `?limit=1000000` sería una denegación de servicio.
- ✅ **`GET /books/{id}`**, **`PUT /books/{id}`**, **`DELETE /books/{id}`**
  (`204`). *Por qué:* `PUT` exige el recurso completo, que es lo que significa el
  verbo; admitir campos sueltos sería un `PATCH`, que el documento no pide.
  *Matiz añadido:* si el `PUT` cambia el coste, el precio de venta ya calculado
  se reinicia a `null`, para que nunca quede un precio que no corresponde al
  coste guardado.
- ✅ **Opcional `GET /books/search?category=`**: implementado. Coincidencia
  parcial y sin distinguir mayúsculas, porque se usa desde un cuadro de texto
  libre.
- ✅ **Opcional `GET /books/low-stock?threshold=10`**: implementado, con umbral
  por defecto de 10. *Matiz:* el parámetro `threshold` es un alias de
  `low_stock_threshold`, el nombre que usa `GET /books`, para que ambos
  endpoints compartan el mismo filtro y se puedan combinar con paginación.

### 3. Endpoint con integración externa

- ✅ **`POST /books/{id}/calculate-price`** con los cinco pasos de la lógica:
  1. *Toma `cost_usd`* del libro.
  2. *Obtiene la tasa USD → moneda local* de la API de tasas. *Por qué la
     moneda es EUR:* el enunciado no la fija y su ejemplo está en EUR; es la
     variable `LOCAL_CURRENCY`, así que cambiarla no toca código.
  3. *Aplica el margen del 40%*, configurable con `PROFIT_MARGIN_PERCENTAGE`.
  4. *Actualiza `selling_price_local`* en la base de datos.
  5. *Devuelve el cálculo detallado* con los 8 campos de la respuesta esperada.
- ⚠️ **Respuesta esperada**: contiene los 8 campos del documento y **uno más**,
  `rate_source` (`exchange_api`, `cache` o `fallback`). *Por qué:* sin él, el
  cliente no puede distinguir un precio calculado con la tasa real de uno
  calculado con la de respaldo. Es aditivo: quien sólo lea los 8 campos del
  contrato no se ve afectado.
- ✅ **Aritmética exacta**: `decimal.js` con redondeo `HALF_UP` en dos pasos
  (coste local y luego margen), que es como se obtiene el ejemplo del enunciado
  (15,99 × 0,85 = 13,59; × 1,40 = 19,03). Está fijado en un test.
- ✅ **Robustez de la integración** (no la pide el documento, pero la API externa
  es el punto frágil): tiempo de espera de 5 s, caché de 10 min con una única
  consulta compartida cuando coinciden varias peticiones, y validación de la
  forma de la respuesta. *Por qué:* las tasas cambian una vez al día; pedirlas en
  cada cálculo gastaría la cuota del servicio sin ganar nada.

### Reglas de negocio

- ✅ **`cost_usd` > 0**: validado en el DTO y con un `CHECK` en la base.
- ✅ **`stock_quantity` ≥ 0**: validado en el DTO y con un `CHECK` en la base.
  *Por qué dos capas:* el DTO da un error claro; el `CHECK` protege la
  integridad frente a cualquier otro camino de escritura.
- ✅ **ISBN de 10 o 13 dígitos**: validador propio que ignora guiones y espacios.
  ⚠️ *Matiz:* se valida el **formato**, no el dígito de control, porque el
  enunciado pide exactamente «formato válido (10 o 13 dígitos)» y rechazar lo que
  el contrato admite rompería a los clientes que lo cumplen. La interfaz sí avisa,
  sin bloquear, cuando el dígito de control no cuadra (ver sección 5).
- ✅ **Sin duplicados por ISBN** → `409`. *Por qué así:* la unicidad es un índice
  único sobre el ISBN **normalizado**, así que `978-84-376-0494-7` y
  `9788437604947` son el mismo libro. La detecta la base de datos y no un
  `SELECT` previo: entre un `SELECT` y un `INSERT` cabe otra petición; el índice
  no tiene esa ventana.
- ✅ **Si la API de cambio falla, usar tasa por defecto**: `EXCHANGE_FALLBACK_RATE`
  (0,92 por defecto) y la respuesta lo declara con `rate_source: "fallback"`.
  *Por qué el 503:* si el operador deja la tasa de respaldo vacía, la API
  responde `503` en lugar de inventar un precio.
- ✅ **Manejo de errores 400, 404, 500 y 503** (más el 409): un único filtro
  global produce siempre la misma forma `{ statusCode, code, message, path,
  timestamp, details? }`. El `500` nunca filtra detalles internos (trazas,
  consultas) al cliente, y se registra en el servidor.

### Entregables

- ✅ **Link al repositorio**: <https://github.com/Teidue/bookstore-inventory-api>.
- ✅ **README** con requisitos previos (sección 2.1), pasos de instalación y
  ejecución (secciones 1 y 2) y ejemplos de uso de los endpoints (sección 4).
- ✅ **Colección de Postman exportada** con las peticiones a todos los endpoints
  (sección 7): 18 peticiones y 43 aserciones, repetible.
- ✅ **Interfaz web (SPA)** (sección 6).

### Interfaz: stack y buenas prácticas

- ✅ **Framework libre**: React 19 + TypeScript + Vite + React Router + Tailwind.
- ✅ **Arquitectura, manejo de estado y componentes reutilizables.** *Cómo:*
  capas separadas —`services/` (llamadas a la API), `hooks/` (`useQuery`,
  `useDebounce`, `useToasts`, `useTheme`), `components/ui/` (botón, tarjeta,
  campo, insignia, diálogo, paginación, notificaciones), `components/books/` y
  `pages/`. *Por qué el estado así:* el estado del servidor se modela como una
  unión discriminada (`loading | success | error`), de modo que un fallo de la
  API no puede acabar en un indicador de carga infinito; el resto es estado
  local de cada pantalla, y un único contexto para las notificaciones. Con tres
  pantallas y un solo recurso, una librería de estado global sería peso muerto.

### Interfaz: dashboard de inventario

- ✅ **Tabla del catálogo**, con tabla y no cuadrícula porque se comparan varios
  atributos por fila (stock, coste, precio, país).
- ✅ **Paginación proveniente del backend**: los controles se construyen con el
  `meta` que devuelve la API; cambiar de página pide esa página al servidor.
- ✅ **Panel de filtros por categoría y de stock bajo**. *Cómo:* campo de
  categoría, campo «Stock máximo» y tres cifras de cabecera cuyas dos tarjetas
  de aviso son atajos del filtro, de modo que haya un único estado y se vea el
  valor aplicado. Los filtros viajan al servidor y la página vuelve a la 1 con
  cada cambio, para no mostrar una página 4 de un resultado de 2 elementos.

### Interfaz: gestión de libros

- ✅ **Formularios validados para POST y PUT antes de enviar**: coste, stock, país
  e ISBN se validan en cliente, y si algo falla no se envía ninguna petición. La
  validación de cliente duplica a propósito las reglas del servidor sólo para
  responder al instante; la que decide es la del servidor, y su error también se
  muestra en el formulario.
- ✅ **Eliminación con confirmación**: diálogo modal sobre el elemento `<dialog>`
  nativo, que ya resuelve lo difícil de un modal accesible (atrapa el foco, lo
  devuelve al cerrar y se cierra con `Escape`).

### Interfaz: cálculo de precios

- ✅ **Acción explícita** «Calcular precio» en el listado y en el detalle.
- ✅ **Desglose en tiempo real** con coste original, tasa aplicada, margen y
  precio final en moneda local. *Matiz de diseño:* el precio final se destaca del
  resto, porque es la cifra que se busca y no un renglón más.

### Interfaz: estados y errores

- ✅ **Indicadores de carga**: esqueletos con la forma de la tabla (evitan el
  salto de diseño al llegar los datos) y *spinners* dentro de los botones que
  lanzan peticiones.
- ✅ **Notificaciones de éxito y de error** (400, 404, 500, 503): toasts con
  `aria-live`, para que un lector de pantalla también anuncie el resultado.
  Muestran el `message` que devuelve la API, y el 503 tiene su propio título.
  Los fallos de lectura, en cambio, se muestran en la propia vista con un botón
  «Reintentar», porque un toast que desaparece no deja al usuario ningún camino.
- ✅ **Integración de la totalidad de los endpoints**: los 8 se consumen —
  `POST /books`, `GET /books`, `GET /books/search`, `GET /books/low-stock`,
  `GET /books/{id}`, `PUT`, `DELETE` y `POST /books/{id}/calculate-price`.

### Extras no pedidos por el documento

Documentación interactiva con Swagger, `helmet` y CORS configurable, validación
de las variables de entorno al arrancar, migraciones versionadas y seeds
idempotentes, tests de integración contra PostgreSQL real, máscara y aviso en el
campo ISBN, cifras de cabecera del inventario, tema claro/oscuro y accesibilidad
(foco visible, `aria-live`, `prefers-reduced-motion`).

---

## 10. Arquitectura y decisiones técnicas

### Estructura del backend

```
backend/src/
├── common/            Lo compartido: constantes de error, DTO de paginación,
│                      filtro global de excepciones, validador de ISBN
├── config/            Validación del entorno y opciones de la base de datos
├── database/          data-source, migraciones, seeds y creación de la base
└── modules/
    ├── books/         Controlador, servicio, entidad, DTO y dominio
    │   └── domain/    price-calculation.ts: función pura, sin HTTP ni base de datos
    └── exchange-rate/ Toda la fragilidad de depender de un tercero
```

### Estructura del frontend

```
frontend/src/
├── components/{ui,books,layout}/   Piezas reutilizables y piezas del dominio
├── contexts/ · hooks/              Notificaciones, consultas, tema, retardo
├── pages/                          Dashboard, detalle, alta, edición y 404
├── services/                       Cliente HTTP y servicio de libros
├── types/ · utils/ · styles/       Contrato de la API, formato y tokens de diseño
```

### Decisiones

**Importes en `numeric`, no en `float`.** El coste se multiplica por la tasa y
por el margen; se guardan como `numeric` y se calculan con `decimal.js`,
redondeando a 2 decimales en dos pasos, que es como se obtiene el resultado del
ejemplo del enunciado.

**La lógica de negocio es una función pura.** `calculateSellingPrice` no sabe de
HTTP, de la base de datos ni de quién le da la tasa, por lo que se prueba a fondo
sin levantar nada.

**La integración externa está aislada.** Toda la fragilidad de depender de un
tercero (tiempo de espera, caché, avalancha de peticiones simultáneas, respaldo)
vive en un único servicio. El resto de la aplicación pide una tasa y recibe
además de dónde salió.

**La tasa se cachea.** Si varias peticiones coinciden con la caché vencida, se
comparte una sola consulta a la API.

**El ISBN duplicado lo detecta la base de datos.** El índice único no tiene la
ventana de carrera de un `SELECT` previo, y el error se traduce a un `409` limpio.

**Contrato de error estable.** Los clientes deciden sobre `code`, no sobre el
texto del mensaje; por eso los códigos están en inglés y centralizados en un
único enumerado.

**Los tokens de diseño se nombran por su papel.** `surface`, `line`, `ink`,
`accent`… y no `slate-200`. El modo oscuro es una segunda tabla de valores para
los mismos nombres, así que ningún componente sabe en qué tema está.

**Idioma.** Los identificadores, archivos y códigos de error están en inglés; los
comentarios y todo el texto que lee el usuario (interfaz y mensajes de la API)
están en español.

### Comportamientos que conviene conocer

Decisiones de detalle que el enunciado no especifica y que afectan a quien use la
API. Están aquí para que no sorprendan.

- **Orden del listado.** `GET /books` devuelve primero los más recientes
  (`created_at` descendente) y desempata por `id` descendente. Sin ese desempate,
  dos libros creados en el mismo instante podrían intercambiarse entre una página
  y la siguiente y aparecer repetidos u omitidos.
- **El borrado es físico.** `DELETE` elimina la fila: no hay papelera ni borrado
  lógico. Es lo más simple para este alcance y lo que el enunciado describe
  («Eliminar libro»); un inventario real podría querer conservar el histórico.
- **Cambiar el coste reinicia el precio de venta.** `PUT` nunca escribe
  `selling_price_local`, pero tampoco lo deja obsoleto: si `cost_usd` cambia, el
  precio vuelve a `null` hasta que se calcule de nuevo. *Por qué no se recalcula
  en el mismo `PUT`:* un `PUT` pasaría a depender de un servicio externo y a poder
  fallar por un motivo ajeno a la edición. La comparación del coste es decimal
  exacta, así que reenviar el mismo valor con otra forma no reinicia nada. La
  interfaz lo avisa al guardar.
- **El precio se guarda sin moneda.** Cada libro guarda sólo el importe; la moneda
  es la configurada en `LOCAL_CURRENCY`. Cambiar esa variable no reconvierte los
  precios ya guardados: se leerían en la moneda nueva. La API admite una única
  moneda local por instalación.
- **Los campos desconocidos se ignoran, no dan error.** El cuerpo se filtra con
  `whitelist`, así que un campo que el DTO no declara (como `selling_price_local`)
  se descarta en silencio en lugar de responder `400`. Es deliberado: un cliente
  que envía un campo de más no debería fallar por eso, y el valor no llega nunca
  al servicio.
- **Los textos se limpian al entrar.** `title`, `author`, `category` e `isbn` se
  recortan (sin espacios al principio ni al final) y `supplier_country` se guarda
  en mayúsculas, de modo que `es` y `ES` son el mismo país.
- **El ISBN se guarda como se envió.** Se conserva el formato original (con o sin
  guiones) y además un valor normalizado, que es sobre el que se impone la
  unicidad y el que se compara.
- **Límites de los datos.** `cost_usd` admite como máximo 2 decimales y
  `stock_quantity` debe ser un entero; `limit` en los listados tiene un techo de
  100.
- **Los identificadores son enteros autoincrementales.** Son predecibles, lo que
  es aceptable porque la API no tiene autenticación (véase la deuda técnica).

### Deuda técnica asumida

- **Sin autenticación**: el enunciado no la pide, pero una API de inventario
  real necesitaría proteger la escritura.
- **La caché de tasas es de proceso**: con varias instancias, cada una tendría
  la suya. Con más tráfico convendría un almacén compartido (Redis).
- **Paginación por OFFSET**: suficiente a esta escala; con cientos de miles de
  libros convendría paginar por cursor.
- **Sin tests automatizados de la interfaz en el repositorio**: se verificó con
  un navegador real durante el desarrollo, pero esos scripts no se incluyen.
  Lo natural sería Vitest para la lógica (la máscara y las reglas de ISBN) y
  Playwright para los flujos.
- **El filtro de categoría es un cuadro de texto**: un desplegable con las
  categorías existentes evitaría erratas, pero exigiría un endpoint nuevo que las
  liste, es decir, ampliar el contrato de la API.
- **Textos de la interfaz fijos en español**: no hay capa de internacionalización.
- **Aviso de `npm audit`**: queda un aviso en `braces`, dependencia transitiva
  **de jest** (sólo desarrollo, nunca en la imagen de producción). No existe
  versión corregida publicada: 3.0.3 es la última y el aviso las cubre todas.
