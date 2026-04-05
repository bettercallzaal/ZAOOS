# 146 — Open Contracts: Multi-Artist Distribution via Forkable Smart Contracts

> **Status:** Research complete
> **Date:** March 26, 2026
> **Goal:** Design open, forkable contract architecture so any music community can replicate ZAO's distribution model

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Architecture** | Forkable trio: Nouns Builder (governance) + Zora 1155 (minting) + 0xSplits (revenue) |
| **License** | All MIT — matches existing contract licenses |
| **Deployment** | One-click deploy script for new communities |
| **Customization** | Split ratios, mint prices, governance thresholds all configurable |
| **Documentation** | Ship deployment guide alongside contracts |

## The Forkable Stack

Every contract ZAO uses is already open source. The innovation is **combining them into a reproducible template:**

```
┌─────────────────────────────────────────┐
│         "ZAO Distribution Stack"         │
│         (All MIT Licensed)               │
│                                          │
│  1. Nouns Builder Protocol               │
│     └─ github.com/BuilderOSS/nouns-protocol │
│     └─ Deploy via nouns.build (no-code)  │
│                                          │
│  2. Zora Protocol                        │
│     └─ github.com/ourzora/zora-protocol  │
│     └─ @zoralabs/protocol-sdk            │
│                                          │
│  3. 0xSplits                             │
│     └─ github.com/0xSplits              │
│     └─ @0xsplits/splits-sdk             │
│                                          │
│  4. ZAO OS Frontend (MIT)                │
│     └─ Next.js 16 + React 19            │
│     └─ community.config.ts = fork point  │
└─────────────────────────────────────────┘
```

## How Another Community Forks This

### Step 1: Deploy Nouns Builder DAO (5 minutes, no-code)
1. Go to [nouns.build](https://nouns.build/)
2. Upload art layers (generative NFT images)
3. Set auction duration (24h default)
4. Configure founder allocation (e.g., every 10th NFT to founder)
5. Deploy to Base/Ethereum/Optimism/Zora
6. **Result:** DAO with Treasury, Governor, Auction, Token contracts

### Step 2: Fork ZAO OS Frontend (30 minutes)
1. `git clone` ZAO OS repository
2. Edit `community.config.ts`:
   - Change community name, colors, logo
   - Update contract addresses to new DAO
   - Set admin FIDs
   - Configure music platforms
3. `npm install && npm run dev`
4. Deploy to Vercel

### Step 3: Configure Music Distribution
1. Set split templates in `community.config.ts`
2. Artists upload tracks through the forked frontend
3. Zora mints happen on same chain as their DAO
4. 0xSplits handle revenue distribution

## community.config.ts as the Fork Point

```typescript
// The ONLY file a forking community needs to change:
export const communityConfig = {
  name: "YOUR COMMUNITY",
  description: "YOUR DESCRIPTION",

  // Governance
  contracts: {
    token: "0x...",      // Their Nouns Builder Token
    auction: "0x...",    // Their Auction
    governor: "0x...",   // Their Governor
    treasury: "0x...",   // Their Treasury
    chain: "base",       // Or ethereum, optimism, zora
  },

  // Music Distribution
  music: {
    defaultSplit: {
      artist: 80,
      treasury: 10,
      curator: 10,
    },
    mintPrice: "0", // Free by default
    chain: "base",
  },

  // Branding
  theme: {
    primary: "#f5a623",
    background: "#0a1628",
  },
};
```

## Multi-Artist Scenarios

### Scenario 1: Solo Artist Release
```
Split: Artist 80% / Treasury 10% / Curator 10%
Contracts: 1 Zora 1155 + 1 0xSplit
```

### Scenario 2: Collaboration (2 Artists)
```
Split: Artist A 40% / Artist B 40% / Treasury 10% / Curator 10%
Contracts: 1 Zora 1155 + 1 0xSplit (4 recipients)
```

### Scenario 3: Community Compilation (10 Artists)
```
Split: Artists 70% (7% each) / Treasury 20% / Curator 10%
Contracts: 1 Zora 1155 (10 tokens, one per track) + 1 0xSplit per track
```

### Scenario 4: Label Deal with Recoup
```
Waterfall Split:
  First 1 ETH → Label (recoup advance)
  After recoup → Artist 80% / Label 10% / Treasury 10%
Contracts: 1 Zora 1155 + 1 0xSplit Waterfall
```

### Scenario 5: Cross-Community Collaboration
```
Split: ZAO Artist 40% / Other DAO Artist 40% / ZAO Treasury 5% / Other DAO Treasury 5% / Curator 10%
Both DAO treasuries benefit
```

## Why This Model Scales

1. **No central company** — Smart contracts handle everything
2. **No approval process** — Any member can propose a release via DAO governance
3. **No lock-in** — Artists own their NFTs, splits are on-chain
4. **Composable** — Other DAOs can integrate ZAO releases into their platforms
5. **Revenue compounds** — Treasury grows from auctions + music sales

## Existing Open-Source Music Distribution Projects

| Project | Model | Open Source? | Chain | Status |
|---------|-------|-------------|-------|--------|
| **ZAO (proposed)** | DAO governance + Zora + Splits | Yes (MIT) | Base | Building |
| **Audius** | Direct streaming + $AUDIO rewards | Yes | Solana/ETH | Active |
| **Catalog** | Curated 1/1 music NFTs | Partial | Ethereum | Active |
| **OnChain Music** | DSP + web3 distribution | No | Custom | Active |
| **Unchained Music** | DSP + DeFi yield | No | Polygon/Sei | Active |

ZAO's advantage: **fully open, fully forkable, DAO-governed.**

## Sources

- [BuilderOSS GitHub](https://github.com/BuilderOSS)
- [Nouns Builder](https://nouns.build/)
- [Zora Protocol](https://github.com/ourzora)
- [0xSplits](https://github.com/0xSplits)
- [community.config.ts pattern](../community.config.ts)
