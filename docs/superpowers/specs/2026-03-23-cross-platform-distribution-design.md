# Cross-Platform Distribution — Design Spec

> **Date:** March 23, 2026
> **Status:** Approved
> **Sprint:** 7 (moved up from 2027 roadmap)
> **Priority order:** Lens → Bluesky (deepen) → X/Twitter (admin-only) → Hive/InLeo

---

## 1. Problem

ZAO members post to Farcaster only. Their content doesn't reach audiences on Lens, X, Hive, or other platforms. Cross-posting manually is tedious — members won't do it. ZAO OS should publish everywhere from one compose action.

## 2. Solution

Multi-platform publishing integrated into the existing ComposeBar. Users compose once, toggle platforms, and hit "Publish (N)" to distribute simultaneously. Farcaster is always primary; other platforms receive fire-and-forget copies.

## 3. UX Flow

### ComposeBar Changes

- **Cross-post toggle** (persistent per user): OFF = "Send" button (Farcaster only), ON = "Publish (N)" button
- When ON, **platform toggle pills** appear below the compose input
- Each pill shows: platform icon + name + connected/disconnected state
- Tapping a disconnected pill triggers inline connect prompt
- "Publish (N)" count updates live as pills are toggled
- User's default selections persist via `publishing_prefs` JSONB on users table

### Toggle States

```
[OFF mode]
┌─────────────────────────────────────┐
│ What's on your mind?                │
│                                     │
│                          [Send]     │
└─────────────────────────────────────┘

[ON mode — 3 platforms selected]
┌─────────────────────────────────────┐
│ What's on your mind?                │
│                                     │
│ [Lens ✓] [Bluesky ✓] [Hive ✓] [X]  │
│                      [Publish (3)]  │
└─────────────────────────────────────┘
```

### Settings: Connected Platforms

Location: `/settings` page, new "Connected Platforms" section.

Each platform shows:
- Icon + name
- Status: "Connected as @username" (green dot) or "Not connected" (gray)
- Connect / Disconnect button
- Platform-specific connect flow (OAuth, key input, etc.)

## 4. Platform Integration Details

### 4.1 Lens Protocol (Free — Priority 1)

**Auth flow:**
- User clicks "Connect Lens" in settings or inline prompt
- OAuth via `@lens-protocol/client` SDK
- Store `lens_profile_id` and `lens_access_token` (+ refresh token) on users table
- Tokens auto-refresh on expiry

**Posting:**
- `POST /api/publish/lens`
- Uses Lens SDK `createPost()` with text content
- Images: upload to Lens storage, attach as media
- Music links: include Songlink URL as OpenAction embed
- Mentions: convert @farcaster handles to @lens handles where known

**Content normalization:**
- No character limit (Lens supports long-form)
- Full text + all embeds pass through
- Add "Posted via ZAO OS" attribution footer

### 4.2 Bluesky (Free — Already Built, Deepen)

**Current state:**
- Cross-post toggle exists in ComposeBar
- Member sync and feed generator built
- Basic text cross-posting works

**Enhancements:**
- Thread support: posts > 300 chars split into Bluesky threads
- Proper embed cards via `app.bsky.embed.external` (title, description, thumbnail)
- Image cross-posting: upload to Bluesky blob store, attach as `app.bsky.embed.images`
- Quote posts: map Farcaster quotes to Bluesky quote posts
- Migrate existing toggle into new PlatformToggles component

### 4.3 X / Twitter (Admin-Only)

**Auth:** Shared ZAO app credentials (env vars, not per-user):
- `X_API_KEY`, `X_API_SECRET`
- `X_ACCESS_TOKEN`, `X_ACCESS_SECRET`
- Only `session.isAdmin` users see the X toggle pill

**Posting:**
- `POST /api/publish/x`
- X API v2: `POST https://api.twitter.com/2/tweets`
- OAuth 1.0a signing via `twitter-api-v2` npm package

**Content normalization:**
- Truncate to 280 chars (leave 23 chars for t.co link)
- Append link back to original Farcaster cast
- Images: upload via media endpoint, attach to tweet
- No thread support in v1 (single tweet only)

**Rate limits:** 1,500 tweets/month on Basic tier ($100/mo). Track usage in env or simple counter.

### 4.4 Hive / InLeo (Free)

**Auth flow:**
- User enters Hive username + posting key in settings
- Posting key encrypted at rest (AES-256-GCM via `SESSION_SECRET` as key)
- Store `hive_username` and `hive_posting_key_encrypted` on users table
- Posting key NEVER sent to client after initial save

**Posting:**
- `POST /api/publish/hive`
- Uses `@hiveio/dhive` SDK: `client.broadcast.comment()`
- Posts as comments to Hive (not top-level blog posts — lower barrier)
- Tags: `zao`, `music`, `web3`, `farcaster` + any channel-specific tags
- InLeo: add `inleo` tag for InLeo frontend visibility

**Content normalization:**
- Full markdown support (Hive is markdown-native)
- Convert Farcaster embeds to markdown links/images
- Add metadata footer: source, timestamp, original cast link

## 5. Architecture

### Publish Flow

```
User hits "Publish (N)" in ComposeBar
  │
  ├── POST /api/chat/send (Farcaster — primary, must succeed)
  │     Returns: { castHash, success }
  │
  └── If Farcaster succeeds, fire-and-forget cross-posts:
        ├── POST /api/publish/lens    (if lens toggled + connected)
        ├── POST /api/publish/bluesky (enhanced existing logic)
        ├── POST /api/publish/x       (if admin + toggled)
        └── POST /api/publish/hive    (if hive toggled + connected)
```

Cross-posts include the Farcaster cast hash for attribution/linking back.

### Content Normalization Pipeline

```typescript
// src/lib/publish/normalize.ts

interface NormalizedContent {
  text: string;           // Platform-appropriate text
  images: string[];       // Image URLs to upload per-platform
  embeds: EmbedInfo[];    // Link embeds with metadata
  attribution: string;    // "via ZAO OS" footer
  castHash: string;       // Original Farcaster cast reference
  castUrl: string;        // Warpcast/Supercast link to original
}

function normalizeForLens(text, embeds, castHash): NormalizedContent
function normalizeForBluesky(text, embeds, castHash): NormalizedContent
function normalizeForX(text, embeds, castHash): NormalizedContent
function normalizeForHive(text, embeds, castHash): NormalizedContent
```

### Publish Status Tracking

After cross-posts fire, results logged to a new `publish_log` table:

```sql
CREATE TABLE publish_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cast_hash TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('lens', 'bluesky', 'x', 'hive')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  platform_post_id TEXT,    -- post ID on the target platform
  platform_url TEXT,        -- URL to the cross-posted content
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

This allows showing "Published to 3/4 platforms" feedback and retry logic for failures.

## 6. Database Changes

### Users table additions

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS publishing_prefs JSONB
  DEFAULT '{"crossPostEnabled": false, "defaultPlatforms": ["farcaster"]}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS lens_profile_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lens_access_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lens_refresh_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hive_username TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hive_posting_key_encrypted TEXT;
```

X credentials are env vars (shared app), not per-user columns.

### New table

```sql
CREATE TABLE publish_log (
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

CREATE INDEX idx_publish_log_cast ON publish_log (cast_hash);
CREATE INDEX idx_publish_log_fid ON publish_log (fid);
CREATE INDEX idx_publish_log_status ON publish_log (status) WHERE status = 'failed';
```

RLS enabled, service_role only.

## 7. New Files

### API Routes
- `src/app/api/publish/lens/route.ts` — Lens Protocol posting
- `src/app/api/publish/x/route.ts` — X/Twitter posting (admin-gated)
- `src/app/api/publish/hive/route.ts` — Hive blockchain posting
- `src/app/api/publish/status/route.ts` — GET publish status for a cast hash

### Libraries
- `src/lib/publish/normalize.ts` — content normalization per platform
- `src/lib/publish/lens.ts` — Lens SDK client setup + helpers
- `src/lib/publish/x.ts` — X API client (OAuth 1.0a signing)
- `src/lib/publish/hive.ts` — Hive dhive client + encryption helpers

### Components
- `src/components/compose/PlatformToggles.tsx` — toggle pills for platform selection
- `src/components/compose/PublishButton.tsx` — "Publish (N)" button replacing Send
- `src/components/settings/ConnectedPlatforms.tsx` — platform connection management

### Database
- `scripts/add-publishing-columns.sql` — user columns + publish_log table

## 8. Dependencies (npm)

- `@lens-protocol/client` — Lens SDK (MIT)
- `@hiveio/dhive` — Hive blockchain SDK (BSD-3)
- `twitter-api-v2` — X API v2 client (MIT)

Bluesky: already using `@atproto/api` (no new dependency).

## 9. Security

- **Hive posting keys** encrypted at rest with AES-256-GCM using `SESSION_SECRET` as encryption key. Decrypted only server-side at publish time. Never returned to client after initial save.
- **X credentials** stored as server-only env vars (`X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_SECRET`). Never exposed to browser.
- **Lens tokens** stored server-side, refreshed automatically on expiry.
- **All publish routes** require valid session. X route additionally requires `isAdmin`.
- **Publish log** uses service_role only (no direct client access).

## 10. Implementation Order

### Phase 1: Infrastructure (Day 1)
1. Database migration (publishing_prefs, publish_log, platform columns)
2. Content normalization library (`src/lib/publish/normalize.ts`)
3. PlatformToggles component + PublishButton
4. Update ComposeBar to use new components

### Phase 2: Lens Protocol (Day 2-3)
5. Lens client library
6. Lens connect flow in settings
7. Lens publish route
8. Test end-to-end

### Phase 3: Bluesky Enhancements (Day 3-4)
9. Thread splitting for long posts
10. Proper embed cards
11. Image cross-posting
12. Migrate existing toggle to PlatformToggles

### Phase 4: X/Twitter (Day 4-5)
13. X client library (OAuth 1.0a)
14. X publish route (admin-gated)
15. Content truncation + link-back
16. Test with ZAO's X account

### Phase 5: Hive/InLeo (Day 5-6)
17. Hive client library + encryption helpers
18. Hive connect flow (posting key input)
19. Hive publish route
20. InLeo tag integration

### Phase 6: Polish (Day 6-7)
21. Connected Platforms settings page
22. Publish status feedback (success/failure toast per platform)
23. Retry logic for failed publishes
24. Rate limit tracking for X

## 11. Success Criteria

- [ ] User can toggle cross-post mode on/off
- [ ] "Publish (N)" shows correct count of selected platforms
- [ ] Lens posting works end-to-end (text + images + music links)
- [ ] Bluesky threads work for posts > 300 chars
- [ ] X posting works for admins only, truncated to 280 chars
- [ ] Hive posting works with encrypted posting key
- [ ] Publish failures don't block primary Farcaster post
- [ ] Settings page shows all connected platforms
- [ ] Publish log tracks all cross-post results

## 12. Out of Scope (for now)

- Nostr / Wavlake (future — needs separate research)
- Threads / Instagram (API restrictions)
- TikTok / YouTube (video-only platforms)
- Bidirectional sync (reading from other platforms back into ZAO)
- Scheduled cross-posting (use existing schedule feature, cross-post on send)
- Per-platform content editing (same content goes everywhere, normalized)
