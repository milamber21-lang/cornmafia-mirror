#!/usr/bin/env sh
# POSIX-safe: no 'pipefail' needed
set -eu

# === Config ===
CSV_PATH="/home/lilyserver/docker/cm/data/landplots.csv"
DB_SERVICE="${DB_SERVICE:-cm-db}"          # docker compose service name for Postgres
PGUSER="${POSTGRES_USER:-cm}"        # or whatever you set in compose
PGDB="${POSTGRES_DB:-cm_cms}"             # or whatever you set in compose

# === Sanity checks ===
if [ ! -f "$CSV_PATH" ]; then
  echo "CSV not found at: $CSV_PATH" >&2
  exit 1
fi

echo "Using Postgres service: $DB_SERVICE (user=$PGUSER db=$PGDB)"
echo "Importing CSV: $CSV_PATH"

# 1) Create a staging table (drop if exists)
docker compose exec -T "$DB_SERVICE" psql -U "$PGUSER" -d "$PGDB" -v ON_ERROR_STOP=1 <<'SQL'
DROP TABLE IF EXISTS landplots_stage;
CREATE TABLE landplots_stage (
  id           text,
  sector       text,
  district     text,
  house_number text,
  town         text,
  size         text,
  latitude     double precision,
  longitude    double precision,
  rotation     double precision
);
SQL

# 2) Stream the CSV into Postgres (no need to copy files into the container)
cat "$CSV_PATH" \
| docker compose exec -T "$DB_SERVICE" psql -U "$PGUSER" -d "$PGDB" \
  -v ON_ERROR_STOP=1 \
  -c "COPY landplots_stage FROM STDIN WITH (FORMAT csv, HEADER true)"

# 3a) Update existing rows (matched on legacy_id)
docker compose exec -T "$DB_SERVICE" psql -U "$PGUSER" -d "$PGDB" -v ON_ERROR_STOP=1 <<'SQL'
UPDATE resources AS r
SET
  sector        = s.sector,
  district      = s.district,
  house_number  = s.house_number,
  town          = s.town,
  size          = s.size,
  latitude      = s.latitude,
  longitude     = s.longitude,
  rotation      = s.rotation,
  resource_type = 'Land plot',
  inserted_at   = NOW()
FROM landplots_stage AS s
WHERE r.resource_id = s.id::numeric;
SQL

# 3b) Insert new rows (where legacy_id not found)
docker compose exec -T "$DB_SERVICE" psql -U "$PGUSER" -d "$PGDB" -v ON_ERROR_STOP=1 <<'SQL'
INSERT INTO resources
  (resource_id, resource_type, sector, district, house_number, town, size,
   latitude, longitude, rotation, inserted_at)
SELECT
  s.id::numeric,
  'Land plot',
  s.sector,
  s.district,
  s.house_number,
  s.town,
  s.size,
  s.latitude,
  s.longitude,
  s.rotation,
  NOW()
FROM landplots_stage AS s
WHERE NOT EXISTS (
  SELECT 1 FROM resources r WHERE r.resource_id = s.id::numeric
);
SQL

# 4) Drop staging
docker compose exec -T "$DB_SERVICE" psql -U "$PGUSER" -d "$PGDB" -v ON_ERROR_STOP=1 \
  -c "DROP TABLE IF EXISTS landplots_stage;"

echo "✅ Import complete."