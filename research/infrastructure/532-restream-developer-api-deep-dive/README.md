---
topic: infrastructure
type: guide
status: research-complete
last-validated: 2026-04-27
related-docs: 163, 213, 215
tier: STANDARD
---

# 532 — Restream Developer API Deep Dive

> **Goal:** Map every Restream API capability to ZAO OS broadcast surface so we know exactly what an OAuth integration unlocks beyond the manual RTMP target we ship today.

---

## Recommendations Table (Start Here)

| # | Recommendation | Priority | Effort (1-10) | Why |
|---|---|---|---|---|
| 1 | **Wire Restream OAuth as 4th broadcast provider** alongside `direct` / `livepeer` (already enum-stubbed in `src/lib/broadcast/targetsDb.ts:10`) | P1 | 4 | Users with Restream Pro already pay for 30+ platform fan-out. One OAuth = drop the per-platform stream-key dance. Doc 215 row 10 also flagged this. |
| 2 | **Use `GET /v2/user/streamKey`** to pull the user's Restream RTMP key + SRT URL, push from Stream.io to Restream, let Restream fan out | P1 | 3 | One ingest, 30+ outputs. Replaces our Livepeer relay path for any user with a Restream account. |
| 3 | **Subscribe to `wss://streaming.api.restream.io/ws`** for real-time outgoing stream metrics (bitrate, fps, viewer counts, online status) | P1 | 4 | Replaces our 10s viewer-count polling in BroadcastPanel with push events. Lower latency, lower cost. |
| 4 | **Aggregate chat via `wss://chat.api.restream.io/ws`** into ZAO room feed | P1 | 5 | Single WebSocket gives us Twitch + YouTube + Kick + 30+ chat in one stream. Doc 215 row 3 prereq. |
| 5 | **Use Chat reply (`reply_created`/`reply_confirmed` actions)** to send ZAO-side messages back out to all connected platforms | P2 | 4 | Bi-directional chat without per-platform OAuth + per-platform write APIs. |
| 6 | **SKIP Restream Studio Brands API** for ZAO branding overlays | P3 | n/a | Studio brands are scoped to Restream's hosted Studio product. Our overlays render in Stream.io / Livepeer pipeline; no integration value. |
| 7 | **Park: webhooks + rate limits not publicly documented** — confirm with `developers@restream.io` before relying on the API in production | P0 (blocker) | 1 | Public docs surface OAuth + endpoints but not webhook subscription nor RPS caps. Required before building. |
| 8 | **Mark `provider: 'restream'` enum live** by implementing the OAuth callback at `/api/auth/restream/callback` and the target-creation flow | P1 | 5 | The enum already exists at `src/lib/broadcast/targetsDb.ts:10`. The `provider` column accepts it. No DB migration needed. |

---

## Part 1 — How ZAO OS Already Touches Restream

Codebase audit:

- `src/lib/broadcast/targetsDb.ts:10` — `provider: 'direct' | 'livepeer' | 'restream'` (enum stubbed, no code path uses `restream` yet)
- `src/app/api/broadcast/targets/route.ts:12` — Zod schema accepts `provider: z.enum(['direct', 'livepeer', 'restream']).optional()`. Validates today. Just no consumer.
- Doc 215 (Mar 28 2026) — listed Restream OAuth as P2 row 10. This doc upgrades the priority and fills the API map.
- Doc 163 (`_archive/`) — recommended Restream as Tier 3 multistream platform.
- Doc 213 (`_archive/`) — spaces streaming arch debug, used Livepeer + Stream.io paths.

What ZAO OS does today: **manual RTMP** for Restream — user copies Restream RTMP URL + stream key into BroadcastSettings just like any custom RTMP. OAuth would replace the copy-paste with one click.

---

## Part 2 — Restream API Surface (v2)

### 2A. Authentication

Standard OAuth 2.0:

1. Register app at `developers.restream.io/apps` → get `client_id` + `client_secret`
2. Configure redirect URI(s) (multiple allowed)
3. Pick scopes (only what you need — re-auth triggers if scopes change later)
4. Bearer token in `Authorization` header for all REST + WebSocket calls
5. **Auth URL, token URL, refresh-token mechanics, and token TTL not surfaced in public docs.** Email `developers@restream.io` to confirm.

### 2B. REST Endpoints (`https://api.restream.io/v2/`)

| Method | Path | Scope | Returns |
|---|---|---|---|
| `GET` | `/server/all` | none (public) | Array of ingest servers: `id, name, url, rtmpUrl, latitude, longitude` |
| `GET` | `/user/profile` | `profile.read` | User: `id, username, email` |
| `GET` | `/user/channel/all` | `channels.read` | Array of channels: `id, streamingPlatformId, displayName, embedUrl, active` |
| `GET` | `/user/channel/{id}` | `channels.read` | Single channel detail |
| `GET` | `/user/streamKey` | `stream.read` | `{ streamKey: "re_xxx_xxx", srtUrl: "srt://live.restream.io:2010?streamid=srt_xxx_xxx_xxx" \| null }` |
| `GET` | `/user/studio/brands` | `studio.read` | Studio brand containers (captions, tickers, QR codes — Studio-only) |

**Events resource** (per search result navigation, sub-paths returned shells from WebFetch — verify in dev):
- `Upcoming Events` — list events scheduled
- `In Progress Events` — currently live
- `Events History` — past
- `Event details` — single event
- `Event Stream Key` — RTMP key per event
- `Event SRT Stream Keys` — SRT keys per event
- `Event Recordings` — VOD playback URLs

### 2C. WebSockets

| URL | Purpose | Direction |
|---|---|---|
| `wss://streaming.api.restream.io/ws?accessToken=...` | Live broadcast metrics + lifecycle | Server → Client (replays last ~60s on connect) |
| `wss://chat.api.restream.io/ws?accessToken=...` | Aggregated chat feed across all connected platforms | Bi-directional (incoming events + outbound replies) |

#### Streaming Updates message types (5)

1. `updateIncoming` — incoming RTMP/SRT stream up. Includes `fps, bitrate, codec, resolution`
2. `deleteIncoming` — incoming ended
3. `updateOutgoing` — per-platform outgoing connection up + status + bitrate
4. `deleteOutgoing` — outgoing ended
5. `updateStatuses` — per-platform external metrics (viewers, followers, online flag, current title). `null` = info unavailable for that platform.

Common fields: `userId, eventId, platform identifiers, Unix-second timestamps`.

#### Chat actions

- Incoming events from Twitch / YouTube / Discord / DLive / Facebook / etc.
- `reply_created` → returns `replyUuid`
- `reply_accepted` / `reply_failed` / `reply_confirmed` (note: `reply_confirmed` can arrive before `reply_accepted`)
- **Common reply** = sent to all connections (`eventSourceId = 1` = Restream itself)
- **Direct reply** = single platform via its `eventSourceId`
- Failure reasons: `connection_in_error_state`, `connection_not_established_yet`, `internal`
- **Relay** = automatic cross-platform mirror via "Restream Bot" identity. Lifecycle: `relay_accepted` → `relay_confirmed`. Linked to source via `sourceEventIdentifier`.

### 2D. Known scopes (incomplete)

Confirmed from docs: `profile.read`, `channels.read`, `stream.read`, `studio.read`. Chat scope name not found in fetched pages — likely `chat.read` and `chat.write` per convention, **needs verification**.

---

## Part 3 — Integration Sketch for ZAO OS

### Minimum viable Restream provider

```
src/app/api/auth/restream/
├── start/route.ts         # GET — redirect to Restream authorize URL
├── callback/route.ts      # GET — exchange code, store token in supabase user_oauth table
└── refresh/route.ts       # POST — refresh access token

src/lib/broadcast/restream.ts
├── getStreamKey(token)        → { streamKey, srtUrl }
├── getChannels(token)         → array (so user picks which to enable)
├── connectMetricsSocket(token, onUpdate)  → ws to streaming.api.restream.io
└── connectChatSocket(token, onMessage)    → ws to chat.api.restream.io

src/components/broadcast/RestreamConnect.tsx   # OAuth button + connected state
src/components/broadcast/RestreamMetrics.tsx   # replaces poll with push
```

### Database

Already supported: `broadcast_targets.provider = 'restream'`. Add OAuth token storage to existing `user_oauth` pattern (whatever Twitch/YouTube use today — see `src/app/api/auth/twitch/`).

### What NOT to build first

- Studio Brands API → only useful if we host streams in Restream Studio. We don't.
- Events API → useful if user schedules in Restream dashboard. ZAO Spaces does its own scheduling. Defer until we want bidirectional sync.

---

## Also See

- [Doc 215 — OBS/Restream/StreamYard feature analysis](../215-obs-restream-streamyard-feature-analysis/)
- [Doc 163 — Multistreaming platforms (archived)](../../_archive/163-multistreaming-platforms-integration/)
- [Doc 213 — Spaces streaming architecture (archived)](../../_archive/213-spaces-streaming-architecture-debug-guide/)

---

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Email `developers@restream.io` to confirm token TTL, refresh flow, rate limits, webhook availability, full scope list | @Zaal | Email | Before P1 work starts |
| Open issue: "Wire Restream OAuth as broadcast provider (enum already stubbed)" | @Zaal | GitHub issue | Backlog grooming |
| Update `community.config.ts` once OAuth scopes confirmed (add `restream` to broadcast providers list) | Claude | PR | After Zaal email reply |
| Audit `src/app/api/auth/twitch/` to copy OAuth token-storage pattern for Restream | Claude | Code spike | When P1 picked up |

---

## Sources

- [Restream Developers — Getting Started](https://developers.restream.io/guide/getting-started)
- [Restream API — Channel endpoint](https://developers.restream.io/private-api/channel)
- [Restream API — Stream Key endpoint](https://developers.restream.io/private-api/stream-key)
- [Restream API — Streaming Updates WebSocket](https://developers.restream.io/private-api/streaming-updates)
- [Restream API — Chat getting started](https://developers.restream.io/chat/getting-started)
- [Restream API — Chat Relay](https://developers.restream.io/chat/relay)
- [Restream API — Chat Reply](https://developers.restream.io/chat/reply)
- [Restream API — Studio Brands](https://developers.restream.io/studio/studio-brands)
- [Restream API — Ingest Servers (public)](https://developers.restream.io/public-api/servers)
- [Restream pricing](https://restream.io/pricing)
- [APITracker — Restream API summary](https://apitracker.io/a/restream-io)

**URLs verified live 2026-04-27.** Pages with thin shells when fetched: `/guide/oauth`, `/guide/scopes`, `/private-api/events*`, `/webhooks` — content likely JS-rendered or under different paths. Flagged in body, action item to email Restream for confirmation.

**Staleness note:** API version `v2` confirmed in every endpoint URL. No deprecation warnings on docs. Re-validate by 2026-07-27 (90-day SLA for infrastructure docs).
