#!/bin/bash
# loops-keepalive-failover.sh - fleet supervisor with multi-provider failover
# Approves/relaunches/prod every loop with provider failover: claude -> codex -> cheap-loop
# Publishes fleet status to Supabase.
# This is a drop-in replacement for loops-keepalive.sh - same trust-prompt handling,
# same fleet status reporting, but uses loop-agent.sh for the fallover ladder.

SESSIONS="zoe:/home/zaal/zao-os:loop-directive.md ww:/home/zaal/wwtracker:ww-directive.md coc:/home/zaal/coc:coc-directive.md human:/home/zaal/zao-human:human-directive.md zol:/home/zaal/zol-upgrade:zol-directive.md zaostock:/home/zaal/zao-festivals:zaostock-directive.md fractal:/home/zaal/zao-fractal:fractal-directive.md sparkz:/home/zaal/sparkz:sparkz-directive.md warpee:/home/zaal/warpee:warpee-directive.md research:/home/zaal/zao-os:research-directive.md artizen:/home/zaal/ZAOartizen:artizen-directive.md zabal:/home/zaal/zabalgames:zabal-directive.md poidh:/home/zaal/poidh:poidh-directive.md wwafrica:/home/zaal/wwafrica:wwafrica-directive.md zoostr:/home/zaal/zoostr:zoostr-directive.md bcz:/home/zaal/bcz:bcz-directive.md maine:/home/zaal/maine:maine-directive.md"


# ----------------------------------------------------------------------------
# A PANE CAPTURE IS A SAMPLE, NOT A VERDICT (2026-08-25)
#
# Every branch below acted on ONE `tmux capture-pane`. Claude redraws its input
# box constantly, and a redraw caught mid-frame can look like a bare shell
# prompt - on which this relaunched the loop, putting a SECOND agent into a
# session that already had a live one. Same shape as the gstack browse bug:
# one short probe measured a MOMENT and the supervisor treated it as death.
#
# xyOps (BSD-3, pixlcore/xyops) solves it the same way and ships it as the
# default - an alert requires N consecutive true evaluations before firing and
# N consecutive false ones before clearing. Doc 2414. So: re-read the pane and
# require the SAME reading every time before doing anything destructive.
#
# Cost is bounded and only paid on a session that already looks dead: 2 extra
# samples x 2s. The cron runs every 3 minutes.
# ----------------------------------------------------------------------------
CONFIRM_SAMPLES="${KEEPALIVE_CONFIRM_SAMPLES:-3}"
CONFIRM_GAP="${KEEPALIVE_CONFIRM_GAP:-2}"

# confirm_pane <session> <tail-lines> <grep-args...> - true only if the pattern
# still matches on every remaining sample. The caller has already matched once.
#
# The tail depth is a parameter and not a constant because it must match the
# depth the caller used. Re-reading 25 lines to confirm a match the caller found
# in the last 3 is a LOOSER test than the one that fired, so it would confirm
# things that were never true - a check that agrees with itself by construction.
confirm_pane() {
  local s="$1" depth="$2"; shift 2
  local i
  for (( i = 2; i <= CONFIRM_SAMPLES; i++ )); do
    sleep "$CONFIRM_GAP"
    tmux capture-pane -t "$s" -p 2>/dev/null | tail -"$depth" | grep "$@" || return 1
  done
  return 0
}

# Probe provider health once at the start
/home/zaal/bin/provider-health.sh >/dev/null 2>&1 || true

# Loop through each session
for spec in $SESSIONS; do
  S="${spec%%:*}"; rest="${spec#*:}"; DIR="${rest%%:*}"; DRV="${rest##*:}"
  grep -qxF "$S" "$HOME/.zao/idled-loops" 2>/dev/null && { echo "[keepalive] $S idled - skip"; continue; }

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
    # Spawning a process is the destructive act here - confirm before it.
    if ! confirm_pane "$S" 3 -qE '^\S*\$ ?$|zaal@'; then
      echo "[keepalive] $S: shell prompt did not hold across $CONFIRM_SAMPLES samples - not relaunching"
      continue
    fi
    tmux send-keys -t "$S" "/home/zaal/bin/loop-agent.sh $S $DIR $DIR/$DRV"; sleep 1; tmux send-keys -t "$S" Enter; continue
  fi

  # If claude is already running (esc to interrupt prompt), send the directive
  if ! echo "$P" | grep -q "esc to interrupt"; then
    # Absence of "esc to interrupt" for ONE frame is not an idle session, and
    # the else-branch below types /exit, which kills a running claude.
    if confirm_pane "$S" 25 -q "esc to interrupt"; then
      echo "[keepalive] $S: busy after all - leaving it alone"
      continue
    fi
    # Only feed an existing claude session if claude is actually healthy. When
    # capped (weekly/usage limit) feeding it yields "no draft from model"
    # forever - so exit it and let the next tick relaunch via loop-agent.sh on
    # the failover provider (codex -> openrouter -> ollama).
    CUR_PROVIDER="$(grep -E '^BEST_PROVIDER=' "${HOME}/.zao/provider-state" 2>/dev/null | cut -d= -f2 | tr -d '[:space:]"')"
    if [ "${CUR_PROVIDER:-claude}" = "claude" ]; then
      tmux send-keys -t "$S" "Read ~/$DRV and continue working it top to bottom. PR-only, self-sustaining."; sleep 1; tmux send-keys -t "$S" Enter
    else
      echo "[keepalive] $S: claude capped (provider=$CUR_PROVIDER) - exiting dead session for ladder relaunch"
      tmux send-keys -t "$S" "/exit"; sleep 1; tmux send-keys -t "$S" Enter
    fi
  fi
done

# ============================================================================
# Fleet status reporting (unchanged)
# ============================================================================

# fleet status -> JSON
FS=/tmp/fleet-status.json

# The reported list is DERIVED from the supervised list, never retyped.
# Measured 2026-08-25: SESSIONS supervised 17 loops and this reporter named 5,
# so twelve - zaostock, fractal, sparkz, warpee, research, artizen, zabal,
# poidh, wwafrica, zoostr, bcz, maine - were kept alive by this script and
# appeared in fleet_status NEVER. Not stale rows: no rows. Any dashboard
# reading fleet_status was correct about five loops and blind to the rest,
# with nothing anywhere saying so.
FS_SESSIONS="$(for spec in $SESSIONS; do echo "${spec%%:*}"; done | tr '\n' ' ')"
export FS_SESSIONS

python3 - <<'PYEOF'
import json, os, subprocess, datetime
sessions = os.environ.get("FS_SESSIONS", "").split()
if not sessions:
    raise SystemExit("fleet status: FS_SESSIONS empty - refusing to write a fleet of nothing")
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
  # Assert the write landed - a job's failure needs somewhere to GO, which is
  # the third pattern taken from xyOps (doc 2414): failure is a lifecycle stage,
  # not a discarded exit code. This block was written on the VPS 2026-08-22 and
  # lived only in a local git repo with no remote; it is in this repo now so a
  # deploy from source cannot silently revert it.
  #
  # `curl -s ... >/dev/null` cannot tell a 401 from a
  # 200, so a rejected POST used to leave a stale row that the dashboard read
  # as current state - measured 2026-08-22, 6 rows stale 32-36 days with 3
  # still claiming "working". Log-only on failure, deliberately no Telegram
  # ping: see loop-watchdog, where a self-healing alert sent 429 unread
  # messages with 0 actionable.
  _fs_code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "${URL%/}/rest/v1/fleet_status?on_conflict=session" \
    -H "apikey: $KEY" -H "Authorization: Bearer $KEY" \
    -H "Content-Type: application/json" -H "Prefer: resolution=merge-duplicates" \
    -d "$BODY" 2>/dev/null)
  case "$_fs_code" in
    2*) : ;;
    *) echo "$(date '+%Y-%m-%d %H:%M') fleet_status POST failed http=${_fs_code:-000}" \
         >> "$HOME/.zao/fleet-status-write.log" ;;
  esac
fi

exit 0
