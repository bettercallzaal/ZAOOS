#!/usr/bin/env bash
# sync-meeting-skill.sh - keep the two copies of the /meeting skill in sync.
#
# The skill lives in two places that drift when one is edited and the other is
# not (this cost real time on 2026-05-22 - autoresearch edits landed in one
# copy, diarization work in the other):
#   REPO  .claude/skills/meeting/   - version-controlled, the source of truth
#   USER  ~/.claude/skills/meeting/ - the copy Claude Code actually runs
#
# Rule: edit the REPO copy, then run this. Default direction is REPO -> USER.
#
# Usage:
#   sync-meeting-skill.sh             REPO -> USER (default, after editing repo)
#   sync-meeting-skill.sh --check     report drift, exit 1 if any (no writes)
#   sync-meeting-skill.sh --from-user USER -> REPO (escape hatch, rare)
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/.claude/skills/meeting"
USER_DIR="$HOME/.claude/skills/meeting"

[[ -d "$REPO_DIR" ]] || { echo "ERROR: repo skill dir not found: $REPO_DIR" >&2; exit 2; }

DIFF_X=(-x __pycache__ -x '*.pyc' -x .DS_Store)
RSYNC_X=(--exclude=__pycache__ --exclude='*.pyc' --exclude=.DS_Store)

MODE="${1:-deploy}"
case "$MODE" in
  --check)
    if diff -rq "${DIFF_X[@]}" "$REPO_DIR" "$USER_DIR" >/dev/null 2>&1; then
      echo "[sync] in sync - REPO and USER copies match"
      exit 0
    fi
    echo "[sync] DRIFT between the two /meeting skill copies:" >&2
    diff -rq "${DIFF_X[@]}" "$REPO_DIR" "$USER_DIR" >&2 || true
    echo "[sync] run 'sync-meeting-skill.sh' to deploy REPO -> USER" >&2
    exit 1
    ;;
  --from-user)
    SRC="$USER_DIR/"; DST="$REPO_DIR/"; LABEL="USER -> REPO"
    ;;
  deploy)
    SRC="$REPO_DIR/"; DST="$USER_DIR/"; LABEL="REPO -> USER"
    ;;
  *)
    echo "usage: sync-meeting-skill.sh [--check | --from-user]" >&2
    exit 2
    ;;
esac

[[ -d "$DST" ]] || mkdir -p "$DST"
rsync -a --delete "${RSYNC_X[@]}" "$SRC" "$DST"
echo "[sync] $LABEL done - copies are now byte-identical"
