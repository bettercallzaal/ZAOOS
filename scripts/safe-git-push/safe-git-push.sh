#!/usr/bin/env bash
# Block git pushes that would land on main/master or on a branch whose PR is already merged.
# Called from: Claude PreToolUse hook, .git/hooks/pre-push, optional zsh wrapper.
#
# Source of truth: research/dev-workflows/461-push-to-merged-pr-failure-fix/README.md
#
# Exit codes:
#   0 = safe to push
#   2 = BLOCKED (caller should refuse the push)
#
# Override: ALLOW_UNSAFE_PUSH=1 in env bypasses checks (rare emergency only).

set -euo pipefail

if [[ "${ALLOW_UNSAFE_PUSH:-0}" == "1" ]]; then
  echo "[safe-git-push] ALLOW_UNSAFE_PUSH=1 — skipping checks." >&2
  exit 0
fi

REPO_DIR="${REPO_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || echo "")}"
if [[ -z "$REPO_DIR" ]]; then
  echo "[safe-git-push] not inside a git repo — allowing." >&2
  exit 0
fi

cd "$REPO_DIR"

BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null || echo "")
if [[ -z "$BRANCH" ]]; then
  echo "[safe-git-push] detached HEAD — refusing as a precaution." >&2
  exit 2
fi

case "$BRANCH" in
  main|master)
    cat <<EOF >&2
[safe-git-push] BLOCKED: pushing while on '$BRANCH'.

Always create a PR. Recovery:
  git checkout -b ws/<descriptive-slug>-\$(date +%m%d-%H%M)
  git push -u origin HEAD
  gh pr create --base $BRANCH

If this is a TRUE emergency (admin recovery push), set ALLOW_UNSAFE_PUSH=1.
EOF
    exit 2
    ;;
esac

if ! command -v gh >/dev/null 2>&1; then
  echo "[safe-git-push] gh CLI not installed — skipping merged-PR check." >&2
  exit 0
fi

MERGED_PR=$(timeout 8 gh pr list --state merged --head "$BRANCH" --json number,mergedAt --jq '.[0].number' 2>/dev/null || echo "")

if [[ -n "$MERGED_PR" ]]; then
  cat <<EOF >&2
[safe-git-push] BLOCKED: branch '$BRANCH' has merged PR #$MERGED_PR.

Pushing more commits to a merged-PR branch orphans them — they never
reach main. Recover by cherry-picking onto a fresh branch and opening a new PR:

  git fetch origin main
  NEW_BRANCH="ws/$(echo "$BRANCH" | sed 's/^ws\///')-followup-\$(date +%m%d-%H%M)"
  git checkout -b "\$NEW_BRANCH" origin/main
  git cherry-pick <commit-sha>
  git push -u origin HEAD
  gh pr create --base main

Override (rare emergency only): ALLOW_UNSAFE_PUSH=1.
EOF
  exit 2
fi

if [[ "${SAFE_PUSH_ARGS:-}" == *"--force"* ]] || [[ "${SAFE_PUSH_ARGS:-}" == *" -f "* ]] || [[ "${SAFE_PUSH_ARGS:-}" == *" -f"* ]]; then
  echo "[safe-git-push] WARNING: force push detected on '$BRANCH' — allowed for non-main branches." >&2
fi

echo "[safe-git-push] OK: '$BRANCH' passes safety checks." >&2
exit 0
