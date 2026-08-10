#!/bin/bash
# Branch guard - runs before git push to catch parallel session conflicts.
# Warns if: pushing to main, branch is behind remote, or not on a ws/ branch.
# Works in both regular checkouts and git worktrees.
#
# WHY THE COMMAND CHECK EXISTS (added 2026-08-10)
#
# This script's job was always "before git push" - its first line said so - but
# it was wired to the Bash PreToolUse hook, which fires on EVERY Bash call. So
# on `main` it exited 1 before `ls`, before `cat`, before every command, and the
# session filled with "PreToolUse:Bash hook error / Failed with non-blocking
# status code: No stderr output". Two costs, both real:
#
#   1. A guard that fires on the normal case is a guard people learn to ignore,
#      and it drowns the one time it fires for a real reason
#      (.claude/rules/noisy-signal-guard.md).
#   2. It ran `git fetch` every time, so every shell command in this repo paid a
#      network round-trip before it started.
#
# The fix is to check WHAT is being run, not just which branch we are on. A
# non-push command is none of this guard's business, so it exits 0 immediately.
# The guard is not weakened: every push still gets the full check.

# The hook passes the tool call as JSON on stdin; Claude Code also exports the
# command as CLAUDE_TOOL_INPUT_command. Accept either, and if NEITHER is
# available, fall through to guarding (fail closed - a guard that silently
# disables itself when it cannot read its input is worse than a noisy one).
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

# Only a push is this guard's business. An empty CMD means we could not read the
# command at all, so we guard anyway rather than open the gate.
# Token boundaries matter here: a loose match treats the string "git-push" in a
# sentence as a push and re-creates the false-positive problem in miniature. The
# optional flag group covers `git -C /repo push` and `git --git-dir=x push`.
if [ -n "$CMD" ]; then
  if ! [[ "$CMD" =~ (^|[^[:alnum:]_.-])git([[:space:]]+(-[^[:space:]]+|[^[:space:]]+=[^[:space:]]*|/[^[:space:]]+))*[[:space:]]+push([[:space:]]|$) ]]; then
    exit 0
  fi
fi

cd "$PROJECT_DIR" 2>/dev/null || exit 0

BRANCH=$(git branch --show-current 2>/dev/null)
[ -z "$BRANCH" ] && exit 0

# Block direct push to main
if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
  echo "BLOCKED: You're pushing directly to $BRANCH. Use /worksession to create a session branch first."
  exit 1
fi

# Warn if not on a ws/ branch (might be a shared feature branch)
if [[ "$BRANCH" != ws/* ]]; then
  echo "WARNING: Branch '$BRANCH' is not a work session branch (ws/*). Another terminal might be on this branch. Consider using /worksession to create an isolated branch."
fi

# Check if remote branch exists and we're behind
git fetch origin "$BRANCH" --quiet 2>/dev/null
BEHIND=$(git rev-list --count "HEAD..origin/$BRANCH" 2>/dev/null)
if [ -n "$BEHIND" ] && [ "$BEHIND" -gt 0 ]; then
  echo "WARNING: Your branch is $BEHIND commit(s) behind origin/$BRANCH. Another session may have pushed. Run 'git pull --rebase origin $BRANCH' first."
  exit 1
fi

exit 0
