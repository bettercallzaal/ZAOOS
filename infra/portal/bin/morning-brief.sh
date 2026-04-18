#!/bin/bash
set -eu
ENV_FILE="${HOME}/.env.portal"
[ -f "$ENV_FILE" ] && { set -a; . "$ENV_FILE"; set +a; }
[ -z "${TELEGRAM_BOT_TOKEN:-}" ] && exit 1

MSG=$(python3 - <<'PYEOF'
import json, os, subprocess, datetime
HOME = os.path.expanduser("~")
try:
    todos = json.load(open(HOME + "/portal-state/todos.json"))["todos"]
except Exception:
    todos = []
open_todos = [t for t in todos if t.get("status","open") not in ("done","archived")]
p0 = [t for t in open_todos if t.get("priority") == "P0"]
p1 = [t for t in open_todos if t.get("priority") == "P1"]

def sh(cmd, t=5):
    try:
        return subprocess.run(cmd, capture_output=True, text=True, timeout=t, shell=True).stdout.strip()
    except Exception:
        return ""

commits = sh("cd ~/code/ZAOOS 2>/dev/null && git log --oneline --since='24 hours ago' | head -6") or "(none)"
prs_raw = sh("/home/zaal/.local/bin/gh pr list --repo bettercallzaal/ZAOOS --state open --limit 5 --json number,title")
try:
    prs = "\n".join("#{} {}".format(p["number"], p["title"][:55]) for p in json.loads(prs_raw or "[]"))
except Exception:
    prs = ""
prs = prs or "(no open PRs)"

d = datetime.datetime.now().strftime("%a %b %d")
lines = ["Morning brief - " + d + " 5am", ""]
lines.append("TOP PRIORITIES ({} P0, {} P1)".format(len(p0), len(p1)))
for t in (p0 + p1)[:6]:
    lines.append("- " + t["priority"] + " " + t["text"][:80])
if not p0 and not p1:
    lines.append("- (no P0/P1 open, pick from /list)")
lines.append("")
lines.append("LAST 24H COMMITS")
lines.append(commits[:400])
lines.append("")
lines.append("OPEN PRS")
lines.append(prs[:300])
lines.append("")
lines.append("portal.zaoos.com/todos - brain dump")
print("\n".join(lines))
PYEOF
)

ESC=$(python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))" <<< "$MSG")
curl -sS -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d "{\"chat_id\":\"${TELEGRAM_CHAT_ID}\",\"text\":${ESC}}" > /dev/null
echo "$(date -Iseconds) morning-brief sent" >> "${HOME}/test-checklist/cron.log"
