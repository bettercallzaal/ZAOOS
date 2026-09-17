#!/usr/bin/env bash
# Checks the claude CLI auth on the fleet box and Telegram-alerts Zaal.
#
# 2026-07-23 fix: the old version treated ANY non-zero exit as "auth is DOWN"
# and told Zaal to re-login. That produced false alarms - a usage-cap hit, a
# 429, a network blip, or a timeout all got reported as an auth failure, and
# the suggested fix (/login) was wrong for every one of them.
#
# Now it CLASSIFIES the failure:
#   auth      -> real auth problem. Alert + tell Zaal to /login (actionable).
#   cap       -> usage/rate limit. Informational only; it self-recovers.
#   transient -> anything else. Requires TWO consecutive failures before
#                alerting, so a single blip stays silent.
#
# 2026-09-17: THIS SCRIPT IS THE ONLY WRITER OF fleet-claude-auth.state.
# ZOE's claude-health.ts also wrote it from 2026-09-16 (#3531), and overnight
# the file read `down` at 02:12 UTC (this script) and `cap` at 03:07 (ZOE's
# hourly probe). A foreign `down` is worse than a flap: this script reads it
# back as prev=down and skips the auth alert. So the state is written by
# write_state only - a temp file made 0444 and renamed into place. A rename
# replaces the file whatever its mode; a plain `> file` or fs.writeFile from
# any other process now fails with EACCES instead of silently winning.
# Readers (fleet-heartbeat.sh, zaal-dotfiles/vps) only ever cat it.
#
# Same day: "You've hit your weekly limit" matched none of the cap patterns,
# fell to transient, and after two checks wrote `down` - the misclassification
# #3531 was trying to paper over from the other side.
set -uo pipefail
export PATH="${CLAUDE_AUTH_CHECK_PATH:-/home/zaal/node22/bin:/home/zaal/bin:/usr/local/bin:/usr/bin:/bin}"
STATE="${FLEET_CLAUDE_AUTH_STATE:-$HOME/.config/fleet-claude-auth.state}"
FAILS="${FLEET_CLAUDE_AUTH_FAILS:-$HOME/.config/fleet-claude-auth.fails}"
ENVF="${FLEET_CLAUDE_AUTH_ENV:-$HOME/zao-os/bot/.env}"

# The single write path for STATE. Owner-only by file mode, atomic by rename.
write_state(){
  local tmp
  tmp=$(mktemp "${STATE}.XXXXXX") || { echo "claude-auth-check: cannot write state" >&2; return 1; }
  printf '%s\n' "$1" > "$tmp" && chmod 0444 "$tmp" && mv -f "$tmp" "$STATE"
}
TOKEN=$(grep -E '^ZOE_BOT_TOKEN=' "$ENVF" 2>/dev/null | cut -d= -f2-)
CHAT=$(grep -E '^ZAAL_TELEGRAM_ID=' "$ENVF" 2>/dev/null | cut -d= -f2-)
alert(){ [ -n "${TOKEN:-}" ] && [ -n "${CHAT:-}" ] && curl -s -o /dev/null --max-time 10 \
  "https://api.telegram.org/bot${TOKEN}/sendMessage" \
  --data-urlencode "chat_id=${CHAT}" --data-urlencode "text=$1" || true; }

if [ "${1:-}" = "--test" ]; then alert "ZOE auth-monitor installed and working. You will get a ping here if claude auth ever dies on the fleet box."; echo "test alert sent"; exit 0; fi

out=$(timeout 45 claude -p "reply OK" </dev/null 2>&1); rc=$?
prev=$(cat "$STATE" 2>/dev/null || echo ok)
fails=$(cat "$FAILS" 2>/dev/null || echo 0)

# Classify the outcome before deciding what (if anything) to say.
kind=ok
if [ $rc -ne 0 ] || echo "$out" | grep -qiE '401|invalid auth|unauthor|invalid api key|please run /login|oauth'; then
  if echo "$out" | grep -qiE '401|invalid auth|unauthor|invalid api key|please run /login|oauth token'; then
    kind=auth
  elif echo "$out" | grep -qiE '(usage|weekly|daily|monthly|rate) limit|hit your .*limit|429|quota|credit balance|too many requests'; then
    kind=cap
  else
    kind=transient
  fi
fi

case "$kind" in
  ok)
    [ "$prev" = "down" ] && alert "RECOVERED: claude auth is working again on the fleet box. Bots are back."
    write_state ok; echo 0 > "$FAILS"
    ;;
  auth)
    # The only case where /login is the right fix.
    [ "$prev" != "down" ] && alert "ALERT: claude AUTH is down on the fleet box (zaal@31.97.148.88). ZOE + ZAOcoworkingBot + Hermes will fail. Fix: ssh in, run 'claude', type /login. (saved guide: claude-relogin-fleet-vps)"
    write_state down; echo 0 > "$FAILS"
    ;;
  cap)
    # Self-recovering. Say it once, and do NOT tell him to re-login.
    [ "$prev" != "cap" ] && alert "FYI: claude on the fleet box is CAP/RATE-LIMITED (not an auth problem - no login needed). Claude-backed jobs will defer until it clears; the cheap-AI ladder still runs."
    write_state cap; echo 0 > "$FAILS"
    ;;
  transient)
    # One blip is noise. Only speak up if it fails twice in a row.
    fails=$((fails + 1)); echo "$fails" > "$FAILS"
    if [ "$fails" -ge 2 ] && [ "$prev" != "down" ]; then
      alert "ALERT: claude on the fleet box failed 2 checks in a row (not a recognized auth or cap error). Output: $(echo "$out" | tail -c 200)"
      write_state down
    fi
    ;;
esac
