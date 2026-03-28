# 163 — Multistreaming Platforms: Restream, StreamYard, Meld, Livepeer for ZAO OS

> **Status:** Research complete
> **Date:** March 28, 2026
> **Goal:** Evaluate multistreaming services for broadcasting ZAO OS audio rooms to YouTube/Twitch/TikTok/Facebook simultaneously
> **Updates:** Doc 161 (RTMP streaming), Doc 43 (WebRTC research)

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Best for ZAO OS** | **3-tier approach** — see below |
| **Tier 1: Built-in** | Stream.io + 100ms native RTMP (already available, no extra cost) |
| **Tier 2: Web3-native** | **Livepeer** multistream API — decentralized, cheapest, has API |
| **Tier 3: Power users** | **Restream.io** API integration — 30+ platforms, chat aggregation |
| **Skip** | StreamYard (no API), Meld (desktop app only, no API) |

## The 3-Tier Architecture for ZAO OS

```
ZAO OS Audio Room (/spaces)
│
├── Tier 1: Direct RTMP (Free, built-in)
│   ├── Stream.io → call.startRTMPBroadcast() → 1-3 RTMP URLs
│   └── 100ms → /v2/live-streams/start → up to 3 RTMP URLs
│   └── User enters YouTube/Twitch stream keys manually
│
├── Tier 2: Livepeer Multistream (Cheap, web3-native)
│   ├── ZAO room audio → Livepeer RTMP ingest
│   ├── Livepeer API → auto-forwards to YouTube + Twitch + TikTok + Facebook
│   ├── Token-gated playback via webhook
│   └── Cost: ~$0.005/min transcoding
│
└── Tier 3: Restream.io (Pro, 30+ platforms)
    ├── ZAO room audio → Restream RTMP ingest
    ├── Restream API → forwards to ALL connected channels (up to 8)
    ├── Aggregated chat from all platforms back into ZAO
    └── Cost: $16-39/mo
```

## Platform Comparison

| Platform | Has API? | Multistream To | Free Tier | Pricing | Best For |
|----------|----------|----------------|-----------|---------|----------|
| **Stream.io** (built-in) | Yes (SDK) | 1-3 RTMP URLs | Included | Already paying | Quick "go live on YouTube" |
| **100ms** (built-in) | Yes (SDK) | Up to 3 RTMP URLs | Included | Already paying | Same as above |
| **Livepeer** | **Yes (REST API)** | Unlimited RTMP targets | 1,000 min/mo | ~$0.005/min | Web3-native, cheapest at scale |
| **Restream.io** | **Yes (REST + WebSocket)** | 30+ platforms, up to 8 simultaneous | 2 channels | $16-199/mo | Most platforms, chat aggregation |
| **StreamYard** | **No public API** | Multiple via RTMP | Limited | $20-65/mo | Skip — can't integrate programmatically |
| **Meld** | **No API** (desktop app) | Unlimited (free beta) | Free (beta) | Free | Skip — desktop only, no web API |
| **Streamlabs** | Partial | Multiple | Free (OBS) | $19/mo cloud | Skip — OBS plugin, not API-driven |

## Tier 1: Direct RTMP (Already Built)

Stream.io and 100ms both support sending RTMP out. This is the simplest path:

**User flow:**
1. Host creates room on `/spaces`
2. Clicks "Broadcast" → enters YouTube stream key
3. Room audio goes to YouTube Live
4. Can add Twitch as second destination (up to 3)

**Limitation:** User must manually enter stream keys for each platform. Max 3 destinations.

**Implementation:** Already covered in Doc 161. Just need the UI (BroadcastModal component).

## Tier 2: Livepeer Multistream (Recommended Addition)

Livepeer is the web3-native option. It's a decentralized video transcoding network with a proper multistream API.

**How it works:**
1. Create a Livepeer stream with multistream targets (YouTube, Twitch, TikTok, etc.)
2. Get an RTMP ingest URL from Livepeer
3. Send ZAO room audio to Livepeer's ingest via Stream.io's RTMP broadcast
4. Livepeer forwards to all targets simultaneously — unlimited destinations

**API example:**
```typescript
// 1. Create multistream targets
const target = await livepeer.multistream.create({
  name: 'ZAO YouTube',
  url: 'rtmp://a.rtmp.youtube.com/live2/stream-key',
});

// 2. Create stream with targets
const stream = await livepeer.stream.create({
  name: 'ZAO Live Room',
  multistream: {
    targets: [
      { id: target.id, profile: 'source' },
      // Add more targets...
    ],
  },
});

// 3. Use stream.rtmpIngestUrl as the RTMP destination from Stream.io
await call.startRTMPBroadcast({
  rtmpURL: stream.rtmpIngestUrl,
  streamKey: stream.streamKey,
});
```

**Why Livepeer for ZAO:**
- Web3-aligned (decentralized transcoding on Arbitrum)
- Token-gated playback via webhook — fits ZAO's Respect/membership model
- Cheapest at scale (~$0.005/min vs $16+/mo for Restream)
- Free tier: 1,000 minutes/month — ~4 hours/week for free
- Has a `webrtmp-sdk` for browser-based RTMP streaming

**New dependency:** `livepeer` npm package (official SDK)

## Tier 3: Restream.io API (Power Feature)

Restream has the most complete API and supports 30+ platforms including some Stream.io/Livepeer don't:

**Unique Restream features:**
- **Chat aggregation** — pull chat from YouTube, Twitch, Facebook into one stream, could pipe into ZAO's cast feed
- **30+ platforms** — LinkedIn Live, X/Twitter, Kick, TikTok, custom RTMP
- **Scheduling** — schedule streams in advance
- **Analytics** — viewer counts across all platforms
- **Clips** — clip highlights during stream

**API capabilities:**
- OAuth 2.0 auth
- REST API for channels, events, stream keys
- WebSocket for real-time chat aggregation
- Programmatic stream management

**How it integrates:**
1. User connects Restream account (OAuth)
2. ZAO fetches their connected channels via API
3. One-click "Go Live Everywhere" — sends room audio to Restream ingest
4. Restream distributes to all connected platforms
5. Chat from all platforms aggregated back into ZAO room

**Cost:** $16/mo Standard (3 channels), $39/mo Professional (5 channels + 1080p)

## Implementation Plan for ZAO OS

### Phase 1: Direct RTMP UI (No new service)
- Add `BroadcastModal` to `/spaces` rooms
- User enters stream key manually
- Uses Stream.io/100ms native RTMP
- **Effort:** ~2 hours

### Phase 2: Livepeer Integration
- Add `livepeer` npm package
- Create `/api/livepeer/stream` route
- Save user's platform targets in Supabase `broadcast_targets` table
- One-click multistream to all saved targets
- **Effort:** ~4 hours
- **Cost:** Free for 1,000 min/mo

### Phase 3: Restream Integration (Premium Feature)
- OAuth flow for Restream connection
- Fetch connected channels
- One-click broadcast to all channels
- Chat aggregation into room
- **Effort:** ~8 hours
- **Cost:** Requires Restream paid plan

### Supabase Schema Addition
```sql
CREATE TABLE broadcast_targets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_fid BIGINT NOT NULL,
  platform TEXT NOT NULL, -- 'youtube', 'twitch', 'tiktok', 'custom'
  name TEXT NOT NULL,
  rtmp_url TEXT NOT NULL,
  stream_key TEXT, -- encrypted
  provider TEXT DEFAULT 'direct', -- 'direct', 'livepeer', 'restream'
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## What This Means for ZAO Users

| User Type | Experience |
|-----------|-----------|
| **Casual host** | Click "Broadcast" → paste YouTube key → done |
| **Regular streamer** | Save stream keys once → one-click "Go Live on YouTube + Twitch" |
| **Power user** | Connect Restream → go live on 8+ platforms simultaneously |
| **Community** | Watch on YouTube/Twitch even without ZAO membership |

## Sources

- [Restream API Developer Docs](https://developers.restream.io/docs)
- [Restream API Reference](https://developers.restream.io/docs/streaming-api-reference/overview)
- [Restream Pricing](https://restream.io/pricing)
- [StreamYard API Status](https://support.streamyard.com/hc/en-us/articles/4402082361364-Does-StreamYard-have-an-open-API)
- [Meld Multi Docs](https://meldstudio.co/docs/meld-multi/)
- [Multi by Meld](https://multi.meldstudio.co/)
- [Livepeer Multistream Docs](https://docs.livepeer.org/developers/guides/multistream)
- [Livepeer webrtmp-sdk](https://github.com/livepeer/webrtmp-sdk)
- [Livepeer "Multistream Twitter Spaces"](https://livepeer.studio/blog/how-to-multistream-twitter-spaces-with-livepeer-studio)
- [Doc 161 — Multi-Platform Streaming RTMP](../161-multiplatform-streaming-rtmp/)
