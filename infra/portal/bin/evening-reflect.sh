#!/bin/bash
set -eu
ENV_FILE="${HOME}/.env.portal"
[ -f "$ENV_FILE" ] && { set -a; . "$ENV_FILE"; set +a; }
[ -z "${TELEGRAM_BOT_TOKEN:-}" ] && exit 1

MSG=$(python3 - <<'PYEOF'
import json, os, datetime
HOME = os.path.expanduser("~")
try:
    s = json.load(open(HOME + "/portal-state/todos.json"))
except Exception:
    s = {"todos": []}
today = datetime.datetime.now().date()
done_today = []
for t in s["todos"]:
    if t.get("status") != "done":
        continue
    try:
        u = t.get("updated_at", "1970-01-01T00:00:00")
        if datetime.datetime.fromisoformat(u.replace("Z", "+00:00")).date() == today:
            done_today.append(t)
    except Exception:
        continue
open_p1 = [t for t in s["todos"] if t.get("status","open") not in ("done","archived") and t.get("priority") in ("P0","P1")]
out = ["Evening check - " + today.strftime("%a %b %d"), ""]
out.append("DONE TODAY ({})".format(len(done_today)))
for t in done_today[:8]:
    out.append("- " + t["text"][:80])
if not done_today:
    out.append("- (nothing marked /done today)")
out.append("")
out.append("TOP 3 FOR TOMORROW")
for t in open_p1[:3]:
    out.append("- " + t.get("priority","P2") + " " + t["text"][:80])
out.append("")
out.append("Reply /todo <intent> to set tomorrow's focus")
print("\n".join(out))
PYEOF
)
ESC=$(python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))" <<< "$MSG")
curl -sS -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d "{\"chat_id\":\"${TELEGRAM_CHAT_ID}\",\"text\":${ESC}}" > /dev/null
echo "$(date -Iseconds) evening-reflect sent" >> "${HOME}/test-checklist/cron.log"
