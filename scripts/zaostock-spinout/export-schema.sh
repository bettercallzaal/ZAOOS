#!/usr/bin/env bash
# Export schema for all stock_* tables from current ZAOOS Supabase project.
# Run after pg_dump is available locally + DATABASE_URL is set in env.
#
# Usage:
#   DATABASE_URL=postgresql://... bash export-schema.sh
#
# Output: schema-export.sql in this dir, ready to paste into NEW Supabase
# SQL Editor (with stock_ prefix stripped) for the zaostock project.

set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: set DATABASE_URL to your ZAOOS Supabase connection string"
  echo "Find it in: Supabase dashboard -> Project Settings -> Database -> Connection string -> URI"
  echo ""
  echo "Example:"
  echo "  DATABASE_URL='postgresql://postgres:PASS@db.efsx....supabase.co:5432/postgres' bash $0"
  exit 1
fi

OUT="$(dirname "$0")/schema-export.sql"

echo "Dumping schema for stock_* tables to $OUT..."

pg_dump "$DATABASE_URL" \
  --schema-only \
  --no-owner \
  --no-privileges \
  --table='public.stock_*' \
  > "$OUT"

echo ""
echo "Done. Review the file before pasting into the NEW Supabase project."
echo ""
echo "Next: strip the 'stock_' prefix from table + index names before pasting."
echo "      sed -i '' 's/stock_//g' $OUT"
echo ""
echo "Then in the NEW Supabase SQL Editor:"
echo "  1. Paste contents of $OUT"
echo "  2. Run"
echo "  3. Verify tables exist: SELECT tablename FROM pg_tables WHERE schemaname='public';"
