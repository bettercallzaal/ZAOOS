#!/usr/bin/env bash
# Vercel ignoreCommand logic. Exit 0 = SKIP the build, non-zero = BUILD.
# Lives in a file because Vercel caps the inline `ignoreCommand` at 256 chars
# (a longer inline value fails vercel.json schema validation and errors EVERY
# deploy - see the 2026-07-27 incident).
#
# 2026-08-18: the previous version built EVERY docs-only main commit (~$22/mo
# of Build CPU, 94% of the project's Vercel bill) because Vercel's shallow
# clone rarely contains VERCEL_GIT_PREVIOUS_SHA, and "SHA missing -> build"
# fired on nearly every deploy. This version fetches the missing SHA, falls
# back to diffing the commit itself, and logs its decision so the build log
# shows WHY it built or skipped.

BUILD_PATHS=(src public package.json package-lock.json next.config.ts tsconfig.json community.config.ts vercel.json scripts/vercel-ignore.sh)

# 1. Only ever build production. Preview/branch deploys skip entirely - saves
#    the Vercel spend and stops failing-preview emails.
if [ "${VERCEL_ENV:-}" != "production" ]; then
  echo "[vercel-ignore] non-production (${VERCEL_ENV:-unset}) -> SKIP"
  exit 0
fi

# 2. Make the previous deploy's SHA reachable. The clone is shallow, so the
#    SHA is usually absent - fetch just that object before giving up on it.
PREV="${VERCEL_GIT_PREVIOUS_SHA:-}"
if [ -n "$PREV" ] && ! git cat-file -e "$PREV" 2>/dev/null; then
  git fetch --depth=1 origin "$PREV" 2>/dev/null || true
fi

# 3. Diff base: the previous deploy's SHA when reachable, else this commit's
#    parent (deepen by one if the shallow clone lacks it). Only when NO base
#    exists do we fall through to the safe default of building.
BASE=""
if [ -n "$PREV" ] && git cat-file -e "$PREV" 2>/dev/null; then
  BASE="$PREV"
else
  git rev-parse --verify -q HEAD^ >/dev/null 2>&1 || git fetch --deepen=1 origin 2>/dev/null || true
  if git rev-parse --verify -q HEAD^ >/dev/null 2>&1; then
    BASE="HEAD^"
  fi
fi
if [ -z "$BASE" ]; then
  echo "[vercel-ignore] no diff base reachable (prev=${PREV:-unset}) -> BUILD (safe default)"
  exit 1
fi

# 4. Build only if a build-relevant file changed since the base. git diff
#    --quiet exits 0 (no change -> SKIP) or 1 (changed -> BUILD).
if git diff --quiet "$BASE" HEAD -- "${BUILD_PATHS[@]}"; then
  echo "[vercel-ignore] no build-relevant change vs $BASE -> SKIP"
  exit 0
else
  echo "[vercel-ignore] build-relevant change vs $BASE -> BUILD"
  exit 1
fi
