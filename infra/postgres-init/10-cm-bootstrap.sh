# FILE: infra/postgres-init/10-cm-bootstrap.sh
# Language: Bash
# Initializes the Corn Mafia database on first PostgreSQL container creation.
# WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

#!/usr/bin/env bash
set -euo pipefail

BOOTSTRAP_ROOT="/cm-bootstrap"
BOOTSTRAP_SQL="${BOOTSTRAP_ROOT}/sql/cm_web.bootstrap.sql"
RESET_SQL="${BOOTSTRAP_ROOT}/scripts/db-reset-sequences.sql"
VERIFY_SQL="${BOOTSTRAP_ROOT}/scripts/db-bootstrap-verify.sql"

APP_ROLE="${CM_CLIENT_DB_USER:-cm_client}"
APP_PASSWORD="${CM_CLIENT_DB_PASSWORD:?CM_CLIENT_DB_PASSWORD must be set for DB bootstrap}"

if [[ "${POSTGRES_USER:-}" != "cm" ]]; then
	echo "ERROR: POSTGRES_USER must be cm for the current Corn Mafia bootstrap contract." >&2
	exit 1
fi

if [[ "${POSTGRES_DB:-}" != "cm_web" ]]; then
	echo "ERROR: POSTGRES_DB must be cm_web unless the bootstrap SQL has been regenerated for another DB name." >&2
	exit 1
fi

if [[ ! -f "$BOOTSTRAP_SQL" ]]; then
	echo "ERROR: Bootstrap SQL not found: $BOOTSTRAP_SQL" >&2
	exit 1
fi

if [[ ! -f "$RESET_SQL" ]]; then
	echo "ERROR: Sequence reset SQL not found: $RESET_SQL" >&2
	exit 1
fi

if [[ ! -f "$VERIFY_SQL" ]]; then
	echo "ERROR: Verification SQL not found: $VERIFY_SQL" >&2
	exit 1
fi

echo "==> Corn Mafia DB bootstrap: ensuring runtime role ${APP_ROLE}"

psql \
	--username "$POSTGRES_USER" \
	--dbname "$POSTGRES_DB" \
	--set ON_ERROR_STOP=1 \
	--set app_role="$APP_ROLE" \
	--set app_password="$APP_PASSWORD" <<'SQL'
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'app_role', :'app_password')
WHERE NOT EXISTS (
	SELECT 1
	FROM pg_catalog.pg_roles
	WHERE rolname = :'app_role'
)
\gexec

SELECT format('ALTER ROLE %I WITH LOGIN PASSWORD %L', :'app_role', :'app_password')
\gexec
SQL

echo "==> Corn Mafia DB bootstrap: importing schema and data"

psql \
	--username "$POSTGRES_USER" \
	--dbname "$POSTGRES_DB" \
	--set ON_ERROR_STOP=1 \
	--file "$BOOTSTRAP_SQL"

echo "==> Corn Mafia DB bootstrap: resetting sequences"

psql \
	--username "$POSTGRES_USER" \
	--dbname "$POSTGRES_DB" \
	--set ON_ERROR_STOP=1 \
	--file "$RESET_SQL"

echo "==> Corn Mafia DB bootstrap: running verification"

psql \
	--username "$POSTGRES_USER" \
	--dbname "$POSTGRES_DB" \
	--set ON_ERROR_STOP=1 \
	--file "$VERIFY_SQL"

echo "==> Corn Mafia DB bootstrap complete"

# WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
