# 214 — Twitch API Deep Integration: Comprehensive Feature Map for ZAO OS

> **Status:** Research complete
> **Date:** March 28, 2026
> **Goal:** Map every Twitch Helix API capability to ZAO OS features, assess current integration gaps, and prioritize what to build next
> **Updates:** Doc 163 (Multistreaming Platforms), Doc 213 (Spaces Streaming Architecture)

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Immediate priority** | Expand OAuth scopes from 3 to 10+ to unlock all features below |
| **Quick win (P0)** | Auto-set Twitch title/category when going live from ZAO |
| **Quick win (P0)** | Embed Twitch player in /spaces for viewers |
| **High value (P1)** | EventSub webhooks for stream.online/offline + chat bridging |
| **High value (P1)** | Polls and Predictions from ZAO OS dashboard |
| **Medium value (P2)** | Channel Points custom rewards tied to Respect |
| **Medium value (P2)** | Clip creation from ZAO + stream markers |
| **Future (P3)** | Stream schedule sync, Guest Star, raid automation |
| **Skip for now** | Bits/monetization, Extensions, Ads management |

---

## Part 1 — Current ZAO OS Twitch Integration

### What We Have Today

| Component | File | What It Does |
|-----------|------|-------------|
| OAuth flow | `src/app/api/auth/twitch/route.ts` | Redirects to Twitch OAuth with 3 scopes |
| Callback handler | `src/app/api/auth/twitch/callback/route.ts` | Exchanges code for token, fetches user info + stream key, saves to `connected_platforms` |
| Platform API | `src/app/api/platforms/twitch/route.ts` | GET (fetch connection) + DELETE (disconnect) |
| Settings UI | `src/components/settings/TwitchConnect.tsx` | Connect/disconnect button, shows stream key + RTMP URL |
| Broadcast modal | `src/components/spaces/BroadcastModal.tsx` | Multi-platform broadcast setup, toggles Twitch on/off |
| Broadcast start | `src/app/api/broadcast/start/route.ts` | Pulls saved RTMP URL + stream key for Twitch (no API calls needed) |

### Current OAuth Scopes (3 total)

```
channel:read:stream_key    — Read stream key (used to get RTMP credentials)
channel:manage:broadcast   — Modify channel info, create markers
chat:read                  — Read chat messages (IRC)
```

### What's Missing

The current integration is **RTMP-only** — it connects the Twitch account and pulls the stream key so ZAO can multistream via RTMP. We do not use any of the rich Twitch API features: no title updates, no chat bridging, no polls, no clips, no viewer stats, no event notifications.

---

## Part 2 — Scopes: Current vs Needed

### Scope Expansion Plan

| Scope | Currently Requested? | What It Unlocks | Priority |
|-------|---------------------|-----------------|----------|
| `channel:read:stream_key` | YES | Read stream key | -- |
| `channel:manage:broadcast` | YES | Modify title/game, create markers | P0 |
| `chat:read` | YES | Read chat (IRC) | -- |
| `user:write:chat` | NO | Send chat messages via API | P1 |
| `user:read:chat` | NO | Receive chat via EventSub | P1 |
| `channel:manage:polls` | NO | Create/end polls | P1 |
| `channel:manage:predictions` | NO | Create/end predictions | P1 |
| `channel:manage:redemptions` | NO | Create custom rewards, manage redemptions | P2 |
| `clips:edit` | NO | Create clips programmatically | P2 |
| `channel:manage:schedule` | NO | Manage stream schedule | P2 |
| `channel:manage:raids` | NO | Start/cancel raids | P3 |
| `channel:read:subscriptions` | NO | View subscriber list | P3 |
| `moderator:manage:chat_messages` | NO | Delete chat messages | P2 |
| `moderator:read:chatters` | NO | View active chatters list | P2 |
| `moderator:manage:announcements` | NO | Send chat announcements | P2 |
| `channel:read:hype_train` | NO | Access Hype Train events | P3 |
| `channel:manage:guest_star` | NO | Manage Guest Star sessions | P3 |

### Implementation: Update Scopes

The scope string lives in one place — easy to update:

**File:** `src/app/api/auth/twitch/route.ts` (line 16)

```
// Current
const scopes = 'channel:read:stream_key channel:manage:broadcast chat:read';

// Proposed (Phase 1 — P0 + P1)
const scopes = [
  'channel:read:stream_key',
  'channel:manage:broadcast',
  'chat:read',
  'user:write:chat',
  'user:read:chat',
  'channel:manage:polls',
  'channel:manage:predictions',
  'clips:edit',
].join(' ');

// Proposed (Phase 2 — add P2)
// Add: channel:manage:redemptions channel:manage:schedule
//      moderator:manage:chat_messages moderator:read:chatters
//      moderator:manage:announcements
```

**Note:** Users who already connected must re-authorize to get new scopes. Show a "Reconnect for new features" prompt in Settings when stored scopes differ from required scopes.

---

## Part 3 — Feature Map: Every API Endpoint Assessed

### 3A. Channel Management (P0 — Quick Wins)

| Endpoint | Method | What It Does | ZAO OS Use Case | Scope Needed |
|----------|--------|-------------|-----------------|--------------|
| `/helix/channels` | PATCH | Update title, game, language, tags | **Auto-set title to room name when going live** | `channel:manage:broadcast` (HAVE) |
| `/helix/channels` | GET | Read channel info | Show current Twitch channel status in broadcast modal | App token |
| `/helix/streams` | GET | Get live stream info (viewers, game, title) | **Show live viewer count in ZAO broadcast panel** | App token |
| `/helix/streams/key` | GET | Read stream key | Already using this | `channel:read:stream_key` (HAVE) |

**Implementation plan:**

1. When user clicks "Go Live" in BroadcastModal and Twitch is enabled, call `PATCH /helix/channels` to set the title to the room name and category to "Music" (game_id: 26936) or "DJs" (game_id: 743).
2. While broadcasting, poll `GET /helix/streams` every 30s to show viewer count in the broadcast panel.
3. No new scopes needed — `channel:manage:broadcast` is already requested.

**Files to create/modify:**
- `src/app/api/platforms/twitch/channel/route.ts` — PATCH handler to update channel info
- `src/app/api/platforms/twitch/stream/route.ts` — GET handler for live stream stats
- Modify `src/app/api/broadcast/start/route.ts` — call channel update when Twitch is a destination

### 3B. Twitch Player Embed (P0 — Quick Win)

| Method | What It Does | ZAO OS Use Case |
|--------|-------------|-----------------|
| iframe / JS embed | Embed live Twitch stream | **Show Twitch player inside /spaces room for viewers** |

**How it works:**
- iframe: `https://player.twitch.tv/?channel={username}&parent=zaoos.com&muted=true`
- JS: Load `https://embed.twitch.tv/embed/v1.js`, create `new Twitch.Embed()`
- Requires `parent` parameter set to `zaoos.com`

**ZAO OS integration:**
When a host is broadcasting to Twitch, show an embedded Twitch player in the room for viewers who are not in the audio call. This creates a "watch party" mode — listeners in the audio room hear the host directly, but casual visitors can see the Twitch stream.

**Files to create:**
- `src/components/spaces/TwitchEmbed.tsx` — Twitch player embed component
- Add to room view when broadcast target includes Twitch

### 3C. Chat Integration (P1 — High Value)

| Endpoint | Method | What It Does | ZAO OS Use Case | Scope Needed |
|----------|--------|-------------|-----------------|--------------|
| `/helix/chat/messages` | POST | Send chat message | **Bridge ZAO room chat to Twitch chat** | `user:write:chat` (NEED) |
| EventSub `channel.chat.message` | WS | Receive chat messages | **Show Twitch chat in ZAO room** | `user:read:chat` (NEED) |
| `/helix/chat/chatters` | GET | List active chatters | Show Twitch chatter count in room | `moderator:read:chatters` (NEED) |
| `/helix/chat/announcements` | POST | Send announcement | Announce room events in Twitch chat | `moderator:manage:announcements` (NEED) |
| `/helix/chat/settings` | GET/PUT | Read/modify chat settings | Sync chat modes (emote-only, sub-only) | `moderator:manage:chat_settings` |

**Chat bridge architecture:**

```
ZAO OS Room Chat                    Twitch Chat
     |                                   |
     |--- user sends message -------->  POST /helix/chat/messages
     |                                   |
     |<-- EventSub channel.chat.message --|
     |    (show in ZAO with Twitch badge) |
```

**Implementation plan:**
1. Subscribe to `channel.chat.message` EventSub (WebSocket transport for client, webhook for server).
2. Display Twitch chat messages in ZAO room chat with a purple Twitch badge.
3. Optionally relay ZAO chat messages to Twitch via `POST /helix/chat/messages`.
4. When host sends announcement in ZAO, also send to Twitch via `/helix/chat/announcements`.

**Files to create:**
- `src/app/api/platforms/twitch/chat/route.ts` — send messages, get chatters
- `src/app/api/platforms/twitch/eventsub/route.ts` — EventSub webhook handler
- `src/components/spaces/TwitchChatBridge.tsx` — UI for bridged chat display

### 3D. Polls and Predictions (P1 — High Value for Music Community)

| Endpoint | Method | What It Does | ZAO OS Use Case | Scope Needed |
|----------|--------|-------------|-----------------|--------------|
| `/helix/polls` | POST | Create poll | **"What should I play next?" polls** | `channel:manage:polls` (NEED) |
| `/helix/polls` | PATCH | End poll | End poll early, show results | `channel:manage:polls` (NEED) |
| `/helix/predictions` | POST | Create prediction | **"Will the DJ drop a remix?" predictions** | `channel:manage:predictions` (NEED) |
| `/helix/predictions` | PATCH | End/resolve prediction | Resolve with outcome | `channel:manage:predictions` (NEED) |

**Music community use cases:**
- **Song vote:** "Next track?" with 5 choices from the queue — Twitch viewers vote
- **Set prediction:** "Will the DJ play over 2 hours?" — Channel Points wagered
- **Battle poll:** During a WaveWarZ battle, Twitch viewers vote on the winner
- **Vibe check:** "Rate this set: Fire / Mid / Next" — instant audience feedback

**Implementation plan:**
1. Add "Create Twitch Poll" action in broadcast controls.
2. Pre-fill with queue tracks or custom options.
3. Subscribe to `channel.poll.progress` and `channel.poll.end` EventSub events to show results live in ZAO.
4. Similarly for predictions — create from ZAO, show live participation.

**Files to create:**
- `src/app/api/platforms/twitch/polls/route.ts` — create/end polls
- `src/app/api/platforms/twitch/predictions/route.ts` — create/end/resolve predictions
- `src/components/spaces/TwitchInteractions.tsx` — UI for polls/predictions controls

### 3E. Clips and Markers (P2)

| Endpoint | Method | What It Does | ZAO OS Use Case | Scope Needed |
|----------|--------|-------------|-----------------|--------------|
| `/helix/clips` | POST | Create clip (up to 90s) | **"Clip that!" button in broadcast panel** | `clips:edit` (NEED) |
| `/helix/clips` | GET | Get clips | Show clips gallery for a stream | App token |
| `/helix/streams/markers` | POST | Create stream marker | **Auto-mark track changes in the stream** | `channel:manage:broadcast` (HAVE) |
| `/helix/streams/markers` | GET | Get markers | Show marker timeline | App token |

**Music community use cases:**
- **Clip highlights:** Listener hears a great transition, hits "Clip" — creates a 90s Twitch clip automatically.
- **Auto-markers:** Every time the DJ changes tracks, ZAO creates a stream marker with the track name. This creates a timestamped setlist in the VOD.
- **Clip gallery:** After a stream, show all clips in the room's history.

**Files to create:**
- `src/app/api/platforms/twitch/clips/route.ts` — create/get clips
- `src/app/api/platforms/twitch/markers/route.ts` — create/get markers
- Modify `src/providers/audio/PlayerProvider.tsx` — on track change, create marker if broadcasting to Twitch

### 3F. Channel Points & Custom Rewards (P2)

| Endpoint | Method | What It Does | ZAO OS Use Case | Scope Needed |
|----------|--------|-------------|-----------------|--------------|
| `/helix/channel_points/custom_rewards` | POST | Create custom reward | **"Request a song" for Channel Points** | `channel:manage:redemptions` (NEED) |
| `/helix/channel_points/custom_rewards` | GET/PATCH/DELETE | Manage rewards | Update pricing, enable/disable | `channel:manage:redemptions` (NEED) |
| `/helix/channel_points/custom_rewards/redemptions` | GET/PATCH | Manage redemptions | Fulfill/reject requests | `channel:manage:redemptions` (NEED) |

**Music community use cases:**
- **Song request:** Twitch viewers spend Channel Points to request a track — appears in ZAO queue.
- **Shoutout:** Spend points to get shouted out during the stream.
- **VIP access:** Spend points to join the ZAO audio room as a speaker.
- **Respect bridge:** Earn Respect in ZAO for creating rewards or fulfilling redemptions on Twitch.

**Files to create:**
- `src/app/api/platforms/twitch/rewards/route.ts` — CRUD for custom rewards
- `src/app/api/platforms/twitch/redemptions/route.ts` — manage redemptions

### 3G. Stream Schedule (P2)

| Endpoint | Method | What It Does | ZAO OS Use Case | Scope Needed |
|----------|--------|-------------|-----------------|--------------|
| `/helix/schedule` | GET | Get stream schedule | Show Twitch schedule in ZAO | App token |
| `/helix/schedule/segment` | POST | Create schedule segment | **Sync ZAO event calendar to Twitch** | `channel:manage:schedule` (NEED) |
| `/helix/schedule/segment` | PUT/DELETE | Update/delete segments | Manage schedule from ZAO | `channel:manage:schedule` (NEED) |
| `/helix/schedule/icalendar` | GET | Get iCal feed | Import Twitch schedule into ZAO calendar | None |

**Implementation:**
When a host creates a scheduled room in ZAO, also create a corresponding Twitch schedule segment. When the event starts, auto-go-live on Twitch.

### 3H. EventSub Real-Time Events (P1 — Foundation)

EventSub is the backbone for all real-time Twitch integration. Two transport methods:

| Transport | Best For | Limits | Auth |
|-----------|----------|--------|------|
| **Webhooks** | Server-side, always-on | Unlimited subs per app | App access token |
| **WebSockets** | Client-side, per-user | 3 connections, 300 subs each | User access token |

**Priority EventSub subscriptions for ZAO OS:**

| Event | What Happens | ZAO OS Action | Priority |
|-------|-------------|---------------|----------|
| `stream.online` | Broadcaster goes live | Show "Live on Twitch" badge in ZAO profile, notify followers | P1 |
| `stream.offline` | Broadcaster stops | Remove live badge, save stream stats | P1 |
| `channel.chat.message` | Chat message sent | Bridge to ZAO room chat | P1 |
| `channel.poll.begin/progress/end` | Poll lifecycle | Show poll results live in ZAO | P1 |
| `channel.prediction.begin/progress/lock/end` | Prediction lifecycle | Show prediction in ZAO | P1 |
| `channel.channel_points_custom_reward_redemption.add` | Reward redeemed | Process song requests, VIP access | P2 |
| `channel.subscribe` | New sub | Show in ZAO room chat as event | P3 |
| `channel.cheer` | Bits cheered | Show in ZAO room chat as event | P3 |
| `channel.raid` | Incoming raid | Notify room host, welcome raiders | P3 |
| `channel.hype_train.begin/progress/end` | Hype Train | Show hype train in ZAO room | P3 |

**Implementation:**
- Use **webhooks** for server-side events (stream.online/offline) — these work even when ZAO is not open.
- Use **WebSockets** for per-session events (chat, polls, predictions) — active only during broadcast.
- EventSub webhook endpoint: `POST /api/platforms/twitch/eventsub/route.ts`
- Must handle verification challenge (respond with `challenge` field on subscription creation).

### 3I. Guest Star (P3)

| Endpoint | What It Does | ZAO OS Use Case |
|----------|-------------|-----------------|
| Guest Star session CRUD | Manage collaborative streams | Invite ZAO artists to co-stream on Twitch |
| Guest Star slots | Assign guests to slots | Map ZAO room speakers to Twitch Guest Star slots |

This is Twitch's version of collaborative streaming. Could sync with ZAO audio rooms where speakers are also visible on Twitch via Guest Star. Low priority — ZAO rooms already handle multi-speaker well.

### 3J. Raids (P3)

| Endpoint | Method | What It Does | ZAO OS Use Case |
|----------|--------|-------------|-----------------|
| `/helix/raids` | POST | Start a raid | After a ZAO session ends, raid another ZAO member's Twitch |
| `/helix/raids` | DELETE | Cancel a raid | Cancel if wrong target |

**Music community use case:** After a DJ finishes their set, one-click raid another ZAO member who is streaming. Builds community cross-promotion.

---

## Part 4 — Priority Matrix

### P0 — Quick Wins (1-2 days each, no new scopes needed)

| Feature | Effort | Value | Dependencies |
|---------|--------|-------|-------------|
| Auto-set Twitch title/category on Go Live | 4h | HIGH | Uses existing `channel:manage:broadcast` scope |
| Show live viewer count during broadcast | 4h | MEDIUM | App access token only |
| Embed Twitch player in /spaces for viewers | 4h | HIGH | No auth needed, just iframe |
| Auto-create stream markers on track change | 4h | HIGH | Uses existing `channel:manage:broadcast` scope |

### P1 — High Value (1-2 weeks, needs scope expansion)

| Feature | Effort | Value | Dependencies |
|---------|--------|-------|-------------|
| EventSub webhook setup (online/offline) | 2d | HIGH | Webhook endpoint, app token |
| Chat bridge (Twitch <-> ZAO room) | 3d | VERY HIGH | `user:write:chat`, `user:read:chat`, EventSub |
| Polls from ZAO broadcast panel | 2d | HIGH | `channel:manage:polls` |
| Predictions from ZAO broadcast panel | 2d | HIGH | `channel:manage:predictions` |
| "Live on Twitch" badges in profiles | 1d | MEDIUM | EventSub stream.online |

### P2 — Medium Value (1 week each)

| Feature | Effort | Value | Dependencies |
|---------|--------|-------|-------------|
| Clip creation from ZAO | 2d | MEDIUM | `clips:edit` |
| Custom rewards (song request via Channel Points) | 3d | HIGH | `channel:manage:redemptions` |
| Stream schedule sync | 2d | MEDIUM | `channel:manage:schedule` |
| Chat moderation tools | 2d | LOW | `moderator:*` scopes |

### P3 — Future / Low Priority

| Feature | Effort | Value | Dependencies |
|---------|--------|-------|-------------|
| Raid automation | 1d | LOW | `channel:manage:raids` |
| Guest Star integration | 1w | LOW | Beta API, complex |
| Hype Train visualization | 2d | LOW | `channel:read:hype_train` |
| Subscriber sync | 1d | LOW | `channel:read:subscriptions` |

---

## Part 5 — Platform API Comparison

How does Twitch compare to the other platforms ZAO supports for streaming?

| Capability | Twitch | YouTube Live | Kick | Facebook Live |
|-----------|--------|-------------|------|---------------|
| **Official API** | Full REST API (100+ endpoints) | Full REST API (Google APIs) | Public API (new, growing) | Graph API |
| **OAuth** | Standard OAuth 2.0 | Google OAuth 2.0 | OAuth 2.0 | Facebook Login |
| **Update title/category** | PATCH /helix/channels | liveBroadcasts.update | Limited | Live video update |
| **Chat API** | Full (send/receive/moderate) | liveChatMessages (send/receive) | Chat endpoints | Comments API |
| **Chat real-time** | EventSub WebSocket + IRC | Polling (liveChatMessages.list) | WebSocket | Polling |
| **Polls** | Full API (create/end) | None (native only) | None | None |
| **Predictions** | Full API (create/resolve) | None | None | None |
| **Clips** | Full API (create/get) | None (YouTube Clips is different) | None (Kick Clips no API) | None |
| **Stream markers** | Full API | None | None | None |
| **Channel Points / Rewards** | Full API (CRUD + redemptions) | Super Chat/Thanks (limited API) | None | Stars (no API) |
| **Real-time events** | EventSub (webhook + WebSocket) | Webhook (limited) | WebSocket | Webhooks (limited) |
| **Stream schedule** | Full API (CRUD + iCal) | liveBroadcasts.insert | None | None |
| **Embed player** | iframe + JS SDK | iframe | iframe | iframe |
| **Viewer count** | GET /helix/streams | liveBroadcasts.list | GET /channels | Live video API |
| **Raids** | Full API | None | None | None |
| **Guest collaboration** | Guest Star API (beta) | None | None | None |
| **Monetization API** | Bits, Subs (read) | Super Chat (read) | None | Stars (limited) |
| **Extensions** | Full Extension framework | None | None | None |
| **DJ Program** | Yes (licensed music catalog) | No | No | No |
| **Music friendliness** | HIGH (DJ category + licensed music) | LOW (copyright strikes) | MEDIUM | LOW |

**Key insight:** Twitch has by far the richest API for interactive features. YouTube has strong broadcast management but lacks interactivity APIs. Kick is early-stage. Facebook is limited. **For a music community, Twitch's DJ Program + interactive APIs make it the highest-value platform to deeply integrate.**

---

## Part 6 — Twitch DJ Program Relevance

Twitch launched a dedicated DJ Program with licensed music from Universal Music Group, Warner Music Group, Sony Music, and independent labels via Merlin. This is highly relevant for ZAO:

- **Licensed streaming:** ZAO artists who are Twitch Partners/Affiliates can DJ with licensed music without DMCA risk.
- **DJ category:** game_id `743` for "DJs" — ZAO should auto-set this when a DJ room goes live.
- **Music catalog:** Twitch has a searchable catalog of millions of tracks. API endpoints for the catalog are under development.
- **Second channel:** As of March 2026, Twitch allows existing Partners to create a dedicated second Partner channel for DJ streams (solving revenue split / VOD restriction issues).

**ZAO integration opportunity:** When a ZAO member enrolled in the Twitch DJ Program goes live from /spaces, auto-set the DJ category and tag the stream appropriately.

---

## Part 7 — Implementation Plan

### Phase 1: Quick Wins (Week 1)

No scope changes needed. Ship immediately.

| Task | File | Description |
|------|------|-------------|
| Auto-update channel on Go Live | `src/app/api/platforms/twitch/channel/route.ts` (new) | PATCH title + game_id when broadcast starts |
| Update broadcast start | `src/app/api/broadcast/start/route.ts` (modify) | Call channel update for Twitch destinations |
| Viewer count polling | `src/app/api/platforms/twitch/stream/route.ts` (new) | GET live stream stats |
| Broadcast panel viewer count | `src/components/spaces/BroadcastModal.tsx` (modify) | Show viewer count while live |
| Twitch player embed | `src/components/spaces/TwitchEmbed.tsx` (new) | iframe embed for room viewers |
| Track change markers | `src/app/api/platforms/twitch/markers/route.ts` (new) | Create marker with track name on change |

### Phase 2: Scope Expansion + EventSub (Week 2-3)

Update OAuth scopes. Existing users must re-authorize.

| Task | File | Description |
|------|------|-------------|
| Expand OAuth scopes | `src/app/api/auth/twitch/route.ts` (modify) | Add P1 scopes |
| Scope mismatch detection | `src/components/settings/TwitchConnect.tsx` (modify) | Show "Reconnect" if scopes outdated |
| EventSub webhook handler | `src/app/api/platforms/twitch/eventsub/route.ts` (new) | Handle verification + events |
| EventSub subscription manager | `src/lib/twitch/eventsub.ts` (new) | Create/delete subscriptions |
| Token refresh utility | `src/lib/twitch/auth.ts` (new) | Refresh expired Twitch tokens |
| Chat bridge | `src/app/api/platforms/twitch/chat/route.ts` (new) | Send/receive via API |
| Chat bridge UI | `src/components/spaces/TwitchChatBridge.tsx` (new) | Display bridged messages |
| Polls API | `src/app/api/platforms/twitch/polls/route.ts` (new) | Create/end polls |
| Predictions API | `src/app/api/platforms/twitch/predictions/route.ts` (new) | Create/end/resolve predictions |
| Interactive controls UI | `src/components/spaces/TwitchInteractions.tsx` (new) | Polls + predictions panel |

### Phase 3: Advanced Features (Week 4+)

| Task | File | Description |
|------|------|-------------|
| Clip creation | `src/app/api/platforms/twitch/clips/route.ts` (new) | "Clip that!" button |
| Custom rewards | `src/app/api/platforms/twitch/rewards/route.ts` (new) | Song request via Channel Points |
| Redemption handler | `src/app/api/platforms/twitch/redemptions/route.ts` (new) | Process reward redemptions |
| Schedule sync | `src/app/api/platforms/twitch/schedule/route.ts` (new) | Sync ZAO events to Twitch schedule |
| Twitch lib utilities | `src/lib/twitch/api.ts` (new) | Shared Helix API client wrapper |

### Shared Infrastructure Needed

| Component | Description |
|-----------|-------------|
| `src/lib/twitch/api.ts` | Twitch Helix API client — handles auth headers, token refresh, rate limiting |
| `src/lib/twitch/auth.ts` | Token refresh (Twitch tokens expire in ~4h, need refresh_token flow) |
| `src/lib/twitch/eventsub.ts` | EventSub subscription manager — create, list, delete webhook subscriptions |
| `src/lib/twitch/types.ts` | TypeScript types for Twitch API responses |

---

## Part 8 — Token Refresh (Important)

Twitch access tokens expire after ~4 hours. The current code saves `expires_at` but does NOT implement token refresh. This must be added before any advanced features.

**Refresh flow:**
```
POST https://id.twitch.tv/oauth2/token
  grant_type=refresh_token
  refresh_token={stored_refresh_token}
  client_id={NEXT_PUBLIC_TWITCH_CLIENT_ID}
  client_secret={TWITCH_CLIENT_SECRET}
```

**Implementation:** Before any Twitch API call, check if `expires_at < now`. If expired, refresh the token and update `connected_platforms` row. This should be a shared utility in `src/lib/twitch/auth.ts` used by all Twitch API routes.

---

## Part 9 — Complete Twitch Helix API Endpoint Reference

For planning purposes, here is the full categorized list of all Helix endpoints. Endpoints marked with a star are recommended for ZAO OS.

**Ads:** Start Commercial, Get Ad Schedule, Snooze Ad
**Analytics:** Get Extension Analytics, Get Game Analytics
**Bits:** Get Bits Leaderboard, Get Cheermotes, Get Extension Transactions
**Channels:** Get Channel Info, Modify Channel Info*, Get Editors, Get Followed, Get Followers
**Channel Points:** Create/Get/Update/Delete Custom Rewards*, Get/Update Redemptions*
**Charity:** Get Campaign, Get Donations
**Chat:** Get Chatters*, Get Emotes, Get Badges, Get/Update Settings, Send Announcement*, Send Shoutout, Send Message*, Get/Update User Chat Color
**Clips:** Create Clip*, Get Clips*
**EventSub:** Create/Delete/Get Subscriptions*
**Games:** Get Top Games, Get Games*
**Goals:** Get Creator Goals
**Guest Star:** Full session/invite/slot CRUD
**Hype Train:** Get Status
**Moderation:** AutoMod, Bans, Blocked Terms, Delete Messages, Moderators, VIPs, Shield Mode, Warnings
**Polls:** Get/Create/End Polls*
**Predictions:** Get/Create/End Predictions*
**Raids:** Start/Cancel Raid
**Schedule:** Get/Create/Update/Delete Schedule Segments*, Get iCal*
**Search:** Search Categories*, Search Channels
**Streams:** Get Stream Key, Get Streams*, Get Followed Streams, Create/Get Markers*
**Subscriptions:** Get Broadcaster Subs, Check User Sub
**Teams:** Get Channel Teams, Get Teams
**Users:** Get/Update Users, Get/Block/Unblock Users, Get/Update Extensions
**Videos:** Get/Delete Videos
**Whispers:** Send Whisper

---

## Part 10 — EventSub Subscription Types Reference

All available real-time event types, categorized by ZAO relevance:

**High relevance for ZAO OS:**
- `stream.online` / `stream.offline` — Live status tracking
- `channel.chat.message` — Chat bridging
- `channel.update` — Channel info changes
- `channel.poll.begin/progress/end` — Poll lifecycle
- `channel.prediction.begin/progress/lock/end` — Prediction lifecycle
- `channel.channel_points_custom_reward_redemption.add` — Reward redemptions

**Medium relevance:**
- `channel.subscribe` / `channel.subscription.gift` — Sub events
- `channel.cheer` — Bits events
- `channel.raid` — Raid events
- `channel.hype_train.begin/progress/end` — Hype Train
- `channel.follow` — New followers

**Low relevance (skip):**
- `channel.ban/unban` — Moderation events
- `channel.moderator.add/remove` — Mod changes
- `channel.charity_campaign.*` — Charity events
- `drop.entitlement.grant` — Game drops
- `extension.*` — Extension events

---

## Sources

- [Twitch API Reference — Complete Endpoint List](https://dev.twitch.tv/docs/api/reference)
- [Twitch Authentication Scopes](https://dev.twitch.tv/docs/authentication/scopes/)
- [Twitch EventSub Documentation](https://dev.twitch.tv/docs/eventsub/)
- [Twitch EventSub Subscription Types](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types)
- [Twitch Embedding Guide](https://dev.twitch.tv/docs/embed/)
- [Twitch Chat & Chatbots Guide](https://dev.twitch.tv/docs/chat/)
- [Twitch Polls API](https://dev.twitch.tv/docs/api/polls)
- [Twitch Predictions API](https://dev.twitch.tv/docs/api/predictions)
- [Twitch Schedule API](https://dev.twitch.tv/docs/api/schedule)
- [Twitch Clips API](https://dev.twitch.tv/docs/api/clips)
- [Twitch Stream Markers](https://dev.twitch.tv/docs/api/markers)
- [Twitch DJ Program FAQ](https://help.twitch.tv/s/article/dj-program-faq)
- [Twitch DJ Program Announcement (June 2024)](https://blog.twitch.tv/en/2024/06/06/introducing-the-twitch-dj-program/)
- [Kick Developer Portal](https://dev.kick.com/)
- [YouTube Live Streaming API](https://developers.google.com/youtube/v3/live/getting-started)
- [Facebook Live Video API](https://developers.facebook.com/docs/live-video-api)
- [ZAO OS Doc 163 — Multistreaming Platforms Integration](../../_archive/163-multistreaming-platforms-integration/)
- [ZAO OS Doc 213 — Spaces Streaming Architecture Debug Guide](../../_archive/213-spaces-streaming-architecture-debug-guide/)
