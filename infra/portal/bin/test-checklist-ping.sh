#!/bin/bash
STATE=$HOME/test-checklist/state.json
BOT_TOKEN="8278043919:AAEAZylvBAmkPIvfLgd9WImeqSUgrRaIIrw"
CHAT_ID="1447437687"

[ -f "$STATE" ] || exit 0

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

curl -sS -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d "{\"chat_id\":\"${CHAT_ID}\",\"text\":${ESCAPED}}" > $HOME/test-checklist/last-response.json

echo "$(date -Iseconds) sent nudge for test $(echo "$MSG" | head -1)" >> $HOME/test-checklist/ping.log
