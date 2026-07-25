#!/usr/bin/env bash
# backfill-research-index.sh - CI OWNS the research folder index.
#
# The old model made every research doc PR hand-append its own row to the shared
# research/<topic>/README.md index. When several doc PRs were open at once they
# all appended to the same file and COLLIDED on merge (GitHub cannot run a union
# merge driver), which is why doc PRs kept getting stuck with conflicts.
#
# New model: PRs do NOT touch the index. This script backfills every missing row
# and runs in CI on push-to-main (and can be run manually / nightly). Idempotent,
# additive-only, and it never rewrites existing rows - so it cannot cause a noisy
# reformat. Same row format as the retired skill helper add-index-row.sh.
#
# Usage: backfill-research-index.sh [repo-root]
# Exit 0 always (advisory). Prints what it backfilled; sets no error on a clean index.
set -uo pipefail
REPO="${1:-$(git rev-parse --show-toplevel 2>/dev/null)}"
[ -d "$REPO/research" ] || { echo "[backfill-index] no research/ dir, skipping"; exit 0; }

changed=0
for docdir in "$REPO"/research/*/[0-9]*-*/; do
  [ -d "$docdir" ] || continue
  docdir="${docdir%/}"
  slug="$(basename "$docdir")"
  case "$slug" in _*) continue ;; esac
  num="$(printf '%s' "$slug" | grep -oE '^[0-9]{3,4}')"
  [ -n "$num" ] || continue
  readme="$docdir/README.md"; [ -f "$readme" ] || continue
  topic_readme="$(dirname "$docdir")/README.md"; [ -f "$topic_readme" ] || continue
  # already indexed? (either the link or a leading "| <num> |" row)
  grep -qF "(./$slug/)" "$topic_readme" && continue
  grep -qE "^\|[[:space:]]*$num[[:space:]]*\|" "$topic_readme" && continue
  # derive the row from the doc's own H1 + Goal line (same as add-index-row.sh)
  title="$(grep -m1 -E '^#[[:space:]]+[0-9]{3,4}' "$readme" | sed -E 's/^#[[:space:]]+[0-9]{3,4}[[:space:]]*[—-][[:space:]]*//' || true)"
  [ -n "$title" ] || title="$(grep -m1 -E '^#[[:space:]]+' "$readme" | sed -E 's/^#[[:space:]]+//' || true)"
  [ -n "$title" ] || title="Doc $num"
  summary="$(grep -m1 -E '^>[[:space:]]*\*\*Goal:\*\*' "$readme" | sed -E 's/^>[[:space:]]*\*\*Goal:\*\*[[:space:]]*//' || true)"
  [ -n "$summary" ] || summary="Research doc $num."
  title="${title//|/-}"; summary="${summary//|/-}"
  [ -z "$(tail -c1 "$topic_readme")" ] || printf '\n' >> "$topic_readme"
  printf '| %s | [%s](./%s/) | STANDALONE | %s |\n' "$num" "$title" "$slug" "$summary" >> "$topic_readme"
  echo "[backfill-index] backfilled doc $num -> $(basename "$(dirname "$docdir")")/README.md"
  changed=1
done
[ "$changed" = 0 ] && echo "[backfill-index] index already complete"
exit 0
