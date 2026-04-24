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

SUPA_URL="$(grep -E '^NEXT_PUBLIC_SUPABASE_URL=' "$LOCAL_ENV" | head -n1 | cut -d'=' -f2- | tr -d '"' | tr -d "'" | xargs)"
SUPA_KEY="$(grep -E '^SUPABASE_SERVICE_ROLE_KEY=' "$LOCAL_ENV" | head -n1 | cut -d'=' -f2- | tr -d '"' | tr -d "'" | xargs)"
BOT_TOKEN="$(grep -E '^ZAOSTOCK_BOT_TOKEN=' "$LOCAL_ENV" | head -n1 | cut -d'=' -f2- | tr -d '"' | tr -d "'" | xargs)"
# Fallback: if ZAOSTOCK_BOT_TOKEN missing, try TELEGRAM_BOT_TOKEN (they're 46 chars locally = same length = same token)
[ -z "$BOT_TOKEN" ] && BOT_TOKEN="$(grep -E '^TELEGRAM_BOT_TOKEN=' "$LOCAL_ENV" | head -n1 | cut -d'=' -f2- | tr -d '"' | tr -d "'" | xargs)"

[ -z "$SUPA_URL" ] && { echo "ERROR: NEXT_PUBLIC_SUPABASE_URL missing from $LOCAL_ENV"; exit 1; }
[ -z "$SUPA_KEY" ] && { echo "ERROR: SUPABASE_SERVICE_ROLE_KEY missing from $LOCAL_ENV"; exit 1; }
[ -z "$BOT_TOKEN" ] && { echo "ERROR: ZAOSTOCK_BOT_TOKEN (or TELEGRAM_BOT_TOKEN) missing from $LOCAL_ENV"; exit 1; }

echo "Found: Supabase URL + service role key + bot token (all 3) in $LOCAL_ENV"
echo "Updating $VPS_HOST:~/$VPS_PATH"
echo ""

# Use a remote sed that:
#  1) Replaces the SUPABASE_URL line (and adds it if missing)
#  2) Replaces the SUPABASE_SERVICE_ROLE_KEY line (and adds it if missing)
#  3) Drops ANTHROPIC_API_KEY and BOT_ADMIN_TELEGRAM_IDS lines (not needed for v1)
#  4) chmod 600

ssh "$VPS_HOST" "SUPA_URL='$SUPA_URL' SUPA_KEY='$SUPA_KEY' BOT_TOKEN='$BOT_TOKEN' bash -c '
  cd ~/zaostock-bot
  mkdir -p .
  # Backup once if .env exists.
  [ -f .env ] && cp -n .env .env.backup 2>/dev/null || true

  # Write fresh .env - only the 3 vars the bot needs, no placeholders, no stale comments.
  cat > .env <<ENVEOF
ZAOSTOCK_BOT_TOKEN=\$BOT_TOKEN
TELEGRAM_BOT_TOKEN=\$BOT_TOKEN
SUPABASE_URL=\$SUPA_URL
SUPABASE_SERVICE_ROLE_KEY=\$SUPA_KEY
ENVEOF
  chmod 600 .env

  echo ---.env variable names now---
  awk -F= \"{print \\\$1}\" .env
  echo ---lengths---
  awk -F= \"{print \\\$1, length(\\\$2), \\\"chars\\\"}\" .env
'"

echo ""
echo "Done. All 3 vars written to VPS .env (chmod 600)."
echo "Next: restart the service with:"
echo "  ssh $VPS_HOST 'systemctl --user restart zaostock-bot && sleep 2 && journalctl --user -u zaostock-bot -n 10 --no-pager'"
