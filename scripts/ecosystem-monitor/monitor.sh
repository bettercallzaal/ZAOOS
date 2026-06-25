#!/bin/bash
# ecosystem-monitor — read-only census of the ZAO CODE estate + live fleet health.
#
# Sibling to scripts/estate-audit (which covers INFRA/billing: Vercel + Supabase
# projects). This covers REPOS + FLEET: every GitHub repo across the ZAO accounts
# (last push, open items, archived, language), bucketed by freshness, plus the live
# systemd agent units on the fleet box. Output is a markdown digest ZOE reports back.
#
# Security: read-only. Uses the already-authenticated `gh` CLI; no tokens written or
# printed. The generated report goes OFF-REPO (default ~/.zao/ecosystem-monitor/),
# never committed — same convention as estate-audit.
#
# Usage:   bash scripts/ecosystem-monitor/monitor.sh
# Env:     ECOSYSTEM_ACCOUNTS  space-separated GitHub logins (default below)
#          ECOSYSTEM_REPORT    output path (default ~/.zao/ecosystem-monitor/REPORT.md)
#          FLEET_HOST          ssh target for fleet health (default zaal@31.97.148.88)
set -uo pipefail

ACCOUNTS=(${ECOSYSTEM_ACCOUNTS:-bettercallzaal ZAODEVZ})
OUT="${ECOSYSTEM_REPORT:-$HOME/.zao/ecosystem-monitor/REPORT.md}"
FLEET_HOST="${FLEET_HOST:-zaal@31.97.148.88}"
EXPECTED_UNITS="zoe-bot zao-devz-stack zaostock-bot cowork-agent farscout"
mkdir -p "$(dirname "$OUT")"
NOW="$(date +%Y-%m-%d)"; NOW_EPOCH="$(date +%s)"

# portable epoch-from-ISO (GNU + BSD date)
iso_epoch() { date -j -f "%Y-%m-%dT%H:%M:%SZ" "$1" +%s 2>/dev/null || date -d "$1" +%s 2>/dev/null || echo "$NOW_EPOCH"; }
age_days() { echo $(( ( NOW_EPOCH - $(iso_epoch "$1") ) / 86400 )); }

command -v gh >/dev/null || { echo "gh CLI required"; exit 1; }

{
echo "# ZAO Ecosystem Monitor - $NOW"
echo ""
echo "Read-only census of the code estate + live fleet. Sibling to estate-audit (infra/billing)."
echo ""

TOTAL=0; ACTIVE=0; STALE=0; ARCH=0; OPEN=0
declare -a STALE_ROWS=(); ATTENTION=""

for acct in "${ACCOUNTS[@]}"; do
  echo "## $acct"; echo ""
  echo "| repo | last push | age(d) | open | archived | lang |"
  echo "|------|-----------|--------|------|----------|------|"
  rows="$(gh api "users/$acct/repos?per_page=100&sort=pushed" --jq '.[] | [.name,(.pushed_at//"?"),(.open_issues_count//0),(.archived//false),(.language//"-")] | @tsv' 2>/dev/null)"
  while IFS=$'\t' read -r name pushed open arch lang; do
    [ -z "$name" ] && continue
    age=$(age_days "$pushed"); TOTAL=$((TOTAL+1)); OPEN=$((OPEN+open))
    if [ "$arch" = "true" ]; then ARCH=$((ARCH+1))
    elif [ "$age" -le 30 ]; then ACTIVE=$((ACTIVE+1))
    elif [ "$age" -gt 90 ]; then STALE=$((STALE+1)); STALE_ROWS+=("$age|$acct/$name|${pushed:0:10}"); fi
    echo "| $name | ${pushed:0:10} | $age | $open | $arch | $lang |"
    if [ "$arch" != "true" ] && [ "$open" -gt 0 ] && [ "$age" -le 30 ]; then
      ATTENTION="$ATTENTION\n- $acct/$name: $open open item(s)"
    fi
  done <<< "$rows"
  echo ""
done

echo "## Live fleet ($FLEET_HOST)"; echo ""
running="$(ssh -o ConnectTimeout=8 "$FLEET_HOST" 'systemctl --user list-units --type=service --state=running 2>/dev/null | awk "{print \$1}"' 2>/dev/null)"
if [ -n "$running" ]; then
  for u in $EXPECTED_UNITS; do
    if echo "$running" | grep -q "^$u"; then echo "- UP   $u"; else echo "- DOWN $u  (expected, not running)"; fi
  done
else echo "(could not reach fleet box)"; fi
echo ""

echo "## Top stale repos (>90d, oldest first)"; echo ""
printf '%s\n' "${STALE_ROWS[@]}" | sort -t'|' -k1 -rn | head -8 | while IFS='|' read -r age repo pushed; do
  echo "- $repo - $age days (last $pushed)"
done
echo ""

echo "## Summary"; echo ""
echo "- Repos: **$TOTAL**  |  active (<=30d): **$ACTIVE**  |  stale (>90d): **$STALE**  |  archived: **$ARCH**"
echo "- Open items (issues+PRs) across estate: **$OPEN**"
echo ""
echo "## Needs attention (active repos with open items)"
echo -e "${ATTENTION:-\n- none}"
} > "$OUT"

echo "wrote $OUT"
