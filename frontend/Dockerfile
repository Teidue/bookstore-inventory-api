# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Imagen del cliente: se compila con Node y se sirve con nginx.
#
# El resultado de Vite son ficheros estáticos; servirlos con nginx en lugar de
# dejar un servidor de desarrollo encendido es más pequeño, más rápido y lo
# que se haría en producción.
# ---------------------------------------------------------------------------

FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# La URL de la API se incrusta en tiempo de compilación, porque el navegador
# del usuario —no el contenedor— es quien hará las peticiones.
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# --- Imagen final ----------------------------------------------------------
FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
