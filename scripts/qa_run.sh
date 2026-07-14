#!/usr/bin/env bash
#//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
#//// FILE: scripts/qa_run.sh                                                                                   ////
#//// Language: Bash                                                                                            ////
#//// Runs a SQL audit script from ./scripts by basename parameter and writes per-script result/error files.      ////
#//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
#//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
# WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

set -Eeuo pipefail

readonly SCRIPT_NAME="$(basename "$0")"
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly DEFAULT_DB_SERVICE_NAME="cm-db"
readonly DEFAULT_COMPOSE_PROJECT_NAME="cm"

function usage() {
	cat <<'USAGE'
Usage:
  ./scripts/qa_run.sh -filename
  ./scripts/qa_run.sh filename
  ./scripts/qa_run.sh --server -filename
  ./scripts/qa_run.sh --remote -filename

Examples:
  ./scripts/qa_run.sh -01_schema_inventory_audit
  ./scripts/qa_run.sh 01_schema_inventory_audit
  QA_SQL_DIR=./scripts/riseopedia_entity_next_steps ./scripts/qa_run.sh -04_read_layer_dependency_audit

Argument rules:
  - Pass the SQL script basename only.
  - Do not include .sql.
  - A leading single dash is accepted and stripped, so -filename runs filename.sql.

Default server/local mode:
  Searches for the SQL file under ./scripts and runs it against the Docker Compose PostgreSQL service.
  Writes result files under ./scripts by default:
    ./scripts/<filename>_result.txt
    ./scripts/<filename>_result.err

Remote mode:
  Copies scripts/qa_run.sh and the selected SQL file to CM_QA_REMOTE:CM_QA_REMOTE_DIR/scripts,
  runs the selected SQL there, then downloads the result and error files back into local ./scripts.

Optional environment overrides:
  QA_SQL_DIR=./scripts
  QA_RESULT_DIR=./scripts
  QA_RESULT_FILE=custom_result.txt
  QA_ERROR_FILE=custom_result.err
  CM_QA_REMOTE=user@example.com
  CM_QA_REMOTE_DIR=/absolute/repo/path
USAGE
}

function fail() {
	printf 'ERROR: %s\n' "$*" >&2
	exit 1
}

function info() {
	printf '%s\n' "$*" >&2
}

function require_command() {
	local command_name="$1"
	command -v "$command_name" >/dev/null 2>&1 || fail "Required command not found: $command_name"
}

function read_env_value() {
	local key="$1"
	local env_file="$2"

	[[ -f "$env_file" ]] || return 1

	awk -F '=' -v wanted_key="$key" '
		$0 !~ /^[[:space:]]*#/ && $1 == wanted_key {
			value = substr($0, index($0, "=") + 1)
			gsub(/^[[:space:]]+|[[:space:]]+$/, "", value)
			gsub(/^"|"$/, "", value)
			gsub(/^'"'"'|'"'"'$/, "", value)
			print value
			exit
		}
	' "$env_file"
}

function normalize_sql_name() {
	local raw_name="$1"
	local normalized_name="$raw_name"

	[[ -n "$normalized_name" ]] || fail "Missing SQL filename argument. Example: ./scripts/qa_run.sh -01_schema_inventory_audit"

	if [[ "$normalized_name" == --* ]]; then
		fail "SQL filename argument must use a single optional dash, not a double-dash option: $normalized_name"
	fi

	if [[ "$normalized_name" == -* ]]; then
		normalized_name="${normalized_name#-}"
	fi

	normalized_name="${normalized_name%.sql}"

	[[ -n "$normalized_name" ]] || fail "Invalid SQL filename argument: $raw_name"
	[[ "$normalized_name" != */* ]] || fail "Pass only the SQL basename, not a path: $raw_name"
	[[ "$normalized_name" =~ ^[A-Za-z0-9_.-]+$ ]] || fail "SQL basename contains unsupported characters: $raw_name"

	printf '%s\n' "$normalized_name"
}

function parse_args() {
	local mode="server"
	local sql_name=""

	while [[ "$#" -gt 0 ]]; do
		case "$1" in
			--help|-h)
				usage
				exit 0
				;;
			--server)
				mode="server"
				shift
				;;
			--remote)
				mode="remote"
				shift
				;;
			*)
				if [[ -n "$sql_name" ]]; then
					usage >&2
					fail "Unexpected extra argument: $1"
				fi
				sql_name="$(normalize_sql_name "$1")"
				shift
				;;
		esac
	done

	[[ -n "$sql_name" ]] || fail "Missing SQL filename argument. Example: ./scripts/qa_run.sh -01_schema_inventory_audit"

	printf '%s\0%s\0' "$mode" "$sql_name"
}

function resolve_repo_root() {
	local candidate
	candidate="$(cd "$SCRIPT_DIR/.." && pwd)"

	if [[ -f "$candidate/docker-compose.yml" || -f "$candidate/.env" || -d "$candidate/infra" || -d "$candidate/apps" ]]; then
		printf '%s\n' "$candidate"
		return 0
	fi

	fail "Could not resolve repository root from $SCRIPT_DIR. Expected this script at ./scripts/$SCRIPT_NAME."
}

function resolve_path_from_repo_root() {
	local repo_root="$1"
	local raw_path="$2"

	if [[ "$raw_path" == /* ]]; then
		printf '%s\n' "$raw_path"
	else
		printf '%s\n' "$repo_root/$raw_path"
	fi
}

function resolve_sql_file() {
	local repo_root="$1"
	local sql_name="$2"
	local sql_dir_raw="${QA_SQL_DIR:-scripts}"
	local sql_dir
	sql_dir="$(resolve_path_from_repo_root "$repo_root" "$sql_dir_raw")"

	[[ -d "$sql_dir" ]] || fail "QA SQL directory not found: $sql_dir"

	local direct_file="$sql_dir/$sql_name.sql"
	if [[ -f "$direct_file" ]]; then
		printf '%s\n' "$direct_file"
		return 0
	fi

	local nested_default_file="$SCRIPT_DIR/riseopedia_entity_next_steps/$sql_name.sql"
	if [[ -f "$nested_default_file" ]]; then
		printf '%s\n' "$nested_default_file"
		return 0
	fi

	local matches=()
	while IFS= read -r -d '' match; do
		matches+=("$match")
	done < <(find "$sql_dir" -type f -name "$sql_name.sql" -print0)

	if [[ "${#matches[@]}" -eq 1 ]]; then
		printf '%s\n' "${matches[0]}"
		return 0
	fi

	if [[ "${#matches[@]}" -gt 1 ]]; then
		printf 'ERROR: SQL basename is ambiguous. Matches:\n' >&2
		printf '  %s\n' "${matches[@]}" >&2
		exit 1
	fi

	fail "SQL file not found for basename '$sql_name' under $sql_dir"
}

function compose_args() {
	local repo_root="$1"
	local env_file="$repo_root/.env"
	local compose_project_name="$DEFAULT_COMPOSE_PROJECT_NAME"
	local compose_file="$repo_root/docker-compose.yml"
	local generated_file=""

	if [[ -f "$env_file" ]]; then
		compose_project_name="$(read_env_value COMPOSE_PROJECT_NAME "$env_file" || true)"
		[[ -n "$compose_project_name" ]] || compose_project_name="$DEFAULT_COMPOSE_PROJECT_NAME"

		generated_file="$(read_env_value CM_COMPOSE_GENERATED_FILE "$env_file" || true)"
		if [[ -n "$generated_file" && -f "$repo_root/$generated_file" ]]; then
			compose_file="$repo_root/$generated_file"
		fi

		printf '%s\0' --env-file "$env_file" --project-name "$compose_project_name" -f "$compose_file"
	else
		printf '%s\0' --project-name "$compose_project_name" -f "$compose_file"
	fi
}

function resolve_db_service_name() {
	local repo_root="$1"
	local env_file="$repo_root/.env"
	local db_service_name="$DEFAULT_DB_SERVICE_NAME"

	if [[ -f "$env_file" ]]; then
		db_service_name="$(read_env_value CM_DB_SERVICE_NAME "$env_file" || true)"
		[[ -n "$db_service_name" ]] || db_service_name="$DEFAULT_DB_SERVICE_NAME"
	fi

	printf '%s\n' "$db_service_name"
}

function result_file_for_sql() {
	local repo_root="$1"
	local sql_name="$2"
	local result_dir_raw="${QA_RESULT_DIR:-scripts}"
	local result_dir
	result_dir="$(resolve_path_from_repo_root "$repo_root" "$result_dir_raw")"

	mkdir -p "$result_dir"

	if [[ -n "${QA_RESULT_FILE:-}" ]]; then
		resolve_path_from_repo_root "$repo_root" "$QA_RESULT_FILE"
	else
		printf '%s\n' "$result_dir/${sql_name}_result.txt"
	fi
}

function error_file_for_sql() {
	local repo_root="$1"
	local sql_name="$2"
	local result_dir_raw="${QA_RESULT_DIR:-scripts}"
	local result_dir
	result_dir="$(resolve_path_from_repo_root "$repo_root" "$result_dir_raw")"

	mkdir -p "$result_dir"

	if [[ -n "${QA_ERROR_FILE:-}" ]]; then
		resolve_path_from_repo_root "$repo_root" "$QA_ERROR_FILE"
	else
		printf '%s\n' "$result_dir/${sql_name}_result.err"
	fi
}

function run_server_qa() {
	local sql_name="$1"
	local repo_root sql_file result_file error_file tmp_result tmp_error db_service_name
	repo_root="$(resolve_repo_root)"
	sql_file="$(resolve_sql_file "$repo_root" "$sql_name")"
	result_file="$(result_file_for_sql "$repo_root" "$sql_name")"
	error_file="$(error_file_for_sql "$repo_root" "$sql_name")"
	tmp_result="$result_file.tmp"
	tmp_error="$error_file.tmp"
	db_service_name="$(resolve_db_service_name "$repo_root")"

	[[ -f "$repo_root/docker-compose.yml" || -f "$repo_root/.cm-deploy/docker-compose.generated.yml" ]] || fail "No Docker Compose file found in $repo_root"

	require_command docker

	local compose_args_array=()
	while IFS= read -r -d '' arg; do
		compose_args_array+=("$arg")
	done < <(compose_args "$repo_root")

	info "Running SQL basename: $sql_name"
	info "Running SQL file: $sql_file"
	info "Writing result: $result_file"
	info "Writing stderr: $error_file"
	info "Using Docker Compose service: $db_service_name"

	local qa_status=0

	set +e
	{
		printf 'Corn Mafia SQL runner result\n'
		printf 'Generated at: %s\n' "$(date -Iseconds)"
		printf 'Repository root: %s\n' "$repo_root"
		printf 'SQL basename: %s\n' "$sql_name"
		printf 'SQL file: %s\n' "$sql_file"
		printf 'Docker Compose service: %s\n' "$db_service_name"
		printf '\n'

		docker compose "${compose_args_array[@]}" exec -T "$db_service_name" sh -c '
			psql \
				-X \
				-v ON_ERROR_STOP=1 \
				--pset=footer=off \
				--pset=null="∅" \
				-U "$POSTGRES_USER" \
				-d "$POSTGRES_DB" \
				-f -
		' < "$sql_file"
	} > "$tmp_result" 2> "$tmp_error"
	qa_status=$?
	set -e

	mv "$tmp_result" "$result_file"
	mv "$tmp_error" "$error_file"

	if [[ -s "$error_file" ]]; then
		info "SQL stderr output saved to: $error_file"
	else
		: > "$error_file"
		info "SQL completed with no stderr output."
	fi

	if [[ "$qa_status" -ne 0 ]]; then
		fail "SQL run failed with exit code $qa_status. Result: $result_file Error: $error_file"
	fi

	info "Done: $result_file"
}

function remote_path_is_safe() {
	local remote_dir="$1"
	[[ "$remote_dir" == /* ]] || return 1
	[[ "$remote_dir" != *" "* ]] || return 1
	return 0
}

function shell_quote() {
	local value="$1"
	printf "'%s'" "${value//\'/\'\\\'\'}"
}

function run_remote_qa() {
	local sql_name="$1"
	local repo_root sql_file remote remote_dir remote_scripts_dir result_file error_file
	repo_root="$(resolve_repo_root)"
	sql_file="$(resolve_sql_file "$repo_root" "$sql_name")"
	remote="${CM_QA_REMOTE:-}"
	remote_dir="${CM_QA_REMOTE_DIR:-}"
	remote_scripts_dir="$remote_dir/scripts"
	result_file="$(basename "$(result_file_for_sql "$repo_root" "$sql_name")")"
	error_file="$(basename "$(error_file_for_sql "$repo_root" "$sql_name")")"

	[[ -n "$remote" ]] || fail "Set CM_QA_REMOTE, for example CM_QA_REMOTE=user@example.com"
	[[ -n "$remote_dir" ]] || fail "Set CM_QA_REMOTE_DIR to the absolute repository path on the server"
	remote_path_is_safe "$remote_dir" || fail "CM_QA_REMOTE_DIR must be an absolute path without spaces"
	[[ -f "$sql_file" ]] || fail "QA SQL file not found: $sql_file"

	require_command ssh
	require_command scp

	info "Ensuring remote scripts directory exists: $remote:$remote_scripts_dir"
	ssh "$remote" "mkdir -p $(shell_quote "$remote_scripts_dir")"

	info "Uploading runner and SQL to $remote:$remote_scripts_dir"
	scp "$SCRIPT_DIR/$SCRIPT_NAME" "$remote:$remote_scripts_dir/$SCRIPT_NAME"
	scp "$sql_file" "$remote:$remote_scripts_dir/$sql_name.sql"

	info "Running remote SQL on $remote"
	ssh "$remote" "cd $(shell_quote "$remote_dir") && chmod +x './scripts/$SCRIPT_NAME' && QA_SQL_DIR='scripts' QA_RESULT_DIR='scripts' './scripts/$SCRIPT_NAME' --server '-$sql_name'"

	info "Downloading result files to local directory: $SCRIPT_DIR"
	scp "$remote:$remote_scripts_dir/$result_file" "$SCRIPT_DIR/$result_file"
	scp "$remote:$remote_scripts_dir/$error_file" "$SCRIPT_DIR/$error_file" || true

	info "Done: $SCRIPT_DIR/$result_file"
}

mode_and_name=()
while IFS= read -r -d '' value; do
	mode_and_name+=("$value")
done < <(parse_args "$@")

readonly MODE="${mode_and_name[0]}"
readonly SQL_NAME="${mode_and_name[1]}"

case "$MODE" in
	server)
		run_server_qa "$SQL_NAME"
		;;
	remote)
		run_remote_qa "$SQL_NAME"
		;;
	*)
		usage >&2
		fail "Unknown mode: $MODE"
		;;
esac

# WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
