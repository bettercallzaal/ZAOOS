#!/bin/bash
# Tests for branch-guard.sh command scoping.
#
# Both halves must hold. A guard that stops blocking pushes to main is worse
# than the noise it replaced, and a guard that still fires on `ls` is the bug
# this change exists to fix.
#
# Run: bash .claude/skills/worksession/__tests__/test-branch-guard.sh
set -u
GUARD="$(cd "$(dirname "$0")/.." && pwd)/branch-guard.sh"
PASS=0; FAIL=0

# A throwaway repo on `main`, so the guard has something real to inspect and the
# test never depends on which branch the developer happens to be on.
TMP=$(mktemp -d)
git init --quiet -b main "$TMP"
git -C "$TMP" commit --allow-empty --quiet -m init
export PROJECT_DIR="$TMP"

check() {  # check <label> <expected-exit> <command-string>
  local label="$1" want="$2" cmd="$3"
  local got
  CLAUDE_TOOL_INPUT_command="$cmd" bash "$GUARD" >/dev/null 2>&1 </dev/null
  got=$?
  if [ "$got" = "$want" ]; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL $label: want exit $want, got $got   (command: $cmd)"
  fi
}

# --- MUST still block: a real push to main ---
check "push to main"            1 "git push origin main"
check "push, no args"           1 "git push"
check "push inside a chain"     1 "npm run build && git push origin HEAD"
check "push with -C"            1 "git -C /some/repo push origin main"

# --- MUST NOT fire: ordinary commands, which is every command but a push ---
check "ls"                      0 "ls -la"
check "cat a file"              0 "cat README.md"
check "git status"              0 "git status --short"
check "git commit"              0 "git commit -m 'wip'"
check "git log"                 0 "git log --oneline -5"
check "npm test"                0 "npm run test"
check "a command saying push"   0 "echo 'remember to git-push later' > notes.txt"

# --- Fail closed: unreadable input still guards ---
CLAUDE_TOOL_INPUT_command="" bash "$GUARD" >/dev/null 2>&1 </dev/null
if [ $? = 1 ]; then
  PASS=$((PASS + 1))
else
  FAIL=$((FAIL + 1))
  echo "FAIL empty-command: guard should fail closed on main, not open"
fi

# --- stdin JSON form, the way Claude Code actually passes it ---
printf '{"tool_input":{"command":"git push origin main"}}' | bash "$GUARD" >/dev/null 2>&1
if [ $? = 1 ]; then PASS=$((PASS + 1)); else FAIL=$((FAIL + 1)); echo "FAIL stdin-json push: should block"; fi
printf '{"tool_input":{"command":"ls -la"}}' | bash "$GUARD" >/dev/null 2>&1
if [ $? = 0 ]; then PASS=$((PASS + 1)); else FAIL=$((FAIL + 1)); echo "FAIL stdin-json ls: should pass"; fi

rm -rf "$TMP"
echo "$PASS passed, $FAIL failed"
[ "$FAIL" = "0" ]
