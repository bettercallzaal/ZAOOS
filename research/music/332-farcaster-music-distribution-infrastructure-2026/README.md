# 332 - Music Distribution Infrastructure on Farcaster & Web3 (April 2026)

> **Status:** Research complete
> **Date:** April 11, 2026
> **Goal:** Map the entire music distribution landscape on Farcaster and web3, identify what exists, what's dead, and where ZAO can build first

## Executive Summary

The music distribution infrastructure on Farcaster is **nearly nonexistent**. Despite a mature NFT minting stack (Zora, Base, 0xSplits), a permanent storage layer (Arweave), and a rich mini app framework, **nobody has built a proper end-to-end music distribution pipeline on Farcaster**. Pods.media proved the model works for podcasts ($1M+ in mints, 120K collectors) but no equivalent exists for music. This is ZAO's opening.

---

## Part 1: Platform Status Report (April 2026)

### Sound.xyz - DEAD

- **Status:** Shut down January 16, 2026
- Sound.xyz went offline, redirecting to a thank-you page with a link to 0xSplits for artists to claim remaining funds
- The team pivoted entirely to Vault.fm
- Sound processed significant music NFT volume during its active years and was the highest-profile music NFT platform
- Their Farcaster channels (genre-specific discovery) are no longer active
- **Lesson:** Pure music NFT marketplaces without sustainable revenue models struggle to survive

**Source:** [Sound.xyz Sunsetting Announcement](https://paragraph.com/@soundxyz/sunsetting-sound)

### Vault.fm - ACTIVE (Sound.xyz successor)

- **Status:** Active, same parent company as Sound.xyz
- **Model:** Artist-to-fan subscription platform ($5/month per artist)
- **Features:** Upload songs/videos/images, fan access via email/phone, artist analytics, direct fan communication via text/email, private group chat
- **Key difference from Sound:** No NFTs, no blockchain - pure subscription/fan club model
- **Farcaster integration:** None apparent
- **Relevance to ZAO:** Competitor in the "direct artist-to-fan" space but completely different approach (centralized subscriptions vs. on-chain distribution)
- James Blake is the marquee artist/co-founder

**Source:** [Vault.fm](https://vault.fm/), [Water & Music analysis](https://www.waterandmusic.com/james-blake-vault-artist-subscriptions-save-music/)

### Catalog.works - ACTIVE (niche)

- **Status:** Active, still curated/invite-only
- **Model:** 1/1 music NFTs on Ethereum (collector-focused, high-value)
- **Zero fees** to artists on primary sales, EIP-2981 secondary royalties
- **New in 2026:** Launched a music licensing marketplace with 30,000+ tracks from 1,800+ artists and 60 imprints - targeting the $1.3B stock sync industry
- **Chain:** Ethereum mainnet (expensive, but 1/1s justify gas)
- **Farcaster integration:** None
- **Relevance to ZAO:** Good for ZAO artists making premium 1/1 drops, but not for community-wide distribution. The licensing marketplace pivot is interesting - ZAO could build a similar sync licensing layer.

**Source:** [Catalog](https://catalog.works/), [Platform & Stream article](https://medium.com/platform-stream/catalog-reclaims-billion-dollar-music-licensing-industry-for-culturally-vital-artists-73da28a52ebb)

### Mint Songs - ACTIVE (low activity)

- **Status:** Active on Polygon, but low volume
- **Model:** Free minting, 95-97% to artist, 3-5% platform fee
- **Chain:** Polygon (cheap gas)
- **Farcaster integration:** None
- **Relevance to ZAO:** Proves free minting attracts artists, but Polygon is not where ZAO's ecosystem lives (Base/Optimism)

**Source:** [Mint Songs on OpenSea](https://opensea.io/MintSongs-Collection)

### Zora - ACTIVE (primary recommendation)

- **Status:** Very active, evolved into "Media Layer" of blockchain
- **Model:** Open minting + secondary markets via Uniswap
- **Chain:** Base (primary), Zora L2, Ethereum, Optimism, Arbitrum, Solana (attention markets)
- **Music support:** Audio upload supported in ERC-1155 editions
- **Costs:** ~0.000777 ETH (~$1.40) mint fee on Base, essentially gasless for users in 2026
- **2026 evolution:** "Attention Markets" on Solana where editions represent cultural trends
- **Protocol SDK:** `@zoralabs/protocol-sdk` with `create1155` for multi-edition music collectibles
- **Farcaster integration:** Zora links auto-embed in Farcaster clients, mini app minting possible
- **Key feature:** `ZoraTimedSaleStrategyMinter` - after primary sale completes, a Uniswap-powered secondary market automatically begins

**Source:** [Zora Protocol SDK](https://docs.zora.co/protocol-sdk/introduction), [Base Docs: Minting with Zora](https://docs.base.org/cookbook/use-case-guides/creator/nft-minting-with-zora)

### Audius - ACTIVE (separate ecosystem)

- **Status:** Active, 250M+ streams
- **Chain:** Solana/Ethereum hybrid
- **Farcaster integration:** None found
- **Relevance to ZAO:** Audius is a streaming platform, not a distribution/minting platform. ZAO's player already supports Audius URLs. No integration pathway with Farcaster.

**Source:** [Audius](https://audius.co/)

### 0xSplits - ACTIVE (critical infrastructure)

- **Status:** Active, $500M+ processed lifetime
- **Chain:** Full support on Base, Optimism, Ethereum, Arbitrum, Zora, World Chain
- **Key stats:** 6,000+ splits on Zora L2 alone
- **Clients included:** Sound.xyz (before shutdown), Songcamp, Catalog, Zora
- **ZAO integration:** Already researched in Doc 143. Immutable splits with 80/10/10 (artist/treasury/curator) model ready to implement.

**Source:** [0xSplits SDK](https://docs.splits.org/sdk), [Splits + Zora Integration](https://splits.org/blog/zora-integration/)

---

## Part 2: Base Chain - The Right Chain for Music NFTs

### Why Base Wins for ZAO Music Distribution

| Factor | Base | Ethereum | Polygon | Solana |
|--------|------|----------|---------|--------|
| **Gas cost** | ~$0.01-0.05 per tx | ~$2.90 | ~$0.003 | ~$0.005 |
| **Zora support** | Full | Full | No | Attention markets only |
| **0xSplits support** | Full | Full | No | No |
| **ZOUNZ DAO** | Lives here | No | No | No |
| **Coinbase ecosystem** | Native | Bridge needed | Bridge needed | Bridge needed |
| **User base** | Large, growing fast | Largest but expensive | Shrinking | Large but different ecosystem |
| **ERC-1155 music** | Cheapest viable option | Too expensive for editions | Cheap but no Zora | Different standard |

### Base-Specific Advantages
- **Same chain as ZOUNZ** - no bridging needed between governance and music NFTs
- **Coinbase onramp** - fiat-to-crypto for non-crypto users
- **OP Superchain** - interoperable with Optimism (where Respect tokens live)
- **Gasless minting** - many 2026 mints are essentially free for end users
- **Deep liquidity** - large consumer user base from Coinbase

---

## Part 3: Farcaster Frames / Mini Apps for Music

### Current Farcaster Embed Capabilities

Farcaster casts can embed URLs that clients render based on content type:

1. **Images** - Auto-displayed inline
2. **Videos** - Must be `.m3u8` streaming format (not raw .mp4), rendered via video player
3. **Mini Apps** - Full web apps in an in-app browser modal (OpenGraph-inspired 3:2 preview in feed)
4. **Article links** - OpenGraph previews
5. **Audio** - **NOT explicitly supported as a native embed type**

**Critical finding:** There is NO native audio player embed in Farcaster. Videos work (via HLS streaming), but raw audio files or audio players are not a first-class embed type. This is a gap.

### Mini Apps (formerly Frames v2)

Mini Apps are the path forward for music on Farcaster:

- **Full web apps** rendered in a vertical modal inside Farcaster clients
- **Wallet connectivity** - direct Ethereum (EIP-1193) and experimental Solana provider
- **Transaction prompts** - swap tokens, send tokens, mint NFTs
- **Notifications** - title (32 chars), body (128 chars), 1 per 30 seconds, 100 per day per user
- **Persistent** - users can save mini apps, turn on notifications
- **Minimizable** - users can keep scrolling while the mini app runs in foreground (2026 feature)
- **Context-aware** - access user identity, cast origins, wallet data

**The minimization feature is key for music:** A user could start playing a track in a mini app, minimize it, and continue scrolling Farcaster while listening. This is the "listen and collect" pattern.

### Pods.media - The Proof of Concept

Pods.media is the closest existing model to what ZAO should build:

- **What it does:** Podcast episodes as collectible NFTs on Farcaster
- **Stats:** 75+ podcasts, $1M+ in mints, 120,000 collectors
- **Mini App:** Click to play podcast, collect as NFT, claim referral rewards
- **Minimization:** Listen to a Pods episode while scrolling (uses Farcaster's minimize feature)
- **Revenue model:** Creators earn from NFT mints, referral system for growth

**What Pods proves:** The "listen + collect" model works on Farcaster. But Pods is podcast-only. **Nobody has built the music equivalent.**

---

## Part 4: How to Build "Listen and Collect" on Farcaster

### The Architecture

```
Artist uploads track to ZAO OS
    |
    v
1. Audio stored permanently on Arweave (via ArDrive Turbo, ~$0.04)
    |
    v
2. Music NFT minted on Base (via Zora create1155, ~$0.05)
   - payoutRecipient = 0xSplits contract (80/10/10)
   - tokenURI = Arweave metadata
   - animation_url = Arweave audio URL
    |
    v
3. Cast published to Farcaster with Mini App embed
   - 3:2 preview image (album art + play button overlay)
   - "Listen & Collect" launch button
    |
    v
4. Fan taps cast in feed
   - Mini App opens: audio player + collect button
   - Fan listens (streaming from Arweave via ar.io gateway)
   - Fan taps "Collect" - wallet prompt, Base tx, NFT minted
   - Fan minimizes mini app, keeps listening while scrolling
    |
    v
5. Revenue auto-splits via 0xSplits
   - 80% to artist wallet
   - 10% to ZAO treasury
   - 10% to curator who shared it
```

### Key Technical Components

| Component | Tool | Status |
|-----------|------|--------|
| Audio storage | Arweave via ArDrive Turbo | Ready (Doc 152) |
| NFT minting | Zora Protocol SDK on Base | Ready (Doc 141) |
| Revenue splits | 0xSplits on Base | Ready (Doc 143) |
| Farcaster embed | Mini App (fc:miniapp meta tags) | Needs building |
| Audio player | Web Audio API / HTML5 audio | Exists in ZAO OS |
| Wallet connection | EIP-1193 via Mini App SDK | Available |
| Cast publishing | Neynar SDK | Exists in ZAO OS |

### Mini App Implementation

```typescript
// Farcaster Mini App metadata (in <head>)
<meta name="fc:miniapp" content="..." />
<meta property="og:image" content="https://arweave.net/{coverTxId}" />
<meta property="og:title" content="Track Title - Artist Name" />
<meta property="fc:miniapp:splash_background_color" content="#0a1628" />

// Mini App renders:
// 1. Album art
// 2. Audio player (streaming from Arweave)
// 3. "Collect" button (Zora mint on Base)
// 4. Collector count + price
// 5. Artist info + link to profile
```

---

## Part 5: Revenue Models for On-Chain Music

### What's Working in 2026

| Model | Revenue Range | Best For | Platform |
|-------|--------------|----------|----------|
| **Limited editions** (100-1000 copies, $10-100) | $1K-$100K per drop | Artists with engaged fanbase | Zora on Base |
| **Open editions** (unlimited, $1-5) | Variable, volume-dependent | Discovery + viral moments | Zora on Base |
| **1/1 auctions** | $500-$50K+ | Premium/established artists | Catalog on Ethereum |
| **Subscription** ($5/mo) | Recurring | Artists with deep catalog | Vault.fm |
| **Royalty participation** (10-50% of streaming) | Ongoing micro-payments | Innovative fan engagement | Custom smart contracts |
| **Access/membership** (NFT = access token) | $20-$200 per member | Community-focused artists | Custom ERC-721/1155 |
| **Sync licensing** (film/TV/games) | $500-$50K per placement | Catalog-style curation | Catalog licensing marketplace |

### ZAO's Recommended Revenue Stack

```
Tier 1: FREE LISTEN (default)
  - All ZAO music playable for free in ZAO OS
  - Arweave-stored, permanent
  - No blockchain interaction needed to listen

Tier 2: COLLECT ($1-5 per edition)
  - Open edition ERC-1155 on Base via Zora
  - "Collect" = own a copy of the track as NFT
  - Revenue auto-splits: 80% artist / 10% treasury / 10% curator
  - Shows collector count ("42 collected")

Tier 3: LIMITED DROP ($10-100, 50-500 editions)
  - Limited edition with countdown timer
  - Scarcity drives higher price
  - Same 0xSplits revenue flow

Tier 4: RESPECT-GATED PREMIUM
  - Tracks only playable by members with Respect score > threshold
  - ZAO-native gating using existing Respect system
  - Artist sets minimum Respect to access
```

### 0xSplits Integration Detail

```typescript
// Default split for every ZAO music release
const ZAO_SPLIT = {
  recipients: [
    { address: artistWallet, percentAllocation: 80.0 },
    { address: ZAO_TREASURY, percentAllocation: 10.0 },
    { address: curatorWallet, percentAllocation: 10.0 },
  ],
  distributorFeePercent: 0, // Anyone can trigger distribution
};

// Advanced: Collaboration splits
const COLLAB_SPLIT = {
  recipients: [
    { address: artist1, percentAllocation: 35.0 },
    { address: artist2, percentAllocation: 35.0 },
    { address: producer, percentAllocation: 10.0 },
    { address: ZAO_TREASURY, percentAllocation: 10.0 },
    { address: curatorWallet, percentAllocation: 10.0 },
  ],
};

// Advanced: Waterfall (recoup model)
// ZAO Treasury funds a release, recoups first, then standard split
// Treasury gets first 0.5 ETH, then 80/10/10 after recoup
```

---

## Part 6: Permanent Storage - Arweave vs IPFS

### 2026 Storage Comparison

| Factor | Arweave (via ArDrive Turbo) | IPFS (via Pinata) |
|--------|---------------------------|-------------------|
| **Model** | Pay once, stored 200+ years | Monthly subscription, files can disappear |
| **Cost per 5MB MP3** | ~$0.04 one-time | ~$0.02/month ongoing |
| **Year 1 cost (600 tracks)** | $20.40 total | $24 ($2/month) |
| **Year 3 cost** | $20.40 (same, one-time) | $72 (and rising) |
| **Permanence** | Guaranteed by endowment model | Files disappear if you stop paying |
| **Fiat payments** | Yes (Stripe via Turbo Credits) | Yes |
| **Streaming** | Direct URL: `https://arweave.net/{txId}` | Via gateway URL |
| **CDN** | ar.io Wayfinder (decentralized multi-gateway) | Pinata gateway |
| **EU compliance** | Need second storage for redundancy | Need second storage |

### Recommendation: Arweave Primary + IPFS Secondary

1. **Primary:** ArDrive Turbo to Arweave - permanent, pay once
2. **Secondary:** Pin to IPFS via Pinata for redundancy and faster initial access
3. **CDN:** ar.io Wayfinder for decentralized delivery to the audio player
4. **Budget:** ~$20/year for 600 tracks (Arweave) + ~$5/month for IPFS pin (optional)

---

## Part 7: Farcaster Music Ecosystem Map

### Active Music Channels

| Channel | Focus | Activity |
|---------|-------|----------|
| `/music` | General music discussion | Active |
| `/sounds` | Music discovery, community playlists | Active ("Farcaster Sounds Vol. I" playlist) |
| `/onchainmusic` | On-chain music NFTs | Niche but active |
| `/bass` | Bass music | Small |
| `/hiphop` | Hip hop | Small |

### Music-Adjacent Tools on Farcaster

| Tool | What It Does | Music-Specific? |
|------|-------------|-----------------|
| **Pods.media** | Podcast NFTs + mini app player | Podcasts only, not music |
| **Zora** | NFT minting (supports audio) | General, not music-focused |
| **Paragraph** | Web3 newsletters (token-gated) | Can bundle music drops with newsletters |
| **NiftyKit** | No-code NFT minting on Frames | General NFTs, not music |
| **Highlight.xyz** | Smart contract minting toolkit | General NFTs, not music |
| **Crossmint** | Frame-based NFT minting | General NFTs, not music |

### Paragraph + Music Integration

Paragraph (which acquired Mirror) offers:
- Token-gated newsletters for ZAO members
- NFT drops alongside newsletter content
- Farcaster-native publishing (posts appear in feed)
- Potential pattern: "Weekly ZAO music drop" newsletter with embedded collect links
- Mature Web3 publishing platform, default for crypto-native writing in 2026

---

## Part 8: Case Studies and Revenue Data

### Independent Artists on Music NFTs (2026)

- **Independent artists command 65%** of all primary music NFT sales (reversed from major label dominance in traditional streaming)
- **Crypto-native artists:** $1K-$50K per drop consistently
- **Traditional audience crossover:** $500-$5K per drop more realistic
- **Example benchmark:** Artist with 50K followers, 500-edition NFT at $25 = $12,500 per release

### Pods.media (Farcaster-native, closest analog)

- 75+ podcasts onboarded
- $1M+ in podcast episode mints
- 120,000 collectors
- Proved "listen + collect" works in Farcaster mini apps

### Key Insight: Education and Onboarding Remain the Biggest Barriers

The #1 reason music NFTs haven't gone mainstream is friction:
- Wallet setup
- Understanding what "minting" means
- Converting fiat to crypto
- Why would I buy an MP3 I can stream for free?

**ZAO advantage:** The 188 members are already crypto-native Farcaster users with wallets. The onboarding friction that kills mainstream music NFT adoption doesn't apply to ZAO's audience.

---

## Part 9: The Opportunity Gap - What ZAO Can Build First

### What Exists

1. Minting infrastructure (Zora)
2. Revenue splitting (0xSplits)
3. Permanent storage (Arweave)
4. Farcaster mini app framework
5. Podcast "listen + collect" (Pods.media)
6. General NFT minting frames (NiftyKit, Crossmint, Highlight)
7. Newsletter + drops (Paragraph)

### What Does NOT Exist (The Gaps)

| Gap | Description | Difficulty | ZAO Advantage |
|-----|-------------|------------|---------------|
| **1. Music Mini App** | A Pods.media equivalent for music - listen + collect in-feed on Farcaster | Medium | ZAO already has a 9-platform music player |
| **2. Farcaster-native music distribution** | Upload track, auto-mint on Base, auto-publish as cast with mini app embed | Hard | ZAO has Neynar SDK, Zora research, Arweave research |
| **3. Community-curated music feed** | Respect-weighted curation surfacing the best tracks, on-chain | Medium | ZAO has Respect system, curation weights (Doc 130) |
| **4. On-chain music licensing** | Catalog-style sync licensing but decentralized, community-governed | Hard | ZAO governance + artist roster |
| **5. Collaborative splits UI** | Easy UI for multiple artists to configure revenue splits before minting | Easy | 0xSplits SDK ready, just needs UI |
| **6. Artist earnings dashboard** | Real-time view of NFT revenue, split distributions, collector analytics | Medium | Supabase + 0xSplits API |
| **7. Cross-platform music drop** | Mint on Base + auto-cast to Farcaster + auto-post to X/Bluesky with collect link | Medium | ZAO has cross-platform publishing (Doc 141 architecture) |
| **8. Music radio as collectible stream** | Live radio where every track played is collectible in real-time | Hard | ZAO has radio/player infrastructure |
| **9. Farcaster audio embed standard** | Proper `<audio>` embed type for Farcaster (like video has HLS) | Very Hard | Would need Farcaster protocol contribution |

### The #1 Opportunity: "Pods for Music"

**What it is:** A Farcaster Mini App that lets artists upload music, mint on Base via Zora, and share as a cast where fans can listen and collect in one tap.

**Why nobody has built it:**
- Sound.xyz died before Farcaster mini apps matured
- Pods.media focused on podcasts, not music
- General NFT tools (NiftyKit, Crossmint) don't have audio players
- Farcaster's audio embed support is underdeveloped

**Why ZAO can build it:**
- 9-platform music player already exists
- Neynar SDK for Farcaster publishing already integrated
- Arweave research done (Doc 152, 155)
- Zora + 0xSplits research done (Doc 141, 143)
- 188 crypto-native members ready to use it day one
- Community governance (ZOUNZ) can fund development

**The moat:** Being first means setting the standard. If ZAO's mini app becomes the default way to share music on Farcaster, every music artist joining Farcaster will use ZAO's tool - even non-members.

---

## Part 10: Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [ ] Implement ArDrive Turbo upload (`src/lib/music/arweave.ts`)
- [ ] Implement Zora create1155 for music (`src/lib/music/zora.ts`)
- [ ] Implement 0xSplits integration (`src/lib/music/splits.ts`)
- [ ] Create `arweave_assets` + `arweave_collections` tables
- [ ] Test: upload MP3 to Arweave, mint on Base, verify split

### Phase 2: Mint UI in ZAO OS (Weeks 2-3)
- [ ] Build `MintTrack.tsx` 3-screen wizard (upload, price/license, confirm)
- [ ] Build `CollectButton.tsx` for track cards
- [ ] Build `LicensePicker.tsx` (UDL presets)
- [ ] Add ArweaveProvider for collector wallets
- [ ] Test: full mint-to-collect flow within ZAO OS

### Phase 3: Farcaster Mini App (Weeks 3-5)
- [ ] Build standalone mini app: `/mini/music/[trackId]`
- [ ] Implement `fc:miniapp` meta tags for feed preview
- [ ] Audio player with Arweave streaming
- [ ] Collect button with Base wallet transaction
- [ ] Auto-publish cast with mini app embed after minting
- [ ] Test: cast appears in Farcaster, tap to listen, collect in one click

### Phase 4: Revenue Dashboard (Week 5)
- [ ] Artist earnings page (per-track revenue, split history)
- [ ] ZAO Treasury music revenue view
- [ ] Collector analytics (who collected what)

### Phase 5: Growth (Ongoing)
- [ ] Cross-platform publishing (auto-post to X/Bluesky with collect link)
- [ ] Paragraph integration (newsletter + music drop bundles)
- [ ] Community curation feed (Respect-weighted trending)
- [ ] Open the mini app to non-ZAO artists (growth play)

### Cost Estimate

| Item | One-Time | Monthly |
|------|----------|---------|
| Arweave storage (100 tracks) | $3.40 | $0 |
| Zora minting (gas, 100 mints) | ~$5 | ~$5 |
| 0xSplits deployment | ~$2 per split | $0 |
| ArNS domain (zao.ar.io) | ~$20 | $0 |
| **Total first month** | **~$30** | **~$5** |

---

## Part 11: Contract Addresses and Technical References

### Zora Protocol (Base)

| Contract | Address | Purpose |
|----------|---------|---------|
| Zora Creator 1155 Factory | Deterministic via SDK | Deploy new 1155 collections |
| ZoraTimedSaleStrategy | Set by SDK | Primary sale + auto-secondary |
| Protocol Rewards | Managed by Zora | Creator fee distribution |

**SDK:** `@zoralabs/protocol-sdk` - `create1155()` function
**Docs:** https://docs.zora.co/protocol-sdk/introduction

### 0xSplits (Base)

| Contract | Purpose |
|----------|---------|
| SplitMain | Core split creation and distribution |
| ImmutableSplit | Trustless, unchangeable revenue splits |
| WaterfallModule | Recoup-first distribution |
| SwapperModule | Auto-convert to stablecoins |

**SDK:** `@0xsplits/splits-sdk` v6.4.1
**Docs:** https://docs.splits.org/sdk

### Arweave

| Service | Endpoint | Purpose |
|---------|----------|---------|
| ArDrive Turbo | `@ardrive/turbo-sdk` | Upload to Arweave |
| Arweave Gateway | `https://arweave.net/{txId}` | Audio streaming |
| ar.io Wayfinder | `@ar.io/wayfinder-core` | Decentralized CDN |
| Arweave GraphQL | `https://arweave.net/graphql` | Discover ZAO tracks |
| ArNS | `https://arns.app/` | Permanent domain |

### Farcaster Mini Apps

| Resource | URL |
|----------|-----|
| Mini App Spec | https://miniapps.farcaster.xyz/docs/specification |
| Meta Tags | `<meta name="fc:miniapp" ...>` |
| SDK | Farcaster Mini App SDK (Ethereum provider) |
| Preview | 3:2 aspect ratio image + launch button |
| Notifications | 32-char title, 128-char body, 100/day limit |

---

## Cross-References

| Doc | Relevance |
|-----|-----------|
| [141 - On-Chain Music Distribution Landscape](../141-onchain-music-distribution-landscape/) | Platform comparison, Zora + 0xSplits recommendation |
| [143 - 0xSplits Revenue Distribution](../143-0xsplits-revenue-distribution/) | SDK setup, split templates, Zora integration code |
| [152 - Arweave Ecosystem Deep Dive](../152-arweave-ecosystem-deep-dive/) | ArDrive Turbo, ar.io Wayfinder, GraphQL, ArNS |
| [153 - BazAR Arweave Atomic Assets](../153-bazar-arweave-atomic-assets-music/) | UCM marketplace, UDL licenses |
| [155 - End-to-End Music NFT Implementation](../155-music-nft-end-to-end-implementation/) | Complete upload-mint-buy flow with code |
| [156 - Pods Media Podcast Tokenization](../156-pods-media-podcast-tokenization/) | Pods.media model (podcast equivalent) |
| [273 - Web3 Streaming Features](../273-web3-streaming-features-tipping-gating-tickets/) | Tipping, gating, tickets |
| [322 - AI Music Distribution & Marketing](../322-ai-music-distribution-marketing-2026/) | AI-assisted distribution |

## Sources

### Platforms
- [Sound.xyz Sunsetting](https://paragraph.com/@soundxyz/sunsetting-sound)
- [Vault.fm](https://vault.fm/)
- [Catalog](https://catalog.works/)
- [Catalog Licensing Marketplace](https://medium.com/platform-stream/catalog-reclaims-billion-dollar-music-licensing-industry-for-culturally-vital-artists-73da28a52ebb)
- [Zora](https://zora.co/)
- [Zora Protocol SDK](https://docs.zora.co/protocol-sdk/introduction)
- [Audius](https://audius.co/)
- [0xSplits](https://docs.splits.org/sdk)
- [Mint Songs](https://opensea.io/MintSongs-Collection)
- [Pods.media](https://pods.media/)

### Farcaster
- [Farcaster Mini Apps Spec](https://miniapps.farcaster.xyz/docs/specification)
- [Farcaster Embeds Technical](https://dtech.vision/farcaster/hubs/embeds/)
- [Farcaster Mini Apps Intro (Bankless)](https://www.bankless.com/read/farcaster-frames-v2)
- [20 Farcaster Mini Apps](https://www.bankless.com/read/20-farcaster-mini-apps)
- [Making Mini Apps as an Artist](https://paragraph.com/@keccers/making-your-own-farcaster-mini-app-as-an-artist)

### Storage
- [Arweave vs IPFS 2026](https://future.forem.com/ribhavmodi/where-blockchain-data-actually-lives-ipfs-arweave-the-2026-storage-war-2bka)
- [ar.io Permanent Storage](https://ar.io/articles/why-arweaves-permanent-storage-model-wins/)
- [ArDrive Turbo SDK](https://github.com/ardriveapp/turbo-sdk)

### Market Data
- [Music NFTs in 2026 (Orphiq)](https://orphiq.com/resources/music-nfts-2026)
- [Music NFT Marketplaces 2026 (Synodus)](https://synodus.com/blog/blockchain/music-nft-marketplace/)
- [Are Music NFTs Dead? (ArtisTrack)](https://artistrack.com/are-music-nfts-dead-2026-reality/)
- [Water & Music: Artist Subscriptions](https://www.waterandmusic.com/james-blake-vault-artist-subscriptions-save-music/)

### Base Chain
- [Base Docs: Minting with Zora](https://docs.base.org/cookbook/use-case-guides/creator/nft-minting-with-zora)
- [NFT Blockchain Platforms 2026](https://ndlabs.dev/nft-blockchain-platforms)
- [Base NFT Ecosystem](https://nftplazas.com/best-base-network-gaming-and-nft-ecosystem/)

### Paragraph
- [Paragraph Review 2026](https://cryptoadventure.com/paragraph-review-2026-web3-publishing-newsletter-distribution-and-the-post-mirror-landscape/)
