#!/bin/bash
# zoe-autodeploy.sh v4 (2026-10-08) - ZOE never runs old code, never deploys broken code.
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
#
# --- v4 (2026-10-08): RECONCILED, and quiet on merges that do not touch bot/. ----------
# The installed copy (~/bin on the VPS) and this file had drifted both ways: 61 lines of
# code differed. Installing this file over it would have dropped live fixes. v4 is the
# union, so `cp scripts/zoe-autodeploy.sh ~/bin/` loses nothing:
#   from the installed copy: DBUS_SESSION_BUS_ADDRESS; `cd bot` for npm install, with a
#     300 s timeout and the package-lock.json churn discard; the systemd unit reinstall
#     on deploy AND on rollback.
#   from this file: esbuild auto-install when the binary is missing (now --no-save, so it
#     cannot dirty the tracked package.json and block every later deploy).
#   new: ZOE_AUTODEPLOY_SKIP_NONBOT=1 (default 0). When nothing ZOE runs changed - bot/
#     and every bundle input outside it, read from esbuild's metafile after the verify -
#     the live clone fast-forwards with no restart and no notice. 2026-10-08 08:00 and 08:10
#     EDT: two research-doc merges each restarted ZOE and posted to ZAAL BOTZ.
#   new: the OK notice goes out with ZAO_STATUS_NO_TAG=1. zao-status tagged Zaal on any
#     message containing "approve", so a doc titled "how ZAO holders can approve a ZIP"
#     tagged him on a routine deploy.
set -uo pipefail
exec 9>/tmp/zoe-autodeploy.lock; flock -n 9 || exit 0
[ -f /tmp/zoe-autodeploy.HOLD ] && exit 0
export XDG_RUNTIME_DIR="/run/user/$(id -u)"
export DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$(id -u)/bus"   # touch this file to pause deploys

LIVE=/home/zaal/zao-bot-live
cd "$LIVE" || exit 1
git fetch origin main --quiet 2>/dev/null || exit 0
LOCAL=$(git rev-parse HEAD 2>/dev/null); REMOTE=$(git rev-parse origin/main 2>/dev/null)
[ "$LOCAL" = "$REMOTE" ] && exit 0

# --- verify origin/main on a FRESH checkout BEFORE touching the live bot ---
# v3 (2026-08-07) - fixed TWO bugs that between them stopped every deploy for
# ~2h40m while the bot silently ran 14-commit-old code.
#
# BUG 1, the vacuous verify (exactly agent-loops rule 32, which this script was
# supposed to already honour): `git clone --depth 1 "$LIVE"` copies the live
# clone's BRANCHES but not its remote-tracking objects, so origin/main's commit
# was often absent from the verify clone. `git checkout "$REMOTE"` then failed
# and fell through to `FETCH_HEAD` - the live clone's own STALE main. The script
# therefore verified the code already running and passed itself, every time.
# Caught 2026-08-07 with /tmp/zoe-verify parked on a commit that was neither
# HEAD nor origin/main. A verify against the wrong commit is not a weak check,
# it is no check.
#
# Fix: use a git WORKTREE off the live clone, which already has the object
# (that is the rule-32 remedy verbatim), and then ASSERT that HEAD is the
# intended SHA before trusting anything downstream.
#
# BUG 2, the verifier could not install itself: `npm install esbuild` in a bare
# checkout resolves the WHOLE dependency tree, not one package, and was hitting
# the 300s timeout. No binary meant a correct hard-fail - so the safety worked,
# but it blocked every deploy and the alert went nowhere anyone was reading.
#
# Fix: use the LIVE clone's esbuild binary against the verify checkout's SOURCE.
# esbuild is a standalone bundler - it does not need to live in the tree it
# bundles - so the deploy path no longer depends on the network at all. The
# hard-fail on a missing binary is kept, because a missing verifier must never
# pass vacuously.
V=/tmp/zoe-verify
git -C "$LIVE" worktree remove --force "$V" 2>/dev/null
[ -e "$V" ] && rm -rf "$V"          # leftover from the old clone-based path
git -C "$LIVE" worktree add --quiet --detach "$V" "$REMOTE" 2>/dev/null || {
  ~/bin/zao-status "autodeploy BLOCKED: could not create verify worktree at $REMOTE" 2>/dev/null; exit 1; }
cd "$V"

# Assert we are verifying the RIGHT commit. Without this, bug 1 is silent.
GOT=$(git rev-parse HEAD 2>/dev/null)
if [ "$GOT" != "$REMOTE" ]; then
  ~/bin/zao-status "autodeploy BLOCKED: verify checkout is $GOT, expected $REMOTE - refusing a vacuous verify" 2>/dev/null
  git -C "$LIVE" worktree remove --force "$V" 2>/dev/null
  exit 1
fi

# The verifier binary comes from the LIVE clone. Missing = HARD FAIL, never a pass.
ESB="$LIVE/bot/node_modules/.bin/esbuild"
# From the repo copy: try to obtain the verifier before refusing. --no-save keeps the
# tracked package.json and lockfile untouched.
if [ ! -x "$ESB" ]; then (cd "$LIVE/bot" && timeout 300 npm install --no-audit --no-fund --silent --no-save esbuild >/dev/null 2>&1); fi
if [ ! -x "$ESB" ]; then
  ~/bin/zao-status "autodeploy BLOCKED: no esbuild at $ESB to boot-verify - refusing to deploy unverified. Bot stays on current code." 2>/dev/null
  git -C "$LIVE" worktree remove --force "$V" 2>/dev/null
  exit 1
fi
ERR=$("$ESB" bot/src/zoe/index.ts --bundle --platform=node --format=esm --outfile=/dev/null --external:'*' 2>&1)
# v4: what the bot READS, from esbuild's own metafile for the commit being deployed.
# bot/ alone is not enough: scheduler.ts, heart-canary.ts and heart-run.ts import
# ../../../packages/heart-fleet (seat evaluator on #3817). A SEPARATE build, because
# the verify above uses --external:'*', which treats relative imports as external
# too: its metafile lists index.ts alone. --packages=external follows every relative
# import and leaves only npm packages out (measured 2026-10-08: 199 inputs, 11 of them
# in packages/heart-fleet). META_OK stays 0 if this build or its metafile fails in any
# way, and then nothing is skipped.
META_OK=0; EXTRA=()
if [ "${ZOE_AUTODEPLOY_SKIP_NONBOT:-0}" = 1 ] && \
   "$ESB" bot/src/zoe/index.ts --bundle --platform=node --format=esm --outfile=/dev/null --packages=external --metafile="$V/.zoe-meta.json" >/dev/null 2>&1; then
  META_LIST=$(python3 - "$V/.zoe-meta.json" <<'PY'
import json, sys
inputs = (json.load(open(sys.argv[1])) or {}).get("inputs") or {}
if not inputs:
    sys.exit(1)
for path in sorted(inputs):
    if not path.startswith("bot/"):
        print(path)
PY
) && META_OK=1
  [ "$META_OK" = 1 ] && [ -n "$META_LIST" ] && mapfile -t EXTRA <<< "$META_LIST"
fi
git -C "$LIVE" worktree remove --force "$V" 2>/dev/null
if [ -n "$ERR" ] && echo "$ERR" | grep -qiE 'error|unexpected'; then
  ~/bin/zao-status "autodeploy BLOCKED: origin/main FAILS boot-verify. Bot stays on $LOCAL. First error: $(echo "$ERR" | grep -iE 'error|unexpected' | head -1 | cut -c1-90)" 2>/dev/null
  exit 1
fi

# v4: a merge that changes nothing ZOE runs - nothing under bot/ (which also holds the
# files it reads at runtime: brand.md, the systemd unit, package.json) and none of the
# bundle's inputs outside bot/ - does not restart the bot or post a notice. The live
# clone still moves to origin/main so it stays current. `git diff --quiet` exits 0
# only when it read both commits and found no change; 1 (changed) and 128 (could not
# read) both fall through to the normal deploy, as does META_OK=0.
if [ "${ZOE_AUTODEPLOY_SKIP_NONBOT:-0}" = 1 ] && [ "$META_OK" = 1 ] && git -C "$LIVE" diff --quiet "$LOCAL" "$REMOTE" -- bot/ "${EXTRA[@]+"${EXTRA[@]}"}" 2>/dev/null; then
  cd "$LIVE"
  if [ -z "$(git status --porcelain --untracked-files=no)" ]; then
    git merge --ff-only --quiet origin/main 2>/dev/null || true
  fi
  exit 0
fi

# --- verified good: update the live clone + restart + health check + rollback ---
cd "$LIVE"
[ -n "$(git status --porcelain --untracked-files=no)" ] && { ~/bin/zao-status "autodeploy SKIPPED: live clone has TRACKED changes - needs a human" 2>/dev/null; exit 0; }
PREV=$(git rev-parse HEAD)
git checkout --quiet main 2>/dev/null || git checkout --quiet -B main origin/main
git merge --ff-only --quiet origin/main 2>/dev/null || git reset --hard origin/main --quiet 2>/dev/null
(cd bot && timeout 300 npm install --no-audit --no-fund --silent >/dev/null 2>&1)
# discard lockfile churn: npm install rewrites package-lock.json, which
# would make the next run's cleanliness guard skip the deploy forever.
git checkout -- bot/package-lock.json 2>/dev/null || true
# --- install updated systemd user unit if changed -----------------------
UNIT_SRC="$LIVE/bot/systemd/zoe-bot.service"
UNIT_DST="$HOME/.config/systemd/user/zoe-bot.service"
if [ -f "$UNIT_SRC" ]; then
  mkdir -p "$HOME/.config/systemd/user"
  if ! cmp -s "$UNIT_SRC" "$UNIT_DST" 2>/dev/null; then
    cp "$UNIT_SRC" "$UNIT_DST"
    systemctl --user daemon-reload
  fi
fi

systemctl --user restart zoe-bot
sleep 12
if systemctl --user is-active zoe-bot >/dev/null 2>&1 && ! journalctl --user -u zoe-bot --since "20 seconds ago" --no-pager 2>/dev/null | grep -v 'shutting down cleanly' | grep -qiE 'TransformError|Error \[|crash'; then
  ZAO_STATUS_NO_TAG=1 ~/bin/zao-status "autodeploy OK: ZOE live on $(git rev-parse --short HEAD) - $(git log -1 --format=%s | cut -c1-55)" 2>/dev/null
else
  git checkout --quiet "$PREV" 2>/dev/null
  (cd bot && timeout 300 npm install --no-audit --no-fund --silent >/dev/null 2>&1)
# discard lockfile churn: npm install rewrites package-lock.json, which
# would make the next run's cleanliness guard skip the deploy forever.
git checkout -- bot/package-lock.json 2>/dev/null || true
# --- install updated systemd user unit if changed -----------------------
UNIT_SRC="$LIVE/bot/systemd/zoe-bot.service"
UNIT_DST="$HOME/.config/systemd/user/zoe-bot.service"
if [ -f "$UNIT_SRC" ]; then
  mkdir -p "$HOME/.config/systemd/user"
  if ! cmp -s "$UNIT_SRC" "$UNIT_DST" 2>/dev/null; then
    cp "$UNIT_SRC" "$UNIT_DST"
    systemctl --user daemon-reload
  fi
fi

  systemctl --user restart zoe-bot
  ~/bin/zao-status "autodeploy ROLLED BACK: new code crashed at boot despite verify - restored to $PREV" 2>/dev/null
fi
