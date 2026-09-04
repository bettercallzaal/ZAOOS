#!/usr/bin/env bash
# deploy/pi/install.sh - install or update ZOE on the Pi (ansuz). Idempotent.
#
# Runs ON THE PI as user zaal. Every step is safe to re-run:
#   1. preflight    arch, node, git, secrets file present (values never printed)
#   2. code         clone https://github.com/bettercallzaal/ZAOOS to ~/zao-bot-live,
#                   or fast-forward it to origin/main (never touches local edits)
#   3. deps         npm ci in bot/ (FULL - tsx is a devDependency and there is no
#                   build step; see deploy/pi/requirements.md section 1)
#   4. verify       esbuild bundle of the entry (the same gate zoe-autodeploy.sh
#                   uses; a missing verifier is a FAIL, never a pass)
#   5. unit         copy deploy/pi/zoe.service to ~/.config/systemd/user, reload,
#                   enable (NOT start - see --start)
#   6. linger       report whether user units survive logout; prints the sudo line
#
# It does NOT start the bot unless you pass --start, and --start refuses to run
# until you also pass --i-stopped-the-vps, because Telegram allows ONE poller per
# token (RUNBOOK section 3). Nothing here writes secrets. Nothing here deletes
# user content.
#
# Usage:
#   bash ~/zao-bot-live/deploy/pi/install.sh              # install/update, enable, do not start
#   bash ~/zao-bot-live/deploy/pi/install.sh --start --i-stopped-the-vps
#   bash ~/zao-bot-live/deploy/pi/install.sh --ref <sha>  # pin a commit (rollback)
#
# First run (no clone yet) - bootstrap by fetching this file alone:
#   curl -fsSL https://raw.githubusercontent.com/bettercallzaal/ZAOOS/main/deploy/pi/install.sh | bash
# (the repo is PUBLIC; verified 2026-08-27. If that ever changes, clone with a
#  credential Zaal provides and run the script from the clone.)
set -euo pipefail

# --- settings -----------------------------------------------------------------
REPO_URL="${ZOE_REPO_URL:-https://github.com/bettercallzaal/ZAOOS.git}"
LIVE="${ZOE_LIVE_DIR:-$HOME/zao-bot-live}"
BRANCH="${ZOE_BRANCH:-main}"
SECRETS="$HOME/.zao/zoe.env"
UNIT_NAME="zoe"
UNIT_DIR="$HOME/.config/systemd/user"
DEPLOY_LOG="$HOME/.zao/zoe-deploy.log"
START=0; ACK_VPS=0; REF=""

while [ $# -gt 0 ]; do
  case "$1" in
    --start) START=1 ;;
    --i-stopped-the-vps) ACK_VPS=1 ;;
    --ref) shift; REF="${1:-}" ;;
    -h|--help) sed -n 2,30p "$0"; exit 0 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
  shift
done

# systemctl --user needs the user bus even from cron/ssh-without-login (agent-loops
# rule from zoe-autodeploy.sh FIX 1). Linger keeps /run/user/<uid> alive.
export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}"
log(){ printf '[zoe-pi] %s\n' "$*"; }
die(){ printf '[zoe-pi] FAIL: %s\n' "$*" >&2; exit 1; }

# --- 1. preflight ---------------------------------------------------------------
log "1/6 preflight"
[ "$(uname -m)" = "aarch64" ] || die "expected aarch64 (Pi), got $(uname -m)"
command -v node >/dev/null || die "node not on PATH"
command -v git  >/dev/null || die "git not on PATH"
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[ "$NODE_MAJOR" -ge 20 ] || die "node >= 20 required, have $(node -v) (repo standard is 22)"
[ "$NODE_MAJOR" -ge 22 ] || log "note: node $(node -v); repo .nvmrc says 22. Runs on 20 (no lock entry needs 22). Upgrade is a Zaal step."

# Secrets file: presence, mode, and the two boot-required keys. Values are NEVER echoed.
if [ ! -f "$SECRETS" ]; then
  die "$SECRETS is missing. Zaal writes it by hand - RUNBOOK section 2. Nothing else can create it."
fi
MODE="$(stat -c '%a' "$SECRETS")"
[ "$MODE" = "600" ] || die "$SECRETS mode is $MODE, must be 600 (chmod 600 $SECRETS)"
if ! grep -qE '^(ZOE_BOT_TOKEN|TELEGRAM_BOT_TOKEN)=.+' "$SECRETS"; then
  die "$SECRETS has no ZOE_BOT_TOKEN / TELEGRAM_BOT_TOKEN (bot exits 1 without it - index.ts:343)"
fi
grep -qE '^ZAAL_TELEGRAM_ID=.+' "$SECRETS" || die "$SECRETS has no ZAAL_TELEGRAM_ID (bot exits 1 without it - index.ts:347)"
for k in SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY COWORK_TRACKER_URL COWORK_TRACKER_KEY BONFIRE_API_KEY ANTHROPIC_API_KEY OPENROUTER_API_KEY; do
  grep -qE "^$k=.+" "$SECRETS" || log "warn: $k not set in zoe.env - the feature that reads it degrades at use (requirements.md 4.2/4.3)"
done
command -v gh     >/dev/null || log "warn: gh absent - Hermes PRs + board gh adapters will error at use (expected on the Pi tonight)"
command -v claude >/dev/null || [ -x "$HOME/.npm-global/bin/claude" ] || log "warn: claude CLI absent - Hermes coder/critic unavailable"
[ -d "$HOME/.zao/zoe" ] || log "note: ~/.zao/zoe absent - first boot seeds persona/human/bootloader from memory.ts defaults"

# --- 2. code ------------------------------------------------------------------
log "2/6 code -> $LIVE ($BRANCH)"
if [ ! -d "$LIVE/.git" ]; then
  git clone --branch "$BRANCH" --single-branch "$REPO_URL" "$LIVE"
else
  git -C "$LIVE" fetch origin "$BRANCH" --quiet
  if [ -n "$(git -C "$LIVE" status --porcelain --untracked-files=no)" ]; then
    die "$LIVE has TRACKED local changes - not touching it. Commit or move them, then re-run. (agent-loops rule 11)"
  fi
  git -C "$LIVE" checkout --quiet "$BRANCH" 2>/dev/null || git -C "$LIVE" checkout --quiet -B "$BRANCH" "origin/$BRANCH"
  git -C "$LIVE" merge --ff-only --quiet "origin/$BRANCH" || die "$LIVE diverged from origin/$BRANCH - not fast-forwardable; needs a human"
fi
if [ -n "$REF" ]; then
  git -C "$LIVE" checkout --quiet "$REF" || die "cannot checkout $REF"
  log "pinned to $REF (detached). Re-run without --ref to return to $BRANCH."
fi
SHA="$(git -C "$LIVE" rev-parse --short HEAD)"
log "code at $SHA - $(git -C "$LIVE" log -1 --format=%s | cut -c1-70)"
[ -f "$LIVE/deploy/pi/zoe.service" ] || die "$LIVE/deploy/pi/zoe.service missing at $SHA - this commit predates the Pi kit"
[ -d "$LIVE/packages/heart-fleet" ] || die "$LIVE/packages/heart-fleet missing - ZOE imports it (requirements.md section 1)"

# --- 3. deps ------------------------------------------------------------------
log "3/6 deps (npm ci, full - tsx is a devDependency)"
cd "$LIVE/bot"
if [ -f node_modules/.package-lock.json ] && cmp -s package-lock.json node_modules/.package-lock.json 2>/dev/null; then
  log "node_modules already matches package-lock.json - skipping npm ci"
else
  if ! npm ci --no-audit --no-fund; then
    log "npm ci failed - most likely the @discordjs/opus native build (not imported by ZOE). Retrying with --ignore-scripts."
    npm ci --no-audit --no-fund --ignore-scripts
  fi
fi
[ -x node_modules/.bin/tsx ] || die "node_modules/.bin/tsx missing after install - the unit cannot start"

# --- 4. verify ------------------------------------------------------------------
log "4/6 boot-verify (esbuild bundle of src/zoe/index.ts)"
ESB="$LIVE/bot/node_modules/.bin/esbuild"
[ -x "$ESB" ] || die "esbuild missing at $ESB - a missing verifier is NOT a pass (agent-loops rule 30)"
VERIFY_OUT="$(mktemp -t zoe-verify.XXXXXX)"
if ! "$ESB" src/zoe/index.ts --bundle --platform=node --format=esm --packages=external --outfile=/dev/null --log-level=warning >"$VERIFY_OUT" 2>&1; then
  cat "$VERIFY_OUT" >&2; rm -f "$VERIFY_OUT"
  die "boot-verify FAILED at $SHA - not installing a unit for code that cannot bundle"
fi
if grep -qiE 'error' "$VERIFY_OUT"; then cat "$VERIFY_OUT" >&2; rm -f "$VERIFY_OUT"; die "boot-verify reported errors at $SHA"; fi
rm -f "$VERIFY_OUT"
log "boot-verify OK at $SHA"

# --- 5. unit ------------------------------------------------------------------
log "5/6 systemd user unit -> $UNIT_DIR/$UNIT_NAME.service"
mkdir -p "$UNIT_DIR"
if ! cmp -s "$LIVE/deploy/pi/zoe.service" "$UNIT_DIR/$UNIT_NAME.service" 2>/dev/null; then
  cp "$LIVE/deploy/pi/zoe.service" "$UNIT_DIR/$UNIT_NAME.service"
  log "unit file updated"
else
  log "unit file unchanged"
fi
systemctl --user daemon-reload
systemctl --user enable "$UNIT_NAME" >/dev/null 2>&1 && log "unit enabled (starts at boot once linger is on)"
mkdir -p "$(dirname "$DEPLOY_LOG")"
printf '%s %s %s\n' "$(date '+%Y-%m-%dT%H:%M:%S%z')" "$(git -C "$LIVE" rev-parse HEAD)" "installed" >> "$DEPLOY_LOG"

# --- 6. linger ----------------------------------------------------------------
log "6/6 linger"
if loginctl show-user "$USER" -p Linger 2>/dev/null | grep -q 'Linger=yes'; then
  log "linger ON - user units survive logout and start at boot"
else
  log "linger OFF - the unit dies when the last login ends and does NOT start at boot."
  log "  Zaal runs once:  sudo loginctl enable-linger $USER"
fi

# --- start (gated) --------------------------------------------------------------
if [ "$START" != "1" ]; then
  log "DONE (not started). Start with:  systemctl --user start $UNIT_NAME"
  log "  ...but ONLY after the VPS zoe-bot is stopped + disabled (RUNBOOK section 3)."
  exit 0
fi
[ "$ACK_VPS" = "1" ] || die "--start needs --i-stopped-the-vps. One poller per Telegram token; two = 409 split-brain (RUNBOOK section 3)."
if systemctl --user is-active "$UNIT_NAME" >/dev/null 2>&1; then
  log "restarting $UNIT_NAME"; systemctl --user restart "$UNIT_NAME"
else
  log "starting $UNIT_NAME"; systemctl --user start "$UNIT_NAME"
fi
# The gate from scripts/zoe-deploy.sh: active + no boot error + actually polling.
# Measured 2026-08-27 on the Pi: cold boot to 'polling as' took ~35 s, and the
# 409 from a second poller arrived 14 s AFTER polling started. So: wait up to
# 90 s for the polling line, then hold 20 s more and re-read for a 409.
STARTED_AT="$(date '+%Y-%m-%d %H:%M:%S')"
for i in $(seq 1 18); do
  sleep 5
  J="$(journalctl --user -u "$UNIT_NAME" --since "$STARTED_AT" --no-pager 2>/dev/null)"
  if printf '%s' "$J" | grep -qE 'polling as|409|Missing ZOE_BOT_TOKEN|Missing ZAAL_TELEGRAM_ID|Cannot find module|SyntaxError'; then break; fi
done
sleep 20
J="$(journalctl --user -u "$UNIT_NAME" --since "$STARTED_AT" --no-pager 2>/dev/null)"
if ! systemctl --user is-active "$UNIT_NAME" >/dev/null; then
  printf '%s\n' "$J" | tail -20 >&2
  die "$UNIT_NAME not active after start"
fi
if printf '%s' "$J" | grep -qiE 'SyntaxError|Cannot find module|does not provide an export|TransformError|Missing ZOE_BOT_TOKEN|Missing ZAAL_TELEGRAM_ID'; then
  printf '%s\n' "$J" | grep -iE 'SyntaxError|Cannot find module|does not provide an export|TransformError|Missing' | head -5 >&2
  die "boot error in journal"
fi
if printf '%s' "$J" | grep -qiE '409|terminated by other getUpdates'; then
  systemctl --user disable --now "$UNIT_NAME" >/dev/null 2>&1
  die "409 Conflict - ANOTHER ZOE IS POLLING (the VPS zoe-bot?). This unit has been stopped + disabled so the fight ends. Stop the other one (RUNBOOK section 3), then re-run with --start."
fi
if printf '%s' "$J" | grep -q 'polling as'; then
  log "OK: $(printf '%s' "$J" | grep -o 'polling as @[A-Za-z0-9_]*' | tail -1) at $SHA"
  printf '%s %s %s\n' "$(date '+%Y-%m-%dT%H:%M:%S%z')" "$(git -C "$LIVE" rev-parse HEAD)" "started-ok" >> "$DEPLOY_LOG"
else
  log "WARN: active, no errors, but no 'polling as' line yet - check: journalctl --user -u $UNIT_NAME -f"
fi
