#!/usr/bin/env bash
# sync-meeting-skill.sh - compare, and on an explicit order copy, the two copies
# of the /meeting skill.
#
# The skill lives in two places:
#   REPO  .claude/skills/meeting/   - this repo's copy
#   USER  ~/.claude/skills/meeting/ - the copy Claude Code actually runs
#
# NEITHER COPY IS THE SOURCE OF TRUTH BY DEFAULT. This script used to say the
# REPO copy was, and with no argument it copied REPO over USER with
# `rsync --delete`. Measured 2026-11-13: the USER copy is the maintained one
# (27 files, last changed 2026-11-11, kept in Zaal's own skill set) and the
# REPO copy is an older half of it (12 files, last changed 2026-07-17). A bare
# run would have replaced the newer skill with the older one and removed the
# 15 files only the newer one has. So:
#
#   - There is no default direction. No argument prints usage and exits 2.
#   - A copy that would REMOVE files the destination has and the source lacks
#     is refused, and the files are listed, unless --delete-extra is also given.
#   - --from-user writes Zaal's own copy into this repo, which is PUBLIC. The
#     maintained copy carries private paths and names (.claude/skills-archive/
#     README.md, 2026-10-24). Do not commit the result without a public scan.
#
# Usage:
#   sync-meeting-skill.sh --check                      report drift, exit 1 if any (no writes)
#   sync-meeting-skill.sh --to-user   [--delete-extra]  REPO -> USER
#   sync-meeting-skill.sh --from-user [--delete-extra]  USER -> REPO
#
# Exit: 0 in sync or copied; 1 drift (--check); 2 usage, a missing folder, or
# a refused copy. Nothing is written on 1 or 2.
#
# SYNC_MEETING_REPO_DIR and SYNC_MEETING_USER_DIR override the two folders.
# They exist for scripts/sync-meeting-skill.test.sh, which must never touch
# the real ~/.claude/skills.
set -euo pipefail

REPO_DIR="${SYNC_MEETING_REPO_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/.claude/skills/meeting}"
USER_DIR="${SYNC_MEETING_USER_DIR:-$HOME/.claude/skills/meeting}"

usage() {
  cat >&2 <<'EOF'
usage: sync-meeting-skill.sh --check
       sync-meeting-skill.sh --to-user   [--delete-extra]   (REPO -> USER)
       sync-meeting-skill.sh --from-user [--delete-extra]   (USER -> REPO)
There is no default direction: neither copy is the source of truth. Run --check first.
EOF
}

MODE=""
DELETE_EXTRA=0
for arg in "$@"; do
  case "$arg" in
    --check|--to-user|--from-user)
      if [[ -n "$MODE" ]]; then
        echo "ERROR: give exactly one of --check, --to-user, --from-user (got $MODE and $arg)" >&2
        usage; exit 2
      fi
      MODE="$arg"
      ;;
    --delete-extra) DELETE_EXTRA=1 ;;
    *) echo "ERROR: unknown argument: $arg" >&2; usage; exit 2 ;;
  esac
done

if [[ -z "$MODE" ]]; then
  echo "REFUSED: no direction given, nothing copied." >&2
  usage
  exit 2
fi
if [[ "$MODE" == "--check" && "$DELETE_EXTRA" -eq 1 ]]; then
  echo "ERROR: --delete-extra has no meaning with --check" >&2
  usage; exit 2
fi

[[ -d "$REPO_DIR" ]] || { echo "ERROR: repo skill dir not found: $REPO_DIR" >&2; exit 2; }

DIFF_X=(-x __pycache__ -x '*.pyc' -x .DS_Store)
RSYNC_X=(--exclude=__pycache__ --exclude='*.pyc' --exclude=.DS_Store)

if [[ "$MODE" == "--check" ]]; then
  [[ -d "$USER_DIR" ]] || { echo "ERROR: user skill dir not found: $USER_DIR" >&2; exit 2; }
  if diff -rq "${DIFF_X[@]}" "$REPO_DIR" "$USER_DIR" >/dev/null 2>&1; then
    echo "[sync] in sync - REPO and USER copies match"
    exit 0
  fi
  echo "[sync] DRIFT between the two /meeting skill copies:" >&2
  diff -rq "${DIFF_X[@]}" "$REPO_DIR" "$USER_DIR" >&2 || true
  echo "[sync] neither copy is the source of truth; read the drift, then choose --to-user or --from-user" >&2
  exit 1
fi

if [[ "$MODE" == "--to-user" ]]; then
  SRC="$REPO_DIR"; DST="$USER_DIR"; LABEL="REPO -> USER"
else
  SRC="$USER_DIR"; DST="$REPO_DIR"; LABEL="USER -> REPO"
fi
[[ -d "$SRC" ]] || { echo "ERROR: source dir not found: $SRC" >&2; exit 2; }

# Files the destination has and the source lacks: a copy with --delete removes
# them. Listed and refused unless the caller said --delete-extra.
EXTRA=()
if [[ -d "$DST" ]]; then
  while IFS= read -r -d '' f; do
    rel="${f#"$DST"/}"
    case "$rel" in
      *__pycache__*|*.pyc|.DS_Store|*/.DS_Store) continue ;;
    esac
    [[ -e "$SRC/$rel" ]] || EXTRA+=("$rel")
  done < <(find "$DST" -type f -print0)
fi

if [[ "${#EXTRA[@]}" -gt 0 && "$DELETE_EXTRA" -ne 1 ]]; then
  echo "REFUSED: $LABEL would remove ${#EXTRA[@]} file(s) that only the destination has. Nothing copied." >&2
  printf '  only in destination: %s\n' "${EXTRA[@]}" >&2
  echo "  destination: $DST" >&2
  echo "If the destination is the older copy and these should go, rerun with --delete-extra." >&2
  echo "If the destination is the newer copy, you have the direction backwards." >&2
  exit 2
fi

[[ -d "$DST" ]] || mkdir -p "$DST"
# --checksum: without it rsync skips a file whose size and timestamp match the
# destination's even when the bytes differ, and "byte-identical" below is false.
rsync -a --checksum --delete "${RSYNC_X[@]}" "$SRC/" "$DST/"
echo "[sync] $LABEL done - copies are now byte-identical (${#EXTRA[@]} destination-only file(s) removed)"
if [[ "$MODE" == "--from-user" ]]; then
  echo "[sync] this repo is public: scan the result for private paths and names before committing it" >&2
fi
