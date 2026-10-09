#!/usr/bin/env bash
# Test: orca-setup.sh picks the newest live seed with a matching lockfile,
# clones it, and falls back loudly to a plain npm install when nothing
# matches, when cp -c fails, or when node_modules is already there.
#
# npm and (in one case) cp are stubbed on PATH, so this runs in about a second
# and installs nothing. Fixtures go in a fresh mktemp dir (or $TEST_DIR) and
# are NOT removed afterwards (no-rm-rf.md); the path is printed at the end.
set -u
SCRIPT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/orca-setup.sh"
T="${TEST_DIR:-$(mktemp -d)}"
fails=0
fail() { echo "FAIL: $*" >&2; fails=$((fails + 1)); }
pass() { echo "ok   $*"; }

# Stub npm: records that it ran and where.
mkdir -p "$T/bin"
cat > "$T/bin/npm" <<'EOF'
#!/usr/bin/env bash
echo "npm $* in $(pwd -P)" >> "$NPM_LOG"
EOF
chmod +x "$T/bin/npm"
export NPM_LOG="$T/npm.log"

# make_ws <root> <name> <lock-content> [live]
make_ws() {
  local d="$1/$2"
  mkdir -p "$d"
  printf '%s\n' "$3" > "$d/package-lock.json"
  if [ "${4:-}" = live ]; then
    mkdir -p "$d/node_modules/pkg"
    echo "from $2" > "$d/node_modules/pkg/index.js"
    echo '{}' > "$d/node_modules/.package-lock.json"
  fi
}

run() { # run <workspace> [extra env...]
  local ws="$1"; shift
  ( cd "$ws" && env HOME="$T" PATH="$T/bin:$PATH" "$@" bash "$SCRIPT" ) > "$T/out" 2> "$T/err"
}

# --- Case 1: two matching live seeds, the newer one wins -----------------
R1="$T/case1"
make_ws "$R1" older LOCK-A live
make_ws "$R1" newer LOCK-A live
make_ws "$R1" dead  LOCK-A          # matching lock, no install: not live
touch -t 202601010000 "$R1/older/node_modules/.package-lock.json"
make_ws "$R1" new LOCK-A
: > "$NPM_LOG"
run "$R1/new"
if grep -q "^ORCA-SETUP SEED:.*/case1/newer$" "$T/out"; then pass "case1 picks the newest live seed"; else fail "case1 seed: $(cat "$T/out")"; fi
if [ "$(cat "$R1/new/node_modules/pkg/index.js" 2>/dev/null)" = "from newer" ]; then pass "case1 node_modules cloned from seed"; else fail "case1 clone content missing"; fi
if grep -q "^npm install in .*/case1/new$" "$NPM_LOG"; then pass "case1 npm install ran in the new workspace"; else fail "case1 npm log: $(cat "$NPM_LOG")"; fi
if [ ! -s "$T/err" ]; then pass "case1 no fallback warning"; else fail "case1 stderr: $(cat "$T/err")"; fi
if [ ! -e "$R1/new/.orca-setup-tmp" ]; then pass "case1 temp dir cleaned (rmdir)"; else fail "case1 temp dir left"; fi
if [ "$(cat "$R1/newer/node_modules/pkg/index.js")" = "from newer" ]; then pass "case1 seed untouched"; else fail "case1 seed changed"; fi

# --- Case 2 (RED CONTROL): lockfile mismatch -> loud plain install --------
R2="$T/case2"
make_ws "$R2" seed LOCK-A live
make_ws "$R2" new  LOCK-B
: > "$NPM_LOG"
run "$R2/new"
if grep -q "^ORCA-SETUP FALLBACK: no live workspace has a package-lock.json matching" "$T/err"; then pass "case2 mismatch prints FALLBACK on stderr"; else fail "case2 stderr: $(cat "$T/err")"; fi
if [ ! -e "$R2/new/node_modules" ]; then pass "case2 nothing cloned"; else fail "case2 cloned despite mismatch"; fi
if grep -q "^npm install in .*/case2/new$" "$NPM_LOG"; then pass "case2 plain npm install ran"; else fail "case2 npm log: $(cat "$NPM_LOG")"; fi

# --- Case 3: cp -c fails -> loud fallback, partial left, install runs ----
R3="$T/case3"
make_ws "$R3" seed LOCK-A live
make_ws "$R3" new  LOCK-A
mkdir -p "$T/badcp"
cat > "$T/badcp/cp" <<'EOF'
#!/usr/bin/env bash
mkdir -p "${@: -1}"; echo "cp: clonefile failed" >&2; exit 1
EOF
chmod +x "$T/badcp/cp"
: > "$NPM_LOG"
( cd "$R3/new" && env HOME="$T" PATH="$T/badcp:$T/bin:$PATH" bash "$SCRIPT" ) > "$T/out" 2> "$T/err"
if grep -q "^ORCA-SETUP FALLBACK: cp -c clone from .* failed" "$T/err"; then pass "case3 clone failure prints FALLBACK"; else fail "case3 stderr: $(cat "$T/err")"; fi
if [ ! -e "$R3/new/node_modules" ] && [ -d "$R3/new/.orca-setup-tmp/node_modules" ]; then pass "case3 partial left in .orca-setup-tmp, node_modules not created"; else fail "case3 layout wrong"; fi
if grep -q "^npm install in .*/case3/new$" "$NPM_LOG"; then pass "case3 plain npm install ran"; else fail "case3 npm log"; fi

# --- Case 4: node_modules already exists -> left alone -------------------
R4="$T/case4"
make_ws "$R4" seed LOCK-A live
make_ws "$R4" new  LOCK-A
mkdir -p "$R4/new/node_modules"; echo mine > "$R4/new/node_modules/keep"
: > "$NPM_LOG"
run "$R4/new"
if grep -q "^ORCA-SETUP SKIP-CLONE:" "$T/out" && [ "$(cat "$R4/new/node_modules/keep")" = mine ]; then pass "case4 existing node_modules left alone"; else fail "case4: $(cat "$T/out")"; fi

# --- Case 5: ORCA_SEED names the seed explicitly -------------------------
R5="$T/case5"
make_ws "$R5" new LOCK-A
make_ws "$T/elsewhere" pinned LOCK-A live
: > "$NPM_LOG"
run "$R5/new" ORCA_SEED="$T/elsewhere/pinned"
if grep -q "^ORCA-SETUP SEED:.*/elsewhere/pinned$" "$T/out"; then pass "case5 ORCA_SEED honoured"; else fail "case5: $(cat "$T/out") $(cat "$T/err")"; fi

echo "fixtures left at $T (not removed, no-rm-rf.md)"
if [ "$fails" -gt 0 ]; then echo "$fails FAILED" >&2; exit 1; fi
echo "all passed"
