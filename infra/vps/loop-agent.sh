#!/bin/bash
# loop-agent.sh <loop-name> <work-dir> <directive-file>
# Implements the provider fallover ladder: claude -> codex -> cheap-loop -> noop
# Intended to be called FROM loops-keepalive.sh to handle a single loop tick
# Logs the chosen provider to ~/.zao/loop-provider.log

set -e

LOOP_NAME="${1:?loop name required}"
WORK_DIR="${2:?work dir required}"
DIRECTIVE_FILE="${3:?directive file required}"

STATE_FILE="${HOME}/.zao/provider-state"
LOG_FILE="${HOME}/.zao/loop-provider.log"

# Ensure dirs exist
mkdir -p "${HOME}/.zao"

# Simple log function
log_event() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $LOOP_NAME: $1" >> "$LOG_FILE"
}

# Ensure we have fresh provider state (should be called by keepalive before this)
if [ ! -f "$STATE_FILE" ] || [ $(( $(date +%s) - $(stat -f%m "$STATE_FILE" 2>/dev/null || echo 0) )) -gt 180 ]; then
  "${HOME}/bin/provider-health.sh" >/dev/null 2>&1 || true
fi

# Read provider state
BEST_PROVIDER="none"
if [ -f "$STATE_FILE" ]; then
  # shellcheck disable=SC1090
  source "$STATE_FILE"
fi

# Fallover ladder: try to run the loop with the best available provider
case "$BEST_PROVIDER" in
  claude)
    log_event "Using claude (primary)"
    cd "$WORK_DIR" && /home/zaal/bin/claude --dangerously-skip-permissions
    ;;
  codex)
    log_event "Using codex (secondary)"
    if [ -f "$DIRECTIVE_FILE" ]; then
      directive=$(cat "$DIRECTIVE_FILE")
      cd "$WORK_DIR" && codex exec --skip-git-repo-check "$directive"
    else
      log_event "No directive file, skipping codex run"
    fi
    ;;
  openrouter|ollama)
    # Text-only via cheap-loop.sh
    log_event "Using cheap-loop ($BEST_PROVIDER, text-only)"
    if [ -f "${HOME}/bin/cheap-loop.sh" ]; then
      cd "$WORK_DIR" && bash "${HOME}/bin/cheap-loop.sh"
    else
      log_event "cheap-loop.sh not found, skipping"
    fi
    ;;
  none)
    log_event "All providers unavailable, no-op (zero spend)"
    ;;
  *)
    log_event "Unknown provider: $BEST_PROVIDER, no-op"
    ;;
esac

exit 0
