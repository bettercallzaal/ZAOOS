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

[ -z "$SUPA_URL" ] && { echo "ERROR: NEXT_PUBLIC_SUPABASE_URL missing from $LOCAL_ENV"; exit 1; }
[ -z "$SUPA_KEY" ] && { echo "ERROR: SUPABASE_SERVICE_ROLE_KEY missing from $LOCAL_ENV"; exit 1; }

echo "Found Supabase URL + service role key in $LOCAL_ENV"
echo "Updating $VPS_HOST:~/$VPS_PATH (Telegram token line left untouched)"
echo ""

# Use a remote sed that:
#  1) Replaces the SUPABASE_URL line (and adds it if missing)
#  2) Replaces the SUPABASE_SERVICE_ROLE_KEY line (and adds it if missing)
#  3) Drops ANTHROPIC_API_KEY and BOT_ADMIN_TELEGRAM_IDS lines (not needed for v1)
#  4) chmod 600

ssh "$VPS_HOST" "SUPA_URL='$SUPA_URL' SUPA_KEY='$SUPA_KEY' bash -c '
  cd ~/zaostock-bot
  [ ! -f .env ] && { echo ERROR: .env missing; exit 1; }

  # Back up once.
  cp -n .env .env.backup || true

  # Remove any existing lines for these vars, strip unused ones.
  grep -v -E \"^(SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY|ANTHROPIC_API_KEY|BOT_ADMIN_TELEGRAM_IDS)=\" .env > .env.new || true

  # Append fresh values.
  echo \"SUPABASE_URL=\$SUPA_URL\" >> .env.new
  echo \"SUPABASE_SERVICE_ROLE_KEY=\$SUPA_KEY\" >> .env.new

  mv .env.new .env
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
