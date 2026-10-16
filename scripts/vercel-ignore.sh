#!/usr/bin/env bash
# Vercel ignoreCommand logic. Exit 0 = SKIP the build, non-zero = BUILD.
# Lives in a file because Vercel caps the inline `ignoreCommand` at 256 chars
# (a longer inline value fails vercel.json schema validation and errors EVERY
# deploy - see the 2026-07-27 incident).
#
# 2026-08-18: the previous version built EVERY docs-only main commit (~$22/mo
# of Build CPU, 94% of the project's Vercel bill) because Vercel's shallow
# clone rarely contains VERCEL_GIT_PREVIOUS_SHA, and "SHA missing -> build"
# fired on nearly every deploy. This version fetches the missing SHA and logs
# its decision so the build log shows WHY it built or skipped. (Its fallback
# to diffing the commit itself was removed on 2026-10-16; see step 2.)

BUILD_PATHS=(src public package.json package-lock.json next.config.ts tsconfig.json community.config.ts vercel.json scripts/vercel-ignore.sh)

# 1. Only ever build production. Preview/branch deploys skip entirely - saves
#    the Vercel spend and stops failing-preview emails.
if [ "${VERCEL_ENV:-}" != "production" ]; then
  echo "[vercel-ignore] non-production (${VERCEL_ENV:-unset}) -> SKIP"
  exit 0
fi

# 2. Diff base: the previous deploy's SHA, fetched if the shallow clone lacks
#    it. No previous SHA, or one still unreachable after the fetch, BUILDS.
#    2026-10-16: the HEAD^ fallback added on 2026-08-18 is gone. When the last
#    deploy was several commits back, HEAD^ misses the earlier ones, so a src
#    change followed by a docs commit in one push skipped (found in review of
#    ZAODEVZ/ZAOstock #474, which copied this logic). The fetch above is what
#    makes the SHA reachable for main deploys; if build logs show "not
#    reachable" often, the cost the fallback saved is back and worth a look.
PREV="${VERCEL_GIT_PREVIOUS_SHA:-}"
if [ -z "$PREV" ]; then
  echo "[vercel-ignore] no previous deploy sha -> BUILD (safe default)"
  exit 1
fi
if ! git cat-file -e "$PREV" 2>/dev/null; then
  git fetch --depth=1 origin "$PREV" 2>/dev/null || true
fi
if ! git cat-file -e "$PREV" 2>/dev/null; then
  echo "[vercel-ignore] previous deploy sha $PREV is not reachable -> BUILD (safe default)"
  exit 1
fi
BASE="$PREV"

# 3. Build only if a build-relevant file changed since the base. git diff
#    --quiet exits 0 (no change -> SKIP) or 1 (changed -> BUILD).
if git diff --quiet "$BASE" HEAD -- "${BUILD_PATHS[@]}"; then
  echo "[vercel-ignore] no build-relevant change vs $BASE -> SKIP"
  exit 0
else
  echo "[vercel-ignore] build-relevant change vs $BASE -> BUILD"
  exit 1
fi
