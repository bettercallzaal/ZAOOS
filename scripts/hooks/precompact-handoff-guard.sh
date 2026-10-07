#!/bin/bash
# precompact-handoff-guard.sh - PreCompact hook (handoff-discipline.md rule 2).
#
# Fires before compaction. If this lane's record in the vault is stale (>6h) or
# missing, emit a loud directive: write/refresh the handoff NOW, before
# compaction degrades the context that would write it well. The wavewarz
# lane died at 90% context without a brief; this is the structural fix.
#
# As a hook it never blocks (exit 0 always) - it instructs the model, it does
# not gate. `--check` is for tools and tests: exit 0 fresh, 1 stale or no
# record, 2 UNKNOWN (no lane resolved, or the vault could not be read).
#
# TWO DEFECTS FIXED 2026-10-06, both hit by the skills lane and the
# orchestrator the same day ("NO brief exists for lane 'unknown'"):
#
# 1. THE LANE. It was ZAO_LANE or the tmux session name. An Orca pane has
#    neither, so every Orca lane was 'unknown' - and a pane on a machine where
#    some OTHER tmux server was running got that server's session name, which
#    is worse. Now: ZAO_LANE; tmux only when this shell is inside tmux ($TMUX);
#    else the working directory, the way zaal-dotfiles bin/zao-lane-context.sh
#    resolves it at session start. A git worktree is resolved through its main
#    checkout, so an Orca worktree with any directory name finds its lane.
#    When nothing resolves it says UNKNOWN. It never prints a guessed name.
#
# 2. THE SURFACE. It looked for ~/zao-vault/handoffs/<lane>.md in the working
#    copy of the shared clone. That clone runs hundreds of commits behind
#    origin, and lanes record to handoffs/status/<lane>.md on origin now. So a
#    lane that had recorded ten minutes ago was told it had no brief. Now it
#    reads origin/main of the vault (after a bounded fetch) and takes the
#    newest commit touching either file. The message names what it read.
#
# Test: scripts/__tests__/precompact-handoff-guard.test.ts
set -u
CHECK=0; [ "${1:-}" = "--check" ] && CHECK=1
VAULT="${ZAO_VAULT:-$HOME/zao-vault}"
STALE_H=6

finish() {  # finish <check-exit-code>
  [ "$CHECK" = 1 ] && exit "$1"
  exit 0
}

# --- cwd: the hook JSON on stdin carries it; a bare shell falls back to $PWD ---
STDIN_JSON=""
[ -t 0 ] || STDIN_JSON=$(cat 2>/dev/null || true)
CWD=$(printf '%s' "$STDIN_JSON" | python3 -c 'import sys, json
try: print(json.load(sys.stdin).get("cwd") or "")
except Exception: print("")' 2>/dev/null || true)
[ -n "$CWD" ] || CWD="$PWD"

# --- does origin/main of the vault hold a record under this name? -------------
has_record() {
  git -C "$VAULT" cat-file -e "origin/main:handoffs/status/$1.md" 2>/dev/null \
    || git -C "$VAULT" cat-file -e "origin/main:handoffs/$1.md" 2>/dev/null
}

# --- a directory name -> a lane. KEEP IN STEP with the case table in
# zaal-dotfiles bin/zao-lane-context.sh; that file is the source. ---------------
lane_for_dir() {
  case "$1" in
    zao-icm|orchestrator) echo orchestration ;;
    zpoidh|poidhz) echo poidhz ;;
    zao-vault) echo vault ;;
    zao-media) echo zm ;;
    finance-hq|finance) echo finance ;;
    zao-fractal-bot|zaofractal) echo zaofractal ;;
    zaal-dotfiles) echo zj ;;
    grill-2) echo grill ;;
    zaostock*) echo zaostock ;;
    downeast-zao) echo downeast-zao ;;
    "ZAO OS V1"|zaoos*) echo zaoos ;;
    zaoonparagraph) echo paragraph ;;
    zabalgamez) echo zabalgamez ;;
    *) if [ -n "$1" ] && has_record "$1"; then echo "$1"; fi ;;
  esac
}

LANE=""; HOW=""
if [ -n "${ZAO_LANE:-}" ]; then
  LANE="$ZAO_LANE"; HOW="ZAO_LANE"
elif [ -n "${TMUX:-}" ]; then
  LANE=$(tmux display-message -p '#S' 2>/dev/null || true); HOW="tmux session"
fi
if [ -z "$LANE" ]; then
  LANE=$(lane_for_dir "$(basename "$CWD")"); HOW="directory $(basename "$CWD")"
fi
if [ -z "$LANE" ]; then
  # A git worktree (Orca makes these with any name): ask git for the main checkout.
  COMMON=$(git -C "$CWD" rev-parse --path-format=absolute --git-common-dir 2>/dev/null || true)
  if [ -n "$COMMON" ]; then
    MAIN_DIR=$(basename "$(dirname "$COMMON")")
    LANE=$(lane_for_dir "$MAIN_DIR"); HOW="main checkout $MAIN_DIR of this worktree"
  fi
fi

if [ -z "$LANE" ]; then
  if [ -n "${TMUX:-}" ]; then TMUX_SAID="inside tmux, but it gave no session name"; else TMUX_SAID="not inside tmux"; fi
  echo "HANDOFF GUARD: compaction is firing and this pane's lane is UNKNOWN."
  echo "Looked at: ZAO_LANE (unset), tmux ($TMUX_SAID), and the directory $CWD."
  echo "None names a lane, so whether a handoff exists was NOT checked. This is not \"no brief\"."
  echo "Before doing anything else after compaction: record where this session stands"
  echo "under your lane's name (zao-status-append <lane> \"...\"), and set ZAO_LANE for"
  echo "this pane so the next compaction can check it."
  finish 2
fi

# --- read the vault's origin, not the shared clone's working copy -------------
if ! git -C "$VAULT" rev-parse --git-dir >/dev/null 2>&1; then
  echo "HANDOFF GUARD: compaction is firing; lane '$LANE' (from $HOW). The vault at $VAULT could not be read, so whether a handoff exists is UNKNOWN."
  finish 2
fi
FETCHED="fetched just now"
if [ "${HANDOFF_GUARD_NO_FETCH:-0}" = 1 ]; then
  FETCHED="not fetched"
else
  git -C "$VAULT" fetch -q origin main >/dev/null 2>&1 &
  FP=$!
  ( sleep "${HANDOFF_GUARD_FETCH_TIMEOUT:-8}"; kill "$FP" 2>/dev/null ) >/dev/null 2>&1 &
  KP=$!
  if wait "$FP" 2>/dev/null; then :; else FETCHED="fetch failed, so this is the last origin/main this Mac saw"; fi
  kill "$KP" 2>/dev/null; wait "$KP" 2>/dev/null
fi
if ! git -C "$VAULT" rev-parse --verify -q origin/main >/dev/null 2>&1; then
  echo "HANDOFF GUARD: compaction is firing; lane '$LANE' (from $HOW). The vault at $VAULT has no origin/main, so whether a handoff exists is UNKNOWN."
  finish 2
fi

SFILE="handoffs/status/$LANE.md"; BFILE="handoffs/$LANE.md"
LAST=$(git -C "$VAULT" log -1 --format='%ct' origin/main -- "$SFILE" "$BFILE" 2>/dev/null || true)
SURFACE="vault origin/main, $SFILE and $BFILE ($FETCHED)"
now=$(date +%s)
if [ -n "$LAST" ] && has_record "$LANE"; then
  age_h=$(( (now - LAST) / 3600 ))
  if (( age_h < STALE_H )); then
    echo "handoff-guard: lane '$LANE' (from $HOW) last recorded ${age_h}h ago - fresh enough. Read: $SURFACE."
    finish 0
  fi
  echo "HANDOFF GUARD: compaction is firing and lane '$LANE' (from $HOW) last recorded ${age_h}h ago. Read: $SURFACE."
else
  echo "HANDOFF GUARD: compaction is firing and NO record exists for lane '$LANE' (from $HOW). Read: $SURFACE."
fi
cat <<'EOF'
Before doing anything else after compaction: record where this lane stands.
The short form is a status line on origin (zao-status-append <lane> "...",
which commits through a worktree, never in the shared ~/zao-vault clone). When
the next session needs more than a line, write or refresh the brief at
handoffs/<lane>.md per the TEMPLATE (mission, priority order, Zaal tap stack,
cautions, links, session-summary tail; frontmatter status: unconsumed). If
context is too degraded for a full brief, emergency-dump the minimal one:
current tasks, git state, open threads, last user directive. Then push the
vault. See .claude/rules/handoff-discipline.md.
EOF
finish 1
