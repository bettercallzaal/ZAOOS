# 141 — On-Chain Music Distribution Landscape 2026

> **Status:** Research complete
> **Date:** March 26, 2026
> **Goal:** Map every active on-chain music distribution service and evaluate which approach ZAO OS should take

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Distribution model** | HYBRID — Traditional DSP distribution (Spotify/Apple/etc.) + on-chain NFT minting via Zora on Base |
| **Royalty splits** | USE 0xSplits on Base — 6,000+ splits deployed on Zora L2, battle-tested, Zora-native integration |
| **Distribution partner** | Unchained Music for DSP distribution (free, 100% royalties to artist, on-chain payout) OR self-serve via Zora |
| **NFT standard** | ERC-1155 via Zora Protocol SDK — multi-edition music collectibles, cheapest on Base |
| **Revenue flow** | Artist → Zora mint → 0xSplits → Treasury (10%) + Artist (80%) + Curator (10%) |

## The On-Chain Music Distribution Stack (2026)

```
┌─────────────────────────────────────────────────┐
│                  LISTENER                        │
│  Streams on Spotify/Apple/etc  OR  Collects NFT  │
└──────────────┬──────────────────────┬────────────┘
               │                      │
    ┌──────────▼──────────┐  ┌───────▼──────────┐
    │  Traditional DSPs   │  │  On-Chain Mint    │
    │  (200+ platforms)   │  │  (Zora on Base)   │
    │  via Unchained/     │  │  ERC-1155 edition  │
    │  OnChain Music      │  │  $0.50 mint cost   │
    └──────────┬──────────┘  └───────┬──────────┘
               │                      │
    ┌──────────▼──────────┐  ┌───────▼──────────┐
    │  Fiat Royalties     │  │  ETH/Token Revenue│
    │  $0.003-0.01/stream │  │  per-mint price   │
    └──────────┬──────────┘  └───────┬──────────┘
               │                      │
               └──────────┬───────────┘
                          │
                 ┌────────▼────────┐
                 │    0xSplits     │
                 │  Revenue Split  │
                 │  Artist: 80%   │
                 │  Treasury: 10% │
                 │  Curator: 10%  │
                 └─────────────────┘
```

## Active Platforms Comparison

| Platform | Model | Revenue Split | Chain | Music-Specific | Free Tier | Status |
|----------|-------|---------------|-------|----------------|-----------|--------|
| **Zora** | NFT mint + secondary | Creator 42.9% of protocol fees | Base, Zora, ETH, OP | Audio upload supported | Free to create | Active, pivoting to "attention markets" |
| **Unchained Music** | DSP distribution + DeFi | 100% to artist | Polygon (NFT), Sei (payouts) | Purpose-built for music | Free | Active, 70K+ artists |
| **OnChain Music** | DSP + web3 distribution | 85% to artist | Custom ($MUSIC token) | Purpose-built | Free | Active, 235 artists |
| **Audius** | Direct streaming | $AUDIO token rewards | Solana/Ethereum | Purpose-built | Free | Active, 250M+ streams |
| **Catalog** | 1/1 music NFTs | 100% primary, EIP-2981 secondary | Ethereum | Music only | Curated | Active but niche |
| **Vault.fm** | Subscription ($5/mo) | Majority to artist | Off-chain | Music + community | No (subscription) | Active (Sound.xyz successor) |

## Why Zora + 0xSplits for ZAO OS

### Zora Protocol SDK
- `@zoralabs/protocol-sdk` + `viem@2.x`
- **Creator Client:** `create1155` for multi-edition music NFTs
- **Collector Client:** `mint`, `getToken`, `buy1155OnSecondary`
- Supports audio metadata upload (mp3, wav, flac)
- Base chain deployment = $0.50 or less per mint
- Open source, MIT licensed

### 0xSplits
- `@0xsplits/splits-sdk` v6.4.1
- $500M+ processed lifetime
- Full support: Ethereum, Base, Optimism, Arbitrum, Celo, World Chain
- Zora-native integration — create splits directly when minting
- `predictImmutableSplitAddress` → set as `payoutRecipient` on edition
- Waterfall contracts (recoup costs before splitting)
- Swapper contracts (auto-convert to stablecoins)

### Why This Beats Alternatives for ZAO
1. **Same chain as ZOUNZ** — Base chain, no bridging needed
2. **Already in codebase** — `src/lib/wagmi/config.ts` has Base, `src/lib/zounz/contracts.ts` has contract patterns
3. **Open contracts** — Anyone can fork/use, matches ZAO's open-source ethos
4. **Composable with ZOUNZ governance** — Treasury proposals can fund music NFT mints
5. **Simple UX** — Artist uploads track → gets NFT → fans collect → revenue auto-splits

## Unchained Music: Traditional DSP Bridge

For artists who need Spotify/Apple Music distribution alongside NFTs:
- **Free** music distribution to 200+ DSPs
- 100% royalties to artist (Unchained earns via DeFi yield on locked royalties)
- Charged Particles protocol: NFT minted on Polygon that holds royalties
- Royalties locked in AAVE for 1 month → interest to Unchained, principal to artist
- Partnerships with Sei (on-chain payouts) and Dynamic (wallet auth)

**ZAO integration:** Could offer "Distribute via Unchained" as option alongside Zora NFT minting

## Market Context

- Global music NFT market: $4.8B (2026), projected $46.88B by 2035 (CAGR 28.84%)
- Smart contract market: $3B+ annual revenue (2026)
- Key shift: platforms moving from pure NFT minting to hybrid streaming + collecting models
- Sound.xyz shut down Jan 2026; Vault.fm (same team) pivoted to subscriptions
- Zora expanded to Solana for "attention markets" but Base remains core for NFTs

## Sources

- [Zora Protocol SDK](https://nft-docs.zora.co/protocol-sdk/introduction)
- [0xSplits SDK](https://docs.splits.org/sdk)
- [Zora + Splits Integration](https://splits.org/blog/zora-integration/)
- [Unchained Music](https://www.unchainedmusic.io/)
- [OnChain Music](https://onchainmusic.com/)
- [Audius Dev Docs](https://docs.audius.org/)
- [Vault.fm](https://vault.fm/)
- [Base Docs: Minting with Zora](https://docs.base.org/cookbook/use-case-guides/creator/nft-minting-with-zora)
- [Music NFT Marketplaces 2026](https://synodus.com/blog/blockchain/music-nft-marketplace/)
- [Smart Contracts for Music Royalties](https://www.soundverse.ai/blog/article/smart-contracts-for-music-royalties-explained-0059)
- [Chainlink: Tokenized Royalties](https://chain.link/article/tokenized-royalties-smart-contracts)
