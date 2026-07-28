#!/usr/bin/env bash
# zao-branch-prune - categorize + prune the ws/ branch graveyard on origin.
#
# The fleet + every session create ws/ branches; almost none get deleted, so
# origin accumulates hundreds of orphans. That bloats every fetch AND poisons
# the /zao-research doc-numbering scan (which reads ws/research-* refs).
#
# Categories:
#   MERGED     - tip reachable from origin/main. Safe to delete (work is in main).
#   ORPHAN     - unmerged, NO open PR, last commit older than $AGE_DAYS. Abandoned.
#   INFLIGHT   - has an open PR, OR committed within $AGE_DAYS. NEVER deleted.
#
# Usage:
#   zao-branch-prune                 # dry-run: print the category counts + samples
#   zao-branch-prune --execute merged    # delete only MERGED branches
#   zao-branch-prune --execute orphan    # delete ORPHAN branches (unmerged+old+no-PR)
#   AGE_DAYS=45 zao-branch-prune ...     # override the abandonment threshold (default 30)
#
# Safety: --execute never deletes a branch with an open PR or a commit inside
# AGE_DAYS. main/master/HEAD are never candidates.
set -uo pipefail
REPO="${ZAO_REPO:-/Users/zaalpanthaki/Documents/ZAO OS V1}"
AGE_DAYS="${AGE_DAYS:-30}"
MODE="${1:-}"; WHICH="${2:-}"
NOW=$(date +%s)
CUTOFF=$(( NOW - AGE_DAYS*86400 ))

cd "$REPO" || exit 1
git fetch origin --prune >/dev/null 2>&1

# open-PR head refs (never touch these)
OPEN_PR_REFS=$(gh api 'repos/bettercallzaal/ZAOOS/pulls?state=open&per_page=100' --jq '.[].head.ref' 2>/dev/null | sort -u)
is_open_pr() { echo "$OPEN_PR_REFS" | grep -qxF "$1"; }

# merged set (tips reachable from main)
MERGED_SET=$(git branch -r --merged origin/main 2>/dev/null | sed 's#^ *origin/##' | grep '^ws/')

declare -a MERGED=() ORPHAN=() INFLIGHT=()
while IFS='|' read -r ts ref; do
  br="${ref#origin/}"
  [ -z "$br" ] && continue
  if echo "$MERGED_SET" | grep -qxF "$br"; then
    MERGED+=("$br"); continue
  fi
  if is_open_pr "$br" || [ "$ts" -ge "$CUTOFF" ]; then
    INFLIGHT+=("$br"); continue
  fi
  ORPHAN+=("$br")
done < <(git for-each-ref --format='%(committerdate:unix)|%(refname:short)' refs/remotes/origin/ws 2>/dev/null)

echo "ws/ branch audit ($(date +%Y-%m-%d), abandonment threshold ${AGE_DAYS}d):"
echo "  MERGED   (safe delete):        ${#MERGED[@]}"
echo "  ORPHAN   (unmerged+old+no-PR): ${#ORPHAN[@]}"
echo "  INFLIGHT (open-PR or recent):  ${#INFLIGHT[@]}   [never deleted]"
echo

do_delete() {
  # $1 = label, rest = branch names (bash-3.2 compatible, no namerefs)
  local label="$1"; shift
  echo "Deleting $# ${label} branches..."
  local n=0
  for b in "$@"; do
    git push origin --delete "$b" >/dev/null 2>&1 && n=$((n+1))
    [ $((n % 25)) -eq 0 ] && echo "  ...$n"
  done
  echo "Deleted $n."
}

if [ "$MODE" = "--execute" ]; then
  case "$WHICH" in
    merged) [ ${#MERGED[@]} -gt 0 ] && do_delete "MERGED" "${MERGED[@]}" || echo "no MERGED branches" ;;
    orphan) [ ${#ORPHAN[@]} -gt 0 ] && do_delete "ORPHAN" "${ORPHAN[@]}" || echo "no ORPHAN branches" ;;
    *) echo "usage: zao-branch-prune --execute [merged|orphan]"; exit 1 ;;
  esac
else
  echo "DRY-RUN. Sample ORPHAN (oldest 10):"
  printf '  %s\n' "${ORPHAN[@]:0:10}"
  echo
  echo "To act: zao-branch-prune --execute merged   (or)   --execute orphan"
fi
