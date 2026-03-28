# 161 — Multi-Platform Streaming from ZAO OS Audio Rooms (RTMP Out)

> **Status:** Research complete
> **Date:** March 28, 2026
> **Goal:** Stream ZAO OS audio rooms to YouTube, Twitch, and other platforms simultaneously
> **Updates:** Doc 43 (WebRTC research), Doc 160 (audio spaces landscape)

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Can we do it?** | **YES** — both Stream.io and 100ms support RTMP out natively |
| **Stream.io** | Built-in RTMP broadcasting — multiple destinations per call, custom layouts |
| **100ms** | RTMP streaming + recording — up to 3 simultaneous RTMP URLs |
| **Which to use first** | **Stream.io** (already integrated in `/spaces`) — add RTMP broadcasting to existing rooms |
| **Destinations** | YouTube Live, Twitch, Facebook Live, any RTMP ingest URL |
| **Cost** | Included in Stream.io/100ms plans — no extra service needed |

## How It Works

### Stream.io RTMP Broadcasting (Already Integrated)

Stream.io's SDK can forward any call to external RTMP destinations. The platform:
1. Captures all audio/video from the call
2. Composites into a single stream with configurable layout
3. Encodes to RTMP
4. Sends to 1+ external services simultaneously

**API call to start broadcasting:**
```typescript
// From the host's perspective in the room
await call.startRTMPBroadcast({
  rtmpURL: 'rtmp://a.rtmp.youtube.com/live2',
  streamKey: 'xxxx-xxxx-xxxx-xxxx',
});

// Multiple destinations at once
await call.startRTMPBroadcast({
  rtmpURL: 'rtmp://a.rtmp.youtube.com/live2',
  streamKey: 'youtube-key',
});
await call.startRTMPBroadcast({
  rtmpURL: 'rtmp://live.twitch.tv/app',
  streamKey: 'twitch-key',
});
```

**Layout customization:**
- Pre-defined layouts (grid, spotlight, single participant)
- Custom branding (colors, logos, positioning)
- Or build a custom webapp as the broadcast layout

### 100ms RTMP Streaming

100ms uses a bot that joins the room and streams to RTMP:
- Up to **3 simultaneous RTMP URLs**
- Supports YouTube, Twitch, Facebook, Mux, any RTMP endpoint
- Also supports **browser recording** (saves to cloud storage)
- Server-side API: `POST /v2/live-streams/room/{room_id}/start`

## What ZAO OS Can Build

### Phase 1: "Go Live on YouTube/Twitch" Button (Stream.io)

Add to the existing `/spaces/[id]` room page:
- Host sees "Broadcast" button next to "Go Live"
- Click → modal asking for RTMP URL + stream key (or select YouTube/Twitch preset)
- Start broadcasting → room audio goes to YouTube/Twitch
- Show "Broadcasting to YouTube" indicator in room
- Stop broadcasting button

### Phase 2: Saved Stream Keys (Supabase)

- Host saves their YouTube/Twitch stream keys in settings
- One-click "Go Live on YouTube" without re-entering keys
- Multiple destination presets

### Phase 3: Auto-Broadcast (100ms)

When 100ms rooms are integrated on `/social`:
- Admin can set rooms to auto-broadcast to ZAO's YouTube channel
- Community events automatically go live on multiple platforms
- Recording saved for replay

## Architecture for ZAO OS

```
ZAO OS /spaces/[id]
    ├── Stream.io Audio Room (participants talk)
    ├── Music DJ (useListeningRoom synced playback)
    └── RTMP Broadcast
        ├── YouTube Live (rtmp://a.rtmp.youtube.com/live2)
        ├── Twitch (rtmp://live.twitch.tv/app)
        └── Custom RTMP (any ingest URL)
```

**No extra services needed.** Stream.io handles the compositing and RTMP encoding server-side. The host just provides stream keys.

## User Flow

1. Host creates room on `/spaces`
2. People join, music plays via DJ mode
3. Host clicks "Broadcast" → enters YouTube stream key
4. Room audio (voices + music) streams to YouTube Live
5. Anyone on YouTube can watch/listen to the ZAO room
6. Host can add Twitch as second destination
7. Host ends broadcast → YouTube/Twitch streams end
8. Host ends room → everything cleans up

## Existing Code to Modify

| File | Change |
|------|--------|
| `src/components/spaces/ControlsPanel.tsx` | Add "Broadcast" button for host |
| `src/components/spaces/BroadcastModal.tsx` | New — RTMP URL/key input, destination selector |
| `src/app/api/stream/broadcast/route.ts` | New — server-side RTMP start/stop via Stream API |
| `src/app/(auth)/settings/SettingsClient.tsx` | Add stream key management section |

## Comparison: What X Spaces Can't Do

| Feature | X Spaces | ZAO OS Spaces |
|---------|----------|---------------|
| Stream to YouTube | No | Yes (RTMP) |
| Stream to Twitch | No | Yes (RTMP) |
| Multi-platform simulcast | No | Yes (multiple RTMP URLs) |
| Music playback in room | No | Yes (DJ mode) |
| Custom broadcast layout | No | Yes (Stream.io layouts) |
| Recording | Yes (limited) | Yes (Stream.io + 100ms) |
| Token-gated access | No | Yes (Respect/membership) |

## Sources

- [Stream.io RTMP Broadcasts Docs](https://getstream.io/video/docs/api/streaming/rtmp_broadcasts/)
- [Stream.io React RTMP Docs](https://getstream.io/video/docs/react/streaming/rtmp_broadcasts/)
- [100ms RTMP Streaming Docs](https://www.100ms.live/docs/javascript/v2/how-to-guides/record-and-live-stream/rtmp-recording)
- [100ms Server-Side RTMP API](https://www.100ms.live/docs/server-side/v2/api-reference/legacy-api-v1/destinations/rtmp-streaming-and-browser-recording)
- [Doc 43 — WebRTC Audio Rooms & Streaming](../043-webrtc-audio-rooms-streaming/)
- [Doc 160 — Audio Spaces Landscape](../160-audio-spaces-landscape-comparison/)
