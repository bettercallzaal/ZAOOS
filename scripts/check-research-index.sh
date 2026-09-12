#!/usr/bin/env bash
# Pre-commit guard against research/ index drift.
# Added 2026-06-06 after the events/business indexes silently froze ~150 docs
# behind reality (PRs #774/#775 backfilled 313+ missing rows).
#
# Rule: every research/<topic>/<number>-* doc dir MUST have a matching row in
# that folder's README.md index table (a link of the form `(./<slug>/)`).
#
# Default mode (pre-commit): only checks doc dirs ADDED in the staged diff.
# Keeps the hook fast.
#
# THIS MODE DOES NOT BLOCK ANYTHING, AND SAYING SO IS HALF THIS SCRIPT'S JOB.
# .husky/pre-commit invokes it as `... || echo "not blocking"`, because the index
# became CI-owned (.github/workflows/research-index.yml backfills on merge) after
# concurrent doc PRs collided hand-editing the shared README. The header used to
# say "adding a doc without indexing it is blocked", and the output used to print
# BLOCKED, so BOTH lines landed in the same terminal one above the other:
#
#     [research-index-guard] BLOCKED - research doc(s) not listed ...
#     [research-index] note: doc(s) not indexed yet - CI backfills (not blocking)
#
# That cost a real misdiagnosis on 2026-09-12: it was read as the thing refusing
# a merge commit, and the actual blocker was a different gate entirely. An
# advisory check speaking in the imperative trains readers to skim the word, and
# then the next real BLOCKED gets skimmed too (noisy-signal-guard.md). So this
# script now REPORTS WHAT IT FOUND and leaves the consequence to its caller,
# which is the only party that knows one. The exit code still distinguishes
# found-something from clean, which is what --all in CI acts on.
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
  # MID-MERGE: A DOC IS NEWLY ADDED ONLY IF IT IS ABSENT FROM BOTH PARENTS.
  #
  # `git diff --cached` compares the index against HEAD alone, so in a merge
  # every doc the OTHER parent added since the branch point reads as new here.
  # Measured 2026-09-12: merging main into a branch 40+ commits behind reported
  # research/business/2477-jubjub-sdk-integration-spec as unindexed, a doc that
  # is on main and is missing from main's OWN folder README - so the finding was
  # real, and attributing it to this commit was not.
  #
  # Third gate with this bug after #3498 and #3502; the intersection is theirs.
  # `git merge-base` does not help (the other side added after the branch point)
  # and a MERGE_HEAD early-exit is fail-open, since conflict resolution is an edit.
  # EMPTY AND FAILED ARE DIFFERENT ANSWERS, and conflating them breaks the
  # primary case. A plain inherited merge adds NO research docs during the
  # resolution, so the MERGE_HEAD side is legitimately empty - and an
  # "if theirs is empty, do not filter" fallback then reports every doc the
  # other parent brought, which is the bug this whole change exists to remove.
  # My first version did exactly that and the first control caught it.
  #
  # So read GIT'S exit code, never the emptiness of the output, and never
  # through a pipe: `git ... | grep` reports grep's status, so a git that
  # cannot read the index looks identical to a clean tree. Capture, check,
  # then filter - the same rule git-secret-scan.sh states at its own two reads.
  docs_added_against() { # $1 = "" for HEAD, or a ref; sets REPLY, returns git's status
    local out
    if ! out=$(git -C "$REPO" diff --cached --name-only --diff-filter=A ${1:+"$1"} 2>&1); then
      REPLY=""; return 1
    fi
    REPLY=$(printf '%s\n' "$out" | grep -E '^research/[^_/][^/]*/[0-9]+-' | head -200)
    return 0
  }

  docs_added_against "" || { echo "[research-index] cannot read the staged changes, nothing checked" >&2; exit 0; }
  STAGED="$REPLY"
  if [[ -n "$STAGED" ]] && git -C "$REPO" rev-parse -q --verify MERGE_HEAD >/dev/null 2>&1; then
    if docs_added_against MERGE_HEAD; then
      # REPLY may be empty, and empty is MEANINGFUL here: nothing was authored
      # during the resolution, so nothing staged is this commit's claim.
      STAGED=$(comm -12 <(printf '%s\n' "$STAGED" | sort -u) \
                        <(printf '%s\n' "$REPLY" | sort -u))
    fi
    # If that read FAILED, STAGED is left alone. This mode is advisory, so
    # over-reporting costs a line of output and under-reporting would drop the
    # check silently.
  fi
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
  # NOT "BLOCKED": this script does not know whether its caller blocks. It says
  # what it found; .husky/pre-commit and research-index.yml say what happens next.
  echo "[research-index] FOUND - research doc(s) not listed in the folder index:" >&2
  printf "$MISSING\n" >&2
  echo "" >&2
  echo "Add a table row to the folder's README.md, e.g.:" >&2
  echo "  | <num> | [<Title>](./<slug>/) | STANDALONE | <one-line summary> |" >&2
  echo "Run a full audit with: bash scripts/check-research-index.sh --all" >&2
  exit 1
fi

exit 0
