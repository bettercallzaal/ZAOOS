# Research 100: Music NFT Landscape 2026 — ZAO OS Integration

> **Date:** 2026-03-22
> **Status:** Current research
> **Relevance:** High — direct integration opportunities for ZAO OS music features

---

## 1. Platform Status: Who Survived, Who Died, Who Pivoted

### DEAD / OFFLINE

| Platform | Status | Notes |
|----------|--------|-------|
| **Sound.xyz** | **Offline Jan 16, 2026** | Shut down to go all-in on Vault.fm. Collections preserved onchain — metadata on decentralized storage, still visible via wallet on OpenSea etc. Had raised $20M Series A from a16z. |
| **Mint Songs** | **Acquired by Napster (Q1 2025)** | Absorbed into Napster's Web3 strategy. Was built on Polygon with free minting. No longer operates as independent platform. |

### PIVOTED

| Platform | Status | Notes |
|----------|--------|-------|
| **Zora** | **Pivoted beyond NFTs** | Still supports ERC-1155 minting but repositioned as "Media Layer" of blockchain. Feb 2026: launched "attention markets" on Solana for trading cultural trend tokens. Creator coins now a bigger focus than NFT minting. Still has strong developer SDK. |
| **Sound.xyz -> Vault.fm** | **New platform** | Team behind Sound.xyz now building Vault.fm — an artist-to-fan platform for sharing music, messaging fans, dropping exclusive content. NOT NFT-based — focuses on direct monetization (artists set minimum price, fans can pay more). Artists own fan data. |

### ALIVE AND OPERATIONAL

| Platform | Status | Chain | Notes |
|----------|--------|-------|-------|
| **Catalog** | **Active** | Ethereum | 1/1 music NFTs. Invite-only. Digital record shop + streaming. Artists retain most revenue + set resale royalties. |
| **Zora (minting infra)** | **Active** | Zora Network, Base, Optimism, Ethereum | Protocol SDK still fully functional for ERC-1155 and ERC-721 minting. Low-cost minting (<$0.50 on Zora Network). |
| **OpenSea (OS2)** | **Active** | Multi-chain (19 chains) | Relaunched as OS2 mid-2025. 44% user activity boost. General marketplace but supports music NFTs. |
| **Audius** | **Active** | Solana-based | Integrated AI content upload tools mid-2025. Artists can mint and stream directly. |
| **OneOf** | **Active** | Tezos | Eco-friendly PoS chain. Audio NFTs with reduced environmental impact. |
| **Unchained Music** | **Active** | Multi-chain | Music NFT marketplace + distribution. |

### MARKET SIZE

- Music NFT market valued at ~$4.8B in 2026
- Projected to reach $46.88B by 2035 (CAGR 28.84%)
- 180+ music NFT startups tracked, 65 funded, 11 at Series A+
- 62% of independent artists exploring NFTs for monetization
- 49% of music creators now prioritize blockchain distribution

### KEY TREND: "NFT" Label is Fading

Platforms now call them "Digital Pressings," "Access Passes," or "Fan Shares." The speculative era is over — utility is king. 71% of NFT music projects are collectible tracks/albums, 39% offer perks like backstage access, 44% of musicians earn income directly without intermediaries.

---

## 2. Minting Music On-Chain in 2026

### Recommended Chains for ZAO OS

| Chain | Gas Cost | Ecosystem | Best For |
|-------|----------|-----------|----------|
| **Base** | Very low (<$0.01) | Coinbase ecosystem, Zora, Sound (legacy) | Primary recommendation — low cost, Coinbase onramps, strong music ecosystem |
| **Optimism** | Low (~$0.01-0.05) | Already used by ZAO for Respect tokens | Good for alignment with existing ZAO contracts |
| **Zora Network** | Very low (<$0.50) | Zora-native, creator-focused | Best for open edition mints |
| **Ethereum L1** | High ($5-50+) | Catalog, high-value 1/1s | Only for premium 1/1 releases |

### Token Standards

| Standard | Use Case | ZAO Relevance |
|----------|----------|---------------|
| **ERC-1155** | Multiple editions from one contract, batch transfers, 90% gas savings vs ERC-721 | **Primary recommendation** — one ZAO contract, unlimited tracks as tokens, tiered editions |
| **ERC-721** | Unique 1/1 pieces | Premium "ZAO Exclusive" single editions |
| **ERC-20 mints** | Zora now supports minting 1155s payable in ERC-20 tokens | Could let fans mint with community tokens |

### Zora Protocol SDK (Primary Integration Path)

```
npm install @zoralabs/protocol-sdk
```

**Creator Client** — create and manage 1155 contracts and tokens:
- `create1155()` — new contract + first token
- `create1155OnExistingContract()` — add tokens to existing contract

**Collector Client** — mint existing tokens:
- `mint()` — supports 1155, 721, and premints
- `mintType` parameter determines token type

**Key features:**
- Gasless premint — artists without funded wallets can create collections
- ERC-20 minting support — fans pay with any ERC-20 token
- Automatic secondary market via Uniswap after primary sale completes
- Creator earnings: 42.9% of protocol mint fees

**Chain support:** Base, Optimism, Zora Network, Ethereum, and others.

---

## 3. Collecting / Supporting Artists

### Current Fan Experience Models

| Model | Platform | How It Works |
|-------|----------|-------------|
| **Open editions** | Zora | Unlimited mints at low price ($1-5), time-limited |
| **Limited editions** | Catalog, Zora | Fixed supply (e.g., 100 copies), creates scarcity |
| **1/1 auctions** | Catalog | Single unique NFT, highest bidder wins |
| **Tipping/pay-what-you-want** | Vault.fm | Fans set own price above minimum |
| **Streaming revenue** | Audius | Per-play payments without intermediaries |

### Payment Methods

- **Crypto wallets** — standard across all platforms
- **Credit card** — Coinbase onramps on Base make fiat-to-crypto seamless
- **Gasless/sponsored** — Zora premint allows collection creation without gas

### Split Payments (0xSplits)

0xSplits is the standard for onchain revenue splitting:
- Processed $500M+ in distributions
- Supported on Ethereum, Polygon, Optimism, Zora, Base
- No-code Split creation with custom beneficiaries and percentages
- Automatic royalty splits for primary sales AND resales
- SDK: `@0xsplits/splits-sdk` (v2) + `@0xsplits/splits-kit` UI components

---

## 4. Displaying Music NFTs — APIs and Indexers

### IMPORTANT: SimpleHash is Dead

SimpleHash was acquired by Phantom in February 2025. The standalone API was sunset March 27, 2025. This is a critical consideration — many guides still reference it.

### Current Options for Querying Wallet Music NFTs

| Service | Status | Chains | Best For |
|---------|--------|--------|----------|
| **Alchemy NFT API** | Active | 30+ chains | Broadest chain support, metadata, floor prices, rarity, webhooks for transfers, NFT CDN for images. Migration path from SimpleHash documented. |
| **Zerion API** | Active | Multi-chain | Single-call multichain architecture, returns NFTs + tokens + DeFi positions together, spam filtering, floor prices, cached media. Best for wallet/portfolio views. |
| **Moralis NFT API** | Active | Multi-chain | Alternative to Alchemy, fast indexing |
| **Reservoir** | Active | EVM chains | Aggregated orderbook, marketplace data, collection offers |

### Recommended for ZAO OS

**Alchemy NFT API** — best balance of coverage and features:
- `getNFTsForOwner()` — all NFTs in a wallet
- Filter by contract address to show only music NFTs
- Metadata includes audio URLs, artwork, attributes
- Webhooks for real-time transfer notifications
- Free tier available

**Implementation approach:**
1. Query wallet address via Alchemy
2. Filter results by known music NFT contracts (Zora 1155s, Catalog, etc.)
3. Extract audio metadata (IPFS URIs for playback)
4. Display in profile gallery with embedded player

---

## 5. Embedding Music NFT Players

### Zora Embeds

Zora provides an official embed tool at `embed.zora.co`:
- Embed any Zora-listed NFT on external sites
- Supports minting directly from the embed
- Can be integrated via iframe or paste-able links
- Works for music, art, and video NFTs

### Custom Player Approach (Recommended for ZAO OS)

Since ZAO OS already has a music player infrastructure (`GlobalPlayer`, `WaveformPlayer`, `MusicEmbed`), the best approach is:

1. **Fetch NFT metadata** via Alchemy API
2. **Extract audio URI** from metadata (typically IPFS or Arweave)
3. **Resolve IPFS** via gateway (e.g., `gateway.pinata.cloud`, `ipfs.io`)
4. **Play in existing ZAO player** — the `WaveformPlayer` and `GlobalPlayer` components already handle audio playback
5. **Add "Collect" button** that links to Zora mint page or triggers onchain mint via SDK

### Existing ZAO OS Music Infrastructure

The codebase already recognizes `sound.xyz` and `zora.co/collect/` URLs in `src/lib/music/isMusicUrl.ts`. This can be extended to:
- Detect music NFT URLs in casts
- Show NFT metadata (edition size, price, collector count)
- Enable in-app collecting via Zora SDK

---

## 6. ZAO OS Integration Opportunities

### 6A. Mint Community Tracks as NFTs

**Architecture:**
```
ZAO Admin/Artist -> Upload audio + metadata -> Zora SDK create1155()
                                             -> Deploy on Base/Optimism
                                             -> 0xSplits for revenue sharing
                                             -> Share mint link in ZAO feed
```

**Implementation steps:**
1. Add a "Mint as NFT" option to the existing `SongSubmit` component
2. Use Zora Protocol SDK (`@zoralabs/protocol-sdk`) Creator Client
3. Deploy a single ZAO ERC-1155 contract — each track is a new token ID
4. Use gasless premint so artists don't need funded wallets
5. Auto-create 0xSplits contract: artist % + ZAO treasury %
6. Post the mint link as a Farcaster cast in the ZAO channel

**Config addition to `community.config.ts`:**
```ts
nft: {
  mintContract: '0x...' as `0x${string}`,  // ZAO 1155 contract
  chain: 'base' as const,                   // or 'optimism'
  treasurySplit: 10,                         // 10% to ZAO treasury
  defaultEditionSize: 100,                   // default limited edition
}
```

### 6B. Display Music NFT Collections on Profiles

**Implementation:**
1. Add "Collection" tab to user profiles
2. Query wallet via Alchemy NFT API for music-related NFTs
3. Filter by known music contracts (Zora music, Catalog, etc.)
4. Display album art grid with playback integration
5. Show collection stats: total collected, artists supported, editions owned

**UI component:** `MusicNFTGallery` — grid of NFT cards with:
- Album artwork (from NFT metadata)
- Track title + artist
- Edition number (e.g., "#42 of 100")
- Play button (routes audio to GlobalPlayer)
- Link to onchain record

### 6C. Music NFTs for Access Gating and Reputation

ZAO OS already has token gating via Respect tokens on Optimism. Extend this:

| Gate Type | Mechanism | Example |
|-----------|-----------|---------|
| **Collector gate** | Hold any ZAO music NFT | Access to exclusive channels |
| **Edition gate** | Hold specific edition NFTs | Early access to new releases |
| **Supporter tier** | Number of NFTs collected | Bronze (1+), Silver (5+), Gold (10+) |
| **Artist gate** | Hold NFT from specific artist | Access to artist's private channel |

**Integration with existing gating:**
- `src/lib/gates/` already handles Respect token checks
- Add parallel check for ERC-1155 balances on the ZAO mint contract
- Use `balanceOf(address, tokenId)` for specific track gates
- Use `balanceOfBatch()` for "any ZAO NFT" gates

### 6D. "ZAO Exclusive" Limited Edition Releases

**Concept:** Weekly or monthly drops exclusive to ZAO community:
1. Artist submits track via existing `SongSubmit` flow
2. Admin approves and sets parameters (edition size, price, duration)
3. Mint goes live — only accessible within ZAO OS
4. Collectors get onchain proof of support
5. Revenue splits automatically via 0xSplits

**Edition models:**
- **Open edition** (unlimited, time-limited) — community anthems, low barrier
- **Limited edition** (25-100 copies) — exclusive releases, creates scarcity
- **1/1 auction** — premium releases, highest community engagement

---

## 7. Revenue Sharing

### 0xSplits (Primary Recommendation)

**Why:** Battle-tested, $500M+ processed, works on all ZAO-relevant chains (Base, Optimism, Zora), open source, no-code or SDK.

**ZAO Revenue Split Structure:**
```
Primary Sale Revenue
├── Artist: 80%
├── ZAO Treasury: 10%
├── Collaborators: 5%
└── Curator/Submitter: 5%

Secondary Sale Royalties (if enforced)
├── Artist: 70%
├── ZAO Treasury: 20%
└── Original Collector: 10%
```

**SDK integration:**
```
npm install @0xsplits/splits-sdk
```

- Create Split contracts programmatically per release
- Attach Split address as the recipient on Zora 1155 mint
- Revenue flows automatically to all beneficiaries
- Transparent — anyone can verify splits onchain

### Superfluid (Streaming Payments — Future Phase)

Superfluid enables per-second payment streaming. Potential applications:
- Per-play payments for ZAO Radio tracks
- Continuous revenue streams to artists based on listener time
- Subscription-style access (stream payment = access to exclusive content)

**Current status:** Active protocol on Ethereum, Optimism, Polygon, Base. Well-suited for music but requires more complex integration than 0xSplits. Recommend as Phase 2 after basic NFT minting is live.

---

## 8. Recommended Implementation Roadmap for ZAO OS

### Phase 1: Display (Low Effort, High Value)
- [ ] Add Alchemy NFT API integration to query wallet music NFTs
- [ ] Create `MusicNFTGallery` component for user profiles
- [ ] Extend `isMusicUrl.ts` to detect more music NFT platforms
- [ ] Show NFT metadata in music embeds (edition info, collect count)

### Phase 2: Collect (Medium Effort)
- [ ] Add "Collect" buttons to music NFT embeds in the feed
- [ ] Integrate Zora SDK Collector Client for in-app minting
- [ ] Support credit card checkout via Coinbase onramp on Base

### Phase 3: Create (Higher Effort)
- [ ] Deploy ZAO community ERC-1155 contract on Base
- [ ] Add "Mint as NFT" to SongSubmit workflow
- [ ] Integrate 0xSplits for automatic revenue sharing
- [ ] Admin dashboard for managing releases and splits
- [ ] Add to `community.config.ts` for fork-friendliness

### Phase 4: Gate (Extends Existing Infrastructure)
- [ ] Add music NFT balance checks to `src/lib/gates/`
- [ ] Create collector tiers for reputation/access
- [ ] "ZAO Exclusive" channel gated by NFT ownership

### Phase 5: Stream Revenue (Future)
- [ ] Superfluid integration for per-play streaming payments
- [ ] ZAO Radio revenue sharing with artists

---

## 9. Technical Dependencies

| Package | Purpose | npm |
|---------|---------|-----|
| `@zoralabs/protocol-sdk` | Create + mint ERC-1155 NFTs | `npm i @zoralabs/protocol-sdk` |
| `@0xsplits/splits-sdk` | Revenue splitting | `npm i @0xsplits/splits-sdk` |
| `@0xsplits/splits-kit` | Split UI components | `npm i @0xsplits/splits-kit` |
| Alchemy NFT API | Query wallet NFTs | REST API (no npm needed) |
| `viem` | Already in project | Already installed |
| `wagmi` | Already in project | Already installed |

---

## 10. Key Risks and Considerations

1. **Royalty enforcement is broken** — Most marketplaces no longer enforce creator royalties on secondary sales. Design revenue models around primary sales.
2. **Platform risk** — Sound.xyz shutting down proves that relying on any single platform is dangerous. Using Zora Protocol (open source, onchain) and IPFS/Arweave for storage mitigates this.
3. **User experience** — Most fans still don't have wallets. Base + Coinbase onramp is the best path to credit card minting.
4. **Legal considerations** — Music NFTs and IP rights are still legally murky. ZAO should ensure artists explicitly license their work for NFT distribution.
5. **Metadata permanence** — Always store audio + metadata on IPFS or Arweave, not centralized servers. Sound.xyz's shutdown proves this — their onchain data survived.

---

## Sources

- [Sound.xyz shutdown announcement](https://www.sound.xyz/)
- [Vault.fm — Sound.xyz successor](https://vault.fm/)
- [Sound.xyz enters maintenance mode](https://outposts.io/article/soundxyz-enters-maintenance-mode-shifts-focus-to-vault-cfe72744-b90b-49aa-b526-46bf324469ea)
- [Zora Review 2026: Attention Markets](https://cryptoadventure.com/zora-review-2026-attention-markets-creator-coins-and-the-shift-beyond-nfts/)
- [Zora Protocol SDK Docs](https://docs.zora.co/protocol-sdk/introduction)
- [Zora 1155 Creator Docs](https://docs.zora.co/protocol-sdk/creator/onchain)
- [Zora Collector Mint Docs](https://docs.zora.co/protocol-sdk/collect/mint)
- [Zora ERC-20 Minting](https://docs.zora.co/protocol-sdk/creator/erc20-mints)
- [Zora Embed Tool](https://embed.zora.co/)
- [Mint on Zora with Base](https://docs.base.org/cookbook/use-case-guides/creator/nft-minting-with-zora)
- [Catalog Works](https://catalog.works/)
- [Are Music NFTs Dead? 2026 Reality](https://artistrack.com/are-music-nfts-dead-2026-reality/)
- [Music NFT Market Size 2026](https://www.businessresearchinsights.com/market-reports/music-nft-market-102652)
- [Top 15 Music NFT Marketplaces 2026](https://influencermarketinghub.com/music-nft-marketplace/)
- [25+ Music NFT Marketplaces 2026 Edition](https://synodus.com/blog/blockchain/music-nft-marketplace/)
- [0xSplits SDK](https://github.com/0xSplits/splits-sdk)
- [Splits.org](https://splits.org/)
- [0xSplits at Transient Labs](https://support.transientlabs.xyz/en/articles/10593476-what-is-0xsplits-and-how-we-use-it-at-transient-labs)
- [Alchemy NFT API](https://www.alchemy.com/nft-api)
- [Alchemy SimpleHash Migration Guide](https://www.alchemy.com/blog/migrating-nft-data-from-simplehash-to-alchemy)
- [Best NFT APIs 2026 Guide](https://zerion.io/blog/best-nft-apis/)
- [Superfluid Protocol](https://superfluid.org/)
- [Superfluid Guide](https://www.gate.com/crypto-wiki/article/what-is-superfluid-guide-potential-and-real-time-cryptocurrency-streaming-applications-20260115)
- [NFTs in 2026: Beyond Hype](https://medium.com/activated-thinker/nfts-in-2026-beyond-hype-into-human-value-d32bfea9dcf7)
- [Music NFT Standards Overview](https://anettrolikova.medium.com/music-nft-standards-overview-696ba3ee889c)
