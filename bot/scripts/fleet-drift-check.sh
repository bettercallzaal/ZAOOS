#!/usr/bin/env bash
# fleet-drift-check.sh — VPS cron monitor for fleet health
#
# Checks:
#   1. ~/zao-os is on main (loop branch-switching could leave it on a test branch)
#   2. This script itself ran recently (heartbeat liveness check)
#
# Install as a cron (run as the VPS user, every 5 minutes):
#   crontab -e
#   */5 * * * * bash ~/zao-os/bot/scripts/fleet-drift-check.sh >> /tmp/fleet-drift-check.log 2>&1
#
# The heartbeat file is written each successful run; a stale heartbeat means
# the cron stopped firing (process kill, cron disabled, etc.).

set -uo pipefail

ZAOOS_DIR="${HOME}/zao-os"
ENV_FILE="${HOME}/zao-os/bot/.env"
HEARTBEAT_FILE="/tmp/fleet-drift-check.heartbeat"
# Alert if heartbeat is older than this many seconds (3 missed 5-min cycles)
STALE_THRESHOLD_SECONDS=1080

# ---------------------------------------------------------------------------
# Load env for Telegram credentials
# ---------------------------------------------------------------------------
if [ ! -f "$ENV_FILE" ]; then
  echo "[fleet-drift-check] ERROR: $ENV_FILE not found — cannot page ZAAL BOTZ"
  exit 1
fi

ZOE_BOT_TOKEN=""
ZAAL_BOTZ_GROUP_ID=""
while IFS='=' read -r key val; do
  [[ "$key" =~ ^#|^[[:space:]]*$ ]] && continue
  val="${val%%#*}"      # strip inline comments
  val="${val//\"/}"     # strip double quotes
  val="${val//\'/}"     # strip single quotes
  val="${val#"${val%%[![:space:]]*}"}"  # trim leading whitespace
  val="${val%"${val##*[![:space:]]}"}"  # trim trailing whitespace
  case "$key" in
    ZOE_BOT_TOKEN)        ZOE_BOT_TOKEN="$val" ;;
    ZAAL_BOTZ_GROUP_ID)   ZAAL_BOTZ_GROUP_ID="$val" ;;
  esac
done < "$ENV_FILE"

if [ -z "$ZOE_BOT_TOKEN" ] || [ -z "$ZAAL_BOTZ_GROUP_ID" ]; then
  echo "[fleet-drift-check] ERROR: ZOE_BOT_TOKEN or ZAAL_BOTZ_GROUP_ID not found in $ENV_FILE"
  exit 1
fi

tg_alert() {
  local msg="$1"
  echo "[fleet-drift-check] ALERT: $msg"
  curl -s -X POST "https://api.telegram.org/bot${ZOE_BOT_TOKEN}/sendMessage" \
    --data-urlencode "chat_id=${ZAAL_BOTZ_GROUP_ID}" \
    --data-urlencode "text=${msg}" > /dev/null
}

# ---------------------------------------------------------------------------
# Check 1: ~/zao-os is on main
# ---------------------------------------------------------------------------
if [ -d "$ZAOOS_DIR/.git" ]; then
  current_branch=$(git -C "$ZAOOS_DIR" branch --show-current 2>/dev/null || echo "UNKNOWN")
  if [ "$current_branch" != "main" ] && [ "$current_branch" != "" ]; then
    tg_alert "FLEET DRIFT: ~/zao-os is on branch '${current_branch}' (expected main). ZOE may be serving stale code. Check fleet loops."
  fi
fi

# ---------------------------------------------------------------------------
# Check 2: heartbeat liveness — is this cron still firing?
# ---------------------------------------------------------------------------
if [ -f "$HEARTBEAT_FILE" ]; then
  last_beat=$(stat -c %Y "$HEARTBEAT_FILE" 2>/dev/null || echo 0)
  now=$(date +%s)
  age=$(( now - last_beat ))
  if [ "$age" -gt "$STALE_THRESHOLD_SECONDS" ]; then
    tg_alert "FLEET DRIFT: fleet-drift-check heartbeat is ${age}s old (threshold ${STALE_THRESHOLD_SECONDS}s). Cron may have stopped on VPS."
  fi
fi

# Update heartbeat
date +%s > "$HEARTBEAT_FILE"
echo "[fleet-drift-check] OK $(date -Iseconds) branch=$(git -C "$ZAOOS_DIR" branch --show-current 2>/dev/null || echo unknown)"
