#!/usr/bin/env bash
# handoff-build.sh - collect mechanical state for the /handoff bundle.
# Usage:
#   handoff-build.sh git       - print git state (branch, dirty, diff)
#   handoff-build.sh diff      - print just the unified diff
#   handoff-build.sh untracked - list untracked files
#   handoff-build.sh size      - print diff line count
#
# The script writes to stdout; the caller redirects to /tmp/handoff-*-<pid>.txt
# or captures inline as needed.

set -uo pipefail

MODE="${1:?missing mode: git|diff|untracked|size}"

if ! git rev-parse --show-toplevel >/dev/null 2>&1; then
  echo "ERROR: not in a git repo" >&2
  exit 1
fi

case "$MODE" in
  git)
    BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "(detached)")
    LAST_COMMIT=$(git log -1 --pretty=format:'%h - %s' 2>/dev/null || echo "(none)")

    # Ahead/behind vs upstream
    AHEAD_BEHIND=""
    if git rev-parse --abbrev-ref "@{upstream}" >/dev/null 2>&1; then
      AB=$(git rev-list --left-right --count "@{upstream}...HEAD" 2>/dev/null || echo "0	0")
      BEHIND=$(echo "$AB" | awk '{print $1}')
      AHEAD=$(echo "$AB" | awk '{print $2}')
      AHEAD_BEHIND="ahead $AHEAD, behind $BEHIND"
    else
      AHEAD_BEHIND="no upstream tracked"
    fi

    DIRTY=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
    UNTRACKED_COUNT=$(git ls-files --others --exclude-standard 2>/dev/null | wc -l | tr -d ' ')

    echo "Branch: $BRANCH ($AHEAD_BEHIND, dirty $DIRTY files, untracked $UNTRACKED_COUNT files)"
    echo "Last commit: $LAST_COMMIT"
    echo ""
    echo "--- Untracked files ---"
    git ls-files --others --exclude-standard 2>/dev/null | head -50 || echo "(none)"
    echo ""
    echo "--- Unified diff (staged + unstaged) ---"
    git diff HEAD 2>/dev/null || true
    ;;

  diff)
    git diff HEAD 2>/dev/null || true
    ;;

  untracked)
    git ls-files --others --exclude-standard 2>/dev/null
    ;;

  size)
    git diff HEAD 2>/dev/null | wc -l | tr -d ' '
    ;;

  *)
    echo "ERROR: unknown mode '$MODE'. Use: git|diff|untracked|size" >&2
    exit 2
    ;;
esac
