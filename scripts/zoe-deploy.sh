#!/usr/bin/env bash
# zoe-deploy.sh - safe, atomic, self-verifying deploy of ZOE to the VPS.
#
# WHY: on 2026-06-15 a piecemeal per-file deploy (git checkout <file> one at a
# time onto a clone on the wrong branch) drifted events.ts and recall.ts out of
# sync - events.ts imported an export recall.ts no longer had - and the bot
# crash-looped for ~an hour before it was noticed. This script makes that class
# of failure impossible: it deploys the WHOLE branch by fast-forward, restarts,
# and VERIFIES the boot, aborting loudly if anything is off.
#
# Usage:  bash scripts/zoe-deploy.sh
# Env:    ZOE_VPS (default zaal@31.97.148.88), ZOE_BRANCH (default the ZOE branch)
set -euo pipefail

VPS="${ZOE_VPS:-zaal@31.97.148.88}"
BRANCH="${ZOE_BRANCH:-ws/zoe-bonfire-proactive-relay}"
REPO="/home/zaal/zao-os"

echo "[zoe-deploy] deploying $BRANCH to $VPS:$REPO"

ssh -o ConnectTimeout=25 "$VPS" "BRANCH='$BRANCH' REPO='$REPO' bash -s" <<'REMOTE'
set -euo pipefail
cd "$REPO"

# 1. Whole-branch fast-forward (no cherry-picking, no drift). Abort on local divergence.
git fetch origin "$BRANCH" -q
git checkout "$BRANCH" -q 2>/dev/null || git checkout -B "$BRANCH" "origin/$BRANCH" -q
if ! git merge --ff-only "origin/$BRANCH" -q 2>/dev/null; then
  echo "[zoe-deploy] ABORT: working tree diverged from origin/$BRANCH - not fast-forwardable."
  git status --short | head
  echo "[zoe-deploy] Fix the clone (git stash + checkout -B) before deploying."
  exit 2
fi
DIRTY=$(git status --short | wc -l | tr -d ' ')
echo "[zoe-deploy] synced to $(git rev-parse --short HEAD); dirty files: $DIRTY"

# 2. Restart.
systemctl --user restart zoe-bot
sleep 7

# 3. VERIFY BOOT - the gate. Active + no crash markers + actually polling.
if ! systemctl --user is-active zoe-bot >/dev/null; then
  echo "[zoe-deploy] FAIL: zoe-bot not active after restart."
  journalctl --user -u zoe-bot -n 15 --no-pager | tail -15
  exit 3
fi
if journalctl --user -u zoe-bot -n 25 --no-pager | grep -qiE 'SyntaxError|Cannot find module|does not provide an export|exited, code=1'; then
  echo "[zoe-deploy] FAIL: boot error in journal:"
  journalctl --user -u zoe-bot -n 25 --no-pager | grep -iE 'SyntaxError|Cannot find module|does not provide an export|error' | tail -6
  exit 4
fi
if journalctl --user -u zoe-bot -n 25 --no-pager | grep -q 'polling as'; then
  echo "[zoe-deploy] OK: zoe-bot active + polling, no boot errors."
else
  echo "[zoe-deploy] WARN: active + no errors, but did not see 'polling as' - verify manually."
fi
REMOTE
