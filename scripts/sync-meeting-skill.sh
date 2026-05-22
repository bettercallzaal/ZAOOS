#!/usr/bin/env bash
# sync-meeting-skill.sh - keep the two /meeting skill copies identical.
#
# The skill lives in two places that drift when one is edited and the other
# is not (this caused real lost time on 2026-05-22 - doc-680 work in one copy,
# the mlx upgrade in the other):
#   REPO  .claude/skills/meeting/   - version-controlled, source of truth
#   USER  ~/.claude/skills/meeting/ - what Claude Code actually runs
#
# Run this after editing the skill. Default deploys REPO -> USER.
#
# Usage:
#   sync-meeting-skill.sh           show drift, then sync REPO -> USER (deploy)
#   sync-meeting-skill.sh --pull    sync USER -> REPO (capture live edits)
#   sync-meeting-skill.sh --check   show drift only; exit 1 if the copies differ
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/.claude/skills/meeting"
USER_DIR="$HOME/.claude/skills/meeting"

[[ -d "$REPO_DIR" ]] || { echo "ERROR: repo skill dir not found: $REPO_DIR" >&2; exit 2; }
[[ -d "$USER_DIR" ]] || { echo "ERROR: user skill dir not found: $USER_DIR" >&2; exit 2; }

MODE="${1:-deploy}"

DRIFT=$(diff -rq "$REPO_DIR" "$USER_DIR" 2>/dev/null | grep -v '\.DS_Store' || true)

if [[ -z "$DRIFT" ]]; then
  echo "[sync] in sync - REPO and USER /meeting skill copies are identical"
  exit 0
fi

echo "[sync] DRIFT detected:"
echo "$DRIFT" | sed 's/^/  /'

case "$MODE" in
  --check)
    echo "[sync] --check: copies differ (exit 1)" >&2
    exit 1 ;;
  --pull)
    rsync -a --delete --exclude '.DS_Store' "$USER_DIR/" "$REPO_DIR/"
    echo "[sync] pulled USER -> REPO - commit the change" ;;
  deploy|"")
    rsync -a --delete --exclude '.DS_Store' "$REPO_DIR/" "$USER_DIR/"
    echo "[sync] deployed REPO -> USER" ;;
  *)
    echo "ERROR: unknown mode '$MODE' (use --pull, --check, or no arg)" >&2
    exit 3 ;;
esac
