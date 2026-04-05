# 79 — SongJam Ecosystem & Music Player Research

> **Status:** Research complete
> **Date:** March 19, 2026
> **Goal:** Evaluate SongJam's 2026-music-player for ZAO OS integration + full ecosystem analysis

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **2026-music-player** | DO NOT USE — Electron torrent streamer, no web support, no multi-platform playback. Not relevant. |
| **ZAO OS player** | ALREADY BETTER — PlayerProvider + GlobalPlayer with Spotify/SoundCloud/YouTube/Audius beats anything SongJam has |
| **Live audio rooms** | BORROW from SongJam — 100ms SDK pattern for fractal voice calls (future sprint) |
| **Leaderboard viz** | BORROW — mindshare treemap visualization for Respect leaderboard |
| **Music upgrade path** | Focus on improving what we have: Apple Music, Tidal, Bandcamp providers + better queue UX |

## What SongJam's 2026-Music-Player Actually Is

**An Electron desktop app that streams torrents.** NOT a multi-platform music player.

- Tech: Electron 28 + WebTorrent 1.8 + vanilla JS
- Streams magnet links via local HTTP server on random port
- Fixed-footer player bar (only transferable pattern)
- No React, no web, no Spotify/SoundCloud/YouTube/Audius
- No metadata resolution, no album art, no queue management
- MIT license

## What SongJam Actually Does (Core Product)

SongJam is a **live audio spaces platform** with voice verification, NOT a music player platform.

- Live audio rooms via **100ms SDK** (`@100mslive/react-sdk`)
- Voice synthesis via **ElevenLabs**
- Video calls via **Stream.io**
- Leaderboard with per-second participation tracking
- $SANG token on Solana for staking/rewards
- Farcaster integration via Neynar (same pattern as ZAO OS)
- Tagline: "When Attention becomes Currency, Voice is the Commodity"

## SongjamSpace GitHub Org (80+ repos)

| Repo | Relevance to ZAO | Notes |
|------|-------------------|-------|
| `songjam-site` | Medium | Next.js 15 + Neynar + 100ms live audio. Same stack. |
| `songjam-ui` | Low | CRM/dashboard for X Spaces analytics |
| `songjam-leaderboard-ui` | Low | $SANG token leaderboard on Solana |
| `2026-music-player` | None | Electron torrent streamer |
| `songjam-agent-onboarding` | Low | AI agents joining voice spaces |
| `nusic-player-pwa` | None | Old Pages Router era, abandoned |

**No SDK, no embeddable player, no npm package** exists in the SongJam ecosystem.

## What ZAO OS Already Has (Better Than SongJam)

| Feature | ZAO OS | SongJam |
|---------|--------|---------|
| Multi-platform playback | Spotify, SoundCloud, YouTube, Audius | None (torrent only) |
| Global persistent player | Yes (GlobalPlayer.tsx) | Desktop only (Electron) |
| Queue management | Yes (MusicQueueTrackCard) | Basic prev/next only |
| Shuffle/repeat | Yes | No |
| Volume control | Yes + mute | No |
| Scrubber/seek | Yes (Scrubber.tsx) | Basic (via range requests) |
| Mobile responsive | Yes (desktop + mobile layouts) | No (Electron desktop) |
| Album art | Yes (from metadata API) | No |
| Radio mode | Yes (Audius playlists) | No |
| Song submissions | Yes (community curation) | No |

## What to Actually Build Next (Music Upgrade)

Since SongJam doesn't help, here's what would make ZAO OS music best-in-class:

### Priority 1: Always-Visible Player
- Make GlobalPlayer render on ALL pages (currently only on chat/tools)
- Persist playback across page navigation (already works via AudioProviders in layout)

### Priority 2: More Platform Providers
- **Apple Music** — MusicKit JS SDK (requires Apple Developer account)
- **Tidal** — embed via iframe (no public API for playback)
- **Bandcamp** — embed via iframe
- **Sound.xyz** — already partially supported via metadata API

### Priority 3: Music Discovery
- "Now Playing" feed — show what members are listening to
- Music submission voting — upvote/downvote community picks
- Curated playlists by ZAO members (not just Audius radio)
- Music embed auto-detection in chat messages (already have MusicEmbed)

### Priority 4: Live Audio Rooms (from SongJam patterns)
- 100ms SDK for fractal voice calls
- Could replace Zoom/Google Meet for weekly fractals
- Integrated participation tracking (maps to Respect)

## Interesting SongJam Patterns to Borrow

### Leaderboard Points System
```typescript
// Per-second accumulation with role multipliers
const POINTS_PER_SECOND = {
  listener: 1,
  speaker: 2,
  host: 0,
};
// + staking multiplier + empire multiplier
```

### 100ms Live Audio Setup
```typescript
// songjam-site pattern
import { useHMSActions, useHMSStore, selectPeers } from '@100mslive/react-sdk';
// API route generates room tokens
// POST /api/100ms/token → { token, roomId }
```

### Mindshare Treemap Visualization
A space-filling rectangle treemap showing relative influence/respect scores. Visual alternative to the ranked list leaderboard.

## Sources

- [SongjamSpace/2026-music-player](https://github.com/SongjamSpace/2026-music-player) — MIT, Electron + WebTorrent
- [SongjamSpace GitHub Org](https://github.com/SongjamSpace) — 80+ repos
- [songjam.space](https://songjam.space) — Main platform
- [SongJam docs](https://docs.songjam.space) — Protocol documentation
- Existing ZAO OS code: `src/providers/audio/`, `src/components/music/`
