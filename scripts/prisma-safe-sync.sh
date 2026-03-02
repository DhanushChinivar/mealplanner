#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required."
  echo "Example: export DATABASE_URL='postgresql://...'"
  exit 1
fi

if ! command -v npx >/dev/null 2>&1; then
  echo "npx is required to run Prisma commands."
  exit 1
fi

STAMP="$(date +%Y%m%d%H%M%S)"
NAME="${1:-reconcile_dev_schema}"
MIGRATION_ID="${STAMP}_${NAME}"
DIR="prisma/migrations/${MIGRATION_ID}"
SQL_FILE="${DIR}/migration.sql"

mkdir -p "$DIR"

echo "Generating reconciliation SQL from current DB -> prisma/schema.prisma ..."
npx prisma migrate diff \
  --from-url "$DATABASE_URL" \
  --to-schema-datamodel prisma/schema.prisma \
  --script > "$SQL_FILE"

if [[ ! -s "$SQL_FILE" ]]; then
  echo "No schema changes detected. Nothing to apply."
  rm -rf "$DIR"
  exit 0
fi

if grep -Eqi 'DROP TABLE|DROP COLUMN|TRUNCATE TABLE|DELETE FROM' "$SQL_FILE"; then
  if [[ "${ALLOW_DESTRUCTIVE:-0}" != "1" ]]; then
    echo "Potentially destructive SQL detected in $SQL_FILE."
    echo "Review it first. Re-run with ALLOW_DESTRUCTIVE=1 only if you are sure."
    exit 1
  fi
fi

echo "Applying reconciliation SQL ..."
npx prisma db execute --schema prisma/schema.prisma --file "$SQL_FILE"

echo "Marking migration as applied in Prisma history ..."
npx prisma migrate resolve --applied "$MIGRATION_ID"

echo "Generating Prisma client ..."
npx prisma generate

echo "Done. Created and applied migration: $MIGRATION_ID"
