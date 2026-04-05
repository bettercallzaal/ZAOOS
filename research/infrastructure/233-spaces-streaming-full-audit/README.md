# 233 — Spaces & Streaming Full Codebase Audit

> **Status:** Research complete
> **Date:** March 31, 2026
> **Goal:** Comprehensive functionality audit of all Spaces/streaming code — 43 components, 11 API routes, 2 audio providers, broadcast system, real-time features

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Room creation 500** | FIXED — `rooms` table was missing `provider` column; migration added and deployed |
| **Admin end spaces** | FIXED — API and client now check `communityConfig.adminFids` alongside host FID |
| **Join error** | FIXED — removed broken guest flow (no Stream token), require sign-in |
| **Admin dashboard** | FIXED — added Spaces tab with end/delete controls + audit logging |
| **100ms routing** | BROKEN — all 100ms rooms route to `/api/stream/rooms` (wrong table); needs provider-based routing |
| **Song request latency** | REPLACE 10s HTTP polling with Supabase CDC for real-time delivery |
| **Stream token expiry** | ADD `validity_in_seconds: 3600` to `generateUserToken()` — tokens currently never expire |
| **Broadcast state** | PERSIST to localStorage — page refresh loses all broadcast state, can't stop streams |
| **Livepeer routes** | MISSING — relay mode broadcast calls `/api/livepeer/stream` which doesn't exist (404) |
| **Dead components** | DELETE ParticipantsPanel, RoomList, TipButton — all orphaned, never imported |

## Audit Scope — 6 Parallel Research Agents

| Agent | Files Audited | Key Findings |
|-------|---------------|--------------|
| Stream.io Integration | 5 files | Token expiry missing, GET room has no auth, no reconnection |
| 100ms/HMS Integration | 12 files | Routing completely broken, wrong DB table, missing env vars |
| Broadcast/RTMP Multistream | 15 files | Livepeer routes missing, state not persisted, YouTube token refresh silent fail |
| Real-time Features | 17 files | Song requests use 10s polling, hand raises poll on top of realtime, chat memory leak |
| Sessions/Stats/Scheduling | 10 files | No orphaned session cleanup, participant count race condition |
| UI/Layout/Navigation | 15 files | 3 dead components, sidebar breakage on tablet, 8 accessibility gaps |

---

## P0 — Critical Bugs (Blocking Functionality)

### 1. 100ms Room Routing Completely Broken
**Root cause:** `HostRoomModal` always posts to `/api/stream/rooms` regardless of provider selection. 100ms rooms get created in the `rooms` table (Stream schema) instead of `ms_rooms`. When joined, the room exists in DB but not in 100ms — token generation fails.

**Files affected:**
- `src/app/spaces/page.tsx:53-70` — routes both providers to `/api/stream/rooms`
- `src/app/api/stream/rooms/route.ts:28` — accepts `provider: '100ms'` but creates in wrong table
- `src/app/api/100ms/token/route.ts:65-91` — creates single shared room "zao-live-room" for ALL users
- `src/lib/social/msRoomsDb.ts` — no `provider` field in ms_rooms schema

**Fix:** Route 100ms creation to `/api/100ms/rooms`, add `provider` column to `ms_rooms`, create per-room 100ms instances.

### 2. Livepeer API Routes Don't Exist
**Root cause:** `rtmpManager.ts` imports `createLivepeerStream()` and `deleteLivepeerStream()` from `/api/livepeer/stream` — endpoint returns 404.

**Files affected:**
- `src/lib/spaces/rtmpManager.ts:111-127` — relay mode calls missing endpoint
- `src/lib/livepeer/client.ts:12,28` — client functions assume routes exist

**Impact:** Any relay mode broadcast fails. Direct mode works.

### 3. Broadcast State Not Persisted
**Root cause:** `broadcastState` in `RoomView.tsx:51-52` initializes to null on every render. Page refresh = lost state, can't stop active streams.

**Fix:** Persist to localStorage keyed by roomId, or save to Supabase.

---

## P1 — Security Issues

### 4. Stream Tokens Never Expire
**File:** `src/app/api/stream/token/route.ts:40`
- `client.generateUserToken({ user_id })` — no `validity_in_seconds` param
- Tokens could be valid indefinitely; leaked token = permanent access
- **Fix:** Add `validity_in_seconds: 3600` + implement token refresh in client

### 5. GET Room Endpoint Has No Auth Check
**File:** `src/app/api/stream/rooms/[id]/route.ts:8-18`
- Any unauthenticated user can fetch room metadata including `gate_config` (contract addresses, chainIds)
- **Fix:** Add session check or strip sensitive fields for unauthenticated requests

### 6. No Rate Limiting on Token/Room Endpoints
**Files:** `src/app/api/stream/token/route.ts`, `src/app/api/stream/rooms/route.ts`
- Single FID could mint unlimited tokens or create unlimited rooms
- **Fix:** Add FID-based rate limiting (existing middleware pattern in `src/middleware.ts`)

### 7. YouTube Token Refresh Silent Fail
**File:** `src/app/api/platforms/youtube/broadcast/route.ts:55-59`
- If refresh fails, error is logged but not re-thrown
- Broadcast proceeds with expired token, fails silently
- **Fix:** Re-throw after logging

---

## P2 — Performance & Real-time Issues

### 8. Song Requests Use 10s HTTP Polling
**File:** `src/components/spaces/SongRequests.tsx:45`
- `setInterval(fetchRequests, 10_000)` — 10s latency for new requests
- With 100 users = 600 requests/min to single endpoint
- **Fix:** Replace with Supabase `postgres_changes` on `song_requests` table

### 9. Hand Raises Poll on Top of Realtime
**File:** `src/components/spaces/HandRaiseQueue.tsx:50`
- Subscribes to `postgres_changes` but then re-fetches entire list on every change
- Should use the CDC payload directly instead of re-querying
- **Fix:** Update state from event payload, not full re-fetch

### 10. Chat Memory Leak
**File:** `src/components/spaces/RoomChat.tsx:53`
- `.slice(-199)` on every incoming message — no circular buffer
- 200+ concurrent messages = memory spikes
- **Fix:** Use bounded array or implement cursor pagination

### 11. Twitch Stream Status Polling at 30s
**File:** `src/components/spaces/TwitchStreamInfo.tsx:14`
- 30s polling for stream status — users don't know stream dropped for 30s
- **Fix:** Reduce to 5-10s or implement Twitch EventSub webhooks

---

## P3 — UI/Layout Issues

### 12. Three Dead Components
- `src/components/spaces/ParticipantsPanel.tsx` — superseded by SpeakersGrid, never imported
- `src/components/spaces/RoomList.tsx` — dead code from refactor, never imported
- `src/components/spaces/TipButton.tsx` — functional but orphaned, never imported

### 13. Sidebar Breakage on Tablet
**File:** `src/components/spaces/RoomView.tsx:240,253,264`
- Fixed `w-[350px]` sidebars on md breakpoint (768px)
- Main content gets only 418px — pixel-perfect breakage
- **Fix:** `md:w-[280px] lg:w-[350px]`

### 14. SpacesLayoutClient Height Miscalculation
**File:** `src/app/spaces/SpacesLayoutClient.tsx:148`
- `min-h-[calc(100dvh-2.5rem)]` but BottomNav is 3.5rem
- Causes content overflow on small screens

### 15. StageCard/RoomCard Duplication
- `StageCard.tsx` (used in spaces page) and `RoomCard.tsx` (used in dead RoomList)
- Similar UI, different features — consolidate into one

### 16. Eight Accessibility Gaps
- Missing `aria-label` on all icon buttons in ControlsPanel, ChannelSidebar
- StageCard uses `<div role="button">` instead of `<button>`
- SpeakersGrid speaking indicator is color-only (no aria-label)
- SpacesTabs missing `aria-controls`
- Music sidebar tabs missing `aria-selected`
- CategoryFilter missing `aria-pressed`

### 17. MiniSpaceBanner Links to Wrong Page
**File:** `src/components/social/MiniSpaceBanner.tsx:62`
- Links to `/calls` instead of `/spaces`

---

## Real-time Architecture Map

| Feature | Mechanism | Latency | Persisted | Status |
|---------|-----------|---------|-----------|--------|
| Room Chat | Supabase CDC | ~200ms | Yes | Works |
| Reactions | Supabase Broadcast | ~100ms | No | Works |
| Hand Raises | Supabase CDC + re-fetch | ~1s | Yes | Inefficient |
| Song Requests | HTTP Polling (10s) | ~10s | Yes | **Needs migration to CDC** |
| Music/DJ Sync | Supabase Broadcast + Presence | ~100ms | No | Works well |
| Track Queue | localStorage only | Instant | No | No cross-user sync |
| Permissions | Stream.io SDK WebSocket | ~100ms | No | Works |
| Twitch Chat | Twitch iframe | Real | N/A | Disconnected from ZAO |
| Twitch Status | HTTP Polling (30s) | ~30s | No | Too slow |

---

## Broadcast System Status

| Platform | Auth | Broadcast Creation | Status | Issues |
|----------|------|-------------------|--------|--------|
| Twitch | Full OAuth2 | Static (pre-configured) | Working | Title sync works |
| YouTube | Full OAuth2 | Dynamic (broadcast API) | Working | Token refresh can silent-fail |
| Facebook | Page token | Dynamic (live video API) | Working | Stream URL parsing fragile |
| Kick | PKCE OAuth | Static only | Partial | No dynamic broadcast route |
| Livepeer (relay) | N/A | Missing routes | **Broken** | 404 on /api/livepeer/stream |
| TikTok | N/A | Not started | Scaffolded | Enum in targets but no integration |

---

## 100ms vs Stream.io Feature Parity

| Feature | Stream.io | 100ms | Gap |
|---------|-----------|-------|-----|
| Join/Leave | Full | Basic | Minor |
| Hand Raise | PermissionRequests.tsx | Not implemented | Major |
| Screen Share | ScreenShareButton.tsx | Not implemented | Major |
| Room Chat | RoomChat.tsx (persistent) | Not implemented | Major |
| Reactions | RoomReactions.tsx | Not implemented | Major |
| Recording | updateRecording() API | Not implemented | Major |
| RTMP Broadcast | Via Stream SDK | Available but not wired | Major |
| Token Gating | gate_config in rooms | No gate_config in ms_rooms | Major |
| Themes | theme field in rooms | No theme in ms_rooms | Minor |

---

## Database Schema Gaps

### rooms table (Stream.io) — Recently Fixed
```sql
-- These columns were MISSING and just added:
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'stream';
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS gate_config JSONB;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS recording_url TEXT;
```

### ms_rooms table (100ms) — Still Missing
```sql
-- NEEDED but not yet added:
ALTER TABLE ms_rooms ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT '100ms';
ALTER TABLE ms_rooms ADD COLUMN IF NOT EXISTS gate_config JSONB;
ALTER TABLE ms_rooms ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'default';
```

### Participant Count Race Condition (CRITICAL)
**File:** `src/lib/spaces/roomsDb.ts:101-113`
```typescript
// BROKEN: read-then-write is NOT atomic
const { data } = await supabaseAdmin.from('rooms').select('participant_count')...
await supabaseAdmin.from('rooms').update({ participant_count: data.participant_count + 1 })...
```
Two concurrent joins read same count → both write same value → count drifts.
**Fix:** `UPDATE rooms SET participant_count = participant_count + 1 WHERE id = $1`

### Token Gate Wallet Not Verified (SECURITY)
**File:** `src/app/api/spaces/gate-check/route.ts`
- Only validates address format (`/^0x[a-fA-F0-9]{40}$/`), not ownership
- User can claim any wallet address without proving they own it
- **Fix:** Require wagmi connection proof or signed message

### Missing Cleanup Jobs
- No cron to close orphaned sessions (`left_at IS NULL` for 12+ hours)
- No cron to transition scheduled rooms from 'scheduled' → 'live'
- No cleanup for stale `room_hand_raises` records
- No archival of rooms >90 days old
- `rsvp_count` denormalized without DB trigger — drifts on failure

### Stats Endpoint Pulls All Rows
**File:** `src/app/api/spaces/stats/route.ts:13-17`
- Fetches ALL sessions for a user with no limit — could be 10K+ rows
- Aggregates in JavaScript instead of SQL (comment incorrectly says PostgREST can't GROUP BY)
- Streak calculation has no max-iteration safeguard (infinite loop risk)

---

## Comparison of Audio Providers

| Aspect | Stream.io | 100ms | LiveKit (alternative) |
|--------|-----------|-------|----------------------|
| Free Tier | 100 participants | 10K min/month | 100 participants |
| Next.js SDK | @stream-io/video-react-sdk (1.34.1) | @100mslive/react-sdk | @livekit/components-react |
| RTMP Support | Native SDK methods | Available, not wired | Via Egress API |
| Transcription | No | Yes (built-in) | Yes (via plugins) |
| Self-Hostable | No | No | Yes (MIT server) |
| Bundle Size | ~180KB | ~120KB | ~42KB |
| Current Status in ZAO | Primary, fully integrated | Broken routing | Not integrated |

---

## ZAO OS Integration

### Files Changed in This Session
- `src/app/api/stream/rooms/[id]/route.ts` — admin FID check for end/edit
- `src/app/api/stream/rooms/route.ts` — added theme/room_type to schema
- `src/app/spaces/[id]/page.tsx` — admin controls, cleanup on unmount, sign-in gate
- `src/app/api/admin/spaces/route.ts` — NEW: list all rooms (admin)
- `src/app/api/admin/spaces/[id]/route.ts` — NEW: delete room (admin)
- `src/components/admin/SpacesManager.tsx` — NEW: admin Spaces tab
- `src/app/(auth)/admin/AdminPanel.tsx` — added Spaces tab
- `scripts/setup-rooms-tables.sql` — added 4 missing columns

### Key Config
- `community.config.ts:43` — `adminFids: [19640]`
- `.env.example:82-83` — `NEXT_PUBLIC_STREAM_API_KEY`, `STREAM_API_SECRET`
- `.env.example` — 100ms vars listed but not set in production

### Total Spaces Codebase
- 43 components in `src/components/spaces/`
- 11 API route files in `src/app/api/spaces/`
- 3 API route files in `src/app/api/stream/`
- 3 API route files in `src/app/api/100ms/`
- 4 page files in `src/app/spaces/`
- 2 DB modules: `src/lib/spaces/roomsDb.ts`, `src/lib/spaces/sessionsDb.ts`
- 1 broadcast module: `src/lib/spaces/rtmpManager.ts`

## Sources

- [Stream.io Video React SDK Docs](https://getstream.io/video/docs/react/)
- [100ms React SDK Docs](https://www.100ms.live/docs/javascript/v2/get-started/react-quickstart)
- [Supabase Realtime CDC Docs](https://supabase.com/docs/guides/realtime/postgres-changes)
- [Stream.io Node SDK (v0.7.49)](https://github.com/GetStream/stream-node)
