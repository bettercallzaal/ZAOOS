# Spaces Phase 2 — Restreaming (Multi-Platform Broadcast)

> **Date:** March 28, 2026
> **Status:** Design approved
> **Scope:** Phase 2 of 3 (Phase 1: Voice Channels + Stages ✅, Phase 3: Producer/OBS controls)
> **Depends on:** Phase 1 merged, Stream.io SDK, Livepeer API routes

---

## Overview

Wire Stream.io's native RTMP egress to broadcast live Spaces rooms to external platforms (Twitch, YouTube, Kick, Facebook, custom RTMP). Host chooses Direct mode (Stream.io → platforms, low latency) or Relay mode (Stream.io → Livepeer → platforms, handles 3+ targets reliably). An expandable BroadcastPanel shows per-platform status, uptime, viewer counts, and individual stop/restart controls.

---

## Architecture

### Direct Mode (Stream.io Native RTMP)

```
Stream.io SFU composites room (all speakers + screen share)
      │
      ├── call.startRTMP(twitch_rtmp_url, twitch_stream_key)  → Twitch
      └── call.startRTMP(youtube_rtmp_url, youtube_stream_key) → YouTube
```

- Stream.io handles compositing (speaker layout, screen share)
- One `call.startRTMP()` per platform
- Best for 1-2 platforms — lowest latency, no middleman
- Stop per-platform: `call.stopRTMP(rtmpUrl)`

### Relay Mode (Livepeer Multistream)

```
Stream.io SFU composites room
      │
      └── call.startRTMP(livepeer_ingest_url, livepeer_stream_key)
                │
                └── Livepeer multicasts via existing multistream API
                    ├── Twitch
                    ├── YouTube
                    ├── Kick
                    └── Facebook
```

- Single RTMP output from Stream.io to Livepeer
- Livepeer handles fan-out to all platforms via `createLivepeerStream(name, targets)`
- Better for 3+ platforms — fewer Stream.io RTMP connections
- Adds ~2-5 seconds latency from relay hop
- Stop all: `deleteLivepeerStream(id)` + `call.stopRTMP(livepeerIngestUrl)`

### Mode Selection

Host sees a toggle in BroadcastModal:
- **⚡ Direct** — "Lower latency. Best for 1-2 platforms."
- **🔄 Relay** — "More stable. Recommended for 3+ platforms."

Default: Direct. If host selects 3+ platforms while on Direct, show a subtle hint: "Consider switching to Relay mode for 3+ platforms."

---

## Broadcast Flow

### Starting a Broadcast

1. Host clicks 📡 Broadcast button in ControlsPanel
2. BroadcastModal opens showing connected platforms with checkboxes
3. Host selects platforms + chooses Direct/Relay mode
4. Host clicks "Go Live"
5. `rtmpManager.startBroadcast(call, platforms, mode)`:

**If Direct:**
```typescript
for (const platform of platforms) {
  const { rtmpUrl, streamKey } = await fetchRTMPCredentials(platform);
  await call.startRTMP(`${rtmpUrl}/${streamKey}`);
  // Track each stream in state
}
```

**If Relay:**
```typescript
// 1. Create Livepeer multistream with all targets
const targets = platforms.map(p => ({ url: p.rtmpUrl, streamKey: p.streamKey }));
const livepeerStream = await createLivepeerStream(roomTitle, targets);

// 2. Push Stream.io output to Livepeer ingest
await call.startRTMP(`${livepeerStream.rtmpIngestUrl}/${livepeerStream.streamKey}`);
```

6. BroadcastModal transitions to BroadcastPanel (inline, collapsible)

### During Broadcast

- BroadcastPanel polls `/api/broadcast/status` every 10 seconds for health
- Shows per-platform: status dot (green/yellow/red), viewer count (if available), uptime
- Host can stop individual platforms (Direct mode) or stop all (both modes)
- Host can restart a failed platform without stopping others (Direct mode)

### Stopping a Broadcast

**Stop All:**
```typescript
// Direct: stop each RTMP stream
for (const stream of activeStreams) {
  await call.stopRTMP(stream.rtmpUrl);
}

// Relay: stop Livepeer stream (which stops all targets)
await deleteLivepeerStream(livepeerStreamId);
await call.stopRTMP(livepeerIngestUrl);
```

**Stop Individual (Direct mode only):**
```typescript
await call.stopRTMP(platform.rtmpUrl);
// Remove from active streams, keep others running
```

---

## BroadcastModal Updates

Current BroadcastModal (372 lines) shows platform checkboxes and "Start Broadcasting" button. Updates needed:

### Add Mode Toggle

```
┌─────────────────────────────────────┐
│  📡 Broadcast                   ✕  │
│                                     │
│  MODE                               │
│  [⚡ Direct] [🔄 Relay]             │
│  Lower latency    Stable for 3+     │
│                                     │
│  PLATFORMS                          │
│  ☑ Twitch — zaaltv                  │
│  ☑ YouTube — ZAO Live              │
│  ☐ Kick — zaaltv                   │
│  ☐ Facebook — ZAO Page             │
│  + Custom RTMP                      │
│                                     │
│  [Go Live →]                        │
└─────────────────────────────────────┘
```

- Mode toggle: two buttons, selected state highlighted
- Platform list: same as current but with connected account names
- "Go Live" button: gold, disabled if no platforms selected
- When 3+ platforms selected in Direct mode: subtle text "💡 Relay mode recommended for 3+ platforms"

---

## BroadcastPanel (New Component)

Expandable panel shown during active broadcast, replaces the modal.

### Collapsed State (in ControlsPanel)

```
📡 LIVE • 2 platforms • 12:34 uptime    [▼]
```

Small badge/bar at the top of the room or next to the broadcast button. Tap to expand.

### Expanded State

```
┌─────────────────────────────────────┐
│  📡 BROADCASTING         12:34  [▲] │
│  Mode: ⚡ Direct                     │
│                                     │
│  Twitch — zaaltv                    │
│  ● Connected  |  47 viewers  [Stop] │
│                                     │
│  YouTube — ZAO Live                 │
│  ● Connected  |  12 viewers  [Stop] │
│                                     │
│  Kick — zaaltv                      │
│  ● Buffering...            [Stop]   │
│                                     │
│  [+ Add Platform]  [Stop All]       │
└─────────────────────────────────────┘
```

**Status indicators:**
- 🟢 Connected — streaming normally
- 🟡 Buffering — reconnecting or initial buffer
- 🔴 Error — failed, shows retry button instead of stop
- ⚫ Stopped — manually stopped by host

**Per-platform controls:**
- Stop: stops that specific platform stream
- Retry: re-starts a failed stream
- These only work in Direct mode. In Relay mode, all platforms are controlled together.

**Global controls:**
- "+ Add Platform" — opens a mini selector to add another platform mid-broadcast
- "Stop All" — confirms with dialog, then stops everything

---

## RTMP Manager

Central orchestrator for broadcast lifecycle. Keeps track of active streams and provides a clean API.

### `src/lib/spaces/rtmpManager.ts`

```typescript
interface BroadcastTarget {
  platform: string;          // 'twitch' | 'youtube' | 'kick' | 'facebook' | 'custom'
  name: string;              // display name (channel/page name)
  rtmpUrl: string;
  streamKey: string;
  status: 'connecting' | 'connected' | 'error' | 'stopped';
  viewerCount?: number;
  startedAt?: string;
  error?: string;
}

interface BroadcastState {
  mode: 'direct' | 'relay';
  isLive: boolean;
  targets: BroadcastTarget[];
  livepeerStreamId?: string;  // only in relay mode
  livepeerIngestUrl?: string;
  startedAt: string;
}
```

**Functions:**

```typescript
// Start broadcasting to selected platforms
startBroadcast(call: Call, targets: BroadcastTarget[], mode: 'direct' | 'relay'): Promise<BroadcastState>

// Stop a single platform (direct mode only)
stopTarget(call: Call, state: BroadcastState, platform: string): Promise<BroadcastState>

// Stop all broadcasting
stopAll(call: Call, state: BroadcastState): Promise<void>

// Retry a failed target
retryTarget(call: Call, state: BroadcastState, platform: string): Promise<BroadcastState>

// Add a platform mid-broadcast (direct mode only)
addTarget(call: Call, state: BroadcastState, target: BroadcastTarget): Promise<BroadcastState>

// Get RTMP credentials for a platform
fetchCredentials(platform: string): Promise<{ rtmpUrl: string, streamKey: string }>
```

The rtmpManager calls existing infrastructure:
- `/api/broadcast/start` for RTMP credentials (already built)
- `/api/broadcast/targets` for saved custom RTMP endpoints (already built)
- `src/lib/livepeer/client.ts` for Livepeer multistream (already built)
- Stream.io SDK `call.startRTMP()` / `call.stopRTMP()` for native egress

---

## Broadcast Status API

### GET `/api/broadcast/status`

New endpoint for polling stream health during broadcast.

```typescript
// Query: ?roomId=xxx
// Response:
{
  isLive: true,
  mode: 'direct',
  uptime: 754,  // seconds
  targets: [
    { platform: 'twitch', status: 'connected', viewerCount: 47 },
    { platform: 'youtube', status: 'connected', viewerCount: 12 },
    { platform: 'kick', status: 'error', error: 'Connection reset' },
  ]
}
```

**How viewer counts are fetched:**
- Twitch: Twitch Helix API `GET /streams?user_login=xxx` (already have OAuth token)
- YouTube: YouTube Data API `GET /liveBroadcasts` (already have OAuth token)
- Kick/Facebook: Not available via API without additional setup — show "—" for now
- Custom RTMP: No viewer count available

**Polling:** BroadcastPanel calls this every 10 seconds while live.

---

## Stream.io RTMP API

### `call.startRTMP(url)`

Stream.io's `Call` object supports:

```typescript
// Start RTMP egress
await call.startRTMP({ address: 'rtmp://live.twitch.tv/live/stream_key' });

// Stop RTMP egress
await call.stopRTMP({ address: 'rtmp://live.twitch.tv/live/stream_key' });

// Check RTMP status
const response = await call.get();
const rtmpEgress = response.call.egress?.rtmps;
// Returns array of active RTMP destinations with status
```

The Stream.io SFU automatically composites all active participants into the RTMP output. Layout is determined by the call type and participant count (grid for multiple speakers, spotlight for screen share).

---

## Files to Create / Modify

### New Files

| File | Purpose |
|------|---------|
| `src/lib/spaces/rtmpManager.ts` | Broadcast lifecycle orchestrator (direct vs relay routing) |
| `src/components/spaces/BroadcastPanel.tsx` | Expandable live status panel with per-platform controls |
| `src/app/api/broadcast/status/route.ts` | Stream health polling endpoint |

### Modified Files

| File | Changes |
|------|---------|
| `src/components/spaces/BroadcastModal.tsx` | Add Direct/Relay mode toggle, wire to rtmpManager.startBroadcast |
| `src/components/spaces/RoomView.tsx` | Show BroadcastPanel when live (replaces modal), pass broadcast state |
| `src/components/spaces/ControlsPanel.tsx` | Show "📡 LIVE" badge with collapsed status when broadcasting |

### Existing Files Used (No Changes)

| File | Usage |
|------|-------|
| `src/lib/livepeer/client.ts` | `createLivepeerStream`, `deleteLivepeerStream` for relay mode |
| `src/app/api/broadcast/start/route.ts` | Fetches RTMP credentials per platform |
| `src/app/api/broadcast/targets/route.ts` | Saved custom RTMP targets |

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| `call.startRTMP()` fails | Mark target as error, show retry button, don't block other targets |
| Livepeer stream creation fails | Fall back to direct mode automatically, notify host |
| Platform disconnects mid-stream | Status polling detects error, show 🔴 + retry button |
| Host loses internet | Stream.io handles reconnection; if reconnection fails, all RTMP outputs stop |
| Browser tab closes | Streams continue on Stream.io server-side until call ends or timeout |

---

## What's NOT in Phase 2

- Custom compositing layouts (speaker grid vs spotlight) — Phase 3
- Overlay graphics (titles, now playing, logos) — Phase 3
- Recording + VOD — future
- Scheduled broadcasts — future
- Stream analytics dashboard — future

---

## Success Criteria

1. Host can start broadcasting from BroadcastModal with Direct or Relay mode
2. Direct mode: `call.startRTMP()` sends to each selected platform individually
3. Relay mode: Single RTMP to Livepeer, Livepeer fans out to all platforms
4. BroadcastPanel shows per-platform status (green/yellow/red), uptime, viewer counts
5. Host can stop individual platforms (Direct) or stop all (both modes)
6. Host can retry a failed platform without affecting others
7. 3+ platform hint appears when using Direct mode
8. Stream continues if host minimizes/backgrounds the room
