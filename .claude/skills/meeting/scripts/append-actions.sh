#!/usr/bin/env bash
# append-actions.sh - Bulk-append meeting actions to cowork-zaodevz data/actions.json.
# Usage: append-actions.sh <extracted-json-path> [--commit-msg "msg"]
#
# Input JSON must match the /meeting output schema (see references/output-schema.md).
# We only consume the `.actions[]` array + `.meeting.title` + `.meeting.date` for the commit msg.
#
# Auth: gh auth token (verified push perm on songchaindao-dot/cowork-zaodevz 2026-05-18).
# Confirms commit hash + item ID range on success.

set -euo pipefail

INPUT="${1:?missing extracted-json path}"
COMMIT_MSG_FLAG=""
if [[ "${2:-}" == "--commit-msg" && -n "${3:-}" ]]; then
  COMMIT_MSG_FLAG="$3"
fi

if [[ ! -f "$INPUT" ]]; then
  echo "ERROR: extracted JSON not found: $INPUT" >&2
  exit 2
fi

if ! command -v jq >/dev/null; then echo "ERROR: jq required" >&2; exit 3; fi
if ! command -v gh >/dev/null; then echo "ERROR: gh CLI required" >&2; exit 3; fi

TOKEN=$(gh auth token 2>/dev/null) || { echo "ERROR: gh auth token failed - run gh auth login" >&2; exit 4; }

REPO="songchaindao-dot/cowork-zaodevz"
PATH_F="data/actions.json"
BRANCH="main"

# Preflight - verify push perm
PERM=$(gh api "repos/$REPO" --jq '.permissions.push' 2>/dev/null || echo "false")
if [[ "$PERM" != "true" ]]; then
  echo "ERROR: gh auth lacks push permission on $REPO" >&2
  exit 5
fi

WORK=$(mktemp -d)
trap "rm -rf $WORK" EXIT

# Fetch current actions.json + sha
echo "[append] fetching current actions.json" >&2
RESP=$(curl -fsSL -H "Authorization: Bearer $TOKEN" \
  "https://api.github.com/repos/$REPO/contents/$PATH_F?ref=$BRANCH")
SHA=$(echo "$RESP" | jq -r '.sha')
echo "$RESP" | jq -r '.content' | base64 -d > "$WORK/current.json"

# Sanity check
if ! jq -e '.items' "$WORK/current.json" >/dev/null; then
  echo "ERROR: fetched actions.json has no .items array" >&2
  exit 6
fi

NEXT_ID=$(jq '[.items[] | .id | tonumber] | max + 1' "$WORK/current.json")
NOW=$(date -u +%Y-%m-%dT%H:%M:%S.000Z)
TODAY=$(date -u +%Y-%m-%d)
TITLE=$(jq -r '.meeting.title // "meeting"' "$INPUT")
DATE=$(jq -r '.meeting.date // empty' "$INPUT")
[[ -z "$DATE" ]] && DATE="$TODAY"

# Build new items
N_NEW=$(jq '.actions | length' "$INPUT")
if [[ "$N_NEW" -eq 0 ]]; then
  echo "[append] no actions to append, skipping" >&2
  exit 0
fi

echo "[append] mapping $N_NEW extracted actions starting at id=$NEXT_ID" >&2

jq --slurpfile new "$INPUT" --argjson startId "$NEXT_ID" --arg now "$NOW" --arg today "$TODAY" '
  $new[0].actions | to_entries | map({
    id: (($startId + .key) | tostring),
    title: .value.title,
    createdBy: "Claude (/meeting skill)",
    owner: (.value.owner // "Both"),
    status: "TODO",
    category: (.value.category // "Other"),
    priority: (if (.value.due // "") == $today then "P1" else "P2" end),
    important: false,
    urgent: ((.value.due // "") == $today),
    phase: "Define",
    notes: "",
    due: (.value.due // ""),
    createdAt: $now,
    updatedAt: $now
  })
' "$INPUT" > "$WORK/new-items.json"

# Merge
jq --slurpfile new "$WORK/new-items.json" --arg now "$NOW" '
  .items = (.items + $new[0]) | .updatedAt = $now
' "$WORK/current.json" > "$WORK/merged.json"

OLD_N=$(jq '.items | length' "$WORK/current.json")
NEW_N=$(jq '.items | length' "$WORK/merged.json")
echo "[append] $OLD_N -> $NEW_N items (+$((NEW_N - OLD_N)))" >&2

# Encode + PUT
CONTENT_B64=$(base64 < "$WORK/merged.json" | tr -d '\n')

if [[ -n "$COMMIT_MSG_FLAG" ]]; then
  MSG="$COMMIT_MSG_FLAG"
else
  MSG="chore(actions): meeting recap $DATE $TITLE (+$N_NEW items)

Source: /meeting skill, extracted from transcript."
fi

PAYLOAD=$(jq -n --arg msg "$MSG" --arg content "$CONTENT_B64" --arg sha "$SHA" --arg branch "$BRANCH" \
  '{message: $msg, content: $content, sha: $sha, branch: $branch}')

echo "[append] PUT $REPO contents/$PATH_F (sha=${SHA:0:7})" >&2
RESULT=$(curl -fsSL -X PUT \
  "https://api.github.com/repos/$REPO/contents/$PATH_F" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/vnd.github+json" \
  -d "$PAYLOAD")

NEW_SHA=$(echo "$RESULT" | jq -r '.commit.sha')
URL=$(echo "$RESULT" | jq -r '.commit.html_url')

echo "[append] OK commit $NEW_SHA" >&2
echo "$URL"
