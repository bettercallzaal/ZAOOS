# 43 — WebRTC Audio Rooms, Live Listening Parties & Streaming

> **Status:** Research complete
> **Date:** March 2026
> **Goal:** How to add live audio rooms, synchronized listening parties, and streaming to ZAO OS
> **Recommendation:** LiveKit (open source SFU) + Livepeer (decentralized transcoding)

---

## Key Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| WebRTC provider | **LiveKit** | Open source (Apache 2.0), self-hostable, best React SDK, free tier |
| Architecture | **SFU** | Only viable for 10+ participants |
| Listening party sync | **Server-coordinated playback** | Better audio quality than streaming through WebRTC |
| Live streaming | **Livepeer Studio** | Web3-aligned, cheap (~$0.005/min), good API |
| Recording storage | **Cloudflare R2 → IPFS** | R2 for hot, IPFS for permanent archive |
| Cost (40 members) | **$0/month (free tier)** | LiveKit free = 5,000 min/mo, ~20 sessions |

---

## 1. WebRTC Provider Comparison

| Provider | Open Source | Self-Host | React SDK | Audio Room Support | Price (100 users, 1hr audio) | Best For |
|----------|-----------|-----------|-----------|-------------------|------------------------------|----------|
| **LiveKit** | Yes (Apache 2.0) | Yes | Excellent | Good (build yourself) | ~$24 cloud / ~$5 self-hosted | **Best overall** |
| **Daily.co** | No | No | Good | Good | ~$24 | Fastest MVP |
| **100ms** | No | No | Excellent | **Best** (built-in roles) | ~$18 | Best audio room UX |
| **Agora** | No | No | OK | Good | ~$6 | Cheapest at scale |
| **Jitsi** | Yes (Apache 2.0) | Yes | Limited | Poor | Free (self-host) | Zero budget |
| **Cloudflare Calls** | No | No (edge) | None | DIY | ~$0.30 | Cheapest but most work |
| **Huddle01** | No | No | Good | Good + token-gating | Free tier | Most web3-native |

### LiveKit Details
- Go-based SFU, React SDK: `@livekit/components-react`
- Features: speaker detection, recording (Egress), RTMP ingest, data channels, E2E encryption
- Free tier: 5,000 participant-minutes/month
- Self-hosted: $20-40/mo Hetzner VPS handles ~100 concurrent audio participants

### Huddle01 (Web3 Alternative)
- dRTC (decentralized Real-Time Communication)
- **Token-gated rooms** (ERC-20, ERC-721, ERC-1155) — fits ZAO's gated model
- Wallet-based identity — natural Farcaster integration
- $HUDL token for node staking
- Newer/less battle-tested than LiveKit

---

## 2. Live Listening Parties

### Architecture: Synchronized Playback (Recommended)

```
Host controls → Server maintains playback state → All clients play same track independently
                                                → Voice chat runs separately via WebRTC SFU
```

**Playback state object:**
```json
{ "trackId": "abc", "position": 142.5, "isPlaying": true, "startedAt": 1710000000000 }
```

Each client streams music from CDN/Audius independently (CD-quality). Voice chat is separate WebRTC audio tracks. Sync achieved via server timestamps.

### Why NOT Stream Audio Through WebRTC
- WebRTC audio processing (echo cancellation, noise suppression, AGC) **destroys music quality**
- Must disable: `{ echoCancellation: false, noiseSuppression: false, autoGainControl: false }`
- Even disabled, WebRTC Opus at voice bitrates (24-48kbps) is poor for music
- Better: each client plays music locally at full quality, only voice goes through WebRTC

### Latency Management
- Clock sync via simple NTP-like protocol over WebSocket (10-50ms accuracy)
- Acceptable drift for listening party: 50-100ms
- Drift correction: gently adjust playback rate (1.01x/0.99x) instead of seeking
- Pre-buffer 2-5 seconds, start at coordinated future timestamp

### Features
- **Queue management:** Shared queue, anyone can add, upvote/downvote next track
- **Reactions:** Emoji floating animations, timestamped to song position
- **Recording:** Voice chat via LiveKit Egress, chat messages stored in DB
- **Replay:** Reconstruct session — same tracks + recorded voice + chat at timestamps

### Reference: Spotify Jam
- Up to 32 participants, same track same position
- Anyone can add/skip/pause (configurable)
- Each client streams independently from CDN
- Only control messages exchanged, not audio
- **No voice chat** — that's the gap ZAO fills

---

## 3. Audio Rooms (Twitter Spaces / Clubhouse Style)

### Role System

| Role | Speak | Listen | Mute Others | Promote/Demote | End Room |
|------|-------|--------|-------------|----------------|----------|
| Host | Yes | Yes | Yes | Yes | Yes |
| Moderator | Yes | Yes | Yes | Yes | No |
| Speaker | Yes | Yes | No | No | No |
| Listener | No | Yes | No | No | No |

### Hand Raising Flow
1. Listener clicks "Raise Hand" → WebSocket message
2. Server notifies moderators
3. Moderator clicks "Invite to Speak"
4. Server grants publish permissions
5. Client publishes audio track

### Room Types

| Type | Use Case | Lifecycle |
|------|----------|-----------|
| **Ephemeral** | Impromptu hangouts | Destroyed when last person leaves |
| **Scheduled** | Weekly listening party, AMA | Created at scheduled time |
| **Persistent** | "ZAO Lounge" always-on room | Exists permanently |

---

## 4. Live Streaming

### Provider Comparison

| Provider | Monthly Cost (4hr/week, 100 viewers) | Strengths |
|----------|-------------------------------------|-----------|
| **Livepeer Studio** | ~$5-15 | Decentralized, web3-native, cheapest |
| **Cloudflare Stream** | ~$15-25 | Simple pricing, Cloudflare ecosystem |
| **Mux** | ~$40-60 | Best DX and analytics |
| **YouTube/Twitch embed** | $0 | Free but lose control |

### Livepeer (Recommended)
- Decentralized video transcoding on Ethereum/Arbitrum
- Free tier: 1,000 minutes/month
- RTMP ingest from OBS
- Adaptive bitrate HLS output
- **Token-gated playback** via webhook
- Multistream to YouTube/Twitch simultaneously

### Latency Options

| Protocol | Latency | Use Case |
|----------|---------|----------|
| WebRTC | <500ms | Interactive (audio rooms) |
| LL-HLS | 2-5 seconds | Near-live streaming |
| Standard HLS | 15-30 seconds | VOD-like, cost-efficient |

---

## 5. Music-Specific Audio Quality

| Parameter | Voice Chat | Music Streaming |
|-----------|-----------|----------------|
| Sample rate | 16-24 kHz | 44.1-48 kHz |
| Bitrate (Opus) | 24-48 kbps | 96-256 kbps stereo |
| Channels | Mono | Stereo |
| Frequency | 300-3400 Hz | 20-20,000 Hz |

**Critical:** Disable all audio processing for music tracks (echo cancellation, noise suppression, AGC). These are designed for voice and destroy music quality.

---

## 6. Farcaster Integration

- **No native Farcaster audio rooms exist** — this is an open opportunity
- Audio rooms can be embedded as **Farcaster Mini Apps**
- Room metadata cast to Farcaster feed for discovery
- Farcaster social graph drives room discovery (show rooms your follows are in)
- Token-gating via Farcaster connected wallet

### Competitive Landscape
- Most web3 communities use **Discord** for audio (Stage Channels)
- Twitter Spaces for public-facing audio
- **No web3-native audio room standard exists** — ZAO building this is differentiated

---

## 7. Cost Analysis for ZAO OS

### Phase 1 (MVP, $0/month)
- LiveKit Cloud or Daily.co free tier
- 5,000-10,000 minutes = ~20 sessions of 10 people
- Sufficient for weekly listening parties

### Phase 2 (Growing, $30-60/month)
- Self-hosted LiveKit on $20-40 VPS (unlimited usage)
- Recording stored on Cloudflare R2
- Livepeer for occasional live streams ($5-15)

### Phase 3 (500+ members, $100-200/month)
- Larger VPS or LiveKit Cloud at scale
- Livepeer for regular streaming
- Archive recordings on IPFS

---

## 8. Implementation Plan

### Next.js Integration Structure
```
src/app/(auth)/rooms/           # Room discovery + individual rooms
src/app/api/rooms/              # Create room, list, generate access tokens
src/components/rooms/           # AudioRoom, SpeakerGrid, RoomControls, NowPlaying
src/hooks/useRoom.ts            # Room state management
src/hooks/useListeningParty.ts  # Synchronized playback
src/lib/livekit/                # Client + server setup
```

### Phased Rollout
1. **Audio rooms** — LiveKit React SDK, speaker/listener roles, Farcaster identity
2. **Listening parties** — Synchronized playback + voice chat + queue voting
3. **Live streaming** — Livepeer RTMP ingest, HLS output, token-gated
4. **Recording & archive** — LiveKit Egress → R2 → IPFS
5. **Farcaster Mini App** — Audio rooms discoverable in Farcaster feed

---

## Sources

- [LiveKit](https://livekit.io/) — [Docs](https://docs.livekit.io/)
- [Daily.co](https://daily.co/) — [Docs](https://docs.daily.co/)
- [100ms](https://100ms.live/) — [Docs](https://www.100ms.live/docs/)
- [Agora](https://agora.io/)
- [Jitsi](https://jitsi.org/)
- [Cloudflare Calls](https://developers.cloudflare.com/calls/)
- [Huddle01](https://huddle01.com/) — [Docs](https://docs.huddle01.com/)
- [Livepeer](https://livepeer.org/) — [Studio](https://livepeer.studio/)
- [Cloudflare Stream](https://www.cloudflare.com/products/cloudflare-stream/)
- [Mux](https://mux.com/)
