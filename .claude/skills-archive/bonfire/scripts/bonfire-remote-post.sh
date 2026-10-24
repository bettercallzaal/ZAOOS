#!/usr/bin/env bash
# bonfire-remote-post.sh - runs ON the VPS. Sources the bot env (which holds
# BONFIRE_API_KEY) and POSTs each episode in the given JSON to the Bonfire KG.
#
# Shipped to the VPS by bonfire-post.sh - not run directly on the mac.
# Usage: bonfire-remote-post.sh <episodes-json>
set -uo pipefail

INPUT="${1:?missing episodes json}"
ENV_FILE="${BONFIRE_ENV_FILE:-/root/cowork-zaodevz/agent/.env}"

if [[ ! -f "$INPUT" ]]; then
  echo "Bonfire: episodes file not found on VPS: $INPUT"
  exit 0
fi

# Source the env that holds the key. set -a so the vars export into this shell.
if [[ -f "$ENV_FILE" ]]; then
  set -a; . "$ENV_FILE"; set +a
fi

API_URL="${BONFIRE_API_URL:-https://tnt-v2.api.bonfires.ai}"
API_KEY="${BONFIRE_API_KEY:-}"
BID="${BONFIRE_ID:-}"

if [[ -z "$API_KEY" || -z "$BID" ]]; then
  echo "Bonfire: BONFIRE_API_KEY / BONFIRE_ID not found in $ENV_FILE - skipped"
  exit 0
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "Bonfire: jq not on VPS - skipped"
  exit 0
fi

N=$(jq '.episodes | length' "$INPUT" 2>/dev/null || echo 0)
if [[ "$N" -eq 0 ]]; then
  echo "Bonfire: 0 episodes"
  exit 0
fi

posted=0
failed=0

for i in $(seq 0 $((N - 1))); do
  name=$(jq -r ".episodes[$i].name" "$INPUT")
  body=$(jq -r ".episodes[$i].body" "$INPUT")
  tag=$(jq -r ".episodes[$i].source_tag // \"bonfire-skill\"" "$INPUT")

  if [[ -z "$body" || "$body" == "null" ]]; then
    echo "SKIP $name - empty body"
    continue
  fi

  payload=$(jq -n \
    --arg bid "$BID" --arg name "$name" --arg body "$body" \
    --arg tag "$tag" --arg ts "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)" \
    '{bonfire_id: $bid, name: $name, episode_body: $body, source: "text", source_description: $tag, reference_time: $ts}')

  code=$(curl -s -o /tmp/bonfire-resp.txt -w '%{http_code}' \
    --max-time 15 -X POST "$API_URL/knowledge_graph/episode/create" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "$payload" 2>/dev/null || echo "000")

  if [[ "$code" =~ ^2 ]]; then
    echo "OK   $name"
    posted=$((posted + 1))
  else
    echo "FAIL $name - HTTP $code $(head -c 120 /tmp/bonfire-resp.txt 2>/dev/null)"
    failed=$((failed + 1))
  fi
done

rm -f /tmp/bonfire-resp.txt
echo "Bonfire: $posted posted, $failed failed (of $N)"
exit 0
