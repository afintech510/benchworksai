#!/bin/bash
# =============================================================================
# Nightly PostgreSQL Backup Script for Larkin Tech
# Schedule via cron: 0 3 * * * /path/to/larkin-tech/scripts/backup.sh
# =============================================================================

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/larkintech}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/larkintech_${TIMESTAMP}.sql.gz"

# Supabase connection — reads from .env.local or environment
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

if [ -f "$PROJECT_DIR/.env.local" ]; then
  # shellcheck disable=SC1091
  source <(grep -E '^(SUPABASE_URL|SUPABASE_DB_URL)=' "$PROJECT_DIR/.env.local")
fi

DB_URL="${SUPABASE_DB_URL:-}"

if [ -z "$DB_URL" ]; then
  echo "[ERROR] SUPABASE_DB_URL not set. Add it to .env.local or export it."
  echo "  Format: postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"
  exit 1
fi

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

echo "[$(date -Iseconds)] Starting backup..."

# Dump database (schema + data, compressed)
pg_dump "$DB_URL" \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  --format=plain \
  | gzip > "$BACKUP_FILE"

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[$(date -Iseconds)] Backup complete: $BACKUP_FILE ($BACKUP_SIZE)"

# Verify backup is non-empty
if [ ! -s "$BACKUP_FILE" ]; then
  echo "[ERROR] Backup file is empty — check database connection."
  rm -f "$BACKUP_FILE"
  exit 1
fi

# Rotate old backups (keep last N days)
DELETED=$(find "$BACKUP_DIR" -name "larkintech_*.sql.gz" -mtime "+$RETENTION_DAYS" -print -delete | wc -l)
if [ "$DELETED" -gt 0 ]; then
  echo "[$(date -Iseconds)] Cleaned up $DELETED old backup(s) (older than ${RETENTION_DAYS} days)"
fi

# Summary
TOTAL_BACKUPS=$(find "$BACKUP_DIR" -name "larkintech_*.sql.gz" | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
echo "[$(date -Iseconds)] Backup directory: $TOTAL_BACKUPS backup(s), $TOTAL_SIZE total"
echo "[$(date -Iseconds)] Done."
