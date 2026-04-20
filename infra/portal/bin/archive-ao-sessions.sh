#!/usr/bin/env bash
# Archive terminal AO sessions (killed / merged / exited) so the dashboard
# sidebar badge only counts active work. Moves session dirs from
# ~/.agent-orchestrator/<project>/sessions/<id> -> .../sessions/archive/<id>.
#
# Run weekly via cron. Safe to run ad-hoc.

set -euo pipefail

AO_ROOT="${AO_ROOT:-$HOME/.agent-orchestrator}"
LOG="${HOME}/portal-logs/archive-ao-sessions.log"
mkdir -p "$(dirname "$LOG")"

exec >>"$LOG" 2>&1
echo "=== $(date -Iseconds) archive-ao-sessions ==="

if [ ! -d "$AO_ROOT" ]; then
  echo "AO_ROOT missing: $AO_ROOT"
  exit 0
fi

AUTH_TOKEN_FILE="${HOME}/.auth-token"
if [ ! -f "$AUTH_TOKEN_FILE" ]; then
  echo "auth-token missing; skipping api probe"
fi

archived_count=0
for project_dir in "$AO_ROOT"/*/sessions; do
  [ -d "$project_dir" ] || continue
  mkdir -p "$project_dir/archive"
  for session in "$project_dir"/*; do
    [ -d "$session" ] || continue
    name=$(basename "$session")
    case "$name" in
      archive) continue ;;
    esac

    # Skip sessions that still have a live tmux window (active work).
    tmux_name="$(cat "$session/.tmux-session" 2>/dev/null || true)"
    if [ -n "$tmux_name" ] && tmux has-session -t "$tmux_name" 2>/dev/null; then
      echo "skip live: $name ($tmux_name)"
      continue
    fi

    mv "$session" "$project_dir/archive/"
    echo "archived: $name"
    archived_count=$((archived_count + 1))
  done
done

echo "total archived: $archived_count"
