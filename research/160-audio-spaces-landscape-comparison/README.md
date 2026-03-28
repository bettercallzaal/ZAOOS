# 160 — Audio Spaces Landscape: Farcaster Apps, X Spaces Competitors & Provider Comparison

> **Status:** Research complete
> **Date:** March 27, 2026
> **Goal:** Map every Farcaster audio app, compare to X Spaces, evaluate providers for ZAO OS's public-facing audio rooms
> **Updates:** Doc 43 (WebRTC research), Doc 119 (Songjam embed)

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Primary audio provider** | Keep **Stream.io** (already integrated) — best React SDK, free tier covers ZAO's scale |
| **Secondary provider** | Keep **100ms** (plan in progress) — Songjam-compatible, best built-in audio room roles |
| **Public-facing rooms** | Add unauthenticated listener access — guest users can listen, Farcaster auth to speak |
| **Differentiation** | **Music-first audio rooms** — no other Farcaster app combines audio rooms + music player + Respect-weighted curation |
| **Future addition** | Evaluate **Huddle01** for token-gated rooms (dRTC, on-chain access control) |
| **Missing from competitors** | Recording/replay, AI transcription, cast-to-Farcaster from room, tipping during rooms |

## The Landscape: Farcaster Audio Apps

| App | Status (March 2026) | Features | Limitations |
|-----|---------------------|----------|-------------|
| **FarHouse** | Active (iOS/Android) | Clubhouse-style rooms, $DEGEN tipping, recording, invite-only | App-only (no web), invite gated, no music integration |
| **Songjam** | Active (Web) | Audio rooms + leaderboards + jumbotron casting, 100ms + Stream.io | Twitter-auth focused, no Farcaster-native auth |
| **Tavern** | Active (Web) | Soundboards, closed captioning, more accessible than FarHouse | Less Farcaster-native, smaller community |
| **FC Audio Chat** | Active (Web) | Basic Clubhouse-style rooms on Farcaster | Minimal features, basic UI |
| **Huddle01** | Active (Web/SDK) | dRTC, token-gated rooms, 120K+ meetings, 5,500+ Farhouse spaces | Requires $HUDL staking for nodes, newer platform |

## X Spaces vs What ZAO Can Build

| Feature | X Spaces | ZAO OS (Current) | ZAO OS (Can Add) |
|---------|----------|-------------------|-------------------|
| Host/join audio rooms | Yes | Yes (Stream.io) | - |
| Speaker/listener roles | Yes | Yes | - |
| Request to speak | Yes | Yes | - |
| Live indicator | Yes | Yes | - |
| Ticketed/paid rooms | Yes ($1-$999) | No | Respect-gated rooms |
| Recording | Yes | No | Stream.io supports recording |
| Transcription | Yes | No | 100ms has built-in transcription |
| Scheduling | Yes | No | Supabase + cron |
| Share to feed | Yes (tweet) | No | Cast to Farcaster from room |
| Co-hosts | Yes | No | Stream.io supports multiple hosts |
| Music playback in room | No | Yes (ZAO Radio) | Sync'd listening party |
| Token-gating | No | Yes (Respect/ZAO membership) | NFT-gated with Huddle01 |
| Tipping | No | No | $DEGEN or on-chain tips |
| Leaderboard/gamification | No | Planned (100ms task) | Mindshare + participation points |
| Binaural beats | No | Yes (existing) | In-room ambient audio |
| Cross-platform cast | No | Yes (Neynar routes) | Tweet-to-cast from room |

## Provider Comparison (Updated March 2026)

| Provider | Free Tier | Audio Room Support | React SDK | Self-Host | Token-Gating | Price at Scale |
|----------|-----------|-------------------|-----------|-----------|-------------|----------------|
| **Stream.io** | 100 participants, 100 min/mo | Good | Excellent | No | No (DIY) | ~$50/mo Ship tier |
| **100ms** | 10,000 min/mo | **Best** (built-in roles) | Excellent | No | No (DIY) | Usage-based |
| **LiveKit** | 5,000 min/mo | Build yourself | Good | **Yes** (Apache 2.0) | No (DIY) | $50/mo Ship, free self-host |
| **Huddle01** | Free tier | Good + **token-gating built-in** | Good | **Yes** (dRTC nodes) | **Yes** (native) | Node staking model |
| **Daily.co** | 10,000 min/mo | Good | Good | No | No | Usage-based |
| **Agora** | 10,000 min/mo | Good | OK | No | No | Cheapest at scale (~$0.99/1000 min) |

## What Makes ZAO Spaces Unique (No Other App Has This)

1. **Music-first rooms** — ZAO Radio + audio rooms in one. Listen to music together while talking. No Farcaster app does this.
2. **Respect-weighted participation** — speaker priority based on community Respect, not just hand-raising order
3. **Integrated casting** — pin casts to the room jumbotron, like/recast/follow without leaving
4. **Fractal integration** — audio rooms for weekly Respect fractal sessions (replacing Discord)
5. **Public + gated** — anyone can listen, but speaking/hosting requires ZAO membership or Respect threshold
6. **Cross-platform distribution** — room highlights auto-cast to Farcaster/Bluesky/X

## Public-Facing Architecture

Current `/spaces` is behind `(auth)` route group. For public access:

```
/spaces              → Public room list (anyone can browse)
/spaces/[id]         → Public listener access (guest Stream user)
                     → Farcaster auth required to: speak, host, react, cast
```

Implementation:
1. Move room list page outside `(auth)` to `/app/spaces/page.tsx`
2. Guest users get `createGuestUser()` (already built in streamHelpers.ts)
3. Show "Sign in to speak" button for unauthenticated users
4. Host creation still requires auth

## Next Steps (Priority Order)

1. **Make /spaces public-facing** — move outside auth route, guest listener support
2. **Add room scheduling** — schedule rooms in advance, show upcoming
3. **Add recording** — Stream.io supports call recording
4. **Cast from room** — pin highlights to Farcaster during live room
5. **Respect-gated hosting** — minimum Respect to host a room
6. **Evaluate Huddle01** — native token-gating for special rooms
7. **AI transcription** — live captions via 100ms built-in or Whisper

## Sources

- [FarHouse — Audio Spaces for Farcaster](https://farhouse.club/)
- [Huddle01 — Decentralized Video Conferencing](https://huddle01.com/)
- [Huddle01 Comprehensive Guide (Jan 2026)](https://medium.com/@tohinjhon4/huddle01-a-comprehensive-guide-to-decentralized-video-conferencing-for-web3-communities-e7548a418afc)
- [LiveKit Alternatives (2026)](https://www.buildmvpfast.com/alternatives/livekit)
- [100ms vs LiveKit Comparison](https://www.videosdk.live/100ms-vs-livekit)
- [LiveKit Pricing](https://livekit.com/pricing)
- [Top X Spaces Alternatives (2026)](https://slashdot.org/software/p/X-Spaces/alternatives)
- [6 Social Audio Platforms (2026)](https://trio-media.co.uk/6-social-audio-platforms-you-need-to-be-aware-of/)
- [Farcaster 2026: Becoming a Verb](https://papajams.medium.com/farcaster-2026-becoming-a-verb-3487fe0950dc)
- [20 Farcaster Mini Apps (Bankless)](https://www.bankless.com/read/20-farcaster-mini-apps)
- [Stream.io LiveKit Alternatives](https://getstream.io/blog/livekit-alternatives/)
