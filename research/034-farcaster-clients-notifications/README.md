# 34 — Farcaster Clients Comparison & Notification Architecture

> **Status:** Research complete
> **Date:** March 2026
> **Goal:** Map every Farcaster client, compare features, and understand how to implement notifications in ZAO OS

---

## Part 1: Client Landscape

### Major Clients Comparison

| Client | Status | License | Platforms | Notifications | Music | Multi-Account | Open Source |
|--------|--------|---------|-----------|---------------|-------|---------------|------------|
| **Farcaster App** | Active (dominant) | Proprietary | iOS, Android, Web | Full push | Basic embeds | Limited | No |
| **Supercast** | Merged/Dead | Proprietary | Was web + mobile | Had push | No | Yes | No |
| **Herocast** | Active | AGPL | Web, Desktop (Tauri) | None | No | Yes (teams) | Yes |
| **Recaster** | Active | Proprietary | iOS, Android, Web | Yes | No | Yes | No |
| **Yup** | Active | Proprietary | iOS, Android, Web | Cross-platform | No | Yes | No |
| **Litecast** | Active | MIT | iOS, Android, Web (Expo) | None | No | No | Yes |
| **Nook** | Archived | MIT | Was iOS, Android, Web | Had system | No | No | Yes |
| **Opencast** | Archived | MIT | Web | Badge counts | No | No | Yes |
| **Sonata** | Active | MIT | Web | None | **Full player** | No | Yes |
| **Buoy** | Active | Proprietary | iOS, Android, Web | **Best search alerts** | No | No | No |
| **Kiwi News** | Active | Open source | Web | No | No | No | Yes |
| **Nounspace** | Active | Unknown | Web (Mini App) | No | Music player fidget | No | No |

---

### 1. Farcaster App (formerly Warpcast) — The Dominant Client

- **90%+ of all Farcaster activity**
- Rebranded from Warpcast late 2025
- Full push notifications (APNs/FCM), Mini App hosting, Direct Casts (DMs)
- Algorithmic + chronological feeds
- Built-in onboarding with account creation
- First to support new protocol features
- **Cons:** Proprietary, algorithm not transparent, limited customization

### 2. Herocast — Power User Publishing Tool

- **GitHub:** github.com/hero-org/herocast (698 commits, AGPL)
- Desktop apps via Tauri (macOS, Windows, Linux)
- Multi-account with team invitations
- **Post scheduling and drafts** — standout feature
- Analytics dashboard (privacy-focused)
- Keyboard-first design
- Used by: Optimism, POAP, Hats, Fabric
- **Cons:** AGPL (derivatives must also be AGPL), no mobile, no notifications
- **Stack:** TypeScript, Next.js, Tailwind, Supabase, Tauri

### 3. Recaster — AI Agent Social Client

- Native iOS/Android/Web
- "The place where AI Agents go social"
- Scheduled casting, threaded replies, bookmarks, custom home tabs
- **Priority mode** (filters low-quality content)
- OpenRank and Neynar analytics built in
- Translation built in
- Multi-account support

### 4. Yup — Cross-Protocol Aggregator

- Aggregates Twitter, Farcaster, Lens, Bluesky, Mirror, Threads
- **Cross-posting across all platforms simultaneously**
- Unified notifications from all platforms
- Cross-follow (follow across all networks at once)
- Custom human-curated feeds
- Acquired by thirdweb

### 5. Sonata — Music-Focused (Most Relevant to ZAO)

- **GitHub:** github.com/Coop-Records/sonata (1,539 commits, MIT)
- Music discovery and curation on Farcaster
- Integrates Spotify, SoundCloud, Sound.xyz
- Daily allowance / points system
- Leaderboard via Stack.so
- Music organized through themed channels (/music, /rock, /electronic, /housemusic)
- Trending and Recent feeds
- **Same stack as ZAO OS** (Next.js, Supabase, Tailwind)
- **Cons:** Web only, no notifications, no DMs, small user base (8 stars)

### 6. Buoy — Search & Monitoring

- **Best search and alerts tool in the ecosystem**
- Real-time keyword notifications
- Multi-platform delivery (Slack, Telegram, Discord, custom webhooks)
- Replaced Searchcaster
- Pricing: Free (search), Pro $10/mo (notifications), Max $100/mo (integrations)

### 7. Litecast — Minimal Reference

- **GitHub:** github.com/dylsteck/litecast (MIT, 67 stars)
- Built entirely on Expo + Neynar (no custom backend)
- Demonstrates minimum viable Farcaster client
- Created for dwr.eth's mobile client bounty

### 8. Nook — Best Architecture Reference (Dead)

- **GitHub:** github.com/nook-app/nook-client (MIT)
- **Has a notification microservice in the codebase** — study this
- Monorepo: Fastify API + PostgreSQL + Prisma + Redis + BullMQ + Tamagui + Expo Router + Next.js
- Cross-platform from single codebase
- Developers admitted prioritizing "speed over best practices"

### 9. Nounspace — Community-Specific Client

- Customizable social spaces for Nouns DAO
- 11 themes, fidgets (feed, cast, gallery, video, portfolio, governance, music player, chat)
- Community token ($$SPACE on Base)
- **Demonstrates community-specific client pattern** (directly relevant to ZAO)

---

### Feature Comparison Matrix

| Feature | Farcaster App | Herocast | Recaster | Sonata | ZAO OS (Target) |
|---------|--------------|----------|----------|--------|-----------------|
| Feed | Algo + chrono | Chrono | Priority | Trending/Recent | Chrono + curated |
| Scheduling | No | **Yes** | **Yes** | No | Yes (built) |
| Channels | Full | Full | Full + lists | Music channels | /zao channel |
| Mini Apps | Full host | No | Yes | Frames | Mini App + host |
| Search | Basic | Basic | Basic | Music search | Full-text + music |
| DMs | Direct Casts | No | No | No | **XMTP encrypted** |
| Music | Basic embeds | None | None | **Full player** | **Full player** |
| Notifications | **Full push** | None | Yes | None | **Hybrid (see below)** |
| Mobile | Native | Desktop only | Native | Web only | PWA → Capacitor |
| Gating | None | None | None | None | **Allowlist + token** |
| AI Agent | None | None | AI focus | None | **ElizaOS agent** |
| Open Source | No | AGPL | No | MIT | Yes |

---

## Part 2: How Farcaster Notifications Work

### Protocol Level — No Built-In Notifications

The Farcaster protocol does NOT have a notification system. It defines message types (CastAdd, ReactionAdd, LinkAdd, etc.) and hubs sync/store messages. **Notifications are entirely a client-side concern.**

Clients must:
1. Subscribe to hub events or poll for new messages
2. Determine which events are "notifications" for which users
3. Deliver those notifications

---

### Neynar Notification Infrastructure

#### Notification API

```
GET /v2/farcaster/notifications/?fid={user_fid}
```

| Parameter | Type | Notes |
|-----------|------|-------|
| `fid` | integer | Required — target user |
| `type` | array | Filter: `follows`, `recasts`, `likes`, `mentions`, `replies`, `quotes` |
| `limit` | integer | Default 15, max 25 |
| `cursor` | string | Pagination |

Returns: `{ unseen_notifications_count, notifications[], next: { cursor } }`

#### Channel-Specific Notifications

```typescript
fetchChannelNotificationsForUser(fid, channelIds)
```

Filter notifications to only your community's channel — **key for ZAO OS**.

#### Mark as Seen

```typescript
markNotificationsAsSeen(fid)
```

#### Neynar Webhooks

**Create webhook:**
```
POST /v2/farcaster/webhook/
Headers: x-api-key: YOUR_KEY
Body: { name, url, subscription }
```

**Available Events:**

| Event | Filters Available |
|-------|------------------|
| `cast.created` | author_fids, mentioned_fids, parent_urls, text (regex), minimum_author_score, exclude_author_fids |
| `cast.deleted` | Same as cast.created |
| `reaction.created` | cast_hashes |
| `reaction.deleted` | cast_hashes |
| `follow.created` | user_fids, target_fids |
| `follow.deleted` | user_fids, target_fids |
| `user.created` | None |
| `user.updated` | FID list |

**Key Filters for ZAO OS:**
- `author_fids` → only ZAO members
- `mentioned_fids` → when ZAO members are mentioned
- `parent_urls` / `root_parent_urls` → your channel only
- `minimum_author_score` → filter spam (0-1)
- `text` → regex match for keywords

Security: HMAC-SHA512 signature verification for incoming webhooks.

---

### Mini App Notification System (Primary for ZAO OS)

#### How It Works

1. User enables notifications for your Mini App in their Farcaster client
2. Client generates a unique token per `(client, mini_app, user_FID)`
3. Token + delivery URL sent to your webhook
4. You store the token
5. POST to delivery URL with token to send notification
6. Farcaster client delivers as native push

#### Webhook Events (configure in `/.well-known/farcaster.json`)

```json
{
  "miniapp": {
    "webhookUrl": "https://zaoos.com/api/miniapp/webhook"
  }
}
```

| Event | When | Token? |
|-------|------|--------|
| `miniapp_added` | User adds your app | Yes (if notifications enabled) |
| `miniapp_removed` | User removes your app | No (invalidate tokens) |
| `notifications_disabled` | User turns off | No (invalidate) |
| `notifications_enabled` | User turns on | Yes (new token) |

#### Sending Notifications

**Direct:**
```
POST {token_url}
{
  "notificationId": "new-music-2026-03-14",    // max 128 chars, dedup key
  "title": "New music in ZAO",                  // max 32 chars
  "body": "3 new tracks shared by members",     // max 128 chars
  "targetUrl": "https://zaoos.com/feed",         // max 1024 chars
  "tokens": ["token1", "token2", ...]            // max 100 per request
}
```

Response: `{ successfulTokens, invalidTokens, rateLimitedTokens }`

**Via Neynar (managed):**
```
POST /v2/farcaster/frame/notifications/
{
  notification: { title, body, target_url, uuid },
  target_fids: [fid1, fid2, ...],               // up to 100, empty = all
  filters: {
    exclude_fids, following_fid,
    minimum_user_score, near_location
  }
}
```

#### Rate Limits
- **1 notification per 30 seconds** per token (per user per app)
- **100 notifications per day** per token (per user per app)
- Deduplication: `(FID, notificationId)` pair deduplicates within 24 hours

---

## Part 3: Recommended Notification Architecture for ZAO OS

### Hybrid 3-Layer Approach

```
┌─────────────────────────────────────────┐
│  Layer 1: Mini App Push Notifications    │
│  (For users with Farcaster app)          │
│                                          │
│  Triggers: mentions, replies, new music  │
│  Delivery: Native push via Farcaster     │
│  Rate limit: 100/day per user            │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  Layer 2: Neynar Webhooks → Supabase    │
│  (In-app notifications)                  │
│                                          │
│  Neynar webhook → API route →            │
│  INSERT into notifications table →       │
│  Supabase Realtime → UI badge + feed     │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  Layer 3: Polling Fallback              │
│  (For users without Mini App enabled)    │
│                                          │
│  Poll GET /notifications every 30-60s    │
│  Show bell badge count                   │
└──────────────────────────────────────────┘
```

### Supabase Notifications Table

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_fid INTEGER NOT NULL,
  type TEXT NOT NULL,  -- 'mention', 'reply', 'like', 'recast', 'follow', 'music_share'
  actor_fid INTEGER NOT NULL,
  actor_username TEXT,
  actor_pfp TEXT,
  cast_hash TEXT,
  channel_id TEXT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  target_url TEXT,
  seen BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_fid, created_at DESC);
CREATE INDEX idx_notifications_unseen ON notifications(recipient_fid) WHERE seen = false;
```

### Notification Priority

| Priority | Events | Delivery |
|----------|--------|----------|
| **High** | Mentions, replies, DMs | Immediate push + in-app |
| **Medium** | Likes, recasts, new music | Batch every 15 min or in-app only |
| **Low** | Follows, profile updates, community stats | Daily digest or in-app only |

### Grouping
- Group likes: "5 people liked your cast"
- Group follows: "3 new members joined ZAO"
- Never group mentions or replies (high priority)

### Cross-Client Deduplication
- Users with Farcaster app + ZAO OS will get duplicates if both notify
- **Solution:** ZAO sends only ZAO-specific notifications via Mini App (community events, music drops). Let Farcaster app handle standard social (likes, follows).
- Use stable `notificationId` values: `"cast-reply-{hash}"`, `"music-share-{id}"`
- 24-hour dedup window built into Mini App system

### Read/Unread State
- Store `last_seen_timestamp` per user in Supabase
- `unseen_count = COUNT(*) WHERE created_at > last_seen_timestamp AND recipient_fid = ?`
- Mark seen when user opens notification tab
- Supabase Realtime updates badge count live

---

## Part 4: What ZAO OS Already Has (from codebase)

ZAO OS already implements several notification pieces:

| Component | Status | File |
|-----------|--------|------|
| Neynar webhook handler | Built | `/api/webhooks/neynar/route.ts` |
| Mini App webhook handler | Built | `/api/miniapp/webhook/route.ts` |
| Notification token storage | Built | `notification_tokens` table |
| Mini App manifest | Built | `/.well-known/farcaster.json` |
| HMAC webhook verification | Built | In webhook routes |

### What Still Needs to Be Built

1. **Notifications table** — store processed events for in-app feed
2. **Supabase Realtime subscription** — live badge count + notification feed
3. **Notification bell UI** — dropdown with grouped notifications
4. **Read/unread state** — per-user last_seen tracking
5. **Push sending logic** — process webhook events → send Mini App notifications
6. **Notification preferences** — per-user settings (which types, frequency)
7. **Grouping logic** — batch likes/reactions into single notifications
8. **Web Push fallback** — for users not on Farcaster app

---

## ZAO OS Competitive Position

No other Farcaster client combines:
- **Gated community** (allowlist + token gating)
- **Music-first** (inline players, queue, curation)
- **Encrypted DMs** (XMTP)
- **AI agent** (ElizaOS)
- **Notifications** (Mini App push + in-app + email digest)
- **Governance** (fractal voting, Respect tokens)
- **Cross-platform publishing** (Farcaster + Lens + Bluesky + Hive + web2)

The closest is Nounspace (community-specific + customizable) but it targets Nouns DAO, not music. Sonata has music but no gating, no DMs, no notifications. **ZAO OS is uniquely positioned.**

---

## MIT-Licensed Clients to Study (Safe to Borrow From)

| Client | What to Study |
|--------|--------------|
| **Sonata** | Music embed handling, channel organization, points system |
| **Nook** | Notification microservice architecture, cross-platform (Expo + Next.js) |
| **Litecast** | Minimum viable Farcaster client on Expo |
| **Opencast** | Standalone client pattern, notification badges |

**Avoid borrowing from Herocast** — AGPL means derivatives must also be AGPL.

---

## Sources

- [Neynar Notifications API](https://docs.neynar.com/reference/fetch-all-notifications)
- [Neynar Channel Notifications](https://docs.neynar.com/reference/fetch-channel-notifications-for-user)
- [Neynar Webhooks](https://docs.neynar.com/docs/how-to-create-webhooks-on-the-go-using-the-sdk)
- [Neynar Mini App Notifications](https://docs.neynar.com/docs/send-mini-app-notifications-with-neynar)
- [Farcaster Mini Apps Spec — Notifications](https://miniapps.farcaster.xyz/docs/guides/notifications)
- [Farcaster Mini Apps — Adding Notifications](https://miniapps.farcaster.xyz/docs/guides/notifications-webhooks)
- [Herocast GitHub](https://github.com/hero-org/herocast)
- [Sonata GitHub](https://github.com/Coop-Records/sonata)
- [Litecast GitHub](https://github.com/dylsteck/litecast)
- [Nook GitHub](https://github.com/nook-app/nook-client)
- [Opencast GitHub](https://github.com/stephancill/opencast)
- [Recaster](https://recaster.org)
- [Buoy](https://buoy.club)
- [Yup](https://yup.io)
- [Nounspace](https://nounspace.com)
- [Kiwi News](https://news.kiwistand.com)
- [Push Protocol](https://push.org)
