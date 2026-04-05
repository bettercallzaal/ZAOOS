# 96 — Mastodon + Threads Cross-Posting Integration for ZAO OS

> **Status:** Research complete
> **Date:** March 20, 2026
> **Goal:** Add Mastodon and Threads (Meta) as cross-posting targets from ZAO OS compose bar
> **Builds on:** Doc 28 (Cross-Platform Publishing), Doc 77 (Bluesky Cross-Posting)

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Mastodon SDK** | `masto` (masto.js) v7+ — best-maintained TypeScript SDK, universal Mastodon client |
| **Mastodon alt SDK** | `megalodon` — if you want one SDK for Mastodon + Pleroma + Misskey + Firefish |
| **Mastodon auth (Phase 1)** | Community account on sonomu.club — generate access token via Preferences > Development |
| **Mastodon auth (Phase 2)** | Per-user OAuth2 — let members connect their own accounts on any instance |
| **Mastodon instance strategy** | Let users pick their instance. ZAO community account on sonomu.club (music-focused) |
| **Threads SDK** | No official Node.js SDK — use direct HTTP calls to Meta Graph API (simple REST) |
| **Threads auth** | Meta OAuth 2.0 — requires Meta Business App + `threads_content_publish` permission |
| **Cost** | **$0** for both — Mastodon and Threads APIs are completely free |
| **Priority** | Mastodon first (simpler, no approval needed), Threads second (Meta app review required) |

---

## Part 1: Mastodon / ActivityPub

### 1.1 API Overview

Mastodon uses a RESTful API with JSON payloads. Every Mastodon instance runs its own independent API.

**Post a status endpoint:**
```
POST /api/v1/statuses
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "status": "Hello from ZAO OS!",
  "visibility": "public",
  "language": "en"
}
```

**Response:** Returns a `Status` entity with `id`, `uri`, `url`, `created_at`, etc.

**Supported parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Text content (up to 500 chars default, some instances allow more) |
| `media_ids` | array | Up to 4 media attachment IDs (upload first via `POST /api/v2/media`) |
| `visibility` | string | `public`, `unlisted`, `private`, `direct` |
| `sensitive` | boolean | Mark media as sensitive (behind CW) |
| `spoiler_text` | string | Content warning text |
| `language` | string | ISO 639 language code |
| `poll` | object | Optional poll with `options[]`, `expires_in`, `multiple`, `hide_totals` |

### 1.2 Authentication — OAuth2 Flow

Mastodon uses standard OAuth 2.0 with one important wrinkle: **app registration is per-instance**.

**Step 1: Register app on the target instance**
```
POST https://{instance}/api/v1/apps
Content-Type: application/json

{
  "client_name": "ZAO OS",
  "redirect_uris": "https://zaoos.com/api/mastodon/callback",
  "scopes": "read write",
  "website": "https://zaoos.com"
}
```

Returns `client_id` and `client_secret`. **Cache these per instance** — do not re-register for every user on the same instance.

**Step 2: Redirect user to authorize**
```
GET https://{instance}/oauth/authorize?
  client_id={client_id}&
  redirect_uri=https://zaoos.com/api/mastodon/callback&
  response_type=code&
  scope=read+write
```

User approves on their instance, redirected back with `?code=xxx`.

**Step 3: Exchange code for token**
```
POST https://{instance}/oauth/token
{
  "client_id": "{client_id}",
  "client_secret": "{client_secret}",
  "redirect_uri": "https://zaoos.com/api/mastodon/callback",
  "grant_type": "authorization_code",
  "code": "{code}",
  "scope": "read write"
}
```

Returns `access_token` (no expiry by default on Mastodon). Store securely in database.

### 1.3 Multi-Instance Support

**Critical design decision:** Mastodon is federated. Users can be on mastodon.social, sonomu.club, musician.social, or any of 10,000+ instances.

**Recommended approach:**

| Strategy | Pros | Cons |
|----------|------|------|
| **ZAO community account on one instance** (Phase 1) | Simple, one token, immediate | Only reaches one instance's local timeline |
| **Let users connect their own account** (Phase 2) | Full reach via federation, personal identity | Must handle multi-instance OAuth, store per-user tokens |
| **Run a ZAO Mastodon instance** (Phase 3) | Full control, custom branding | Server maintenance, moderation burden |

**Phase 1 recommendation:** Create `@thezao@sonomu.club` (music-focused instance). Generate access token via Preferences > Development > New Application. Store as `MASTODON_ACCESS_TOKEN` env var.

**Phase 2 multi-instance OAuth:** When a user enters their instance URL (e.g., `mastodon.social`), ZAO OS must:
1. Check if we already have `client_id`/`client_secret` for that instance in Supabase
2. If not, call `POST /api/v1/apps` on that instance to register
3. Cache the credentials in a `mastodon_apps` table
4. Redirect user to that instance's `/oauth/authorize`
5. Handle callback, store token in `users` table

**Database schema for multi-instance:**
```sql
-- App credentials per instance (cache)
CREATE TABLE mastodon_apps (
  instance_url TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  client_secret TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User connections
ALTER TABLE users ADD COLUMN mastodon_instance TEXT;
ALTER TABLE users ADD COLUMN mastodon_handle TEXT;
ALTER TABLE users ADD COLUMN mastodon_access_token TEXT;
ALTER TABLE users ADD COLUMN mastodon_account_id TEXT;
```

### 1.4 Music Instances — Status Check (March 2026)

| Instance | Focus | Status | Users | Notes |
|----------|-------|--------|-------|-------|
| **sonomu.club** | Sound, Noise, Music | Active | ~2,000+ | Best fit for ZAO. Electronic, experimental, production. Run by @luka. |
| **musician.social** | All genres | Active | ~1,000+ | Broader music community. Jazz, rock, pop, indie, classical. |
| **musicians.today** | All levels | Active | Small | Smaller but still federated. |
| **stereodon.social** | Underground music | Active | Small | Niche underground focus. |
| **drumstodon.net** | Drummers | Active | Very small | Extremely niche. |

**Recommendation:** ZAO community account on **sonomu.club** — it is the most established music-focused Mastodon instance and aligns with ZAO's artist/producer community. Content federates to all other instances automatically.

### 1.5 npm Packages

| Package | Weekly Downloads | TypeScript | Maintained | Notes |
|---------|-----------------|------------|------------|-------|
| **`masto`** (masto.js) | ~15K | Native TS | Yes (active) | Best choice. Universal Mastodon client. Full API coverage. |
| **`megalodon`** | ~3K | Native TS | Yes (active) | Supports Mastodon + Pleroma + Friendica + Firefish + more. Good if expanding to broader Fediverse. |
| **`mastodon-api`** | ~500 | No | Stale | Older, less maintained. Avoid. |
| **`mastodon`** (node-mastodon) | ~200 | No | Stale | Twitter-like streaming API. Outdated. |

**Recommended: `masto`** — best TypeScript support, active maintenance, clean API.

```typescript
import { createRestAPIClient } from "masto";

const masto = createRestAPIClient({
  url: "https://sonomu.club",
  accessToken: process.env.MASTODON_ACCESS_TOKEN!,
});

// Post a status
const status = await masto.v1.statuses.create({
  status: "New track dropped on ZAO! Check it out: https://zaoos.com/music",
  visibility: "public",
});
```

**Alternative: `megalodon`** — if you want one package for all Fediverse platforms:

```typescript
import generator, { MegalodonInterface } from "megalodon";

const client: MegalodonInterface = generator(
  "mastodon",
  "https://sonomu.club",
  process.env.MASTODON_ACCESS_TOKEN!
);

const res = await client.postStatus("Hello from ZAO!", { visibility: "public" });
```

### 1.6 Rate Limits

| Endpoint | Default Limit | Notes |
|----------|---------------|-------|
| Most API calls | **300 requests / 5 minutes** | Per access token per instance |
| `POST /api/v1/statuses` | Same pool (300/5min) | ~3,600/hour theoretical max |
| `POST /api/v1/media` | **30 / 30 minutes** | Media uploads are more restricted |
| `DELETE /api/v1/statuses` | **30 / 30 minutes** | Deletes also restricted |

**Important:** These are defaults. Each instance can configure its own limits. Music instances like sonomu.club may have stricter or looser limits. Headers `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` are returned with every response.

**For ZAO (40 members):** Even with all 40 members cross-posting simultaneously, 300/5min is more than sufficient. Not a concern.

### 1.7 Cost

**$0 total.** Mastodon API is completely free on all instances. No API keys to purchase, no paid tiers, no quotas. The only cost would be running your own instance (Phase 3), which would be ~$5-20/month for a small VPS.

---

## Part 2: Threads (Meta)

### 2.1 API Overview — Current State (March 2026)

The Threads API launched June 18, 2024 and has been steadily expanded. It is a subset of Meta's Graph API infrastructure.

**Publishing is a two-step process:**

**Step 1: Create a media container**
```
POST https://graph.threads.net/v1.0/{threads-user-id}/threads
Content-Type: application/x-www-form-urlencoded

user_id={user_id}&
media_type=TEXT&
text=Hello from ZAO OS!&
access_token={access_token}
```

**Step 2: Publish the container**
```
POST https://graph.threads.net/v1.0/{threads-user-id}/threads_publish
Content-Type: application/x-www-form-urlencoded

creation_id={container_id}&
access_token={access_token}
```

**Why two steps?** Media (images/videos) need server-side processing time. You can poll the container status before publishing.

### 2.2 Supported Content Types

| Type | `media_type` | Parameters | Notes |
|------|-------------|------------|-------|
| **Text only** | `TEXT` | `text` | Up to 500 characters |
| **Image** | `IMAGE` | `image_url`, `text` (optional) | JPEG, PNG. Must be publicly accessible URL. |
| **Video** | `VIDEO` | `video_url`, `text` (optional) | MP4, MOV. Max 5 minutes. Must be publicly accessible URL. |
| **Carousel** | `CAROUSEL` | `children` (array of container IDs) | Up to 20 images/videos. Create child containers first. |
| **Poll** | `TEXT` with poll params | `text`, `poll_options`, `poll_duration` | Interactive polls. Added late 2024. |
| **GIF** | `IMAGE` | `image_url` (GIF URL) | GIF support via GIPHY. Added Feb 2026. |

**Additional features:**
- **Spoiler flags** — mark content as spoiler
- **Topic tags** — up to 1 hashtag per post
- **Alt text** — accessibility descriptions for images
- **Reply controls** — `reply_control`: `everyone`, `accounts_you_follow`, `mentioned_only`
- **Link attachments** — URLs in text auto-unfurl

**Not supported via API:**
- Deleting posts (must use Threads app manually)
- DMs (no messaging API)
- Stories

### 2.3 Authentication — Meta OAuth 2.0

**Prerequisites:**
1. Meta Developer Account (developers.facebook.com)
2. Create a **Business App** (not Consumer — Threads requires Business type)
3. Add the "Threads" product to your app
4. Configure OAuth redirect URIs

**Required permissions/scopes:**
| Scope | Purpose |
|-------|---------|
| `threads_basic` | Read profile info, follower count |
| `threads_content_publish` | Create and publish posts |
| `threads_manage_replies` | Manage replies to posts |
| `threads_manage_insights` | Read analytics/insights |
| `threads_read_replies` | Read replies on posts |

**OAuth flow:**

**Step 1: Redirect to authorization**
```
GET https://threads.net/oauth/authorize?
  client_id={app_id}&
  redirect_uri=https://zaoos.com/api/threads/callback&
  scope=threads_basic,threads_content_publish&
  response_type=code&
  state={csrf_token}
```

**Step 2: Exchange code for short-lived token (1 hour)**
```
POST https://graph.threads.net/oauth/access_token
Content-Type: application/x-www-form-urlencoded

client_id={app_id}&
client_secret={app_secret}&
grant_type=authorization_code&
redirect_uri=https://zaoos.com/api/threads/callback&
code={code}
```

**Step 3: Exchange for long-lived token (60 days)**
```
GET https://graph.threads.net/access_token?
  grant_type=th_exchange_token&
  client_secret={app_secret}&
  access_token={short_lived_token}
```

**Step 4: Refresh before expiry**
```
GET https://graph.threads.net/refresh_access_token?
  grant_type=th_refresh_token&
  access_token={long_lived_token}
```

**Important differences from Mastodon:**
- Threads tokens **expire** (60 days for long-lived). Must implement refresh logic.
- Requires Meta **app review** before going live (can use in Development Mode with up to 25 testers first).
- Only **one instance** — no federation, no multi-instance complexity.
- Business account verification required (1-2 days typically).

### 2.4 Rate Limits

| Limit | Value | Window |
|-------|-------|--------|
| **Posts** | **250 per profile** | Rolling 24 hours |
| **Replies** | **1,000 per profile** | Rolling 24 hours |
| **API calls** | **500 calls per hour** | Per access token |
| **Carousels** | 1 carousel = 1 post toward the 250 limit | — |
| **Text limit** | 500 characters | Per post |
| **Hashtags** | 1 per post | Hard limit |

**For ZAO (40 members):** 250 posts/day per profile is generous. Even a highly active community account would post maybe 10-20/day. Individual member accounts each get their own 250 limit.

### 2.5 npm Packages / SDK

**There is no official Threads SDK from Meta for Node.js.** The API is simple enough REST that a dedicated SDK is unnecessary.

| Package | Status | Notes |
|---------|--------|-------|
| **Direct HTTP (fetch/axios)** | Recommended | Threads API is simple REST. 2 calls to publish. No SDK needed. |
| `threads-api` (junhoyeo) | **Stale** (last update 2024) | Unofficial reverse-engineered client. Pre-dates official API. Do not use. |
| `@davidcelis/threads-api` | Ruby only | Not relevant for Node.js |
| **Ayrshare** | Third-party service | $49/mo+ — handles Threads + 10 other platforms. Overkill for just Threads. |

**Recommended approach:** Direct HTTP calls using `fetch()`. The API surface is small enough that a thin wrapper in `src/lib/threads/client.ts` is all you need.

```typescript
// src/lib/threads/client.ts — conceptual pattern
const THREADS_API = "https://graph.threads.net/v1.0";

export async function postToThreads(
  userId: string,
  accessToken: string,
  text: string,
  imageUrl?: string
) {
  // Step 1: Create container
  const params = new URLSearchParams({
    media_type: imageUrl ? "IMAGE" : "TEXT",
    text,
    access_token: accessToken,
    ...(imageUrl && { image_url: imageUrl }),
  });

  const containerRes = await fetch(
    `${THREADS_API}/${userId}/threads`,
    { method: "POST", body: params }
  );
  const { id: containerId } = await containerRes.json();

  // Step 2: Publish
  const publishRes = await fetch(
    `${THREADS_API}/${userId}/threads_publish`,
    {
      method: "POST",
      body: new URLSearchParams({
        creation_id: containerId,
        access_token: accessToken,
      }),
    }
  );
  return publishRes.json();
}
```

### 2.6 Bot / Automated Posting Restrictions

| Restriction | Details |
|-------------|---------|
| **App review required** | Must pass Meta's review process before going live (Development Mode limited to 25 testers) |
| **No delete via API** | Cannot programmatically delete posts — must use the Threads app |
| **Business account** | App must be Business type; account may need verification |
| **Content policy** | Standard Meta content policies apply. Automated spam detection is aggressive. |
| **Rate limiting** | 250 posts/24hr enforced strictly. No burst posting. |
| **1 hashtag limit** | Only one hashtag per post — prevents hashtag spam |
| **Token refresh** | Long-lived tokens expire in 60 days — must implement auto-refresh or posts silently fail |

**Compared to Mastodon:** Threads is more locked down. Meta controls the platform, reviews apps, and enforces stricter automation rules. Mastodon has no app review, no central authority, and more permissive rate limits.

---

## Part 3: Implementation Plan for ZAO OS

### Phase 1: Community Account Cross-Post (2-3 days)

Post to ZAO community accounts on both platforms alongside Farcaster channels.

**New env vars:**
```
# Mastodon (sonomu.club community account)
MASTODON_INSTANCE_URL=https://sonomu.club
MASTODON_ACCESS_TOKEN=xxxx

# Threads (ZAO community account)
THREADS_USER_ID=123456789
THREADS_ACCESS_TOKEN=xxxx
THREADS_APP_SECRET=xxxx   # For token refresh
```

**New files:**

| File | Purpose |
|------|---------|
| `src/lib/mastodon/client.ts` | Mastodon SDK wrapper (uses `masto`) |
| `src/lib/threads/client.ts` | Threads API wrapper (direct fetch) |

**Modify existing files:**

| File | Change |
|------|--------|
| `src/lib/validation/schemas.ts` | Add `crossPostMastodon`, `crossPostThreads` booleans to `sendMessageSchema` |
| `src/app/api/chat/send/route.ts` | Add Mastodon + Threads to `Promise.allSettled` fan-out |
| `src/components/chat/ComposeBar.tsx` | Add Mastodon + Threads toggle checkboxes |

**Code pattern (matches existing Bluesky pattern):**
```typescript
// In send/route.ts — after existing Farcaster + Bluesky cross-post
const crossPostPromises = [];

if (parsed.data.crossPostMastodon) {
  crossPostPromises.push(
    postToMastodon(text).catch(err => console.error('[mastodon]', err))
  );
}

if (parsed.data.crossPostThreads) {
  crossPostPromises.push(
    postToThreads(userId, token, text).catch(err => console.error('[threads]', err))
  );
}

await Promise.allSettled(crossPostPromises);
```

**npm install:**
```bash
npm install masto
# No package needed for Threads — using fetch()
```

### Phase 2: Individual Account OAuth (1-2 weeks)

Let members connect their own Mastodon and Threads accounts.

**New API routes:**

| Route | Purpose |
|-------|---------|
| `GET /api/mastodon/connect` | Start Mastodon OAuth (user provides instance URL) |
| `GET /api/mastodon/callback` | Handle OAuth callback, store token |
| `DELETE /api/mastodon/disconnect` | Remove connection |
| `GET /api/threads/connect` | Start Threads OAuth |
| `GET /api/threads/callback` | Handle OAuth callback, exchange tokens |
| `DELETE /api/threads/disconnect` | Remove connection |
| `POST /api/threads/refresh` | Cron job to refresh expiring tokens |

**Database changes:**
```sql
-- Mastodon: multi-instance support
CREATE TABLE mastodon_apps (
  instance_url TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  client_secret TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE users ADD COLUMN mastodon_instance TEXT;
ALTER TABLE users ADD COLUMN mastodon_handle TEXT;
ALTER TABLE users ADD COLUMN mastodon_access_token TEXT;
ALTER TABLE users ADD COLUMN mastodon_account_id TEXT;

-- Threads: single-instance (always threads.net)
ALTER TABLE users ADD COLUMN threads_user_id TEXT;
ALTER TABLE users ADD COLUMN threads_handle TEXT;
ALTER TABLE users ADD COLUMN threads_access_token TEXT;
ALTER TABLE users ADD COLUMN threads_token_expires_at TIMESTAMPTZ;
```

**Mastodon multi-instance flow:**
1. User enters their instance URL (e.g., `mastodon.social`)
2. ZAO OS checks `mastodon_apps` table for cached credentials
3. If not found, registers new app via `POST /api/v1/apps` on that instance
4. Caches `client_id`/`client_secret` in `mastodon_apps`
5. Redirects user to instance OAuth
6. Handles callback, stores access token

**Threads token refresh:**
- Long-lived tokens expire in 60 days
- Set up a daily cron (Vercel Cron or similar) to refresh tokens expiring within 7 days
- Store `threads_token_expires_at` and query for upcoming expirations

### Phase 3: Settings UI + Analytics (1 week)

**Settings page additions** (alongside existing Farcaster/Bluesky connections):

| Connection | Status Display | Action |
|------------|---------------|--------|
| Mastodon | `@handle@instance.social` | Connect / Disconnect |
| Threads | `@handle` | Connect / Disconnect |

**Cross-post analytics:**
- Track which platforms each post was cross-posted to
- Store platform-specific post IDs for link-back
- Show success/failure status in post detail view

---

## Comparison: Mastodon vs Threads vs Bluesky (for ZAO)

| Feature | Mastodon | Threads | Bluesky |
|---------|----------|---------|---------|
| **Users** | 7M+ (federated) | 200M+ | 40M+ |
| **Text limit** | 500 chars | 500 chars | 300 chars |
| **Images** | 4 per post | 10 per post (20 in carousel) | 4 per post |
| **API cost** | Free | Free | Free |
| **Auth complexity** | Medium (multi-instance OAuth) | High (Meta app review) | Low (app password or OAuth) |
| **App review needed** | No | Yes (Meta review) | No |
| **Rate limits** | 300/5min per instance | 250 posts/24hr | 5,000 pts/hr |
| **Token expiry** | Never (by default) | 60 days (must refresh) | Session-based |
| **Music community** | Niche but dedicated (sonomu.club) | Growing, mainstream | Growing (771+ starter packs) |
| **Federation** | Yes (ActivityPub) | No (centralized) | Yes (AT Protocol) |
| **Delete via API** | Yes | No | Yes |
| **SDK quality** | Good (`masto`) | None (use fetch) | Excellent (`@atproto/api`) |
| **Setup time** | 1-2 days | 3-5 days (app review) | 1-2 days |

---

## Post Formatting Across Platforms

When cross-posting from Farcaster (1,024 chars) to other platforms, truncation is needed:

| Platform | Limit | Strategy |
|----------|-------|----------|
| Farcaster | 1,024 chars | Full text (source of truth) |
| Mastodon | 500 chars | Truncate at 470 + "... [full post on ZAO]" link |
| Threads | 500 chars | Truncate at 470 + "... [full post on ZAO]" link |
| Bluesky | 300 chars | Truncate at 270 + "... [full post on ZAO]" link |

**Shared truncation utility:**
```typescript
// src/lib/crosspost/format.ts
export function truncateForPlatform(
  text: string,
  maxChars: number,
  linkUrl?: string
): string {
  const suffix = linkUrl ? `\n\n${linkUrl}` : "";
  const available = maxChars - suffix.length;

  if (text.length <= available) return text + suffix;
  return text.slice(0, available - 3) + "..." + suffix;
}
```

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Mastodon instance goes down** | Low | Community account on established instance; users can connect their own |
| **sonomu.club shuts down** | Low | Federation means content is distributed; can migrate to another instance |
| **Threads API changes** | Medium | Meta has history of breaking API changes; abstract behind thin wrapper |
| **Threads app review rejected** | Medium | Start with Development Mode (25 testers); ensure clean content policy |
| **Threads token expiry missed** | Medium | Implement proactive refresh cron; alert on failure |
| **Rate limit hits** | Very Low | 40-member community will not approach any platform's limits |
| **Content moderation mismatch** | Low | Each platform has own rules; add per-platform content warnings where needed |

---

## Implementation Priority

| Order | Task | Effort | Dependency |
|-------|------|--------|------------|
| 1 | Create sonomu.club community account | 30 min | None |
| 2 | `npm install masto` + `src/lib/mastodon/client.ts` | 2 hours | Step 1 |
| 3 | Add Mastodon toggle to ComposeBar + send route | 2 hours | Step 2 |
| 4 | Register Meta Business App + configure Threads product | 1 hour | None |
| 5 | Wait for Meta app review | 1-5 days | Step 4 |
| 6 | `src/lib/threads/client.ts` (fetch wrapper) | 2 hours | Step 5 |
| 7 | Add Threads toggle to ComposeBar + send route | 2 hours | Step 6 |
| 8 | Shared truncation utility | 1 hour | Any |
| 9 | Phase 2: Mastodon multi-instance OAuth | 3-4 days | Step 3 |
| 10 | Phase 2: Threads per-user OAuth + token refresh | 2-3 days | Step 7 |
| 11 | Settings page UI for both connections | 1 day | Steps 9-10 |

**Total estimated effort:** Phase 1 = 2-3 days, Phase 2 = 1-2 weeks

---

## Existing Code to Extend

ZAO OS already has cross-posting infrastructure from the Bluesky integration (Doc 77):

- `src/components/chat/ComposeBar.tsx` — cross-post channel checkboxes UI
- `src/app/api/chat/send/route.ts` — `crossPostChannels` array, `Promise.allSettled` fan-out
- `src/lib/validation/schemas.ts` — `crossPostChannels` in `sendMessageSchema`
- `src/app/api/bluesky/route.ts` — Bluesky connection management (pattern to follow)
- `src/hooks/useChat.ts` — cross-post state management

Adding Mastodon + Threads follows the exact same pattern as Bluesky:
1. New `src/lib/{platform}/client.ts` (SDK wrapper)
2. Add `crossPost{Platform}: z.boolean().optional()` to `sendMessageSchema`
3. Add toggle in ComposeBar
4. Add fire-and-forget call in send route
5. Add connection management API route
6. Add connection status in Settings page

---

## Sources

- [Mastodon Statuses API](https://docs.joinmastodon.org/methods/statuses/) — POST /api/v1/statuses endpoint
- [Mastodon OAuth Documentation](https://docs.joinmastodon.org/spec/oauth/) — OAuth 2.0 spec
- [Mastodon App Registration](https://docs.joinmastodon.org/methods/apps/) — POST /api/v1/apps
- [Mastodon Rate Limits](https://docs.joinmastodon.org/api/rate-limits/) — 300/5min default
- [Mastodon Client Libraries](https://docs.joinmastodon.org/client/libraries/) — official list
- [masto.js on npm](https://www.npmjs.com/package/masto) — TypeScript Mastodon client
- [masto.js GitHub](https://github.com/neet/masto.js/) — source, docs, examples
- [megalodon on npm](https://www.npmjs.com/package/megalodon) — universal Fediverse client
- [megalodon GitHub](https://github.com/h3poteto/megalodon) — Mastodon + Pleroma + Firefish
- [SoNoMu.club](https://sonomu.club/) — Sound Noise Music Mastodon instance
- [SoNoMu About](https://sonomu.club/about) — instance description and rules
- [Music Mastodon Servers](https://mastodonservers.net/servers/music) — directory of music instances
- [Threads API — Posts](https://developers.facebook.com/docs/threads/posts/) — publishing documentation
- [Threads API — Get Started](https://developers.facebook.com/docs/threads) — overview and setup
- [Threads API — Access Tokens](https://developers.facebook.com/docs/threads/get-started/get-access-tokens-and-permissions/) — OAuth flow
- [Threads API Changelog](https://developers.facebook.com/docs/threads/changelog/) — feature history
- [Threads API Launch Announcement](https://developers.facebook.com/blog/post/2024/06/18/the-threads-api-is-finally-here/) — June 2024
- [Meta Threads API Expansion](https://ppc.land/meta-expands-threads-api-with-advanced-features-for-developers/) — advanced features
- [Threads Character Limit](https://typecount.com/blog/threads-character-limit) — 500 chars, 1 hashtag
- [Social Media API Automation Guide 2026](https://getlate.dev/blog/complete-guide-social-media-api-automation) — cross-platform comparison
- [Ayrshare Threads Integration](https://www.ayrshare.com/threads-api-integration-authorization-posting-analytics-with-ayrshare/) — third-party option
- [Doc 28 — Cross-Platform Publishing](../../_archive/028-cross-platform-publishing/) — platform comparison
- [Doc 77 — Bluesky Cross-Posting](../../cross-platform/077-bluesky-cross-posting-integration/) — existing pattern to follow
