#!/usr/bin/env bash
# //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
# //// FILE: scripts/bootstrap-deploy.sh                                                                          ////
# //// Language: Bash                                                                                            ////
# //// Guided root-directory deploy/update script for non-technical Corn Mafia hosts.                             ////
# //// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
# //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

set -Eeuo pipefail

if [[ "${CM_BOOTSTRAP_SELF_REEXECED:-0}" != "1" ]]; then
	self_copy="$(mktemp /tmp/cm-bootstrap-deploy.XXXXXX.sh)"
	cp "$0" "$self_copy"
	chmod 0700 "$self_copy"
	export CM_BOOTSTRAP_SELF_REEXECED="1"
	exec bash "$self_copy" "$@"
fi

readonly CM_REPO_URL_DEFAULT="https://github.com/milamber21-lang/cornmafia-mirror.git"
readonly CM_REPO_BRANCH_DEFAULT="main"
readonly CM_REPO_ARCHIVE_URL_DEFAULT="https://github.com/milamber21-lang/cornmafia-mirror/archive/refs/heads/main.tar.gz"
readonly CM_REPO_ARCHIVE_FALLBACK_URL_DEFAULT="https://codeload.github.com/milamber21-lang/cornmafia-mirror/tar.gz/refs/heads/main"
readonly CM_REPO_ARCHIVE_FILE_DEFAULT=""
readonly CM_SOURCE_MODE_DEFAULT="archive"
readonly COMPOSE_PROJECT_NAME_DEFAULT="cm"
readonly CM_DB_SERVICE_NAME_DEFAULT="cm-db"
readonly CM_WEB_SERVICE_NAME_DEFAULT="cm-web"
readonly CM_DB_CONTAINER_NAME_DEFAULT="cm-db"
readonly CM_WEB_CONTAINER_NAME_DEFAULT="cm-web"
readonly CM_DB_NETWORK_ALIAS_DEFAULT="cm-db"
readonly CM_WEB_NETWORK_ALIAS_DEFAULT="cm-web"
readonly CM_NETWORK_NAME_DEFAULT="cm-internal"
readonly CM_COMPOSE_FILE_DEFAULT="./docker-compose.yml"
readonly CM_WEB_UID_DEFAULT="10001"
readonly CM_WEB_GID_DEFAULT="10001"
readonly CADDYFILE_PATH_DEFAULT="/etc/caddy/Caddyfile"
readonly CADDY_CONF_DIR_DEFAULT="/etc/caddy/conf.d"
readonly CADDY_MANAGED_FILE_DEFAULT="/etc/caddy/conf.d/cornmafia.caddy"

REPO_ROOT="$(pwd -P)"
ENV_FILE="$REPO_ROOT/.env"
REPO_URL="${CM_REPO_URL:-$CM_REPO_URL_DEFAULT}"
REPO_BRANCH="${CM_REPO_BRANCH:-$CM_REPO_BRANCH_DEFAULT}"
REPO_ARCHIVE_URL="${CM_REPO_ARCHIVE_URL:-$CM_REPO_ARCHIVE_URL_DEFAULT}"
REPO_ARCHIVE_FALLBACK_URL="${CM_REPO_ARCHIVE_FALLBACK_URL:-$CM_REPO_ARCHIVE_FALLBACK_URL_DEFAULT}"
REPO_ARCHIVE_FILE="${CM_REPO_ARCHIVE_FILE:-$CM_REPO_ARCHIVE_FILE_DEFAULT}"
SOURCE_MODE="${CM_SOURCE_MODE:-$CM_SOURCE_MODE_DEFAULT}"
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

function compose_project_name() {
	printf '%s\n' "${COMPOSE_PROJECT_NAME:-$COMPOSE_PROJECT_NAME_DEFAULT}"
}

function db_service_name() {
	printf '%s\n' "${CM_DB_SERVICE_NAME:-$CM_DB_SERVICE_NAME_DEFAULT}"
}

function web_service_name() {
	printf '%s\n' "${CM_WEB_SERVICE_NAME:-$CM_WEB_SERVICE_NAME_DEFAULT}"
}

function compose_file() {
	resolve_repo_path "$CM_COMPOSE_FILE_DEFAULT"
}

function db_container_name() {
	printf '%s\n' "${CM_DB_CONTAINER_NAME:-$CM_DB_CONTAINER_NAME_DEFAULT}"
}

function web_container_name() {
	printf '%s\n' "${CM_WEB_CONTAINER_NAME:-$CM_WEB_CONTAINER_NAME_DEFAULT}"
}

function db_network_alias() {
	printf '%s\n' "${CM_DB_NETWORK_ALIAS:-$CM_DB_NETWORK_ALIAS_DEFAULT}"
}

function web_network_alias() {
	printf '%s\n' "${CM_WEB_NETWORK_ALIAS:-$CM_WEB_NETWORK_ALIAS_DEFAULT}"
}

function docker_compose() {
	docker compose --env-file "$ENV_FILE" --project-name "$(compose_project_name)" -f "$(compose_file)" "$@"
}

function docker_compose_display_command() {
	printf 'docker compose --env-file .env --project-name %s -f ./docker-compose.yml' "$(compose_project_name)"
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
	for command_name in rsync curl awk sed grep tar find; do
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

function ensure_git_for_git_mode() {
	if command_exists git; then
		return 0
	fi

	apt_install_packages git
}

function rsync_repo_payload() {
	local source_root="$1"
	[[ -d "$source_root" ]] || fail "Repository payload directory does not exist: $source_root"

	rsync -a --delete \
		--exclude '/.git/' \
		--exclude '/.env' \
		--exclude '/.env.*' \
		--exclude '/data/' \
		--exclude '/logs/' \
		--exclude '/.cm-deploy/' \
		--exclude '/.env.bootstrap' \
		--exclude '/.env.bootstrap-deploy.*.bak' \
		--exclude '/docker-compose.yml' \
		--exclude '/docker-compose.template.yml' \
		"$source_root/" "$REPO_ROOT/"
}

function verify_synced_repo_payload() {
	local required_source_file
	for required_source_file in \
		"$REPO_ROOT/apps/web/src/lib/data/admin-discord.ts" \
		"$REPO_ROOT/apps/web/src/lib/data/admin-web-actions.ts"; do
		[[ -f "$required_source_file" ]] || fail "Repository sync is incomplete. Missing required app source file: $required_source_file"
	done
}

function extract_repo_archive_payload() {
	local archive_file="$1"
	local temp_dir="$2"

	mkdir -p "$temp_dir/extract"
	tar -xzf "$archive_file" -C "$temp_dir/extract"

	local archive_root
	archive_root="$(find "$temp_dir/extract" -mindepth 1 -maxdepth 1 -type d | head -n 1)"
	[[ -n "$archive_root" ]] || fail "Repository archive did not contain a repository directory."
	[[ -f "$archive_root/apps/web/package.json" ]] || fail "Repository archive does not look like the Corn Mafia repo. Missing apps/web/package.json."

	info "Syncing archive payload into $REPO_ROOT while preserving .env, data/, logs/, and .git/."
	rsync_repo_payload "$archive_root"
}

function download_one_repo_archive_url() {
	local archive_url="$1"
	local output_file="$2"
	[[ -n "$archive_url" ]] || return 1

	info "Trying repository archive URL: $archive_url"
	curl -fL --retry 2 --retry-delay 2 -o "$output_file" "$archive_url"
}

function download_repo_archive_into_current_directory() {
	info "Downloading repository archive. GitHub login is not required only when the archive URL is publicly downloadable."
	local temp_dir
	temp_dir="$(mktemp -d)"
	local archive_file="$temp_dir/repo.tar.gz"
	local downloaded="0"
	local archive_url

	for archive_url in "$REPO_ARCHIVE_URL" "$REPO_ARCHIVE_FALLBACK_URL"; do
		if [[ -z "$archive_url" ]]; then
			continue
		fi
		if download_one_repo_archive_url "$archive_url" "$archive_file"; then
			downloaded="1"
			break
		fi
		warn "Archive URL failed: $archive_url"
	done

	if [[ "$downloaded" != "1" ]]; then
		rm -rf "$temp_dir"
		fail "Could not download a public repo archive. The repo page may be visible while source archives still return 404. Publish a GitHub release/source tarball and set CM_REPO_ARCHIVE_URL, or set CM_SOURCE_MODE=file with CM_REPO_ARCHIVE_FILE=/path/to/repo.tar.gz."
	fi

	extract_repo_archive_payload "$archive_file" "$temp_dir"
	rm -rf "$temp_dir"
}

function sync_repo_archive_file_into_current_directory() {
	[[ -n "$REPO_ARCHIVE_FILE" ]] || fail "CM_SOURCE_MODE=file requires CM_REPO_ARCHIVE_FILE=/absolute/or/relative/path/to/repo.tar.gz"
	local archive_file
	archive_file="$(resolve_repo_path "$REPO_ARCHIVE_FILE")"
	[[ -f "$archive_file" ]] || fail "Repository archive file does not exist: $archive_file"

	info "Using local repository archive file: $archive_file"
	local temp_dir
	temp_dir="$(mktemp -d)"
	extract_repo_archive_payload "$archive_file" "$temp_dir"
	rm -rf "$temp_dir"
}

function use_current_directory_as_repo_payload() {
	info "CM_SOURCE_MODE=local selected. Skipping repo download/sync and using current directory contents."
	[[ -f "$REPO_ROOT/apps/web/package.json" ]] || fail "Current directory is not a complete Corn Mafia repo. Missing apps/web/package.json. Use archive/file/git mode to fetch repo contents first."
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
	rsync_repo_payload "$temp_dir/repo"
	rm -rf "$temp_dir"
}

function sync_repo_from_main() {
	case "$SOURCE_MODE" in
		archive)
			download_repo_archive_into_current_directory
			;;
		file)
			sync_repo_archive_file_into_current_directory
			;;
		local|none|skip)
			use_current_directory_as_repo_payload
			;;
		git)
			ensure_git_for_git_mode
			if [[ -d "$REPO_ROOT/.git" ]]; then
				update_existing_git_repo
			else
				clone_repo_into_current_directory
			fi
			;;
		*)
			fail "Unsupported CM_SOURCE_MODE=$SOURCE_MODE. Use archive, file, local, or git."
			;;
	esac

	verify_synced_repo_payload
	restore_repo_file_ownership
}

function load_env() {
	[[ -f "$ENV_FILE" ]] || fail "Missing env file: $ENV_FILE"
	set -a
	# shellcheck source=/dev/null
	source "$ENV_FILE"
	set +a
}

function apply_source_env_values() {
	REPO_URL="${CM_REPO_URL:-$CM_REPO_URL_DEFAULT}"
	REPO_BRANCH="${CM_REPO_BRANCH:-$CM_REPO_BRANCH_DEFAULT}"
	REPO_ARCHIVE_URL="${CM_REPO_ARCHIVE_URL:-$CM_REPO_ARCHIVE_URL_DEFAULT}"
	REPO_ARCHIVE_FALLBACK_URL="${CM_REPO_ARCHIVE_FALLBACK_URL:-$CM_REPO_ARCHIVE_FALLBACK_URL_DEFAULT}"
	REPO_ARCHIVE_FILE="${CM_REPO_ARCHIVE_FILE:-$CM_REPO_ARCHIVE_FILE_DEFAULT}"
	SOURCE_MODE="${CM_SOURCE_MODE:-$CM_SOURCE_MODE_DEFAULT}"
}

function backup_env_once() {
	# Deliberately no-op. The deploy script edits .env in place and does not
	# create backup/log artifacts in the repo root.
	return 0
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

function remove_env_key() {
	local key="$1"
	[[ "$key" =~ ^[A-Z0-9_]+$ ]] || fail "Invalid env key for removal: $key"

	if ! grep -Eq "^[[:space:]]*$key=" "$ENV_FILE"; then
		return 0
	fi

	backup_env_once
	info "Removing obsolete .env key: $key"
	local temp_file
	temp_file="$(mktemp)"
	awk -v key="$key" '
		$0 ~ "^[[:space:]]*" key "=" { next }
		{ print }
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


function postgres_operator_host() {
	local bind_host="${POSTGRES_HOST_BIND:-127.0.0.1}"
	case "$bind_host" in
		0.0.0.0|::|'' )
			printf '127.0.0.1\n'
			;;
		*)
			printf '%s\n' "$bind_host"
			;;
	esac
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
	local internal_port="${WEB_INTERNAL_PORT:-${PORT:-5323}}"
	local external_port="${WEB_EXTERNAL_PORT:-${PORT:-5323}}"
	local postgres_external_port="${POSTGRES_EXTERNAL_PORT:-5432}"
	local postgres_host_bind="${POSTGRES_HOST_BIND:-127.0.0.1}"
	local postgres_host
	postgres_host="$(POSTGRES_HOST_BIND="$postgres_host_bind" postgres_operator_host)"
	local db_service
	db_service="$(db_service_name)"
	local web_service
	web_service="$(web_service_name)"
	local db_alias
	db_alias="$(db_network_alias)"
	local web_alias
	web_alias="$(web_network_alias)"

	ensure_env_value CM_SOURCE_MODE "$SOURCE_MODE"
	ensure_env_value CM_REPO_BRANCH "$REPO_BRANCH"
	ensure_env_value CM_REPO_ARCHIVE_URL "$REPO_ARCHIVE_URL"
	ensure_env_value CM_REPO_ARCHIVE_FALLBACK_URL "$REPO_ARCHIVE_FALLBACK_URL"
	ensure_env_value CM_REPO_ARCHIVE_FILE "$REPO_ARCHIVE_FILE"
	ensure_env_value COMPOSE_PROJECT_NAME "$(compose_project_name)"
	ensure_env_value CM_DB_SERVICE_NAME "$db_service"
	ensure_env_value CM_WEB_SERVICE_NAME "$web_service"
	ensure_env_value CM_DB_CONTAINER_NAME "$(db_container_name)"
	ensure_env_value CM_WEB_CONTAINER_NAME "$(web_container_name)"
	ensure_env_value CM_DB_NETWORK_ALIAS "$db_alias"
	ensure_env_value CM_WEB_NETWORK_ALIAS "$web_alias"
	ensure_env_value CM_NETWORK_NAME "${CM_NETWORK_NAME:-$CM_NETWORK_NAME_DEFAULT}"
	ensure_env_value CM_DB_IMAGE "${CM_DB_IMAGE:-postgres:16-alpine@sha256:4e6e670bb069649261c9c18031f0aded7bb249a5b6664ddec29c013a89310d50}"
	ensure_env_value CM_WEB_IMAGE_NAME "${CM_WEB_IMAGE_NAME:-cm-web:local}"
	ensure_env_value CM_BOOTSTRAP_DIR "${CM_BOOTSTRAP_DIR:-./infra/bootstrap}"
	remove_env_key CM_COMPOSE_TEMPLATE_FILE
	remove_env_key CM_COMPOSE_GENERATED_FILE

	ensure_env_value WEB_PUBLIC_URL "$public_url"
	ensure_env_value NEXTAUTH_URL "$public_url"
	ensure_env_value NEXT_PUBLIC_BASE_URL "$public_url"
	ensure_env_value WEB_INTERNAL_URL "http://$web_alias:$internal_port"
	ensure_env_value WEB_HOST_BIND "${WEB_HOST_BIND:-127.0.0.1}"
	ensure_env_value WEB_INTERNAL_PORT "$internal_port"
	ensure_env_value WEB_EXTERNAL_PORT "$external_port"
	ensure_env_value PORT "$internal_port"
	ensure_env_value POSTGRES_HOST_BIND "$postgres_host_bind"
	ensure_env_value POSTGRES_EXTERNAL_PORT "$postgres_external_port"
	ensure_env_value CM_POSTGRES_HOST "$postgres_host"
	ensure_env_value CM_POSTGRES_PORT "$postgres_external_port"
	ensure_env_value POSTGRES_PORT_BIND "$postgres_host:$postgres_external_port"
	ensure_env_value POSTGRES_DATA_DIR "${POSTGRES_DATA_DIR:-./data/postgres}"
	ensure_env_value WEB_MEDIA_HOST_DIR "${WEB_MEDIA_HOST_DIR:-./data/media}"
	ensure_env_value WEB_CACHE_HOST_DIR "${WEB_CACHE_HOST_DIR:-./data/web_cache}"
	ensure_env_value CM_WEB_UID "${CM_WEB_UID:-$CM_WEB_UID_DEFAULT}"
	ensure_env_value CM_WEB_GID "${CM_WEB_GID:-$CM_WEB_GID_DEFAULT}"
}

function require_env_key() {
	local key="$1"
	local value="${!key:-}"
	[[ -n "$value" ]] || fail "Missing required .env value: $key"
}

function validate_required_env() {
	local key
	for key in \
		CM_SOURCE_MODE \
		CM_REPO_BRANCH \
		CM_REPO_ARCHIVE_URL \
		CM_REPO_ARCHIVE_FALLBACK_URL \
		COMPOSE_PROJECT_NAME \
		CM_DB_SERVICE_NAME \
		CM_WEB_SERVICE_NAME \
		CM_DB_CONTAINER_NAME \
		CM_WEB_CONTAINER_NAME \
		CM_DB_NETWORK_ALIAS \
		CM_WEB_NETWORK_ALIAS \
		CM_NETWORK_NAME \
		CM_DB_IMAGE \
		CM_WEB_IMAGE_NAME \
		CM_BOOTSTRAP_DIR \
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
		WEB_INTERNAL_PORT \
		WEB_EXTERNAL_PORT \
		PORT \
		POSTGRES_HOST_BIND \
		POSTGRES_EXTERNAL_PORT \
		CM_POSTGRES_HOST \
		CM_POSTGRES_PORT \
		POSTGRES_PORT_BIND \
		POSTGRES_DATA_DIR \
		WEB_MEDIA_HOST_DIR \
		WEB_CACHE_HOST_DIR \
		CM_WEB_UID \
		CM_WEB_GID; do
		require_env_key "$key"
	done

	local name_value
	for name_value in \
		"$COMPOSE_PROJECT_NAME" \
		"$CM_DB_SERVICE_NAME" \
		"$CM_WEB_SERVICE_NAME" \
		"$CM_DB_CONTAINER_NAME" \
		"$CM_WEB_CONTAINER_NAME" \
		"$CM_DB_NETWORK_ALIAS" \
		"$CM_WEB_NETWORK_ALIAS" \
		"$CM_NETWORK_NAME"; do
		[[ "$name_value" =~ ^[A-Za-z0-9][A-Za-z0-9_.-]*$ ]] || fail "Unsafe Docker/Compose name: $name_value"
	done

	[[ "$CM_DB_SERVICE_NAME" != "$CM_WEB_SERVICE_NAME" ]] || fail "CM_DB_SERVICE_NAME and CM_WEB_SERVICE_NAME must be different."
	[[ "$CM_DB_CONTAINER_NAME" != "$CM_WEB_CONTAINER_NAME" ]] || fail "CM_DB_CONTAINER_NAME and CM_WEB_CONTAINER_NAME must be different."
	[[ "$PORT" == "$WEB_INTERNAL_PORT" ]] || fail "PORT must match WEB_INTERNAL_PORT for the Next.js container runtime."
	[[ "$WEB_DATABASE_URL" == *@"$CM_DB_NETWORK_ALIAS":5432/* ]] || warn "WEB_DATABASE_URL does not use the stable DB network alias '$CM_DB_NETWORK_ALIAS'. Current value may fail inside Docker if the host is not resolvable."
	[[ "${POSTGRES_USER:-}" == "cm" ]] || fail "POSTGRES_USER must be cm for the current bootstrap contract."
	[[ "${POSTGRES_DB:-}" == "cm_web" ]] || fail "POSTGRES_DB must be cm_web unless bootstrap SQL has been regenerated."
	[[ "${CM_CLIENT_DB_USER:-}" == "cm_client" ]] || fail "CM_CLIENT_DB_USER must be cm_client for the current runtime contract."
}

function assert_tar_archive_safe() {
	local archive_file="$1"
	local member
	while IFS= read -r member; do
		case "$member" in
			''|/*|../*|*/../*|*/..)
				fail "Unsafe path in bootstrap media archive $archive_file: $member"
				;;
		esac
	done < <(tar -tzf "$archive_file")
}

function sync_bootstrap_media() {
	local target_dir
	target_dir="$(resolve_repo_path "${WEB_MEDIA_HOST_DIR:-./data/media}")"
	local cache_dir
	cache_dir="$(resolve_repo_path "${WEB_CACHE_HOST_DIR:-./data/web_cache}")"
	local postgres_dir
	postgres_dir="$(resolve_repo_path "${POSTGRES_DATA_DIR:-./data/postgres}")"

	mkdir -p "$target_dir" "$cache_dir" "$postgres_dir"

	local source_archive="$REPO_ROOT/infra/bootstrap/media.tar.gz"
	local source_dir="$REPO_ROOT/infra/bootstrap/media"
	if [[ -f "$source_archive" ]]; then
		info "Extracting bootstrap media exception archive into $target_dir"
		assert_tar_archive_safe "$source_archive"
		tar -xzf "$source_archive" --skip-old-files --no-same-owner -C "$target_dir"
	elif [[ -d "$source_dir" ]]; then
		info "Syncing bootstrap media exception payload into $target_dir"
		rsync -a --ignore-existing "$source_dir/" "$target_dir/"
	else
		warn "No infra/bootstrap/media.tar.gz or infra/bootstrap/media directory found. Continuing; DB media verification may fail if bootstrap media is required."
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

function assert_no_caddy_domain_conflict() {
	install -d -m 0755 "$CADDY_CONF_DIR"
	local matches
	matches="$(grep -RIn --exclude='*.bak' --exclude='*.backup' --exclude='*.tmp' \
		-e "$DEPLOY_DOMAIN" \
		-e "www.$DEPLOY_DOMAIN" \
		"$(dirname "$CADDYFILE_PATH")" 2>/dev/null || true)"

	if [[ -z "$matches" ]]; then
		return 0
	fi

	local conflicts
	conflicts="$(printf '%s\n' "$matches" | grep -v -F "$CADDY_MANAGED_FILE:" || true)"
	if [[ -n "$conflicts" ]]; then
		printf '%s\n' "$conflicts" >&2
		fail "The deployment domain already appears in an existing Caddy config outside $CADDY_MANAGED_FILE. Review/remove the old block first so this script does not break your working Caddy setup."
	fi
}

function write_caddy_managed_config() {
	local upstream_host
	upstream_host="$(caddy_upstream_host)"
	local upstream_port="${WEB_EXTERNAL_PORT:-${PORT:-5323}}"

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
	[[ -f "$REPO_ROOT/apps/web/Dockerfile" ]] || fail "Missing apps/web/Dockerfile after repo sync."
	[[ -f "$REPO_ROOT/apps/web/package.json" ]] || fail "Missing apps/web/package.json after repo sync."
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

function sed_escape_replacement() {
	printf '%s' "$1" | sed -e 's/[\\&]/\\&/g'
}

function render_compose_file() {
	local compose_path
	compose_path="$(compose_file)"
	local db_service
	db_service="$(db_service_name)"
	local web_service
	web_service="$(web_service_name)"
	local web_build_context
	web_build_context="$(resolve_repo_path ./apps/web)"
	local postgres_data_dir
	postgres_data_dir="$(resolve_repo_path "${POSTGRES_DATA_DIR:-./data/postgres}")"
	local postgres_init_dir
	postgres_init_dir="$(resolve_repo_path "${POSTGRES_INIT_DIR:-./infra/postgres-init}")"
	local bootstrap_dir
	bootstrap_dir="$(resolve_repo_path "${CM_BOOTSTRAP_DIR:-./infra/bootstrap}")"
	local web_cache_host_dir
	web_cache_host_dir="$(resolve_repo_path "${WEB_CACHE_HOST_DIR:-./data/web_cache}")"
	local web_media_host_dir
	web_media_host_dir="$(resolve_repo_path "${WEB_MEDIA_HOST_DIR:-./data/media}")"

	info "Rendering root Docker Compose file for services $db_service and $web_service."
	cat > "$compose_path.tmp" <<COMPOSE
# FILE: docker-compose.yml
# Language: YAML
# Generated by scripts/bootstrap-deploy.sh from .env. Manual changes may be overwritten.

name: \${COMPOSE_PROJECT_NAME:-cm}

services:
  $db_service:
    image: \${CM_DB_IMAGE:-postgres:16-alpine@sha256:4e6e670bb069649261c9c18031f0aded7bb249a5b6664ddec29c013a89310d50}
    container_name: \${CM_DB_CONTAINER_NAME:-cm-db}
    environment:
      POSTGRES_USER: \${POSTGRES_USER:?POSTGRES_USER must be set}
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:?POSTGRES_PASSWORD must be set}
      POSTGRES_DB: \${POSTGRES_DB:?POSTGRES_DB must be set}
      CM_CLIENT_DB_USER: \${CM_CLIENT_DB_USER:?CM_CLIENT_DB_USER must be set}
      CM_CLIENT_DB_PASSWORD: \${CM_CLIENT_DB_PASSWORD:?CM_CLIENT_DB_PASSWORD must be set}
    volumes:
      - "$postgres_data_dir:/var/lib/postgresql/data"
      - "$postgres_init_dir:/docker-entrypoint-initdb.d:ro"
      - "$bootstrap_dir:/cm-bootstrap:ro"
    ports:
      - "\${POSTGRES_HOST_BIND:-127.0.0.1}:\${POSTGRES_EXTERNAL_PORT:-5432}:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \"\$\${POSTGRES_USER}\" -d \"\$\${POSTGRES_DB}\""]
      interval: 5s
      timeout: 5s
      retries: 15
    restart: unless-stopped
    logging: &default-logging
      driver: json-file
      options:
        max-size: \${LOG_MAX_SIZE:-10m}
        max-file: "\${LOG_MAX_FILE:-5}"
    networks:
      cm-internal:
        aliases:
          - cm-db
          - \${CM_DB_NETWORK_ALIAS:-cm-db}
          - \${CM_DB_CONTAINER_NAME:-cm-db}

  $web_service:
    build: "$web_build_context"
    image: \${CM_WEB_IMAGE_NAME:-cm-web:local}
    container_name: \${CM_WEB_CONTAINER_NAME:-cm-web}
    environment:
      NODE_ENV: \${NODE_ENV:-production}
      PORT: \${WEB_INTERNAL_PORT:-5323}
      WEB_INTERNAL_PORT: \${WEB_INTERNAL_PORT:-5323}
      WEB_EXTERNAL_PORT: \${WEB_EXTERNAL_PORT:-5323}
      WEB_INTERNAL_URL: \${WEB_INTERNAL_URL:?WEB_INTERNAL_URL must be set}
      WEB_PUBLIC_URL: \${WEB_PUBLIC_URL:?WEB_PUBLIC_URL must be set}
      NEXTAUTH_URL: \${NEXTAUTH_URL:?NEXTAUTH_URL must be set}
      NEXT_PUBLIC_BASE_URL: \${NEXT_PUBLIC_BASE_URL:?NEXT_PUBLIC_BASE_URL must be set}
      NEXTAUTH_SECRET: \${NEXTAUTH_SECRET:?NEXTAUTH_SECRET must be set}
      REVALIDATE_TOKEN: \${REVALIDATE_TOKEN:?REVALIDATE_TOKEN must be set}
      DISCORD_CLIENT_ID: \${DISCORD_CLIENT_ID:?DISCORD_CLIENT_ID must be set}
      DISCORD_CLIENT_SECRET: \${DISCORD_CLIENT_SECRET:?DISCORD_CLIENT_SECRET must be set}
      DISCORD_BOT_TOKEN: \${DISCORD_BOT_TOKEN:?DISCORD_BOT_TOKEN must be set}
      DISCORD_GUILD_ID: \${DISCORD_GUILD_ID:?DISCORD_GUILD_ID must be set}
      WEB_DATABASE_URL: \${WEB_DATABASE_URL:?WEB_DATABASE_URL must be set}
      DATABASE_URL: \${WEB_DATABASE_URL:?WEB_DATABASE_URL must be set}
      WEB_MEDIA_ROOT: \${WEB_MEDIA_ROOT:-/app/data/media}
      WEB_CACHE_ROOT: \${WEB_CACHE_ROOT:-/app/.next/cache}
      CM_TILES_ROOT: \${CM_TILES_ROOT:-}
      CM_PUBLIC_ROOT: \${CM_PUBLIC_ROOT:-}
      YOUTUBE_DATA_API_KEY: \${YOUTUBE_DATA_API_KEY:-}
      GOOGLE_YOUTUBE_DATA_API_KEY: \${GOOGLE_YOUTUBE_DATA_API_KEY:-}
      FEATURE_WALLETS: \${FEATURE_WALLETS:-false}
      FEATURE_MAPS: \${FEATURE_MAPS:-false}
    depends_on:
      $db_service:
        condition: service_healthy
    ports:
      - "\${WEB_HOST_BIND:-127.0.0.1}:\${WEB_EXTERNAL_PORT:-5323}:\${WEB_INTERNAL_PORT:-5323}"
    command: ["npm", "run", "start"]
    init: true
    user: "\${CM_WEB_UID:-10001}:\${CM_WEB_GID:-10001}"
    read_only: true
    volumes:
      - "$web_cache_host_dir:/app/.next/cache:rw"
      - "$web_media_host_dir:/app/data/media:rw"
    tmpfs:
      - /tmp:rw,nosuid,nodev,noexec,mode=1777,size=\${WEB_TMP_SIZE:-128m}
      - /var/tmp:rw,nosuid,nodev,noexec,mode=1777,size=\${WEB_TMP_SIZE:-128m}
      - /run:rw,nosuid,nodev,size=\${WEB_RUN_SIZE:-16m}
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    pids_limit: \${WEB_PIDS_LIMIT:-256}
    cpus: "\${WEB_CPUS:-2.0}"
    mem_limit: \${WEB_MEM_LIMIT:-2g}
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:\$\${PORT}/ >/dev/null 2>&1 || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 12
    restart: unless-stopped
    logging: *default-logging
    networks:
      cm-internal:
        aliases:
          - cm-web
          - \${CM_WEB_NETWORK_ALIAS:-cm-web}
          - \${CM_WEB_CONTAINER_NAME:-cm-web}

networks:
  cm-internal:
    name: \${CM_NETWORK_NAME:-cm-internal}
    driver: bridge
COMPOSE
	mv "$compose_path.tmp" "$compose_path"
	chmod 0644 "$compose_path"
	docker_compose config >/dev/null
}

function run_docker_deploy() {
	local db_service
	db_service="$(db_service_name)"
	local web_service
	web_service="$(web_service_name)"
	local db_alias
	db_alias="$(db_network_alias)"
	local web_alias
	web_alias="$(web_network_alias)"
	local db_container
	db_container="$(db_container_name)"
	local web_container
	web_container="$(web_container_name)"

	info "Building and starting Corn Mafia Docker services with Compose project $(compose_project_name)."
	cd "$REPO_ROOT"
	docker_compose pull "$db_service" || warn "Could not pull $db_service image now; Docker may use the local image/cache."
	docker_compose build "$web_service"
	docker_compose up -d "$db_service"
	wait_for_container_health "$db_container" "PostgreSQL" 90

	info "Running database bootstrap/verification."
	CM_BOOTSTRAP_ENV="$ENV_FILE" bash "$REPO_ROOT/infra/bootstrap/scripts/db-bootstrap.sh"

	docker_compose up -d "$web_service"
	wait_for_container_health "$web_container" "Web" 90
}

function local_smoke_test() {
	local upstream_host
	upstream_host="$(caddy_upstream_host)"
	local port_value="${WEB_EXTERNAL_PORT:-${PORT:-5323}}"
	info "Running local web smoke test on http://$upstream_host:$port_value/"
	if curl -fsS "http://$upstream_host:$port_value/" >/dev/null; then
		info "Local web smoke test passed."
	else
		warn "Local web smoke test failed. Check: $(docker_compose_display_command) logs --tail=120 $(web_service_name)"
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
  $(docker_compose_display_command) ps
  $(docker_compose_display_command) logs --tail=120 $(web_service_name)
  $(docker_compose_display_command) logs --tail=120 $(db_service_name)
  sudo systemctl status caddy --no-pager
  sudo caddy validate --config "$CADDYFILE_PATH"

If the public URL does not load, confirm DNS for $DEPLOY_DOMAIN and www.$DEPLOY_DOMAIN points to this server
and that ports 80 and 443 are open.
====================================================================================================
SUCCESS
}


function cleanup_obsolete_deploy_artifacts() {
	local obsolete_path
	for obsolete_path in \
		"$REPO_ROOT/.cm-deploy" \
		"$REPO_ROOT/docker-compose.template.yml" \
		"$REPO_ROOT/.env.bootstrap" \
		"$REPO_ROOT/logs/bootstrap-deploy"; do
		if [[ -e "$obsolete_path" ]]; then
			info "Removing obsolete deploy artifact: $obsolete_path"
			rm -rf "$obsolete_path"
		fi
	done

	find "$REPO_ROOT" -maxdepth 1 -type f -name '.env.bootstrap-deploy.*.bak' -print -delete \
		| while IFS= read -r old_backup; do
			info "Removed old root env backup: $old_backup"
		done
}

function main() {
	require_root
	require_safe_repo_root
	ensure_basic_commands
	load_env
	apply_source_env_values
	sync_repo_from_main
	cleanup_obsolete_deploy_artifacts

	load_env
	apply_source_env_values
	choose_domain
	ensure_url_env_values
	load_env
	validate_required_env

	ensure_docker
	ensure_psql
	ensure_caddy
	require_bootstrap_files
	render_compose_file
	sync_bootstrap_media
	ensure_caddy_import
	assert_no_caddy_domain_conflict
	write_caddy_managed_config
	run_docker_deploy
	reload_caddy
	local_smoke_test
	print_success
}

main "$@"
