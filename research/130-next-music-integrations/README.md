# 130 — Next Music Integrations for ZAO OS

> **Status:** Research complete
> **Date:** March 25, 2026
> **Goal:** Map the next wave of music integrations now that Tiers 1-3 are complete — deeper platform APIs, music NFTs, Farcaster music sharing, and AI recommendations
> **Builds on:** Doc 128 (Complete Audit), Doc 126 (Gap Analysis), Doc 03 (Music Integration), Doc 108 (Music NFT Landscape)

---

## Key Decisions / Recommendations

| Integration | Priority | Recommendation |
|-------------|----------|----------------|
| **Spotify Web API** | HIGH | Use for playlist import, audio features (BPM/energy/valence), and recommendations. Requires Premium + app registration. Dev mode needs Premium as of Feb 2026. |
| **Audius SDK deeper** | HIGH | Already use REST API for radio/trending. Add: full SDK (`@audius/sdk`), user auth, playlist creation on Audius, upload support. Free, no limits. |
| **Farcaster Mini App music embed** | HIGH | ZAO tracks shared as rich embeds with inline playback. Use `fc:frame:audio` meta tags. Already a Farcaster app — just add embed metadata. |
| **AI Recommendations (pgvector)** | MEDIUM | Supabase already has pgvector. Store track embeddings (audio features → vectors), query for similarity. Cold-start problem with <100 members — use collaborative filtering on likes/reactions first. |
| **Zora Music NFTs on Base** | MEDIUM | Mint tracks as collectible NFTs. Zora API is free (<120 req/min). Base is ZAO's chain. "Collect this track" button on track cards. |
| **Shazam / Audio fingerprinting** | LOW | Cool but niche. Shazam API is paid. AcoustID/Chromaprint is open source but complex. |
| **Last.fm Scrobbling** | LOW | Scrobble plays to Last.fm for cross-platform listening history. Simple API, free. Nice-to-have. |

---

## 1. Spotify Web API (Deep Integration)

### What's Available (March 2026)

| Endpoint | What it gives ZAO | Auth needed |
|----------|-------------------|-------------|
| **Get Recommendations** | "If you like X, try Y" — seed up to 5 tracks/artists/genres | User OAuth |
| **Get Audio Features** | BPM, energy, danceability, valence, acousticness per track | App token |
| **Get Audio Analysis** | Detailed beat/segment/section data for visualizations | App token |
| **Get User's Playlists** | Import Spotify playlists into ZAO | User OAuth |
| **Search** | Find any track/artist/album on Spotify | App token |
| **Get User's Top Items** | User's most-played tracks/artists for taste profiling | User OAuth |

### February 2026 Changes

- **Dev Mode apps now require Spotify Premium** for the app owner
- Extended Quota Mode apps are unaffected
- Some endpoints deprecated or restricted in Dev Mode

### ZAO Implementation Plan

```
Phase 1: App-level auth (no user login needed)
  - Audio Features for taste profiling (BPM/energy/valence)
  - Search for Spotify track metadata enrichment
  - Recommendations seeded by community's most-liked tracks

Phase 2: User OAuth (optional Spotify connect)
  - Import user's Spotify playlists into ZAO
  - "Top tracks" for personalized recommendations
  - Listening history import
```

### Cost

Free for Dev Mode (25 users max). Extended Quota Mode requires application and review — no published pricing.

---

## 2. Audius SDK Deep Integration

### Current State in ZAO

- REST API calls to `api.audius.co/v1` for radio, trending, metadata
- No SDK installed, no user auth, no write operations

### What @audius/sdk Adds

```bash
npm install @audius/sdk
```

| Feature | What it enables |
|---------|----------------|
| **User auth** | Login with Audius account, access private playlists |
| **Upload tracks** | ZAO members upload directly to Audius (decentralized storage) |
| **Create playlists** | Programmatic playlist creation on Audius |
| **Social graph** | Follow/unfollow, repost, favorite — mirrored from ZAO actions |
| **Stream URLs** | Authenticated streaming (better quality, no rate limits) |
| **Notification hooks** | React to Audius events (new followers, reposts) |

### Why This Matters for ZAO

Audius is the only fully open, decentralized music platform. ZAO already uses it for radio. Deep integration means:
- ZAO members' music lives on Audius (permanent, censorship-resistant)
- Tracks uploaded via ZAO are automatically available across all Audius clients
- ZAO becomes an Audius "super-client" for music communities

### Free Tier

No limits, no API key required. Contact `api@audius.co` for dedicated support.

---

## 3. Farcaster Mini App Music Embeds

### Current State

ZAO is already a Farcaster app with SIWF auth. Music shared as plain URLs in casts.

### What to Add

Use Farcaster's embed specification to make music URLs render as rich playable cards:

```html
<!-- In page <head> for any /track/[id] route -->
<meta property="fc:frame" content="vNext" />
<meta property="fc:frame:image" content="{artworkUrl}" />
<meta property="fc:frame:audio" content="{streamUrl}" />
<meta property="fc:frame:audio:type" content="audio/mpeg" />
<meta property="fc:frame:button:1" content="Play on ZAO" />
<meta property="fc:frame:button:1:action" content="link" />
<meta property="fc:frame:button:1:target" content="https://zaoos.xyz/track/{id}" />
```

### Implementation

1. Create route: `/track/[id]/page.tsx` — public track page with OG + Frame meta tags
2. When a ZAO member shares a track URL, Farcaster clients render it as a playable card
3. Non-members see artwork + "Play on ZAO" button → drives signup

### Share Extensions

Mini Apps support share extensions — ZAO could appear in Warpcast's share sheet when sharing music links, redirecting into the ZAO player.

---

## 4. AI-Powered Recommendations (pgvector)

### Architecture

```
┌──────────────────────────────────────┐
│        Supabase (pgvector)           │
│                                      │
│  songs table + embedding column      │
│  (vector(128) for audio features)    │
│                                      │
│  user_taste_vectors table            │
│  (average of liked track embeddings) │
└──────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│     Recommendation Engine            │
│                                      │
│  1. Collaborative: "Users who liked  │
│     tracks you liked also liked..."  │
│                                      │
│  2. Content-based: cosine similarity │
│     between track embeddings         │
│                                      │
│  3. Hybrid: weighted blend           │
└──────────────────────────────────────┘
```

### Implementation Plan

**Phase 1: Collaborative filtering (no embeddings needed)**
- Query `user_song_likes`: find users with similar like patterns
- Recommend tracks liked by similar users but not by the current user
- Works immediately with existing data, no API calls

**Phase 2: Content-based with Spotify Audio Features**
- For each song, fetch audio features (BPM, energy, valence, danceability, etc.)
- Store as a vector in pgvector
- Compute user taste vector = average of their liked tracks' vectors
- Recommend tracks with highest cosine similarity to user's taste vector

**Phase 3: Semantic embeddings**
- Use Claude API or OpenAI to generate text embeddings from track metadata + user reviews
- Richer similarity signals beyond audio features

### Cold-Start Mitigation

100 members is small. Mitigations:
- Start with community-wide popularity (already built: respect-weighted trending)
- Use genre/platform clustering as fallback
- Require minimum 10 liked tracks before showing personal recommendations

### Supabase pgvector

Already available in ZAO's Supabase instance (doc 42 confirmed pgvector is enabled):

```sql
ALTER TABLE songs ADD COLUMN IF NOT EXISTS embedding vector(128);
CREATE INDEX ON songs USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);
```

---

## 5. Zora Music NFTs on Base

### Why Zora

- Base is ZAO's primary chain (Respect tokens on Optimism/Base)
- Zora API is free (<120 req/min, no key needed)
- "Every post is collectible" — Zora's philosophy aligns with ZAO's curation model
- $353M trading volume in Q2 2025

### Implementation

```
"Collect this track" button on track cards
  → Mints a Zora NFT on Base
  → Track metadata stored on-chain (title, artist, artwork IPFS hash)
  → Collector gets a token representing their support
  → Artist earns from primary + secondary sales
```

### API

```typescript
// Using Zora's Protocol SDK
import { createCreatorClient } from '@zoralabs/protocol-sdk';

const creatorClient = createCreatorClient({ chainId: 8453, publicClient }); // Base

// Create a new music collectible
const { parameters } = await creatorClient.create1155({
  contract: { name: 'ZAO Music', uri: metadataUri },
  token: { tokenMetadataURI: trackMetadataUri },
  account: artistAddress,
});
```

### Cost to User

- Mint fee: ~0.000777 ETH on Base (~$2 at current prices)
- Gas: negligible on Base (<$0.01)

---

## 6. Last.fm Scrobbling (Nice-to-Have)

### What It Is

Automatically log every track played on ZAO to the user's Last.fm profile.

### API

Free, requires API key (instant approval at last.fm/api):

```typescript
// Scrobble a track
POST https://ws.audioscrobbler.com/2.0/
  method=track.scrobble
  artist=...&track=...&timestamp=...
  api_key=...&sk={session_key}
```

### Implementation

- Add Last.fm connect to Settings (OAuth)
- On every play, fire-and-forget scrobble via API route
- Non-critical — silent failure OK

---

## Recommended Build Order (Tier 4)

| # | Feature | Effort | Dependencies |
|---|---------|--------|-------------|
| 1 | **Farcaster music embeds** | ~4 hrs | None — just meta tags on a /track/[id] route |
| 2 | **Audius SDK upgrade** | ~6 hrs | `npm install @audius/sdk` |
| 3 | **Collaborative filtering recs** | ~6 hrs | Existing like data, no new APIs |
| 4 | **Spotify Audio Features** | ~4 hrs | Spotify app registration + Premium |
| 5 | **Zora music collectibles** | ~8 hrs | Zora SDK, wallet connection (already have wagmi) |
| 6 | **pgvector taste embeddings** | ~6 hrs | Spotify Audio Features (Phase 2) |
| 7 | **Last.fm scrobbling** | ~3 hrs | Last.fm API key |

---

## Sources

- [Spotify Web API Reference](https://developer.spotify.com/documentation/web-api)
- [Spotify Feb 2026 Migration Guide](https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide)
- [Spotify March 2026 Changelog](https://developer.spotify.com/documentation/web-api/references/changes/march-2026)
- [Audius JavaScript SDK](https://docs.audius.org/sdk/)
- [Audius REST API](https://docs.audius.org/api/)
- [Farcaster Mini Apps Specification](https://miniapps.farcaster.xyz/docs/specification)
- [Farcaster Audio Frame Discussion](https://github.com/farcasterxyz/protocol/discussions/156)
- [Farcaster Share Extensions](https://miniapps.farcaster.xyz/docs/guides/share-extension)
- [Base Docs: Mint on Zora](https://docs.base.org/cookbook/use-case-guides/creator/nft-minting-with-zora)
- [Zora Protocol SDK Changelog](https://nft-docs.zora.co/changelogs/protocol-sdk)
- [pgvector 2026 Guide](https://www.instaclustr.com/education/vector-database/pgvector-key-features-tutorial-and-pros-and-cons-2026-guide/)
- [Doc 128 — Music Player Complete Audit](../128-music-player-complete-audit/)
- [Doc 42 — Supabase Advanced (pgvector)](../42-supabase-advanced-patterns/)
- [Doc 108 — Music NFT Landscape 2026](../108-music-nft-landscape-2026/)
