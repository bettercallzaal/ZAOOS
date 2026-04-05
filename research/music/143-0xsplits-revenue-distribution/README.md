# 143 — 0xSplits: Automated Revenue Distribution for ZAO Artists

> **Status:** Research complete
> **Date:** March 26, 2026
> **Goal:** Implementation guide for 0xSplits integration — automated royalty splits for music NFTs on Base

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **SDK** | `@0xsplits/splits-sdk` v6.4.1 — mature, actively maintained |
| **Split type** | Immutable splits for each release — set once, never changes, fully trustless |
| **Default split** | Artist 80% / ZAO Treasury 10% / Curator 10% (configurable per release) |
| **Chain** | Base — native support, same chain as ZOUNZ and Zora mints |
| **Advanced** | Waterfall splits for label deals (recoup first), Swapper for stablecoin conversion |

## How 0xSplits Works

```
                    Revenue In (ETH from NFT mints)
                              │
                    ┌─────────▼─────────┐
                    │   Split Contract   │
                    │   (Immutable)      │
                    │                    │
                    │  Artist:    80%    │
                    │  Treasury:  10%    │
                    │  Curator:   10%    │
                    └──┬──────┬──────┬──┘
                       │      │      │
                    ┌──▼──┐┌──▼──┐┌──▼──┐
                    │Artist││DAO  ││Cura-│
                    │Wallet││Trea-││tor  │
                    │      ││sury ││Wallet│
                    └──────┘└─────┘└──────┘
```

## SDK Setup

```typescript
// src/lib/music/splits.ts
import { SplitsClient } from '@0xsplits/splits-sdk';
import { createPublicClient, createWalletClient, http } from 'viem';
import { base } from 'viem/chains';

const publicClient = createPublicClient({ chain: base, transport: http() });

export function createSplitsClient(walletClient: WalletClient) {
  return new SplitsClient({
    chainId: base.id,
    publicClient,
    walletClient,
  });
}
```

## Creating a Split for a Music Release

```typescript
// When artist mints a new track
const splitsClient = createSplitsClient(walletClient);

// Predict the split address (deterministic — same inputs = same address)
const { splitAddress } = await splitsClient.predictImmutableSplitAddress({
  recipients: [
    { address: artistAddress, percentAllocation: 80.0 },
    { address: ZAO_TREASURY, percentAllocation: 10.0 },
    { address: curatorAddress, percentAllocation: 10.0 },
  ],
  distributorFeePercent: 0, // Anyone can distribute for free
});

// Create the split on-chain
const { txHash } = await splitsClient.createSplit({
  recipients: [
    { address: artistAddress, percentAllocation: 80.0 },
    { address: ZAO_TREASURY, percentAllocation: 10.0 },
    { address: curatorAddress, percentAllocation: 10.0 },
  ],
  distributorFeePercent: 0,
});

// Use splitAddress as payoutRecipient in Zora create1155
```

## Split Types for Different Scenarios

### Standard Split (Most Common)
- **Use for:** Single artist releases, collaborations
- Artist gets 80%, ZAO Treasury 10%, curator who submitted the track 10%
- Immutable — trustless, no admin can change allocations

### Waterfall Split (Label/Advance Recoup)
- **Use for:** When ZAO Treasury funds an artist's release
- Treasury recoups investment first, then standard split kicks in
- Example: Treasury gets first 0.5 ETH, then 80/10/10 split after

### Liquid Split (Dynamic Ownership)
- **Use for:** Community-owned releases, DAO-curated compilations
- Split ownership represented as ERC-20 tokens
- Governance can vote to change allocations

### Swapper
- **Use for:** Artists who want stablecoin (USDC) payouts
- Auto-converts ETH to USDC on withdrawal
- Uses Uniswap under the hood

## ZAO OS Default Split Templates

```typescript
// community.config.ts addition
export const splitTemplates = {
  standard: {
    artist: 80,
    treasury: 10,
    curator: 10,
  },
  collaboration: {
    artist1: 40,
    artist2: 40,
    treasury: 10,
    curator: 10,
  },
  compilation: {
    artists: 70, // Split equally among all artists
    treasury: 20,
    curator: 10,
  },
};
```

## Supported Chains

| Chain | Status | ZAO Relevance |
|-------|--------|---------------|
| **Base** | Full support | Primary — ZOUNZ + Zora mints |
| **Optimism** | Full support | Respect tokens live here |
| **Ethereum** | Full support | High-value 1/1 drops |
| **Arbitrum** | Full support | Alternative L2 |
| **Zora** | Full support | Zora-native mints |
| **World Chain** | Full support | Future expansion |

## Integration with Zora (The Key Pattern)

```typescript
// 1. Create split
const { splitAddress } = await splitsClient.predictImmutableSplitAddress({...});

// 2. Use split as payout on Zora mint
const { parameters } = await creatorClient.create1155({
  token: {
    payoutRecipient: splitAddress, // ← THIS IS THE MAGIC
    // ...
  },
});

// 3. Revenue auto-flows to split contract on every mint
// 4. Anyone can call distribute() to push funds to recipients
```

## Revenue Tracking

```typescript
// Check split balances
const balances = await splitsClient.getSplitBalance({
  splitAddress,
  token: '0x0000000000000000000000000000000000000000', // ETH
});

// Get earnings for a specific recipient
const earnings = await splitsClient.getSplitEarnings({
  splitAddress,
  address: artistAddress,
});
```

## Data: 0xSplits by the Numbers

- **$500M+** processed through splits lifetime
- **6,000+** splits on Zora's L2 alone
- **Clients:** Sound.xyz (before shutdown), Songcamp, Catalog, Zora, many more
- **v2** contracts are upgradeable, v1 immutable (both available)

## ZAO OS Implementation Plan

1. Add `@0xsplits/splits-sdk` to package.json
2. Create `src/lib/music/splits.ts` — client setup + helper functions
3. Add split templates to `community.config.ts`
4. Build `MintTrack.tsx` form with split configuration UI
5. Connect to Zora `create1155` with split as `payoutRecipient`
6. Add artist earnings dashboard to profile page

## Sources

- [0xSplits SDK Docs](https://docs.splits.org/sdk)
- [0xSplits SDK npm](https://www.npmjs.com/package/@0xsplits/splits-sdk)
- [0xSplits GitHub](https://github.com/0xSplits)
- [Zora + Splits Integration Blog](https://splits.org/blog/zora-integration/)
- [0xSplits Mirror](https://0xsplits.mirror.xyz/)
- [Splits Changelog](https://splits.org/changelog/)
- [Transient Labs: What is 0xSplits](https://support.transientlabs.xyz/en/articles/10593476-what-is-0xsplits-and-how-we-use-it-at-transient-labs)
