#!/bin/bash
# Respawns critical tmux sessions if they die. Runs via cron every minute.
# Checks actual process presence, not just tmux session (tmux shell can survive its child dying).
export PATH=$HOME/.local/bin:$PATH

respawn() {
  local name=$1
  local cmd=$2
  local pat=$3  # optional process pattern to verify aliveness
  local need_spawn=0

  if [ -n "$pat" ]; then
    # Check process pattern. If not present but tmux exists, shell is orphaned.
    if ! pgrep -f "$pat" >/dev/null 2>&1; then
      tmux kill-session -t "$name" 2>/dev/null
      pkill -9 -f "$pat" 2>/dev/null  # kill any stragglers from prior runs
      need_spawn=1
    fi
  fi

  if ! tmux has-session -t "$name" 2>/dev/null; then
    need_spawn=1
  fi

  if [ "$need_spawn" = "1" ]; then
    tmux new -d -s "$name" "$cmd" && echo "$(date -Iseconds) respawned $name" >> $HOME/watchdog.log
  fi
}

ENV_SOURCE='set -a; [ -f $HOME/.env.portal ] && . $HOME/.env.portal; set +a'

respawn ao            "cd $HOME/code/ZAOOS && ao start 2>&1 | tee $HOME/ao.log" "ao start"
respawn caddy         "$HOME/.local/bin/caddy run --config $HOME/caddy/Caddyfile --adapter caddyfile" "caddy run"
respawn claude-zaoos  "cd $HOME/code/ZAOOS && claude"  ""
respawn ttyd          "$HOME/.local/bin/ttyd -i lo -p 7681 -W -t fontSize=15 -t scrollback=10000 -t disableLeaveAlert=true -t cursorBlink=true tmux attach -t claude-zaoos" "ttyd -i lo -p 7681"
# cloudflared is supervised by user-systemd (~/.config/systemd/user/cloudflared.service)
# so watchdog no longer manages it. Running both systemd and tmux simultaneously
# caused duplicate tunnel connections and ~19s TTFB on every request (2026-04-20).
# respawn cloudflared   "cloudflared tunnel run zao-agents" "cloudflared tunnel run"
respawn spawn-server  "bash -c \"$ENV_SOURCE; node \$HOME/bin/spawn-server.js 2>&1 | tee \$HOME/spawn-server.log\"" "node.*spawn-server.js"
respawn auth-server   "bash -c \"$ENV_SOURCE; node \$HOME/bin/auth-server.js 2>&1 | tee \$HOME/auth-server.log\"" "node.*auth-server.js"
# Bot source of truth = repo-synced symlink at $HOME/bin/bot.mjs (per install.sh).
# cwd stays at $HOME/zoe-bot so existing logs (bot.log, api.log, commands.log)
# and auxiliary scripts (send-coc4.sh) keep their home.
# zoe-bot pattern is the bare `bin/bot.mjs` path — distinct from devz-bot whose
# entry file is named devz-bot.mjs so the two never collide under pgrep.
respawn zoe-bot       "bash -c \"$ENV_SOURCE; mkdir -p \$HOME/zoe-bot; cd \$HOME/zoe-bot; node \$HOME/bin/bot.mjs 2>&1 | tee bot.log\"" "bin/bot\\.mjs"

# ZAO Devz bot. Only spawns if ~/zoe-devz/.env exists (so the bot stays dormant
# until Zaal creates @zaodevz_bot via @BotFather + installs the token).
# Token + allowlist live in ~/zoe-devz/.env (600, not committed). Code is the
# repo-synced devz-bot.mjs symlink at $HOME/bin/devz-bot.mjs.
if [ -f "$HOME/zoe-devz/.env" ]; then
  DEVZ_ENV_SOURCE='set -a; . $HOME/zoe-devz/.env; set +a'
  respawn zoe-devz-bot  "bash -c \"$DEVZ_ENV_SOURCE; cd \$HOME/zoe-devz; node \$HOME/bin/devz-bot.mjs 2>&1 | tee bot.log\"" "devz-bot\\.mjs"
fi
