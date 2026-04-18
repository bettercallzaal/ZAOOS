#!/bin/bash
# Respawns critical tmux sessions if they die. Runs via cron every minute.
export PATH=$HOME/.local/bin:$PATH
ENV_SOURCE="set -a; [ -f \$HOME/.env.portal ] && . \$HOME/.env.portal; set +a"
respawn() {
  local name=$1
  local cmd=$2
  if ! tmux has-session -t "$name" 2>/dev/null; then
    tmux new -d -s "$name" "$cmd"
    echo "$(date -Iseconds) respawned $name" >> $HOME/watchdog.log
  fi
}
respawn ao            "cd $HOME/code/ZAOOS && ao start 2>&1 | tee $HOME/ao.log"
respawn caddy         "$HOME/.local/bin/caddy run --config $HOME/caddy/Caddyfile --adapter caddyfile"
respawn claude-zaoos  "cd $HOME/code/ZAOOS && claude"
respawn ttyd          "$HOME/.local/bin/ttyd -i lo -p 7681 -W -t fontSize=15 -t scrollback=10000 -t disableLeaveAlert=true -t cursorBlink=true tmux attach -t claude-zaoos"
respawn cloudflared   "cloudflared tunnel run zao-agents"
respawn spawn-server  "bash -c \"$ENV_SOURCE; node \$HOME/bin/spawn-server.js 2>&1 | tee \$HOME/spawn-server.log\""
respawn auth-server   "bash -c \"$ENV_SOURCE; node \$HOME/bin/auth-server.js 2>&1 | tee \$HOME/auth-server.log\""
respawn zoe-bot       "bash -c \"$ENV_SOURCE; cd \$HOME/zoe-bot; node bot.mjs 2>&1 | tee bot.log\""
