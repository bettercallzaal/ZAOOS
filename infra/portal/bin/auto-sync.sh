#!/bin/bash
# Per-minute VPS auto-sync.
#
# What it does every tick:
#   1. git pull --ff-only on both clones (deploy repo + openclaw workspace)
#   2. Re-run install.sh if infra/portal/install.sh or sync.sh changed
#      (refreshes symlinks + crontab declaratively, idempotent)
#   3. Detect hash changes on hot bot/server files; kill the matching tmux
#      session so watchdog.sh respawns it on its next tick (~60s later).
#
# Safe to run concurrently-ish: git pull --ff-only fails noisily on divergent
# history rather than mangling; every other action is idempotent. Logs to
# ~/.claude/auto-sync.log, one line per tick.
#
# Runs as the `zaal` user via cron (* * * * *). Installed by infra/portal/install.sh.

set -uo pipefail

LOG="$HOME/.claude/auto-sync.log"
HASH_DIR="$HOME/.cache/auto-sync"
mkdir -p "$(dirname "$LOG")" "$HASH_DIR"

TS() { date -Iseconds; }
log() { echo "$(TS) $*" >> "$LOG"; }

# ----- 1. pull the two clones ------------------------------------------------

pull_clone() {
  local dir=$1
  [ -d "$dir/.git" ] || return 0
  # Skip clones that aren't on `main` with a clean tree. Dev work copies
  # (Zaal's ~/code/ZAOOS sits on a feature branch with uncommitted changes)
  # always fail ff-only pull and were flooding the log every tick. Silent
  # skip respects user workflow.
  local branch
  branch=$(git -C "$dir" symbolic-ref --short HEAD 2>/dev/null || echo "")
  if [ "$branch" != "main" ]; then
    return 0
  fi
  if [ -n "$(git -C "$dir" status --porcelain 2>/dev/null)" ]; then
    return 0
  fi
  local before after
  before=$(git -C "$dir" rev-parse HEAD 2>/dev/null || echo "")
  git -C "$dir" pull --ff-only origin main >/dev/null 2>&1 || {
    log "pull-fail $dir"
    return 0
  }
  after=$(git -C "$dir" rev-parse HEAD 2>/dev/null || echo "")
  if [ "$before" != "$after" ] && [ -n "$after" ]; then
    log "pulled $dir $before -> $after"
  fi
}

pull_clone "$HOME/zao-os"
pull_clone "$HOME/openclaw-workspace/zaoos"
pull_clone "$HOME/code/ZAOOS"

# ----- 2. re-run install.sh if infra files changed ---------------------------
# Only when install.sh or sync.sh themselves moved. Avoids a full reinstall
# every minute while still keeping symlinks/crontab coherent if Zaal merges
# deploy-affecting changes.

INSTALL="$HOME/zao-os/infra/portal/install.sh"
SYNC="$HOME/zao-os/infra/portal/sync.sh"
INSTALL_HASH_FILE="$HASH_DIR/install.sh.hash"
SYNC_HASH_FILE="$HASH_DIR/sync.sh.hash"

file_hash() { [ -f "$1" ] && sha256sum "$1" 2>/dev/null | awk '{print $1}'; }

maybe_reinstall=0
for pair in "$INSTALL:$INSTALL_HASH_FILE" "$SYNC:$SYNC_HASH_FILE"; do
  file=${pair%%:*}
  hf=${pair##*:}
  new=$(file_hash "$file")
  [ -z "$new" ] && continue
  old=""
  [ -f "$hf" ] && old=$(cat "$hf")
  if [ "$new" != "$old" ]; then
    echo "$new" > "$hf"
    maybe_reinstall=1
  fi
done

if [ "$maybe_reinstall" = "1" ] && [ -x "$INSTALL" ]; then
  log "re-running install.sh (install.sh or sync.sh changed)"
  bash "$INSTALL" >> "$LOG" 2>&1 || log "install.sh failed (exit $?)"
fi

# ----- 3. bounce tmux session if hot files changed ---------------------------
# Watchdog.sh respawns killed sessions within ~60s. We just kill to force
# fresh `node $HOME/bin/bot.mjs` process on next tick.

bounce_if_changed() {
  local tmux_name=$1 file=$2 procpat=$3
  [ -f "$file" ] || return 0
  local new old
  new=$(file_hash "$file")
  [ -z "$new" ] && return 0
  # Hash key is per-FILE (basename), not per-tmux session. Prior version used
  # ${tmux_name}.hash which caused every watched file that shared a tmux name
  # (bot.mjs + events.mjs both bounce zoe-bot) to overwrite the same hash
  # file on each pass, producing a bounce-every-tick loop observed at
  # 2026-04-21T11:35:03 in ~/.claude/auto-sync.log.
  local hf="$HASH_DIR/$(basename "$file").hash"
  old=""
  [ -f "$hf" ] && old=$(cat "$hf")
  if [ "$new" != "$old" ]; then
    echo "$new" > "$hf"
    # First run after install has empty old hash — don't bounce on first-sight.
    if [ -n "$old" ]; then
      tmux kill-session -t "$tmux_name" 2>/dev/null || true
      [ -n "$procpat" ] && pkill -f "$procpat" 2>/dev/null || true
      log "bounced $tmux_name (file=$file)"
    else
      log "seeded $(basename "$file") hash (no bounce)"
    fi
  fi
}

# Hot files. bot.mjs pulls in events.mjs — bounce bot on either change.
bounce_if_changed "zoe-bot"      "$HOME/zao-os/infra/portal/bin/bot.mjs"                       "bin/bot\\.mjs"
bounce_if_changed "zoe-bot"      "$HOME/zao-os/infra/portal/bin/events.mjs"                    "bin/bot\\.mjs"
bounce_if_changed "spawn-server" "$HOME/zao-os/infra/portal/bin/spawn-server.js"               "node.*spawn-server.js"
bounce_if_changed "auth-server"  "$HOME/zao-os/infra/portal/bin/auth-server.js"                "node.*auth-server.js"
# ZAO Devz bot + shared bot-core. Both bounce zoe-devz-bot when content
# changes. Watchdog respawn is gated on ~/zoe-devz/.env existing, so these
# no-op safely until Zaal installs the bot token.
bounce_if_changed "zoe-devz-bot" "$HOME/zao-os/infra/portal/bin/bots/zao-devz/bot.mjs"         "devz-bot\\.mjs"
bounce_if_changed "zoe-devz-bot" "$HOME/zao-os/infra/portal/bin/bots/_shared/bot-core.mjs"     "devz-bot\\.mjs"

# Trim log to last 2000 lines.
tail -n 2000 "$LOG" > "$LOG.tmp" 2>/dev/null && mv "$LOG.tmp" "$LOG" || true
exit 0
