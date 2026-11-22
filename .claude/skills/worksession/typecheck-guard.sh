#!/bin/bash
# Typecheck guard - run `npm run typecheck` before a COMMIT, not before every
# shell command.
#
# WHY THIS EXISTS
#
# `npm run typecheck` was wired directly to the Bash PreToolUse hook, so a full
# `tsc` ran before every single Bash call in this repo - before `ls`, before
# `git status`, before `echo`. Two problems, and the second is the one that
# actually costs you:
#
#   1. Cost. A full typecheck ahead of every command, most of which touch no
#      TypeScript at all.
#   2. Signal. It failed constantly (a machine with an unpopulated
#      bot/node_modules produces hundreds of phantom errors), so its output
#      became background noise and stopped being read. That is how a repo learns
#      to measure "no NEW errors" instead of "no errors" - and three real bugs
#      once sat inside that noise (.claude/rules/noisy-signal-guard.md).
#
# A typecheck is worth running when code is about to be COMMITTED. That is the
# moment it protects. Same coverage, none of the per-command tax.
#
# Sibling of branch-guard.sh, which had the identical shape of bug.

CMD="${CLAUDE_TOOL_INPUT_command:-}"
if [ -z "$CMD" ] && [ ! -t 0 ]; then
  STDIN=$(cat 2>/dev/null)
  case "$STDIN" in
    *'"command"'*)
      CMD=$(printf '%s' "$STDIN" | sed -n 's/.*"command"[[:space:]]*:[[:space:]]*"\(.*\)/\1/p' | head -1)
      ;;
    *) CMD="$STDIN" ;;
  esac
fi

# Only a commit is this guard's business. Token boundaries are deliberate: a
# loose match would count the word "commit" inside a message or a filename and
# rebuild the same fires-on-everything problem in a new place.
[ -z "$CMD" ] && exit 0
# `-C <path>` takes a separate argument of any shape (`.`, "$PWD"), so it is
# matched as one option before the generic forms.
COMMIT_RE='(^|[^[:alnum:]_.-])git([[:space:]]+(-C[[:space:]]+[^[:space:]]+|-[^[:space:]]+|[^[:space:]]+=[^[:space:]]*|/[^[:space:]]+))*[[:space:]]+commit([[:space:]]|$)'
if ! [[ "$CMD" =~ $COMMIT_RE ]]; then
  exit 0
fi
# Every `git ... commit` invocation in the command, one per entry. Only these
# say where a commit lands: a `git -C <elsewhere> status` earlier in the chain
# says nothing about where a later `git commit` goes.
COMMITS=()
REST="$CMD"
while [[ "$REST" =~ $COMMIT_RE ]]; do
  COMMITS+=("${BASH_REMATCH[0]}")
  REST="${REST#*"${BASH_REMATCH[0]}"}"
done

cd "$PROJECT_DIR" 2>/dev/null || exit 0

# Only a commit to THIS repo that carries TypeScript is this guard's business.
# Before 21 Nov 2026 it ran a full tsc on every `git -C ~/zao-vault commit` and
# every docs-only commit, which cost minutes and blocked vault writes on local
# type errors that had nothing to do with them (ruling 2026-11-21 item 1).
# If either question cannot be answered, the check runs: unsure means verify.
HERE=$(git rev-parse --show-toplevel 2>/dev/null)
if [ -n "$HERE" ]; then
  # Skip only when EVERY commit invocation names another repo with -C. One
  # commit with no -C, or a -C that cannot be resolved, lands (or may land)
  # here, so the check runs.
  ELSEWHERE=yes
  for INV in "${COMMITS[@]}"; do
    THERE=""
    if [[ "$INV" =~ git[[:space:]]+-C[[:space:]]+(\"[^\"]+\"|\'[^\']+\'|[^[:space:]]+) ]]; then
      TARGET="${BASH_REMATCH[1]}"
      TARGET="${TARGET#[\"\']}"; TARGET="${TARGET%[\"\']}"
      TARGET="${TARGET/#\~/$HOME}"
      THERE=$(git -C "$TARGET" rev-parse --show-toplevel 2>/dev/null)
    fi
    if [ -z "$THERE" ] || [ "$THERE" = "$HERE" ]; then
      ELSEWHERE=no
    fi
  done
  [ "$ELSEWHERE" = "yes" ] && exit 0
  if FILES=$(git diff --cached --name-only 2>/dev/null); then
    # `commit -a` / `-am` / `--all` stages tracked changes at commit time.
    if [[ "$CMD" =~ commit[^\&\;\|]*[[:space:]](-[[:alpha:]]*a[[:alpha:]]*|--all)([[:space:]]|$) ]]; then
      FILES="$FILES
$(git diff --name-only 2>/dev/null)"
    fi
    # The staged set is read NOW, before the command runs. Anything chained
    # ahead of the commit (`git add a.ts && git commit`) can stage more, so the
    # set cannot be known: count unstaged and untracked files too.
    if [[ "$CMD" =~ (\&\&|\|\||;).*commit ]]; then
      FILES="$FILES
$(git diff --name-only 2>/dev/null)
$(git ls-files --others --exclude-standard 2>/dev/null)"
    fi
    if ! printf '%s\n' "$FILES" | /usr/bin/grep -qE '\.(ts|tsx|mts|cts)$|(^|/)(tsconfig[^/]*\.json|package(-lock)?\.json)$'; then
      exit 0
    fi
  fi
fi

# A missing toolchain is a FAIL, not a pass - a verifier that cannot run must
# never fall through green (.claude/rules/silent-failure-guard.md rule 3). But
# an unpopulated node_modules is an environment problem, not a code problem, and
# blocking every commit on it would be its own noise. So: say so loudly, and let
# the commit proceed rather than pretending the check passed.
if [ ! -d node_modules/typescript ]; then
  echo "TYPECHECK SKIPPED: node_modules/typescript is missing - run 'npm install'."
  echo "This is NOT a passing typecheck. Nothing was verified."
  exit 0
fi

OUT=$(npm run typecheck 2>&1)
STATUS=$?
if [ "$STATUS" != "0" ]; then
  echo "TYPECHECK FAILED before commit:"
  echo "$OUT" | tail -20
  exit 1
fi
exit 0
