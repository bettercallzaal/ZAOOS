#!/usr/bin/env bash
# setup-claude-teammate.sh - bootstrap a new ZAOOS contributor's local
# environment for the team-shared skills (clipboard, handoff). Idempotent:
# safe to run any number of times. Never touches credentials - only flags
# what's missing so a human can grant access.
#
# Output format (one line per check), consumed by the /team-setup skill:
#   CREATED:<path>       - directory didn't exist, created it
#   EXISTS:<path>        - directory already there, left alone
#   MISSING-CRED:<name>  - something needing a human (Zaal) to grant, not fixable here
set -e

ensure_dir() {
  local dir="$1"
  if [ -d "$dir" ]; then
    echo "EXISTS:$dir"
  else
    mkdir -p "$dir"
    echo "CREATED:$dir"
  fi
}

ensure_dir "$HOME/.zao/clipboard"
ensure_dir "$HOME/.zao/handoff"
ensure_dir "$HOME/.zao/private"

if ! command -v bun >/dev/null 2>&1; then
  echo "MISSING-CRED:bun (needed for gstack skills - install: curl -fsSL https://bun.sh/install | bash)"
fi

if [ ! -f "$HOME/.zao/private/tg.env" ]; then
  echo "MISSING-CRED:tg.env (only needed if you use Telegram-integrated skills - ask Zaal)"
fi
