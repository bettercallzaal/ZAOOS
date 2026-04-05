# 156 — Pods.media & Podcast Tokenization: Can ZAO Clone It on Arweave?

> **Status:** Research complete
> **Date:** March 27, 2026
> **Goal:** Evaluate Pods.media's podcast tokenization model, determine if ZAO OS can build a superior version using our existing Arweave atomic asset stack

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Clone Pods.media?** | YES, but on Arweave instead of Base. We already have 90% of the stack from Doc 155's music NFT flow. Podcasts are just longer audio files. |
| **Chain** | Arweave atomic assets (NOT Base ERC-721 like Pods). Permanent storage, no IPFS, no pin maintenance. |
| **How it differs from Pods** | Pods stores audio on Arweave but mints on Base. ZAO does EVERYTHING on Arweave — audio + contract + license in one atomic asset. Simpler, cheaper, truly permanent. |
| **Revenue model** | UDL licensing (Doc 153) — artists set royalties/commercial terms per episode. UCM orderbook for trading. No platform cut needed. |
| **Effort to build** | ~1 week incremental on top of Doc 155's music NFT flow. Same upload, same mint, same buy — just add podcast-specific metadata (show, episode number, RSS). |
| **Fork Pods code?** | NO — Pods is closed-source. But their model is simple: upload audio → mint → collect. We already built this in Doc 155. |

---

## Part 1: What Pods.media Actually Is

### The Platform (Still Active as of March 2026)

Pods.media is NOT defunct — it's actively operating with significant traction:

| Metric | Value |
|--------|-------|
| **Total mints** | 900,000+ |
| **Unique wallets** | 109,000+ |
| **Shows** | 70+ |
| **Episodes** | 945+ |
| **Total revenue** | $1M+ |
| **Revenue growth** | 175x in 8 months ($800/mo → $140K/mo) |
| **Chain** | Base (ERC-721) |
| **Audio storage** | Arweave |
| **Team** | 2-10 employees, Lucas Campbell is public representative |

### How Pods Works

```
CREATOR FLOW:
1. Host uploads podcast episode (audio file)
2. Audio stored permanently on Arweave
3. ERC-721 NFT minted on Base (metadata points to Arweave audio)
4. Episode appears on pods.media with "Collect" button
5. Free or paid mints — creator sets price

LISTENER FLOW:
1. Browse shows on pods.media or discover via Farcaster
2. Listen for free (streaming from Arweave)
3. "Collect" an episode (mints ERC-721 on Base)
4. Collectors get: proof of fandom, early access, community perks
5. Share & Earn: referral link pays ETH on referred collects

REVENUE:
- Creator sets price (free or paid)
- Pods takes a platform fee (% not publicly disclosed)
- "Share & Earn" referral payouts in ETH
- Concentration risk: top show (Mint Podcast) = 49% of all revenue ($448K)
```

### Pods Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js |
| Data fetching | TanStack Query |
| Social | Neynar (Farcaster integration) |
| Chain | Base (Chain ID 8453) |
| Contract | ERC-721 at `0x3c9217dd4f9ed4492cc068b1b686460fac0ffeac` |
| Audio storage | Arweave |
| Source code | **Closed source** — no GitHub repo available |

### Farcaster Integration

Deeply connected to Farcaster ecosystem:
- Hosts **GM Farcaster** (80+ builder interviews)
- Hosts **Coop Records** podcast
- Uses Neynar for social features
- Episodes shareable as Farcaster casts
- Discovery via Farcaster social graph

---

## Part 2: Why ZAO's Arweave Approach Is Better

### Pods.media Architecture (Current)

```
┌──────────────┐     ┌──────────────┐
│ Base ERC-721 │ ──► │ Arweave Audio │
│ (ownership)  │     │ (storage)     │
└──────────────┘     └──────────────┘
  Two chains. Token on Base, audio on Arweave.
  If the contract breaks, ownership is gone.
  Audio survives, but who owns it?
```

### ZAO OS Architecture (Proposed — from Docs 152/153/155)

```
┌─────────────────────────────────────────────┐
│           ONE Arweave Atomic Asset           │
│                                              │
│  Data:      The podcast audio (MP3/MP4)      │
│  Tags:      Show, episode #, host, guests    │
│  Contract:  AO process (ownership, trading)  │
│  License:   UDL (royalties, commercial)      │
│  RSS:       Episode metadata for feeds       │
│                                              │
│  ALL permanent. ALL in one tx ID.            │
│  No Base. No IPFS. No split architecture.    │
└─────────────────────────────────────────────┘
```

### Comparison

| Feature | Pods.media | ZAO Arweave Clone |
|---------|-----------|-------------------|
| **Audio storage** | Arweave | Arweave |
| **Ownership** | Base ERC-721 | Arweave atomic asset (AO process) |
| **Architecture** | Split (2 chains) | Unified (1 chain) |
| **License enforcement** | None (standard NFT) | UDL — royalties hard-coded |
| **Marketplace** | pods.media only | BazAR/UCM + ZAO OS + any Arweave app |
| **Platform fee** | Pods takes a cut | 0% — direct creator-to-collector |
| **Upload cost** | Free (Pods covers) | ~$0.04-$0.50/episode via ArDrive Turbo (fiat OK) |
| **Referral system** | Share & Earn (ETH) | Could build with AO process |
| **Farcaster integration** | Yes (Neynar) | Yes (Neynar — already built in ZAO OS) |
| **RSS feed** | Generated by Pods | Generated from Arweave tags via GraphQL |
| **Open source** | No | Yes (ZAO OS is MIT) |
| **Permanence** | Audio permanent, contract on Base (not permanent) | Everything permanent |

---

## Part 3: How to Build It

### What We Already Have (from Doc 155)

Doc 155 designed the complete music NFT flow: **Upload → Mint → Buy**. Podcasts use the EXACT same flow with extended metadata.

**Existing components that work as-is:**
- `ArDrive Turbo SDK` upload pipeline (Doc 152/155)
- Atomic asset minting with AO process (Doc 153/155)
- UDL license presets (Doc 153/155)
- Arweave Wallet Kit for collectors (Doc 155)
- BazAR/UCM listing (Doc 153)

### What's New for Podcasts

Only the **metadata tags** and **UI** change. The underlying tech is identical.

#### New Arweave Tags for Podcast Episodes

```typescript
// Podcast-specific tags (added to standard atomic asset tags)
const podcastTags = [
  // Standard atomic asset tags (from Doc 155)
  { name: 'Content-Type', value: 'audio/mpeg' },
  { name: 'Title', value: 'Episode 42: The Future of Music DAOs' },
  { name: 'Creator', value: 'wallet-address' },

  // Podcast-specific tags
  { name: 'Type', value: 'podcast-episode' },          // distinguishes from music
  { name: 'Show-Name', value: 'ZAO Radio' },            // show title
  { name: 'Show-Id', value: 'arweave-show-tx-id' },     // links to show entity
  { name: 'Episode-Number', value: '42' },               // ordering
  { name: 'Season', value: '2' },                        // optional
  { name: 'Host', value: 'bettercallzaal' },             // Farcaster username
  { name: 'Guests', value: 'dansingjoy,tadas' },        // comma-separated
  { name: 'Duration', value: '3420' },                   // seconds
  { name: 'Description', value: 'In this episode...' },  // show notes
  { name: 'Published-At', value: '2026-03-27T00:00:00Z' },
  { name: 'Community', value: 'zao' },                   // for discovery

  // UDL license (from Doc 153)
  { name: 'License', value: 'dE0rmDfl9_OWjkDznNEXHaSO_JohJkRolvMzaCroUdw' },
  { name: 'Commercial-Use', value: 'Allowed' },
  { name: 'Derivation', value: 'Allowed-With-Credit' },
];
```

#### New "Show" Entity (Parent of Episodes)

A show is itself an atomic asset — a metadata-only tx that groups episodes:

```typescript
const showTags = [
  { name: 'Type', value: 'podcast-show' },
  { name: 'Title', value: 'ZAO Radio' },
  { name: 'Description', value: 'The ZAO community podcast...' },
  { name: 'Host', value: 'bettercallzaal' },
  { name: 'Cover-Image', value: 'arweave-cover-tx-id' },
  { name: 'Community', value: 'zao' },
  { name: 'RSS-Enabled', value: 'true' },
];
```

Episodes link to shows via `Show-Id` tag. Query all episodes of a show:

```graphql
query {
  transactions(tags: [
    { name: "Type", values: ["podcast-episode"] },
    { name: "Show-Id", values: ["show-tx-id"] }
  ], sort: HEIGHT_DESC) {
    edges { node { id, tags { name, value } } }
  }
}
```

#### RSS Feed Generation (from Arweave Tags)

Build a serverless RSS feed from Arweave GraphQL — no database needed:

```typescript
// src/app/api/podcasts/[showId]/rss/route.ts
export async function GET(request: NextRequest, { params }: { params: { showId: string } }) {
  // Query Arweave for all episodes of this show
  const episodes = await queryArweave({
    tags: [
      { name: 'Type', values: ['podcast-episode'] },
      { name: 'Show-Id', values: [params.showId] },
    ],
  });

  // Generate RSS 2.0 XML
  const rss = generateRSS({
    title: show.title,
    description: show.description,
    episodes: episodes.map(ep => ({
      title: getTag(ep, 'Title'),
      enclosure: `https://arweave.net/${ep.id}`,  // direct audio URL
      duration: getTag(ep, 'Duration'),
      pubDate: getTag(ep, 'Published-At'),
      description: getTag(ep, 'Description'),
    })),
  });

  return new Response(rss, { headers: { 'Content-Type': 'application/rss+xml' } });
}
```

This means any podcast app (Apple Podcasts, Spotify, Fountain) can subscribe to ZAO shows via standard RSS — but the audio is permanently on Arweave and episodes are collectible.

### New Files Needed

| File | Purpose |
|------|---------|
| `src/app/api/podcasts/upload/route.ts` | Upload episode to Arweave (reuses music upload) |
| `src/app/api/podcasts/shows/route.ts` | CRUD for shows (Arweave + Supabase cache) |
| `src/app/api/podcasts/[showId]/episodes/route.ts` | List episodes for a show |
| `src/app/api/podcasts/[showId]/rss/route.ts` | Generate RSS feed from Arweave |
| `src/components/podcasts/ShowCard.tsx` | Show display card |
| `src/components/podcasts/EpisodeCard.tsx` | Episode with collect button |
| `src/components/podcasts/UploadEpisode.tsx` | Upload form (extends music upload) |
| `src/components/podcasts/PodcastPlayer.tsx` | Extended player with show notes, chapters |

### Supabase Cache Tables

```sql
-- Cache show metadata (source of truth: Arweave)
CREATE TABLE podcast_shows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arweave_tx_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  host_fid BIGINT REFERENCES users(fid),
  cover_image_tx TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cache episode metadata (source of truth: Arweave)
CREATE TABLE podcast_episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arweave_tx_id TEXT UNIQUE NOT NULL,
  show_id UUID REFERENCES podcast_shows(id),
  title TEXT NOT NULL,
  episode_number INT,
  season INT,
  duration_seconds INT,
  description TEXT,
  guests TEXT[],
  collect_count INT DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE podcast_shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE podcast_episodes ENABLE ROW LEVEL SECURITY;
```

---

## Part 4: Competitive Landscape

### Active Podcast Tokenization Platforms (March 2026)

| Platform | Chain | Model | Status | Revenue |
|----------|-------|-------|--------|---------|
| **Pods.media** | Base | ERC-721 + Arweave audio | Active | $1M+ |
| **Fountain.fm** | Bitcoin Lightning | Micropayments per minute | Active | 4M+ podcast library |
| **Podping** | Hive blockchain | RSS update protocol (not tokenization) | Active | ~45s update latency |
| **Nina Protocol** | Solana + Arweave | Music only (no podcasts) | Active | Open source |
| **Sound.xyz** | Base | Music only | **Dead** (Jan 2026) | Pivoted to Vault |

### What ZAO's Version Adds That Nobody Has

1. **Respect-weighted curation** — high-Respect members' collects surface episodes higher (ZAO exclusive, already built for music)
2. **Farcaster-native discovery** — episodes as casts in /zao channel, not just a separate app
3. **Permanent RSS** — RSS feeds generated from Arweave, not a server that can go down
4. **UDL licensing** — creators control commercial use, derivatives, royalties per episode
5. **Community governance** — ZOUNZ DAO can fund podcast production via proposals
6. **Cross-platform publishing** — episodes auto-cast to Farcaster + Bluesky + X (already built)
7. **Open source** — unlike Pods (closed), ZAO is MIT-licensed. Any community can fork.

---

## Part 5: Implementation Estimate

| Phase | Work | Time |
|-------|------|------|
| **1. Show entity** | Create show atomic asset, Supabase cache, CRUD routes | 1 day |
| **2. Episode upload** | Extend Doc 155 music upload with podcast tags | 1 day |
| **3. Episode player** | PodcastPlayer with show notes, chapters, collect | 1 day |
| **4. RSS generation** | Arweave GraphQL → RSS 2.0 endpoint | 0.5 days |
| **5. Discovery UI** | ShowCard, EpisodeCard, podcast section on Music page | 1 day |
| **6. Collect flow** | Reuse Doc 155 buy flow with podcast-specific UX | 0.5 days |
| **Total** | | **~5 days** |

This assumes Doc 155's music NFT flow is already built. If not, add that time first (~52 hours from Doc 155).

---

## Part 6: What We'd Skip (vs Pods)

| Pods Feature | ZAO Decision | Why |
|---|---|---|
| **Share & Earn referrals** | Skip for v1 | Nice-to-have, not core. Can add later via AO process. |
| **Base ERC-721** | Replace with atomic assets | Simpler, cheaper, more permanent. |
| **Platform fee** | No fee | ZAO is a community, not a business. Creators keep 100%. |
| **Hosted player on pods.media** | Build into ZAO OS + RSS | Episodes playable in ZAO OS, any podcast app, or directly from Arweave. |
| **Centralized show management** | Arweave tags + Supabase cache | Source of truth is Arweave. Supabase is just a fast cache. |

---

## Sources

- [Pods.media](https://pods.media) — active podcast collectibles platform
- [Pods Dune Dashboard](https://dune.com/queries/pods-media) — on-chain analytics
- [BazAR Marketplace](https://bazar.arweave.net/) — Arweave atomic asset exchange
- [ArDrive Turbo SDK](https://github.com/ardriveapp/turbo-sdk) — upload tool
- [UDL Specification](https://arwiki.wiki/#/en/Universal-Data-License-How-to-use-it) — licensing
- [Fountain.fm](https://fountain.fm) — Bitcoin Lightning podcast app
- [Nina Protocol](https://ninaprotocol.com) — Solana + Arweave music publishing
- [Podping](https://podping.org) — Hive-based RSS update protocol
- [Doc 152 — Arweave Ecosystem Deep Dive](../../music/152-arweave-ecosystem-deep-dive/)
- [Doc 153 — BazAR & Atomic Assets](../../music/153-bazar-arweave-atomic-assets-music/)
- [Doc 155 — Music NFT E2E Implementation](../../music/155-music-nft-end-to-end-implementation/)
