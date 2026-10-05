# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Imagen de la API en dos etapas.
#
# La etapa de compilación necesita las dependencias de desarrollo (TypeScript,
# Nest CLI); la final no.  Separarlas deja una imagen sin compilador, sin
# código fuente y bastante más pequeña.
# ---------------------------------------------------------------------------

FROM node:22-alpine AS build
WORKDIR /app

# Primero el manifiesto y después el código: así la capa de `npm ci` se
# reutiliza mientras no cambien las dependencias.
COPY package*.json ./
RUN npm ci

COPY tsconfig.json nest-cli.json ./
COPY src ./src
RUN npm run build

# --- Imagen final ----------------------------------------------------------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY docker/entrypoint.sh ./docker/entrypoint.sh
RUN chmod +x ./docker/entrypoint.sh

# `node` es un usuario sin privilegios que ya trae la imagen oficial: el
# proceso no corre como root.
USER node

EXPOSE 3000

# El contenedor se declara sano sólo cuando la API responde de verdad, no
# cuando el proceso arranca.
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3000/books?limit=1').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["./docker/entrypoint.sh"]
