#!/bin/bash
# report-to-telegram.sh — run the ecosystem monitor and post the digest to ZOE's
# Telegram (the "report back" channel). Intended to be triggered by the systemd
# timer in ./systemd (NOT auto-run; activation requires Zaal approval per CLAUDE.md
# "no new autonomous loop/process without a doc + approval").
#
# Reads the bot token + chat id from the environment (never hardcoded):
#   TELEGRAM_BOT_TOKEN  (or ZOE_BOT_TOKEN)   - the ZOE bot token
#   ZAAL_TELEGRAM_ID    (or TELEGRAM_CHAT_ID) - destination chat
# On the fleet box these come from bot/.env via the systemd EnvironmentFile.
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
TOKEN="${TELEGRAM_BOT_TOKEN:-${ZOE_BOT_TOKEN:-}}"
CHAT="${ZAAL_TELEGRAM_ID:-${TELEGRAM_CHAT_ID:-}}"
if [ -z "$TOKEN" ] || [ -z "$CHAT" ]; then
  echo "report-to-telegram: missing TELEGRAM_BOT_TOKEN / ZAAL_TELEGRAM_ID in env - not sending" >&2
  exit 1
fi

REPORT="$(mktemp)"
ECOSYSTEM_REPORT="$REPORT" bash "$HERE/monitor.sh" >/dev/null 2>&1 || true

# Post only the digest tail (summary + needs-attention + fleet) - not the full table.
DIGEST="$(awk '/## Live fleet/{p=1} p' "$REPORT" | head -60)"
[ -z "$DIGEST" ] && DIGEST="(ecosystem monitor produced no output)"
MSG="ZAO ecosystem digest"$'\n\n'"$DIGEST"

curl -s -X POST "https://api.telegram.org/bot${TOKEN}/sendMessage" \
  --data-urlencode "chat_id=${CHAT}" \
  --data-urlencode "text=${MSG}" >/dev/null \
  && echo "digest sent" || echo "send failed" >&2
rm -f "$REPORT"
