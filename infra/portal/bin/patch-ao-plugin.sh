#!/usr/bin/env bash
# Apply durable patches to the installed @aoagents/ao plugin so they survive
# npm install / update. Idempotent - safe to re-run.
#
# Patch 1 (doc 441/428): use --permission-mode acceptEdits instead of
#   --dangerously-skip-permissions (which always shows a blocking dialog).
# Patch 2 (doc 451): inject CLAUDE_AUTOUPDATER_DISABLE=1 so Claude Code
#   skips the auto-updater check that blocks headless sessions.
#
# Run after every `npm install -g @aoagents/ao` or `npm update`.

set -euo pipefail

PLUGIN="${AO_PLUGIN:-$HOME/.local/lib/node_modules/@aoagents/ao/node_modules/@aoagents/ao-plugin-agent-claude-code/dist/index.js}"
LOG="${HOME}/portal-logs/patch-ao-plugin.log"
mkdir -p "$(dirname "$LOG")"

exec >>"$LOG" 2>&1
echo "=== $(date -Iseconds) patch-ao-plugin ==="

if [ ! -f "$PLUGIN" ]; then
  echo "plugin missing: $PLUGIN"
  exit 1
fi

cp "$PLUGIN" "$PLUGIN.bak-$(date +%s)"

# Patch 1: --dangerously-skip-permissions -> --permission-mode acceptEdits
if grep -q 'dangerously-skip-permissions' "$PLUGIN"; then
  sed -i 's|parts.push("--dangerously-skip-permissions")|parts.push("--permission-mode", "acceptEdits")|g' "$PLUGIN"
  echo "patch1 applied (permission-mode)"
else
  echo "patch1 already applied"
fi

# Patch 1b: ao-web Next.js compiled server chunks also embed the flag. Replace
# the exact literal string so spawns via the web API (not the plugin path) also
# use acceptEdits. Targets any chunk containing the flag under .next/server.
AO_WEB_SERVER="${AO_WEB_SERVER:-$HOME/.local/lib/node_modules/@aoagents/ao/node_modules/@aoagents/ao-web/.next/server}"
if [ -d "$AO_WEB_SERVER" ]; then
  while IFS= read -r chunk; do
    cp "$chunk" "$chunk.bak-$(date +%s)"
    sed -i 's|"--dangerously-skip-permissions"|"--permission-mode","acceptEdits"|g' "$chunk"
    echo "patch1b applied: $chunk"
  done < <(grep -rl '"--dangerously-skip-permissions"' "$AO_WEB_SERVER" 2>/dev/null)
fi

# Patch 2: inject CLAUDE_AUTOUPDATER_DISABLE
if grep -q 'CLAUDE_AUTOUPDATER_DISABLE' "$PLUGIN"; then
  echo "patch2 already applied"
else
  sed -i 's|env\["CLAUDECODE"\] = "";|env["CLAUDE_AUTOUPDATER_DISABLE"] = "1"; env["CLAUDECODE"] = "";|' "$PLUGIN"
  echo "patch2 applied (auto-updater disable)"
fi

echo "done"
