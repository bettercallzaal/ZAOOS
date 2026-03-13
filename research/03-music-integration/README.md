# Music Integration Research

> How to build a music-first social feed on Farcaster

## Landscape

**No dominant music-first Farcaster client exists.** Current state:
- `/music` channel on Warpcast — discussion, not a dedicated experience
- Scattered Frame experiments for music players
- Spinamp — music NFT aggregator (not Farcaster-native)
- Pods — podcast/audio-focused Farcaster client (experimental)
- Jam.so — music sharing experiment

**This is a clear gap in the market.**

---

## How Music Works in Farcaster

### Cast Embeds
- Casts support up to **2 URL embeds**
- Clients render OpenGraph previews (image, title, description)
- Music URLs (Spotify, SoundCloud, Sound.xyz) show as link previews
- **No inline playback** in standard embed previews — user clicks through

### Frames v2 (The Game-Changer)
Frames v2 enables **full inline audio players** in the feed:

- Full HTML/JS/CSS in sandboxed webview
- Build actual play/pause, waveforms, progress bars inline
- Wallet interactions (mint, tip) directly in the frame
- Push notifications for new releases

**Frame v2 Manifest** (`/.well-known/farcaster.json`):
```json
{
  "accountAssociation": { ... },
  "frame": {
    "version": "1",
    "name": "ZAO Music Player",
    "iconUrl": "https://...",
    "homeUrl": "https://...",
    "splashImageUrl": "https://...",
    "splashBackgroundColor": "#000000",
    "webhookUrl": "https://..."
  }
}
```

**Frame v2 SDK:**
```typescript
sdk.actions.ready()          // signal frame loaded
sdk.actions.openUrl(url)     // open external URL
sdk.actions.close()          // close frame
sdk.actions.addFrame()       // prompt user to follow (notifications)
sdk.wallet.ethProvider       // EIP-1193 wallet for minting/tipping
sdk.context                  // user FID, username, pfp
```

---

## Music API Sources

### On-Chain Music (Web3-Native) — Primary

| Platform | API | Auth | Use Case |
|----------|-----|------|----------|
| **Audius** | `discoveryprovider.audius.co/v1/` | None (free) | Full streaming, search, user profiles. Best free option. |
| **Sound.xyz** | `api.sound.xyz/graphql` | GraphQL | Music NFT drops on Base/OP. Artist releases, collectors. |
| **Zora** | Zora API + `@zoralabs/protocol-sdk` | — | General NFTs, heavily used for music on Base. |
| **Spinamp** | `api.spinamp.xyz` | — | Aggregator across Sound, Catalog, Zora. Unified index. |
| **Catalog** | The Graph subgraph | — | 1-of-1 music NFTs, high-end curation. |

### Web2 Music — Secondary

| Service | API | Auth | Use Case |
|---------|-----|------|----------|
| **Spotify** | Web API (REST) | OAuth | 30-sec previews, metadata, playlists. Mainstream catalog. |
| **SoundCloud** | Widget API / oEmbed | Limited | Embed player. API access restricted. |
| **Apple Music** | MusicKit JS | Dev token | Previews and metadata. |
| **Deezer** | Public API | None | 30-sec previews, metadata. |
| **YouTube** | Data API v3 | API key | Video/audio metadata. |

---

## Recommended Integration Strategy

### Phase 1 (MVP)
1. **Audius** — Free, decentralized, full track streaming, no auth needed
2. **Sound.xyz** — Music NFTs, web3-native audience, minting integration

### Phase 2
3. **Spotify** — 30-sec previews for mainstream catalog recognition
4. **Spinamp** — Aggregate all on-chain music in one index

### Phase 3
5. **Zora** — Broader NFT music minting
6. **Apple Music / Deezer** — Additional mainstream sources

---

## Unified Track Schema

Internal data model for music posts:

```typescript
interface Track {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;          // streaming URL
  artworkUrl: string;        // album art
  duration: number;          // seconds
  source: 'audius' | 'sound' | 'spotify' | 'zora' | 'soundcloud';
  // On-chain metadata (optional)
  contractAddress?: string;
  tokenId?: string;
  chain?: 'base' | 'optimism' | 'ethereum';
  mintPrice?: string;
  // Social metadata
  collectCount?: number;
  playCount?: number;
}
```

---

## Feed Ranking Signals

| Signal | Weight | Source |
|--------|--------|--------|
| Social graph | High | Tracks from followed users |
| Engagement | High | Plays, collects, reactions, replies |
| Freshness | Medium | Recent drops weighted higher |
| Curation quality | Medium | Posts by high-Respect users |
| Genre match | Medium | Collaborative filtering on collect/play history |
| Artist verification | Low | Verified artists get small boost |

---

## Audio Player Architecture

```
Component: <MusicPlayer />
├── Howler.js or Web Audio API for playback
├── Persistent bottom bar (like Spotify)
├── Queue management (play next, shuffle)
├── Waveform visualization (wavesurfer.js)
└── Integration with Frame v2 for cross-client embeds
```

---

## Key Takeaways for ZAO OS

- Frames v2 = inline audio players in feed. Essential.
- Start with Audius (free, full streaming) + Sound.xyz (music NFTs)
- Build a unified Track schema to normalize across sources
- Persistent audio player bar is a must (continues playing while scrolling)
- Curation-weighted feed using Respect tokens differentiates from Warpcast
