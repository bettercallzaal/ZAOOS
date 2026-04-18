#!/bin/bash
# Telegram nudge, de-duped + respects ~/.focus-until
set -eu
ENV_FILE="${HOME}/.env.portal"
[ -f "$ENV_FILE" ] && { set -a; . "$ENV_FILE"; set +a; }
STATE="${HOME}/test-checklist/state.json"
LAST="${HOME}/test-checklist/.last-sent"
FOCUS="${HOME}/.focus-until"
[ -f "$STATE" ] || exit 0
if [ -z "${TELEGRAM_BOT_TOKEN:-}" ] || [ -z "${TELEGRAM_CHAT_ID:-}" ]; then
  echo "$(date -Iseconds) missing env" >> "${HOME}/test-checklist/ping.log"; exit 1
fi

# Respect focus mode
if [ -f "$FOCUS" ]; then
  UNTIL=$(cat "$FOCUS")
  NOW_MS=$(( $(date +%s) * 1000 ))
  if [ "$NOW_MS" -lt "$UNTIL" ]; then
    echo "$(date -Iseconds) skip: focus mode active" >> "${HOME}/test-checklist/ping.log"
    exit 0
  fi
fi

NEXT_ID=$(python3 -c "
import json
s=json.load(open('${STATE}'))
pending=[t for t in s['tests'] if not t['done']]
print(pending[0]['id'] if pending else '')
")
[ -z "$NEXT_ID" ] && exit 0

if [ -f "$LAST" ]; then
  LAST_ID=$(cut -d":" -f1 < "$LAST")
  LAST_TS=$(cut -d":" -f2 < "$LAST")
  NOW=$(date +%s)
  AGE=$(( NOW - LAST_TS ))
  if [ "$LAST_ID" = "$NEXT_ID" ] && [ "$AGE" -lt 10800 ]; then
    echo "$(date -Iseconds) skip: test $NEXT_ID pinged ${AGE}s ago" >> "${HOME}/test-checklist/ping.log"
    exit 0
  fi
fi

MSG=$(python3 - <<'PYEOF'
import json, os
s=json.load(open(os.path.expanduser("~/test-checklist/state.json")))
pending=[t for t in s["tests"] if not t["done"]]
done=[t for t in s["tests"] if t["done"]]
if not pending: print(""); exit()
n=pending[0]
out="[TEST %d/%d] %s\n\n%s\n\nDone: %d/%d\nMark: https://portal.zaoos.com/test-done?id=%d\nAll: https://portal.zaoos.com/test-checklist" % (n["id"],len(s["tests"]),n["name"],n["description"],len(done),len(s["tests"]),n["id"])
print(out)
PYEOF
)
[ -z "$MSG" ] && exit 0
ESCAPED=$(python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))" <<< "$MSG")
curl -sS -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" -H "Content-Type: application/json" -d "{\"chat_id\":\"${TELEGRAM_CHAT_ID}\",\"text\":${ESCAPED}}" > "${HOME}/test-checklist/last-response.json"
echo "$NEXT_ID:$(date +%s)" > "$LAST"
echo "$(date -Iseconds) sent nudge for test $NEXT_ID" >> "${HOME}/test-checklist/ping.log"
