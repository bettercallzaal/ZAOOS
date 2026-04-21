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
  done < <(grep -rl --include='*.js' '"--dangerously-skip-permissions"' "$AO_WEB_SERVER" 2>/dev/null)
fi

# Patch 2: inject CLAUDE_AUTOUPDATER_DISABLE
if grep -q 'CLAUDE_AUTOUPDATER_DISABLE' "$PLUGIN"; then
  echo "patch2 already applied"
else
  sed -i 's|env\["CLAUDECODE"\] = "";|env["CLAUDE_AUTOUPDATER_DISABLE"] = "1"; env["CLAUDECODE"] = "";|' "$PLUGIN"
  echo "patch2 applied (auto-updater disable)"
fi

# Patch 3 (doc 466): Kill button gives no visible feedback on success. Force
# a page reload 400ms after a successful kill so the user sees state change
# instead of wondering if the click did anything. Patches the ao-web client
# chunk that contains the Kill handler (filename has a content hash, so we
# grep by signature string).
AO_WEB_CHUNKS="${AO_WEB_CHUNKS:-$HOME/.local/lib/node_modules/@aoagents/ao/node_modules/@aoagents/ao-web/.next/static/chunks}"
if [ -d "$AO_WEB_CHUNKS" ]; then
  while IFS= read -r chunk; do
    if grep -q 'setTimeout.*reload' "$chunk"; then
      echo "patch3 already applied: $chunk"
      continue
    fi
    cp "$chunk" "$chunk.bak-$(date +%s)"
    sed -i 's|el("Session terminated","success")|el("Session terminated","success"),setTimeout(()=>window.location.reload(),400)|g' "$chunk"
    echo "patch3 applied: $chunk"
  done < <(grep -rl --include='*.js' 'el("Session terminated","success")' "$AO_WEB_CHUNKS" 2>/dev/null)
fi

# Patch 4 (doc 466): ship a stub sw.js into the Caddy static root so the
# browser's service-worker registration does not fail with a MIME-type error.
# Upstream AO compiles a sw.js but does not copy it to the npm public/ dir.
CADDY_AO_ROOT="${CADDY_AO_ROOT:-$HOME/caddy/ao}"
if [ -d "$CADDY_AO_ROOT" ]; then
  if [ ! -f "$CADDY_AO_ROOT/sw.js" ]; then
    cat > "$CADDY_AO_ROOT/sw.js" << 'SW_EOF'
// Minimal no-op service worker. Stops the console MIME-type registration error.
// Real SW from upstream AO is not shipped in the npm build; this placeholder
// keeps the browser happy until AO ships sw.js or we clone source.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
SW_EOF
    echo "patch4 applied (sw.js stub written to $CADDY_AO_ROOT)"
  else
    echo "patch4 already applied"
  fi
fi

echo "done"
