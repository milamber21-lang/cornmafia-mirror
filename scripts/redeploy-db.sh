#!/usr/bin/env bash
# FILE: scripts/redeploy-db.sh

set -euo pipefail

# ---------- config ----------
DB_SVC=${DB_SVC:-cm-db}
CMS_SVC=${CMS_SVC:-cm-cms}
DB_USER=${DB_USER:-cm}
DB_NAME=${DB_NAME:-cm_cms}
SEED_DIR=${SEED_DIR:-apps/cms/seed-data}
MIGRATIONS_DIR=${MIGRATIONS_DIR:-apps/cms/src/migrations}

# Load order (parents -> children). No per-table truncates during import.
TABLES=(
  theme_tokens
  icons
  templates
  categories
  subcategories
  series
  pages
  media
  nav
  nav_items
  nav_items_subcategories
  nav_items_subcategories_pages
  footer
  footer_columns
  footer_columns_links
  footer_social
  discord_roles
  users
  wallets
  dao
  resources
)
# ----------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_DIR"

PSQL="docker compose exec -T ${DB_SVC} psql -U ${DB_USER} -d ${DB_NAME}"

say()  { printf "\033[1;36m%s\033[0m\n" "$*"; }
warn() { printf "\033[1;33m%s\033[0m\n" "$*"; }
err()  { printf "\033[1;31m%s\033[0m\n" "$*"; }

table_exists() {
  local T="$1"
  $PSQL -tAc "SELECT to_regclass('public.' || quote_ident('${T}')) IS NOT NULL" | grep -q t
}

table_count() {
  local T="$1"
  $PSQL -tAc "SELECT COUNT(*) FROM \"${T}\"" || echo 0
}

export_seed() {
  say "Step 0: Export current seed"
  mkdir -p "$SEED_DIR"
  echo "Exporting seed ▸ $SEED_DIR"
  for T in "${TABLES[@]}"; do
    if ! table_exists "$T"; then
      printf "  - %s (table missing, skipping)\n" "$T"
      continue
    fi
    local CNT
    CNT="$(table_count "$T" | tr -d '[:space:]')"
    if [[ "$CNT" == "0" || -z "$CNT" ]]; then
      printf "  - %s (empty, skipping export)\n" "$T"
      continue
    fi
    printf "  - %s...\n" "$T"
    $PSQL -qAt -c "COPY (
      SELECT COALESCE(json_agg(x), '[]'::json)
      FROM (SELECT * FROM \"${T}\" ORDER BY id) x
    ) TO STDOUT;" > "${SEED_DIR}/${T}.json"
  done
  echo "Export complete."
}

stop_cms() {
  say "Step 1: Stopping CMS to avoid races"
  docker compose stop "${CMS_SVC}" >/dev/null || true
}

drop_schema() {
  say "Step 2: Dropping & recreating public schema"
  docker compose exec -T "${DB_SVC}" sh -lc '
    psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d '"$DB_NAME"' -c "
      DROP SCHEMA public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO $POSTGRES_USER;
      GRANT ALL ON SCHEMA public TO public;
    "
  '
}

start_cms() {
  say "Step 3: Starting CMS container"
  docker compose up -d "${CMS_SVC}"
}

migrate() {
  say "Step 4: Regenerating & applying migrations"
  rm -rf "${MIGRATIONS_DIR:?}/"* 2>/dev/null || true
  mkdir -p "${MIGRATIONS_DIR}"
  cat > "${MIGRATIONS_DIR}/index.ts" <<'TS'
type UpFn = (...args: unknown[]) => unknown | Promise<unknown>;
type DownFn = (...args: unknown[]) => unknown | Promise<unknown>;

export interface Migration {
  slug: string;
  up: UpFn;
  down: DownFn;
}

const migrations: Migration[] = [];

export default migrations;
export { migrations };
TS
  docker compose exec -T "${CMS_SVC}" sh -lc 'AUTO_CREATE_ENUMS=1 npx payload migrate:create'
  docker compose exec -T "${CMS_SVC}" sh -lc 'npx payload migrate'
}

# One-shot global truncate: wipe everything ONCE after migrations, before imports.
truncate_all_tables() {
  say "Step 4.5: Truncating ALL public tables once (RESTART IDENTITY CASCADE)"
  $PSQL -v ON_ERROR_STOP=1 <<'SQL'
DO $$
DECLARE
  tbls text;
BEGIN
  SELECT string_agg(quote_ident(schemaname)||'.'||quote_ident(tablename), ', ')
  INTO tbls
  FROM pg_tables
  WHERE schemaname='public'
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE 'sql_%';
  IF tbls IS NOT NULL THEN
    EXECUTE 'TRUNCATE TABLE ' || tbls || ' RESTART IDENTITY CASCADE';
  END IF;
END
$$;
SQL
}

# --- JSON sanitizer to tolerate ugly exports (\n literals, trailing commas) ---
sanitize_json() {
  sed 's/\r//g' \
  | sed -E 's/\\n[[:space:]]*/ /g' \
  | sed -E 's/[[:space:]]+/ /g' \
  | sed -E 's/,([[:space:]]*\])/]/g' \
  | sed -E 's/,([[:space:]]*})/}/g' \
  | sed -E '1s/^\xef\xbb\xbf//'
}

compact_with_node() {
  local RAW="$1"
  docker compose exec -T "${CMS_SVC}" node -e '
    let input = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", c => input += c);
    process.stdin.on("end", () => {
      try {
        const parsed = JSON.parse(input);
        process.stdout.write(JSON.stringify(parsed));
      } catch (e) {
        process.stdout.write(input);
        process.stderr.write("WARN: JSON parse failed in node compact step: " + e.message + "\n");
      }
    });
  ' <<< "$RAW"
}

import_table() {
  local T="$1"
  local FILE="$SEED_DIR/$T.json"
  if [[ ! -f "$FILE" ]]; then
    printf "  - %s (seed missing, skipping)\n" "$T"
    return
  fi

  local RAW CLEAN COMPACT
  RAW="$(cat "$FILE")"
  CLEAN="$(printf '%s' "$RAW" | sanitize_json)"
  COMPACT="$(compact_with_node "$CLEAN")"

  if [[ -z "$COMPACT" || "$COMPACT" == "[]" ]]; then
    printf "  - %s (seed empty, skipping)\n" "$T"
    return
  fi

  if ! table_exists "$T"; then
    printf "  - %s (table missing after migrate, skipping)\n" "$T"
    return
  fi

  printf "  - %s...\n" "$T"
  # IMPORTANT: no per-table TRUNCATE here — we already wiped once globally.
  $PSQL -v ON_ERROR_STOP=1 <<SQL
WITH payload AS (
  SELECT '${COMPACT}'::json AS j
)
INSERT INTO "${T}"
SELECT * FROM json_populate_recordset(NULL::"${T}", (SELECT j FROM payload));
SQL
}

import_seed() {
  say "Step 5: Importing seed JSON (no truncates; order-respecting)"
  for T in "${TABLES[@]}"; do
    import_table "$T"
  done
  echo "Import complete."
}

reset_id_sequences() {
  say "Step 6: Resetting ID sequences to MAX(id)+1"
  $PSQL -v ON_ERROR_STOP=1 <<'SQL'
DO $$
DECLARE
  r record;
  seq text;
  max_id bigint;
BEGIN
  FOR r IN
    SELECT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name = 'id'
  LOOP
    -- Find the sequence attached to the id column (works for SERIAL and IDENTITY)
    seq := pg_get_serial_sequence('public.' || quote_ident(r.table_name), 'id');

    IF seq IS NULL THEN
      CONTINUE; -- table.id is not backed by a sequence
    END IF;

    EXECUTE 'SELECT COALESCE(MAX(id), 0) FROM ' || quote_ident(r.table_name)
      INTO max_id;

    -- Set sequence to max(id)+1 (or 1 if empty)
    EXECUTE 'SELECT setval(' || quote_literal(seq) || ', ' || (max_id + 1) || ', false)';
  END LOOP;
END
$$;
SQL
}

main() {
  say "=== Redeploy DB (seed dir: ${SEED_DIR}) ==="
  stop_cms
  export_seed
  drop_schema
  start_cms
  migrate
  truncate_all_tables
  import_seed
  reset_id_sequences 
  say "All done ✅"
}

main "$@"
