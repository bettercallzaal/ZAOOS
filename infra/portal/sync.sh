#!/bin/bash
# Pull latest from git, then apply to the running VPS without breaking sessions.
# Run as `zaal`. Run from anywhere on VPS; it finds itself.
set -euo pipefail
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO_DIR"
git pull --ff-only origin main || echo "git pull skipped"

# Re-run install to refresh symlinks + copy dock.js
"$REPO_DIR/install.sh"

# Bounce caddy + spawn-server + auth-server so new config + code takes effect.
# ao / claude-zaoos / cloudflared left alone (sessions are precious).
for s in caddy spawn-server auth-server ttyd; do
  tmux kill-session -t "$s" 2>/dev/null || true
done
sleep 2
# watchdog runs every minute; fire it now for speed
"$REPO_DIR/bin/watchdog.sh"
sleep 3
echo "== ports after sync =="
ss -tln | grep -E ":(3002|3003|3004|3005|7681|7682) " | head -10
echo "== done =="
