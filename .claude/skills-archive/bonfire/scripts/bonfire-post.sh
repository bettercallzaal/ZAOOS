#!/usr/bin/env bash
# bonfire-post.sh - post episodes to the ZABAL Bonfire knowledge graph.
#
# The Bonfire API key lives ONLY on the VPS (/root/cowork-zaodevz/agent/.env),
# never on this machine. This script secret-scans the episodes locally, ships
# them to the VPS, and runs the POST there. The key never touches the mac.
#
# Usage:   bonfire-post.sh <episodes-json>
# Input:   {"episodes":[{"name":"...","body":"...","source_tag":"..."}]}
# Outputs: prints "Bonfire: N posted, M failed (of T)".
set -euo pipefail

INPUT="${1:?missing episodes-json path}"
VPS="${BONFIRE_VPS:-root@187.77.3.104}"
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ ! -f "$INPUT" ]]; then
  echo "ERROR: episodes file not found: $INPUT" >&2
  exit 2
fi
command -v jq >/dev/null 2>&1 || { echo "ERROR: jq required" >&2; exit 3; }
if ! jq empty "$INPUT" 2>/dev/null; then
  echo "ERROR: not valid JSON: $INPUT" >&2
  exit 3
fi

N=$(jq '.episodes | length' "$INPUT" 2>/dev/null || echo 0)
if [[ "$N" -eq 0 ]]; then
  echo "Bonfire: 0 episodes - nothing to post"
  exit 0
fi

# Local secret scan - never ship a key-shaped episode body anywhere.
SECRET_RE='sk-ant-[A-Za-z0-9_-]{20,}|sk-(proj-|cp-)?[A-Za-z0-9_-]{30,}|ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{60,}|-----BEGIN ([A-Z]+ )?PRIVATE KEY-----|0x[0-9a-fA-F]{64}|AKIA[0-9A-Z]{16}|xox[bpaors]-[A-Za-z0-9-]{10,}'
if jq -r '.episodes[].body' "$INPUT" 2>/dev/null | grep -qE "$SECRET_RE"; then
  echo "ERROR: an episode body contains a secret-shaped string - aborting, nothing sent" >&2
  exit 4
fi

REMOTE_SCRIPT="$SKILL_DIR/bonfire-remote-post.sh"
if [[ ! -f "$REMOTE_SCRIPT" ]]; then
  echo "ERROR: bonfire-remote-post.sh missing next to this script" >&2
  exit 3
fi

# Preflight SSH
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes "$VPS" 'echo ok' >/dev/null 2>&1; then
  echo "ERROR: cannot SSH to $VPS - check the key + host" >&2
  exit 5
fi

STAMP=$(date +%Y%m%d-%H%M%S)
REMOTE_JSON="/tmp/bonfire-episodes-$STAMP.json"
REMOTE_SH="/tmp/bonfire-remote-post-$STAMP.sh"

echo "[bonfire] shipping $N episodes to $VPS" >&2
scp -q "$INPUT" "$VPS:$REMOTE_JSON"
scp -q "$REMOTE_SCRIPT" "$VPS:$REMOTE_SH"

# Run the POST on the VPS (key comes from its env), then clean up remote temps.
ssh "$VPS" "bash $REMOTE_SH $REMOTE_JSON; rm -f $REMOTE_JSON $REMOTE_SH"
