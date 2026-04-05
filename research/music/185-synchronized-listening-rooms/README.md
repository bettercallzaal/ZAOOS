# 100 — Synchronized Listening Rooms & Collaborative Music Experiences

> **Status:** Research complete
> **Date:** March 2026
> **Goal:** How to build listening parties, DJ mode, and presence features for ZAO OS (100-member community)
> **Recommendation:** Supabase Realtime (Broadcast + Presence) for sync and presence. No additional infrastructure needed.
> **Related:** [43 — WebRTC Audio Rooms & Streaming](../../_archive/043-webrtc-audio-rooms-streaming/)

---

## Key Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Sync mechanism | **Supabase Realtime Broadcast** | Already in the stack, handles 100 users trivially, no new infra |
| Presence | **Supabase Realtime Presence** | Built-in CRDT-backed state, "X people listening" for free |
| Latency target | **< 2 seconds** | Listening parties (not jamming) tolerate up to 2s drift |
| DJ mode | **Single-controller Broadcast** | One user sends play/pause/seek; others follow |
| Chat overlay | **Supabase Broadcast ephemeral messages** | Same channel as playback sync, zero persistence cost |
| Voice chat | **Jitsi (existing)** | Already built in `src/components/calls/JitsiRoom.tsx` |
| Audio source | **Client-side independent playback** | Each client streams from Audius/CDN at full quality |

---

## 1. How the Big Platforms Do It

### Spotify Jam (formerly Group Session)
- Up to 32 participants share a single playback state
- Each client streams music independently from Spotify's CDN
- Only **control messages** are exchanged (play/pause/seek/skip), never audio data
- Any participant can add to queue, skip, or pause (configurable by host)
- In January 2026, Spotify added "Request to Jam" — see a friend's live stream, tap to join
- **No voice chat** built in

### Apple Music SharePlay
- Syncs during FaceTime calls — playback state travels over FaceTime's signaling channel
- Requires all participants to have Apple Music subscriptions
- Uses Apple's Group Activities framework (proprietary)
- Sub-second sync because both audio and signaling run through Apple's infrastructure

### Discord Activities / Listen Along
- "Listen Along" mirrors a Spotify Premium user's playback to friends
- Pauses, skips, and track changes update instantly for everyone
- Discord acts as a signaling layer — it forwards Spotify playback events to listening clients
- Discord Activities (iframe apps) can embed custom music experiences using the Embedded App SDK

### SoundCloud Stations
- Algorithm-driven radio, not truly collaborative
- Timed/timestamped comments are the real innovation (see Section 5)

### Common Pattern Across All Platforms
Every major platform uses the same architecture: **server-coordinated playback state + independent client-side audio streams**. Nobody sends actual audio data between users for listening parties.

---

## 2. Technical Approaches to Synchronized Playback

### Approach A: Supabase Realtime Broadcast (Recommended for ZAO OS)

Supabase Broadcast sends ephemeral messages between clients via pub/sub channels. Messages are not persisted — pure signaling.

```typescript
// DJ/host sends playback commands
const channel = supabase.channel('listening-room:room-123');

// Host broadcasts state changes
channel.send({
  type: 'broadcast',
  event: 'playback',
  payload: {
    action: 'play',           // play | pause | seek | skip | queue-add
    trackId: 'audius-abc123',
    position: 42500,          // ms into track
    serverTime: Date.now(),   // for drift calculation
    trackMetadata: { title: 'Song Name', artist: 'Artist', streamUrl: '...' }
  }
});

// Listeners subscribe
channel
  .on('broadcast', { event: 'playback' }, ({ payload }) => {
    const drift = Date.now() - payload.serverTime;
    const adjustedPosition = payload.position + drift;
    player.seek(adjustedPosition);
    if (payload.action === 'play') player.resume();
    if (payload.action === 'pause') player.pause();
  })
  .subscribe();
```

**Why this works for ZAO OS:**
- Supabase is already in the stack (`src/lib/db/supabase.ts`)
- Broadcast is included in the free tier
- Handles hundreds of concurrent connections (ZAO has ~40 members)
- Sub-200ms message delivery for most users
- No WebSocket server to deploy or maintain

### Approach B: Custom WebSocket Server

```
Client ←→ WebSocket Server ←→ All other clients
```

- Server maintains authoritative playback state
- Sends periodic heartbeats with current position + timestamp
- Clients calculate drift and gently adjust (playback rate 1.01x or 0.99x)
- Requires deploying a persistent WebSocket server (not Vercel-friendly)
- **Overkill for 100 users when Supabase Broadcast exists**

### Approach C: WebRTC Data Channels

- Peer-to-peer, lowest latency (< 50ms)
- No server costs for data transfer
- Complex: requires STUN/TURN, connection management, mesh doesn't scale
- Best for: real-time music jamming (not listening parties)
- **Not recommended:** too complex, too little benefit for passive listening

### Approach D: Simple Polling

```
Client polls GET /api/listening-room/state every 2-5 seconds
```

- Simplest possible implementation
- 2-5 second latency (acceptable for casual listening)
- Scales fine for 40 users (40 requests every 5 seconds = 480 req/min)
- No WebSocket infrastructure at all
- **Good enough as a V1**, can upgrade to Broadcast later

### Latency Tolerance Research

| Use Case | Acceptable Latency | Notes |
|----------|-------------------|-------|
| Musicians jamming together | < 10-20ms | Nearly impossible over internet |
| DJ mixing / beatmatching | < 50ms | Requires WebRTC or local |
| **Listening party (passive)** | **< 2 seconds** | **ZAO OS target** |
| Watch party (video + audio) | < 500ms | Lip sync matters for video |
| Casual "same song" experience | < 5 seconds | "Vibes" are enough |

For a listening party where everyone is hearing the same song at roughly the same time and chatting about it, **2 seconds of drift is imperceptible**. Users are focused on the social experience, not frame-perfect sync.

### Drift Correction Strategy

Rather than hard-seeking (which causes audible pops), gently adjust playback rate:

```typescript
function correctDrift(localPosition: number, targetPosition: number) {
  const drift = localPosition - targetPosition;

  if (Math.abs(drift) > 5000) {
    // More than 5s off — hard seek (track change, rejoin, etc.)
    player.seek(targetPosition);
  } else if (Math.abs(drift) > 200) {
    // Gently speed up or slow down (inaudible at these rates)
    const rate = drift > 0 ? 0.98 : 1.02;
    audioElement.playbackRate = rate;
    // Reset to 1.0 after correction window
    setTimeout(() => { audioElement.playbackRate = 1.0; }, 2000);
  }
  // Under 200ms drift — do nothing, it's fine
}
```

---

## 3. Open-Source Listening Room Projects

### jam-sync (MIT License)
- **Repo:** https://github.com/mani1028/jam-sync
- **Stack:** Python + FastAPI + WebSockets, Tailwind CSS frontend
- **How it works:** Creates rooms, streams audio from YouTube, WebSocket sync with zlib compression
- **Useful patterns:** Room management, WebSocket message protocol, queue system
- **Limitation:** Python backend (ZAO OS is Node/Next.js)

### Music-Room (MIT License)
- **Repo:** https://github.com/ValkonX33/Music-Room
- **Stack:** Web app + Spotify API
- **How it works:** Virtual rooms, vote-to-skip, auto-skip when vote threshold reached
- **Useful patterns:** Voting/skip logic, Spotify API integration

### Soundbounce (Open Source)
- **Site:** https://soundbounce.org
- **Collaborative Spotify player with synchronized playback**
- **Useful patterns:** Room lobby, collaborative queue, real-time reactions

### Snapcast (GPL)
- **Repo:** https://github.com/snapcast/snapcast
- **Multiroom audio player with time synchronization**
- **Written in C++, uses NTP-like protocol for sub-millisecond sync**
- **Useful reference:** Clock sync algorithm (but overkill for web listening parties)

### websocket-music-player-with-chat
- **Repo:** https://github.com/mateuszmanczak04/websocket-music-player-with-chat
- **Stack:** WebSocket + music player + integrated chat
- **Directly relevant pattern:** Combined music sync + chat in one WebSocket channel

### Beatsync
- **Site:** https://www.beatsync.gg
- **Multi-device synchronized audio playback for listening parties**
- **Closed source but useful UX reference**

### Key Takeaway
None of these are drop-in solutions for ZAO OS, but **jam-sync's room model + Music-Room's voting + websocket-music-player's chat integration** collectively show the pattern: rooms, WebSocket sync, shared queue, chat overlay.

---

## 4. Jitsi + Synchronized Music

ZAO OS already has Jitsi rooms (`src/components/calls/JitsiRoom.tsx`). Here's how to combine them with listening parties.

### Architecture: Side-by-Side (Recommended)

```
┌─────────────────────────────────────────────┐
│  Listening Room                              │
│  ┌──────────────────┐  ┌──────────────────┐ │
│  │  Music Player     │  │  Chat / Reactions│ │
│  │  (synced via      │  │  (Supabase       │ │
│  │   Broadcast)      │  │   Broadcast)     │ │
│  └──────────────────┘  └──────────────────┘ │
│  ┌──────────────────────────────────────────┐│
│  │  Jitsi Voice Chat (audio-only)           ││
│  │  (existing JitsiRoom component)          ││
│  └──────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

- **Music:** Each client plays from Audius/CDN independently (full quality)
- **Voice:** Jitsi handles voice chat (separate audio stream)
- **Sync:** Supabase Broadcast coordinates playback state
- **No audio mixing needed** — browser plays both music and voice simultaneously

### Why NOT Mix Audio Through Jitsi

From research doc 43: WebRTC audio processing (echo cancellation, noise suppression, AGC) **destroys music quality**. Even with processing disabled, Opus at voice bitrates (24-48kbps) sounds terrible for music. Always keep music playback separate from voice chat.

### Jitsi Integration Notes

The existing `JitsiRoom` component uses `meet.jit.si` (free public instance) with `audioOnly` mode. For a listening room:

1. Set `audioOnly={true}` (voice chat only, no video)
2. Run the music player as a separate `<audio>` element outside Jitsi's iframe
3. Users hear music from the player + voices from Jitsi simultaneously
4. No Jitsi API changes needed — the two systems are fully independent

### Audio Ducking (Nice to Have)

When someone speaks in Jitsi, automatically lower the music volume:

```typescript
// Detect voice activity from Jitsi iframe via postMessage
// or use Supabase Presence to track who's speaking
function handleVoiceActivity(isSpeaking: boolean) {
  const musicElement = document.querySelector('audio');
  if (musicElement) {
    musicElement.volume = isSpeaking ? 0.3 : 1.0; // Duck to 30% during speech
  }
}
```

Note: Detecting speech from a Jitsi iframe is limited. A simpler approach is a manual "talking" button that broadcasts via Supabase, triggering volume ducking for all clients.

---

## 5. Text Chat During Listening

### Ephemeral Chat via Supabase Broadcast

Use the same Broadcast channel as playback sync for chat messages:

```typescript
// Send chat message
channel.send({
  type: 'broadcast',
  event: 'chat',
  payload: {
    userId: session.fid,
    username: session.username,
    text: 'This drop is insane',
    trackPosition: player.position,  // timestamp in the song
    timestamp: Date.now()
  }
});

// Receive and display
channel.on('broadcast', { event: 'chat' }, ({ payload }) => {
  addMessage(payload); // Append to chat feed
});
```

**Ephemeral by default** — Broadcast messages are not persisted. This is ideal for listening room chat (nobody needs to scroll back through old reactions). Optionally persist notable messages to Supabase if you want session history.

### Floating Reactions (SoundCloud-Style)

```typescript
// Reaction animation component
function FloatingReaction({ emoji, x }: { emoji: string; x: number }) {
  return (
    <div
      className="absolute animate-float-up pointer-events-none text-2xl"
      style={{ left: `${x}%`, bottom: 0 }}
    >
      {emoji}
    </div>
  );
}

// CSS animation (add to Tailwind config or global styles)
// @keyframes float-up {
//   0% { opacity: 1; transform: translateY(0) scale(1); }
//   100% { opacity: 0; transform: translateY(-200px) scale(1.5); }
// }
```

Broadcast a reaction event, all clients render the floating emoji at the same rough position. No need for pixel-perfect sync.

### Timestamped Comments (SoundCloud Model)

SoundCloud attaches comments to a millisecond position in the track. For ZAO OS:

```typescript
type TimedComment = {
  trackId: string;
  positionMs: number;    // where in the song
  userId: number;        // FID
  text: string;
  createdAt: string;
};

// Store in Supabase (these ARE persisted, unlike ephemeral chat)
// Display as markers on the waveform/scrubber
// When playback reaches a marker, briefly show the comment
```

This is a separate feature from listening room chat. Timed comments persist across sessions and appear every time anyone plays that track. SoundCloud shows them as avatar bubbles on the waveform and filters by newest, oldest, or position in the track.

### Chat Overlay Layout

```
┌──────────────────────────────────────┐
│  Now Playing: Track Name — Artist    │
│  ┌──────────────────────────────────┐│
│  │  Waveform / Scrubber            ││
│  │  ●  ●    ●       ●  ← timed    ││
│  └──────────────────────────────────┘│
│                                      │
│  💬 Chat                             │
│  ┌──────────────────────────────────┐│
│  │ alice: this part is so good     ││
│  │ bob: 🔥🔥🔥                     ││
│  │ carol: wait for the bridge...   ││
│  └──────────────────────────────────┘│
│  [Type a message...] [Send]          │
│                                      │
│  🔥 ❤️ 👏 😮 ← Quick reaction bar   │
└──────────────────────────────────────┘
```

---

## 6. "X People Listening" — Presence

Supabase Realtime Presence is purpose-built for this. It maintains a CRDT-backed in-memory key-value store of who's connected.

### Implementation

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, anonKey);

// Track who's listening to what
const channel = supabase.channel('presence:music');

channel.on('presence', { event: 'sync' }, () => {
  const state = channel.presenceState();
  // state = { 'user-123': [{ trackId, username, avatar, online_at }], ... }
  const listeners = Object.values(state).flat();
  setCurrentListeners(listeners);
});

channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
  // Show "alice joined the listening room"
});

channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
  // Show "bob left"
});

// When user starts listening
await channel.subscribe(async (status) => {
  if (status === 'SUBSCRIBED') {
    await channel.track({
      userId: session.fid,
      username: session.username,
      avatar: session.pfpUrl,
      trackId: currentTrack?.id,
      online_at: new Date().toISOString(),
    });
  }
});

// Update when track changes
await channel.track({
  ...currentPresence,
  trackId: newTrackId,
});

// Cleanup on unmount
channel.untrack();
```

### "X people listening" UI

```typescript
function ListenerCount({ listeners }: { listeners: PresenceUser[] }) {
  if (listeners.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {/* Stacked avatars */}
      <div className="flex -space-x-2">
        {listeners.slice(0, 5).map((l) => (
          <img
            key={l.userId}
            src={l.avatar}
            className="w-6 h-6 rounded-full border-2 border-[#0a1628]"
            alt={l.username}
          />
        ))}
      </div>
      <span className="text-sm text-gray-400">
        {listeners.length} listening
      </span>
    </div>
  );
}
```

### Track-Level Presence

Show who's listening to the same track as you, anywhere in the app:

```typescript
// On the music player, show "3 others are listening to this track"
const sameTrackListeners = allListeners.filter(
  (l) => l.trackId === currentTrack.id && l.userId !== session.fid
);
```

### Cost / Limits

- Supabase Presence is included in the free tier
- The Presence system uses Phoenix PubSub (Erlang), designed for millions of connections
- 40 members = trivial load
- No dedicated infrastructure needed

---

## 7. DJ Mode

### Architecture

One user (the DJ) has exclusive control over playback. All other users are listeners who receive sync commands.

```typescript
type ListeningRoom = {
  id: string;
  name: string;
  djFid: number;            // Who controls playback
  queue: QueueTrack[];       // Ordered list of upcoming tracks
  currentTrackIndex: number;
  isPlaying: boolean;
  position: number;          // Current playback position (ms)
  startedAt: number;         // Server timestamp when play started
  allowRequests: boolean;    // Can listeners request songs?
  listeners: number;         // Count from Presence
};

type QueueTrack = {
  trackId: string;
  metadata: TrackMetadata;
  addedBy: number;          // FID of who added it
  votes: number;            // Upvotes from listeners
  source: 'dj' | 'request'; // DJ added or listener requested
};
```

### DJ Controls

```typescript
// Only the DJ can send these commands
function useDJControls(roomId: string, isDJ: boolean) {
  const channel = supabase.channel(`room:${roomId}`);

  const play = (trackIndex: number, position = 0) => {
    if (!isDJ) return;
    channel.send({
      type: 'broadcast',
      event: 'dj-command',
      payload: { action: 'play', trackIndex, position, serverTime: Date.now() }
    });
  };

  const pause = () => {
    if (!isDJ) return;
    channel.send({
      type: 'broadcast',
      event: 'dj-command',
      payload: { action: 'pause', serverTime: Date.now() }
    });
  };

  const skip = () => {
    if (!isDJ) return;
    channel.send({
      type: 'broadcast',
      event: 'dj-command',
      payload: { action: 'skip', serverTime: Date.now() }
    });
  };

  return { play, pause, skip };
}
```

### Song Requests from Listeners

```typescript
// Listener sends a request
channel.send({
  type: 'broadcast',
  event: 'song-request',
  payload: {
    trackId: 'audius-xyz',
    metadata: { title: '...', artist: '...', streamUrl: '...' },
    requestedBy: session.fid,
    requestedByName: session.username
  }
});

// DJ receives requests and can approve/deny
channel.on('broadcast', { event: 'song-request' }, ({ payload }) => {
  addToRequestQueue(payload); // Show in DJ's request panel
});
```

### Queue Management

```
DJ View:
┌────────────────────────────────────┐
│  ▶ Now Playing: Track A — Artist   │
│  ══════════════════════════════════ │
│  Up Next:                          │
│  1. Track B — Artist  (DJ pick)    │
│  2. Track C — Artist  (requested)  │ [▲ 3 votes]
│  3. Track D — Artist  (requested)  │ [▲ 1 vote]
│  ──────────────────────────────────│
│  Requests:                         │
│  • Track E — Artist  from @alice   │ [✓ Add] [✗]
│  • Track F — Artist  from @bob     │ [✓ Add] [✗]
└────────────────────────────────────┘

Listener View:
┌────────────────────────────────────┐
│  ▶ Now Playing: Track A — Artist   │
│  DJ: @charlie                      │
│  ══════════════════════════════════ │
│  Up Next:                          │
│  1. Track B — Artist               │
│  2. Track C — Artist  [▲ Upvote]   │
│  3. Track D — Artist  [▲ Upvote]   │
│  ──────────────────────────────────│
│  [🎵 Request a Song]               │
└────────────────────────────────────┘
```

### Rotating DJ

For a more collaborative feel, implement DJ rotation:

```typescript
// After X tracks or Y minutes, pass DJ to next person
const DJ_ROTATION_TRACKS = 3;

function handleTrackEnd(room: ListeningRoom) {
  room.tracksPlayedByCurrentDJ++;
  if (room.tracksPlayedByCurrentDJ >= DJ_ROTATION_TRACKS) {
    const nextDJ = getNextDJInRotation(room);
    broadcastDJChange(nextDJ);
  }
}
```

---

## 8. Implementation Plan for ZAO OS (100 Members)

### What NOT to Build

- Custom WebSocket server (Supabase Broadcast handles it)
- WebRTC data channels (unnecessary complexity)
- Audio streaming between users (each client plays independently)
- Sub-100ms sync (2 seconds is fine for listening parties)
- Complex clock synchronization (NTP-like protocols are overkill)

### Phase 1: "Listen Together" MVP (1-2 weeks)

**Goal:** Any member can start a listening room. Others join and hear the same music.

**Components:**
1. **Listening Room page** (`src/app/(auth)/listen/[roomId]/page.tsx`)
2. **Room creation API** (`src/app/api/listen/create/route.ts`) — stores room in Supabase
3. **Supabase Broadcast channel** per room for playback sync
4. **Supabase Presence** for "X people listening"
5. **Reuse existing `PlayerProvider`** — just add sync commands on top

**Database (1 table):**
```sql
create table listening_rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  dj_fid bigint not null references profiles(fid),
  queue jsonb default '[]',
  is_active boolean default true,
  created_at timestamptz default now()
);

-- RLS: authenticated users can read; DJ can update their own room
alter table listening_rooms enable row level security;
```

**Sync flow:**
1. DJ starts a room, gets a shareable link
2. Listeners open the link, join the Broadcast channel
3. DJ plays/pauses/skips — commands broadcast to all listeners
4. Each listener's `PlayerProvider` receives commands and acts on them
5. Presence shows who's in the room

**Integration with existing player:**

The existing `PlayerProvider` (`src/providers/audio/PlayerProvider.tsx`) already has PLAY, PAUSE, SEEK, STOP actions. A listening room wrapper just needs to:
- Intercept DJ commands from Broadcast
- Dispatch the corresponding PlayerAction
- Disable local play/pause controls for non-DJ users

```typescript
// Hook: useListeningRoom
function useListeningRoom(roomId: string) {
  const player = usePlayer();
  const [room, setRoom] = useState<ListeningRoom | null>(null);
  const [listeners, setListeners] = useState<PresenceUser[]>([]);

  useEffect(() => {
    const channel = supabase.channel(`listen:${roomId}`);

    // Receive DJ commands
    channel.on('broadcast', { event: 'dj-command' }, ({ payload }) => {
      switch (payload.action) {
        case 'play':
          player.play(payload.metadata);
          break;
        case 'pause':
          player.pause();
          break;
        case 'seek':
          player.seek(payload.position);
          break;
      }
    });

    // Track presence
    channel.on('presence', { event: 'sync' }, () => {
      setListeners(Object.values(channel.presenceState()).flat());
    });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.track({ userId: session.fid, username: session.username });
      }
    });

    return () => { channel.unsubscribe(); };
  }, [roomId]);

  return { room, listeners, isDJ: room?.djFid === session.fid };
}
```

### Phase 2: Chat + Reactions (1 week)

- Add ephemeral chat to the Broadcast channel (event: 'chat')
- Add quick-reaction bar (fire, heart, clap, mind-blown)
- Floating reaction animations
- Simple message list with username + text

### Phase 3: DJ Mode + Queue (1 week)

- Song request system via Broadcast
- Upvote queue ordering
- DJ rotation (optional)
- "Pass the aux" button

### Phase 4: Jitsi Voice Integration (3 days)

- Embed `JitsiRoom` component below/beside the music player
- `audioOnly={true}` for voice chat while listening
- Optional: manual "I'm talking" button to trigger music volume ducking

### Phase 5: Timed Comments (Future)

- Persist timestamped comments to Supabase
- Display as markers on the waveform (`WaveformPlayer.tsx`)
- Click marker to jump to that position
- Filter by newest, oldest, or track position

### What's Already Built

ZAO OS has substantial music infrastructure to build on:

| Component | Path | Reusable For |
|-----------|------|-------------|
| Audio player provider | `src/providers/audio/PlayerProvider.tsx` | Core playback control (play/pause/seek/volume) |
| Global player UI | `src/components/music/GlobalPlayer.tsx` | Player chrome, scrubber, controls |
| Persistent player | `src/components/music/PersistentPlayer.tsx` | Cross-page mini player |
| Radio/queue system | `src/hooks/useRadio.ts` | Station switching, queue management |
| Waveform display | `src/components/music/WaveformPlayer.tsx` | Timed comments overlay |
| Queue track cards | `src/components/music/MusicQueueTrackCard.tsx` | Queue display in listening rooms |
| Jitsi voice rooms | `src/components/calls/JitsiRoom.tsx` | Voice chat during listening |
| Supabase client | `src/lib/db/supabase.ts` | Broadcast + Presence channels |

### Cost Analysis

| Component | Monthly Cost (40 members) |
|-----------|--------------------------|
| Supabase Realtime (Broadcast + Presence) | $0 (free tier) |
| Jitsi voice (meet.jit.si) | $0 (free public instance) |
| Audius audio streaming | $0 (free, decentralized) |
| Database (listening_rooms table) | $0 (existing Supabase) |
| **Total** | **$0/month** |

---

## 9. Summary: Recommended Stack

```
┌─────────────────────────────────────────────────────────┐
│                    LISTENING ROOM                         │
│                                                           │
│  ┌─────────────┐   ┌──────────────┐   ┌──────────────┐  │
│  │   Music      │   │    Chat      │   │   Presence   │  │
│  │   Player     │   │  (ephemeral) │   │  "5 people   │  │
│  │  (Audius     │   │  Supabase    │   │   listening" │  │
│  │   stream)    │   │  Broadcast   │   │  Supabase    │  │
│  │             │   │              │   │  Presence    │  │
│  └──────┬──────┘   └──────┬───────┘   └──────┬───────┘  │
│         │                 │                   │          │
│         └─────────────────┴───────────────────┘          │
│                           │                              │
│              Supabase Realtime Channel                   │
│              (single channel per room)                   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Jitsi Voice Chat (optional, audio-only)          │   │
│  │  Independent iframe, separate from music           │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**One Supabase Realtime channel per room handles three event types:**
1. `dj-command` — play/pause/seek/skip from DJ
2. `chat` — ephemeral text messages and reactions
3. Presence — who's in the room

**Zero new infrastructure. Zero monthly cost. Buildable in 2-3 weeks.**

---

## Sources

- [Spotify Real-Time Sharing Features (Jan 2026)](https://techcrunch.com/2026/01/07/spotify-now-lets-you-share-what-youre-streaming-in-real-time-with-friends/)
- [Spotify Jam](https://support.spotify.com/us/article/jam/)
- [Discord Listen Along](https://support.discord.com/hc/en-us/articles/115003966072-Listening-Along-with-Spotify)
- [Supabase Realtime Broadcast](https://supabase.com/docs/guides/realtime/broadcast)
- [Supabase Realtime Presence](https://supabase.com/docs/guides/realtime/presence)
- [Supabase Realtime with Next.js](https://supabase.com/docs/guides/realtime/realtime-with-nextjs)
- [jam-sync (MIT, FastAPI + WebSocket listening rooms)](https://github.com/mani1028/jam-sync)
- [Music-Room (MIT, Spotify vote-to-skip)](https://github.com/ValkonX33/Music-Room)
- [websocket-music-player-with-chat](https://github.com/mateuszmanczak04/websocket-music-player-with-chat)
- [Snapcast (synchronized multiroom audio)](https://github.com/snapcast/snapcast)
- [Beatsync (multi-device listening party)](https://www.beatsync.gg/)
- [Soundbounce (collaborative Spotify player)](https://soundbounce.org/)
- [Jitsi Meet audio sharing discussion](https://community.jitsi.org/t/how-to-share-playing-music-in-a-jitsi-video-group/26319)
- [SoundCloud Reactions & Timed Comments](https://help.soundcloud.com/hc/en-us/articles/31039497560731-Reactions)
- [Latency research: NGINX on real-time music](https://blog.nginx.org/blog/how-latency-makes-jamming-together-in-real-time-nearly-impossible)
- [Audio latency JND research (ACM)](https://dl.acm.org/doi/fullHtml/10.1145/3678299.3678331)
- [Socket.IO vs Supabase Realtime (2026)](https://ably.com/compare/socketio-vs-supabase)
- [Next.js Real-Time Chat with WebSocket/SSE (Jan 2026)](https://eastondev.com/blog/en/posts/dev/20260107-nextjs-realtime-chat/)
- [QueueDJ (DJ request management)](https://queuedj.com/)
- [MBXHub (WebSocket + REST DJ API)](https://mbxhub.com/)
