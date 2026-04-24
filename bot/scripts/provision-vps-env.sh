#!/usr/bin/env bash
# Provision ~/zaostock-bot/.env on the VPS without exposing secrets to Claude.
#
# Run from your Mac:
#   bash bot/scripts/provision-vps-env.sh
#
# Reads Supabase keys from your local .env.local (already on your machine).
# Prompts for the Telegram bot token silently (no echo, no scrollback, no clipboard).
# SSHes to the VPS and writes the .env there via stdin — nothing touches disk on your
# Mac and nothing is visible to any agent.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
LOCAL_ENV="$REPO_ROOT/.env.local"
VPS_HOST="${VPS_HOST:-zaal@31.97.148.88}"
VPS_PATH="${VPS_PATH:-zaostock-bot/.env}"

if [ ! -f "$LOCAL_ENV" ]; then
  echo "ERROR: $LOCAL_ENV not found. Are you running this from the repo root?"
  exit 1
fi

# Extract only the two keys we need, straight from your local env.
SUPA_URL="$(grep -E '^NEXT_PUBLIC_SUPABASE_URL=' "$LOCAL_ENV" | head -n1 | cut -d'=' -f2- | tr -d '"' | tr -d "'" | xargs)"
SUPA_KEY="$(grep -E '^SUPABASE_SERVICE_ROLE_KEY=' "$LOCAL_ENV" | head -n1 | cut -d'=' -f2- | tr -d '"' | tr -d "'" | xargs)"

if [ -z "$SUPA_URL" ]; then
  echo "ERROR: NEXT_PUBLIC_SUPABASE_URL not found in $LOCAL_ENV"
  exit 1
fi
if [ -z "$SUPA_KEY" ]; then
  echo "ERROR: SUPABASE_SERVICE_ROLE_KEY not found in $LOCAL_ENV"
  exit 1
fi

echo "Found Supabase URL + service role key in local .env.local"
echo "Will write to $VPS_HOST:~/$VPS_PATH"
echo ""
echo "Paste the NEW @ZAOstockTeamBot token from @BotFather (after /revoke) and press Enter."
echo "Input is hidden. It will NOT appear on screen, in history, or in any log."
printf "ZAOSTOCK_BOT_TOKEN: "

# -s silent (no echo). stty keeps cursor behavior sane.
stty -echo
IFS= read -r BOT_TOKEN
stty echo
echo ""

if [ -z "$BOT_TOKEN" ]; then
  echo "ERROR: empty token, aborting"
  exit 1
fi

# Basic format check (looks like <digits>:<alphanum_with_dashes>)
if ! [[ "$BOT_TOKEN" =~ ^[0-9]+:[A-Za-z0-9_-]{20,}$ ]]; then
  echo "ERROR: token doesn't match Telegram format <digits>:<token>. Aborting."
  exit 1
fi

# Build the env file in-memory and stream it over SSH — never written to local disk.
ENV_CONTENT="ZAOSTOCK_BOT_TOKEN=${BOT_TOKEN}
SUPABASE_URL=${SUPA_URL}
SUPABASE_SERVICE_ROLE_KEY=${SUPA_KEY}
"

# Clear the shell variable ASAP after building the payload.
printf '%s' "$ENV_CONTENT" | ssh "$VPS_HOST" "cat > $VPS_PATH && chmod 600 $VPS_PATH"
unset BOT_TOKEN ENV_CONTENT

# Verify remote file exists and has 3 lines (no contents dumped).
REMOTE_LINES="$(ssh "$VPS_HOST" "wc -l < $VPS_PATH" | tr -d ' \n')"
if [ "$REMOTE_LINES" = "3" ]; then
  echo "OK: $VPS_HOST:~/$VPS_PATH written (3 lines, chmod 600)."
  echo ""
  echo "Next: ssh $VPS_HOST 'cd zaostock-bot && ./scripts/install-bot-service.sh'"
else
  echo "WARN: remote file has $REMOTE_LINES lines, expected 3. Inspect manually."
  exit 1
fi
