#!/usr/bin/env bash
# //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
# //// FILE: infra/bootstrap/scripts/db-bootstrap.sh                                                             ////
# //// Language: Bash                                                                                            ////
# //// Creates an absent Corn Mafia database from the repo env taxonomy and verifies preserved-ID bootstrap.      ////
# //// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
# //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BOOTSTRAP_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$BOOTSTRAP_ROOT/../.." && pwd)"

function load_env_file() {
	local env_file="$1"
	[[ -f "$env_file" ]] || { echo "ERROR: Environment file not found: $env_file" >&2; exit 1; }
	set -a
	# shellcheck source=/dev/null
	source "$env_file"
	set +a
}

if [[ -n "${CM_BOOTSTRAP_ENV:-}" ]]; then
	load_env_file "$CM_BOOTSTRAP_ENV"
elif [[ -f "$REPO_ROOT/.env.bootstrap" ]]; then
	load_env_file "$REPO_ROOT/.env.bootstrap"
elif [[ -f "$REPO_ROOT/.env" ]]; then
	load_env_file "$REPO_ROOT/.env"
fi

function first_non_empty() {
	local value
	for value in "$@"; do
		if [[ -n "$value" ]]; then
			echo "$value"
			return 0
		fi
	done

	return 1
}

function port_bind_host() {
	local value="${POSTGRES_PORT_BIND:-}"
	if [[ "$value" == *":"* ]]; then
		local host_part="${value%:*}"
		if [[ -n "$host_part" ]]; then
			echo "$host_part"
			return 0
		fi
	fi

	echo "localhost"
}

function port_bind_port() {
	local value="${POSTGRES_PORT_BIND:-}"
	if [[ "$value" == *":"* ]]; then
		local port_part="${value##*:}"
		if [[ -n "$port_part" ]]; then
			echo "$port_part"
			return 0
		fi
	elif [[ -n "$value" ]]; then
		echo "$value"
		return 0
	fi

	echo "5432"
}

function resolve_repo_path() {
	local raw_path="$1"
	if [[ -z "$raw_path" ]]; then
		return 1
	fi

	if [[ "$raw_path" == /* ]]; then
		echo "$raw_path"
	else
		echo "$REPO_ROOT/$raw_path"
	fi
}

CM_POSTGRES_HOST="$(first_non_empty "${CM_POSTGRES_HOST:-}" "$(port_bind_host)")"
CM_POSTGRES_PORT="$(first_non_empty "${CM_POSTGRES_PORT:-}" "$(port_bind_port)")"
CM_POSTGRES_ADMIN_DB="${CM_POSTGRES_ADMIN_DB:-postgres}"
CM_POSTGRES_ADMIN_USER="$(first_non_empty "${CM_POSTGRES_ADMIN_USER:-}" "${POSTGRES_USER:-}" "cm")"
CM_POSTGRES_ADMIN_PASSWORD="$(first_non_empty "${CM_POSTGRES_ADMIN_PASSWORD:-}" "${POSTGRES_PASSWORD:-}" "${PGPASSWORD:-}" || true)"

CM_DB_NAME="$(first_non_empty "${CM_DB_NAME:-}" "${POSTGRES_DB:-}" "cm_web")"
CM_DB_OWNER="$(first_non_empty "${CM_DB_OWNER:-}" "${POSTGRES_USER:-}" "cm")"
CM_DB_APP_USER="$(first_non_empty "${CM_DB_APP_USER:-}" "${CM_CLIENT_DB_USER:-}" "cm_client")"
CM_DB_OWNER_PASSWORD="$(first_non_empty "${CM_DB_OWNER_PASSWORD:-}" "${POSTGRES_PASSWORD:-}" || true)"
CM_DB_APP_PASSWORD="$(first_non_empty "${CM_DB_APP_PASSWORD:-}" "${CM_CLIENT_DB_PASSWORD:-}" || true)"

CM_BOOTSTRAP_SQL="${CM_BOOTSTRAP_SQL:-$BOOTSTRAP_ROOT/sql/cm_web.bootstrap.sql}"
CM_SEQUENCE_RESET_SQL="${CM_SEQUENCE_RESET_SQL:-$BOOTSTRAP_ROOT/scripts/db-reset-sequences.sql}"
CM_VERIFY_SQL="${CM_VERIFY_SQL:-$BOOTSTRAP_ROOT/scripts/db-bootstrap-verify.sql}"
CM_BOOTSTRAP_MANIFEST="${CM_BOOTSTRAP_MANIFEST:-$BOOTSTRAP_ROOT/manifests/MANIFEST.tsv}"
CM_COPY_MEDIA="${CM_COPY_MEDIA:-1}"
CM_VERIFY_MEDIA="${CM_VERIFY_MEDIA:-1}"
CM_BOOTSTRAP_IMPORT_TIMEOUT="${CM_BOOTSTRAP_IMPORT_TIMEOUT:-0}"

if [[ -z "${CM_MEDIA_SOURCE:-}" ]]; then
	CM_MEDIA_SOURCE="$(resolve_repo_path "${WEB_MEDIA_HOST_DIR:-data/media}")"
fi

if [[ -z "${CM_MEDIA_TARGET:-}" ]]; then
	CM_MEDIA_TARGET="$(resolve_repo_path "${WEB_MEDIA_HOST_DIR:-data/media}")"
fi

function fail() {
	echo "ERROR: $*" >&2
	exit 1
}

function info() {
	echo "==> $*"
}

function require_command() {
	command -v "$1" >/dev/null 2>&1 || fail "Required command not found: $1"
}

function require_file() {
	[[ -f "$1" ]] || fail "Required file not found: $1"
}

function require_original_role_names() {
	[[ "$CM_DB_OWNER" == "cm" ]] || fail "This bootstrap bundle preserves original owner role name cm. Received owner role: $CM_DB_OWNER."
	[[ "$CM_DB_APP_USER" == "cm_client" ]] || fail "This bootstrap bundle preserves original runtime role name cm_client. Received runtime role: $CM_DB_APP_USER."
}

function require_passwords_for_import() {
	[[ -n "$CM_POSTGRES_ADMIN_PASSWORD" ]] || fail "POSTGRES_PASSWORD or CM_POSTGRES_ADMIN_PASSWORD is required for bootstrap admin connection."
	[[ -n "$CM_DB_OWNER_PASSWORD" ]] || fail "POSTGRES_PASSWORD or CM_DB_OWNER_PASSWORD is required when creating/importing the database."
	[[ -n "$CM_DB_APP_PASSWORD" ]] || fail "CM_CLIENT_DB_PASSWORD or CM_DB_APP_PASSWORD is required when creating/importing the database."
}

function psql_admin() {
	PGPASSWORD="$CM_POSTGRES_ADMIN_PASSWORD" psql \
		--host "$CM_POSTGRES_HOST" \
		--port "$CM_POSTGRES_PORT" \
		--username "$CM_POSTGRES_ADMIN_USER" \
		--dbname "$CM_POSTGRES_ADMIN_DB" \
		--set ON_ERROR_STOP=1 \
		"$@"
}

function psql_admin_target() {
	PGPASSWORD="$CM_POSTGRES_ADMIN_PASSWORD" psql \
		--host "$CM_POSTGRES_HOST" \
		--port "$CM_POSTGRES_PORT" \
		--username "$CM_POSTGRES_ADMIN_USER" \
		--dbname "$CM_DB_NAME" \
		--set ON_ERROR_STOP=1 \
		"$@"
}

function psql_owner_target() {
	PGPASSWORD="$CM_DB_OWNER_PASSWORD" psql \
		--host "$CM_POSTGRES_HOST" \
		--port "$CM_POSTGRES_PORT" \
		--username "$CM_DB_OWNER" \
		--dbname "$CM_DB_NAME" \
		--set ON_ERROR_STOP=1 \
		"$@"
}

function get_database_exists() {
	psql_admin \
		--tuples-only \
		--no-align \
		--set db_name="$CM_DB_NAME" \
		--command "SELECT CASE WHEN EXISTS (SELECT 1 FROM pg_catalog.pg_database WHERE datname = :'db_name') THEN '1' ELSE '0' END;"
}

function get_project_schema_count() {
	psql_admin_target \
		--tuples-only \
		--no-align \
		--command "SELECT COUNT(*) FROM pg_catalog.pg_namespace WHERE nspname IN ('web_priv', 'web_api', 'web_view');"
}

function create_or_update_roles() {
	info "Ensuring original PostgreSQL roles exist: cm and cm_client"
	psql_admin \
		--set db_owner="$CM_DB_OWNER" \
		--set db_owner_password="$CM_DB_OWNER_PASSWORD" \
		--set db_app_user="$CM_DB_APP_USER" \
		--set db_app_password="$CM_DB_APP_PASSWORD" <<'SQL'
SELECT pg_catalog.format('CREATE ROLE %I WITH LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE INHERIT', :'db_owner', :'db_owner_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = :'db_owner')
\gexec

SELECT pg_catalog.format('ALTER ROLE %I WITH LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE INHERIT', :'db_owner', :'db_owner_password')
\gexec

SELECT pg_catalog.format('CREATE ROLE %I WITH LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE INHERIT', :'db_app_user', :'db_app_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = :'db_app_user')
\gexec

SELECT pg_catalog.format('ALTER ROLE %I WITH LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE INHERIT', :'db_app_user', :'db_app_password')
\gexec
SQL
}

function create_database_if_missing() {
	info "Creating database $CM_DB_NAME if missing"
	psql_admin \
		--set db_name="$CM_DB_NAME" \
		--set db_owner="$CM_DB_OWNER" <<'SQL'
SELECT pg_catalog.format('CREATE DATABASE %I WITH OWNER %I ENCODING %L TEMPLATE template0', :'db_name', :'db_owner', 'UTF8')
WHERE NOT EXISTS (SELECT 1 FROM pg_catalog.pg_database WHERE datname = :'db_name')
\gexec
SQL
}

function ensure_existing_empty_database_owner() {
	info "Ensuring empty existing database $CM_DB_NAME is owned by cm"
	psql_admin \
		--set db_name="$CM_DB_NAME" \
		--set db_owner="$CM_DB_OWNER" <<'SQL'
SELECT pg_catalog.format('ALTER DATABASE %I OWNER TO %I', :'db_name', :'db_owner')
\gexec
SQL
}

function import_bootstrap_sql() {
	info "Importing ID-preserving bootstrap SQL into $CM_DB_NAME"
	PGOPTIONS="-c statement_timeout=${CM_BOOTSTRAP_IMPORT_TIMEOUT}" psql_owner_target \
		--single-transaction \
		--file "$CM_BOOTSTRAP_SQL"
}

function reset_sequences() {
	info "Resetting sequences after preserved-ID import"
	psql_owner_target --file "$CM_SEQUENCE_RESET_SQL"
}

function run_database_verification() {
	info "Running bootstrap database verification"
	psql_admin_target --file "$CM_VERIFY_SQL"
}

function copy_media_payload() {
	if [[ "$CM_COPY_MEDIA" != "1" ]]; then
		info "Skipping media copy because CM_COPY_MEDIA=$CM_COPY_MEDIA"
		return
	fi

	if [[ ! -d "$CM_MEDIA_SOURCE" ]]; then
		fail "Media source directory does not exist: $CM_MEDIA_SOURCE"
	fi

	local source_real
	local target_real
	source_real="$(cd "$CM_MEDIA_SOURCE" && pwd)"
	mkdir -p "$CM_MEDIA_TARGET"
	target_real="$(cd "$CM_MEDIA_TARGET" && pwd)"

	if [[ "$source_real" == "$target_real" ]]; then
		info "Media source and target are the same; keeping existing media at $target_real"
		return
	fi

	info "Copying media payload from $source_real to $target_real"
	if command -v rsync >/dev/null 2>&1; then
		rsync -a "$source_real/" "$target_real/"
	else
		(cd "$source_real" && tar -cf - .) | (cd "$target_real" && tar -xf -)
	fi
}

function verify_media_payload() {
	if [[ "$CM_VERIFY_MEDIA" != "1" ]]; then
		info "Skipping media verification because CM_VERIFY_MEDIA=$CM_VERIFY_MEDIA"
		return
	fi

	if [[ ! -d "$CM_MEDIA_TARGET" ]]; then
		fail "Media target directory does not exist: $CM_MEDIA_TARGET"
	fi

	info "Verifying media files referenced by web_priv.web_media"
	local missing_count=0
	local total_count=0
	while IFS= read -r rel_path; do
		[[ -n "$rel_path" ]] || continue
		if [[ "$rel_path" == /* || "$rel_path" == *".."* ]]; then
			echo "Invalid media path in DB: $rel_path" >&2
			missing_count=$((missing_count + 1))
			continue
		fi
		total_count=$((total_count + 1))
		if [[ ! -f "$CM_MEDIA_TARGET/$rel_path" ]]; then
			echo "Missing media file: $CM_MEDIA_TARGET/$rel_path" >&2
			missing_count=$((missing_count + 1))
		fi
	done < <(psql_admin_target --tuples-only --no-align --command "SELECT storage_rel_path FROM web_priv.web_media ORDER BY storage_rel_path;")

	if [[ "$missing_count" -ne 0 ]]; then
		fail "Media verification failed: $missing_count missing or invalid files out of $total_count DB media rows."
	fi

	info "Media verification passed for $total_count DB media rows."
}

function main() {
	require_command psql
	require_file "$CM_BOOTSTRAP_SQL"
	require_file "$CM_SEQUENCE_RESET_SQL"
	require_file "$CM_VERIFY_SQL"
	require_file "$CM_BOOTSTRAP_MANIFEST"
	require_original_role_names

	info "Bootstrap target database: $CM_DB_NAME"
	info "PostgreSQL endpoint: $CM_POSTGRES_HOST:$CM_POSTGRES_PORT"
	info "PostgreSQL admin user: $CM_POSTGRES_ADMIN_USER"
	info "Owner/runtime roles: $CM_DB_OWNER / $CM_DB_APP_USER"
	info "Media target: $CM_MEDIA_TARGET"
	info "Bootstrap manifest: $CM_BOOTSTRAP_MANIFEST"

	local database_exists
	database_exists="$(get_database_exists | tr -d '[:space:]')"

	if [[ "$database_exists" == "0" ]]; then
		require_passwords_for_import
		create_or_update_roles
		create_database_if_missing
		import_bootstrap_sql
		reset_sequences
		run_database_verification
		copy_media_payload
		verify_media_payload
		info "Bootstrap completed for new database $CM_DB_NAME."
		return
	fi

	if [[ "$database_exists" != "1" ]]; then
		fail "Could not determine database existence for $CM_DB_NAME."
	fi

	local schema_count
	schema_count="$(get_project_schema_count | tr -d '[:space:]')"
	case "$schema_count" in
		0)
			require_passwords_for_import
			create_or_update_roles
			ensure_existing_empty_database_owner
			import_bootstrap_sql
			reset_sequences
			run_database_verification
			copy_media_payload
			verify_media_payload
			info "Bootstrap completed for existing empty database $CM_DB_NAME."
			;;
		3)
			info "Database $CM_DB_NAME already contains project schemas; import skipped."
			run_database_verification
			copy_media_payload
			verify_media_payload
			info "Existing database verification completed."
			;;
		*)
			fail "Database $CM_DB_NAME exists in partial/unknown state: found $schema_count of 3 project schemas. Manual review required."
			;;
	esac
}

main "$@"
