# 36 — Lens Protocol Deep Dive

> **Status:** Research complete
> **Date:** March 2026
> **Goal:** Full Lens V3 architecture, SDK, collect/monetize model, and ZAO OS integration plan

---

## Key Finding: Lens Collects = Music Monetization Layer for ZAO

Lens V3's collect system lets artists attach configurable pricing to posts. Curators who share collectable posts earn referral fees. This directly complements ZAO's Respect-based curation model — **something Farcaster doesn't natively support.**

No dedicated music apps exist on Lens. ZAO could be the first music community bridging Farcaster + Lens.

---

## 1. Lens V3 Architecture (Lens Chain)

### Migration from Polygon

| Aspect | V1/V2 (Polygon) | V3 (Lens Chain) |
|--------|-----------------|-----------------|
| Chain | Polygon PoS | ZKSync ZK Stack rollup |
| Profiles | NFTs (ERC-721) | EVM accounts (smart wallets) |
| Architecture | Monolithic LensHub | Modular independent primitives |
| Storage | IPFS/Arweave | Grove (decentralized) |
| Gas | Users pay MATIC | Gasless via app sponsorship |
| Extensibility | Modules | Rules + Actions (composable) |

### Core Primitives

| Primitive | What It Does |
|-----------|-------------|
| **Accounts** | EVM address = profile. Smart wallets with "account managers" (delegates). |
| **Usernames** | Decentralized naming (`lens/stani`). Anyone can deploy custom namespaces. |
| **Graphs** | On-chain social graph contracts. Apps can deploy custom graphs. |
| **Feeds** | On-chain content streams. Custom rules (token-gating, membership). |
| **Groups** | Community organization with membership, roles, banning, join rules. |
| **Rules** | Smart contracts enforcing conditions. Chainable AND/OR logic. |
| **Actions** | Any smart contract interaction — collect, tip, swap, mint, bridge. |

### Gas Model
- Apps sponsor gas for users via `setAppSponsorship()`
- Social interactions cost fractions of a cent on Lens Chain
- Users pay zero gas when app sponsors

### Stats
- 650,000 accounts, ~45,000 weekly active users
- $45M total funding ($31M from Lightspeed Faction Dec 2024)
- Mask Network acquired consumer product stewardship (Jan 2026)

---

## 2. SDK & API

### @lens-protocol/client v3.0.0-alpha.0

| Package | Purpose |
|---------|---------|
| `@lens-protocol/client` | Core client + actions + auth |
| `@lens-protocol/graphql` | Typed GraphQL queries/mutations |
| `@lens-protocol/react` | React bindings (WIP) |
| `@lens-protocol/types` | 100+ TypeScript types |
| `@lens-chain/sdk` | Chain interaction (v1.0.0) |

**Peer deps:** `viem` (^2.21.53) or `ethers` (^6.13.4)

### API Endpoints

| Environment | Endpoint |
|-------------|----------|
| Mainnet | `https://api.lens.xyz/graphql` |
| Testnet | `https://api.testnet.lens.xyz/graphql` |

### Auth Flow
1. Create PublicClient (read-only)
2. EIP-712 wallet signature → access + refresh tokens
3. SessionClient for read/write
4. `enableSignless()` for gasless UX (no per-tx popups)
5. `switchAccount()` for multi-account

### Key Action Modules

`account`, `authentication`, `post`, `feed`, `follow`, `group`, `sponsorship`, `actions`, `notifications`, `metadata`, `transactions`, `transfer`, `username`

---

## 3. Apps Ecosystem

| App | Status | Focus | License |
|-----|--------|-------|---------|
| **Hey** (Lenster) | Active | Twitter-like feed | AGPL (29.5K stars) |
| **Orb** | Active (50K+ MAU) | Mobile-first | Proprietary (MaskDAO) |
| **Tape** | Active | Video/audio | AGPL (4.5K stars) |
| **Phaver** | Active | Cross-protocol (Lens + Farcaster) | Proprietary |
| **Buttrfly** | Active | Cross-protocol bridge | Proprietary |

**No dedicated music apps on Lens.** This is an opportunity gap for ZAO.

---

## 4. Bonsai Token

- **DN-404** hybrid: ERC-20 + ERC-721. Every 100K BONSAI = 1 BONSAI NFT auto-minted.
- **100M total supply**, 60% community, 40% team/investors/treasury
- **~77% market share** of paid mints on Lens
- Used for: collecting posts, tipping, swapping, governance

---

## 5. Collect/Monetize Model

### How Collects Work (V3)

1. Creator publishes post with collect Action + Rules attached
2. Rules specify: price, currency (BONSAI/WETH), supply limit, time limit, follower-only
3. Collector calls collect action, pays specified price
4. On-chain record created linking collector to post
5. Creator receives payment minus referral fees

### Pricing Options
- **Free collect:** On-chain attestation, no cost
- **Fixed price:** Set amount in chosen token
- **Custom logic:** Auctions, bonding curves, Dutch auctions via custom Rules

### Referral Fees for Curators
When a curator shares a collectable post and someone collects via that share → curator earns a referral fee (percentage set by creator).

**This creates a curation economy** — directly maps to ZAO's Respect model:
- High-Respect curators' shares get amplified → more collects → more referral earnings
- Artists monetize through collects, curators earn for discovery

### Comparison

| Feature | Sound.xyz (dead) | Zora | Lens Collects |
|---------|-----------------|------|---------------|
| Focus | Music NFTs | General media | Social post monetization |
| Creator fee | 100% to artist | Configurable | Configurable |
| Referral | Curator rewards | Protocol rewards | In-protocol referral fees |
| Social graph | None | Minimal | Full social protocol |
| Status | Maintenance mode | Active | Active |

---

## 6. Integration Plan for ZAO OS

### Cross-Post Architecture

```
ZAO OS Compose Bar
      │
      ├──► Neynar API (Farcaster) — already built
      │
      └──► Lens SDK post() — new integration
            ├── Store content in Grove
            ├── Attach collect Action (optional)
            └── Set referral rules
```

### Identity Bridging
- Same wallet controls both Farcaster FID and Lens Account
- Store mapping: `{ wallet_address, farcaster_fid, lens_account_address }` in Supabase
- Airstack API can resolve wallet → FID and wallet → Lens account

### What ZAO Gains from Lens

| Benefit | Details |
|---------|---------|
| **Monetization** | Collect modules let artists sell music posts — Farcaster doesn't natively support this |
| **Curator economics** | Referral fees reward curators — aligns with Respect philosophy |
| **Larger reach** | 650K accounts, 45K WAU |
| **On-chain social graph** | Fully on-chain, portable |
| **Groups primitive** | Create a Lens-native ZAO group with membership rules |
| **No music competition** | No dedicated music apps on Lens — ZAO could be first |

### Effort Estimate

| Task | Effort |
|------|--------|
| Register ZAO as Lens App | 2-4 hours |
| Lens auth (EIP-712) | 1-2 days |
| Cross-post text + images | 1-2 days |
| "Post to Lens" toggle | 0.5 day |
| Collect Actions on music posts | 2-3 days |
| Identity mapping table | 1 day |
| Lens feed display | 2-3 days |
| **MVP (cross-post only)** | **~1 week** |
| **Full with collects + feed** | **~2-3 weeks** |

### Recommended Phasing

**Phase 1 — Cross-Post (1 week):** Lens auth, "Post to Lens" toggle, text + image cross-posting, identity mapping

**Phase 2 — Monetization (1-2 weeks):** Collect Actions on music posts, configurable pricing, referral fees for curators

**Phase 3 — Native Features (2+ weeks):** ZAO Lens Group, Lens feed view in ZAO OS, Bonsai tipping

---

## Sources

- [Lens Chain Launch (Avail)](https://blog.availproject.org/lens-chain-goes-live-scaling-socialfi-with-avail-and-zksync/)
- [Introducing New Lens](https://lens.xyz/news/introducing-the-new-lens)
- [Lens SDK npm](https://www.npmjs.com/package/@lens-protocol/client)
- [Lens GraphQL API](https://api.lens.xyz/graphql)
- [Hey GitHub (29.5K stars)](https://github.com/heyxyz/hey)
- [Tape GitHub (4.5K stars)](https://github.com/tapexyz/tape)
- [Bonsai Token (CoinGecko)](https://www.coingecko.com/en/coins/bonsai-token)
- [Mask Network Acquires Lens](https://defi-planet.com/2026/01/mask-network-acquires-lens-protocol-stewardship/)
