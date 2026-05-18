#!/usr/bin/env bash
# Seed an event into ZOE's event-category drafter source file.
# Reads by bot/src/zoe/posts/sources.ts -> drafted by drafters.ts on the next
# event-category ping.
#
# Usage:
#   bash bot/scripts/seed-events.sh today "co-build 11:30am ET meet.baserooms.io/zaal"
#   bash bot/scripts/seed-events.sh tomorrow "Roddy parklet 5pm ET City Hall"
#   bash bot/scripts/seed-events.sh clear today       # truncate today.txt
#   bash bot/scripts/seed-events.sh show              # print today + tomorrow
#
# On VPS: appends to ~/.zao/zoe/events/{today,tomorrow}.txt
# Local:  same path (uses $HOME).
#
# Future: replace this with a script that pulls from Google Calendar MCP via
# the claude CLI - see Doc 655 Section D ("if 7 days, 0 events seeded").

set -euo pipefail

EVENTS_DIR="${HOME}/.zao/zoe/events"
mkdir -p "${EVENTS_DIR}"

usage() {
  echo "usage:" >&2
  echo "  $0 today|tomorrow \"<event text>\"" >&2
  echo "  $0 clear today|tomorrow" >&2
  echo "  $0 show" >&2
  exit 1
}

case "${1:-}" in
  today|tomorrow)
    target="${EVENTS_DIR}/$1.txt"
    text="${2:-}"
    if [ -z "${text}" ]; then usage; fi
    echo "${text}" >> "${target}"
    echo "appended to ${target}:"
    echo "  ${text}"
    ;;
  clear)
    target="${EVENTS_DIR}/${2:-today}.txt"
    : > "${target}"
    echo "cleared ${target}"
    ;;
  show)
    for f in today tomorrow; do
      echo "=== ${f}.txt ==="
      [ -f "${EVENTS_DIR}/${f}.txt" ] && cat "${EVENTS_DIR}/${f}.txt" || echo "(empty)"
    done
    ;;
  *)
    usage
    ;;
esac
