#!/usr/bin/env bash
# Pre-commit guard against new doc-number collisions in research/.
# Doc 669 + this session 2026-05-18.
#
# Allows 30+ historical collisions (renaming them = thousands of broken
# cross-refs - blast radius > impact). Blocks any NEW collision introduced
# in this commit.
#
# Invoked from .husky/pre-commit. Standalone-safe: pass repo root as $1
# or default to git rev-parse --show-toplevel.

set -uo pipefail

REPO="${1:-$(git rev-parse --show-toplevel 2>/dev/null)}"
if [[ -z "$REPO" || ! -d "$REPO/research" ]]; then
  echo "[doc-collision-guard] no research/ dir found, skipping" >&2
  exit 0
fi

STAGED=$(git diff --cached --name-only --diff-filter=A 2>/dev/null | grep -E '^research/[^/]+/[0-9]+-' | head -50)
if [[ -z "$STAGED" ]]; then
  exit 0
fi

NEW_NUMS=$(echo "$STAGED" | sed -E 's|^research/[^/]+/([0-9]+)-.*|\1|' | sort -u)

EXISTING_NUMS=$(git ls-tree -r HEAD --name-only 2>/dev/null \
  | grep -E '^research/[^/]+/[0-9]+-' \
  | sed -E 's|^research/[^/]+/([0-9]+)-([^/]+).*|\1\t\2|' \
  | sort -u)

COLLISIONS=""
for num in $NEW_NUMS; do
  staged_slug=$(echo "$STAGED" | grep -E "^research/[^/]+/${num}-" | head -1 | sed -E 's|^research/[^/]+/[0-9]+-([^/]+).*|\1|')
  existing_slugs=$(echo "$EXISTING_NUMS" | awk -v n="$num" '$1 == n { print $2 }')
  if [[ -n "$existing_slugs" ]]; then
    for slug in $existing_slugs; do
      if [[ "$slug" != "$staged_slug" ]]; then
        COLLISIONS="${COLLISIONS}\n  doc ${num}: new = '${staged_slug}', existing = '${slug}'"
      fi
    done
  fi
done

if [[ -n "$COLLISIONS" ]]; then
  echo "" >&2
  echo "[doc-collision-guard] BLOCKED - new doc number collides with existing research/:" >&2
  printf "$COLLISIONS\n" >&2
  echo "" >&2
  echo "Pick the next free number. Recent ceiling:" >&2
  git ls-tree -r HEAD --name-only 2>/dev/null \
    | grep -E '^research/[^/]+/[0-9]+-' \
    | sed -E 's|^research/[^/]+/([0-9]+)-.*|\1|' \
    | sort -nu | tail -5 | sed 's/^/  /' >&2
  echo "" >&2
  echo "If intentional co-location, the override flag is documented in research/COLLISION_TOLERANCE.md." >&2
  exit 1
fi

exit 0
