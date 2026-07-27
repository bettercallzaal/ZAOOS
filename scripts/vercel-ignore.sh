#!/usr/bin/env bash
# Vercel ignoreCommand logic. Exit 0 = SKIP the build, non-zero = BUILD.
# Lives in a file because Vercel caps the inline `ignoreCommand` at 256 chars
# (a longer inline value fails vercel.json schema validation and errors EVERY
# deploy - see the 2026-07-27 incident).
#
# 1. Only ever build production. Preview/branch deploys skip entirely - saves
#    the (over-budget) Vercel spend and stops failing-preview emails.
[ "${VERCEL_ENV:-}" = "production" ] || exit 0
# 2. Production: if the previous deploy's SHA is missing from the shallow clone,
#    build (safe default - can't diff, so don't risk skipping a real change).
git cat-file -e "$VERCEL_GIT_PREVIOUS_SHA" 2>/dev/null || exit 1
# 3. Build only if a build-relevant file changed since that SHA. git diff --quiet
#    exits 0 (no change -> SKIP) or 1 (changed -> BUILD); that becomes our exit.
git diff --quiet "$VERCEL_GIT_PREVIOUS_SHA" "$VERCEL_GIT_COMMIT_SHA" -- \
  src public package.json package-lock.json next.config.ts tsconfig.json community.config.ts vercel.json
