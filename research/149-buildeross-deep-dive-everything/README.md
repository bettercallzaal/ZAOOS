# 149 — BuilderOSS Deep Dive: Everything ZAO Can Use

> **Status:** Research complete
> **Date:** March 26, 2026
> **Goal:** Map every package, hook, component, and utility in the BuilderOSS ecosystem and identify what ZAO OS should adopt

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **@buildeross/sdk** | USE — Contract ABIs, subgraph queries, EAS integration. Replace hand-written ABIs in `src/lib/zounz/contracts.ts`. |
| **@buildeross/hooks** | USE — React hooks for Web3 + UI. Replaces custom wagmi patterns in `ZounzAuction.tsx`. |
| **@buildeross/ipfs-service** | USE — IPFS integration already built. Use for music NFT metadata before Arweave migration. |
| **@buildeross/zord** | EVALUATE — Design system with Vanilla Extract. ZAO uses Tailwind, so cherry-pick patterns not components. |
| **Auction UI package** | USE — Drop-in auction components. Better than current `ZounzAuction.tsx` hand-rolled implementation. |
| **Proposal UI package** | USE — Full proposal creation + voting UI. Currently ZAO links out to nouns.build — bring it in-app. |
| **Subgraph** | USE — Already deployed on Goldsky for Base. Query ZOUNZ data via GraphQL instead of direct RPC. |
| **builder-farcaster** | USE — @builderbot sends Farcaster DCs for proposals. ZOUNZ members just follow the bot. |

## The Complete BuilderOSS Monorepo Map

### Apps (2)

| App | Purpose | ZAO Relevance |
|-----|---------|---------------|
| **web** | The nouns.build frontend — full DAO management app | Reference for governance UI patterns, don't fork directly |
| **subgraph** | GraphQL indexer deployed on Goldsky | USE — query ZOUNZ proposals, auctions, token data via GraphQL |

### Core Packages (17)

#### Tier 1: Directly Useful for ZAO OS

| Package | npm | Purpose | How ZAO Uses It |
|---------|-----|---------|-----------------|
| **@buildeross/sdk** | Published | Contract ABIs, subgraph queries, EAS attestation integration | Replace `src/lib/zounz/contracts.ts` hand-written ABIs. Get typed contract interactions. |
| **@buildeross/hooks** | Published | React hooks for Web3 (auction state, proposal data, voting) + UI (countdown, pagination) | Replace custom wagmi hooks in `ZounzAuction.tsx` and `ZounzProposals.tsx` |
| **@buildeross/ipfs-service** | Published | IPFS upload + gateway resolution | Replace ad-hoc IPFS gateway fallbacks in `src/lib/hats/tree.ts`. Use for music metadata uploads. |
| **@buildeross/utils** | Published | Web3 utilities, ENS helpers, Wagmi integration, Yup validation schemas | Useful for address formatting, ENS resolution, form validation |
| **@buildeross/constants** | Published | Centralized chain configs, API endpoints, contract addresses by chain | Replace scattered chain config. Single source of truth for Base chain settings. |
| **@buildeross/types** | Published | TypeScript types for chains, proposals, auctions, DAOs | Type-safe ZOUNZ interactions |

#### Tier 2: UI Components to Adopt

| Package | Purpose | How ZAO Uses It |
|---------|---------|-----------------|
| **auction-ui** | Auction display, bid placement, countdown, settlement | Replace `ZounzAuction.tsx` (265 lines) with tested components |
| **dao-ui** | DAO dashboard, member list, treasury display | Build ZOUNZ dashboard page |
| **proposal-ui** | Proposal display, vote casting, execution status | Replace `ZounzProposals.tsx` (153 lines) — bring voting IN-APP |
| **create-proposal-ui** | Proposal creation wizard (targets, values, calldatas) | Enable in-app proposal creation (currently links to nouns.build) |
| **create-dao-ui** | DAO creation flow | Not needed — ZOUNZ already deployed |
| **feed-ui** | Activity feed for DAO events | Show ZOUNZ activity in ZAO OS feed |
| **ui** | Shared base components | Foundation for other UI packages |

#### Tier 3: Infrastructure

| Package | Purpose | ZAO Relevance |
|---------|---------|---------------|
| **@buildeross/zord** | Design system (Vanilla Extract) | ZAO uses Tailwind — skip the design system, cherry-pick layout patterns |
| **@buildeross/stores** | Shared state management | Evaluate — ZAO uses React Query, may not need |
| **@buildeross/analytics** | Google Analytics, Segment, Vercel Analytics | Skip — ZAO has its own analytics approach |
| **@buildeross/blocklist** | OFAC sanctions compliance | USE if adding wallet-based payments (required for compliance) |
| **swap** | Token swap utilities | Skip for now — future DEX integration |

### Standalone Repos (4 active)

| Repo | What It Is | ZAO Action |
|------|-----------|------------|
| **builder-template-app** | MIT Next.js standalone DAO frontend | REFERENCE — port `fetch-dao` pattern and env var structure |
| **builder-farcaster** | @builderbot — Farcaster notification bot | USE DIRECTLY — ZOUNZ members follow @builderbot, get proposal notifications |
| **nouns-protocol** | Solidity contracts (fork of ourzora/nouns-protocol) | ALREADY DEPLOYED — ZOUNZ runs on these contracts on Base |
| **nouns-builder-docs** | Astro/Starlight docs site | REFERENCE for understanding protocol details |

## Subgraph: The Hidden Gem

The BuilderOSS subgraph is already deployed on **Goldsky** for Base. This means ZAO OS can query ZOUNZ data via GraphQL instead of making RPC calls.

**Current approach (slow, limited):**
```typescript
// src/app/api/zounz/proposals/route.ts — direct RPC calls
const proposalCount = await publicClient.readContract({
  address: GOVERNOR, abi: governorAbi, functionName: 'proposalCount'
});
```

**Better approach (fast, rich data):**
```graphql
# Query ZOUNZ subgraph on Goldsky
query ZounzDAO {
  dao(id: "0xcb80ef04da68667c9a4450013bdd69269842c883") {
    proposals {
      id
      title
      description
      status
      forVotes
      againstVotes
      abstainVotes
      proposer { id }
      voteStart
      voteEnd
    }
    auctionConfig {
      duration
      reservePrice
    }
    tokens {
      id
      owner { id }
      mintedAt
    }
  }
}
```

**Benefits:**
- All proposals with full details in one query
- Historical auction data
- Token ownership graph
- No ABI wrangling
- Paginated, filterable

## What ZAO OS Has vs What BuilderOSS Offers

| Feature | ZAO OS Today | BuilderOSS Offers |
|---------|-------------|-------------------|
| Auction UI | `ZounzAuction.tsx` (265 lines, hand-rolled) | `auction-ui` package (tested, feature-complete) |
| Proposal display | `ZounzProposals.tsx` (153 lines, basic stats) | `proposal-ui` + `create-proposal-ui` (full voting + creation) |
| Contract ABIs | `contracts.ts` (61 lines, hand-written) | `@buildeross/sdk` (typed, all 5 contracts, all chains) |
| Data fetching | Direct RPC calls | GraphQL subgraph (faster, richer data) |
| IPFS | Ad-hoc gateway fallbacks | `@buildeross/ipfs-service` (upload + resolve) |
| Proposal creation | Links to nouns.build | In-app wizard via `create-proposal-ui` |
| Notifications | None | @builderbot Farcaster DCs |
| Treasury view | None | `dao-ui` treasury dashboard |
| Activity feed | None | `feed-ui` for DAO events |

## The @buildeross/sdk Package in Detail

The SDK provides:

1. **Contract ABIs** — All 5 Nouns Builder contracts typed for TypeScript
2. **Subgraph queries** — Pre-built GraphQL queries for all DAO data
3. **EAS integration** — Ethereum Attestation Service for on-chain attestations
4. **Chain configs** — Ethereum, Base, Optimism, Zora pre-configured
5. **Type definitions** — Full TypeScript types for proposals, auctions, tokens

```typescript
// Example: Using @buildeross/sdk instead of hand-written ABIs
import { auctionAbi, governorAbi, tokenAbi } from '@buildeross/sdk';
// vs current: manually defining ABIs in src/lib/zounz/contracts.ts
```

## Nouns Protocol: The 5-Contract Architecture

Already deployed for ZOUNZ on Base. Here's how they work together:

```
Manager (Deployer)
    │
    ├─► Token (ERC-721Votes)
    │   - Generative NFT images
    │   - Voting power = 1 per token
    │   - Founder vesting allocation
    │
    ├─► MetadataRenderer
    │   - On-chain SVG rendering
    │   - Property layers (art)
    │   - contractURI for collection metadata
    │
    ├─► Auction
    │   - English auction (one at a time)
    │   - Configurable duration + reserve price
    │   - 100% proceeds → Treasury
    │   - Auto-settle + create next auction
    │
    ├─► Governor
    │   - Proposal creation (requires threshold)
    │   - Voting (for/against/abstain)
    │   - Quorum requirement (basis points)
    │   - Timelock delay before execution
    │   - Founder veto power (early stage)
    │
    └─► Treasury (Timelock)
        - Holds all auction proceeds
        - Executes approved proposals
        - Configurable timelock delay
```

**Key config options ZAO uses:**
- **Chain:** Base (8453)
- **Auction duration:** Configurable via contract
- **Governance thresholds:** Basis points (adapts to growing supply)
- **Founder allocation:** Every Nth token to founders (vesting schedule)

## Implementation Plan for ZAO OS

### Phase 1: SDK Migration (2-3 hours)
1. `npm install @buildeross/sdk @buildeross/types @buildeross/constants`
2. Replace `src/lib/zounz/contracts.ts` with SDK imports
3. Update `ZounzAuction.tsx` and `ZounzProposals.tsx` to use SDK ABIs

### Phase 2: Subgraph Integration (4-6 hours)
1. Add Goldsky subgraph endpoint to env vars
2. Create `src/lib/zounz/subgraph.ts` — GraphQL client for ZOUNZ data
3. Replace RPC-based API routes with subgraph queries
4. Add proposal details, auction history, token ownership

### Phase 3: In-App Governance (8-12 hours)
1. Install `proposal-ui` and `create-proposal-ui` packages
2. Adapt to Tailwind (packages use Vanilla Extract)
3. Build in-app proposal creation flow
4. Build in-app voting interface
5. Remove links to nouns.build

### Phase 4: Notifications (2 hours)
1. Document how ZOUNZ members follow @builderbot on Farcaster
2. Optionally fork builder-farcaster for custom ZAO notifications

## Sources

- [BuilderOSS GitHub](https://github.com/BuilderOSS)
- [Nouns Builder Monorepo](https://github.com/BuilderOSS/nouns-builder) — 2,579 commits, 21 contributors, 105 stars
- [Builder Template App](https://github.com/BuilderOSS/builder-template-app)
- [Builder Farcaster](https://github.com/BuilderOSS/builder-farcaster)
- [Nouns Protocol](https://github.com/BuilderOSS/nouns-protocol)
- [Nouns Builder Docs](https://docs.nouns.build/)
- [Nouns Builder App](https://nouns.build/)
- [Nouns Protocol Audit](https://github.com/code-423n4/2022-09-nouns-builder)
- [ZOUNZ DAO](https://nouns.build/dao/base/0xCB80Ef04DA68667c9a4450013BDD69269842c883)
