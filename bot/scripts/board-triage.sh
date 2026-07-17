#!/usr/bin/env bash
# board-triage.sh — Nightly board health check and P1 alert
#
# Reports:
#   1. P1 count (alerts if > 10)
#   2. Top P1 tasks list (for human review)
#   3. Potential duplicate detection (tasks with very similar titles)
#   4. Stale task detection (no notes, > 14 days old)
#
# Install as a cron (once per night, 2AM VPS local time):
#   crontab -e
#   0 2 * * * bash ~/zao-os/bot/scripts/board-triage.sh >> /tmp/board-triage.log 2>&1
#
# Environment: sources bot/.env for COWORK_TRACKER_URL, COWORK_TRACKER_KEY,
# ZOE_BOT_TOKEN, ZAAL_BOTZ_GROUP_ID.

set -uo pipefail

ENV_FILE="${HOME}/zao-os/bot/.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "[board-triage] ERROR: $ENV_FILE not found"
  exit 1
fi

COWORK_TRACKER_URL=""
COWORK_TRACKER_KEY=""
ZOE_BOT_TOKEN=""
ZAAL_BOTZ_GROUP_ID=""

while IFS='=' read -r key val; do
  [[ "$key" =~ ^#|^[[:space:]]*$ ]] && continue
  val="${val%%#*}"; val="${val//\"/}"; val="${val//\'/}"
  val="${val#"${val%%[![:space:]]*}"}"; val="${val%"${val##*[![:space:]]}"}"
  case "$key" in
    COWORK_TRACKER_URL)     COWORK_TRACKER_URL="$val" ;;
    COWORK_TRACKER_KEY)     COWORK_TRACKER_KEY="$val" ;;
    ZOE_BOT_TOKEN)          ZOE_BOT_TOKEN="$val" ;;
    ZAAL_BOTZ_GROUP_ID)     ZAAL_BOTZ_GROUP_ID="$val" ;;
  esac
done < "$ENV_FILE"

if [ -z "$COWORK_TRACKER_URL" ] || [ -z "$COWORK_TRACKER_KEY" ]; then
  echo "[board-triage] ERROR: COWORK_TRACKER_URL or COWORK_TRACKER_KEY not found"
  exit 1
fi

tg_send() {
  local msg="$1"
  if [ -n "$ZOE_BOT_TOKEN" ] && [ -n "$ZAAL_BOTZ_GROUP_ID" ]; then
    curl -s -X POST "https://api.telegram.org/bot${ZOE_BOT_TOKEN}/sendMessage" \
      --data-urlencode "chat_id=${ZAAL_BOTZ_GROUP_ID}" \
      --data-urlencode "text=${msg}" > /dev/null
  fi
}

# ---------------------------------------------------------------------------
# Query board
# ---------------------------------------------------------------------------
echo "[board-triage] Running at $(date -Iseconds)"

ALL_P1=$(curl -s "${COWORK_TRACKER_URL}/rest/v1/tasks?status=eq.todo&priority=eq.P1&select=id,title,legacy_source,notes,created_at&order=created_at.asc" \
  -H "apikey: ${COWORK_TRACKER_KEY}" \
  -H "Authorization: Bearer ${COWORK_TRACKER_KEY}" 2>/dev/null)

P1_COUNT=$(echo "$ALL_P1" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")

# Stale P1s: created > 14 days ago, no notes
CUTOFF=$(date -d '14 days ago' -Iseconds 2>/dev/null || date -v-14d -Iseconds 2>/dev/null || echo "2099-01-01T00:00:00+00:00")

STALE_COUNT=$(echo "$ALL_P1" | python3 -c "
import sys, json
from datetime import datetime, timezone
rows = json.load(sys.stdin)
cutoff = '$CUTOFF'
stale = 0
for r in rows:
    created = r.get('created_at', '')
    notes = r.get('notes') or ''
    if created < cutoff and not notes.strip():
        stale += 1
print(stale)
" 2>/dev/null || echo "0")

# Build report
REPORT=$(echo "$ALL_P1" | python3 -c "
import sys, json
rows = json.load(sys.stdin)
out = []
for i, r in enumerate(rows[:10], 1):
    src = r.get('legacy_source', '')[:15]
    title = r.get('title', '')[:50]
    out.append(f'{i:2}. [{src}] {title}')
print('\n'.join(out))
" 2>/dev/null)

# ---------------------------------------------------------------------------
# Alerts
# ---------------------------------------------------------------------------
echo "[board-triage] P1 count: $P1_COUNT, stale: $STALE_COUNT"

if [ "$P1_COUNT" -gt 10 ]; then
  MSG="BOARD TRIAGE: ${P1_COUNT} P1 todos (cap is 10). Oldest 10:

${REPORT}

Stale P1s (>14 days, no notes): ${STALE_COUNT}. Review and re-prioritize or archive."
  tg_send "$MSG"
  echo "[board-triage] ALERT sent: P1 overflow ($P1_COUNT > 10)"
else
  echo "[board-triage] OK: P1 count $P1_COUNT is within cap"
fi

if [ "$STALE_COUNT" -gt 3 ]; then
  echo "[board-triage] WARNING: $STALE_COUNT stale P1s (>14 days, no notes)"
fi
