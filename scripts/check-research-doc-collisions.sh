#!/usr/bin/env bash
# Pre-commit guard against new doc-number collisions in research/.
# Doc 669 + this session 2026-05-18.
#
# Allows 30+ historical collisions (renaming them = thousands of broken
# cross-refs - blast radius > impact). Blocks any NEW collision introduced
# in this commit.
#
# Scans research/<topic>/<number>-* only. Underscore-prefixed meta dirs
# (research/_handoffs/, _archive/, _graph/, _zaostock-hub/) are skipped -
# their files are dated or non-numbered, not collision-eligible docs.
#
# Invoked from .husky/pre-commit. Standalone-safe: pass repo root as $1
# or default to git rev-parse --show-toplevel.

set -uo pipefail

REPO="${1:-$(git rev-parse --show-toplevel 2>/dev/null)}"
if [[ -z "$REPO" || ! -d "$REPO/research" ]]; then
  echo "[doc-collision-guard] no research/ dir found, skipping" >&2
  exit 0
fi

STAGED=$(git diff --cached --name-only --diff-filter=A 2>/dev/null | grep -E '^research/[^_/][^/]*/[0-9]+-' | head -50)
if [[ -z "$STAGED" ]]; then
  exit 0
fi

NEW_NUMS=$(echo "$STAGED" | sed -E 's|^research/[^/]+/([0-9]+)-.*|\1|' | sort -u)

EXISTING_NUMS=$(git ls-tree -r HEAD --name-only 2>/dev/null \
  | grep -E '^research/[^_/][^/]*/[0-9]+-' \
  | sed -E 's|^research/[^/]+/([0-9]+)-([^/]+).*|\1\t\2|' \
  | sort -u)

COLLISIONS=""
for num in $NEW_NUMS; do
  staged_slug=$(echo "$STAGED" | grep -E "^research/[^/]+/${num}-" | head -1 | sed -E 's|^research/[^_/][^/]*/[0-9]+-([^/]+).*|\1|')
  existing_slugs=$(echo "$EXISTING_NUMS" | awk -v n="$num" '$1 == n { print $2 }')
  if [[ -n "$existing_slugs" ]]; then
    for slug in $existing_slugs; do
      if [[ "$slug" != "$staged_slug" ]]; then
        COLLISIONS="${COLLISIONS}\n  doc ${num}: new = '${staged_slug}', existing = '${slug}'"
      fi
    done
  fi
done

# ---------------------------------------------------------------------------
# Reservation check. Added 2026-08-23.
#
# The collision block below only fires AFTER a doc is written at a taken number,
# which is too late - it cost two renumbers in one session on 2026-08-22, and
# the ceiling moved 20 numbers between reserving and committing because other
# writers (lanes, ZOE's autonomous research loop) never called zao-doc-next.
#
# zao-doc-next reserves by pushing an annotated tag `doc-NNNN`, which is a real
# compare-and-swap against the remote. But a reservation only serialises writers
# that participate. This makes participation mandatory at the commit boundary,
# which is the one place every writer has to pass through.
#
# Silent when a reservation exists, so it can reach zero (noisy-signal-guard).
UNRESERVED=""
for num in $NEW_NUMS; do
  if ! git rev-parse -q --verify "refs/tags/doc-${num}" >/dev/null 2>&1 \
     && ! git ls-remote --tags origin "doc-${num}" 2>/dev/null | grep -q .; then
    UNRESERVED="${UNRESERVED} ${num}"
  fi
done

if [[ -n "${UNRESERVED// /}" ]]; then
  echo "" >&2
  echo "[doc-collision-guard] BLOCKED - doc number(s) not reserved:${UNRESERVED}" >&2
  echo "" >&2
  echo "A number is only yours once zao-doc-next has pushed its tag. Without" >&2
  echo "that, another lane can take it while you write - which is exactly what" >&2
  echo "happened twice on 2026-08-22." >&2
  echo "" >&2
  echo "  zao-doc-next <slug>     # reserves, prints the number to use" >&2
  echo "" >&2
  echo "Then rename the directory and its '# NNNN -' heading to match." >&2
  echo "" >&2
  echo "Genuinely need to bypass (a backfill, a rescued doc)? Reserve the tag" >&2
  echo "by hand so the next writer still sees it taken:" >&2
  echo "  git tag -a doc-NNNN -m 'reserved by hand: <why>' && git push origin doc-NNNN" >&2
  exit 1
fi

if [[ -n "$COLLISIONS" ]]; then
  echo "" >&2
  echo "[doc-collision-guard] BLOCKED - new doc number collides with existing research/:" >&2
  printf "$COLLISIONS\n" >&2
  echo "" >&2
  echo "Pick the next free number. Recent ceiling:" >&2
  git ls-tree -r HEAD --name-only 2>/dev/null \
    | grep -E '^research/[^_/][^/]*/[0-9]+-' \
    | sed -E 's|^research/[^/]+/([0-9]+)-.*|\1|' \
    | sort -nu | tail -5 | sed 's/^/  /' >&2
  echo "" >&2
  echo "If intentional co-location, the override flag is documented in research/COLLISION_TOLERANCE.md." >&2
  exit 1
fi

exit 0
