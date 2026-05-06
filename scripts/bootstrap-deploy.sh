#!/usr/bin/env bash
# //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
# //// FILE: scripts/bootstrap-deploy.sh                                                                          ////
# //// Language: Bash                                                                                            ////
# //// Guided root-directory deploy/update script for non-technical Corn Mafia hosts.                             ////
# //// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
# //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

set -Eeuo pipefail

readonly CM_REPO_URL_DEFAULT="https://github.com/milamber21-lang/cornmafia-mirror.git"
readonly CM_REPO_BRANCH_DEFAULT="main"
readonly CM_WEB_UID_DEFAULT="10001"
readonly CM_WEB_GID_DEFAULT="10001"
readonly CADDYFILE_PATH_DEFAULT="/etc/caddy/Caddyfile"
readonly CADDY_CONF_DIR_DEFAULT="/etc/caddy/conf.d"
readonly CADDY_MANAGED_FILE_DEFAULT="/etc/caddy/conf.d/cornmafia.caddy"

REPO_ROOT="$(pwd -P)"
ENV_FILE="$REPO_ROOT/.env"
REPO_URL="${CM_REPO_URL:-$CM_REPO_URL_DEFAULT}"
REPO_BRANCH="${CM_REPO_BRANCH:-$CM_REPO_BRANCH_DEFAULT}"
CM_WEB_UID="${CM_WEB_UID:-$CM_WEB_UID_DEFAULT}"
CM_WEB_GID="${CM_WEB_GID:-$CM_WEB_GID_DEFAULT}"
CADDYFILE_PATH="${CM_CADDYFILE_PATH:-$CADDYFILE_PATH_DEFAULT}"
CADDY_CONF_DIR="${CM_CADDY_CONF_DIR:-$CADDY_CONF_DIR_DEFAULT}"
CADDY_MANAGED_FILE="${CM_CADDY_MANAGED_FILE:-$CADDY_MANAGED_FILE_DEFAULT}"
ENV_BACKUP_CREATED="0"

function fail() {
	printf 'ERROR: %s\n' "$*" >&2
	exit 1
}

function warn() {
	printf 'WARN: %s\n' "$*" >&2
}

function info() {
	printf '\n==> %s\n' "$*"
}

function require_root() {
	if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
		fail "Run this script with sudo from the Corn Mafia repo root: sudo bash scripts/bootstrap-deploy.sh"
	fi
}

function require_safe_repo_root() {
	case "$REPO_ROOT" in
		/|/root|/home|/tmp|/var|/etc|/usr|/opt)
			fail "Refusing to run from unsafe directory: $REPO_ROOT. Create/use a dedicated Corn Mafia directory and put .env there."
			;;
	esac

	[[ -f "$ENV_FILE" ]] || fail "Missing $ENV_FILE. Put the prepared .env file in this directory before running."
}

function command_exists() {
	command -v "$1" >/dev/null 2>&1
}

function have_apt() {
	command_exists apt-get
}

function apt_install_packages() {
	local packages=("$@")
	[[ "${#packages[@]}" -gt 0 ]] || return 0

	if ! have_apt; then
		fail "Missing required command/package and apt-get is not available. Install manually: ${packages[*]}"
	fi

	info "Installing required host packages: ${packages[*]}"
	DEBIAN_FRONTEND=noninteractive apt-get update
	DEBIAN_FRONTEND=noninteractive apt-get install -y "${packages[@]}"
}

function ensure_basic_commands() {
	local missing=()
	local command_name
	for command_name in git rsync curl awk sed grep tar; do
		if ! command_exists "$command_name"; then
			missing+=("$command_name")
		fi
	done

	if [[ "${#missing[@]}" -gt 0 ]]; then
		apt_install_packages "${missing[@]}"
	fi
}

function ensure_psql() {
	if command_exists psql; then
		return 0
	fi

	apt_install_packages postgresql-client
}

function ensure_caddy() {
	if command_exists caddy; then
		info "Caddy is already installed."
		return 0
	fi

	if ! have_apt; then
		fail "Caddy is not installed and this installer only auto-installs Caddy on apt-based hosts. Install Caddy manually and rerun."
	fi

	info "Installing Caddy from the official Caddy apt repository."
	apt_install_packages debian-keyring debian-archive-keyring apt-transport-https curl gnupg

	install -d -m 0755 /usr/share/keyrings /etc/apt/sources.list.d
	curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
		| gpg --batch --yes --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
	curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
		-o /etc/apt/sources.list.d/caddy-stable.list

	DEBIAN_FRONTEND=noninteractive apt-get update
	DEBIAN_FRONTEND=noninteractive apt-get install -y caddy
}

function ensure_docker() {
	command_exists docker || fail "Docker is not installed. Install Docker Engine with the Docker Compose plugin, then rerun this script."
	docker compose version >/dev/null 2>&1 || fail "Docker Compose v2 plugin is not available. Install the Docker Compose plugin, then rerun this script."
	docker info >/dev/null 2>&1 || fail "Docker daemon is not running or this user cannot access it. Start Docker, then rerun this script."
	info "Docker and Docker Compose are available."
}

function invoking_owner_spec() {
	local owner_uid="${SUDO_UID:-}"
	local owner_gid="${SUDO_GID:-}"
	if [[ -n "$owner_uid" && -n "$owner_gid" && "$owner_uid" != "0" ]]; then
		printf '%s:%s\n' "$owner_uid" "$owner_gid"
		return 0
	fi

	return 1
}

function restore_repo_file_ownership() {
	local owner_spec
	if ! owner_spec="$(invoking_owner_spec)"; then
		return 0
	fi

	info "Restoring repository file ownership to sudo caller $owner_spec, excluding data/."
	find "$REPO_ROOT" -mindepth 1 -maxdepth 1 \
		! -name data \
		-exec chown -R "$owner_spec" {} +
}

function script_relative_path() {
	local script_path
	script_path="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)/$(basename "${BASH_SOURCE[0]}")"
	case "$script_path" in
		"$REPO_ROOT"/*)
			printf '%s\n' "${script_path#"$REPO_ROOT/"}"
			;;
		*)
			printf '%s\n' "$(basename "$script_path")"
			;;
	esac
}

function update_existing_git_repo() {
	info "Updating existing git repository from $REPO_URL ($REPO_BRANCH)."
	git config --global --add safe.directory "$REPO_ROOT" >/dev/null 2>&1 || true

	if git remote get-url origin >/dev/null 2>&1; then
		git remote set-url origin "$REPO_URL"
	else
		git remote add origin "$REPO_URL"
	fi

	git fetch --prune origin "$REPO_BRANCH"
	git checkout -B "$REPO_BRANCH" "origin/$REPO_BRANCH"
	git reset --hard "origin/$REPO_BRANCH"

	local script_rel
	script_rel="$(script_relative_path)"
	git clean -fd \
		-e .env \
		-e '.env.*' \
		-e data \
		-e logs \
		-e "$script_rel" \
		-e "$(basename "$script_rel")"
}

function clone_repo_into_current_directory() {
	info "This directory is not a git checkout. Cloning $REPO_URL ($REPO_BRANCH) into it while preserving .env and data/."
	local temp_dir
	temp_dir="$(mktemp -d)"

	git clone --branch "$REPO_BRANCH" --depth 1 "$REPO_URL" "$temp_dir/repo"

	local script_rel
	script_rel="$(script_relative_path)"
	rsync -a --delete \
		--exclude '.env' \
		--exclude '.env.*' \
		--exclude 'data/' \
		--exclude 'logs/' \
		--exclude "$script_rel" \
		--exclude "$(basename "$script_rel")" \
		"$temp_dir/repo/" "$REPO_ROOT/"
	rm -rf "$temp_dir"
}

function sync_repo_from_main() {
	if [[ -d "$REPO_ROOT/.git" ]]; then
		update_existing_git_repo
	else
		clone_repo_into_current_directory
	fi

	restore_repo_file_ownership
}

function load_env() {
	[[ -f "$ENV_FILE" ]] || fail "Missing env file: $ENV_FILE"
	set -a
	# shellcheck source=/dev/null
	source "$ENV_FILE"
	set +a
}

function backup_env_once() {
	if [[ "$ENV_BACKUP_CREATED" == "1" ]]; then
		return 0
	fi

	local backup_path
	backup_path="$ENV_FILE.bootstrap-deploy.$(date +%Y%m%d%H%M%S).bak"
	cp -a "$ENV_FILE" "$backup_path"
	info "Backed up .env to $backup_path"
	ENV_BACKUP_CREATED="1"
}

function set_env_value() {
	local key="$1"
	local value="$2"
	[[ "$key" =~ ^[A-Z0-9_]+$ ]] || fail "Invalid env key for update: $key"

	backup_env_once

	local temp_file
	temp_file="$(mktemp)"
	awk -v key="$key" -v line="$key=$value" '
		BEGIN { done = 0 }
		$0 ~ "^[[:space:]]*" key "=" {
			if (done == 0) {
				print line
				done = 1
			}
			next
		}
		{ print }
		END {
			if (done == 0) {
				print line
			}
		}
	' "$ENV_FILE" > "$temp_file"
	cat "$temp_file" > "$ENV_FILE"
	rm -f "$temp_file"
}

function ensure_env_value() {
	local key="$1"
	local desired_value="$2"
	local current_value="${!key:-}"
	if [[ "$current_value" == "$desired_value" ]]; then
		return 0
	fi

	if [[ -n "$current_value" ]]; then
		warn "Updating $key from $current_value to $desired_value"
	else
		info "Setting missing $key=$desired_value"
	fi
	set_env_value "$key" "$desired_value"
}

function resolve_repo_path() {
	local raw_path="$1"
	if [[ -z "$raw_path" ]]; then
		return 1
	fi

	if [[ "$raw_path" == /* ]]; then
		printf '%s\n' "$raw_path"
	else
		printf '%s\n' "$REPO_ROOT/${raw_path#./}"
	fi
}

function extract_domain_from_url() {
	local raw_value="$1"
	[[ -n "$raw_value" ]] || return 1
	raw_value="${raw_value#http://}"
	raw_value="${raw_value#https://}"
	raw_value="${raw_value%%/*}"
	raw_value="${raw_value%%:*}"
	raw_value="${raw_value#www.}"
	printf '%s\n' "$raw_value" | tr '[:upper:]' '[:lower:]'
}

function domain_is_valid() {
	local raw_value="$1"
	[[ "$raw_value" =~ ^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$ ]]
}

function normalize_domain() {
	local raw_value="$1"
	raw_value="$(extract_domain_from_url "$raw_value")"
	if ! domain_is_valid "$raw_value"; then
		fail "Invalid domain: $raw_value. Use a plain domain like example.com, without https:// or a path."
	fi
	printf '%s\n' "$raw_value"
}

function choose_domain() {
	local detected_domain=""
	if [[ -n "${WEB_PUBLIC_URL:-}" ]]; then
		detected_domain="$(extract_domain_from_url "$WEB_PUBLIC_URL")"
	elif [[ -n "${NEXTAUTH_URL:-}" ]]; then
		detected_domain="$(extract_domain_from_url "$NEXTAUTH_URL")"
	elif [[ -n "${NEXT_PUBLIC_BASE_URL:-}" ]]; then
		detected_domain="$(extract_domain_from_url "$NEXT_PUBLIC_BASE_URL")"
	fi

	if [[ -n "$detected_domain" && "$detected_domain" != "localhost" ]] && domain_is_valid "$detected_domain"; then
		DEPLOY_DOMAIN="$(normalize_domain "$detected_domain")"
		info "Using deployment domain from .env: $DEPLOY_DOMAIN"
		return 0
	fi

	if [[ -n "$detected_domain" ]]; then
		warn "The .env URL domain '$detected_domain' is not a public deployment domain."
	fi

	local raw_domain=""
	while [[ -z "$raw_domain" ]]; do
		read -r -p "Corn Mafia domain, no https:// and no path (example.com): " raw_domain
	done
	DEPLOY_DOMAIN="$(normalize_domain "$raw_domain")"
}

function ensure_url_env_values() {
	local public_url="https://$DEPLOY_DOMAIN"
	local port_value="${PORT:-5323}"

	ensure_env_value WEB_PUBLIC_URL "$public_url"
	ensure_env_value NEXTAUTH_URL "$public_url"
	ensure_env_value NEXT_PUBLIC_BASE_URL "$public_url"
	ensure_env_value WEB_INTERNAL_URL "http://cm-web:$port_value"
	ensure_env_value WEB_HOST_BIND "${WEB_HOST_BIND:-127.0.0.1}"
	ensure_env_value PORT "$port_value"
	ensure_env_value POSTGRES_PORT_BIND "${POSTGRES_PORT_BIND:-127.0.0.1:5432}"
	ensure_env_value POSTGRES_DATA_DIR "${POSTGRES_DATA_DIR:-./data/postgres}"
	ensure_env_value WEB_MEDIA_HOST_DIR "${WEB_MEDIA_HOST_DIR:-./data/media}"
	ensure_env_value WEB_CACHE_HOST_DIR "${WEB_CACHE_HOST_DIR:-./data/web_cache}"
}

function require_env_key() {
	local key="$1"
	local value="${!key:-}"
	[[ -n "$value" ]] || fail "Missing required .env value: $key"
}

function validate_required_env() {
	local key
	for key in \
		POSTGRES_USER \
		POSTGRES_PASSWORD \
		POSTGRES_DB \
		CM_CLIENT_DB_USER \
		CM_CLIENT_DB_PASSWORD \
		WEB_DATABASE_URL \
		WEB_INTERNAL_URL \
		WEB_PUBLIC_URL \
		NEXTAUTH_URL \
		NEXT_PUBLIC_BASE_URL \
		NEXTAUTH_SECRET \
		REVALIDATE_TOKEN \
		DISCORD_CLIENT_ID \
		DISCORD_CLIENT_SECRET \
		DISCORD_BOT_TOKEN \
		DISCORD_GUILD_ID \
		WEB_HOST_BIND \
		PORT \
		POSTGRES_DATA_DIR \
		WEB_MEDIA_HOST_DIR \
		WEB_CACHE_HOST_DIR; do
		require_env_key "$key"
	done

	[[ "${POSTGRES_USER:-}" == "cm" ]] || fail "POSTGRES_USER must be cm for the current bootstrap contract."
	[[ "${POSTGRES_DB:-}" == "cm_web" ]] || fail "POSTGRES_DB must be cm_web unless bootstrap SQL has been regenerated."
	[[ "${CM_CLIENT_DB_USER:-}" == "cm_client" ]] || fail "CM_CLIENT_DB_USER must be cm_client for the current runtime contract."
}

function sync_bootstrap_media() {
	local target_dir
	target_dir="$(resolve_repo_path "${WEB_MEDIA_HOST_DIR:-./data/media}")"
	local cache_dir
	cache_dir="$(resolve_repo_path "${WEB_CACHE_HOST_DIR:-./data/web_cache}")"
	local postgres_dir
	postgres_dir="$(resolve_repo_path "${POSTGRES_DATA_DIR:-./data/postgres}")"

	mkdir -p "$target_dir" "$cache_dir" "$postgres_dir"

	local source_dir="$REPO_ROOT/infra/bootstrap/media"
	if [[ -d "$source_dir" ]]; then
		info "Syncing bootstrap media exception payload into $target_dir"
		rsync -a --ignore-existing "$source_dir/" "$target_dir/"
	else
		warn "No infra/bootstrap/media directory found. Continuing; DB media verification may fail if bootstrap media is required."
	fi

	info "Granting web container ownership on media/cache directories."
	chown -R "$CM_WEB_UID:$CM_WEB_GID" "$target_dir" "$cache_dir"
	chmod -R u+rwX,g+rwX "$target_dir" "$cache_dir"
}

function caddy_upstream_host() {
	local bind_host="${WEB_HOST_BIND:-127.0.0.1}"
	case "$bind_host" in
		0.0.0.0|::|'' )
			printf '127.0.0.1\n'
			;;
		*)
			printf '%s\n' "$bind_host"
			;;
	esac
}

function ensure_caddy_import() {
	install -d -m 0755 "$CADDY_CONF_DIR"
	if [[ ! -f "$CADDYFILE_PATH" ]]; then
		install -m 0644 /dev/null "$CADDYFILE_PATH"
	fi

	if grep -Eq '^[[:space:]]*import[[:space:]]+conf\.d/\*\.caddy' "$CADDYFILE_PATH"; then
		return 0
	fi

	local backup_path="$CADDYFILE_PATH.bootstrap-deploy.$(date +%Y%m%d%H%M%S).bak"
	cp -a "$CADDYFILE_PATH" "$backup_path"
	info "Backed up Caddyfile to $backup_path"
	{
		printf '\n'
		printf '# Corn Mafia managed site snippets.\n'
		printf 'import conf.d/*.caddy\n'
	} >> "$CADDYFILE_PATH"
}

function write_caddy_managed_config() {
	local upstream_host
	upstream_host="$(caddy_upstream_host)"
	local upstream_port="${PORT:-5323}"

	info "Writing managed Caddy config for $DEPLOY_DOMAIN -> $upstream_host:$upstream_port"
	install -d -m 0755 "$(dirname "$CADDY_MANAGED_FILE")"
	cat > "$CADDY_MANAGED_FILE" <<CADDY
# FILE: $CADDY_MANAGED_FILE
# Managed by Corn Mafia scripts/bootstrap-deploy.sh. Manual changes here may be overwritten.

$DEPLOY_DOMAIN, www.$DEPLOY_DOMAIN {
	encode zstd gzip
	reverse_proxy $upstream_host:$upstream_port
}
CADDY
}

function reload_caddy() {
	info "Validating and reloading Caddy."
	caddy validate --config "$CADDYFILE_PATH"
	if command_exists systemctl; then
		systemctl enable caddy >/dev/null 2>&1 || true
		if systemctl is-active --quiet caddy; then
			systemctl reload caddy || systemctl restart caddy
		else
			systemctl start caddy
		fi
	else
		warn "systemctl is not available. Start/reload Caddy manually with config: $CADDYFILE_PATH"
	fi
}

function wait_for_container_health() {
	local container_name="$1"
	local label="$2"
	local max_attempts="${3:-60}"
	local attempt=1
	local status=""

	info "Waiting for $label container health."
	while [[ "$attempt" -le "$max_attempts" ]]; do
		status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container_name" 2>/dev/null || true)"
		case "$status" in
			healthy|running)
				info "$label is $status."
				return 0
				;;
			unhealthy|exited|dead)
				docker logs --tail=120 "$container_name" >&2 || true
				fail "$label container became $status."
				;;
		esac
		sleep 2
		attempt=$((attempt + 1))
	done

	docker logs --tail=120 "$container_name" >&2 || true
	fail "$label container did not become healthy. Last status: ${status:-unknown}"
}

function require_bootstrap_files() {
	[[ -f "$REPO_ROOT/docker-compose.yml" ]] || fail "Missing docker-compose.yml after repo sync."
	[[ -f "$REPO_ROOT/infra/bootstrap/scripts/db-bootstrap.sh" ]] || fail "Missing infra/bootstrap/scripts/db-bootstrap.sh after repo sync."

	local required_bootstrap_file
	for required_bootstrap_file in \
		"$REPO_ROOT/infra/bootstrap/sql/cm_web.bootstrap.sql" \
		"$REPO_ROOT/infra/bootstrap/scripts/db-reset-sequences.sql" \
		"$REPO_ROOT/infra/bootstrap/scripts/db-bootstrap-verify.sql" \
		"$REPO_ROOT/infra/bootstrap/manifests/MANIFEST.tsv"; do
		[[ -f "$required_bootstrap_file" ]] || fail "Missing bootstrap file required for deploy: $required_bootstrap_file"
	done
}

function run_docker_deploy() {
	info "Building and starting Corn Mafia Docker services."
	cd "$REPO_ROOT"
	docker compose --env-file "$ENV_FILE" pull cm-db || warn "Could not pull cm-db image now; Docker may use the local image/cache."
	docker compose --env-file "$ENV_FILE" build cm-web
	docker compose --env-file "$ENV_FILE" up -d cm-db
	wait_for_container_health cm-db "PostgreSQL" 90

	info "Running database bootstrap/verification."
	CM_BOOTSTRAP_ENV="$ENV_FILE" bash "$REPO_ROOT/infra/bootstrap/scripts/db-bootstrap.sh"

	docker compose --env-file "$ENV_FILE" up -d cm-web
	wait_for_container_health cm-web "Web" 90
}

function local_smoke_test() {
	local port_value="${PORT:-5323}"
	info "Running local web smoke test on http://127.0.0.1:$port_value/"
	if curl -fsS "http://127.0.0.1:$port_value/" >/dev/null; then
		info "Local web smoke test passed."
	else
		warn "Local web smoke test failed. Check: docker compose logs --tail=120 cm-web"
	fi
}

function print_success() {
	cat <<SUCCESS

====================================================================================================
Corn Mafia deploy/update completed.

Public URL:
  https://$DEPLOY_DOMAIN

Useful commands:
  cd "$REPO_ROOT"
  docker compose ps
  docker compose logs --tail=120 cm-web
  docker compose logs --tail=120 cm-db
  sudo systemctl status caddy --no-pager
  sudo caddy validate --config "$CADDYFILE_PATH"

If the public URL does not load, confirm DNS for $DEPLOY_DOMAIN and www.$DEPLOY_DOMAIN points to this server
and that ports 80 and 443 are open.
====================================================================================================
SUCCESS
}

function main() {
	require_root
	require_safe_repo_root
	ensure_basic_commands
	sync_repo_from_main

	load_env
	choose_domain
	ensure_url_env_values
	load_env
	validate_required_env

	ensure_docker
	ensure_psql
	ensure_caddy
	require_bootstrap_files
	sync_bootstrap_media
	ensure_caddy_import
	write_caddy_managed_config
	run_docker_deploy
	reload_caddy
	local_smoke_test
	print_success
}

main "$@"
