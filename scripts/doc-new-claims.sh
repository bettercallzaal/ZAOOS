#!/usr/bin/env bash
# Emit the research doc directories this change makes a NEW CLAIM on, one per
# line, as `research/<topic>/<number>-<slug>/`.
#
# WHY THIS EXISTS AS ITS OWN SCRIPT. Two guards ask the same question - the
# pre-commit gate (scripts/check-research-doc-collisions.sh) about the index,
# and the CI guard (.github/workflows/doc-collision-guard.yml) about a PR range.
# Both answered it with `--diff-filter=A`, and both had the same hole. The rule
# for what counts as a claim is subtle enough (see below) that keeping two
# copies of it guarantees they drift apart, and the drift is silent: a guard
# that under-selects reports success.
#
# WHAT COUNTS AS A NEW CLAIM ON A NUMBER (measured 2026-09-12):
#
#   ADDED      research/x/2471-foo/README.md            -> yes, claims 2471
#   RENAMED    research/x/2400-foo -> research/x/2471-foo -> yes, claims 2471.
#              git detects renames by default (diff.renames on since 2.9), so
#              this stages as ONE R entry that --diff-filter=A drops entirely.
#              A doc renumbered onto a taken number passed both guards.
#   RENAMED    research/x/2400-foo -> research/x/2400-bar -> NO. The number did
#              not move; only the slug did. This is why the fix is not simply
#              `--diff-filter=ACMR`: docs predating the doc-NNNN tag scheme have
#              no reservation, so treating a slug rename as a claim would block
#              it, and folding in M would block every ordinary edit to every
#              doc. A guard that fires on the ordinary case is ignored by the
#              time it fires on the real one (noisy-signal-guard.md).
#   RENAMED    notes/scratch.md -> research/x/2471-foo/  -> yes. Moved in from
#              outside research/, so there is no old number and it is a claim.
#   MODIFIED   research/x/2471-foo/README.md            -> NO.
#
# Usage:
#   doc-new-claims.sh --staged            # the index (pre-commit)
#   doc-new-claims.sh --range <base>      # <base>...HEAD (CI, three dots)
#
# Fails CLOSED: if git cannot answer, this exits non-zero with a message on
# stderr rather than printing nothing. Empty output must mean "no claims" and
# never "I could not look" (silent-failure-guard.md rule 5; the same confusion
# that let a staged secret through the scan gate in PR #3444).

set -uo pipefail

DOC_RE='^research/[^_/][^/]*/[0-9]+-'

case "${1:-}" in
  --staged) NAME_ONLY=(git diff --cached --name-only --diff-filter=A)
            NAME_STATUS=(git diff --cached --name-status --diff-filter=R) ;;
  --range)  base="${2:-}"
            if [[ -z "$base" ]]; then echo "doc-new-claims: --range needs a base ref" >&2; exit 2; fi
            NAME_ONLY=(git diff --name-only --diff-filter=A "$base...HEAD")
            NAME_STATUS=(git diff --name-status --diff-filter=R "$base...HEAD") ;;
  *)        echo "usage: doc-new-claims.sh --staged | --range <base>" >&2; exit 2 ;;
esac

# Capture BEFORE filtering. Reading a status through `git ... | grep` reports
# grep's exit, so a git that cannot read the tree looks exactly like a clean one.
if ! added=$("${NAME_ONLY[@]}" 2>&1); then
  echo "doc-new-claims: git diff (added) failed - failing closed:" >&2
  printf '%s\n' "$added" | sed 's/^/  /' >&2
  exit 1
fi
if ! renamed=$("${NAME_STATUS[@]}" 2>&1); then
  echo "doc-new-claims: git diff (renamed) failed - failing closed:" >&2
  printf '%s\n' "$renamed" | sed 's/^/  /' >&2
  exit 1
fi

# `R<score>\told\tnew`. Keep the new path only when the number actually moved.
renamed_claims=$(printf '%s\n' "$renamed" | awk -F'\t' -v re="$DOC_RE" '
  $3 ~ re {
    newnum = $3; sub(/^research\/[^\/]+\//, "", newnum); sub(/-.*$/, "", newnum)
    oldnum = ""
    if ($2 ~ re) { oldnum = $2; sub(/^research\/[^\/]+\//, "", oldnum); sub(/-.*$/, "", oldnum) }
    if (oldnum != newnum) print $3
  }')

# Normalise both to the doc DIRECTORY, so a doc adding five files claims once.
printf '%s\n%s\n' "$added" "$renamed_claims" \
  | grep -E "$DOC_RE" \
  | sed -E 's|^(research/[^/]+/[0-9]+-[^/]+)(/.*)?$|\1/|' \
  | sort -u
exit 0
