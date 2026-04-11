# 299 - Nouns DAO Ecosystem & Snap Integration

> **Status:** Research complete
> **Date:** 2026-04-08
> **Goal:** Deep dive on OG Nouns DAO ecosystem - governance, art, auction mechanics, developer APIs - and how to enhance the Nouns Snap + connect to ZAO's existing ZOUNZ integration

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Noun API for images** | USE `noun-api.com/beta/pfp` for custom trait generation (random nouns, named avatars, trait customization) - free, no auth, returns 320px SVG |
| **noun.pics for specific IDs** | USE `noun.pics/{tokenId}` for existing Nouns (0-1868) - returns PNG of actual on-chain Noun |
| **Auction data in snap** | ADD current auction info to snap - live bid amount, time remaining, link to bid on nouns.wtf. AuctionHouse contract at `0x830BD73E4184ceF73443C15111a1DF14e495C706` |
| **Trait explorer** | ADD trait breakdown page to snap - show a Noun's 5 traits (background, body, accessory, head, glasses) with text labels |
| **CC0 licensing** | All Nouns art is CC0 (public domain) - safe to use, remix, display in any context |
| **ZOUNZ bridge** | ADD a "ZOUNZ" button to the snap linking to ZAO's Nouns Builder DAO - cross-promotes ZAO's on-chain governance to the broader Nouns community |
| **Prop House funding** | APPLY for Nouns small grants (0.1-10 ETH) to fund snap development - the Nouns community actively funds builders |
| **Named avatars** | ADD `?name=` feature - generate a persistent Noun avatar from any Farcaster username via noun-api.com |

---

## OG Nouns DAO Overview

### Key Numbers

| Metric | Value |
|--------|-------|
| Treasury | ~3,456 ETH (~$12.3M) |
| Total Nouns minted | 1,869 (as of April 8, 2026) |
| Auction frequency | 1 Noun per day, forever |
| Traits | 242 heads, 140 accessories, 30 bodies, 23 glasses, 2 backgrounds |
| Governance | Fork of Compound Governance, 1 Noun = 1 vote |
| Legal entity | DUNA (Wyoming) via Proposal 727 |
| License | CC0 - public domain |
| Small grants | 0.1-10 ETH per project |
| Prop House rounds | 6 grants of 6 ETH per cycle |

### Smart Contracts (Ethereum Mainnet)

| Contract | Address | Purpose |
|----------|---------|---------|
| NounsToken | `0x9C8fF314C9Bc7F6e59A9d9225Fb22946427eDC03` | ERC-721 minting |
| NounsSeeder | `0xCC8a0FB5ab3C7132c1b2A0109142Fb112c4Ce515` | Pseudo-random seed generation |
| NounsDescriptor | `0x0Cfdb3Ba1694c2bb2CFACB0339ad7b1Ae5932B63` | Art storage & SVG rendering |
| NounsAuctionHouse (Proxy) | `0x830BD73E4184ceF73443C15111a1DF14e495C706` | Daily auction logic |
| NounsDAOProxy | `0x6f3E6272A167e8AcCb32072d08E0957F9c79223d` | Governance voting |
| NounsDAOExecutor | `0x0BC3807Ec262cB779b38D65b38158acC3bfedE10` | Timelock treasury |

### Seed Structure (On-Chain Art)

Each Noun's appearance is determined by 5 traits stored as a `Seed` struct:

```solidity
struct Seed {
    uint48 background;  // 2 options (cool, warm)
    uint48 body;        // 30 options
    uint48 accessory;   // 140 options
    uint48 head;        // 242 options
    uint48 glasses;     // 23 options
}
```

Seeds are generated via `keccak256(abi.encodePacked(blockhash(block.number - 1), nounId))` - deterministic pseudo-random.

Art is stored as RLE-compressed pixel data on-chain, rendered to SVG via `NounsDescriptor.generateSVGImage(seed)`.

---

## Developer APIs for Snap Integration

### Image APIs Comparison

| API | URL Pattern | Returns | Auth | Best For |
|-----|-------------|---------|------|----------|
| **noun.pics** | `noun.pics/{tokenId}` | PNG (actual Noun) | None | Showing existing Nouns by ID |
| **Noun API** | `noun-api.com/beta/pfp` | SVG (320x320) | None | Random/custom Nouns, named avatars |
| **On-chain** | `NounsDescriptor.generateSVGImage(seed)` | Base64 SVG | RPC call | Fully trustless rendering |
| **Token URI** | `NounsToken.tokenURI(tokenId)` | Base64 JSON+SVG | RPC call | Full metadata with image |

### Noun API Parameters

| Parameter | Example | Description |
|-----------|---------|-------------|
| (none) | `noun-api.com/beta/pfp` | Random Noun |
| `?name=zaal` | `noun-api.com/beta/pfp?name=zaal` | Deterministic Noun from name (same every time) |
| `?head=42` | `noun-api.com/beta/pfp?head=42` | Specific head trait |
| `?background=cool&glasses=7` | | Multiple trait overrides |
| `?size=512` | | Custom image size |
| `?theme=sharkdao` | | Preset theme combos |

### Auction House ABI (for live auction data)

```typescript
const auctionAbi = parseAbi([
  'function auction() view returns (uint256 nounId, uint256 amount, uint40 startTime, uint40 endTime, address payable bidder, bool settled)',
]);
```

Read the current auction: `client.readContract({ address: AUCTION_PROXY, abi: auctionAbi, functionName: 'auction' })`

---

## Nouns Snap Enhancement Ideas

### Priority 1: Quick Wins

| Feature | Components | Data Source | Effort |
|---------|-----------|-------------|--------|
| **Trait breakdown** | `item_group` with 5 items (Background, Body, Accessory, Head, Glasses) | On-chain seed or hardcoded trait names | 30 min |
| **Live auction** | `item` (current bid), `progress` (time remaining), `button` (Bid on nouns.wtf) | AuctionHouse.auction() via Viem | 1 hr |
| **Named avatar** | `input` for name, returns persistent Noun from noun-api.com | noun-api.com/beta/pfp?name= | 30 min |
| **ZOUNZ cross-link** | `button` linking to ZAO's Nouns Builder DAO | Static URL | 5 min |

### Priority 2: Community Features

| Feature | Components | Data Source | Effort |
|---------|-----------|-------------|--------|
| **Noun of the Day** | Auto-show today's freshly minted Noun (ID = totalSupply - 1) | totalSupply() + noun.pics | 30 min |
| **Gallery browser** | Previous/Next navigation through all 1869 Nouns | Token ID pagination via submit actions | 1 hr |
| **Trait rarity** | Show how rare each trait is (`bar_chart`) | Precomputed from trait distribution data | 2 hr |
| **Auction history** | Last 5 auction results with prices | Settled event logs (limited block range) | 2 hr |

### Priority 3: ZAO Ecosystem

| Feature | Components | Data Source | Effort |
|---------|-----------|-------------|--------|
| **ZOUNZ auction snap** | Separate snap for ZAO's Nouns Builder DAO on Base | `src/lib/zounz/contracts.ts` (already built) | 2 hr |
| **Nouns x ZABAL** | Show ZABAL holder count alongside Noun display | Cross-snap data | 1 hr |

---

## ZAO OS Integration Points

| What | Path | Connection |
|------|------|-----------|
| ZOUNZ contracts | `src/lib/zounz/contracts.ts` | Token, Auction, Governor, Treasury ABIs on Base |
| ZOUNZ auction UI | `src/components/zounz/ZounzAuction.tsx` | Existing auction component |
| ZOUNZ proposals | `src/components/zounz/ZounzProposals.tsx` | Governance voting UI |
| ZOUNZ API | `src/app/api/zounz/proposals/` | Proposal list + details |
| Community config | `community.config.ts` (line 206-216) | ZOUNZ contract addresses, chain, nounsBuilderUrl |
| Ecosystem partners | `community.config.ts` (line 184-187) | ZOUNZ listed as ecosystem partner |
| Nouns Snap project | `nouns-snap/` (standalone repo) | OG Nouns snap at bettercallzaal/nouns-snap |
| NFT gallery | `src/components/members/NFTGallery.tsx` | Member NFT display (could show Nouns) |

---

## Nouns Community & Funding Opportunity

### Prop House / Small Grants

Nouns DAO actively funds builders. The snap is a perfect candidate:

- **Small Grants Committee**: 0.1-10 ETH for completed projects (retroactive funding)
- **Prop House Rounds**: 6 grants of 6 ETH per cycle, 90+ applicants per round
- **On-chain Proposals**: 10-1,000 ETH for larger projects

The Nouns Snap could be pitched as:
> "A Farcaster Snap that brings Nouns into the feed - browse, share, and discover Nouns without leaving the social layer. Built on the new Farcaster Snaps protocol. CC0 ethos, open source."

This aligns with Nouns' stated goal of proliferating the Nouns meme and CC0 ecosystem.

---

## Sources

- [Nouns DAO](https://nouns.wtf/) - official site, auction, governance
- [Nouns Protocol Dev Docs](https://nouns.center/dev/nouns-protocol) - smart contract reference
- [Noun API](https://noun-api.com/docs) - image generation API (random, named, custom traits)
- [noun.pics](https://noun.pics) - PNG images of specific Nouns by ID
- [nounsDAO/nouns-monorepo](https://github.com/nounsDAO/nouns-monorepo) - MIT license, full source
- [Nouns Center](https://nouns.center/intro) - community wiki, funding info
- [Nouns Builder](https://nouns.build/) - fork tool by Zora (powers ZAO's ZOUNZ)
- [Nouns Treasury Data](https://data.nounsmetrics.wtf/treasury) - live treasury metrics
- [Nouns Governance Explained](https://www.nouns.com/learn/nouns-dao-governance-explained) - governance mechanics
