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

# A NEW CLAIM ON A NUMBER IS EITHER AN ADDITION OR A RENUMBERING RENAME.
#
# This was `git diff --cached --name-only --diff-filter=A` inline. git detects
# renames by default, so `git mv research/x/2400-old research/x/2471-new`
# staged as one R entry that A dropped, and a doc renumbered ONTO a taken
# number passed this gate with exit 0 - measured 2026-09-12, the one thing the
# gate exists to stop. The rule for what counts as a claim is shared with the
# CI guard and lives in doc-new-claims.sh so the two cannot drift; see its
# header for why this is not just `--diff-filter=ACMR`.
#
# It fails closed on a git error, so an empty STAGED means no claims and never
# "I could not look".
if ! STAGED=$("$(dirname "${BASH_SOURCE[0]}")/doc-new-claims.sh" --staged); then
  echo "" >&2
  echo "[doc-collision-guard] BLOCKED - could not read the staged changes, so nothing was checked." >&2
  exit 1
fi
STAGED=$(printf '%s\n' "$STAGED" | head -50)
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
  # Existing numbers come from `git ls-tree -r HEAD` - the tree BEFORE this
  # commit. Renames became visible to this gate on 2026-09-12, and that made a
  # pre-existing assumption load-bearing: a commit that FREES a number and
  # reuses it in the same commit now reads the freed number as still taken.
  # Rare, and it fails loud rather than silent, which is the right direction -
  # but an unexplained false positive is what gets a pre-commit gate commented
  # out, so it prints its own cause. Found by the vault lane reviewing #3494.
  echo "If this same commit FREES that number - deletes the doc holding it, or" >&2
  echo "renames that doc away - this is a FALSE POSITIVE: existing numbers are" >&2
  echo "read from HEAD, the tree before this commit. Commit the removal first," >&2
  echo "or split the two changes." >&2
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
