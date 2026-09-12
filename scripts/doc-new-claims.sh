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

# WHAT COUNTS AS A NUMBERED DOC. Two exclusions doing two different jobs.
#
# `[^_/]` skips the META dirs - research/_radar, _archive, _handoffs - whose
# files are dated or non-numbered and are not collision-eligible.
#
# DATE_RE then skips a date-named file in an ORDINARY topic dir.
# research/inspiration/2026-09-12.md (9 such on main) parsed as a claim on doc
# number 2026, and the BLOCKING pre-commit gate refused the commit with "doc
# number(s) not reserved: 2026". Measured 2026-09-12; introduced by this
# script's first version.
#
# THE FIX IS NOT "A DOC IS A DIRECTORY", WHICH IS TRUE OF THE CONVENTION AND
# FALSE OF MAIN. Ten real numbered docs are bare FILES under ordinary topics -
# research/music/757-web3-audio-video-streaming-landscape.md and nine others -
# and a directory requirement skips all ten. That trades a false positive for a
# FALSE NEGATIVE, and this rule feeds the auto-merge path: a false positive
# blocks a commit and is visible, a false negative merges a duplicate number
# with nobody present. 757 is ALREADY duplicated inside those ten
# (agents/757-poidh-sentinel and music/757-web3-audio), so under a directory
# rule a third claim on 757 would pass silently. Caught by the vault lane
# reviewing #3497; the diagnostic that would have caught it earlier is a COUNT -
# the rule matched 2231 paths where the library holds about 2120 docs.
DOC_RE='^research/[^_/][^/]*/[0-9]+-[^/]+'
DATE_RE='^research/[^/]+/[0-9]{4}-[0-9]{2}-[0-9]{2}'

# MERGING: A PATH IS NEWLY AUTHORED ONLY IF IT IS ABSENT FROM BOTH PARENTS.
#
# The index of a merge commit contains everything both sides brought. Diffing it
# against HEAD alone therefore reports every doc the OTHER side added since the
# branch point as newly added - measured on a branch 40 commits behind main: 5
# claims seen, 0 genuinely new, and the commit was refused for numbers main
# already holds. That made a conflicted merge impossible on any branch behind by
# doc work, which is exactly the operation `merge, never rebase` requires.
#
# Two fixes were considered and both were wrong. `git merge-base` does not help:
# the other side added those docs AFTER the branch point, so they are in that
# diff too. And exiting early when MERGE_HEAD exists is FAIL-OPEN - conflict
# resolution is an edit, so a doc genuinely typed during a merge would skip the
# gate entirely, which is `--no-verify` with no flag and no trace.
#
# Intersecting the two parents' diffs is exact. A doc from the other side is
# present in MERGE_HEAD, so it never enters the second set. A doc from our side
# is present in HEAD, so it never enters the first. A doc authored during the
# resolution is in neither parent, enters both, and is still caught. Fix shape
# from the dotfiles lane; controls below.
MERGING=""
if git rev-parse -q --verify MERGE_HEAD >/dev/null 2>&1; then MERGING=1; fi

case "${1:-}" in
  --staged) NAME_ONLY=(git diff --cached --name-only --diff-filter=A)
            NAME_STATUS=(git diff --cached --name-status --diff-filter=R) ;;
  --range)  base="${2:-}"
            if [[ -z "$base" ]]; then echo "doc-new-claims: --range needs a base ref" >&2; exit 2; fi
            NAME_ONLY=(git diff --name-only --diff-filter=A "$base...HEAD")
            NAME_STATUS=(git diff --name-status --diff-filter=R "$base...HEAD") ;;
  --merge-duplicates)
            # A THIRD QUESTION: what does the MERGED RESULT contain twice?
            #
            # "What did this commit author" is answered by --staged, and it
            # cannot see this case. Two branches can each claim the same number
            # independently, with different slugs, and each one's own pre-commit
            # run correctly saw that number free at the time. Neither side is
            # wrong; the MERGE creates the duplicate. So it is absent from
            # neither parent - it is present in BOTH - and the intersection is
            # empty by construction:
            #
            #   added vs HEAD        research/business/2480-main-thing/…
            #   added vs MERGE_HEAD  research/business/2480-branch-thing/…
            #   intersection         (empty)
            #   merged index         BOTH directories, numbered 2480
            #
            # That is the case a reservation gate exists for - #1073 duplicating
            # 964 is the same shape - and it is the one a merge uniquely
            # produces. Found by the vault lane reviewing #3498.
            #
            # RESTRICTED TO NUMBERS THIS MERGE TOUCHED, deliberately. A
            # whole-tree duplicate scan fires constantly: 221 numbers on main
            # already have more than one directory, the pre-band duplicates that
            # research/COLLISION_TOLERANCE.md exists to tolerate. A check that
            # fires on every commit is a check nobody reads
            # (noisy-signal-guard.md), so this looks only at numbers either side
            # added in THIS merge.
            #
            # Silent when not merging, and silent on a single claim.
            if [[ -z "$MERGING" ]]; then exit 0; fi

            # SAME RULE AS --staged, BOTH TIMES. The two earlier bugs here were
            # both this rule applied unevenly (zorca, reviewing #3500):
            #
            #  1. FALSE BLOCK. `nums` applied DOC_RE but not DATE_RE while the
            #     claims path applied both, so the nine dated logs in
            #     research/inspiration/2026-04-0*.md all read as doc 2026. Any
            #     merge adding one more put 2026 in `touched`, found nine
            #     "holders", and blocked a daily log with advice to renumber it.
            #  2. FALSE PASS, and the worse one. `touched` came from
            #     --diff-filter=A only, so two branches that each RENAMED a doc
            #     onto 2480 produced an empty `touched` and a clean exit with two
            #     2480 directories in the merged index. That is the rename
            #     blindness #3444 and #3494 fixed elsewhere - and THE GATE'S OWN
            #     REMEDIATION IS A RENAME, so two people following its advice on
            #     the same number create exactly the input it cannot see.
            #
            # A claim against a parent is therefore an addition OR a rename whose
            # NUMBER changed, date-named files excluded - identical to --staged.
            claims_against() {
              local base="$1" added renamed
              added=$(git diff --cached --name-only --diff-filter=A "$base") || return 1
              renamed=$(git diff --cached --name-status --diff-filter=R "$base") || return 1
              printf '%s\n' "$added"
              printf '%s\n' "$renamed" | awk -F'\t' -v re="$DOC_RE" -v dre="$DATE_RE" '
                $3 ~ re && $3 !~ dre {
                  newnum = $3; sub(/^research\/[^\/]+\//, "", newnum); sub(/-.*$/, "", newnum)
                  oldnum = ""
                  if ($2 ~ re && $2 !~ dre) {
                    oldnum = $2; sub(/^research\/[^\/]+\//, "", oldnum); sub(/-.*$/, "", oldnum)
                  }
                  if (oldnum != newnum) print $3
                }'
            }
            nums() { grep -E "$DOC_RE" | grep -vE "$DATE_RE" | sed -E 's|^research/[^/]+/([0-9]+)-.*|\1|' | sort -u; }
            if ! ours=$(claims_against HEAD) || ! theirs=$(claims_against MERGE_HEAD); then
              echo "doc-new-claims: cannot read the merge diffs - failing closed" >&2
              exit 1
            fi
            touched=$(printf '%s\n%s\n' "$ours" "$theirs" | nums)
            [[ -z "$touched" ]] && exit 0
            if ! tracked=$(git ls-files 2>&1); then
              echo "doc-new-claims: cannot list the merged index - failing closed" >&2
              exit 1
            fi
            identities=$(printf '%s\n' "$tracked" \
              | grep -E "$DOC_RE" \
              | grep -vE "$DATE_RE" \
              | sed -E 's|^(research/[^/]+/[0-9]+-[^/]+)(/.*)?$|\1|' \
              | sort -u)
            for n in $touched; do
              held=$(printf '%s\n' "$identities" | grep -E "^research/[^/]+/${n}-" | sort -u)
              if [[ $(printf '%s\n' "$held" | grep -c .) -gt 1 ]]; then
                printf 'DUPLICATE %s -> %s\n' "$n" "$(printf '%s\n' "$held" | tr '\n' ' ')"
              fi
            done
            exit 0 ;;
  *)        echo "usage: doc-new-claims.sh --staged | --range <base> | --merge-duplicates" >&2; exit 2 ;;
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
renamed_claims=$(printf '%s\n' "$renamed" | awk -F'\t' -v re="$DOC_RE" -v dre="$DATE_RE" '
  $3 ~ re && $3 !~ dre {
    newnum = $3; sub(/^research\/[^\/]+\//, "", newnum); sub(/-.*$/, "", newnum)
    oldnum = ""
    if ($2 ~ re) { oldnum = $2; sub(/^research\/[^\/]+\//, "", oldnum); sub(/-.*$/, "", oldnum) }
    if (oldnum != newnum) print $3
  }')

# Normalise both to the doc DIRECTORY, so a doc adding five files claims once.
claims=$(printf '%s\n%s\n' "$added" "$renamed_claims" \
  | grep -E "$DOC_RE" \
  | grep -vE "$DATE_RE" \
  | sed -E 's|^(research/[^/]+/[0-9]+-[^/]+)(/.*)?$|\1|' \
  | sort -u)

# Mid-merge: keep only what the OTHER parent does not already have. The two
# sides must be normalised IDENTICALLY - same DOC_RE, same DATE_RE, same sed -
# or the intersection compares different spellings of the same doc and silently
# returns nothing.
if [[ -n "$MERGING" && "${1:-}" == "--staged" ]]; then
  if ! theirs=$(git diff --cached --name-only --diff-filter=A MERGE_HEAD 2>&1); then
    echo "doc-new-claims: git diff against MERGE_HEAD failed - failing closed:" >&2
    printf '%s\n' "$theirs" | sed 's/^/  /' >&2
    exit 1
  fi
  theirs_claims=$(printf '%s\n' "$theirs" \
    | grep -E "$DOC_RE" \
    | grep -vE "$DATE_RE" \
    | sed -E 's|^(research/[^/]+/[0-9]+-[^/]+)(/.*)?$|\1|' \
    | sort -u)
  claims=$(comm -12 <(printf '%s\n' "$claims") <(printf '%s\n' "$theirs_claims"))
fi

printf '%s\n' "$claims" | grep -E "$DOC_RE" || true
exit 0
