#!/usr/bin/env bash
# append-actions.sh - Bulk-insert meeting actions into the unified Supabase
# cowork tracker (project etwvzrmlxeobinrlytza, table public.tasks).
#
# Replaces the prior GitHub-actions.json writer (doc 713 step 1, 2026-05-23).
# Same input shape - reads .actions[] + .meeting.title/date from the JSON the
# /meeting Phase 2 extraction produces.
#
# Usage:   append-actions.sh <extracted-json-path>
# Outputs: prints "OK <N> tasks inserted (legacy_source=meeting:<slug>)" + the
#          generated slug so the recap doc can record it.
#
# Env:
#   SUPABASE_URL          required, https://etwvzrmlxeobinrlytza.supabase.co
#   SUPABASE_SERVICE_KEY  required, the service-role key
#
# Sourced from ~/.zao/cowork-tracker.env if not already in env. Drop the key
# there once (chmod 600); the script never echoes it.

set -uo pipefail

INPUT="${1:?missing extracted-json path}"
if [[ ! -f "$INPUT" ]]; then
  echo "ERROR: extracted JSON not found: $INPUT" >&2
  exit 2
fi

command -v jq   >/dev/null || { echo "ERROR: jq required" >&2; exit 3; }
command -v curl >/dev/null || { echo "ERROR: curl required" >&2; exit 3; }

# ---------- env / key sourcing ----------
COWORK_ENV="${COWORK_TRACKER_ENV:-$HOME/.zao/cowork-tracker.env}"
if [[ -z "${SUPABASE_SERVICE_KEY:-}" && -f "$COWORK_ENV" ]]; then
  set -a; . "$COWORK_ENV"; set +a
fi

SUPABASE_URL="${SUPABASE_URL:-}"
SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_KEY:-}"
if [[ -z "$SUPABASE_URL" || -z "$SUPABASE_SERVICE_KEY" ]]; then
  echo "ERROR: SUPABASE_URL / SUPABASE_SERVICE_KEY missing." >&2
  echo "       Set them in env or in $COWORK_ENV (chmod 600)." >&2
  exit 4
fi

API="${SUPABASE_URL%/}/rest/v1"
AUTH=(-H "apikey: $SUPABASE_SERVICE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_KEY")

# ---------- read input ----------
TITLE=$(jq -r '.meeting.title // "meeting"' "$INPUT")
DATE=$(jq -r '.meeting.date // empty' "$INPUT")
[[ -z "$DATE" ]] && DATE=$(date -u +%Y-%m-%d)
N_NEW=$(jq '.actions | length' "$INPUT")
if [[ "$N_NEW" -eq 0 ]]; then
  echo "[append] no actions to insert, skipping" >&2
  exit 0
fi

# Slug for legacy_source: meeting:<lower-hyphen-title-<date>>
SLUG=$(echo "$TITLE" \
  | tr '[:upper:]' '[:lower:]' \
  | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g' \
  | cut -c1-40)
SOURCE_TAG="meeting:${SLUG}-${DATE}"

echo "[append] inserting $N_NEW actions, legacy_source=$SOURCE_TAG" >&2

# ---------- resolve team_members owner names -> uuids (one round-trip) ----------
TEAM_JSON=$(curl -fsS "${AUTH[@]}" "$API/team_members?select=id,legacy_owner") \
  || { echo "ERROR: team_members read failed" >&2; exit 5; }

# jq map: lower(name) -> uuid
OWNER_MAP=$(echo "$TEAM_JSON" | jq -c 'map(select(.legacy_owner != null)) | map({(.legacy_owner | ascii_downcase): .id}) | add // {}')

# ---------- build the rows ----------
# Map extraction action -> tasks row. Owner resolution via the OWNER_MAP.
# project=zaodevz (the general bucket). legacy_id stable: <slug>-<index>.
ROWS=$(jq --argjson omap "$OWNER_MAP" --arg src "$SOURCE_TAG" --arg slug "$SLUG" --arg date "$DATE" --arg title "$TITLE" '
  .actions | to_entries | map(
    . as $entry
    | $entry.value as $a
    | ($a.owner // "" | ascii_downcase) as $okey
    | ($omap[$okey] // null) as $oid
    | {
        project: "zaodevz",
        kind: "task",
        title: $a.title,
        status: "todo",
        owner_id: $oid,
        category: ($a.category // "Other"),
        priority: (if ($a.due // "") == $date then "P1" else "P2" end),
        due: (if (($a.due // "") | test("^[0-9]{4}-[0-9]{2}-[0-9]{2}$")) then $a.due else null end),
        notes: ("From the " + $title + " meeting on " + $date + (if ($a.owner // "") == "" then "." else ". Owner label: " + $a.owner + "." end)),
        legacy_id: ($slug + "-" + (($entry.key + 1) | tostring)),
        legacy_source: $src,
        brands: [],
        metadata: ({
          meeting_title: $title,
          meeting_date: $date,
          owner_label: ($a.owner // null),
          confidence: ($a.confidence // null),
          auto_inserted_by: "meeting-skill-append-actions.sh"
        } | with_entries(select(.value != null)))
      }
  )
' "$INPUT")

# ---------- POST as a single bulk insert ----------
RESP=$(curl -fsS -X POST "${AUTH[@]}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "$ROWS" \
  "$API/tasks?select=legacy_id,title")
RC=$?
if [[ $RC -ne 0 ]]; then
  echo "ERROR: Supabase insert failed (rc=$RC)" >&2
  exit 6
fi

INSERTED=$(echo "$RESP" | jq 'length')
if [[ "$INSERTED" != "$N_NEW" ]]; then
  echo "WARNING: expected $N_NEW inserts, Supabase returned $INSERTED rows" >&2
fi

echo "[append] OK $INSERTED tasks inserted" >&2
echo "OK $INSERTED tasks inserted (legacy_source=$SOURCE_TAG)"
