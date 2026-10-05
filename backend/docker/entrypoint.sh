#!/bin/sh
# ---------------------------------------------------------------------------
# Arranque del contenedor de la API.
#
# Aplica las migraciones y siembra el catálogo antes de escuchar peticiones.
# Ambos pasos son idempotentes, así que reiniciar el contenedor no duplica
# datos ni vuelve a crear tablas.
# ---------------------------------------------------------------------------
set -e

echo "Aplicando migraciones..."
node ./node_modules/typeorm/cli.js migration:run -d dist/database/data-source.js

if [ "${SEED_ON_STARTUP:-true}" = "true" ]; then
  echo "Sembrando catálogo de arranque..."
  node dist/database/seeds/run-seed.js
fi

echo "Arrancando la API..."
exec node dist/main
