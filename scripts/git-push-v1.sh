# FILE: scripts/git-push-v1.sh
# Language: Bash
# Purpose: Generate tracked-file docs, run checks, commit, push v1-delivery, and print dependency status.

set -euo pipefail

V1_BRANCH="${V1_BRANCH:-v1-delivery}"
REMOTE_NAME="${REMOTE_NAME:-origin}"
COMMIT_MESSAGE="${COMMIT_MESSAGE:-Update V1 delivery}"
GENERATE_DB_DOC="${GENERATE_DB_DOC:-1}"
REQUIRE_DB_DUMP="${REQUIRE_DB_DUMP:-0}"
RUN_CHECKS="${RUN_CHECKS:-1}"
RUN_DEPENDENCY_REPORT="${RUN_DEPENDENCY_REPORT:-1}"
PUSH_CHANGES="${PUSH_CHANGES:-1}"
ASSUME_YES="${ASSUME_YES:-0}"
MAX_SNAPSHOT_FILE_BYTES="${MAX_SNAPSHOT_FILE_BYTES:-250000}"
ENV_FILE="${ENV_FILE:-.env}"
LOAD_ENV="${LOAD_ENV:-1}"

while [ "$#" -gt 0 ]; do
	case "$1" in
		--yes|-y)
			ASSUME_YES="1"
			shift
			;;
		--skip-db)
			GENERATE_DB_DOC="0"
			shift
			;;
		--require-db)
			REQUIRE_DB_DUMP="1"
			shift
			;;
		--skip-checks)
			RUN_CHECKS="0"
			shift
			;;
		--skip-deps)
			RUN_DEPENDENCY_REPORT="0"
			shift
			;;
		--no-push)
			PUSH_CHANGES="0"
			shift
			;;
		--no-env)
			LOAD_ENV="0"
			shift
			;;
		--env-file)
			if [ "$#" -lt 2 ]; then
				echo "Missing value for --env-file" >&2
				exit 2
			fi
			ENV_FILE="$2"
			shift 2
			;;
		--message|-m)
			if [ "$#" -lt 2 ]; then
				echo "Missing value for $1" >&2
				exit 2
			fi
			COMMIT_MESSAGE="$2"
			shift 2
			;;
		*)
			COMMIT_MESSAGE="$1"
			shift
			;;
	esac
done

require_command() {
	if ! command -v "$1" >/dev/null 2>&1; then
		echo "Missing required command: $1" >&2
		exit 1
	fi
}

repo_root() {
	git rev-parse --show-toplevel
}

current_branch() {
	git branch --show-current
}

confirm_or_exit() {
	local prompt="$1"

	if [ "$ASSUME_YES" = "1" ]; then
		return 0
	fi

	printf "%s [y/N] " "$prompt"
	read -r answer

	case "$answer" in
		y|Y|yes|YES)
			return 0
			;;
		*)
			echo "Aborted."
			exit 1
			;;
	esac
}

load_env_file() {
	if [ "$LOAD_ENV" != "1" ]; then
		return 0
	fi

	if [ ! -f "$ENV_FILE" ]; then
		return 0
	fi

	set -a
	# shellcheck disable=SC1090
	. "$ENV_FILE"
	set +a

	echo "Loaded operator environment from $ENV_FILE"
}

has_npm_script() {
	local package_dir="$1"
	local script_name="$2"

	if [ ! -f "$package_dir/package.json" ]; then
		return 1
	fi

	node - "$package_dir/package.json" "$script_name" <<'NODE'
const fs = require("node:fs");
const packagePath = process.argv[2];
const scriptName = process.argv[3];
const parsed = JSON.parse(fs.readFileSync(packagePath, "utf8"));
const scripts = parsed && typeof parsed === "object" ? parsed.scripts : null;

if (scripts && Object.prototype.hasOwnProperty.call(scripts, scriptName)) {
	process.exit(0);
}

process.exit(1);
NODE
}

run_npm_script_if_present() {
	local package_dir="$1"
	local script_name="$2"

	if has_npm_script "$package_dir" "$script_name"; then
		echo
		echo "=== npm --prefix $package_dir run $script_name ==="
		npm --prefix "$package_dir" run "$script_name"
	else
		echo "Skipping missing npm script: $package_dir $script_name"
	fi
}

snapshot_language_for_path() {
	local path="$1"

	case "$path" in
		*.ts) echo "ts" ;;
		*.tsx) echo "tsx" ;;
		*.js|*.mjs|*.cjs) echo "js" ;;
		*.json) echo "json" ;;
		*.md) echo "md" ;;
		*.css) echo "css" ;;
		*.scss) echo "scss" ;;
		*.html) echo "html" ;;
		*.yml|*.yaml) echo "yaml" ;;
		*.sql) echo "sql" ;;
		*.sh) echo "bash" ;;
		*.py) echo "python" ;;
		*.toml) echo "toml" ;;
		*.xml) echo "xml" ;;
		*.txt) echo "text" ;;
		*) echo "text" ;;
	esac
}

is_snapshot_includable_file() {
	local path="$1"

	case "$path" in
		docs/_files.md|docs/_snapshot.md|docs/_db.md)
			return 1
			;;
		package-lock.json|apps/web/package-lock.json)
			return 1
			;;
		*.png|*.jpg|*.jpeg|*.gif|*.webp|*.ico|*.svg|*.ttf|*.otf|*.woff|*.woff2)
			return 1
			;;
		*.tar|*.tar.gz|*.tgz|*.zip|*.7z|*.gz|*.dump|*.backup)
			return 1
			;;
		*.pem|*.key|*.p12|*.pfx)
			return 1
			;;
		.env|.env.*|*/.env|*/.env.*)
			return 1
			;;
	esac

	case "$path" in
		*.ts|*.tsx|*.js|*.mjs|*.cjs|*.json|*.md|*.css|*.scss|*.html|*.yml|*.yaml|*.sql|*.sh|*.py|*.toml|*.xml|*.txt|Dockerfile|.dockerignore|.gitignore|.editorconfig|.tarignore)
			;;
		*)
			return 1
			;;
	esac

	if [ ! -f "$path" ]; then
		return 1
	fi

	local byte_count
	byte_count="$(wc -c < "$path" | tr -d '[:space:]')"

	if [ "$byte_count" -gt "$MAX_SNAPSHOT_FILE_BYTES" ]; then
		return 1
	fi

	return 0
}

write_files_doc() {
	local output_path="docs/_files.md"
	local now_utc
	now_utc="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

	mkdir -p docs

	{
		echo "<!-- FILE: docs/_files.md -->"
		echo "# Project Files"
		echo
		echo "Generated: $now_utc"
		echo
		echo "This file is generated from tracked Git files only."
		echo
		echo '```text'
		git ls-files | LC_ALL=C sort
		echo '```'
	} > "$output_path"

	echo "Generated $output_path"
}

write_snapshot_doc() {
	local output_path="docs/_snapshot.md"
	local now_utc
	now_utc="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

	mkdir -p docs

	{
		echo "<!-- FILE: docs/_snapshot.md -->"
		echo "# Codebase Snapshot"
		echo
		echo "Generated: $now_utc"
		echo
		echo "This file is generated from tracked Git text/source files only."
		echo "Large files, generated docs, lock files, binary files, archives, private keys, env files, and media assets are omitted."
		echo

		git ls-files | LC_ALL=C sort | while IFS= read -r file_path; do
			if is_snapshot_includable_file "$file_path"; then
				local language
				language="$(snapshot_language_for_path "$file_path")"

				echo "## File: \`$file_path\`"
				echo
				echo '````'"$language"
				cat "$file_path"
				echo
				echo '````'
				echo
			fi
		done
	} > "$output_path"

	echo "Generated $output_path"
}

write_db_doc_from_dump() {
	local output_path="docs/_db.md"
	local now_utc
	local dump_file
	now_utc="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
	dump_file="$(mktemp)"

	mkdir -p docs

	if [ -n "${CM_DB_DUMP_COMMAND:-}" ]; then
		if bash -lc "$CM_DB_DUMP_COMMAND" > "$dump_file"; then
			:
		else
			rm -f "$dump_file"
			return 1
		fi
	elif command -v docker >/dev/null 2>&1 && docker compose ps --services 2>/dev/null | grep -qx "cm-db"; then
		local db_name
		local db_user
		db_name="${CM_DB_NAME:-${POSTGRES_DB:-cm_web}}"
		db_user="${CM_DB_USER:-${POSTGRES_USER:-cm}}"

		if docker compose exec -T cm-db pg_dump --schema-only --no-owner --no-privileges --username "$db_user" --dbname "$db_name" > "$dump_file"; then
			:
		else
			rm -f "$dump_file"
			return 1
		fi
	elif command -v pg_dump >/dev/null 2>&1 && [ -n "${CM_OWNER_DATABASE_URL:-}" ]; then
		if pg_dump --schema-only --no-owner --no-privileges "$CM_OWNER_DATABASE_URL" > "$dump_file"; then
			:
		else
			rm -f "$dump_file"
			return 1
		fi
	elif command -v pg_dump >/dev/null 2>&1 && [ -n "${DATABASE_URL:-}" ]; then
		if pg_dump --schema-only --no-owner --no-privileges "$DATABASE_URL" > "$dump_file"; then
			:
		else
			rm -f "$dump_file"
			return 1
		fi
	else
		rm -f "$dump_file"
		return 1
	fi

	{
		echo "<!-- FILE: docs/_db.md -->"
		echo "# Database Schema Snapshot"
		echo
		echo "Generated: $now_utc"
		echo
		echo "This file is generated as a schema-only dump."
		echo
		echo '```sql'
		cat "$dump_file"
		echo '```'
	} > "$output_path"

	rm -f "$dump_file"
	echo "Generated $output_path"
}

write_db_doc_failure() {
	local output_path="docs/_db.md"
	local now_utc
	now_utc="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

	mkdir -p docs

	{
		echo "<!-- FILE: docs/_db.md -->"
		echo "# Database Schema Snapshot"
		echo
		echo "Generated: $now_utc"
		echo
		echo "Schema dump was not generated."
		echo
		echo "Configure one of these and rerun:"
		echo
		echo "- CM_DB_DUMP_COMMAND"
		echo "- Docker Compose service cm-db with POSTGRES_DB and POSTGRES_USER"
		echo "- CM_OWNER_DATABASE_URL with local pg_dump"
		echo "- DATABASE_URL with local pg_dump"
	} > "$output_path"

	echo "Generated fallback $output_path"
}

generate_docs() {
	echo
	echo "=== Generating tracked-file docs ==="

	write_files_doc
	write_snapshot_doc

	if [ "$GENERATE_DB_DOC" = "1" ]; then
		if ! write_db_doc_from_dump; then
			if [ "$REQUIRE_DB_DUMP" = "1" ]; then
				echo "Database schema dump failed and REQUIRE_DB_DUMP=1." >&2
				exit 1
			fi

			echo "Database schema dump failed. Writing fallback docs/_db.md."
			write_db_doc_failure
		fi
	else
		echo "Skipping docs/_db.md generation."
	fi
}

run_checks() {
	if [ "$RUN_CHECKS" != "1" ]; then
		echo "Skipping checks."
		return 0
	fi

	echo
	echo "=== Running checks ==="

	run_npm_script_if_present "." "test:security"
	run_npm_script_if_present "." "lint"
}

print_dependency_report_for_dir() {
	local package_dir="$1"

	if [ ! -f "$package_dir/package.json" ]; then
		return 0
	fi

	echo
	echo "=== Dependency status: $package_dir ==="
	echo "npm outdated:"
	npm --prefix "$package_dir" outdated || true

	echo
	echo "npm audit:"
	npm --prefix "$package_dir" audit --audit-level=moderate || true
}

print_dependency_report() {
	if [ "$RUN_DEPENDENCY_REPORT" != "1" ]; then
		echo "Skipping dependency report."
		return 0
	fi

	print_dependency_report_for_dir "."
	print_dependency_report_for_dir "apps/web"

	if command -v gh >/dev/null 2>&1; then
		echo
		echo "=== Open Dependabot pull requests ==="
		gh pr list --state open --search "author:app/dependabot" --json number,title,headRefName,url --jq '.[] | "#\(.number) \(.title) [\(.headRefName)] \(.url)"' || true
	else
		echo
		echo "Skipping GitHub Dependabot PR report because gh is not installed or not authenticated."
	fi
}

wait_for_github_actions() {
	if ! command -v gh >/dev/null 2>&1; then
		echo "Skipping GitHub Actions wait because gh is not installed or not authenticated."
		return 0
	fi

	echo
	echo "=== Recent GitHub Actions runs for $V1_BRANCH ==="
	gh run list --branch "$V1_BRANCH" --limit 5 || true

	if [ "${WAIT_FOR_GITHUB_ACTIONS:-0}" = "1" ]; then
		echo
		echo "Waiting for latest GitHub Actions run on $V1_BRANCH."
		local run_id
		run_id="$(gh run list --branch "$V1_BRANCH" --limit 1 --json databaseId --jq '.[0].databaseId' 2>/dev/null || true)"

		if [ -n "$run_id" ]; then
			gh run watch "$run_id" --exit-status || true
		else
			echo "No GitHub Actions run found yet."
		fi
	fi
}

main() {
	require_command git
	require_command npm
	require_command node

	local root
	root="$(repo_root)"
	cd "$root"

	load_env_file

	local branch
	branch="$(current_branch)"

	if [ "$branch" != "$V1_BRANCH" ]; then
		echo "Expected branch $V1_BRANCH, but current branch is $branch." >&2
		echo "Run: git switch $V1_BRANCH" >&2
		exit 1
	fi

	git fetch --prune "$REMOTE_NAME"

	generate_docs
	run_checks

	echo
	echo "=== Staging changes ==="
	git add -A

	echo
	echo "=== Staged status ==="
	git status --short

	if git diff --cached --quiet; then
		echo "No staged changes to commit."
	else
		confirm_or_exit "Commit staged changes with message: $COMMIT_MESSAGE ?"
		git commit -m "$COMMIT_MESSAGE"
	fi

	if [ "$PUSH_CHANGES" = "1" ]; then
		echo
		echo "=== Pushing $V1_BRANCH ==="
		git push -u "$REMOTE_NAME" "$V1_BRANCH"
		wait_for_github_actions
	else
		echo "Skipping push."
	fi

	print_dependency_report

	echo
	echo "Done."
}

main "$@"