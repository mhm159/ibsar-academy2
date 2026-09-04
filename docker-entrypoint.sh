#!/bin/sh
# Dars Academy — container entrypoint
# - Persists the SQLite DB at /data/custom.db (named volume `manhal-db`)
# - Seeds it from the bundled copy on first boot
# - Keeps the schema in sync with `prisma db push`
# - Starts `next start` on port 3000

set -e

echo "[manhal] entrypoint: DATABASE_URL=$DATABASE_URL"

mkdir -p /data /data/media

if [ ! -f /data/custom.db ]; then
  echo "[manhal] no database found -> seeding from bundled copy"
  if [ -f /app/prisma/db/custom.db ]; then
    cp /app/prisma/db/custom.db /data/custom.db
    echo "[manhal] seeded /data/custom.db from image"
  else
    echo "[manhal] WARNING: no bundled database found; one will be created by prisma db push"
  fi
fi

echo "[manhal] syncing schema (prisma db push)"
npx prisma db push --accept-data-loss --skip-generate

echo "[manhal] starting app on :3000"
exec node node_modules/next/dist/bin/next start -p 3000
