#!/usr/bin/env bash
# Test: orca-setup.sh installs nothing without --install (cases 10-11); with
# it, picks the newest live seed with a matching lockfile, clones it, and
# falls back loudly to a plain npm install when nothing matches, when cp -c
# fails, or when node_modules is already there; the plain install is held to
# a free-space floor (cases 12-14).
#
# npm, df and (in one case) cp are stubbed on PATH, so this runs in about a second
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

# Stub df: reports DF_AVAIL_KIB available (default 100 GiB), so the free-space
# floor does not depend on this machine's disk.
cat > "$T/bin/df" <<'EOF'
#!/usr/bin/env bash
echo "Filesystem 1024-blocks Used Available Capacity Mounted"
echo "/dev/stub 999999999 1 ${DF_AVAIL_KIB-104857600} 1% /"
EOF
chmod +x "$T/bin/df"

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

run() { # run <workspace> [extra env...]  (with --install)
  local ws="$1"; shift
  ( cd "$ws" && env HOME="$T" PATH="$T/bin:$PATH" "$@" bash "$SCRIPT" --install ) > "$T/out" 2> "$T/err"
}
run_noarg() { # run_noarg <workspace> [extra env...]  (no --install)
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
( cd "$R3/new" && env HOME="$T" PATH="$T/badcp:$T/bin:$PATH" bash "$SCRIPT" --install ) > "$T/out" 2> "$T/err"
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

# --- Case 6: seed's node_modules is a symlink -> refused as a seed -------
R6="$T/case6"
make_ws "$T/outside6" real LOCK-A live
make_ws "$R6" linked LOCK-A
ln -s "$T/outside6/real/node_modules" "$R6/linked/node_modules"
make_ws "$R6" new LOCK-A
: > "$NPM_LOG"
run "$R6/new"
if grep -q "^ORCA-SETUP SKIP-SEED: .*/case6/linked has a symlinked node_modules$" "$T/err"; then pass "case6 symlinked seed node_modules skipped"; else fail "case6 stderr: $(cat "$T/err")"; fi
if [ ! -e "$R6/new/node_modules" ] && [ ! -L "$R6/new/node_modules" ]; then pass "case6 nothing cloned"; else fail "case6 new node_modules exists: $(ls -l "$R6/new")"; fi
if grep -q "^ORCA-SETUP FALLBACK: no live workspace" "$T/err" && grep -q "^npm install in .*/case6/new$" "$NPM_LOG"; then pass "case6 plain npm install ran"; else fail "case6 fallback/npm"; fi

# --- Case 7: sibling candidate is a symlink to a dir outside the root ----
R7="$T/case7"
make_ws "$T/outside7" real LOCK-A live
mkdir -p "$R7"
ln -s "$T/outside7/real" "$R7/sneaky"
make_ws "$R7" new LOCK-A
: > "$NPM_LOG"
run "$R7/new"
if grep -q "^ORCA-SETUP SKIP-SEED: .*/case7/sneaky resolves to .*/outside7/real, outside " "$T/err"; then pass "case7 outside-root candidate skipped"; else fail "case7 stderr: $(cat "$T/err")"; fi
if [ ! -e "$R7/new/node_modules" ]; then pass "case7 nothing cloned"; else fail "case7 cloned from outside the root"; fi

# --- Case 8: new workspace's node_modules is a dangling symlink -> REFUSED
R8="$T/case8"
make_ws "$R8" seed LOCK-A live
make_ws "$R8" new LOCK-A
ln -s "$T/nowhere8" "$R8/new/node_modules"
: > "$NPM_LOG"
run "$R8/new"; rc=$?
if [ "$rc" -eq 2 ] && grep -q "^ORCA-SETUP REFUSED: .*/case8/new/node_modules is a symlink" "$T/err"; then pass "case8 dangling symlink refused, exit 2"; else fail "case8 rc=$rc stderr: $(cat "$T/err")"; fi
if [ ! -s "$NPM_LOG" ] && [ ! -e "$T/nowhere8" ]; then pass "case8 npm not run, nothing written through the link"; else fail "case8 npm ran or link target created"; fi

# --- Case 9: leftover .orca-setup-tmp from a failed clone -> left alone --
R9="$T/case9"
make_ws "$R9" seed LOCK-A live
make_ws "$R9" new LOCK-A
mkdir -p "$R9/new/.orca-setup-tmp/node_modules"; echo partial > "$R9/new/.orca-setup-tmp/node_modules/x"
: > "$NPM_LOG"
run "$R9/new"
if grep -q "^ORCA-SETUP FALLBACK: .*already exists, probably from an earlier failed clone.*delete .* by hand" "$T/err" && [ "$(cat "$R9/new/.orca-setup-tmp/node_modules/x")" = partial ]; then pass "case9 leftover temp dir named and untouched"; else fail "case9 stderr: $(cat "$T/err")"; fi
if grep -q "^npm install in .*/case9/new$" "$NPM_LOG"; then pass "case9 plain npm install ran"; else fail "case9 npm log"; fi

# --- Case 10 (RED CONTROL, #4057): no --install -> SKIPPED, nothing done --
R10="$T/case10"
make_ws "$R10" seed LOCK-A live
make_ws "$R10" new LOCK-A
: > "$NPM_LOG"
run_noarg "$R10/new"; rc=$?
if [ "$rc" -eq 0 ] && grep -q "^ORCA-SETUP SKIPPED: no npm install .*--install" "$T/out"; then pass "case10 no-arg prints SKIPPED, exit 0"; else fail "case10 rc=$rc out: $(cat "$T/out") err: $(cat "$T/err")"; fi
if [ ! -s "$NPM_LOG" ] && [ ! -e "$R10/new/node_modules" ]; then pass "case10 npm not run, nothing cloned"; else fail "case10 installed anyway: $(cat "$NPM_LOG")"; fi

# --- Case 11: ORCA_SETUP_INSTALL=1 opts in without the flag ---------------
R11="$T/case11"
make_ws "$R11" seed LOCK-A live
make_ws "$R11" new LOCK-A
: > "$NPM_LOG"
run_noarg "$R11/new" ORCA_SETUP_INSTALL=1
if grep -q "^ORCA-SETUP SEED:.*/case11/seed$" "$T/out" && grep -q "^npm install in .*/case11/new$" "$NPM_LOG"; then pass "case11 ORCA_SETUP_INSTALL=1 installs"; else fail "case11 out: $(cat "$T/out")"; fi

# --- Case 12 (RED CONTROL, #4057): full install below the floor -> REFUSED
R12="$T/case12"
make_ws "$R12" new LOCK-B
: > "$NPM_LOG"
run "$R12/new" DF_AVAIL_KIB=2097152; rc=$?
if [ "$rc" -eq 3 ] && grep -q "^ORCA-SETUP REFUSED: full npm install needs about 2.9 GiB and .* has 2 GiB free (floor 8 GiB)" "$T/err"; then pass "case12 2 GiB free refused, exit 3"; else fail "case12 rc=$rc err: $(cat "$T/err")"; fi
if [ ! -s "$NPM_LOG" ]; then pass "case12 npm not run"; else fail "case12 npm ran"; fi

# --- Case 13: unreadable free space -> UNKNOWN, refused --------------------
R13="$T/case13"
make_ws "$R13" new LOCK-B
: > "$NPM_LOG"
run "$R13/new" DF_AVAIL_KIB=garbage; rc=$?
if [ "$rc" -eq 3 ] && grep -q "has UNKNOWN GiB free" "$T/err" && [ ! -s "$NPM_LOG" ]; then pass "case13 UNKNOWN free refused"; else fail "case13 rc=$rc err: $(cat "$T/err")"; fi

# --- Case 14: ORCA_SETUP_MIN_FREE_GIB=0 turns the floor off ---------------
R14="$T/case14"
make_ws "$R14" new LOCK-B
: > "$NPM_LOG"
run "$R14/new" DF_AVAIL_KIB=1024 ORCA_SETUP_MIN_FREE_GIB=0
if grep -q "^npm install in .*/case14/new$" "$NPM_LOG"; then pass "case14 floor 0 installs"; else fail "case14 err: $(cat "$T/err")"; fi

echo "fixtures left at $T (not removed, no-rm-rf.md)"
if [ "$fails" -gt 0 ]; then echo "$fails FAILED" >&2; exit 1; fi
echo "all passed"
