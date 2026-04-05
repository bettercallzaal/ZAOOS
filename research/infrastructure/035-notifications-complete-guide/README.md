# 35 — Notifications: Complete Implementation Guide

> **Status:** Consolidated from all research + codebase analysis
> **Date:** March 2026
> **Goal:** Single source of truth for everything notification-related in ZAO OS
> **Implementation:** Core infrastructure 70% built, UI 0% built

---

## What's Already Built

| Component | File | Status |
|-----------|------|--------|
| Notification token storage | `notification_tokens` table (Supabase) | ✅ Built |
| Mini App webhook handler | `src/app/api/miniapp/webhook/route.ts` | ✅ Built |
| Core `sendNotification()` | `src/lib/notifications.ts` | ✅ Built |
| Chat send → notification trigger | `src/app/api/chat/send/route.ts` | ✅ Built |
| Mini App manifest | `public/.well-known/farcaster.json` | ✅ Built |
| HMAC webhook verification | `src/app/api/webhooks/neynar/route.ts` | ✅ Built |
| Token invalidation handling | In `sendNotification()` | ✅ Built |
| Multi-client support | Different notification URLs per client | ✅ Built |

## What Needs to Be Built

| Component | Priority | Effort |
|-----------|----------|--------|
| `notifications` table + RLS | High | Small |
| Notification feed UI (bell + dropdown) | High | Medium |
| Supabase Realtime subscription (live badge) | High | Small |
| Read/unread state tracking | High | Small |
| Notification grouping ("5 people liked...") | Medium | Medium |
| User notification preferences UI | Medium | Medium |
| Web Push API fallback | Medium | Medium |
| Email digest (weekly via Resend) | Medium | Small |
| Push Protocol integration | Low | Medium |
| Rich notification templates | Low | Small |

---

## Architecture: 3-Layer Hybrid System

```
┌─────────────────────────────────────────────────┐
│  Layer 1: Mini App Push Notifications            │
│  (Native push via Farcaster app)                 │
│                                                   │
│  Trigger: New message → sendNotification()        │
│  Delivery: POST to token URL → Farcaster app      │
│  Rate: 1/30s per token, 100/day per user          │
│  Already built: YES                               │
│  Events: mentions, replies, new music, DMs        │
└──────────────┬────────────────────────────────────┘
               │
┌──────────────▼────────────────────────────────────┐
│  Layer 2: Neynar Webhooks → Supabase Realtime     │
│  (In-app notification feed)                        │
│                                                    │
│  Trigger: Neynar webhook → API route →             │
│           INSERT into notifications table →        │
│           Supabase Realtime → UI badge + feed      │
│  Already built: Webhook handler YES, UI NO         │
│  Events: all events, grouped + prioritized         │
└──────────────┬────────────────────────────────────┘
               │
┌──────────────▼────────────────────────────────────┐
│  Layer 3: Polling Fallback                         │
│  (For users without Mini App enabled)              │
│                                                    │
│  Poll: GET /v2/farcaster/notifications/ every 30s  │
│  Show: Bell badge count                            │
│  Already built: NO                                 │
└────────────────────────────────────────────────────┘
```

---

## How Farcaster Protocol Handles Notifications

The protocol does NOT have a notification system. It defines message types and hubs store/sync messages. **Notifications are entirely client-side.**

Protocol message types that generate notification-worthy events:
- `CastAdd` → reply/mention notification
- `ReactionAdd` → like/recast notification
- `LinkAdd` → follow notification
- `FrameAction` → Mini App interaction

Clients must subscribe to hub events (or use Neynar) and build their own notification logic.

---

## Neynar Notification API

### Fetch Notifications

```
GET /v2/farcaster/notifications/?fid={user_fid}
```

| Parameter | Type | Notes |
|-----------|------|-------|
| `fid` | integer | Required |
| `type` | array | `follows`, `recasts`, `likes`, `mentions`, `replies`, `quotes` |
| `limit` | integer | Default 15, max 25 |
| `cursor` | string | Pagination |

Returns: `{ unseen_notifications_count, notifications[], next: { cursor } }`

### Channel-Specific Notifications

```typescript
neynar.fetchChannelNotificationsForUser(fid, channelIds)
```
Filter to only ZAO's channels — key for reducing noise.

### Mark as Seen

```typescript
neynar.markNotificationsAsSeen(fid)
```

---

## Neynar Webhooks

### Create Webhook

```
POST /v2/farcaster/webhook/
Headers: x-api-key: YOUR_KEY
Body: { name, url, subscription }
```

### Available Events & Filters

| Event | Key Filters for ZAO |
|-------|---------------------|
| `cast.created` | `author_fids` (ZAO members), `mentioned_fids`, `parent_urls` (your channel), `minimum_author_score`, `text` (regex) |
| `cast.deleted` | Same as cast.created |
| `reaction.created` | `cast_hashes` |
| `reaction.deleted` | `cast_hashes` |
| `follow.created` | `user_fids`, `target_fids` |
| `follow.deleted` | `user_fids`, `target_fids` |

### Security
HMAC-SHA512 signature verification — already implemented in `src/app/api/webhooks/neynar/route.ts`.

### Credit Cost
- Webhook delivery: 100 cu per event
- Kafka stream: 15 cu per event
- **Webhooks are ~11x cheaper than polling** for 1 user, ~57x cheaper for 5 users

---

## Mini App Notification System

### Token Lifecycle

1. User enables notifications → Farcaster client generates token
2. Client sends `miniapp_added` or `notifications_enabled` webhook to your server
3. You store token in `notification_tokens` table
4. When event happens → POST to token URL with payload
5. Farcaster client delivers native push notification

### Webhook Events

Configure in `/.well-known/farcaster.json`:
```json
{ "miniapp": { "webhookUrl": "https://zaoos.com/api/miniapp/webhook" } }
```

| Event | When | Token? |
|-------|------|--------|
| `miniapp_added` | User adds app | Yes (if notifs enabled) |
| `miniapp_removed` | User removes app | No (invalidate) |
| `notifications_enabled` | User turns on | Yes (new token) |
| `notifications_disabled` | User turns off | No (invalidate) |

### Sending Notifications

**Direct (what ZAO OS does now):**
```
POST {token_url}
{
  "notificationId": "msg-{timestamp}-{fid}",  // max 128 chars, dedup key
  "title": "Author Name",                      // max 32 chars
  "body": "Message preview...",                 // max 128 chars
  "targetUrl": "https://zaoos.com/chat",        // max 1024 chars
  "tokens": ["token1", "token2", ...]           // max 100 per request
}
```

Response: `{ successfulTokens, invalidTokens, rateLimitedTokens }`

**Via Neynar (managed alternative):**
```
POST /v2/farcaster/frame/notifications/
{
  notification: { title, body, target_url, uuid },
  target_fids: [fid1, fid2, ...],
  filters: { exclude_fids, minimum_user_score, near_location }
}
```

### Rate Limits
- **1 per 30 seconds** per token per app
- **100 per day** per token per app
- Dedup: `(FID, notificationId)` within 24 hours

### Current Implementation

**`src/lib/notifications.ts`** (73 lines):
- Retrieves all enabled tokens from `notification_tokens`
- Groups tokens by notification URL (multi-client support)
- Batches in groups of 100
- Sends POST to each client endpoint
- Handles invalid tokens (disables them)
- Excludes sender FID to prevent self-notification

**`src/app/api/chat/send/route.ts`** triggers notification:
- Title: `{author display name} in {channels}`
- Body: First 80 chars of message with ellipsis
- Target URL: `https://zaoos.com/chat`
- Notification ID: `msg-{timestamp}-{fid}`
- Fire-and-forget (doesn't block the send response)

---

## Notifications Table (To Be Created)

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_fid INTEGER NOT NULL,
  type TEXT NOT NULL,
  -- Types: 'mention', 'reply', 'like', 'recast', 'follow',
  --        'music_share', 'new_member', 'respect_earned', 'event'
  actor_fid INTEGER NOT NULL,
  actor_username TEXT,
  actor_pfp TEXT,
  cast_hash TEXT,
  channel_id TEXT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  target_url TEXT,
  group_key TEXT,  -- For grouping: 'like-{cast_hash}', 'follow-{date}'
  seen BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notif_recipient ON notifications(recipient_fid, created_at DESC);
CREATE INDEX idx_notif_unseen ON notifications(recipient_fid) WHERE seen = false;
CREATE INDEX idx_notif_group ON notifications(group_key, recipient_fid);
```

---

## Notification Priority & Grouping

### Priority Levels

| Priority | Events | Delivery |
|----------|--------|----------|
| **Immediate** | Mentions, replies, DMs | Push + in-app |
| **Batched (15 min)** | Likes, recasts, new music | In-app grouped |
| **Daily** | New members, event scheduled | Digest or in-app |
| **Weekly** | Community stats, top content | Email only |

### Grouping Rules

| Group Key | Display |
|-----------|---------|
| `like-{cast_hash}` | "5 people liked your cast" |
| `recast-{cast_hash}` | "3 people recasted your cast" |
| `follow-{date}` | "4 new members joined ZAO" |
| `music-{date}` | "3 new tracks shared today" |
| None (ungrouped) | Mentions, replies, DMs shown individually |

---

## Cross-Client Deduplication

Users with Farcaster app + ZAO OS both open will get duplicates.

**Solution:**
- ZAO sends only **ZAO-specific** notifications via Mini App (community events, music drops, Respect earned)
- Let Farcaster app handle standard social (likes, follows, general mentions)
- Use stable `notificationId`: `"cast-reply-{hash}"`, `"music-share-{id}"`
- 24-hour dedup window built into Mini App system

---

## Web Push API Fallback (Phase 2)

For users who don't have the Farcaster app installed:

1. Generate VAPID keys (`web-push` npm package)
2. Register service worker in Next.js
3. Request push permission (at day 3 or 5th session, NOT first visit)
4. Store push subscription in Supabase
5. On webhook event: encrypt payload, send via Web Push

---

## Email Digest (Phase 2)

Weekly email via **Resend** (free 3K emails/mo):
- Send Monday 10am local time
- Content: Top 5 tracks, new members, upcoming events, "Your stats this week"
- Triggered emails: welcome, first Respect earned, "10 reactions on your track", re-engagement at D14 inactive

---

## Notification UX Rules

1. **Ask permission at day 3** or 5th session, not first visit
2. **Max 5 push/day** regardless of activity
3. **Quiet hours:** 10pm-8am local timezone
4. **Auto-mute:** If user ignores 5 consecutive notifications of a type, auto-mute + prompt
5. **Frequency cap per type:** Max 1 push per event type per hour
6. **Never notify:** Random channel activity, admin system messages
7. **Always notify:** Direct mentions, replies to your casts, DMs

---

## Read/Unread State

```sql
-- Per-user tracking
ALTER TABLE sessions ADD COLUMN notifications_last_seen TIMESTAMPTZ;

-- Query unseen count
SELECT COUNT(*) FROM notifications
WHERE recipient_fid = $1
  AND created_at > (SELECT notifications_last_seen FROM sessions WHERE fid = $1)
  AND seen = false;

-- Mark all seen
UPDATE notifications SET seen = true
WHERE recipient_fid = $1 AND seen = false;
```

Supabase Realtime subscription on `notifications` table pushes live badge updates to UI.

---

## Implementation Roadmap

### Sprint 1: In-App Notification Feed (1-2 days)

1. Create `notifications` table with schema above
2. Modify Neynar webhook handler to INSERT notification records
3. Build notification bell component with Supabase Realtime badge count
4. Build notification dropdown (grouped, with actor avatars)
5. Add read/unread state management

### Sprint 2: Smart Push Logic (1 day)

6. Add notification type filtering to `sendNotification()`
7. Implement grouping logic (batch likes/follows before pushing)
8. Add stable `notificationId` patterns for dedup
9. Only send ZAO-specific events via Mini App push

### Sprint 3: Preferences & Fallback (1-2 days)

10. Build notification preferences UI (per-type toggles)
11. Store preferences in Supabase per user
12. Add Web Push API as fallback for non-Farcaster users
13. Set up Resend for weekly email digest

---

## Sources (Consolidated)

- [Neynar Notifications API](https://docs.neynar.com/reference/fetch-all-notifications)
- [Neynar Channel Notifications](https://docs.neynar.com/reference/fetch-channel-notifications-for-user)
- [Neynar Webhooks SDK](https://docs.neynar.com/docs/how-to-create-webhooks-on-the-go-using-the-sdk)
- [Neynar Mini App Notifications](https://docs.neynar.com/docs/send-mini-app-notifications-with-neynar)
- [Farcaster Mini Apps — Notifications Guide](https://miniapps.farcaster.xyz/docs/guides/notifications)
- [Farcaster Mini Apps — Webhooks](https://miniapps.farcaster.xyz/docs/guides/notifications-webhooks)
- [Web Push API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Resend](https://resend.com/)
- [Push Protocol](https://push.org/)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- ZAO OS source: `src/lib/notifications.ts`, `src/app/api/miniapp/webhook/route.ts`, `src/app/api/chat/send/route.ts`, `src/app/api/webhooks/neynar/route.ts`
