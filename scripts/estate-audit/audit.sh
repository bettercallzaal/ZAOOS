#!/usr/bin/env bash
#
# estate-audit/audit.sh
# -------------------------------------------------------------------
# Census every Vercel project and every Supabase project on the
# account, map them to repos, and emit a costed kill-list.
#
# Tokens are READ-ONLY, SHORT-LIVED, and live OFF-REPO at:
#   ~/.zao/estate-tokens.env
#     VERCEL_TOKEN=...
#     SUPABASE_ACCESS_TOKEN=sbp_...
#
# NEVER commit the token file. NEVER print token values.
# Raw API output (may contain billing/PII) is written to ~/.zao/private/
# per .claude/rules/pii-hygiene.md. Only the synthesized table prints.
#
# Usage:
#   bash scripts/estate-audit/audit.sh
#
# Requires: curl, jq
# -------------------------------------------------------------------
set -euo pipefail

TOKENS_FILE="${HOME}/.zao/estate-tokens.env"
OUT_DIR="${HOME}/.zao/private"
STAMP="$(date +%Y%m%d-%H%M%S)"
DEAD_DAYS=90   # no deploy in N days => flagged dead

mkdir -p "${OUT_DIR}"

# ---- preflight ----------------------------------------------------
command -v jq   >/dev/null || { echo "ERROR: jq not installed (brew install jq)"; exit 1; }
command -v curl >/dev/null || { echo "ERROR: curl not installed"; exit 1; }

if [[ ! -f "${TOKENS_FILE}" ]]; then
  cat <<EOF
ERROR: no token file at ${TOKENS_FILE}

Create it (read-only, 1-day tokens), then re-run:
  printf 'VERCEL_TOKEN=PASTE_VERCEL\nSUPABASE_ACCESS_TOKEN=PASTE_SBP\n' > ~/.zao/estate-tokens.env && chmod 600 ~/.zao/estate-tokens.env

Token sources:
  Vercel:   https://vercel.com/account/tokens  (expiry 1 day)
  Supabase: https://supabase.com/dashboard/account/tokens (sbp_..., revoke after)
EOF
  exit 1
fi

# shellcheck disable=SC1090
set +u; source "${TOKENS_FILE}"; set -u
VERCEL_TOKEN="${VERCEL_TOKEN:-}"
SUPABASE_ACCESS_TOKEN="${SUPABASE_ACCESS_TOKEN:-}"

now_epoch=$(date +%s)

echo "================================================================"
echo " ZAO ESTATE CENSUS  ${STAMP}"
echo " raw dumps -> ${OUT_DIR}/{vercel,supabase}-estate-${STAMP}.json"
echo "================================================================"

# ===================================================================
# VERCEL
# ===================================================================
vercel_section() {
  if [[ -z "${VERCEL_TOKEN}" ]]; then
    echo; echo "VERCEL: no VERCEL_TOKEN set - skipped."; return
  fi
  local raw="${OUT_DIR}/vercel-estate-${STAMP}.json"
  local auth="Authorization: Bearer ${VERCEL_TOKEN}"

  # Resolve teams (projects can live under personal scope + each team)
  curl -sf -H "${auth}" "https://api.vercel.com/v2/teams?limit=100" \
    > "${OUT_DIR}/vercel-teams-${STAMP}.json" 2>/dev/null || echo '{"teams":[]}' > "${OUT_DIR}/vercel-teams-${STAMP}.json"

  # Collect projects across personal + each team scope as JSONL (one obj per
  # line), then slurp into a valid JSON array. Avoids subshell comma bugs.
  local jsonl="${OUT_DIR}/vercel-estate-${STAMP}.jsonl"
  : > "${jsonl}"

  fetch_scope() {
    local teamq="$1" scopelabel="$2"
    local url="https://api.vercel.com/v9/projects?limit=100${teamq}"
    while [[ -n "${url}" ]]; do
      local page
      page=$(curl -sf -H "${auth}" "${url}") || break
      echo "${page}" | jq -c --arg scope "${scopelabel}" '
        .projects[] | {
          scope: $scope,
          name, id, framework, updatedAt,
          latestDeployments: (.latestDeployments // []),
          repo: ((.link.org // "") as $o | (.link.repo // "") as $r |
                 if $r == "" then null
                 elif $o == "" then $r
                 else $o + "/" + $r end)
        }' >> "${jsonl}"
      local next
      next=$(echo "${page}" | jq -r '.pagination.next // empty')
      if [[ -n "${next}" ]]; then
        url="https://api.vercel.com/v9/projects?limit=100&until=${next}${teamq}"
      else
        url=""
      fi
    done
  }

  fetch_scope "" "personal"
  jq -r '.teams[]? | "\(.id)\t\(.slug)"' "${OUT_DIR}/vercel-teams-${STAMP}.json" 2>/dev/null \
    | while IFS=$'\t' read -r tid tslug; do
        [[ -z "${tid}" ]] && continue
        fetch_scope "&teamId=${tid}" "${tslug}"
      done

  # Slurp JSONL -> JSON array, dedupe by project id (a project is returned once
  # under personal scope AND once per team the token can see - same id).
  jq -s 'unique_by(.id)' "${jsonl}" > "${raw}"
  rm -f "${jsonl}"

  echo
  echo "----------------------------------------------------------------"
  echo "VERCEL PROJECTS"
  echo "----------------------------------------------------------------"
  local total dead
  total=$(jq 'length' "${raw}")
  echo "total projects: ${total}   (dead = no deploy in ${DEAD_DAYS}d)"
  echo
  printf "%-32s %-12s %-10s %-26s %s\n" "PROJECT" "SCOPE" "STATE" "LAST DEPLOY" "REPO"
  jq -r --argjson now "${now_epoch}" --argjson dd "${DEAD_DAYS}" '
    .[] |
    (.latestDeployments[0].createdAt // .updatedAt // 0) as $ts |
    (($ts/1000) | floor) as $tsec |
    (($now - $tsec) / 86400 | floor) as $age |
    (if $tsec == 0 then "NODEPLOY"
     elif $age > $dd then "DEAD(" + ($age|tostring) + "d)"
     else "live" end) as $state |
    [ (.name // "?")[0:31],
      (.scope // "?")[0:11],
      $state,
      (if $tsec==0 then "-" else ($tsec | strftime("%Y-%m-%d")) end),
      (.repo // "-")
    ] | @tsv' "${raw}" \
    | sort -t$'\t' -k3 \
    | while IFS=$'\t' read -r n s st ld r; do printf "%-32s %-12s %-10s %-26s %s\n" "$n" "$s" "$st" "$ld" "$r"; done

  echo
  echo "VERCEL KILL CANDIDATES (dead/no-deploy):"
  jq -r --argjson now "${now_epoch}" --argjson dd "${DEAD_DAYS}" '
    .[] |
    (.latestDeployments[0].createdAt // .updatedAt // 0) as $ts |
    (($ts/1000)|floor) as $tsec |
    (($now-$tsec)/86400|floor) as $age |
    select($tsec==0 or $age>$dd) |
    "  - " + (.name // "?") + "  (" + (.scope//"?") + ")  last="
      + (if $tsec==0 then "never" else ($tsec|strftime("%Y-%m-%d")) end)
      + "  repo=" + (.repo // "none")' "${raw}"
  echo
  echo "NOTE: Vercel public API does not expose per-project \$ spend."
  echo "      Cross-check the kill list against the billing dashboard:"
  echo "      https://vercel.com/account/usage"
}

# ===================================================================
# SUPABASE
# ===================================================================
supabase_section() {
  if [[ -z "${SUPABASE_ACCESS_TOKEN}" ]]; then
    echo; echo "SUPABASE: no SUPABASE_ACCESS_TOKEN set - skipped."; return
  fi
  local raw="${OUT_DIR}/supabase-estate-${STAMP}.json"
  local auth="Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}"

  curl -sf -H "${auth}" "https://api.supabase.com/v1/projects" > "${raw}" \
    || { echo "SUPABASE: API call failed (token bad/expired?)"; return; }

  echo
  echo "----------------------------------------------------------------"
  echo "SUPABASE PROJECTS"
  echo "----------------------------------------------------------------"
  local total
  total=$(jq 'length' "${raw}")
  echo "total projects: ${total}"
  echo
  printf "%-34s %-14s %-22s %-14s %s\n" "PROJECT" "STATUS" "REF" "CREATED" "REGION"
  jq -r '.[] | [ (.name//"?")[0:33], (.status//"?"), (.id//.ref//"?"), ((.created_at//"")[0:10]), (.region//"?") ] | @tsv' "${raw}" \
    | while IFS=$'\t' read -r n s ref cr rg; do printf "%-34s %-14s %-22s %-14s %s\n" "$n" "$s" "$ref" "$cr" "$rg"; done

  echo
  echo "SUPABASE KILL CANDIDATES (paused/inactive):"
  jq -r '.[] | select((.status // "") | test("ACTIVE_HEALTHY"; "i") | not)
    | "  - " + (.name//"?") + "  status=" + (.status//"?") + "  ref=" + (.id//.ref//"?")' "${raw}" \
    || echo "  (none - all ACTIVE_HEALTHY)"
  echo
  echo "NOTE: Supabase Management API does not return DB size or \$ spend per project."
  echo "      Cross-check against: https://supabase.com/dashboard/org/_/usage"
  echo "      DB size per project: run inside each project's SQL editor:"
  echo "        select pg_size_pretty(pg_database_size(current_database()));"
}

vercel_section || echo "VERCEL section errored (continuing)."
supabase_section || echo "SUPABASE section errored (continuing)."

echo
echo "================================================================"
echo " DONE. Raw dumps in ${OUT_DIR} (off-repo, gitignored)."
echo " REMINDER: revoke both tokens now (Supabase PATs are account-wide)."
echo "================================================================"
