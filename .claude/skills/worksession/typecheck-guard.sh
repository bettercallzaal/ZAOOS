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
if ! [[ "$CMD" =~ (^|[^[:alnum:]_.-])git([[:space:]]+(-[^[:space:]]+|[^[:space:]]+=[^[:space:]]*|/[^[:space:]]+))*[[:space:]]+commit([[:space:]]|$) ]]; then
  exit 0
fi

cd "$PROJECT_DIR" 2>/dev/null || exit 0

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
