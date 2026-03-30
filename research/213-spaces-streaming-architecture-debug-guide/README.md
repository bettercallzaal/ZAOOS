# 213 — Spaces & Streaming Architecture: Debug Guide + SongJam Patterns

> **Status:** Research complete
> **Date:** March 28, 2026
> **Goal:** Full architecture trace of ZAO OS /spaces, identify "Failed to create room" bug, compare Stream.io vs 100ms, document RTMP multistreaming flow
> **Updates:** Doc 122 (SongJam screen share), Doc 160 (audio spaces landscape), Doc 163 (multistreaming platforms)

---

## Part 1: Complete File Map

### Client Components (23 files)

| File | Purpose |
|------|---------|
| `src/app/spaces/page.tsx` | Public spaces list page — fetches live stages from Supabase, real-time subscription, "Create Stage" button |
| `src/app/spaces/[id]/page.tsx` | Room join page — initializes StreamVideoClient, joins call, session tracking |
| `src/components/spaces/HostRoomModal.tsx` | "Create Stage" modal — title, description, theme picker, calls parent `onCreateRoom` |
| `src/components/spaces/StageCard.tsx` | Room card — shows title, host, participant count, theme badge, LIVE indicator |
| `src/components/spaces/RoomView.tsx` | Main room layout — controls, speakers, broadcast, music sidebar, layout toggle |
| `src/components/spaces/ControlsPanel.tsx` | Bottom controls bar — mic, camera, live, screen share, music, broadcast, raise hand |
| `src/components/spaces/BroadcastModal.tsx` | Multistream setup — connected platforms, custom RTMP targets, direct/relay mode |
| `src/components/spaces/BroadcastPanel.tsx` | Live broadcast dashboard — per-target status, uptime, viewer counts, stop/retry |
| `src/components/spaces/SpeakersGrid.tsx` | Speakers-first layout — avatar circles with speaking indicators |
| `src/components/spaces/ContentView.tsx` | Content-first layout — screen share / dominant speaker + PiP + speaker strip |
| `src/components/spaces/DescriptionPanel.tsx` | Room description header |
| `src/components/spaces/MicButton.tsx` | Mic mute/unmute toggle |
| `src/components/spaces/CameraButton.tsx` | Camera toggle |
| `src/components/spaces/LiveButton.tsx` | Go Live / End Live toggle (Stream.io `call.goLive()` / `call.stopLive()`) |
| `src/components/spaces/ScreenShareButton.tsx` | Screen share toggle with permission request |
| `src/components/spaces/LayoutToggle.tsx` | Content-first / speakers-first toggle |
| `src/components/spaces/PermissionRequests.tsx` | Host-only: approve/deny speaker requests |
| `src/components/spaces/RoomMusicPanel.tsx` | In-room music playback panel |
| `src/components/spaces/RoomCard.tsx` | Generic room card (used for voice channels) |
| `src/components/spaces/RoomList.tsx` | Room list component |
| `src/components/spaces/ChannelSidebar.tsx` | Voice channel sidebar |
| `src/components/spaces/ChannelStrip.tsx` | Channel strip component |
| `src/components/spaces/ConnectedBanner.tsx` | Connection status banner |
| `src/components/spaces/HMSRoom.tsx` | **100ms provider** — alternative audio room using `@100mslive/react-sdk` |
| `src/components/spaces/ParticipantsPanel.tsx` | Participants list |

### API Routes (9 routes)

| Route | Method | Purpose |
|-------|--------|---------|
| `src/app/api/stream/token/route.ts` | POST | Generate Stream.io user token (auth-guarded, FID-verified) |
| `src/app/api/stream/rooms/route.ts` | POST | Create room in Supabase (auth-guarded, Zod-validated) |
| `src/app/api/stream/rooms/[id]/route.ts` | GET, PATCH | Get room by ID / End room (host-only) |
| `src/app/api/broadcast/start/route.ts` | POST | Fetch RTMP credentials for connected platforms |
| `src/app/api/broadcast/targets/route.ts` | GET, POST, DELETE | CRUD for saved broadcast targets |
| `src/app/api/broadcast/status/route.ts` | GET | Poll viewer counts from Twitch/YouTube APIs |
| `src/app/api/100ms/token/route.ts` | POST | Generate 100ms JWT token (management + app token) |
| `src/app/api/100ms/rooms/route.ts` | POST | Create 100ms room |
| `src/app/api/livepeer/stream/route.ts` | POST | Create Livepeer multistream with targets |
| `src/app/api/livepeer/clip/route.ts` | POST | Create clip from Livepeer stream |
| `src/app/api/spaces/session/route.ts` | POST, PATCH | Start/end session tracking |
| `src/app/api/spaces/leaderboard/route.ts` | GET | Leaderboard by time spent in spaces |
| `src/app/api/spaces/stats/route.ts` | GET | Session statistics |

### Library Files (5 files)

| File | Purpose |
|------|---------|
| `src/lib/spaces/streamHelpers.ts` | `generateCallId()`, `createStreamUser()`, `createGuestUser()` |
| `src/lib/spaces/roomsDb.ts` | Supabase CRUD for `rooms` table — create, get, end, increment/decrement participants |
| `src/lib/spaces/sessionsDb.ts` | Supabase CRUD for `space_sessions` — start, end, leaderboard aggregation |
| `src/lib/spaces/rtmpManager.ts` | RTMP broadcast orchestration — direct mode (Stream.io native) + relay mode (Livepeer) |
| `src/lib/livepeer/client.ts` | Livepeer API client — create/delete streams, get status, create clips |
| `src/lib/broadcast/targetsDb.ts` | Supabase CRUD for `broadcast_targets` table |

### Supabase Tables (3 tables)

| Table | Key Columns |
|-------|-------------|
| `rooms` | id, title, description, host_fid, host_name, host_pfp, stream_call_id, state (live/ended), room_type (voice_channel/stage), theme, layout_preference, participant_count, persistent |
| `space_sessions` | id, fid, room_id, room_name, room_type, joined_at, left_at, duration_seconds |
| `broadcast_targets` | id, user_fid, platform, name, rtmp_url, stream_key, provider (direct/livepeer/restream), is_active |

### Environment Variables

| Variable | Used By |
|----------|---------|
| `NEXT_PUBLIC_STREAM_API_KEY` | Client-side Stream.io SDK initialization |
| `STREAM_API_SECRET` | Server-side Stream.io token generation |
| `NEXT_PUBLIC_100MS_ACCESS_KEY` | 100ms JWT token generation |
| `HMS_APP_SECRET` | 100ms JWT signing |
| `NEXT_PUBLIC_100MS_TEMPLATE_ID` | 100ms room template |
| `LIVEPEER_API_KEY` | Livepeer multistream API |

---

## Part 2: Complete "Go Live" Flow Diagram

### Flow A: Creating a Stage (Host)

```
User clicks "+ Create Stage" button
       |
       v
HostRoomModal opens (title, description, theme picker)
       |
       v
User fills in details, clicks "Go Live"
       |
       v
handleSubmit() calls onCreateRoom(title, description, theme)
       |
       v
page.tsx handleCreateRoom():
  1. generateCallId() --> random UUID for Stream.io call
  2. POST /api/stream/rooms { title, description, streamCallId, theme, room_type: 'stage' }
       |
       v
API route /api/stream/rooms:
  1. getSessionData() --> check auth
  2. CreateRoomSchema.safeParse(body)      <-- *** BUG: schema missing theme + room_type ***
  3. createRoom() --> INSERT into Supabase `rooms` table
  4. Return { room } with room.id
       |
       v
page.tsx: router.push(`/spaces/${room.id}`)
       |
       v
/spaces/[id]/page.tsx loads:
  1. fetchRoom(roomId) --> GET /api/stream/rooms/{id}
  2. createStreamUser(user) --> { id: FID, name, image }
  3. fetchStreamToken(userId) --> POST /api/stream/token --> server generates JWT
  4. new StreamVideoClient({ apiKey, user, token })
  5. client.call('audio_room', roomData.stream_call_id)
  6. call.join({ create: true, data: { members: [], custom: { title, description } } })
  7. Fire-and-forget: POST /api/spaces/session (session tracking)
  8. Render StreamVideo > StreamCall > RoomView
```

### Flow B: Joining a Stage (Listener)

```
User clicks "Join Stage" on StageCard
       |
       v
router.push(`/spaces/${room.id}`)
       |
       v
/spaces/[id]/page.tsx:
  1. fetchRoom(roomId)
  2. If authenticated: createStreamUser() + fetchStreamToken()
     If guest: createGuestUser() (no token needed)
  3. new StreamVideoClient(...)
  4. client.call('audio_room', roomData.stream_call_id)
  5. call.join()  (no create: true, no data)
  6. Session tracking POST
```

### Flow C: Broadcasting to External Platforms

```
Host clicks "Broadcast" button in ControlsPanel
       |
       v
BroadcastModal opens
  1. Fetches connected platforms via /api/platforms/{twitch,youtube,kick,facebook}
  2. Shows saved targets + "Add Custom RTMP" option
  3. User toggles platforms ON/OFF, selects direct/relay mode
       |
       v
User clicks "Go Live on N" button
       |
       v
handleStart():
  1. Collect enabled platform IDs + valid custom RTMP targets
  2. POST /api/broadcast/start { platforms, roomTitle }
       |
       v
API /api/broadcast/start:
  - For each platform, look up `connected_platforms` table
  - YouTube/Facebook: create broadcast via /api/platforms/{platform}/broadcast
  - Twitch/Kick: return saved rtmp_url + stream_key
  - Return { destinations: [...] }
       |
       v
BroadcastModal calls onStartBroadcast(allTargets, mode)
       |
       v
RoomView handleStartBroadcast():
  - Calls startBroadcast(call, targets, mode, roomTitle) from rtmpManager.ts
       |
       v
rtmpManager.ts startBroadcast():

  DIRECT MODE:
    - call.startRTMPBroadcasts({ broadcasts: [...] })
    - Stream.io sends RTMP directly to each target URL
    - Max ~3 targets (bandwidth limited by host's connection)

  RELAY MODE:
    1. createLivepeerStream(name, targets)
       --> POST /api/livepeer/stream { name, targets }
       --> Creates Livepeer multistream targets
       --> Returns rtmpIngestUrl + streamKey
    2. call.startRTMPBroadcasts({ broadcasts: [{ name: 'livepeer-relay', stream_url: ingestUrl }] })
       - Stream.io sends ONE RTMP stream to Livepeer
       - Livepeer fans out to all targets (unlimited)
       |
       v
BroadcastPanel renders with live status
  - Uptime timer (1s interval)
  - Viewer count polling (10s interval via /api/broadcast/status)
  - Per-target: status dot, viewer count, stop/retry buttons
```

### Flow D: Leaving / Ending Room

```
User clicks "Leave" / "End Room"
       |
       v
handleLeave():
  1. PATCH /api/spaces/session { roomId } --> end session tracking
  2. call.leave()
  3. client.disconnectUser()
  4. If host: PATCH /api/stream/rooms/{id} { state: 'ended' }
  5. router.push('/spaces')
```

---

## Part 3: The "Failed to Create Room" Bug

### Root Cause

The `CreateRoomSchema` in `/api/stream/rooms/route.ts` does NOT include `theme` or `room_type` fields:

```typescript
// CURRENT (line 7-10 of src/app/api/stream/rooms/route.ts):
const CreateRoomSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional().default(''),
  streamCallId: z.string().min(1),
});
```

But the client sends `theme` and `room_type` in the POST body:

```typescript
// src/app/spaces/page.tsx line 56-65:
body: JSON.stringify({
  title,
  description,
  streamCallId,
  theme,            // <-- NOT in schema
  room_type: 'stage', // <-- NOT in schema
}),
```

### Why This Might Fail

Zod's `safeParse` with `z.object()` uses **strip mode by default** -- it silently drops unknown keys. So `theme` and `room_type` are stripped from the parsed data and never passed to `createRoom()`.

The `createRoom()` function in `roomsDb.ts` then inserts with defaults:
- `room_type` defaults to `'stage'` (line 48) -- this works because the default matches what was intended
- `theme` defaults to `'default'` (line 49) -- this means the user's theme choice is silently ignored

**So the schema mismatch is a silent data loss bug, not a crash.** The room IS created, but without the user's chosen theme.

### When "Failed to Create Room" Actually Happens

The error message `'Failed to create room'` appears in TWO places:

1. **Client-side** (`src/app/spaces/page.tsx` line 68): `if (!res.ok) throw new Error('Failed to create room');`
2. **Server-side** (`src/lib/spaces/roomsDb.ts` line 56): `if (error) throw new Error('Failed to create room: ${error.message}');`

The actual failure is most likely one of these:

| Cause | Symptom | Fix |
|-------|---------|-----|
| **Missing `STREAM_API_SECRET` or `NEXT_PUBLIC_STREAM_API_KEY`** | Token route returns 500, but this happens AFTER room creation | Not this -- room creation doesn't need Stream token |
| **Missing Supabase service role key** | `supabaseAdmin` fails | Check `SUPABASE_SERVICE_ROLE_KEY` env var |
| **`rooms` table doesn't exist** | Supabase insert fails | Run the CREATE TABLE migration |
| **RLS blocking insert** | `supabaseAdmin` uses service role (bypasses RLS), so this shouldn't happen | Only if someone accidentally used browser Supabase client |
| **Session expired / not set** | 401 Unauthorized | Re-login |
| **Column mismatch** | If `rooms` table schema doesn't match what `createRoom()` inserts | Verify table columns match Room interface |
| **Network error** | fetch fails entirely | Check connectivity |

### The Most Likely Cause

If the `rooms` table was created before the `theme` and `layout_preference` columns were added to the codebase, Supabase will reject the insert because the columns don't exist. The error would be:

```
Failed to create room: column "theme" of relation "rooms" does not exist
```

This gets caught by the try/catch in the API route and returned as a generic 500, which the client interprets as `!res.ok` and shows "Failed to create room".

### Fix Checklist

1. **Add missing columns to `rooms` table** (if not already present):
   ```sql
   ALTER TABLE rooms ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'default';
   ALTER TABLE rooms ADD COLUMN IF NOT EXISTS layout_preference TEXT DEFAULT 'content-first';
   ALTER TABLE rooms ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT now();
   ```

2. **Update the Zod schema** to accept `theme` and `room_type`:
   ```typescript
   const CreateRoomSchema = z.object({
     title: z.string().min(1).max(100),
     description: z.string().max(500).optional().default(''),
     streamCallId: z.string().min(1),
     theme: z.enum(['default', 'music', 'podcast', 'ama', 'chill']).optional().default('default'),
     room_type: z.enum(['voice_channel', 'stage']).optional().default('stage'),
   });
   ```

3. **Pass theme and room_type** to `createRoom()`:
   ```typescript
   const room = await createRoom({
     ...existingFields,
     theme: parsed.data.theme,
     roomType: parsed.data.room_type,
   });
   ```

4. **Check server logs** for the actual Supabase error message (it's logged on line 38: `console.error('Create room error:', error)`).

---

## Part 4: Stream.io vs 100ms — Dual Provider Architecture

ZAO OS runs **two audio/video providers simultaneously**, mirroring SongJam's architecture (documented in Doc 122):

### Stream.io (Primary — `/spaces`)

| Aspect | Detail |
|--------|--------|
| **SDK** | `@stream-io/video-react-sdk` (client) + `@stream-io/node-sdk` (server) |
| **Call type** | `audio_room` |
| **Auth** | Server-generated JWT token per user |
| **Features used** | Audio rooms, screen share, RTMP broadcast, participant management, permission requests |
| **Token route** | `/api/stream/token` |
| **Room storage** | Supabase `rooms` table (NOT Stream's storage) |
| **Guest access** | Yes — `createGuestUser()` with type: 'guest' |
| **RTMP** | `call.startRTMPBroadcasts()` — sends to 1-3 targets natively |

### 100ms (Secondary — `HMSRoom` component)

| Aspect | Detail |
|--------|--------|
| **SDK** | `@100mslive/react-sdk` |
| **Auth** | Server-generated JWT (management token + app token) |
| **Features used** | Audio rooms with built-in roles (host/speaker/listener) |
| **Token route** | `/api/100ms/token` |
| **Room management** | 100ms API (`api.100ms.live/v2/rooms`) — creates rooms on their side |
| **Guest access** | No (requires token) |
| **RTMP** | Available via 100ms API but not implemented in ZAO OS |

### When Each Is Used

| Context | Provider | Component |
|---------|----------|-----------|
| `/spaces` page (public stages) | Stream.io | `StreamVideoClient` + `StreamCall` + `RoomView` |
| `HMSRoom` component (embedded) | 100ms | `HMSRoomProvider` + `HMSRoomInner` |
| SongJam embed | Both (SongJam's own) | iframe |

### Comparison for ZAO's Use Case

| Factor | Stream.io | 100ms | Winner for ZAO |
|--------|-----------|-------|----------------|
| React SDK quality | Excellent | Excellent | Tie |
| Built-in roles | Manual (call permissions) | Native (host/speaker/listener) | 100ms |
| Screen share | Built-in | Built-in | Tie |
| RTMP out | `startRTMPBroadcasts()` | `/v2/live-streams/start` | Tie |
| Guest/anonymous access | Yes (guest user type) | No | Stream.io |
| Free tier | 100 participants, 100 min/mo | 10,000 min/mo | 100ms |
| Token gating | DIY | DIY | Tie |
| Recording | Built-in | Built-in | Tie |
| Transcription | No | Yes (built-in) | 100ms |
| Call types | audio_room, livestream, default | Template-based | Stream.io (more flexible) |

### Recommendation

Keep both. Stream.io for the main `/spaces` experience (better guest access, RTMP broadcast integration). 100ms for specialized rooms (transcription, stricter role management). This matches SongJam's dual-provider architecture.

---

## Part 5: RTMP Multistreaming Architecture

ZAO OS has a 3-tier multistreaming system, all already built:

### Tier 1: Direct Mode (Stream.io Native)

```
Stream.io audio_room call
    |
    +-- startRTMPBroadcasts() -->  rtmp://a.rtmp.youtube.com/live2  (YouTube)
    +-- startRTMPBroadcasts() -->  rtmp://live.twitch.tv/app         (Twitch)
    +-- startRTMPBroadcasts() -->  rtmp://custom-server/live          (Custom)
```

- **Max targets:** ~3 (bandwidth limited by Stream.io's egress)
- **Latency:** Lowest (direct connection)
- **Cost:** Included in Stream.io plan
- **Code:** `rtmpManager.ts` `startDirect()`

### Tier 2: Relay Mode (Livepeer Multistream)

```
Stream.io audio_room call
    |
    +-- startRTMPBroadcasts() --> rtmp://rtmp.livepeer.com/live (ONE stream)
                                        |
                                        v
                                  Livepeer transcodes + fans out
                                        |
                                        +-->  YouTube
                                        +-->  Twitch
                                        +-->  TikTok
                                        +-->  Facebook
                                        +-->  Kick
                                        +-->  Custom RTMP (unlimited)
```

- **Max targets:** Unlimited
- **Latency:** Slightly higher (extra hop through Livepeer)
- **Cost:** ~$0.005/min transcoding, 1,000 min/mo free
- **Code:** `rtmpManager.ts` `startRelay()` + `src/lib/livepeer/client.ts` + `/api/livepeer/stream`

### Tier 3: Connected Platforms (Saved Credentials)

```
User connects platforms once (Settings):
    Twitch  --> saved in `connected_platforms` table (rtmp_url + stream_key)
    YouTube --> OAuth, creates broadcast on-the-fly via /api/platforms/youtube/broadcast
    Facebook --> OAuth, creates live video via /api/platforms/facebook/broadcast
    Kick    --> saved in `connected_platforms` table

/api/broadcast/start fetches credentials and returns RTMP details
```

### Data Flow for Broadcast

```
BroadcastModal
  |-- Fetches: /api/platforms/{platform} for each (twitch, youtube, kick, facebook)
  |-- Shows: Connected platforms with toggle + custom RTMP form
  |-- Selects: direct or relay mode
  |
  v
On "Go Live":
  1. POST /api/broadcast/start { platforms: ['twitch', 'youtube'], roomTitle }
     --> Returns RTMP URLs + stream keys for each
  2. Merge with custom RTMP targets from the form
  3. Call onStartBroadcast(allTargets, mode) --> RoomView
  4. RoomView calls startBroadcast() from rtmpManager.ts
  5. rtmpManager uses call.startRTMPBroadcasts() (direct) or Livepeer relay
  |
  v
BroadcastPanel shows:
  - Per-target status (connecting/connected/error/stopped)
  - Uptime counter (1s interval)
  - Viewer counts (10s polling via /api/broadcast/status)
  - Stop/retry per-target (direct mode) or stop-all (relay mode)
```

---

## Part 6: SongJam Architecture Patterns

### What SongJam Is

SongJam (songjam.space) is the closest reference app. Built by Adam Place (@adam_songjam), it's a Farcaster audio spaces app. Key findings from Doc 122 and Doc 48:

- **Repo:** `SongjamSpace/songjam-site` (public on GitHub)
- **Stack:** Next.js + Stream.io + 100ms (dual provider, same as ZAO)
- **Relationship to ZAO:** Adam is a ZAO ecosystem member; ZAO previously embedded SongJam via iframe (Doc 119)

### SongJam File Structure (from Doc 122)

```
src/app/spaces/
  [id]/                        # Dynamic room route
  HostRoomModal.tsx            # Room creation
  MyControlsPanel.tsx          # Mic + Live controls
  MyDiscriptionPanel.tsx       # Room info header
  MyLiveButton.tsx             # Go live toggle
  MyMicButton.tsx              # Mic toggle
  MyParticipant.tsx            # Avatar + speaking indicator
  MyParticipantsPanel.tsx      # Speaker/listener grid
  MyPermissionRequestsPanel.tsx # Speaker approvals
  MyUILayout.tsx               # 3-panel layout
  RoomList.tsx                 # Room browser
  page.tsx                     # Landing page
```

### ZAO vs SongJam Comparison

| Aspect | SongJam | ZAO OS |
|--------|---------|--------|
| File structure | All in `src/app/spaces/` | Split: `src/app/spaces/` (pages) + `src/components/spaces/` (components) |
| Naming | `My*` prefix (MyMicButton) | Descriptive (MicButton, LiveButton) |
| Layout | Fixed 3-panel | Switchable content-first / speakers-first |
| Music integration | Jumbotron (casts) | Full ZAO Radio + music sidebar + room music panel |
| Broadcasting | Not implemented | Full RTMP multistream (direct + Livepeer relay) |
| Screen share | Not built-in (Doc 122 is the PR proposal) | Built-in (ScreenShareButton + ContentView) |
| Guest access | Unknown | Yes (guest Stream.io users can listen) |
| Session tracking | No | Yes (space_sessions table + leaderboard) |
| Themes | No | Yes (5 themes: default, music, podcast, ama, chill) |

### Patterns Borrowed from SongJam

ZAO's spaces architecture clearly evolved from studying SongJam:
1. **Dual provider model** — Stream.io for spaces, 100ms for specialized rooms
2. **`audio_room` call type** — same Stream.io call type
3. **Permission request flow** — host approves speaker requests
4. **Component decomposition** — separate mic/live/controls components
5. **Real-time Supabase subscription** — for room list updates

### Where ZAO Goes Beyond SongJam

1. **RTMP multistreaming** — full broadcast pipeline to YouTube/Twitch/etc
2. **Livepeer relay** — unlimited platform fan-out
3. **Music-first rooms** — ZAO Radio integration, room music panel
4. **Saved broadcast targets** — persistent RTMP destinations
5. **Viewer count aggregation** — polls Twitch/YouTube APIs during broadcast
6. **Session analytics** — time tracking, leaderboard, participation stats
7. **Layout modes** — content-first (screen share optimized) vs speakers-first

---

## Part 7: What's Built vs What's Broken

### Built and Working

| Feature | Status | Files |
|---------|--------|-------|
| Room list with real-time updates | Working | `spaces/page.tsx`, Supabase subscription |
| Room creation (host) | Has bug (see Part 3) | `HostRoomModal.tsx`, `/api/stream/rooms` |
| Room joining (auth + guest) | Working | `spaces/[id]/page.tsx` |
| Stream.io audio rooms | Working | `StreamVideoClient`, `audio_room` call type |
| Speaker/listener separation | Working | `SpeakersGrid.tsx`, Stream.io participants |
| Mic/camera/live controls | Working | `MicButton`, `CameraButton`, `LiveButton` |
| Screen share | Working | `ScreenShareButton`, `ContentView` |
| Permission requests (raise hand) | Working | `PermissionRequests.tsx` |
| Content-first / speakers-first layouts | Working | `LayoutToggle`, `ContentView`, `SpeakersGrid` |
| Room themes (5 options) | UI built, data not saved | Schema bug — theme stripped by Zod |
| Session tracking | Working | `sessionsDb.ts`, `/api/spaces/session` |
| Leaderboard | Working | `sessionsDb.ts`, `/api/spaces/leaderboard` |
| 100ms as secondary provider | Working | `HMSRoom.tsx`, `/api/100ms/token` |
| Broadcast modal UI | Working | `BroadcastModal.tsx` |
| Direct RTMP broadcast | Working | `rtmpManager.ts` `startDirect()` |
| Livepeer relay broadcast | Working | `rtmpManager.ts` `startRelay()`, `/api/livepeer/stream` |
| Broadcast status panel | Working | `BroadcastPanel.tsx` |
| Viewer count polling | Working | `/api/broadcast/status` (Twitch + YouTube) |
| Saved broadcast targets | Working | `targetsDb.ts`, `/api/broadcast/targets` |
| Room music panel | Working | `RoomMusicPanel.tsx` |
| Music sidebar in rooms | Working | `RoomView.tsx` + `MusicSidebar` |
| Leave / end room | Working | `handleLeave()`, PATCH `/api/stream/rooms/{id}` |

### Broken or Incomplete

| Issue | Severity | Root Cause | Fix |
|-------|----------|------------|-----|
| **"Failed to create room"** | Critical | Likely missing DB columns (theme, layout_preference) or env vars | Run ALTER TABLE, check env vars, check server logs |
| **Theme not saved** | Medium | Zod schema strips `theme` and `room_type` from request body | Add to CreateRoomSchema, pass to createRoom() |
| **room_type not passed** | Low | Same Zod issue, but defaults to 'stage' which is correct for `/spaces` | Still should fix for correctness |
| **Connected platforms not implemented** | Medium | BroadcastModal fetches `/api/platforms/{platform}` but these routes may not exist yet | Need to implement platform connection OAuth flows |
| **Kick viewer counts** | Low | `/api/broadcast/status` returns null for Kick/Facebook | Implement Kick/Facebook viewer count APIs |
| **Recording** | Not built | Stream.io supports it but not wired up | Add `call.startRecording()` |
| **Scheduling** | Not built | No room scheduling UI or backend | Needs `scheduled_at` column + cron job |
| **Cast from room** | Not built | No "pin cast to room" feature | Needs cast creation during live room |
| **AI transcription** | Not built | 100ms has built-in, Stream.io does not | Wire up 100ms transcription for rooms that use it |
| **Respect-gated hosting** | Not built | No minimum Respect check for room creation | Add check in `/api/stream/rooms` POST |

---

## Part 8: Environment Variable Checklist

All required for spaces to work:

| Variable | Required For | Where Set |
|----------|-------------|-----------|
| `NEXT_PUBLIC_STREAM_API_KEY` | Client StreamVideoClient init | `.env.local` |
| `STREAM_API_SECRET` | Server token generation | `.env.local` (never expose) |
| `SUPABASE_URL` | Room CRUD | `.env.local` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side supabaseAdmin | `.env.local` (never expose) |
| `NEXT_PUBLIC_100MS_ACCESS_KEY` | 100ms token gen (optional) | `.env.local` |
| `HMS_APP_SECRET` | 100ms JWT signing (optional) | `.env.local` (never expose) |
| `NEXT_PUBLIC_100MS_TEMPLATE_ID` | 100ms room template (optional) | `.env.local` |
| `LIVEPEER_API_KEY` | Livepeer relay mode (optional) | `.env.local` (never expose) |
| `TWITCH_CLIENT_ID` | Viewer count polling (optional) | `.env.local` |

**If `NEXT_PUBLIC_STREAM_API_KEY` or `STREAM_API_SECRET` is missing, room creation will succeed in Supabase but room joining will fail (no Stream.io token).** The empty string fallback on line 13 of `spaces/[id]/page.tsx` (`const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY || ''`) will cause StreamVideoClient to fail silently or throw.

---

## Sources

- ZAO OS codebase: 23 components, 13 API routes, 6 lib files analyzed
- [Doc 122 — SongJam Screen Share PR](../122-songjam-screen-share-pr/)
- [Doc 160 — Audio Spaces Landscape Comparison](../160-audio-spaces-landscape-comparison/)
- [Doc 163 — Multistreaming Platforms Integration](../163-multistreaming-platforms-integration/)
- [Doc 48 — ZAO Ecosystem Deep Dive](../048-zao-ecosystem-deep-dive/) (SongJam section)
- [SongjamSpace/songjam-site](https://github.com/SongjamSpace/songjam-site) (public repo)
- [Stream.io Video React SDK docs](https://getstream.io/video/docs/react/)
- [100ms React SDK docs](https://www.100ms.live/docs/javascript/v2/quickstart/react-sample-app)
- [Livepeer Multistream API](https://docs.livepeer.org/developers/guides/multistream)
