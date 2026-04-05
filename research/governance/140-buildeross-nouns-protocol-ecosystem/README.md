# 140 — BuilderOSS: The Complete Nouns Builder Protocol Ecosystem

> **Status:** Research complete
> **Date:** March 26, 2026
> **Goal:** Map every repo in BuilderOSS and how ZAO OS can leverage the full protocol for ZOUNZ and music NFT distribution

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Template app** | USE `builder-template-app` (MIT, Next.js, TypeScript) as reference for ZOUNZ governance UI improvements |
| **Farcaster bot** | USE `builder-farcaster` (@builderbot) — auto-notifies ZOUNZ members of proposals/votes via Farcaster DCs |
| **Protocol contracts** | ALREADY USING — ZOUNZ is deployed on these contracts on Base |
| **Archived repos** | SKIP — `builder-utils`, `nouns-builder-components`, `noun-site` are archived. Functionality merged into monorepo. |

## BuilderOSS Repository Map

[github.com/BuilderOSS](https://github.com/BuilderOSS) — 10 repos total (5 active, 5 archived)

### Active Repositories

| Repo | Lang | Stars | License | Last Updated | Purpose |
|------|------|-------|---------|-------------|---------|
| **nouns-builder** | TypeScript | 105 | MIT | Mar 19, 2026 | Core monorepo — the nouns.build web app |
| **builder-farcaster** | TypeScript | — | Apache-2.0 | Mar 10, 2026 | @builderbot — Farcaster notification bot for all Nouns Builder DAOs |
| **nouns-builder-docs** | MDX | 2 | — | Jan 15, 2026 | Documentation site |
| **nouns-protocol** | Solidity | — | MIT | Dec 8, 2025 | Smart contracts (fork of ourzora/nouns-protocol) |
| **builder-template-app** | TypeScript | 1 | MIT | Oct 27, 2025 | Standalone Next.js template for DAO frontends |

### Archived Repositories (Do Not Use)

| Repo | Why Archived |
|------|-------------|
| nouns-builder-components | Merged into monorepo |
| noun-site | Replaced by builder-template-app |
| builder-utils | React hooks merged into monorepo |
| nouns-builder-site | Old site, replaced |
| builder-components-embed | Old embeddable components |

## builder-template-app Deep Dive

**This is the most relevant repo for ZAO OS.** MIT-licensed Next.js app for building custom DAO frontends.

**Tech stack:** Next.js, TypeScript (97%), pnpm, Vercel-ready

**Setup:**
```bash
pnpm install
cp sample.env .env.local  # Configure
pnpm fetch-dao            # Pulls contract data from chain
pnpm dev                  # Start dev server
```

**Required env vars:**
- `NEXT_PUBLIC_NETWORK_TYPE` — "mainnet"
- `NEXT_PUBLIC_CHAIN_ID` — 8453 (Base)
- `NEXT_PUBLIC_DAO_TOKEN_ADDRESS` — `0xCB80Ef04DA68667c9a4450013BDD69269842c883` (ZOUNZ)
- `PINATA_API_KEY` — IPFS uploads
- `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` — wallet connection

**Key features:**
- Multi-chain: Ethereum (1), Base (8453), Optimism (10), Zora (7777777)
- Auto-fetches DAO config from on-chain contracts
- Favicon generated from DAO imagery
- Optional: Tenderly tx simulation, AI tx summaries, Redis caching

**ZAO OS opportunity:** Port governance UI patterns from this template into `src/components/zounz/` to improve the existing ZOUNZ auction and proposals components.

## builder-farcaster (@builderbot) Deep Dive

**Directly relevant for ZAO OS — auto-notifications for ZOUNZ governance.**

**What it does:** Monitors all Nouns Builder DAOs across Ethereum, Base, Optimism, Zora. Sends personalized Farcaster DCs to members about:
- New proposal creation
- Proposal updates
- Voting period start/end

**Tech:** Commander.js CLI, SQLite + Prisma, GraphQL subgraph queries, Warpcast API

**ZAO OS integration options:**
1. **Use @builderbot directly** — ZOUNZ members just follow @builderbot on Farcaster
2. **Fork and customize** — Add music-specific notifications (new track NFT minted, auction ending)
3. **Adapt patterns** — Use the GraphQL subgraph queries to build ZOUNZ notifications into ZAO OS's existing notification system

## nouns-protocol Smart Contracts

**Already deployed for ZOUNZ on Base.** The 5-contract suite:

| Contract | Address (Base) | Purpose |
|----------|---------------|---------|
| Token (ERC-721Votes) | `0xCB80Ef04DA68667c9a4450013BDD69269842c883` | NFT + voting power |
| Auction | `0xb2d43035c1d8b84bc816a5044335340dbf214bfb` | English auctions |
| Governor | `0x9d98ec4ba9f10c942932cbde7747a3448e56817f` | Proposals + voting |
| Treasury | `0x2bb5fd99f870a38644deafe7e4ecb62ac77a213f` | Timelock + funds |
| MetadataRenderer | (on-chain) | Generative NFT images |

**Solidity tooling:** Foundry, Slither (security analysis), solhint (linting)

## How ZAO OS Uses BuilderOSS Today

**Already built (in codebase):**
- `src/lib/zounz/contracts.ts` — ABI definitions for Auction, Governor, Token
- `src/components/zounz/ZounzAuction.tsx` — Auction bidding UI
- `src/components/zounz/ZounzProposals.tsx` — Governance dashboard
- `src/app/api/zounz/proposals/route.ts` — Proposals API
- Wagmi config supports Base chain

**Not yet built (opportunities from BuilderOSS):**
- Farcaster notification integration (builder-farcaster patterns)
- Full governance UI (template-app has more features)
- Treasury dashboard (balance, tx history)
- Proposal creation flow (currently links to nouns.build)

## Sources

- [BuilderOSS GitHub](https://github.com/BuilderOSS)
- [Nouns Builder App](https://nouns.build/)
- [Builder Template App](https://github.com/BuilderOSS/builder-template-app)
- [Builder Farcaster Bot](https://github.com/BuilderOSS/builder-farcaster)
- [Nouns Protocol Contracts](https://github.com/BuilderOSS/nouns-protocol)
- [Nouns Builder Docs](https://docs.nouns.build/)
- [ZOUNZ on Nouns Builder](https://nouns.build/dao/base/0xCB80Ef04DA68667c9a4450013BDD69269842c883)
