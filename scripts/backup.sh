#!/usr/bin/env bash
# Logical backup of the Portex database. Schedule it (cron / your platform's job runner), ship the file off the machine
# (object storage) and keep managed-database point-in-time recovery enabled as well.
#   DATABASE_URL=postgres://... BACKUP_DIR=/backups KEEP_DAYS=14 ./scripts/backup.sh
set -euo pipefail
: "${DATABASE_URL:?set DATABASE_URL}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"
mkdir -p "$BACKUP_DIR"
FILE="$BACKUP_DIR/portex-$(date -u +%Y%m%dT%H%M%SZ).dump"
pg_dump --format=custom --no-owner --no-privileges "$DATABASE_URL" --file "$FILE"
# A dump that cannot be listed is not a backup.
pg_restore --list "$FILE" > /dev/null
find "$BACKUP_DIR" -name 'portex-*.dump' -mtime +"$KEEP_DAYS" -delete
echo "backup ok: $FILE ($(du -h "$FILE" | cut -f1))"
