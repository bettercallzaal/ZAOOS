#!/bin/bash
# loops-keepalive-failover.sh - fleet supervisor with multi-provider failover
# Approves/relaunches/prod every loop with provider failover: claude -> codex -> cheap-loop
# Publishes fleet status to Supabase.
# This is a drop-in replacement for loops-keepalive.sh - same trust-prompt handling,
# same fleet status reporting, but uses loop-agent.sh for the fallover ladder.

SESSIONS="zoe:/home/zaal/zao-os:loop-directive.md ww:/home/zaal/wwtracker:ww-directive.md coc:/home/zaal/coc:coc-directive.md human:/home/zaal/zao-human:human-directive.md zol:/home/zaal/zol-upgrade:zol-directive.md zaostock:/home/zaal/zao-festivals:zaostock-directive.md fractal:/home/zaal/zao-fractal:fractal-directive.md sparkz:/home/zaal/sparkz:sparkz-directive.md warpee:/home/zaal/warpee:warpee-directive.md"

# Probe provider health once at the start
/home/zaal/bin/provider-health.sh >/dev/null 2>&1 || true

# Loop through each session
for spec in $SESSIONS; do
  S="${spec%%:*}"; rest="${spec#*:}"; DIR="${rest%%:*}"; DRV="${rest##*:}"

  # Ensure session exists
  tmux has-session -t "$S" 2>/dev/null || { tmux new-session -d -s "$S" -c "$DIR" "bash -l"; sleep 1; }

  # Capture current pane
  P=$(tmux capture-pane -t "$S" -p 2>/dev/null | tail -25)

  # Handle trust prompts
  if echo "$P" | grep -qE "Yes, I accept|Yes, I trust this folder"; then
    tmux send-keys -t "$S" "1"; sleep 1; tmux send-keys -t "$S" Enter; continue
  fi
  if echo "$P" | grep -qiE "Do you want to proceed|1\. Yes"; then
    tmux send-keys -t "$S" "1"; sleep 1; tmux send-keys -t "$S" Enter; continue
  fi
  if echo "$P" | grep -q "How is Claude doing"; then
    tmux send-keys -t "$S" Escape
  fi

  # If at shell prompt, launch the loop via the failover ladder
  if echo "$P" | tail -3 | grep -qE '^\S*\$ ?$|zaal@'; then
    tmux send-keys -t "$S" "/home/zaal/bin/loop-agent.sh $S $DIR $DIR/$DRV"; sleep 1; tmux send-keys -t "$S" Enter; continue
  fi

  # If claude is already running (esc to interrupt prompt), send the directive
  if ! echo "$P" | grep -q "esc to interrupt"; then
    tmux send-keys -t "$S" "Read ~/$DRV and continue working it top to bottom. PR-only, self-sustaining."; sleep 1; tmux send-keys -t "$S" Enter
  fi
done

# ============================================================================
# Fleet status reporting (unchanged)
# ============================================================================

# fleet status -> JSON
FS=/tmp/fleet-status.json
python3 - <<'PYEOF'
import json, subprocess, datetime
sessions = ["zoe","ww","coc","human","zol"]
loops = []
for s in sessions:
    has = subprocess.run(["tmux", "has-session", "-t", s], capture_output=True).returncode == 0
    if not has:
        loops.append({"session": s, "state": "dead", "last": ""})
        continue
    pane = subprocess.run(["tmux", "capture-pane", "-t", s, "-p"], capture_output=True, text=True).stdout
    state = "working" if "esc to interrupt" in pane else "idle"
    lines = [l for l in pane.splitlines() if l.strip() and not set(l.strip()) <= set("─ ")]
    last = (lines[-1][:110] if lines else "")
    loops.append({"session": s, "state": state, "last": last})
out = {"updated": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"), "loops": loops}
json.dump(out, open("/tmp/fleet-status.json", "w"))
PYEOF

# push to Supabase (cowork tracker creds from bot/.env)
URL=$(grep -m1 "^COWORK_TRACKER_URL=" ~/zao-os/bot/.env | cut -d= -f2- | tr -d '"')
KEY=$(grep -m1 "^COWORK_TRACKER_KEY=" ~/zao-os/bot/.env | cut -d= -f2- | tr -d '"')
if [ -n "$URL" ] && [ -n "$KEY" ]; then
  BODY=$(python3 -c "
import json
d=json.load(open('/tmp/fleet-status.json'))
print(json.dumps([{'session':l['session'],'state':l['state'],'last_line':l['last'],'updated_at':d['updated']} for l in d['loops']]))")
  curl -s -X POST "${URL%/}/rest/v1/fleet_status?on_conflict=session" \
    -H "apikey: $KEY" -H "Authorization: Bearer $KEY" \
    -H "Content-Type: application/json" -H "Prefer: resolution=merge-duplicates" \
    -d "$BODY" >/dev/null 2>&1
fi

exit 0
