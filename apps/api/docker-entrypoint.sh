#!/bin/sh
set -e

cd /app

echo "Running Prisma migrations..."
npx prisma migrate deploy

if [ "${RUN_SEED:-0}" = "1" ]; then
  echo "Seeding initial admin user..."
  node prisma/seed-prod.mjs
fi

exec "$@"
