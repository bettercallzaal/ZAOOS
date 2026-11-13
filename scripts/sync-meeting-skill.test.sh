#!/usr/bin/env bash
# Test: sync-meeting-skill.sh copies nothing without an explicit direction,
# refuses a copy that would remove destination-only files unless told
# --delete-extra, and copies in the direction it was given.
#
# Both skill folders are fixtures: SYNC_MEETING_REPO_DIR and
# SYNC_MEETING_USER_DIR point into a fresh mktemp dir (or $TEST_DIR), and HOME
# is pointed there too, so the real ~/.claude/skills is never read or written.
# The first case proves that. Fixtures are NOT removed afterwards
# (no-rm-rf.md); the path is printed at the end.
set -u
SCRIPT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/sync-meeting-skill.sh"
T="${TEST_DIR:-$(mktemp -d)}"
fails=0
fail() { echo "FAIL: $*" >&2; fails=$((fails + 1)); }
pass() { echo "ok   $*"; }

export HOME="$T/home"
mkdir -p "$HOME"

# A fixture pair shaped like the real one on 2026-11-13: REPO is the older,
# smaller copy; USER is newer and has files REPO lacks.
fresh() {
  local n="$1"
  export SYNC_MEETING_REPO_DIR="$T/$n/repo/meeting"
  export SYNC_MEETING_USER_DIR="$T/$n/user/meeting"
  mkdir -p "$SYNC_MEETING_REPO_DIR/scripts" "$SYNC_MEETING_USER_DIR/scripts"
  echo "old skill"  > "$SYNC_MEETING_REPO_DIR/SKILL.md"
  echo "shared"     > "$SYNC_MEETING_REPO_DIR/scripts/transcribe.sh"
  echo "new skill"  > "$SYNC_MEETING_USER_DIR/SKILL.md"
  echo "shared"     > "$SYNC_MEETING_USER_DIR/scripts/transcribe.sh"
  echo "user only"  > "$SYNC_MEETING_USER_DIR/scripts/voiceprints.sh"
  echo "user only"  > "$SYNC_MEETING_USER_DIR/lane-map.json"
}
# One line per file: path and content, so two snapshots compare with [ = ].
snap() { (cd "$1" && find . -type f | LC_ALL=C sort | while IFS= read -r f; do printf '%s=%s\n' "$f" "$(cat "$f")"; done); }

# 0. The guard on the test itself: the script resolves to the fixture folders.
fresh c0
out="$(bash "$SCRIPT" --check 2>&1)"; rc=$?
case "$out" in
  *"$T/c0/"*) pass "0 the script reads the fixture folders, not the real skill set" ;;
  *) fail "0 --check output does not name the fixture folders: $out" ;;
esac
[ ! -e "$HOME/.claude" ] && pass "0 nothing was created under the fake HOME's .claude" || fail "0 the script wrote under HOME/.claude"

# 1. No argument: refused, exit 2, both sides untouched. This is the hazard.
fresh c1
before_r="$(snap "$SYNC_MEETING_REPO_DIR")"; before_u="$(snap "$SYNC_MEETING_USER_DIR")"
out="$(bash "$SCRIPT" 2>&1)"; rc=$?
[ "$rc" -eq 2 ] && pass "1 no argument exits 2" || fail "1 no argument exited $rc, want 2"
case "$out" in *"REFUSED: no direction given"*) pass "1 no argument says it refused" ;; *) fail "1 no refusal line: $out" ;; esac
[ "$(snap "$SYNC_MEETING_USER_DIR")" = "$before_u" ] && pass "1 no argument leaves USER untouched (the 2 user-only files survive)" || fail "1 USER changed on a bare run"
[ "$(snap "$SYNC_MEETING_REPO_DIR")" = "$before_r" ] && pass "1 no argument leaves REPO untouched" || fail "1 REPO changed on a bare run"

# 2. The old spellings of "go" are refused too.
for a in deploy --deploy --force; do
  out="$(bash "$SCRIPT" "$a" 2>&1)"; rc=$?
  [ "$rc" -eq 2 ] && [ "$(snap "$SYNC_MEETING_USER_DIR")" = "$before_u" ] \
    && pass "2 '$a' is refused with exit 2 and nothing copied" || fail "2 '$a' exited $rc or changed USER"
done
out="$(bash "$SCRIPT" --to-user --from-user 2>&1)"; rc=$?
[ "$rc" -eq 2 ] && [ "$(snap "$SYNC_MEETING_USER_DIR")" = "$before_u" ] && [ "$(snap "$SYNC_MEETING_REPO_DIR")" = "$before_r" ] \
  && pass "2 both directions at once is refused, nothing copied" || fail "2 both directions exited $rc or copied"

# 3. --check reports drift, exit 1, writes nothing, and no longer names a source of truth as the fix.
out="$(bash "$SCRIPT" --check 2>&1)"; rc=$?
[ "$rc" -eq 1 ] && pass "3 --check exits 1 on drift" || fail "3 --check exited $rc, want 1"
case "$out" in *"neither copy is the source of truth"*) pass "3 --check says neither copy is the source of truth" ;; *) fail "3 --check wording: $out" ;; esac
[ "$(snap "$SYNC_MEETING_USER_DIR")" = "$before_u" ] && [ "$(snap "$SYNC_MEETING_REPO_DIR")" = "$before_r" ] \
  && pass "3 --check writes nothing" || fail "3 --check changed a side"

# 4. --to-user onto a destination with files of its own: refused, files named, nothing copied.
out="$(bash "$SCRIPT" --to-user 2>&1)"; rc=$?
[ "$rc" -eq 2 ] && pass "4 --to-user over a newer USER exits 2" || fail "4 --to-user exited $rc, want 2"
case "$out" in *"would remove 2 path(s)"*) pass "4 it counts the 2 destination-only files" ;; *) fail "4 count line: $out" ;; esac
case "$out" in *"scripts/voiceprints.sh"*) pass "4 it names a file it would have removed" ;; *) fail "4 file not named: $out" ;; esac
[ "$(snap "$SYNC_MEETING_USER_DIR")" = "$before_u" ] && pass "4 USER is untouched, SKILL.md included (no partial copy)" || fail "4 USER changed on a refused copy"

# 5. --to-user --delete-extra: the caller said so; USER becomes REPO.
out="$(bash "$SCRIPT" --to-user --delete-extra 2>&1)"; rc=$?
[ "$rc" -eq 0 ] && pass "5 --to-user --delete-extra exits 0" || fail "5 exited $rc: $out"
[ "$(snap "$SYNC_MEETING_USER_DIR")" = "$before_r" ] && pass "5 USER now equals the old REPO, extras gone" || fail "5 USER does not equal REPO"
[ "$(snap "$SYNC_MEETING_REPO_DIR")" = "$before_r" ] && pass "5 REPO, the source, is unchanged" || fail "5 the source changed"

# 6. --from-user with nothing to remove on the REPO side: copies, exit 0, and warns the repo is public.
fresh c6
before_u="$(snap "$SYNC_MEETING_USER_DIR")"
out="$(bash "$SCRIPT" --from-user 2>&1)"; rc=$?
[ "$rc" -eq 0 ] && pass "6 --from-user exits 0 when REPO has no files of its own" || fail "6 exited $rc: $out"
[ "$(snap "$SYNC_MEETING_REPO_DIR")" = "$before_u" ] && pass "6 REPO now equals USER" || fail "6 REPO does not equal USER"
[ "$(snap "$SYNC_MEETING_USER_DIR")" = "$before_u" ] && pass "6 USER, the source, is unchanged" || fail "6 the source changed"
case "$out" in *"this repo is public"*) pass "6 --from-user warns that the repo is public" ;; *) fail "6 no public warning: $out" ;; esac
out="$(bash "$SCRIPT" --check 2>&1)"; rc=$?
[ "$rc" -eq 0 ] && pass "6 --check then reports in sync, exit 0" || fail "6 --check after a copy exited $rc"

# 7. --from-user when REPO has a file USER lacks: refused the same way.
fresh c7
echo "repo only" > "$SYNC_MEETING_REPO_DIR/scripts/repo-only.sh"
before_r="$(snap "$SYNC_MEETING_REPO_DIR")"
out="$(bash "$SCRIPT" --from-user 2>&1)"; rc=$?
[ "$rc" -eq 2 ] && [ "$(snap "$SYNC_MEETING_REPO_DIR")" = "$before_r" ] \
  && pass "7 --from-user that would remove a REPO-only file is refused, REPO untouched" || fail "7 exited $rc or REPO changed"

# 8. A missing source is an error, not an empty copy with --delete.
fresh c8
export SYNC_MEETING_USER_DIR="$T/c8/user/not-there"
before_r="$(snap "$SYNC_MEETING_REPO_DIR")"
out="$(bash "$SCRIPT" --from-user --delete-extra 2>&1)"; rc=$?
[ "$rc" -eq 2 ] && [ "$(snap "$SYNC_MEETING_REPO_DIR")" = "$before_r" ] \
  && pass "8 a missing source dir exits 2 and empties nothing" || fail "8 exited $rc or REPO changed"

# A pair that differs ONLY by one destination-only entry of a kind `find -type f`
# does not list. The first version of the guard missed both kinds: it copied,
# removed them, and printed "0 removed" (seat-merge's verdict on PR 4311).
same_pair() {
  local n="$1"
  export SYNC_MEETING_REPO_DIR="$T/$n/repo/meeting"
  export SYNC_MEETING_USER_DIR="$T/$n/user/meeting"
  mkdir -p "$SYNC_MEETING_REPO_DIR" "$SYNC_MEETING_USER_DIR"
  echo "skill" > "$SYNC_MEETING_REPO_DIR/SKILL.md"
  echo "skill" > "$SYNC_MEETING_USER_DIR/SKILL.md"
}

# 9. A destination-only SYMLINK is refused and survives.
same_pair c9
ln -s SKILL.md "$SYNC_MEETING_USER_DIR/linkonly"
out="$(bash "$SCRIPT" --to-user 2>&1)"; rc=$?
[ "$rc" -eq 2 ] && pass "9 a destination-only symlink: --to-user exits 2" || fail "9 symlink case exited $rc, want 2: $out"
case "$out" in *"would remove 1 path(s)"*"linkonly (symlink)"*) pass "9 the symlink is counted and named" ;; *) fail "9 symlink not named: $out" ;; esac
[ -L "$SYNC_MEETING_USER_DIR/linkonly" ] && pass "9 the symlink is still there" || fail "9 the symlink was removed"

# 10. A destination-only EMPTY FOLDER is refused and survives.
same_pair c10
mkdir "$SYNC_MEETING_USER_DIR/emptydir"
out="$(bash "$SCRIPT" --to-user 2>&1)"; rc=$?
[ "$rc" -eq 2 ] && pass "10 a destination-only empty folder: --to-user exits 2" || fail "10 empty-folder case exited $rc, want 2: $out"
case "$out" in *"would remove 1 path(s)"*"emptydir/ (empty folder)"*) pass "10 the empty folder is counted and named" ;; *) fail "10 empty folder not named: $out" ;; esac
[ -d "$SYNC_MEETING_USER_DIR/emptydir" ] && pass "10 the empty folder is still there" || fail "10 the empty folder was removed"

# 11. Both kinds, a dangling symlink too, with --delete-extra: removed, and the count is true.
same_pair c11
ln -s SKILL.md "$SYNC_MEETING_USER_DIR/linkonly"
ln -s nowhere "$SYNC_MEETING_USER_DIR/dangling"
mkdir "$SYNC_MEETING_USER_DIR/emptydir"
out="$(bash "$SCRIPT" --to-user 2>&1)"; rc=$?
case "$out" in *"would remove 3 path(s)"*) pass "11 symlink, dangling symlink and empty folder are all counted (3)" ;; *) fail "11 count: $out" ;; esac
out="$(bash "$SCRIPT" --to-user --delete-extra 2>&1)"; rc=$?
[ "$rc" -eq 0 ] && pass "11 --delete-extra exits 0" || fail "11 exited $rc: $out"
case "$out" in *"(3 destination-only path(s) removed)"*) pass "11 the success line says 3 removed, not 0" ;; *) fail "11 success line: $out" ;; esac
[ ! -e "$SYNC_MEETING_USER_DIR/emptydir" ] && [ ! -L "$SYNC_MEETING_USER_DIR/linkonly" ] && [ ! -L "$SYNC_MEETING_USER_DIR/dangling" ] \
  && pass "11 all three are gone after --delete-extra" || fail "11 something survived --delete-extra"

# 12. Same name, different kind (a file here, a folder in the source): refused, named.
same_pair c12
mkdir "$SYNC_MEETING_REPO_DIR/refs"; echo "x" > "$SYNC_MEETING_REPO_DIR/refs/a.md"
echo "i am a file" > "$SYNC_MEETING_USER_DIR/refs"
out="$(bash "$SCRIPT" --to-user 2>&1)"; rc=$?
[ "$rc" -eq 2 ] && [ -f "$SYNC_MEETING_USER_DIR/refs" ] && pass "12 a file that the copy would replace with a folder is refused and survives" || fail "12 exited $rc or the file was replaced: $out"

# 13. Nothing destination-only: an in-sync pair with a shared empty folder and a shared symlink copies cleanly.
same_pair c13
mkdir "$SYNC_MEETING_REPO_DIR/emptydir" "$SYNC_MEETING_USER_DIR/emptydir"
ln -s SKILL.md "$SYNC_MEETING_REPO_DIR/link"; ln -s SKILL.md "$SYNC_MEETING_USER_DIR/link"
out="$(bash "$SCRIPT" --to-user 2>&1)"; rc=$?
[ "$rc" -eq 0 ] && pass "13 shared symlink and shared empty folder are not counted as destination-only" || fail "13 exited $rc: $out"

echo
echo "fixtures left in: $T"
if [ "$fails" -eq 0 ]; then echo "sync-meeting-skill.test.sh: all passed"; exit 0; fi
echo "sync-meeting-skill.test.sh: $fails FAILED"; exit 1
