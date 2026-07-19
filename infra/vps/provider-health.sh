#!/bin/bash
# provider-health.sh - probe providers and output available ones in priority order
# Output: lines like "claude", "codex", "openrouter", "ollama" in order of availability
# Writes to ~/.zao/provider-state and logs to ~/.zao/loop-provider.log

set -e

STATE_FILE="${HOME}/.zao/provider-state"
LOG_FILE="${HOME}/.zao/loop-provider.log"

# Ensure dirs exist
mkdir -p "${HOME}/.zao"

# Simple log function
log_event() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Check if claude CLI is available and healthy
check_claude() {
  if ! command -v claude &>/dev/null; then
    echo "claude CLI not found"
    return 1
  fi

  # Try a lightweight command
  if claude --version &>/dev/null; then
    # Check for obvious rate-limit/error signs in recent tmux panes
    # Look for usage-limit or error keywords in the live loop panes
    if tmux list-sessions &>/dev/null; then
      local has_error=0
      for session in zoe ww coc human zol zaostock fractal sparkz warpee; do
        if tmux has-session -t "$session" 2>/dev/null; then
          local pane_content
          pane_content=$(tmux capture-pane -t "$session" -p 2>/dev/null || echo "")
          if echo "$pane_content" | grep -iqE "usage.*limit|rate.*limit|quota|forbidden|429|claude.*unavailable"; then
            has_error=1
            break
          fi
        fi
      done
      if [ "$has_error" -eq 1 ]; then
        echo "claude has rate-limit/error signs"
        return 1
      fi
    fi

    return 0
  fi
  echo "claude --version failed"
  return 1
}

# Check if codex is available
check_codex() {
  if ! command -v codex &>/dev/null; then
    echo "codex CLI not found"
    return 1
  fi

  if codex login status &>/dev/null 2>&1; then
    return 0
  fi
  echo "codex not authenticated"
  return 1
}

# Check if openrouter key exists
check_openrouter() {
  if [ -f "${HOME}/.zao/zao.env" ]; then
    if grep -q "OPENROUTER_API_KEY=" "${HOME}/.zao/zao.env"; then
      return 0
    fi
  fi
  echo "openrouter key not found"
  return 1
}

# Check if ollama is reachable
check_ollama() {
  if curl -s http://localhost:11434/api/version &>/dev/null; then
    return 0
  fi
  echo "ollama unreachable"
  return 1
}

# Probe all providers
providers_available=""
best_provider=""

if check_claude >/dev/null 2>&1; then
  providers_available="claude"
  best_provider="claude"
else
  log_event "claude health check failed"
fi

if check_codex >/dev/null 2>&1; then
  providers_available="${providers_available} codex"
  if [ -z "$best_provider" ]; then
    best_provider="codex"
  fi
else
  log_event "codex check failed"
fi

if check_openrouter >/dev/null 2>&1; then
  providers_available="${providers_available} openrouter"
  if [ -z "$best_provider" ]; then
    best_provider="openrouter"
  fi
else
  log_event "openrouter check failed"
fi

if check_ollama >/dev/null 2>&1; then
  providers_available="${providers_available} ollama"
  if [ -z "$best_provider" ]; then
    best_provider="ollama"
  fi
else
  log_event "ollama check failed"
fi

# Write state file (this is read by loop-agent.sh)
{
  echo "BEST_PROVIDER=${best_provider:-none}"
  echo "AVAILABLE=${providers_available:-none}"
  echo "UPDATED=$(date +'%s')"
} > "$STATE_FILE"

log_event "Probe complete: best=$best_provider available=[${providers_available}]"

# Exit 0 always (no-op if all fail)
exit 0
