#!/usr/bin/env bash
# loop-recall.sh - the READ half of Bonfire-always.
#
#   loop-recall.sh "<query>" [limit]
#
# Query the ZABAL Bonfire knowledge graph for prior related episodes at the START
# of a new-area work item, so a loop does not re-derive problems past sessions
# already solved. Pairs with loop-episode.sh (the write half). Mirrors ZOE's
# read path in bot/src/zoe/recall.ts: POST /delve {bonfire_id, query} -> ranked
# episodes with content.
#
# Best-effort by design: on any missing key / error / empty result it prints a
# short note and exits 0, so a loop can call it unconditionally at item start
# without ever breaking on it. Cost-aware: call it once when picking up an item
# in an area new to this session - NOT every turn.
set -uo pipefail

QUERY="${1:?usage: loop-recall.sh <query> [limit]}"
LIMIT="${2:-5}"

BONFIRE_ENV="${BONFIRE_ENV:-$HOME/.zao/bonfire.env}"
if [ -z "${BONFIRE_API_KEY:-}" ] && [ -f "$BONFIRE_ENV" ]; then set -a; . "$BONFIRE_ENV"; set +a; fi
API_URL="${BONFIRE_API_URL:-https://tnt-v2.api.bonfires.ai}"

if [ -z "${BONFIRE_API_KEY:-}" ] || [ -z "${BONFIRE_ID:-}" ]; then
  echo "loop-recall: BONFIRE_API_KEY/BONFIRE_ID not set - skipping (no recall)" >&2
  exit 0
fi

QUERY="$QUERY" LIMIT="$LIMIT" API_URL="$API_URL" API_KEY="$BONFIRE_API_KEY" BID="$BONFIRE_ID" \
python3 - <<'PY'
import os, json, urllib.request, sys
try:
    body = json.dumps({"bonfire_id": os.environ["BID"], "query": os.environ["QUERY"]}).encode()
    req = urllib.request.Request(
        os.environ["API_URL"].rstrip("/") + "/delve", data=body,
        headers={"Authorization": "Bearer " + os.environ["API_KEY"], "Content-Type": "application/json"},
        method="POST")
    data = json.load(urllib.request.urlopen(req, timeout=25))
    eps = (data.get("episodes") or [])[: int(os.environ["LIMIT"])]
    if not eps:
        print("(no prior episodes for that query)")
        raise SystemExit(0)
    print(f"Bonfire recall - {len(eps)} prior episode(s) for: {os.environ['QUERY'][:70]}")
    for e in eps:
        txt = str(e.get("summary") or e.get("content") or e.get("name") or "")
        src = e.get("source_description") or e.get("source_tag")
        print(f"- {txt[:400]}" + (f"  [src: {src}]" if src else ""))
except SystemExit:
    raise
except Exception as ex:
    print(f"(recall unavailable: {ex})", file=sys.stderr)
PY
exit 0
