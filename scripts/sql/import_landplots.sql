-- FILE: scripts/sql/import_landplots.sql
-- Language: SQL
-- Use this if you prefer to run from psql manually (outside the shell script).
-- Adjust service/user/db as needed and run:
-- docker compose exec -T cm-db psql -U $POSTGRES_USER -d $POSTGRES_DB -f /scripts/sql/import_landplots.sql

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

-- Load the file from STDIN:
-- \copy landplots_stage FROM '/path/on/this/container.csv' WITH (FORMAT csv, HEADER true)

UPDATE resources AS r
SET
  sector       = s.sector,
  district     = s.district,
  house_number = s.house_number,
  town         = s.town,
  size         = s.size,
  latitude     = s.latitude,
  longitude    = s.longitude,
  rotation     = s.rotation,
  resource_type= 'Land plot',
  inserted_at  = NOW()
FROM landplots_stage AS s
WHERE r.resource_id = s.id::numeric;

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

DROP TABLE IF EXISTS landplots_stage;
