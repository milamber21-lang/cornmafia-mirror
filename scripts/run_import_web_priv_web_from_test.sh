#!/usr/bin/env bash
# FILE: scripts/run_import_web_priv_web_from_test.sh
# Purpose: Run the web_priv.web_* data replacement import against the development PostgreSQL container.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SQL_FILE="$SCRIPT_DIR/import_web_priv_web_from_test.sql"
BACKUP_DIR="$REPO_DIR/migration-backups"

DB_CONTAINER="${DB_CONTAINER:-cm-db}"
DB_NAME="${DB_NAME:-cm_web}"
DB_USER="${DB_USER:-cm}"
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_web_priv_web_backup_$(date -u +%Y%m%dT%H%M%SZ).sql"

if ! command -v docker >/dev/null 2>&1; then
	DOCKER_CMD=(sudo docker)
elif docker ps >/dev/null 2>&1; then
	DOCKER_CMD=(docker)
else
	DOCKER_CMD=(sudo docker)
fi

if [[ ! -f "$SQL_FILE" ]]; then
	echo "Missing SQL file: $SQL_FILE" >&2
	exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "Target container: $DB_CONTAINER"
echo "Target database:  $DB_NAME"
echo "Target user:      $DB_USER"
echo "Backup file:      $BACKUP_FILE"
echo
echo "This will replace all web_priv.web_* table data in $DB_NAME."
echo "It will also upsert required auth_users and discord_users support rows from the test dump."
echo "This fixed version stages data first, then clears and replaces target web tables."
read -r -p "Type REPLACE-WEB-DATA to continue: " confirm

if [[ "$confirm" != "REPLACE-WEB-DATA" ]]; then
	echo "Cancelled."
	exit 1
fi

echo "Creating pre-migration backup of target web_priv.web_* plus support user rows..."
"${DOCKER_CMD[@]}" exec "$DB_CONTAINER" pg_dump 	-U "$DB_USER" 	-d "$DB_NAME" 	--data-only 	--column-inserts 	--table='web_priv.web_*' 	--table='web_priv.auth_users' 	--table='web_priv.discord_users' 	> "$BACKUP_FILE"

echo "Running import..."
"${DOCKER_CMD[@]}" exec -i "$DB_CONTAINER" psql 	-v ON_ERROR_STOP=1 	-U "$DB_USER" 	-d "$DB_NAME" 	< "$SQL_FILE"

echo "Done. Backup saved at: $BACKUP_FILE"
