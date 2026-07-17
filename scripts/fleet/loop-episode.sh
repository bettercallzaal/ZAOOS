#!/usr/bin/env bash
# loop-episode.sh - one-command Bonfire episode push for the tmux build loops.
#
#   loop-episode.sh "<name>" "<body>" [source_tag]
#
# name  : "loop:<session>:<slug>"  (e.g. loop:2026-07-17-builder:fix-deadline-parser)
# body  : 2-4 sentences - what you did, the key decision/lesson, the PR/doc link
# tag   : source_tag, default "loop"
#
# Wraps .claude/skills/meeting/scripts/bonfire-episode.sh (which owns the key
# handling + best-effort semantics). The JSON is built by python from env vars,
# never by shell string-interpolation, so a body with quotes/backticks/newlines
# is safe (agent-loops rules 18/23). Always exits 0 - a graph failure must never
# break a loop's work (see loop-memory audit, research/agents/1170).
set -uo pipefail

NAME="${1:?usage: loop-episode.sh <name> <body> [source_tag]}"
BODY="${2:?usage: loop-episode.sh <name> <body> [source_tag]}"
TAG="${3:-loop}"

POSTER="$HOME/zao-os/.claude/skills/meeting/scripts/bonfire-episode.sh"
if [ ! -x "$POSTER" ]; then
  POSTER="$(cd "$(dirname "$0")/../.." && pwd)/.claude/skills/meeting/scripts/bonfire-episode.sh"
fi
if [ ! -x "$POSTER" ]; then
  echo "loop-episode: bonfire poster not found; skipping (episode NOT posted)" >&2
  exit 0
fi

TMP="$(mktemp "${TMPDIR:-/tmp}/loop-episode.XXXXXX.json")"
trap 'rm -f "$TMP"' EXIT
NAME="$NAME" BODY="$BODY" TAG="$TAG" python3 - "$TMP" <<'PY'
import json, os, sys
json.dump({"episodes": [{
    "name": os.environ["NAME"],
    "body": os.environ["BODY"],
    "source_tag": os.environ["TAG"],
}]}, open(sys.argv[1], "w"))
PY

bash "$POSTER" "$TMP" 2>&1 | tail -2
exit 0
