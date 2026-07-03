# 143 — 0xSplits: Automated Revenue Distribution for ZAO Artists

> **Status:** research-complete
> **Date:** March 26, 2026
> **Topic:** music
> **Type:** contract-integration
> **Original-Query:** How do 0xSplits work? How should ZAO implement 80/10/10 splits (artist/treasury/curator) for music NFT revenue? (reconstructed). Re-researched 2026-07-03: current Splits product suite + fees + mapping to the ZAO Whitepaper thesis (return ~100% to artists) + ethskills.com.
> **Last-Validated:** 2026-07-03
> **Related-Docs:** 151, 222, 628, 876, 339 (ethskills), 942 (whitepaper outline)
> **Tier:** STANDARD
> **Goal:** Implementation guide for Splits (formerly 0xSplits) integration — automated, fee-free revenue splits for ZAO artists, and the on-chain enforcement of the whitepaper's "return ~100% to artists" thesis

> **Updated 2026-07-03 (re-research):** (1) 0xSplits rebranded to **Splits** (splits.org) and expanded from a payment-splitting protocol into broader self-custodied financial infrastructure (treasury, payroll, accounting, automated payments). (2) Current product suite adds **SplitV2, Warehouse, Vesting, Diversifier, Pass-Through Wallet** beyond the original Split/Waterfall/Liquid/Swapper. (3) Confirmed: **no protocol fees, runs at gas cost** - the single most important fact for the ZAO thesis. (4) Added chains (Polygon). (5) New section: how Splits enforces the whitepaper mission. (6) ethskills.com is covered in doc 339 (see Also See).

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Protocol** | **Splits** (formerly 0xSplits, splits.org). USE it - no protocol fee, runs at gas cost, non-upgradable contracts. The network takes nothing from the artist's split. |
| **SDK** | `@0xsplits/splits-sdk` (npm package name unchanged post-rebrand) — mature, actively maintained |
| **Split type** | Immutable splits for each release — set once, never changes, fully trustless. (Mutable/owner-controlled splits also possible; use immutable for artist releases.) |
| **Default split** | Artist 80% / ZAO Treasury 10% / Curator 10% (configurable per release). Note: treasury's 10% is a network share of the *release*, not a fee on the *artist* - the artist keeps 100% of their 80% with zero deduction downstream. |
| **Chain** | Base — native support, same chain as ZOUNZ and Zora mints. Also Optimism (Respect lives there), Ethereum, Zora, Polygon, Arbitrum. |
| **Advanced** | Waterfall (recoup-first label deals), Swapper (stablecoin payout), Vesting (time-locked release), Diversifier (auto-rebalance a treasury) |

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

### Vesting (added in current suite)
- **Use for:** Time-locked payouts - e.g. a grant or advance that releases to a builder/artist over a schedule
- Handles time-locked token releases to beneficiaries

### Diversifier (added in current suite)
- **Use for:** A treasury that should auto-rebalance incoming revenue into a target portfolio (e.g. keep a stablecoin/ETH ratio)
- Template combining a Split + Swappers for automated portfolio rebalancing

### Pass-Through Wallet (added in current suite)
- **Use for:** Conditional fund routing - an account that forwards funds onward under set conditions
- Template for routing funds through to a downstream split/waterfall

### Under the hood: SplitV2 + Warehouse
- **SplitV2** is the current enhanced Split contract; **Warehouse** batches token distributions and claims (gas-efficient pull payments). The SDK abstracts both - you create a split, funds accrue, anyone calls distribute.

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
| **Polygon** | Full support | Alternative low-fee L2 |
| **World Chain / others** | Supported ("+ more" per docs) | Future expansion |

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

## The whitepaper connection: Splits is how the mission is enforced on-chain

The ZAO Whitepaper's spine is "return as close to 100% as possible of profit, data, and IP to independent artists, and take no fees from what they make." Splits is the mechanism that makes the "no fees" and "profit" halves literally true in code, not just a promise.

- **No protocol fee = the network takes nothing.** Splits charges no protocol fee (gas only). So when revenue flows through a split, ZAO/the protocol skims zero. The only allocations are the ones the artist agreed to. This is the on-chain proof behind the manifesto line **"I take no one's cut."**
- **Transparent, consented, opt-in collaboration.** The whitepaper says ownership is absolute and profit-sharing is opt-in. A collaboration split (e.g. 40/40/10/10) is exactly that: every collaborator's share is set on-chain, visible to all, and agreed before a cent moves. No back-room label math.
- **Instant, trustless payout.** Immutable splits mean no admin can change allocations and anyone can call `distribute()`. The artist does not wait on a label's accounting cycle. This is the same shape as WaveWarZ, where the artist is paid instantly and ~98.5% of every trade stays in the ecosystem - WaveWarZ's payout split is this pattern, native on Solana; Splits is the EVM equivalent for releases and collaborations on Base/Optimism.
- **The honest nuance for the doc:** the default 80/10/10 puts 10% to the ZAO Treasury. That is a network share of a *release the network helped make*, agreed up front - not a fee skimmed off the artist's 80%. The artist keeps 100% of their share with zero downstream deduction. State it that way so "no fees" stays defensible (see the whitepaper's honest-limitations discipline).
- **Splits covers profit; pair it with the other two legs.** Splits routes the money. The whitepaper's "data" and "IP" legs need separate rails (artist-owned audience data, IP that reverts to the creator - see doc 876 A-Corp model). Splits is one third of the "100%" promise, the cleanest third.

**Where this plugs into the build:** the collaborative-revenue-tracks idea in the whitepaper (Draft 3's "self-managed 100% vs collaborative shared-cut" tracks) maps directly to two split templates - a solo immutable split (artist ~100%) and a collaboration split (transparent shares). Ship both as `community.config.ts` templates (see below).

## Related: ethskills.com (agent build knowledge)

ethskills.com (Austin Griffith / BuidlGuidl, MIT) is a knowledge-reference-for-AI-agents system: 24+ fetchable markdown skill files an agent reads into context before shipping onchain, so it does not produce confident-but-wrong Solidity. It is the same pattern as ZAO's own `zabal-games-context` skill and is directly useful for ZABAL Gamez builders vibe-coding onchain. Full coverage is in **doc 339 (Austin Griffith CLAWD & ETHSkills Agent Patterns, CANONICAL)** - not duplicated here.

## Data: Splits by the Numbers

- **No protocol fee** - runs at gas cost; non-upgradable protocol contracts (verified splits.org/protocol/docs, 2026-07-03)
- **Chains:** Ethereum, Optimism, Base, Zora, Polygon, Arbitrum, + more
- **$500M+** processed through splits lifetime (figure from prior research; re-verify before citing publicly)
- **Product suite:** Split, SplitV2, Warehouse, Waterfall, Vesting, Swapper, Liquid Split, Diversifier, Pass-Through Wallet
- **Rebrand:** 0xSplits -> Splits (splits.org); now positions as self-custodied financial infrastructure (treasury, payroll, accounting), not only splitting
- **A split can be immutable (trustless, no admin) or mutable (owner-controlled).** Use immutable for artist releases. (Correction to the earlier "v2 upgradeable" note - mutability is a per-split choice, not a version.)

## ZAO OS Implementation Plan

1. Add `@0xsplits/splits-sdk` to package.json
2. Create `src/lib/music/splits.ts` — client setup + helper functions
3. Add split templates to `community.config.ts`
4. Build `MintTrack.tsx` form with split configuration UI
5. Connect to Zora `create1155` with split as `payoutRecipient`
6. Add artist earnings dashboard to profile page

## Also See

- [Doc 151](../151-zounz-distribution-without-zora/) - ZOUNZ distribution (Arweave + Thirdweb + Splits)
- [Doc 222](../../business/222-payment-infrastructure-stripe-coinbase/) - payment infra (Stripe/Coinbase/Coinflow/Splits)
- [Doc 628](../../business/628-web3-streaming-zabal-empire-bridge/) - streaming -> onchain ZABAL scoring + Splits pipeline
- [Doc 876](../../business/876-artist-corporations-acorp-model-zao/) - A-Corp model (the IP/ownership legs Splits does not cover)
- [Doc 339](../../agents/339-austin-griffith-clawd-ethskills-agent-patterns/) - ETHSkills + CLAWD agent patterns (the ethskills.com home)
- [Doc 942](../../governance/942-zao-fractal-whitepaper-outline-v2/) - the ZAO Whitepaper outline (this doc supplies the "profit" leg of its thesis)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Ship two split templates (solo ~100% + transparent collaboration) in `community.config.ts` and a `src/lib/music/splits.ts` helper | @Zaal | PR | Next release |
| Add a "Splits enforces the mission" line to the whitepaper's Fractal/lanes section (the profit leg) | @Claude | Doc edit | With whitepaper v1.0 |
| Re-verify the "$500M+ processed" figure against splits.org before any public citation | @Claude | Verify | Before publish |
| Point ZABAL Gamez builders to ethskills.com + doc 339 for onchain agent build knowledge | @Zaal | Bot/context | Ongoing |

## Sources

- [Splits (homepage)](https://splits.org) [FULL - fetched 2026-07-03: products, financial-infra positioning]
- [Splits Protocol Docs](https://splits.org/protocol/docs/) [FULL - fetched 2026-07-03: full product suite, chains, "no protocol fees, runs at gas cost", non-upgradable]
- [ethskills.com](https://ethskills.com/) [FULL - fetched 2026-07-03: agent-skill knowledge reference, Austin Griffith/BuidlGuidl, MIT]
- [Splits SDK Docs](https://docs.splits.org/sdk) [PARTIAL - redirects to splits.org/protocol/docs; SDK page not re-fetched this pass]
- [Splits SDK npm](https://www.npmjs.com/package/@0xsplits/splits-sdk) [prior research]
- [Splits GitHub](https://github.com/0xSplits) [prior research]
- [ethskills GitHub](https://github.com/austintgriffith/ethskills) [FULL via site]
- [Transient Labs: What is 0xSplits](https://support.transientlabs.xyz/en/articles/10593476-what-is-0xsplits-and-how-we-use-it-at-transient-labs) [prior research]
