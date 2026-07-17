#!/bin/bash
# zoe-autodeploy.sh v3 (2026-07-17) - ZOE never runs old code, never deploys broken code.
#
# CANONICAL SOURCE for the operator script installed at ~/bin/zoe-autodeploy.sh.
# The live copy lived only on the VPS (no version control), which is how the two bugs
# below hid for hours. Review this diff, then install:  cp scripts/zoe-autodeploy.sh ~/bin/
# Do NOT auto-run from CI - it restarts the live bot (gated).
#
# Runs from cron (*/10). Fast-forwards the SEPARATE live clone (~/zao-bot-live) to
# origin/main, verifies the boot on a throwaway checkout FIRST, restarts, health-checks,
# and rolls back on any boot error.
#
# --- FIX 1 (v3, DECISIVE): the cron could not restart the bot. --------------------------
# `systemctl --user ...` needs XDG_RUNTIME_DIR to reach the user bus. cron runs with a
# minimal env (no XDG_RUNTIME_DIR), so every systemctl call failed with "Failed to connect
# to bus: No medium found" - the restart never happened (NRestarts stayed 0), the is-active
# health check failed, and it rolled back. The bot sat frozen on old code for hours,
# 59 commits behind origin/main, undetected. Linger is enabled so /run/user/<uid> persists;
# we just have to point at it. Evidence: `env -i systemctl --user is-active zoe-bot` ->
# "Failed to connect to bus"; with XDG_RUNTIME_DIR set -> "active".
#
# --- FIX 2 (v3, verify the RIGHT commit): the boot-verify checked a STALE commit. ---------
# v2 did `git clone --depth 1 "$LIVE"` then `git checkout "$REMOTE"`. A shallow clone of the
# local live clone does NOT carry that clone's origin/main object, so the checkout silently
# fell through to a stale FETCH_HEAD - it boot-verified the wrong commit (a vacuous pass;
# see agent-loops rule 32). v3 verifies on a `git worktree` off the live clone, which HAS
# the origin/main object after the fetch below, and asserts HEAD == the target SHA.
set -uo pipefail

# FIX 1: give cron the user-bus runtime dir so `systemctl --user` works (linger is on).
export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}"

exec 9>/tmp/zoe-autodeploy.lock; flock -n 9 || exit 0
[ -f /tmp/zoe-autodeploy.HOLD ] && exit 0   # touch this file to pause deploys

LIVE=/home/zaal/zao-bot-live
cd "$LIVE" || exit 1
git fetch origin main --quiet 2>/dev/null || exit 0
LOCAL=$(git rev-parse HEAD 2>/dev/null); REMOTE=$(git rev-parse origin/main 2>/dev/null)
[ "$LOCAL" = "$REMOTE" ] && exit 0

# --- FIX 2: verify origin/main on a WORKTREE off the live clone (has the object) ---------
V=/tmp/zoe-verify
git -C "$LIVE" worktree remove --force "$V" 2>/dev/null; rm -rf "$V"
if ! git -C "$LIVE" worktree add --detach --quiet "$V" "$REMOTE" 2>/dev/null; then
  ~/bin/zao-status "autodeploy: verify-worktree add failed for $REMOTE - staying on $LOCAL" 2>/dev/null; exit 1
fi
# assert the verify checkout is ACTUALLY the target commit (never trust a vacuous verify).
VHEAD=$(git -C "$V" rev-parse HEAD 2>/dev/null)
if [ "$VHEAD" != "$REMOTE" ]; then
  ~/bin/zao-status "autodeploy BLOCKED: verify checkout is $VHEAD not $REMOTE - refusing to verify the wrong commit" 2>/dev/null
  git -C "$LIVE" worktree remove --force "$V" 2>/dev/null; exit 1
fi
# esbuild must exist (rule 30: a missing verifier is NOT a pass). Reuse the live clone's
# installed binary; --external:'*' means it needs no node_modules in the worktree.
ESB="$LIVE/bot/node_modules/.bin/esbuild"
if [ ! -x "$ESB" ]; then (cd "$LIVE/bot" && npm install --no-audit --no-fund --silent esbuild >/dev/null 2>&1); fi
if [ ! -x "$ESB" ]; then
  ~/bin/zao-status "autodeploy BLOCKED: cannot obtain esbuild to boot-verify - refusing to deploy unverified." 2>/dev/null
  git -C "$LIVE" worktree remove --force "$V" 2>/dev/null; exit 1
fi
ERR=$(cd "$V" && "$ESB" bot/src/zoe/index.ts --bundle --platform=node --format=esm --outfile=/dev/null --external:'*' 2>&1)
git -C "$LIVE" worktree remove --force "$V" 2>/dev/null
if [ -n "$ERR" ] && echo "$ERR" | grep -qiE 'error|unexpected'; then
  ~/bin/zao-status "autodeploy BLOCKED: origin/main FAILS boot-verify. Bot stays on $LOCAL. First error: $(echo "$ERR" | grep -iE 'error|unexpected' | head -1 | cut -c1-90)" 2>/dev/null
  exit 1
fi

# --- verified good: update the live clone + restart + health check + rollback ------------
cd "$LIVE"
[ -n "$(git status --porcelain --untracked-files=no)" ] && { ~/bin/zao-status "autodeploy SKIPPED: live clone has TRACKED changes - needs a human" 2>/dev/null; exit 0; }
PREV=$(git rev-parse HEAD)
git checkout --quiet main 2>/dev/null || git checkout --quiet -B main origin/main
git merge --ff-only --quiet origin/main 2>/dev/null || git reset --hard origin/main --quiet 2>/dev/null
npm install --no-audit --no-fund --silent >/dev/null 2>&1
systemctl --user restart zoe-bot
sleep 12
if systemctl --user is-active zoe-bot >/dev/null 2>&1 && ! journalctl --user -u zoe-bot --since "20 seconds ago" --no-pager 2>/dev/null | grep -qiE 'TransformError|Error \[|crash'; then
  ~/bin/zao-status "autodeploy OK: ZOE live on $(git rev-parse --short HEAD) - $(git log -1 --format=%s | cut -c1-55)" 2>/dev/null
else
  git checkout --quiet "$PREV" 2>/dev/null
  npm install --no-audit --no-fund --silent >/dev/null 2>&1
  systemctl --user restart zoe-bot
  ~/bin/zao-status "autodeploy ROLLED BACK: new code crashed at boot despite verify - restored to $PREV" 2>/dev/null
fi
