#!/usr/bin/env bash
# FILE: scripts/git-release-main.sh
# Language: Bash
# Purpose: Fast-forward main from v1-delivery and push the stable branch.

set -euo pipefail

SOURCE_BRANCH="${SOURCE_BRANCH:-v1-delivery}"
MAIN_BRANCH="${MAIN_BRANCH:-main}"
REMOTE_NAME="${REMOTE_NAME:-origin}"
ASSUME_YES="${ASSUME_YES:-0}"

while [ "$#" -gt 0 ]; do
	case "$1" in
		--yes|-y)
			ASSUME_YES="1"
			shift
			;;
		--source)
			if [ "$#" -lt 2 ]; then
				echo "Missing value for --source" >&2
				exit 2
			fi
			SOURCE_BRANCH="$2"
			shift 2
			;;
		--main)
			if [ "$#" -lt 2 ]; then
				echo "Missing value for --main" >&2
				exit 2
			fi
			MAIN_BRANCH="$2"
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

main() {
	local root
	local original_branch
	root="$(repo_root)"
	cd "$root"

	original_branch="$(current_branch)"

	require_clean_tree
	git fetch --prune "$REMOTE_NAME"

	echo "Source branch: $SOURCE_BRANCH"
	echo "Main branch: $MAIN_BRANCH"
	echo "Remote: $REMOTE_NAME"
	echo

	confirm_or_exit "Fast-forward $MAIN_BRANCH from $SOURCE_BRANCH and push to $REMOTE_NAME?"

	git switch "$SOURCE_BRANCH"
	require_clean_tree
	git pull --ff-only "$REMOTE_NAME" "$SOURCE_BRANCH"

	git switch "$MAIN_BRANCH"
	require_clean_tree
	git pull --ff-only "$REMOTE_NAME" "$MAIN_BRANCH"
	git merge --ff-only "$SOURCE_BRANCH"
	git push "$REMOTE_NAME" "$MAIN_BRANCH"

	if git show-ref --verify --quiet "refs/heads/$original_branch"; then
		git switch "$original_branch"
	else
		git switch "$SOURCE_BRANCH"
	fi

	echo
	echo "Released $SOURCE_BRANCH to $MAIN_BRANCH."
}

main "$@"
