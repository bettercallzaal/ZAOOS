#!/bin/bash
# Telegram nudge for the portal test checklist. Runs via cron every 15 min.
# Reads secrets from ~/.env.portal (gitignored, 600 perms).
# Required env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
set -eu

ENV_FILE="${HOME}/.env.portal"
if [ -f "$ENV_FILE" ]; then
  set -a; . "$ENV_FILE"; set +a
fi

STATE="${HOME}/test-checklist/state.json"
[ -f "$STATE" ] || exit 0

if [ -z "${TELEGRAM_BOT_TOKEN:-}" ] || [ -z "${TELEGRAM_CHAT_ID:-}" ]; then
  echo "$(date -Iseconds) missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in $ENV_FILE" >> "${HOME}/test-checklist/ping.log"
  exit 1
fi

MSG=$(python3 - << 'PYEOF'
import json, os
state_path = os.path.expanduser("~/test-checklist/state.json")
with open(state_path) as f:
    s = json.load(f)
pending = [t for t in s["tests"] if not t["done"]]
done = [t for t in s["tests"] if t["done"]]
if not pending:
    print("")
else:
    n = pending[0]
    total = len(s["tests"])
    completed = len(done)
    nid = n["id"]
    name = n["name"]
    desc = n["description"]
    out = "[TEST " + str(nid) + "/" + str(total) + "] " + name + "\n\n"
    out += desc + "\n\n"
    out += "Done: " + str(completed) + "/" + str(total) + "\n"
    out += "Mark done: https://portal.zaoos.com/test-done?id=" + str(nid) + "\n"
    out += "Checklist: https://portal.zaoos.com/test-checklist"
    print(out)
PYEOF
)

[ -z "$MSG" ] && exit 0

ESCAPED=$(python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))" <<< "$MSG")

curl -sS -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d "{\"chat_id\":\"${TELEGRAM_CHAT_ID}\",\"text\":${ESCAPED}}" > "${HOME}/test-checklist/last-response.json"

echo "$(date -Iseconds) sent nudge for test $(echo "$MSG" | head -1)" >> "${HOME}/test-checklist/ping.log"
