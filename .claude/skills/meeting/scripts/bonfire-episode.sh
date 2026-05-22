#!/usr/bin/env bash
# bonfire-episode.sh - POST meeting episodes to the ZABAL Bonfire knowledge graph.
# Usage: bonfire-episode.sh <episodes-json-path>
#
# Input JSON: {"episodes": [{"name": "...", "body": "...", "source_tag": "..."}]}
#
# Each episode is POSTed to /knowledge_graph/episode/create. Bonfires
# auto-extraction turns the natural-language body into KG nodes.
#
# Best-effort by design (mirrors bot/src/zoe/recall.ts): a Bonfire failure
# must NEVER abort the /meeting skill. Always exits 0. Prints per-episode
# ok/fail/skip to stderr; prints a one-line summary to stdout.
#
# Env (reused from the ZOE bridge - no new secrets):
#   BONFIRE_API_KEY  required - absent => skip all, exit 0
#   BONFIRE_ID       required - the ZABAL bonfire id
#   BONFIRE_API_URL  default https://tnt-v2.api.bonfires.ai
#
# Key source: if the vars are not already exported, this script sources a
# local env file - default ~/.zao/bonfire.env (override with BONFIRE_ENV).
# Put the key there once (chmod 600); it is never committed and never echoed.
#   BONFIRE_API_KEY=...
#   BONFIRE_ID=...

set -uo pipefail

INPUT="${1:?missing episodes-json path}"

# Load the key from a local env file when it is not already in the environment.
BONFIRE_ENV="${BONFIRE_ENV:-$HOME/.zao/bonfire.env}"
if [[ -z "${BONFIRE_API_KEY:-}" && -f "$BONFIRE_ENV" ]]; then
  set -a; . "$BONFIRE_ENV"; set +a
fi

API_URL="${BONFIRE_API_URL:-https://tnt-v2.api.bonfires.ai}"
API_KEY="${BONFIRE_API_KEY:-}"
BONFIRE_ID="${BONFIRE_ID:-}"

if [[ ! -f "$INPUT" ]]; then
  echo "[bonfire] ERROR: episodes file not found: $INPUT" >&2
  echo "Bonfire: skipped (no input file)"
  exit 0
fi

if [[ -z "$API_KEY" || -z "$BONFIRE_ID" ]]; then
  echo "[bonfire] BONFIRE_API_KEY / BONFIRE_ID not set - skipping graph write" >&2
  echo "Bonfire: skipped (no key)"
  exit 0
fi

if ! command -v jq >/dev/null; then
  echo "[bonfire] ERROR: jq required" >&2
  echo "Bonfire: skipped (no jq)"
  exit 0
fi

# Secret guard - 9 HIGH-severity patterns, mirrors recall.ts containsSecret().
SECRET_RE='sk-ant-[A-Za-z0-9_-]{20,}|sk-(proj-|cp-)?[A-Za-z0-9_-]{30,}|ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{60,}|-----BEGIN ([A-Z]+ )?PRIVATE KEY-----|0x[0-9a-fA-F]{64}|[0-9]{9,12}:[A-Za-z0-9_-]{30,}|xox[bpaors]-[A-Za-z0-9-]{10,}|AKIA[0-9A-Z]{16}'

N=$(jq '.episodes | length' "$INPUT" 2>/dev/null || echo 0)
if [[ "$N" -eq 0 ]]; then
  echo "[bonfire] no episodes to post" >&2
  echo "Bonfire: 0 episodes"
  exit 0
fi

posted=0
failed=0
skipped=0

for i in $(seq 0 $((N - 1))); do
  name=$(jq -r ".episodes[$i].name" "$INPUT")
  body=$(jq -r ".episodes[$i].body" "$INPUT")
  tag=$(jq -r ".episodes[$i].source_tag // \"meeting\"" "$INPUT")

  if [[ -z "$body" || "$body" == "null" ]]; then
    skipped=$((skipped + 1)); continue
  fi

  if echo "$body" | grep -qE "$SECRET_RE"; then
    echo "[bonfire] SKIP $name - body matched a secret pattern" >&2
    skipped=$((skipped + 1)); continue
  fi

  payload=$(jq -n \
    --arg bid "$BONFIRE_ID" --arg name "$name" --arg body "$body" \
    --arg tag "$tag" --arg ts "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)" \
    '{bonfire_id: $bid, name: $name, episode_body: $body, source: "text", source_description: $tag, reference_time: $ts}')

  code=$(curl -s -o /tmp/bonfire-resp.txt -w '%{http_code}' \
    --max-time 15 -X POST "$API_URL/knowledge_graph/episode/create" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "$payload" 2>/dev/null || echo "000")

  if [[ "$code" =~ ^2 ]]; then
    echo "[bonfire] OK $name" >&2
    posted=$((posted + 1))
  else
    echo "[bonfire] FAIL $name - HTTP $code $(head -c 120 /tmp/bonfire-resp.txt 2>/dev/null)" >&2
    failed=$((failed + 1))
  fi
done

rm -f /tmp/bonfire-resp.txt
echo "Bonfire: $posted posted, $failed failed, $skipped skipped (of $N)"
exit 0
