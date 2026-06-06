#!/usr/bin/env bash
# Pre-commit guard against research/ index drift.
# Added 2026-06-06 after the events/business indexes silently froze ~150 docs
# behind reality (PRs #774/#775 backfilled 313+ missing rows).
#
# Rule: every research/<topic>/<number>-* doc dir MUST have a matching row in
# that folder's README.md index table (a link of the form `(./<slug>/)`).
#
# Default mode (pre-commit): only checks doc dirs ADDED in the staged diff, so
# adding a doc without indexing it is blocked. Keeps the hook fast.
#
# Full mode: `check-research-index.sh --all` audits every topic folder. Use in
# CI or manually after bulk moves.
#
# Underscore-prefixed meta dirs (_archive/, _graph/, _handoffs/, _zaostock-hub/)
# and the dated inspiration/ logs are skipped - they are not numbered docs.
#
# Invoked from .husky/pre-commit. Standalone-safe: pass repo root as $1 (after
# any flag) or default to git rev-parse --show-toplevel.

set -uo pipefail

MODE="staged"
if [[ "${1:-}" == "--all" ]]; then MODE="all"; shift; fi

REPO="${1:-$(git rev-parse --show-toplevel 2>/dev/null)}"
if [[ -z "$REPO" || ! -d "$REPO/research" ]]; then
  echo "[research-index-guard] no research/ dir found, skipping" >&2
  exit 0
fi

# Returns 0 if the folder README indexes the given slug.
indexed() {
  local folder="$1" slug="$2"
  grep -qF "(./$slug/)" "$REPO/research/$folder/README.md" 2>/dev/null
}

MISSING=""

if [[ "$MODE" == "staged" ]]; then
  # New doc dirs added in this commit: research/<topic>/<num>-<slug>/...
  STAGED=$(git -C "$REPO" diff --cached --name-only --diff-filter=A 2>/dev/null \
    | grep -E '^research/[^_/][^/]*/[0-9]+-' | head -200)
  [[ -z "$STAGED" ]] && exit 0
  PAIRS=$(echo "$STAGED" | sed -E 's|^research/([^/]+)/([0-9]+-[^/]+)/.*|\1\t\2|' | sort -u)
  while IFS=$'\t' read -r folder slug; do
    [[ -z "$folder" || -z "$slug" ]] && continue
    [[ -f "$REPO/research/$folder/README.md" ]] || continue
    indexed "$folder" "$slug" || MISSING="${MISSING}\n  $folder/$slug -> add a row to research/$folder/README.md"
  done <<< "$PAIRS"
else
  for folder in agents music dev-workflows infrastructure governance community \
                cross-platform farcaster identity business events wavewarz security; do
    [[ -f "$REPO/research/$folder/README.md" ]] || continue
    for d in "$REPO/research/$folder"/*/; do
      slug=$(basename "$d")
      [[ "$slug" =~ ^[0-9]+- ]] || continue
      indexed "$folder" "$slug" || MISSING="${MISSING}\n  $folder/$slug"
    done
  done
fi

if [[ -n "$MISSING" ]]; then
  echo "" >&2
  echo "[research-index-guard] BLOCKED - research doc(s) not listed in the folder index:" >&2
  printf "$MISSING\n" >&2
  echo "" >&2
  echo "Add a table row to the folder's README.md, e.g.:" >&2
  echo "  | <num> | [<Title>](./<slug>/) | STANDALONE | <one-line summary> |" >&2
  echo "Run a full audit with: bash scripts/check-research-index.sh --all" >&2
  exit 1
fi

exit 0
