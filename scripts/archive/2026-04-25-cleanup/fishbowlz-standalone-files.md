# FISHBOWLZ Standalone Extraction

## Auto-synced files (via sync-fishbowlz.sh)

### Pages
- src/app/fishbowlz/page.tsx — room list
- src/app/fishbowlz/[id]/page.tsx — room detail
- src/app/fishbowlz/[id]/opengraph-image.tsx — OG images

### API Routes
- src/app/api/fishbowlz/rooms/route.ts
- src/app/api/fishbowlz/rooms/[id]/route.ts
- src/app/api/fishbowlz/chat/route.ts
- src/app/api/fishbowlz/events/route.ts
- src/app/api/fishbowlz/sessions/route.ts
- src/app/api/fishbowlz/transcribe/route.ts
- src/app/api/fishbowlz/transcripts/route.ts
- src/app/api/fishbowlz/export/route.ts
- src/app/api/100ms/token/route.ts
- src/app/api/100ms/rooms/route.ts
- src/app/api/100ms/rooms/[id]/route.ts

### Components
- src/components/spaces/HMSFishbowlRoom.tsx
- src/components/spaces/FishbowlChat.tsx
- src/components/spaces/TranscriptInput.tsx
- src/components/spaces/TranscriptionControls.tsx
- src/components/spaces/TranscriptionButton.tsx
- src/components/ui/Toast.tsx
- src/components/fishbowlz/RoomCardSkeleton.tsx
- src/components/fishbowlz/EmptyState.tsx
- src/components/fishbowlz/OnboardingModal.tsx
- src/components/fishbowlz/Reactions.tsx

### Lib
- src/lib/fishbowlz/logger.ts
- src/lib/fishbowlz/castRoom.ts
- src/lib/fishbowlz/summarize.ts
- src/lib/auth/session.ts
- src/lib/db/supabase.ts
- src/lib/farcaster/neynar.ts
- src/lib/fc-identity.ts

### Hooks
- src/hooks/useAuth.ts
- src/hooks/useLiveTranscript.ts

### Database
- supabase/migrations/20260404_fishbowlz.sql
- supabase/migrations/20260405_fishbowl_chat.sql
- supabase/migrations/20260405_fc_identity_gating.sql
- supabase/migrations/20260405_fishbowl_scheduled.sql
- supabase/migrations/20260405_fishbowl_hand_raise.sql
- supabase/migrations/20260405_fishbowl_rotation_timer.sql
- supabase/migrations/20260405_fishbowl_summary.sql

## Manual steps after sync

1. **package.json** — create a subset of ZAO OS deps. Core deps needed:
   - `next`, `react`, `react-dom`, `typescript`
   - `@supabase/supabase-js`
   - `@100mslive/react-sdk`, `@100mslive/roomkit-react`
   - `@neynar/nodejs-sdk`
   - `iron-session`
   - `zod`
   - `tailwindcss`, `@tailwindcss/postcss`
   - `@anthropic-ai/sdk` (for AI summaries in summarize.ts)

2. **src/app/layout.tsx** — standalone layout with ToastProvider. Does not need
   ZAO OS navigation, auth guards, or music player.

3. **src/app/page.tsx** — landing page. Can be a simple redirect to `/fishbowlz`
   or a minimal marketing page before auth.

4. **next.config.ts** — minimal config. Likely needs:
   - `images.domains` for Farcaster avatar CDNs
   - No XMTP WASM or patch-package needed

5. **.env.local** — copy from ZAO OS but trim to only the vars listed below.

6. **Import stubs** — after copying, scan for any `@/` imports that reference
   ZAO OS modules not in the file list above. Common ones to stub or inline:
   - `@/lib/gates/*` — if referenced, extract only the Farcaster-gating logic
   - `@/types/*` — copy relevant type definitions
   - `@/community.config.ts` — create a minimal fishbowlz-specific version

7. **Vercel** — add `fishbowlz.com` domain in project settings, set env vars.

8. **Supabase** — the standalone project can share the same Supabase instance as
   ZAO OS (same DB, same tables), or point to a separate project. Run migrations
   only once per DB.

## Env vars needed

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_100MS_ACCESS_KEY
HMS_APP_SECRET
NEXT_PUBLIC_100MS_TEMPLATE_ID
NEYNAR_API_KEY
ZAO_OFFICIAL_SIGNER_UUID
ZAO_OFFICIAL_NEYNAR_API_KEY
SESSION_SECRET
ANTHROPIC_API_KEY
NEXT_PUBLIC_SITE_URL=https://fishbowlz.com
```

## Notes on shared Supabase

FISHBOWLZ can safely share the ZAO OS Supabase instance — all fishbowl tables are
prefixed with `fishbowl_` and RLS policies are already scoped per user. The service
role key is the same. No schema conflicts with ZAO OS tables.
