#!/bin/bash
# Idempotent first-run installer for the ZAO portal stack on VPS 1.
# Run as the `zaal` user. Assumes Node 20, tmux, git, gh, cloudflared, npm, openssl are already present.
# No sudo needed.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
HOME_DIR="$HOME"

echo "== ensure ~/.local/bin on PATH =="
grep -q "HOME/.local/bin" "$HOME_DIR/.bashrc" 2>/dev/null || echo 'export PATH=$HOME/.local/bin:$PATH' >> "$HOME_DIR/.bashrc"
grep -q "HOME/.local/bin" "$HOME_DIR/.profile" 2>/dev/null || echo 'export PATH=$HOME/.local/bin:$PATH' >> "$HOME_DIR/.profile"
export PATH="$HOME_DIR/.local/bin:$PATH"

echo "== install user-local binaries (no sudo) =="
mkdir -p "$HOME_DIR/.local/bin"
if ! command -v ao >/dev/null 2>&1; then npm install --prefix "$HOME_DIR/.local" -g @aoagents/ao; fi
if [ ! -x "$HOME_DIR/.local/bin/ttyd" ]; then curl -fsSL -o "$HOME_DIR/.local/bin/ttyd" https://github.com/tsl0922/ttyd/releases/latest/download/ttyd.x86_64 && chmod +x "$HOME_DIR/.local/bin/ttyd"; fi
if [ ! -x "$HOME_DIR/.local/bin/caddy" ]; then curl -fsSL -o /tmp/caddy "https://caddyserver.com/api/download?os=linux&arch=amd64" && chmod +x /tmp/caddy && mv /tmp/caddy "$HOME_DIR/.local/bin/caddy"; fi

echo "== symlink config into ~ =="
mkdir -p "$HOME_DIR/caddy" "$HOME_DIR/bin" "$HOME_DIR/test-checklist" "$HOME_DIR/portal-state"
ln -sfn "$REPO_DIR/caddy/Caddyfile"         "$HOME_DIR/caddy/Caddyfile"
ln -sfn "$REPO_DIR/caddy/portal"            "$HOME_DIR/caddy/portal"
ln -sfn "$REPO_DIR/caddy/dock"              "$HOME_DIR/caddy/dock"
ln -sfn "$REPO_DIR/caddy/claude"            "$HOME_DIR/caddy/claude"
ln -sfn "$REPO_DIR/caddy/ao"                "$HOME_DIR/caddy/ao"
for f in auth-server.js spawn-server.js watchdog.sh start-agents.sh fix-node-pty.sh test-checklist-ping.sh bot.mjs session-watcher.mjs auto-sync.sh; do
  ln -sfn "$REPO_DIR/bin/$f" "$HOME_DIR/bin/$f"
  chmod +x "$HOME_DIR/bin/$f" 2>/dev/null || true
done
# Branded bots — symlinked with a unique filename at $HOME/bin so watchdog's
# pgrep patterns can discriminate between them. Each bot's actual code lives
# at infra/portal/bin/bots/<name>/bot.mjs in the repo. ~/zoe-<name>/.env gates
# whether watchdog boots it (prevents flapping when token not yet installed).
ln -sfn "$REPO_DIR/bin/bots/zao-devz/bot.mjs" "$HOME_DIR/bin/devz-bot.mjs"
chmod +x "$HOME_DIR/bin/devz-bot.mjs" 2>/dev/null || true
# Cloudflared config lives in ~/.cloudflared (not symlinked so CF creds file is separate)
mkdir -p "$HOME_DIR/.cloudflared"
cp -f "$REPO_DIR/cloudflared/config.yml" "$HOME_DIR/.cloudflared/config.yml"

echo "== make /caddy/portal/dock.js exist =="
# Portal serves /dock.js from portal/ directory; ensure the file is in the served path.
cp -f "$REPO_DIR/caddy/dock/dock.js" "$REPO_DIR/caddy/portal/dock.js"

echo "== ensure auth token exists =="
[ -f "$HOME_DIR/.auth-token" ] || openssl rand -hex 32 > "$HOME_DIR/.auth-token"
chmod 600 "$HOME_DIR/.auth-token"

echo "== bootstrap test checklist if missing =="
if [ ! -f "$HOME_DIR/test-checklist/state.json" ]; then
  cat > "$HOME_DIR/test-checklist/state.json" <<'JSON'
{
  "created": "2026-04-17",
  "title": "ZAO Agent Portal phone test",
  "tests": [
    {"id":1,"name":"PWA install","done":false,"description":"Safari -> Add to Home Screen -> tap icon -> full-screen standalone"},
    {"id":2,"name":"Quick-spawn form","done":false,"description":"Portal -> Quick Spawn -> type prompt -> Spawn -> AO WORKING column shows session"},
    {"id":3,"name":"Watchdog self-heal","done":false,"description":"tmux kill-session -t ao, wait 90s, ao.zaoos.com back up"},
    {"id":4,"name":"PWA assets","done":false,"description":"manifest.json renders JSON; icon.svg renders navy+gold ZAO"},
    {"id":5,"name":"All three domains","done":false,"description":"ao, claude, portal all auth + render"}
  ]
}
JSON
fi

echo "== ensure todos state =="
[ -f "$HOME_DIR/portal-state/todos.json" ] || echo '{"todos":[]}' > "$HOME_DIR/portal-state/todos.json"

echo "== install crontab entries =="
# Strip any prior managed lines + old git-sync.sh entry (superseded by auto-sync.sh).
CRON=$(crontab -l 2>/dev/null | grep -v -E "start-agents\.sh|watchdog\.sh|test-checklist-ping\.sh|session-watcher\.mjs|auto-sync\.sh|\\.claude/git-sync\\.sh" || true)
{
  echo "$CRON"
  echo "@reboot $HOME_DIR/bin/start-agents.sh"
  echo "* * * * * $HOME_DIR/bin/watchdog.sh"
  # Per-minute auto-sync: git pull both clones + re-run install.sh if infra
  # deploy files changed + kill-to-respawn bot/server if hot files changed.
  # Replaces the old */15 git-sync.sh. See infra/portal/bin/auto-sync.sh.
  echo "* * * * * $HOME_DIR/bin/auto-sync.sh >> $HOME_DIR/.claude/auto-sync.log 2>&1"
  echo "*/15 * * * * $HOME_DIR/bin/test-checklist-ping.sh >> $HOME_DIR/test-checklist/cron.log 2>&1"
  # ZOE ship-fix session watcher: polls watched-sessions.json for matured AO
  # sessions and posts PR links back to Telegram. See doc 464 Part 3 / Patch 6.
  echo "*/2 * * * * . \$HOME/.env.portal 2>/dev/null; $HOME_DIR/bin/session-watcher.mjs >> $HOME_DIR/.cache/zoe-telegram/session-watcher.log 2>&1"
} | crontab -

echo "== fix node-pty (use homebridge prebuilt multiarch) =="
"$HOME_DIR/bin/fix-node-pty.sh" || true

echo "== restart sessions via watchdog =="
"$HOME_DIR/bin/watchdog.sh"

echo "== done =="
echo "Health check:"
sleep 3
ss -tln | grep -E ":(3001|3002|3003|3004|3005|7681|7682) " | head -10
