#!/usr/bin/env bash
# handoff-detect.sh - print repo type + suggested output path for /handoff.
# Usage: bash handoff-detect.sh
#
# Output (stdout): two lines.
#   <type>
#   <suggested-output-dir>
# Where <type> is one of: zao, bcz, other-repo, no-repo

set -uo pipefail

REPO_ROOT=""
if git rev-parse --show-toplevel >/dev/null 2>&1; then
  REPO_ROOT=$(git rev-parse --show-toplevel)
fi

DATE=$(date -u +%Y-%m-%d)

if [[ -z "$REPO_ROOT" ]]; then
  echo "no-repo"
  echo "$HOME/.zao/handoff/session-$DATE-NEEDSSLUG"
  exit 0
fi

# ZAO OS V1 detection - research/events/ + community.config.ts
if [[ -d "$REPO_ROOT/research/events" && -f "$REPO_ROOT/community.config.ts" ]]; then
  echo "zao"
  echo "$REPO_ROOT/research/events/session-$DATE-NEEDSSLUG"
  exit 0
fi

# BCZ detection - personal-brand bcz-* repos
case "$REPO_ROOT" in
  */bcz-*|*/BetterCallZaal/*|*/bettercallzaal*)
    echo "bcz"
    echo "$REPO_ROOT/.handoffs/session-$DATE-NEEDSSLUG"
    exit 0
    ;;
esac

# Some other git repo
echo "other-repo"
echo "$REPO_ROOT/.handoffs/session-$DATE-NEEDSSLUG"
exit 0
