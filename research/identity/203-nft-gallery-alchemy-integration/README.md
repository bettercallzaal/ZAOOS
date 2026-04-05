# 203 — NFT Gallery on Member Profiles via Alchemy NFT API

> **Status:** Implemented
> **Date:** March 28, 2026
> **Goal:** Display all NFTs a member holds on their ZAO OS profile page with chain/collection filtering

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **NFT data source** | USE Alchemy NFT v3 API — already integrated for music NFTs in `src/app/api/music/wallet/route.ts`, free tier covers 300M compute units/month, supports ETH + Base + Optimism |
| **No new API keys** | SKIP Moralis, SimpleHash, etc. — Alchemy `ALCHEMY_API_KEY` is already in `.env` and working |
| **Spam filtering** | USE Alchemy's built-in `excludeFilters[]=SPAM` parameter — removes known spam/airdrop NFTs automatically |
| **ZOUNZ highlighting** | HIGHLIGHT NFTs from ZOUNZ contract `0xCB80Ef04DA68667c9a4450013BDD69269842c883` (Base chain) with gold border to make DAO membership visually prominent |
| **Caching** | USE 5-minute server-side cache (`s-maxage=300`) — same pattern as existing music/wallet route |

## Comparison of NFT API Providers

| Provider | Free Tier | Chains | Spam Filter | Already in ZAO OS | Bundle Size |
|----------|-----------|--------|-------------|-------------------|-------------|
| **Alchemy NFT v3** | 300M CU/month | ETH, Base, OP, Polygon, Arb + 10 more | Yes (`excludeFilters`) | Yes (music/wallet route) | 0 (REST API) |
| **Moralis** | 40K req/day | 25+ chains | Yes | No | 0 (REST API) |
| **SimpleHash** | 1K req/day | 40+ chains | Yes (scoring) | No | 0 (REST API) |
| **Reservoir** | 120K req/month | ETH, Base, OP, Polygon | Yes | No | 0 (REST API) |

Alchemy wins because it's already configured, has the most generous free tier, and supports all 3 chains ZAO cares about.

## What Was Built

### API Route: `src/app/api/members/nfts/route.ts`
- Accepts `?address=0x...` query parameter
- Scans 3 chains in parallel via `Promise.allSettled`: Ethereum, Base, Optimism
- Returns up to 50 NFTs per chain (150 max total)
- Excludes spam NFTs via Alchemy's built-in filter
- Skips NFTs without images (no point displaying blank cards)
- Flags ZOUNZ NFTs by matching against known contract address
- Builds marketplace URLs (OpenSea for most, Zora for Zora-minted)
- 5-minute cache, auth required

### Component: `src/components/members/NFTGallery.tsx`
- Lazy-loaded via `next/dynamic` (no SSR) to avoid blocking profile page load
- Responsive grid: 3 cols mobile → 4 cols tablet → 5 cols desktop
- Each NFT card shows:
  - Square thumbnail with `next/image` (unoptimized for external URLs)
  - Hover overlay with name + collection
  - Chain badge (ETH/Base/OP) in top-right corner
  - ZOUNZ badge + gold ring for DAO NFTs
  - Click-through to OpenSea/Zora
- Loading skeleton (6 pulsing squares) while fetching

### Filters
- **Chain pills**: All / ETH / Base / OP — with count per chain, hides chains with 0 NFTs
- **Collection dropdown**: auto-populated from fetched NFTs, alphabetically sorted
- **ZOUNZ only toggle**: quick-filter to show only ZOUNZ DAO NFTs (only appears if member holds ZOUNZ)

### Profile Page Integration: `src/app/members/[username]/page.tsx`
- Added between ENS On-Chain Profile section and Fractal History section
- Only renders if the member has a wallet address (`preferredWallet || primaryWallet`)
- Section header shows filtered count: "NFTs (42)"

## ZAO OS Integration

| File | Change |
|------|--------|
| `src/app/api/members/nfts/route.ts` | NEW — NFT API route using Alchemy v3 |
| `src/components/members/NFTGallery.tsx` | NEW — NFT gallery component with filters |
| `src/app/members/[username]/page.tsx` | EDITED — added dynamic import + render |
| `src/app/api/music/wallet/route.ts` | EXISTING — music-only NFT route (unchanged, still works for music player) |
| `src/lib/zounz/contracts.ts` | EXISTING — ZOUNZ contract addresses referenced for highlighting |
| `.env` | EXISTING — `ALCHEMY_API_KEY` already configured |

## How to Use

1. Visit any member profile at `/members/{username}`
2. If the member has a connected wallet, their NFTs appear in a grid
3. Filter by chain (ETH/Base/OP), collection name, or ZOUNZ-only
4. Click any NFT to view on OpenSea or Zora
5. ZOUNZ NFTs are highlighted with a gold border and badge

## Key Numbers

- **3 chains** scanned: Ethereum, Base, Optimism
- **150 NFTs** max displayed (50 per chain)
- **300M compute units/month** — Alchemy free tier
- **5-minute cache** — reduces API calls for repeat views
- **0 new dependencies** — uses existing Alchemy API key, `next/image`, standard React
- **v3** — Alchemy NFT API version used

## Future Enhancements

- Show NFT floor prices (requires Alchemy `getFloorPrice` endpoint, 1 extra API call per collection)
- Add token balances tab (ERC-20 holdings via Alchemy `getTokenBalances`)
- Support additional chains (Polygon, Arbitrum, Zora chain) by adding to CHAINS array
- Gallery view with larger images on click (lightbox)

## Sources

- [Alchemy NFT API v3 Docs](https://docs.alchemy.com/reference/getnftsforowner)
- [Alchemy Spam Detection](https://docs.alchemy.com/docs/how-to-filter-nft-spam)
- [ZOUNZ on Nouns Builder](https://nouns.build/dao/base/0xCB80Ef04DA68667c9a4450013BDD69269842c883)
- [Doc 201 — ECF + Botto research that inspired this integration](../../events/201-ai-creator-economy-landscape-march-2026/)
- [Existing music NFT route](../../src/app/api/music/wallet/route.ts)
