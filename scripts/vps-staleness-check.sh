#!/bin/bash
# vps-staleness-check.sh - does the VPS run main's copy of what it depends on? (ZAOOS #4063)
#
# WHY. On 2026-10-20 research doc 2692 found two stale surfaces on the VPS, both
# reporting success: cron ran a 2026-09-17 copy of zoe-autodeploy.sh (no non-bot
# skip, so ZOE restarted on 22 of 23 merges), and /home/zaal/zao-os, the clone ZOE
# reads the meetings index from, sat 355 commits behind main (a 22-day-old index).
# A restart looks like a healthy deploy and a stale clone answers every read, so
# nothing ever compared either one with origin/main. This does, and only reports:
# it never installs, pulls, resets or restarts anything.
#
# Checks:
#   SCRIPT  the installed autodeploy script against origin/main:scripts/zoe-autodeploy.sh
#           in the live clone (after a fetch)
#   CLONE   for each clone: commits HEAD is behind origin/main (after a fetch)
#
# Env:
#   ZOE_AUTODEPLOY_INSTALLED  installed script  (default ~/bin/zoe-autodeploy.sh)
#   ZOE_AUTODEPLOY_LIVE       live clone        (default /home/zaal/zao-bot-live)
#   VPS_STALE_CLONES          space-separated clones (default: the live clone and
#                             /home/zaal/zao-os)
#   VPS_STALE_MAX_BEHIND      commits behind before a clone is STALE (default 20;
#                             autodeploy runs every 10 minutes, so the live clone
#                             is briefly behind after every merge)
#
# Usage: vps-staleness-check.sh [--notify]
#   --notify  also post one zao-status line when anything is not OK
# Output: one line per check, "OK", "DRIFT", "STALE" or "UNKNOWN" first.
# Exit: 0 all OK, 1 something is DRIFT or STALE, 2 a check could not run (UNKNOWN).
# Suggested cron (Zaal's to install): 17 * * * * ~/bin/vps-staleness-check.sh --notify
set -uo pipefail

INSTALLED="${ZOE_AUTODEPLOY_INSTALLED:-$HOME/bin/zoe-autodeploy.sh}"
LIVE="${ZOE_AUTODEPLOY_LIVE:-/home/zaal/zao-bot-live}"
CLONES="${VPS_STALE_CLONES:-$LIVE /home/zaal/zao-os}"
MAX="${VPS_STALE_MAX_BEHIND:-20}"
case "$MAX" in ''|*[!0-9]*) echo "UNKNOWN VPS_STALE_MAX_BEHIND='$MAX' is not a whole number"; exit 2 ;; esac

bad=0; unknown=0; lines=()
report() { lines+=("$1"); echo "$1"; }

# SCRIPT
if ! git -C "$LIVE" fetch -q origin main 2>/dev/null; then
  report "UNKNOWN script: could not fetch origin main in $LIVE"; unknown=1
elif ! want="$(git -C "$LIVE" show origin/main:scripts/zoe-autodeploy.sh 2>/dev/null)" || [ -z "$want" ]; then
  report "UNKNOWN script: origin/main has no scripts/zoe-autodeploy.sh in $LIVE"; unknown=1
elif [ ! -f "$INSTALLED" ]; then
  report "UNKNOWN script: no installed copy at $INSTALLED"; unknown=1
elif [ "$want" = "$(cat "$INSTALLED")" ]; then
  report "OK script: $INSTALLED matches origin/main $(git -C "$LIVE" rev-parse --short origin/main)"
else
  report "DRIFT script: $INSTALLED differs from origin/main:scripts/zoe-autodeploy.sh ($(git -C "$LIVE" rev-parse --short origin/main))"; bad=1
fi

# CLONES
for c in $CLONES; do
  if ! git -C "$c" rev-parse --git-dir >/dev/null 2>&1; then
    report "UNKNOWN clone: $c is not a git repository"; unknown=1; continue
  fi
  if [ "$c" != "$LIVE" ] && ! git -C "$c" fetch -q origin main 2>/dev/null; then
    report "UNKNOWN clone: could not fetch origin main in $c"; unknown=1; continue
  fi
  if ! behind="$(git -C "$c" rev-list --count HEAD..origin/main 2>/dev/null)"; then
    report "UNKNOWN clone: could not count $c against origin/main"; unknown=1; continue
  fi
  if [ "$behind" -gt "$MAX" ]; then
    report "STALE clone: $c is $behind commits behind origin/main (limit $MAX), HEAD $(git -C "$c" log -1 --format='%h %cs' HEAD)"; bad=1
  else
    report "OK clone: $c is $behind behind origin/main"
  fi
done

if [ "${1:-}" = --notify ] && { [ "$bad" = 1 ] || [ "$unknown" = 1 ]; }; then
  ~/bin/zao-status "vps-staleness: $(printf '%s\n' "${lines[@]}" | grep -v '^OK' | head -3 | paste -sd ';' -)" 2>/dev/null
fi
[ "$unknown" = 1 ] && exit 2
[ "$bad" = 1 ] && exit 1
exit 0
