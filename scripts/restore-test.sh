#!/usr/bin/env bash
# Restores a dump into a throwaway database and checks the data is really there. Run it regularly (monthly at minimum).
#   ADMIN_URL=postgres://user:pw@host:5432/postgres ./scripts/restore-test.sh backups/portex-XXXX.dump
set -euo pipefail
DUMP="${1:?usage: restore-test.sh <dump file>}"
: "${ADMIN_URL:?set ADMIN_URL (a connection to the 'postgres' database)}"
DB="portex_restore_$(date +%s)"
psql "$ADMIN_URL" -qc "CREATE DATABASE $DB"
trap 'psql "$ADMIN_URL" -qc "DROP DATABASE IF EXISTS $DB" >/dev/null' EXIT
TARGET="${ADMIN_URL%/*}/$DB"
pg_restore --no-owner --dbname "$TARGET" "$DUMP"
psql "$TARGET" -Atc "SELECT 'orders=' || count(*) FROM orders" -c "SELECT 'users=' || count(*) FROM users" -c "SELECT 'invoices=' || count(*) FROM invoices" -c "SELECT 'migrations=' || count(*) FROM schema_migrations"
# Core tables must exist and the migration ledger must not be empty.
for t in users orders payments invoices schema_migrations; do
  psql "$TARGET" -Atc "SELECT to_regclass('public.$t') IS NOT NULL" | grep -q t || { echo "MISSING TABLE: $t"; exit 1; }
done
psql "$TARGET" -Atc "SELECT count(*) > 0 FROM schema_migrations" | grep -q t || { echo "EMPTY MIGRATION LEDGER"; exit 1; }
echo "restore test passed for $DUMP"
