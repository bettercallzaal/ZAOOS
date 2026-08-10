#!/bin/bash
# Tests for typecheck-guard.sh command scoping.
#
# The guard must fire on a commit and stay silent on everything else. It must
# also never report a pass it did not earn: a missing toolchain says so out loud
# rather than exiting quietly as though the check succeeded.
#
# Run: bash .claude/skills/worksession/__tests__/test-typecheck-guard.sh
set -u
GUARD="$(cd "$(dirname "$0")/.." && pwd)/typecheck-guard.sh"
PASS=0; FAIL=0

# An empty PROJECT_DIR with no node_modules, so the guard reaches its
# skip-and-say-so path instead of running a real multi-minute tsc.
TMP=$(mktemp -d)
export PROJECT_DIR="$TMP"

fires() {  # fires <label> <should-run> <command>
  local label="$1" want="$2" cmd="$3" out
  out=$(CLAUDE_TOOL_INPUT_command="$cmd" bash "$GUARD" 2>&1 </dev/null)
  local ran=no
  case "$out" in *"TYPECHECK"*) ran=yes ;; esac
  if [ "$ran" = "$want" ]; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL $label: expected ran=$want got=$ran   (command: $cmd)"
  fi
}

# --- MUST run on a commit ---
fires "plain commit"          yes "git commit -m 'wip'"
fires "commit with flags"     yes "git commit --amend"
fires "commit in a chain"     yes "git add . && git commit -m 'x'"
fires "commit with -C"        yes "git -C /some/repo commit -m 'x'"

# --- MUST stay silent on everything else ---
fires "ls"                    no  "ls -la"
fires "git status"            no  "git status --short"
fires "git push"              no  "git push origin HEAD"
fires "npm test"              no  "npm run test"
fires "word in a message"     no  "echo 'this commit was fine' > notes.txt"
fires "a path named commit"   no  "cat docs/commit-style.md"

# --- Missing toolchain must be LOUD, and must not claim a pass ---
out=$(CLAUDE_TOOL_INPUT_command="git commit -m x" bash "$GUARD" 2>&1 </dev/null)
case "$out" in
  *"NOT a passing typecheck"*) PASS=$((PASS + 1)) ;;
  *) FAIL=$((FAIL + 1)); echo "FAIL missing-toolchain: must say it verified nothing" ;;
esac

# --- stdin JSON form ---
out=$(printf '{"tool_input":{"command":"git commit -m x"}}' | bash "$GUARD" 2>&1)
case "$out" in
  *TYPECHECK*) PASS=$((PASS + 1)) ;;
  *) FAIL=$((FAIL + 1)); echo "FAIL stdin-json commit: should fire" ;;
esac
out=$(printf '{"tool_input":{"command":"ls -la"}}' | bash "$GUARD" 2>&1)
if [ -z "$out" ]; then PASS=$((PASS + 1)); else FAIL=$((FAIL + 1)); echo "FAIL stdin-json ls: should be silent"; fi

rmdir "$TMP" 2>/dev/null
echo "$PASS passed, $FAIL failed"
[ "$FAIL" = "0" ]
