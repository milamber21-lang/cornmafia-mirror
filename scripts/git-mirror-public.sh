# FILE: scripts/git-mirror-public.sh
# Language: Bash
# Purpose: Publish sanitized tracked-file snapshots of one or all private branches to the public cornmafia-mirror repository.

set -euo pipefail

REMOTE_NAME="${REMOTE_NAME:-origin}"
SOURCE_BRANCH="${SOURCE_BRANCH:-main}"
MIRROR_GIT_URL="${MIRROR_GIT_URL:-git@github.com:milamber21-lang/cornmafia-mirror.git}"
MIRROR_SSH_KEY="${MIRROR_SSH_KEY:-$HOME/.ssh/cornmafia_mirror}"
MIRROR_WORK_DIR="${MIRROR_WORK_DIR:-}"
MIRROR_ALL_BRANCHES="${MIRROR_ALL_BRANCHES:-1}"
INCLUDE_DEPENDABOT="${INCLUDE_DEPENDABOT:-0}"
ASSUME_YES="${ASSUME_YES:-0}"

while [ "$#" -gt 0 ]; do
	case "$1" in
		--yes|-y)
			ASSUME_YES="1"
			shift
			;;
		--single-branch)
			MIRROR_ALL_BRANCHES="0"
			shift
			;;
		--all-branches)
			MIRROR_ALL_BRANCHES="1"
			shift
			;;
		--include-dependabot)
			INCLUDE_DEPENDABOT="1"
			shift
			;;
		--source)
			if [ "$#" -lt 2 ]; then
				echo "Missing value for --source" >&2
				exit 2
			fi
			SOURCE_BRANCH="$2"
			MIRROR_ALL_BRANCHES="0"
			shift 2
			;;
		--mirror-url)
			if [ "$#" -lt 2 ]; then
				echo "Missing value for --mirror-url" >&2
				exit 2
			fi
			MIRROR_GIT_URL="$2"
			shift 2
			;;
		*)
			echo "Unknown argument: $1" >&2
			exit 2
			;;
	esac
done

repo_root() {
	git rev-parse --show-toplevel
}

current_branch() {
	git branch --show-current
}

require_clean_tree() {
	if ! git diff --quiet || ! git diff --cached --quiet; then
		echo "Working tree has uncommitted changes. Commit, stash, or revert them first." >&2
		git status --short
		exit 1
	fi
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

mirror_ssh_command() {
	printf "ssh -o HostName=ssh.github.com -p 443 -i %q -o IdentitiesOnly=yes" "$MIRROR_SSH_KEY"
}

should_skip_source_branch() {
	local branch_name="$1"

	case "$branch_name" in
		HEAD)
			return 0
			;;
		dependabot/*)
			if [ "$INCLUDE_DEPENDABOT" != "1" ]; then
				return 0
			fi
			;;
	esac

	return 1
}

list_source_branches() {
	if [ "$MIRROR_ALL_BRANCHES" = "1" ]; then
		git for-each-ref "refs/remotes/$REMOTE_NAME" --format="%(refname:short)" \
			| sed "s#^$REMOTE_NAME/##" \
			| LC_ALL=C sort \
			| while IFS= read -r branch_name; do
				if should_skip_source_branch "$branch_name"; then
					continue
				fi

				echo "$branch_name"
			done
	else
		echo "$SOURCE_BRANCH"
	fi
}

is_allowed_public_mirror_path() {
	local path="$1"

	case "$path" in
		.env.example|*/.env.example)
			return 0
			;;
		infra/bootstrap/sql/*)
			return 0
			;;
		infra/bootstrap/scripts/db-reset-sequences.sql|infra/bootstrap/scripts/db-bootstrap-verify.sql)
			return 0
			;;
	esac

	return 1
}

should_skip_mirror_path() {
	local path="$1"

	if is_allowed_public_mirror_path "$path"; then
		return 1
	fi

	case "$path" in
		.env|.env.*|*/.env|*/.env.*)
			return 0
			;;
		*.sql|*.dump|*.backup)
			return 0
			;;
		*.tar|*.tar.gz|*.tgz|*.zip|*.7z|*.gz)
			return 0
			;;
		*.pem|*.key|*.p12|*.pfx)
			return 0
			;;
		*id_rsa*|*id_ed25519*|*mirror_key*|*cornmafia_mirror*|*authorized_keys*|*known_hosts*)
			return 0
			;;
		apps/web/public/fonts/*)
			return 0
			;;
		apps/web/public/tiles/*)
			return 0
			;;
		apps/web/.next/*|apps/web/node_modules/*|node_modules/*)
			return 0
			;;
		data/*|media/*|uploads/*)
			return 0
			;;
		support/*)
			return 0
			;;
		docs/_files.md|docs/_snapshot.md|docs/_db.md)
			return 0
			;;
		review_diff_*|*/review_diff_*)
			return 0
			;;
		.github/workflows/sync-to-public-mirror.yml)
			return 0
			;;
	esac

	return 1
}

copy_branch_to_mirror() {
	local source_branch="$1"
	local mirror_dir="$2"
	local source_tree="$3"

	find "$mirror_dir" -mindepth 1 -maxdepth 1 ! -name ".git" -exec rm -rf {} +

	git -C "$source_tree" ls-files -z | while IFS= read -r -d '' file_path; do
		if should_skip_mirror_path "$file_path"; then
			continue
		fi

		if [ ! -f "$source_tree/$file_path" ]; then
			continue
		fi

		mkdir -p "$mirror_dir/$(dirname "$file_path")"
		cp -p "$source_tree/$file_path" "$mirror_dir/$file_path"
	done
}

prepare_mirror_branch() {
	local mirror_dir="$1"
	local branch_name="$2"

	if git -C "$mirror_dir" ls-remote --exit-code --heads origin "$branch_name" >/dev/null 2>&1; then
		GIT_SSH_COMMAND="$(mirror_ssh_command)" git -C "$mirror_dir" fetch origin "$branch_name"
		git -C "$mirror_dir" switch -C "$branch_name" "origin/$branch_name"
	else
		if git -C "$mirror_dir" show-ref --verify --quiet "refs/heads/$branch_name"; then
			git -C "$mirror_dir" switch "$branch_name"
		else
			git -C "$mirror_dir" switch --orphan "$branch_name"
			find "$mirror_dir" -mindepth 1 -maxdepth 1 ! -name ".git" -exec rm -rf {} +
			git -C "$mirror_dir" reset --mixed >/dev/null 2>&1 || true
		fi
	fi
}

sync_one_branch() {
	local source_branch="$1"
	local mirror_dir="$2"
	local source_tree="$3"
	local timestamp
	local source_commit
	local message

	timestamp="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

	echo
	echo "=== Mirroring branch: $source_branch ==="

	git worktree add --detach "$source_tree" "$REMOTE_NAME/$source_branch" >/dev/null

	source_commit="$(git -C "$source_tree" rev-parse --short=12 HEAD)"

	prepare_mirror_branch "$mirror_dir" "$source_branch"
	copy_branch_to_mirror "$source_branch" "$mirror_dir" "$source_tree"

	git -C "$mirror_dir" add -A

	if git -C "$mirror_dir" diff --cached --quiet; then
		echo "No mirror changes for $source_branch."
	else
		message="${MIRROR_COMMIT_MESSAGE:-chore: sync public mirror $source_branch $timestamp}"
		message="$message

Source branch: $source_branch
Source commit: $source_commit
Generated from tracked files with mirror sanitization."

		git -C "$mirror_dir" commit -m "$message"
		GIT_SSH_COMMAND="$(mirror_ssh_command)" git -C "$mirror_dir" push origin "$source_branch"
	fi

	git worktree remove --force "$source_tree" >/dev/null
}

main() {
	if [ ! -r "$MIRROR_SSH_KEY" ]; then
		echo "Mirror SSH key is missing or unreadable: $MIRROR_SSH_KEY" >&2
		exit 1
	fi

	local root
	local current
	local mirror_parent
	local mirror_dir
	local source_tree
	local branch_list
	local git_ssh_command

	root="$(repo_root)"
	cd "$root"

	current="$(current_branch)"
	require_clean_tree
	git fetch --prune "$REMOTE_NAME"

	branch_list="$(list_source_branches)"

	if [ -z "$branch_list" ]; then
		echo "No source branches selected for mirroring." >&2
		exit 1
	fi

	echo "Private remote: $REMOTE_NAME"
	echo "Mirror URL: $MIRROR_GIT_URL"
	echo "Mirror SSH key: $MIRROR_SSH_KEY"
	echo "Mirror all branches: $MIRROR_ALL_BRANCHES"
	echo "Include Dependabot branches: $INCLUDE_DEPENDABOT"
	echo
	echo "Branches to mirror:"
	echo "$branch_list" | sed 's/^/- /'
	echo

	confirm_or_exit "Publish sanitized branch snapshots to public mirror?"

	if [ -n "$MIRROR_WORK_DIR" ]; then
		mirror_parent="$MIRROR_WORK_DIR"
		mkdir -p "$mirror_parent"
	else
		mirror_parent="$(mktemp -d)"
	fi

	mirror_dir="$mirror_parent/cornmafia-mirror"
	git_ssh_command="$(mirror_ssh_command)"

	rm -rf "$mirror_dir"
	GIT_SSH_COMMAND="$git_ssh_command" git clone "$MIRROR_GIT_URL" "$mirror_dir"

	git -C "$mirror_dir" config user.name "${MIRROR_GIT_USER_NAME:-Corn Mafia Mirror Bot}"
	git -C "$mirror_dir" config user.email "${MIRROR_GIT_USER_EMAIL:-mirror@cornmafia.local}"

	echo "$branch_list" | while IFS= read -r source_branch; do
		if [ -z "$source_branch" ]; then
			continue
		fi

		source_tree="$mirror_parent/source-$source_branch"
		source_tree="${source_tree//\//__}"

		sync_one_branch "$source_branch" "$mirror_dir" "$source_tree"
	done

	if [ -z "$MIRROR_WORK_DIR" ]; then
		rm -rf "$mirror_parent"
	fi

	if git show-ref --verify --quiet "refs/heads/$current"; then
		git switch "$current" >/dev/null
	fi

	echo
	echo "Mirror sync complete."
}

main "$@"