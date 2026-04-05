#!/bin/bash
set -e

TARGET="${1:?Usage: ./scripts/sync-fishbowlz.sh /path/to/fishbowlz-repo}"
SOURCE="$(cd "$(dirname "$0")/.." && pwd)"

echo "Syncing FISHBOWLZ from $SOURCE to $TARGET"

# Create directory structure
mkdir -p "$TARGET/src/app/fishbowlz"
mkdir -p "$TARGET/src/app/api/fishbowlz"
mkdir -p "$TARGET/src/app/api/100ms"
mkdir -p "$TARGET/src/components/fishbowlz"
mkdir -p "$TARGET/src/components/spaces"
mkdir -p "$TARGET/src/components/ui"
mkdir -p "$TARGET/src/lib/auth"
mkdir -p "$TARGET/src/lib/db"
mkdir -p "$TARGET/src/lib/farcaster"
mkdir -p "$TARGET/src/lib/fishbowlz"
mkdir -p "$TARGET/src/hooks"
mkdir -p "$TARGET/supabase/migrations"
mkdir -p "$TARGET/public"

# ── FISHBOWLZ-specific files ──
echo "Copying FISHBOWLZ pages..."
cp -r "$SOURCE/src/app/fishbowlz/" "$TARGET/src/app/fishbowlz/"

echo "Copying FISHBOWLZ API routes..."
cp -r "$SOURCE/src/app/api/fishbowlz/" "$TARGET/src/app/api/fishbowlz/"
cp -r "$SOURCE/src/app/api/100ms/" "$TARGET/src/app/api/100ms/"

echo "Copying FISHBOWLZ components..."
cp "$SOURCE/src/components/spaces/HMSFishbowlRoom.tsx" "$TARGET/src/components/spaces/"
cp "$SOURCE/src/components/spaces/FishbowlChat.tsx" "$TARGET/src/components/spaces/"
cp "$SOURCE/src/components/spaces/TranscriptInput.tsx" "$TARGET/src/components/spaces/"
cp "$SOURCE/src/components/spaces/TranscriptionControls.tsx" "$TARGET/src/components/spaces/"
cp "$SOURCE/src/components/spaces/TranscriptionButton.tsx" "$TARGET/src/components/spaces/"
cp "$SOURCE/src/components/ui/Toast.tsx" "$TARGET/src/components/ui/"

# Copy fishbowlz-specific components
if [ -d "$SOURCE/src/components/fishbowlz" ]; then
  cp -r "$SOURCE/src/components/fishbowlz/" "$TARGET/src/components/fishbowlz/"
fi

echo "Copying FISHBOWLZ lib..."
cp -r "$SOURCE/src/lib/fishbowlz/" "$TARGET/src/lib/fishbowlz/"

echo "Copying FC identity lib..."
cp "$SOURCE/src/lib/fc-identity.ts" "$TARGET/src/lib/"

echo "Copying FISHBOWLZ hooks..."
cp "$SOURCE/src/hooks/useAuth.ts" "$TARGET/src/hooks/" 2>/dev/null || true
cp "$SOURCE/src/hooks/useLiveTranscript.ts" "$TARGET/src/hooks/" 2>/dev/null || true

# ── Shared dependencies ──
echo "Copying shared deps (auth, db, farcaster)..."
cp "$SOURCE/src/lib/auth/session.ts" "$TARGET/src/lib/auth/"
cp "$SOURCE/src/lib/db/supabase.ts" "$TARGET/src/lib/db/"
cp "$SOURCE/src/lib/farcaster/neynar.ts" "$TARGET/src/lib/farcaster/" 2>/dev/null || true

# ── Database migrations ──
echo "Copying migrations..."
cp "$SOURCE/supabase/migrations/"*fishbowl* "$TARGET/supabase/migrations/" 2>/dev/null || true
cp "$SOURCE/supabase/migrations/"*fc_identity* "$TARGET/supabase/migrations/" 2>/dev/null || true

# ── Static assets ──
echo "Copying globals.css..."
cp "$SOURCE/src/app/globals.css" "$TARGET/src/app/"

# ── Config files ──
echo "Copying config..."
cp "$SOURCE/tsconfig.json" "$TARGET/"
cp "$SOURCE/.eslintrc.json" "$TARGET/" 2>/dev/null || true
cp "$SOURCE/eslint.config.mjs" "$TARGET/" 2>/dev/null || true
cp "$SOURCE/tailwind.config.ts" "$TARGET/" 2>/dev/null || true
cp "$SOURCE/postcss.config.mjs" "$TARGET/" 2>/dev/null || true

echo ""
echo "Sync complete!"
echo ""
echo "Next steps:"
echo "  1. cd $TARGET"
echo "  2. Review/create package.json with fishbowlz deps"
echo "  3. Review/create src/app/layout.tsx"
echo "  4. Review/create src/app/page.tsx (landing page)"
echo "  5. Review/create next.config.ts"
echo "  6. Copy .env.local from ZAO OS (see scripts/fishbowlz-standalone-files.md for required vars)"
echo "  7. Stub any ZAO-specific imports that don't copy cleanly"
echo "  8. npm install && npm run dev"
