# Songjam Feature Integration — Design Spec

**Date:** 2026-03-27
**Status:** Approved
**Source:** Songjam (`SongjamSpace/songjam-site`) — cloned at `~/Documents/songjam-site`

## Overview

Port 4 Songjam features into ZAO OS as standalone primitives on separate pages. All features use ZAO's existing Farcaster auth (iron-session) and Supabase. No Firebase. Two new audio SDKs (Stream.io, 100ms).

## Page Mapping

| Feature | ZAO OS Page | SDK | Source Files (Songjam) |
|---|---|---|---|
| Audio Rooms | `/spaces` | Stream.io | `src/app/spaces/*` |
| Live Audio + Jumbotron | `/social` | 100ms | `LiveAudioRoom.tsx`, `MiniSpaceBanner.tsx`, `Jumbotron.tsx` |
| Mindshare Leaderboard | `/respect` | None (Supabase) | `mindshare-leaderboard.tsx` |
| Farcaster Cast Actions | `/social` + API | Neynar (existing) | `neynar-client.ts`, `api/neynar/*` |

## Auth Adaptation

Songjam uses Firebase Twitter OAuth. ZAO OS replaces this entirely:

- **User identity:** `session.fid` (Farcaster ID) replaces `twitterObj.twitterId`
- **Display info:** `session.displayName`, `session.pfpUrl`, `session.username` from Farcaster
- **Guest access:** Audio room listeners can be guests (generated ID, no session required)
- **No Firebase dependency** — all auth through existing iron-session

## Database Adaptation

Songjam uses Firebase Firestore. ZAO OS uses Supabase with RLS.

### New Tables

#### `rooms` (Stream.io audio rooms)
```sql
CREATE TABLE rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  host_fid BIGINT NOT NULL,
  host_name TEXT NOT NULL,
  host_username TEXT NOT NULL,
  host_pfp TEXT,
  stream_call_id TEXT UNIQUE NOT NULL,
  state TEXT NOT NULL DEFAULT 'live' CHECK (state IN ('live', 'ended')),
  created_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  participant_count INTEGER DEFAULT 1
);

-- RLS: anyone can read, only host can update their rooms
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rooms_read" ON rooms FOR SELECT USING (true);
CREATE POLICY "rooms_insert" ON rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "rooms_update" ON rooms FOR UPDATE USING (true);
```

#### `ms_rooms` (100ms live audio rooms)
```sql
CREATE TABLE ms_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  host_fid BIGINT NOT NULL,
  host_name TEXT NOT NULL,
  room_id_100ms TEXT,
  state TEXT NOT NULL DEFAULT 'live' CHECK (state IN ('live', 'ended')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  participant_count INTEGER DEFAULT 1
);

ALTER TABLE ms_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ms_rooms_read" ON ms_rooms FOR SELECT USING (true);
CREATE POLICY "ms_rooms_insert" ON ms_rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "ms_rooms_update" ON ms_rooms FOR UPDATE USING (true);
```

#### `speaker_requests` (100ms speaker queue)
```sql
CREATE TABLE speaker_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES ms_rooms(id) ON DELETE CASCADE,
  requester_fid BIGINT NOT NULL,
  requester_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE speaker_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "speaker_requests_read" ON speaker_requests FOR SELECT USING (true);
CREATE POLICY "speaker_requests_insert" ON speaker_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "speaker_requests_update" ON speaker_requests FOR UPDATE USING (true);
```

#### `space_participant_points` (audio room engagement tracking)
```sql
CREATE TABLE space_participant_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_fid BIGINT NOT NULL,
  username TEXT NOT NULL,
  room_id UUID NOT NULL,
  room_type TEXT NOT NULL CHECK (room_type IN ('stream', '100ms')),
  points INTEGER DEFAULT 0,
  role TEXT NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL,
  left_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE space_participant_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "points_read" ON space_participant_points FOR SELECT USING (true);
CREATE POLICY "points_insert" ON space_participant_points FOR INSERT WITH CHECK (true);
```

### Realtime

- `rooms` table: Supabase Realtime subscription filtered by `state = 'live'` (replaces Firestore `onSnapshot`)
- `ms_rooms` table: Same pattern
- `speaker_requests` table: Realtime for host to see incoming requests

## Feature 1: Audio Rooms — `/spaces`

**Replaces:** Current iframe embedding of `songjam.space/zabal`

### Components
```
src/components/spaces/
├── RoomList.tsx           # Real-time list of live rooms (Supabase Realtime)
├── RoomCard.tsx           # Room preview: title, host, participants, live dot
├── HostRoomModal.tsx      # Create room form (title + description)
├── RoomView.tsx           # Audio room container (StreamVideo + StreamCall)
├── ParticipantsPanel.tsx  # Speakers grid + listeners grid
├── DescriptionPanel.tsx   # Room title, description, share link, participant count
├── MicButton.tsx          # Mute / unmute / request to speak
├── LiveButton.tsx         # Go live / end live (host only)
├── ControlsPanel.tsx      # MicButton + LiveButton container
└── PermissionRequests.tsx # Host approves/denies speaker requests
```

### API Routes
- `src/app/api/stream/token/route.ts` — POST, generates Stream user token
  - Input: `{ userId: string }` (FID as string)
  - Uses `@stream-io/node-sdk` server-side
  - Returns `{ token: string }`

### Page Structure
- `/spaces` — Room list + host button (replaces iframe)
- `/spaces/[id]` — Individual room view with Stream SDK

### Data Flow
1. User clicks "Host Room" → modal → creates Supabase `rooms` row + generates `stream_call_id`
2. Redirects to `/spaces/[id]`
3. Page fetches room from Supabase, creates `StreamVideoClient` with token from API
4. Host: `call.join({ create: true })` — Non-host: `call.join()`
5. Room list updates in real-time via Supabase Realtime
6. Host leaves → `state` set to `'ended'`

## Feature 2: Live Audio + Jumbotron — `/social`

**Adds to:** Existing `/social` page

### Components
```
src/components/social/
├── LiveAudioRoom.tsx      # Full 100ms audio room (ported from Songjam)
├── MiniSpaceBanner.tsx    # Compact room status banner
├── Jumbotron.tsx          # Pinned cast cards section
└── CastCard.tsx           # Individual cast with like/recast/follow
```

### API Routes
- `src/app/api/100ms/token/route.ts` — POST, generates 100ms management token + room token
  - Creates room via 100ms API if needed
  - Returns auth token for joining

### Integration
- `LiveAudioRoom` renders at top of `/social` page when a room is active
- `MiniSpaceBanner` shows as a floating banner when room exists but user hasn't joined
- `Jumbotron` section below for pinned community casts
- `CastCard` components with Farcaster interaction buttons

## Feature 3: Mindshare Leaderboard — `/respect`

**Enhances:** Existing `/respect` page

### Components
```
src/components/respect/
├── MindshareLeaderboard.tsx  # Main container: treemap + stats + table
├── Treemap.tsx               # Squarify algorithm + interactive rectangles
├── MobileLeaderboard.tsx     # Cascade grid for mobile (stepped sizes)
└── StatsBar.tsx              # Contributors, total respect, top share, leader
```

### Data Source
Instead of Songjam's Cloudflare Workers API, queries existing Supabase Respect data:
- Fetches member Respect balances (OG + ZOR)
- Transforms into `{ username, name, totalPoints, fid }` format
- Treemap calculates percentage share: `(userPoints / totalPoints) * 100`

### Timeframes
- ALL: Total accumulated Respect
- 30D / 7D: Respect earned in period (if we track timestamps)
- Can extend later with fractal session data

## Feature 4: Farcaster Cast Actions — `/social` + API

**Enhances:** Existing social feed with native Farcaster interactions

### API Routes
```
src/app/api/neynar/
├── cast/route.ts    # POST — publish cast (signer_uuid, text, embeds[])
├── like/route.ts    # POST — like a cast (signer_uuid, cast_hash)
├── recast/route.ts  # POST — recast (signer_uuid, cast_hash)
└── follow/route.ts  # POST — follow user (signer_uuid, target_fid)
```

All routes:
- Validate input with Zod
- Check session (require authenticated user)
- Call Neynar v2 API with `NEYNAR_API_KEY`
- Return standardized JSON response

### Client Service
- `src/lib/farcaster/neynarActions.ts` — frontend wrapper
  - `publishCast(text, embeds?)`
  - `likeCast(castHash)`
  - `recastCast(castHash)`
  - `followUser(fid)`

## New Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@stream-io/video-react-sdk` | latest | Stream audio rooms (client) |
| `@stream-io/node-sdk` | latest | Stream token generation (server) |
| `@100mslive/react-sdk` | ^0.10.x | 100ms audio rooms (client) |
| `@100mslive/hms-video-store` | ^0.12.x | 100ms state management |

## New Environment Variables

```env
# Stream.io (Audio Rooms - /spaces)
NEXT_PUBLIC_STREAM_API_KEY=
STREAM_API_SECRET=

# 100ms (Live Audio - /social)
NEXT_PUBLIC_100MS_ACCESS_KEY=
HMS_APP_SECRET=
NEXT_PUBLIC_100MS_TEMPLATE_ID=
```

## Build Order

1. **Neynar cast actions** — no new SDK, fastest win, enhances `/social`
2. **Mindshare leaderboard** — no new SDK, uses existing Respect data, enhances `/respect`
3. **Stream.io audio rooms** — new SDK, standalone `/spaces` replacement
4. **100ms live audio** — new SDK, most complex, enhances `/social`

## Out of Scope (for now)

- Tweet-to-cast crossposting (needs Twitter API integration — deferred)
- Points/gamification system (can add after audio rooms are working)
- Staking multipliers (Songjam-specific, not relevant to ZAO Respect)
- Firebase anything — fully replaced by Supabase
