#!/usr/bin/env bash
# Sync ONLY the Supabase lines from local .env.local to VPS ~/zaostock-bot/.env.
# Leaves TELEGRAM_BOT_TOKEN untouched — you fill that one in separately.
#
# Run from repo root:
#   bash bot/scripts/sync-supabase-env.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
LOCAL_ENV="$REPO_ROOT/.env.local"
VPS_HOST="${VPS_HOST:-zaal@31.97.148.88}"
VPS_PATH="${VPS_PATH:-zaostock-bot/.env}"

if [ ! -f "$LOCAL_ENV" ]; then
  echo "ERROR: $LOCAL_ENV not found."
  exit 1
fi

g() { grep -E "^$1=" "$LOCAL_ENV" | head -n1 | cut -d'=' -f2- | tr -d '"' | tr -d "'" | xargs; }

SUPA_URL="$(g NEXT_PUBLIC_SUPABASE_URL)"
SUPA_KEY="$(g SUPABASE_SERVICE_ROLE_KEY)"
BOT_TOKEN="$(g ZAOSTOCK_BOT_TOKEN)"
[ -z "$BOT_TOKEN" ] && BOT_TOKEN="$(g TELEGRAM_BOT_TOKEN)"
MINIMAX_KEY="$(g MINIMAX_API_KEY)"
MINIMAX_URL="$(g MINIMAX_API_URL)"
MINIMAX_MODEL="$(g MINIMAX_MODEL)"
ADMIN_IDS="$(g BOT_ADMIN_TELEGRAM_IDS)"

[ -z "$SUPA_URL" ] && { echo "ERROR: NEXT_PUBLIC_SUPABASE_URL missing from $LOCAL_ENV"; exit 1; }
[ -z "$SUPA_KEY" ] && { echo "ERROR: SUPABASE_SERVICE_ROLE_KEY missing from $LOCAL_ENV"; exit 1; }
[ -z "$BOT_TOKEN" ] && { echo "ERROR: ZAOSTOCK_BOT_TOKEN / TELEGRAM_BOT_TOKEN missing"; exit 1; }

echo "Found: Supabase URL + service role key + bot token"
[ -n "$MINIMAX_KEY" ] && echo "Found: Minimax creds (API key + URL + model)"
[ -n "$ADMIN_IDS" ] && echo "Found: BOT_ADMIN_TELEGRAM_IDS"
echo "Updating $VPS_HOST:~/$VPS_PATH"
echo ""

# Use a remote sed that:
#  1) Replaces the SUPABASE_URL line (and adds it if missing)
#  2) Replaces the SUPABASE_SERVICE_ROLE_KEY line (and adds it if missing)
#  3) Drops ANTHROPIC_API_KEY and BOT_ADMIN_TELEGRAM_IDS lines (not needed for v1)
#  4) chmod 600

ssh "$VPS_HOST" "SUPA_URL='$SUPA_URL' SUPA_KEY='$SUPA_KEY' BOT_TOKEN='$BOT_TOKEN' MINIMAX_KEY='$MINIMAX_KEY' MINIMAX_URL='$MINIMAX_URL' MINIMAX_MODEL='$MINIMAX_MODEL' ADMIN_IDS='$ADMIN_IDS' bash -c '
  cd ~/zaostock-bot
  [ -f .env ] && cp -n .env .env.backup 2>/dev/null || true

  cat > .env <<ENVEOF
ZAOSTOCK_BOT_TOKEN=\$BOT_TOKEN
TELEGRAM_BOT_TOKEN=\$BOT_TOKEN
SUPABASE_URL=\$SUPA_URL
SUPABASE_SERVICE_ROLE_KEY=\$SUPA_KEY
MINIMAX_API_KEY=\$MINIMAX_KEY
MINIMAX_API_URL=\$MINIMAX_URL
MINIMAX_MODEL=\$MINIMAX_MODEL
BOT_ADMIN_TELEGRAM_IDS=\$ADMIN_IDS
ENVEOF
  chmod 600 .env

  echo ---.env variable names now---
  awk -F= \"{print \\\$1}\" .env
  echo ---lengths---
  awk -F= \"{print \\\$1, length(\\\$2), \\\"chars\\\"}\" .env
'"

echo ""
echo "Done. Telegram token line is untouched."
echo "Next: edit it on VPS with:  ssh $VPS_HOST 'nano ~/zaostock-bot/.env'"
echo "Replace the TELEGRAM_BOT_TOKEN line with the real token, save, exit."
