# Cross-Platform Distribution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add multi-platform publishing (Lens, enhanced Bluesky, X/Twitter admin-only, Hive/InLeo) to ZAO OS so members compose once and publish everywhere.

**Architecture:** Extends existing ComposeBar cross-posting pattern (already supports Farcaster channels + Bluesky). Each platform gets a publish library (`src/lib/publish/`), an API route (`src/app/api/publish/`), and integration into the unified PlatformToggles UI. Farcaster is always primary; cross-posts fire-and-forget after success.

**Tech Stack:** Next.js 16, `@lens-protocol/client`, `@atproto/api` (existing), `twitter-api-v2`, `@hiveio/dhive`, Supabase, Zod, Tailwind CSS v4.

**Spec:** `docs/superpowers/specs/2026-03-23-cross-platform-distribution-design.md`

---

## File Map

### Create
| File | Responsibility |
|------|---------------|
| `scripts/add-publishing-columns.sql` | DB migration: user columns + publish_log table |
| `src/lib/publish/normalize.ts` | Content normalization per platform (truncation, embeds, attribution) |
| `src/lib/publish/lens.ts` | Lens Protocol client + posting helpers |
| `src/lib/publish/x.ts` | X/Twitter API client (OAuth 1.0a) |
| `src/lib/publish/hive.ts` | Hive dhive client + posting key encryption |
| `src/app/api/publish/lens/route.ts` | POST: publish to Lens |
| `src/app/api/publish/x/route.ts` | POST: publish to X (admin-only) |
| `src/app/api/publish/hive/route.ts` | POST: publish to Hive |
| `src/app/api/publish/status/route.ts` | GET: publish status for a cast hash |
| `src/app/api/platforms/lens/route.ts` | POST/DELETE: connect/disconnect Lens |
| `src/app/api/platforms/hive/route.ts` | POST/DELETE: connect/disconnect Hive |
| `src/components/compose/PlatformToggles.tsx` | Toggle pills for platform selection |
| `src/components/compose/PublishButton.tsx` | "Publish (N)" / "Send" button |
| `src/components/settings/ConnectedPlatforms.tsx` | Platform connection management UI |

### Modify
| File | Change |
|------|--------|
| `src/components/chat/ComposeBar.tsx` | Replace inline cross-post UI with PlatformToggles + PublishButton |
| `src/app/api/chat/send/route.ts` | Add Lens/X/Hive fire-and-forget cross-posts alongside existing Bluesky |
| `src/lib/validation/schemas.ts` | Add `crossPostLens`, `crossPostX`, `crossPostHive` to sendMessageSchema |
| `src/app/(auth)/settings/SettingsClient.tsx` | Add ConnectedPlatforms section |
| `src/lib/env.ts` | Add X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET, PERSPECTIVE_API_KEY |
| `src/middleware.ts` | Add rate limits for `/api/publish/*` and `/api/platforms/*` |

---

## Task 1: Database Migration

**Files:**
- Create: `scripts/add-publishing-columns.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- Publishing preferences + platform credentials
ALTER TABLE users ADD COLUMN IF NOT EXISTS publishing_prefs JSONB
  DEFAULT '{"crossPostEnabled": false, "defaultPlatforms": ["farcaster"]}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS lens_profile_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lens_access_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lens_refresh_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hive_username TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hive_posting_key_encrypted TEXT;

-- Publish log table
CREATE TABLE IF NOT EXISTS publish_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cast_hash TEXT NOT NULL,
  fid INTEGER NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('lens', 'bluesky', 'x', 'hive')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  platform_post_id TEXT,
  platform_url TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_publish_log_cast ON publish_log (cast_hash);
CREATE INDEX IF NOT EXISTS idx_publish_log_fid ON publish_log (fid);
CREATE INDEX IF NOT EXISTS idx_publish_log_failed ON publish_log (status) WHERE status = 'failed';

ALTER TABLE publish_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON publish_log FOR ALL USING (true) WITH CHECK (true);
```

- [ ] **Step 2: Run migration in Supabase SQL Editor**
- [ ] **Step 3: Commit**

```bash
git add scripts/add-publishing-columns.sql
git commit -m "chore: add publishing columns + publish_log table"
```

---

## Task 2: Content Normalization Library

**Files:**
- Create: `src/lib/publish/normalize.ts`

- [ ] **Step 1: Create the normalize module**

This is the shared content transformation layer. Each platform gets a normalizer that adapts text length, embeds, and attribution.

```typescript
// src/lib/publish/normalize.ts

export interface NormalizedContent {
  text: string;
  images: string[];
  embeds: { url: string; title?: string; description?: string }[];
  attribution: string;
  castHash: string;
  castUrl: string;
}

interface NormalizeInput {
  text: string;
  castHash: string;
  embedUrls?: string[];
  imageUrls?: string[];
  channel?: string;
}

const CAST_BASE_URL = 'https://warpcast.com/~/conversations/';

function buildCastUrl(castHash: string): string {
  return `${CAST_BASE_URL}${castHash}`;
}

export function normalizeForLens(input: NormalizeInput): NormalizedContent {
  const castUrl = buildCastUrl(input.castHash);
  const attribution = '\n\nPosted via ZAO OS';
  return {
    text: input.text + attribution,
    images: input.imageUrls || [],
    embeds: (input.embedUrls || []).map(url => ({ url })),
    attribution,
    castHash: input.castHash,
    castUrl,
  };
}

export function normalizeForBluesky(input: NormalizeInput): NormalizedContent {
  const castUrl = buildCastUrl(input.castHash);
  const attribution = '\n\nvia ZAO OS';
  const maxLen = 300 - attribution.length - 1;
  const truncated = input.text.length > maxLen
    ? input.text.slice(0, maxLen - 1) + '…'
    : input.text;
  return {
    text: truncated + attribution,
    images: input.imageUrls || [],
    embeds: (input.embedUrls || []).map(url => ({ url })),
    attribution,
    castHash: input.castHash,
    castUrl,
  };
}

export function normalizeForX(input: NormalizeInput): NormalizedContent {
  const castUrl = buildCastUrl(input.castHash);
  // t.co wraps links to 23 chars
  const linkLen = 23;
  const maxTextLen = 280 - linkLen - 2; // 2 for \n\n
  const truncated = input.text.length > maxTextLen
    ? input.text.slice(0, maxTextLen - 1) + '…'
    : input.text;
  return {
    text: truncated + '\n\n' + castUrl,
    images: (input.imageUrls || []).slice(0, 4), // X allows max 4
    embeds: [],
    attribution: castUrl,
    castHash: input.castHash,
    castUrl,
  };
}

export function normalizeForHive(input: NormalizeInput): NormalizedContent {
  const castUrl = buildCastUrl(input.castHash);
  const imageMarkdown = (input.imageUrls || [])
    .map(url => `![](${url})`)
    .join('\n');
  const embedMarkdown = (input.embedUrls || [])
    .map(url => `[${url}](${url})`)
    .join('\n');
  const footer = [
    '',
    '---',
    `*Originally posted on [Farcaster](${castUrl}) via [ZAO OS](https://zaoos.com)*`,
  ].join('\n');

  const fullText = [input.text, imageMarkdown, embedMarkdown, footer]
    .filter(Boolean)
    .join('\n\n');

  return {
    text: fullText,
    images: input.imageUrls || [],
    embeds: (input.embedUrls || []).map(url => ({ url })),
    attribution: footer,
    castHash: input.castHash,
    castUrl,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/publish/normalize.ts
git commit -m "feat: content normalization library for cross-platform publishing"
```

---

## Task 3: Lens Protocol Client + API Route

**Files:**
- Create: `src/lib/publish/lens.ts`
- Create: `src/app/api/publish/lens/route.ts`
- Create: `src/app/api/platforms/lens/route.ts`

- [ ] **Step 1: Install Lens SDK**

```bash
npm install @lens-protocol/client@latest
```

- [ ] **Step 2: Create Lens client library**

`src/lib/publish/lens.ts` — handles Lens session creation, token refresh, and posting. Uses `@lens-protocol/client` SDK. Stores tokens in Supabase users table (`lens_access_token`, `lens_refresh_token`, `lens_profile_id`).

Key functions:
- `getLensClient()` — singleton Lens client
- `authenticateLens(walletAddress)` — generate challenge, sign, get tokens
- `publishToLens(profileId, content: NormalizedContent)` — create post on Lens
- `refreshLensToken(refreshToken)` — auto-refresh expired tokens

- [ ] **Step 3: Create Lens publish route**

`src/app/api/publish/lens/route.ts` — POST handler:
- Session check
- Zod validate body: `{ castHash, text, embedUrls?, imageUrls?, channel? }`
- Fetch user's Lens credentials from DB
- If no credentials, return 400 "Lens not connected"
- Call `normalizeForLens()` then `publishToLens()`
- Log result to `publish_log`
- Return `{ success, platformUrl }`

- [ ] **Step 4: Create Lens connect/disconnect route**

`src/app/api/platforms/lens/route.ts`:
- POST: Accept `{ profileId, accessToken, refreshToken }`, store in users table
- DELETE: Null out Lens columns in users table

- [ ] **Step 5: Commit**

```bash
git add src/lib/publish/lens.ts src/app/api/publish/lens/route.ts src/app/api/platforms/lens/route.ts
git commit -m "feat: Lens Protocol publishing — client, API route, connect flow"
```

---

## Task 4: X/Twitter Client + API Route (Admin-Only)

**Files:**
- Create: `src/lib/publish/x.ts`
- Create: `src/app/api/publish/x/route.ts`
- Modify: `src/lib/env.ts`

- [ ] **Step 1: Install Twitter SDK**

```bash
npm install twitter-api-v2
```

- [ ] **Step 2: Add env vars to env.ts**

Add to optional env vars in `src/lib/env.ts`:
```typescript
X_API_KEY: process.env.X_API_KEY,
X_API_SECRET: process.env.X_API_SECRET,
X_ACCESS_TOKEN: process.env.X_ACCESS_TOKEN,
X_ACCESS_SECRET: process.env.X_ACCESS_SECRET,
```

- [ ] **Step 3: Create X client library**

`src/lib/publish/x.ts`:
- `getXClient()` — creates `TwitterApi` with OAuth 1.0a user context from env vars
- `publishToX(content: NormalizedContent)` — post tweet via v2 API, handle image upload via v1.1 media endpoint
- Returns `{ tweetId, tweetUrl }` or throws

- [ ] **Step 4: Create X publish route**

`src/app/api/publish/x/route.ts` — POST handler:
- Session check + **admin check** (`if (!session.isAdmin) return 403`)
- Zod validate body
- Check env vars exist (return 503 if X not configured)
- Call `normalizeForX()` then `publishToX()`
- Log to `publish_log`
- Return `{ success, platformUrl }`

- [ ] **Step 5: Commit**

```bash
git add src/lib/publish/x.ts src/app/api/publish/x/route.ts src/lib/env.ts
git commit -m "feat: X/Twitter publishing — admin-only, OAuth 1.0a"
```

---

## Task 5: Hive/InLeo Client + API Route

**Files:**
- Create: `src/lib/publish/hive.ts`
- Create: `src/app/api/publish/hive/route.ts`
- Create: `src/app/api/platforms/hive/route.ts`

- [ ] **Step 1: Install Hive SDK**

```bash
npm install @hiveio/dhive
```

- [ ] **Step 2: Create Hive client library**

`src/lib/publish/hive.ts`:
- `encryptPostingKey(key, secret)` — AES-256-GCM encrypt using SESSION_SECRET
- `decryptPostingKey(encrypted, secret)` — decrypt for publish-time use
- `getHiveClient()` — dhive Client pointed at `api.hive.blog`
- `publishToHive(username, postingKey, content: NormalizedContent, tags: string[])` — broadcast comment operation
- Default tags: `['zao', 'music', 'web3', 'farcaster', 'inleo']`
- Permlink generation: `zao-{timestamp}-{random}` for uniqueness

- [ ] **Step 3: Create Hive publish route**

`src/app/api/publish/hive/route.ts` — POST handler:
- Session check
- Zod validate body
- Fetch `hive_username` + `hive_posting_key_encrypted` from DB
- If not connected, return 400
- Decrypt posting key server-side
- Call `normalizeForHive()` then `publishToHive()`
- Log to `publish_log`
- Return `{ success, platformUrl }`

- [ ] **Step 4: Create Hive connect/disconnect route**

`src/app/api/platforms/hive/route.ts`:
- POST: Accept `{ username, postingKey }`, verify by attempting a dummy read, encrypt key, store
- DELETE: Null out Hive columns

- [ ] **Step 5: Commit**

```bash
git add src/lib/publish/hive.ts src/app/api/publish/hive/route.ts src/app/api/platforms/hive/route.ts
git commit -m "feat: Hive/InLeo publishing — encrypted posting key, dhive SDK"
```

---

## Task 6: Bluesky Enhancements

**Files:**
- Modify: `src/lib/bluesky/client.ts`

- [ ] **Step 1: Add thread splitting**

Add to `src/lib/bluesky/client.ts`:
```typescript
export async function postBlueskyThread(
  texts: string[],
  agent: AtpAgent,
): Promise<string[]> {
  // Post first, then reply-chain the rest
}

export function splitIntoThread(text: string, maxLen = 300): string[] {
  if (text.length <= maxLen) return [text];
  // Split on sentence boundaries, then word boundaries
}
```

- [ ] **Step 2: Add image upload support**

Add to `src/lib/bluesky/client.ts`:
```typescript
export async function uploadBlueskyImage(
  agent: AtpAgent,
  imageUrl: string,
): Promise<BlobRef> {
  // Fetch image, upload via agent.uploadBlob()
}
```

- [ ] **Step 3: Add embed card support**

When posting, if embedUrls exist, create `app.bsky.embed.external` with fetched OG metadata.

- [ ] **Step 4: Commit**

```bash
git add src/lib/bluesky/client.ts
git commit -m "feat: Bluesky enhancements — threads, images, embed cards"
```

---

## Task 7: Publish Status API

**Files:**
- Create: `src/app/api/publish/status/route.ts`

- [ ] **Step 1: Create status endpoint**

```typescript
// GET /api/publish/status?castHash=0x...
// Returns publish results for a cast across all platforms
// Response: { results: [{ platform, status, platformUrl, error }] }
```

- Session check
- Zod validate `castHash` query param
- Query `publish_log` WHERE `cast_hash = castHash AND fid = session.fid`
- Return array of results

- [ ] **Step 2: Commit**

```bash
git add src/app/api/publish/status/route.ts
git commit -m "feat: publish status API — check cross-post results per cast"
```

---

## Task 8: PlatformToggles + PublishButton Components

**Files:**
- Create: `src/components/compose/PlatformToggles.tsx`
- Create: `src/components/compose/PublishButton.tsx`

- [ ] **Step 1: Create PlatformToggles component**

`src/components/compose/PlatformToggles.tsx`:
- Props: `{ platforms, onToggle, isAdmin }`
- Platform config array: `[{ id: 'lens', name: 'Lens', icon, color: '#00501e' }, { id: 'bluesky', name: 'Bluesky', icon, color: '#0085ff' }, { id: 'x', name: 'X', icon, color: '#ffffff', adminOnly: true }, { id: 'hive', name: 'Hive', icon, color: '#e31337' }]`
- Each pill shows: icon + name + checkmark if active, gray border if disconnected
- Tapping disconnected pill shows inline "Connect in Settings" link
- X pill only visible if `isAdmin`
- Farcaster always shown as non-toggleable (always on)
- Dark theme: navy bg, gold accent for active state

- [ ] **Step 2: Create PublishButton component**

`src/components/compose/PublishButton.tsx`:
- Props: `{ activePlatformCount, crossPostEnabled, onToggleCrossPost, onSubmit, disabled, loading }`
- When `crossPostEnabled` is OFF: render "Send" button (current style)
- When ON: render "Publish (N)" button with gold gradient
- Small toggle icon/switch to flip between modes
- Count = activePlatformCount (includes Farcaster)

- [ ] **Step 3: Commit**

```bash
git add src/components/compose/PlatformToggles.tsx src/components/compose/PublishButton.tsx
git commit -m "feat: PlatformToggles + PublishButton components"
```

---

## Task 9: Update ComposeBar

**Files:**
- Modify: `src/components/chat/ComposeBar.tsx`
- Modify: `src/lib/validation/schemas.ts`

- [ ] **Step 1: Update sendMessageSchema**

Add to `src/lib/validation/schemas.ts`:
```typescript
crossPostLens: z.boolean().optional(),
crossPostX: z.boolean().optional(),
crossPostHive: z.boolean().optional(),
```

- [ ] **Step 2: Refactor ComposeBar**

Replace the inline cross-post channel grid + Bluesky button (lines ~414-477) with:
```tsx
import PlatformToggles from '@/components/compose/PlatformToggles';
import PublishButton from '@/components/compose/PublishButton';
```

Changes:
- Add state: `crossPostLens`, `crossPostX`, `crossPostHive` booleans
- Fetch user's `publishing_prefs` on mount to set defaults
- Replace inline channel/Bluesky selector with `<PlatformToggles>`
- Replace Send button with `<PublishButton>`
- Pass new cross-post flags through `onSend()` callback
- Keep existing crossPostChannels (Farcaster multi-channel) logic intact

- [ ] **Step 3: Commit**

```bash
git add src/components/chat/ComposeBar.tsx src/lib/validation/schemas.ts
git commit -m "feat: integrate PlatformToggles + PublishButton into ComposeBar"
```

---

## Task 10: Update Send Route for Multi-Platform

**Files:**
- Modify: `src/app/api/chat/send/route.ts`

- [ ] **Step 1: Add cross-post dispatching**

After the existing Bluesky cross-post block (lines 96-117), add parallel fire-and-forget calls:

```typescript
// Lens cross-post
if (crossPostLens && !parentHash) {
  (async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/publish/lens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie: req.headers.get('cookie') || '' },
        body: JSON.stringify({ castHash: cast.hash, text, embedUrls, imageUrls, channel }),
      });
    } catch (e) { console.error('[cross-post] Lens failed:', e); }
  })();
}

// X cross-post (admin only — route enforces this too)
if (crossPostX && !parentHash && session.isAdmin) {
  // same pattern as above, POST to /api/publish/x
}

// Hive cross-post
if (crossPostHive && !parentHash) {
  // same pattern, POST to /api/publish/hive
}
```

- [ ] **Step 2: Update response to include all cross-post results**

Add `crossPostedPlatforms` array to response alongside existing `crossPosted` channels.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/chat/send/route.ts
git commit -m "feat: dispatch Lens/X/Hive cross-posts from send route"
```

---

## Task 11: Connected Platforms Settings

**Files:**
- Create: `src/components/settings/ConnectedPlatforms.tsx`
- Modify: `src/app/(auth)/settings/SettingsClient.tsx`

- [ ] **Step 1: Create ConnectedPlatforms component**

`src/components/settings/ConnectedPlatforms.tsx`:
- Fetches connection status for all platforms on mount
- Shows card per platform: icon, name, status (connected/not), connect/disconnect button
- **Bluesky**: reuses existing connect flow (handle + app password form)
- **Lens**: "Connect Lens" button → opens Lens login flow (wallet signature)
- **X**: shows "Admin only — configured by ZAO" if admin, hidden otherwise
- **Hive**: username + posting key form (password-masked input)
- Each platform card matches dark theme styling
- "Cross-post by default" toggle per platform

- [ ] **Step 2: Integrate into SettingsClient**

Add `<ConnectedPlatforms />` as a new section in the settings page, below the existing Bluesky connection UI. Migrate existing Bluesky connection state into the new component.

- [ ] **Step 3: Commit**

```bash
git add src/components/settings/ConnectedPlatforms.tsx src/app/\(auth\)/settings/SettingsClient.tsx
git commit -m "feat: Connected Platforms settings — manage all platform connections"
```

---

## Task 12: Rate Limits + Polish

**Files:**
- Modify: `src/middleware.ts`

- [ ] **Step 1: Add rate limits**

```typescript
// Publishing routes
{ pattern: '/api/publish', limit: 5, window: 60 },
{ pattern: '/api/platforms', limit: 10, window: 60 },
```

- [ ] **Step 2: Install dependencies**

```bash
npm install @lens-protocol/client twitter-api-v2 @hiveio/dhive
```

- [ ] **Step 3: Add env vars to .env.example**

```env
# Cross-platform publishing (optional)
X_API_KEY=
X_API_SECRET=
X_ACCESS_TOKEN=
X_ACCESS_SECRET=
```

- [ ] **Step 4: Final commit**

```bash
git add src/middleware.ts .env.example package.json package-lock.json
git commit -m "feat: rate limits + dependencies for cross-platform publishing"
```

---

## Dependency Graph

```
Task 1 (DB migration) ─── no deps, run first
Task 2 (normalize.ts) ─── no deps
     │
     ├── Task 3 (Lens) ──── needs normalize
     ├── Task 4 (X) ─────── needs normalize + env.ts
     ├── Task 5 (Hive) ──── needs normalize
     └── Task 6 (Bluesky) ── independent enhancement

Task 7 (status API) ────── needs publish_log table (Task 1)
Task 8 (UI components) ─── no deps
Task 9 (ComposeBar) ────── needs Task 8
Task 10 (send route) ───── needs Tasks 3-5 routes to exist
Task 11 (settings) ─────── needs Tasks 3-5 connect routes
Task 12 (polish) ────────── last
```

**Parallelizable:** Tasks 3, 4, 5, 6 can all run simultaneously after Tasks 1-2.
**Parallelizable:** Tasks 7, 8 can run simultaneously.
