#!/usr/bin/env bash
# loop-recall.sh - query the ZABAL Bonfire knowledge graph locally (no SSH).
#
# Unlike bonfire-recall.sh (which SSHes to the VPS), this script reads the
# API key from the local env file (~/.zao/zao.env) and queries Bonfire /delve
# directly. Designed for tmux loops to call at the start of a new work area
# so prior related episodes surface before re-deriving solved problems.
#
# Usage:   loop-recall "<query>"  [<limit=8>]
# Output:  formatted episode list (empty = no hits, exits 0)
# Errors:  best-effort - always exits 0 so a stall here never blocks the loop.
#
# Pattern: call ONCE when entering a new work area, not on every turn.
#   context=$(loop-recall "ZOL v2 DreamLoops build lessons" 5)
#   [ -n "$context" ] && echo "== Prior knowledge =="; echo "$context"
set -uo pipefail

QUERY="${1:-}"
LIMIT="${2:-8}"
ENV_FILE="${BONFIRE_ENV_FILE:-${HOME}/.zao/bonfire.env}"

# --- silently skip if no query ---
[[ -z "$QUERY" ]] && exit 0

# --- load env (best-effort) ---
[[ -f "$ENV_FILE" ]] && { set -a; . "$ENV_FILE"; set +a; } 2>/dev/null || true

API_URL="${BONFIRE_API_URL:-https://tnt-v2.api.bonfires.ai}"
API_KEY="${BONFIRE_API_KEY:-}"
BID="${BONFIRE_ID:-}"

# --- silently skip if unconfigured ---
[[ -z "$API_KEY" || -z "$BID" ]] && exit 0

# --- require jq ---
command -v jq >/dev/null 2>&1 || { echo "[loop-recall] jq not installed - skip" >&2; exit 0; }

# --- query /delve ---
PAYLOAD=$(jq -n --arg bid "$BID" --arg q "$QUERY" --argjson lim "$LIMIT" \
  '{bonfire_id: $bid, query: $q}')

RESPONSE=$(curl -s --max-time 20 -X POST "$API_URL/delve" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" 2>/dev/null) || RESPONSE=""

[[ -z "$RESPONSE" ]] && exit 0

# --- parse and format hits (summary → content → name fallback) ---
COUNT=$(echo "$RESPONSE" | jq -r '(.episodes // []) | length' 2>/dev/null || echo "0")
[[ "$COUNT" -eq 0 || "$COUNT" == "null" ]] && exit 0

echo "$RESPONSE" | jq -r --argjson lim "$LIMIT" '
  (.episodes // [])[:$lim] |
  .[] |
  (
    .summary // .content // .name // "—"
    | gsub("\n"; " ")
    | .[0:500]
  ) as $body |
  (if .source_description then " [\(.source_description)]" else "" end) as $src |
  "- \($body)\($src)"
' 2>/dev/null || true
