#!/usr/bin/env bash
# Checks the claude CLI auth on the fleet box and Telegram-alerts Zaal.
#
# CANONICAL SOURCE for the operator script installed at:
#   ~/fleet-heartbeat/claude-auth-check.sh
#
# 2026-09-17 SINGLE WRITER MIGRATION (card 9772):
# ZOE bot (recordClaudeOk / recordClaudeFailure in claude-health.ts) is the SOLE
# authoritative writer of ~/.config/fleet-claude-auth.state.
# This script is a READ-ONLY reporter: it inspects Claude CLI, reads $STATE to
# determine if alerting is needed, sends Telegram alerts, and NEVER writes to $STATE.
# This eliminates race conditions where the cron check overwrote the bot's 'cap' state with 'down'.
set -uo pipefail
export PATH=/home/zaal/node22/bin:/home/zaal/bin:/usr/local/bin:/usr/bin:/bin
STATE="${FLEET_CLAUDE_AUTH_STATE:-$HOME/.config/fleet-claude-auth.state}"
FAILS="${FLEET_CLAUDE_AUTH_FAILS:-$HOME/.config/fleet-claude-auth.fails}"
ENVF="${FLEET_ENV_FILE:-$HOME/zao-os/bot/.env}"
TOKEN=$(grep -E '^ZOE_BOT_TOKEN=' "$ENVF" 2>/dev/null | cut -d= -f2- || true)
CHAT=$(grep -E '^ZAAL_TELEGRAM_ID=' "$ENVF" 2>/dev/null | cut -d= -f2- || true)
alert(){ [ -n "${TOKEN:-}" ] && [ -n "${CHAT:-}" ] && curl -s -o /dev/null --max-time 10 \
  "https://api.telegram.org/bot${TOKEN}/sendMessage" \
  --data-urlencode "chat_id=${CHAT}" --data-urlencode "text=$1" || true; }

if [ "${1:-}" = "--test" ]; then alert "ZOE auth-monitor installed and working. You will get a ping here if claude auth ever dies on the fleet box."; echo "test alert sent"; exit 0; fi

CLAUDE_BIN="${CLAUDE_BIN:-claude}"
out=$(timeout 45 $CLAUDE_BIN -p "reply OK" </dev/null 2>&1); rc=$?
prev=$(cat "$STATE" 2>/dev/null || echo ok)
fails=$(cat "$FAILS" 2>/dev/null || echo 0)

# Classify the outcome before deciding what (if anything) to say.
kind=ok
if [ $rc -ne 0 ] || echo "$out" | grep -qiE '401|invalid auth|unauthor|invalid api key|please run /login|oauth'; then
  if echo "$out" | grep -qiE '401|invalid auth|unauthor|invalid api key|please run /login|oauth token'; then
    kind=auth
  elif echo "$out" | grep -qiE 'usage limit|rate limit|429|quota|credit balance|too many requests'; then
    kind=cap
  else
    kind=transient
  fi
fi

case "$kind" in
  ok)
    [ "$prev" = "down" ] && alert "RECOVERED: claude auth is working again on the fleet box. Bots are back."
    echo 0 > "$FAILS"
    ;;
  auth)
    # The only case where /login is the right fix.
    [ "$prev" != "down" ] && alert "ALERT: claude AUTH is down on the fleet box (zaal@31.97.148.88). ZOE + ZAOcoworkingBot + Hermes will fail. Fix: ssh in, run 'claude', type /login. (saved guide: claude-relogin-fleet-vps)"
    echo 0 > "$FAILS"
    ;;
  cap)
    # Self-recovering. Say it once, and do NOT tell him to re-login.
    [ "$prev" != "cap" ] && alert "FYI: claude on the fleet box is CAP/RATE-LIMITED (not an auth problem - no login needed). Claude-backed jobs will defer until it clears; the cheap-AI ladder still runs."
    echo 0 > "$FAILS"
    ;;
  transient)
    # One blip is noise. Only speak up if it fails twice in a row.
    fails=$((fails + 1)); echo "$fails" > "$FAILS"
    if [ "$fails" -ge 2 ] && [ "$prev" != "down" ]; then
      alert "ALERT: claude on the fleet box failed 2 checks in a row (not a recognized auth or cap error). Output: $(echo "$out" | tail -c 200)"
    fi
    ;;
esac
