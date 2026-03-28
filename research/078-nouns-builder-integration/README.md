# Research 78: Nouns Protocol & Nouns Builder Integration

**Date:** 2026-03-19
**Status:** Complete
**Relevance:** Governance infrastructure, DAO tooling, treasury management for ZAO OS

---

## 1. Nouns Protocol Basics

### How It Works

Nouns is a generative NFT project on **Ethereum mainnet** that operates as an on-chain DAO. The core mechanic:

- **One Noun is auctioned every 24 hours, forever.** Settlement of one auction kicks off the next.
- **100% of auction proceeds** go directly to the DAO treasury (no team cut).
- **Each Noun = 1 governance vote.** Votes are non-transferable (sell your Noun, lose the vote) but delegatable.
- **Governance** is a fork of Compound Governor Bravo. Proposals are submitted, voted on, and executed on-chain.
- **Treasury** is a Timelock contract (fork of Compound Timelock) that executes approved governance proposals.

### Chain

Nouns DAO operates exclusively on **Ethereum mainnet**.

- Nouns DAO Treasury: `0x0BC3807Ec262cB779b38D65b38158acC3bfeDe10`
- Main site: https://nouns.wtf

### Legal Structure

Nouns DUNA (Decentralized Unincorporated Nonprofit Association) was established in Wyoming via Proposal 727, giving the DAO legal standing to hold assets, enter contracts, and participate in legal actions.

### Smart Contract Architecture (Nouns DAO)

| Contract | Purpose |
|----------|---------|
| **NounsToken** | ERC-721 with voting (fork of Compound's Comp, modified to ERC-721) |
| **NounsAuctionHouse** | Continuous English auctions, 24h per Noun |
| **NounsDAOLogicV2** | Governor Bravo fork for proposal/voting |
| **NounsDAOExecutor** | Treasury + Timelock (Compound Timelock fork, Solidity 0.8.x) |

---

## 2. Nouns Builder / BuilderOSS

### What Is It

Nouns Builder is a **no-code, free, open-source tool** (originally built by Zora) that lets anyone create their own Nouns-style DAO. It deploys a full suite of governance smart contracts, sets up NFT auctions, and provides a hosted frontend at `nouns.build`.

- **Main platform:** https://nouns.build
- **Documentation:** https://docs.nouns.build
- **Forum:** https://forum.nouns.build
- **No protocol fee** -- fully free public good

### BuilderDAO

BuilderDAO governs the Nouns Builder protocol itself. It runs its own daily auctions through the system it built. BuilderDAO was seeded with a 1,000 ETH grant from Nouns DAO.

- BuilderDAO on nouns.build: `https://nouns.build/dao/ethereum/0xdf9b7d26c8fc806b1ae6273684556761ff02d422`

### Supported Chains

Based on the URL structure (`/dao/{chain}/...`) and observed DAOs:

| Chain | Status |
|-------|--------|
| **Ethereum mainnet** | Confirmed (chainId: 1) |
| **Base** | Confirmed (visible on explore page filter) |
| **Zora Network** | Likely (Zora built the tool, OP Stack L2) |
| **Sepolia testnet** | Confirmed (recommended for testing) |

The URL pattern is: `nouns.build/dao/{network}/{token-address}`

---

## 3. Smart Contracts Deployed by Builder

When you create a DAO via Nouns Builder, the **Manager** factory contract deploys **5 contracts**:

### Contract Suite

| Contract | Role |
|----------|------|
| **Manager** | Factory contract -- calls `deploy()` to create all other contracts. Singleton, not per-DAO. |
| **Token** | ERC-721 NFT with built-in voting power (`ERC721Votes`). Founder vesting allocations. |
| **MetadataRenderer** | Generates `tokenURI` and `contractURI` on-chain from uploaded artwork layers. |
| **Auction** | Sequential English auctions with configurable reserve price and duration. |
| **Governor** | Proposal/voting system using basis points for thresholds (supports dynamic supply). |
| **Treasury** | Timelock contract that receives ownership after launch. Executes governance decisions. |

### Deployment Flow

`Manager.deploy()` accepts 4 parameter structs:

```
FounderParams[] -- wallet address, ownership %, vesting expiry
TokenParams     -- name, symbol, description, image URI, renderer config
AuctionParams   -- reserve price, auction duration
GovParams       -- timelock delay, voting delay, voting period,
                   proposal threshold (bps), quorum threshold (bps)
```

Returns addresses of: Token, MetadataRenderer, Auction, Treasury, Governor.

### Key Design Points

- All contracts are **individually upgradeable** (UUPS proxy pattern).
- Founder configures artwork + auction settings, then calls `unpause()`.
- After unpause, **ownership transfers to Treasury** -- all further changes require governance proposals.
- ~4,046 lines of Solidity total. Audited by Code4rena (2022-09).
- Audit report: https://code4rena.com/reports/2022-09-nouns-builder

### Protocol Repo

- **nouns-protocol** (Solidity): https://github.com/BuilderOSS/nouns-protocol (forked from `ourzora/nouns-protocol`)
  - 99.7% Solidity
  - Contains `src/`, `deploys/`, `addresses/` directories

---

## 4. BuilderOSS GitHub Organization

**URL:** https://github.com/BuilderOSS

### Active Repositories

| Repo | Language | Stars | Description |
|------|----------|-------|-------------|
| **nouns-builder** | TypeScript | 106 | Main monorepo (frontend + subgraph). Updated 2026-03-19. |
| **builder-farcaster** | TypeScript | 0 | Farcaster integration. Updated 2026-03-10. |
| **nouns-builder-docs** | MDX | 2 | Documentation site. Updated 2026-01-15. |
| **nouns-protocol** | Solidity | 0 | Smart contracts (fork of ourzora/nouns-protocol). Updated 2025-12-08. |
| **builder-template-app** | TypeScript | 1 | Standalone template site for Builder DAOs. Updated 2025-10-27. |

### Archived Repositories

| Repo | Description | Archived |
|------|-------------|----------|
| **nouns-builder-components** | Reusable React components for Builder DAOs | Nov 2025 |
| **noun-site** | Feature-complete customizable DAO template | Archived |
| **builder-utils** | React hooks and utilities | Archived |
| **nouns-builder-site** | (no description) | Archived |
| **builder-components-embed** | Embeddable components (JavaScript) | Archived |

### The Monorepo: `nouns-builder`

The main `nouns-builder` repo is a **pnpm workspace monorepo** containing:

**Apps:**
- `apps/web` -- Next.js frontend (the nouns.build site)
- `apps/subgraph` -- GraphQL indexing

**Key Packages (20+):**
- `@buildeross/sdk` -- Core SDK with contract ABIs, subgraph queries, EAS integration
- `@buildeross/hooks` -- React hooks for Builder DAOs
- `@buildeross/zord` -- Design system
- `@buildeross/utils` -- Utilities
- `@buildeross/constants` -- Constants
- `@buildeross/types` -- TypeScript types
- `@buildeross/analytics` -- Analytics
- `@buildeross/blocklist` -- Blocklist
- `@buildeross/ipfs-service` -- IPFS service

**Tech stack:** TypeScript (99.3%), pnpm, Turbo, Next.js, Vanilla Extract (styling), Wagmi, Viem, Anvil (testing).

### SDK: `@buildeross/sdk`

This is the **internal SDK** within the monorepo. It provides:
- Contract ABIs for all Builder protocol contracts
- Subgraph queries
- EAS (Ethereum Attestation Service) integration
- Blockchain interaction utilities

Note: This is a monorepo package, not published to npm as a standalone package (based on available data).

### External SDK: `@buildersdk/sdk`

There is also an **older standalone SDK** by neokry:
- **Repo:** https://github.com/neokry/builder-sdk
- **Install:** `yarn add @buildersdk/sdk`
- **Status:** Last updated November 2022, 10 commits. Likely unmaintained.

```typescript
import { BuilderSDK } from "@buildersdk/sdk";

const { auction, token } = BuilderSDK.connect({
  signerOrProvider: mainnetProvider,
});
const auctionData = await auction.auction();
const tokenURI = await token.tokenURI(1);
```

---

## 5. builder-template-app

**Repo:** https://github.com/BuilderOSS/builder-template-app
**License:** MIT

### Tech Stack

- **Framework:** Next.js (TypeScript, 97%)
- **Package manager:** pnpm
- **Dependencies:** Pulls from `@buildeross/*` monorepo packages (SDK, hooks, utils, UI)
- **Wallet:** WalletConnect
- **IPFS:** Pinata
- **Styling:** CSS (1.6%)

### Setup

```bash
pnpm install
cp sample.env .env.local   # Configure: network, chain ID, token address, Pinata key, WalletConnect ID
pnpm fetch-dao             # Fetches DAO config from chain
pnpm dev                   # Start dev server
```

### Key Config (env vars)

- Network type (mainnet/testnet) and chain ID
- DAO token address
- Pinata API key (IPFS)
- WalletConnect project ID
- Optional: Alchemy, Tenderly, AI Gateway, Redis

### Purpose

This is a **standalone, deployable Next.js app** meant to be a white-label governance frontend for any Nouns Builder DAO. It provides auction display, proposal management, and DAO interaction.

### Can It Be Iframed?

No explicit iframe support mentioned. It is a full Next.js app designed to be deployed as a standalone site (recommended: Vercel). Not designed as an embeddable widget.

### Status

"This template is in active development. Full theming functionality is not yet available or fully tested."

---

## 6. Embedding / Iframing nouns.build

### Can You Iframe `nouns.build/{dao}`?

**Unknown / Likely Restricted.** Here is the situation:

1. **No official embed SDK or widget exists** for embedding auction pages.
2. **nouns.build is a full Next.js app** -- most production Next.js apps set `X-Frame-Options: DENY` or `SAMEORIGIN` by default (especially on Vercel).
3. **No documentation exists** about embedding or iframe support on nouns.build.
4. The web content does not reveal explicit `X-Frame-Options` or `Content-Security-Policy: frame-ancestors` headers, but this would need to be tested with an actual HTTP request.

### What About the Archived Component Libraries?

The **nouns-builder-components** library (archived Nov 2025) provided embeddable React components:

**Available components:**
- `AuctionHero` -- auction display
- `CollectionList` -- NFT grid
- `MemberList` -- DAO members
- `ProposalList` -- governance proposals
- `Treasury` -- financial holdings
- `PropHouseRounds` / `PropHouseProps` -- funding round display

**Install (archived):**
```bash
npm i nouns-builder-components @rainbow-me/rainbowkit wagmi viem
```

**Usage pattern:**
```tsx
import { BuilderDAO, AuctionHero } from "nouns-builder-components";

<BuilderDAO>
  <AuctionHero dao="0x..." opts={{ theme: "dark" }} />
</BuilderDAO>
```

**No-code builder:** https://buildercomponents.wtf (may or may not still be live)

**Key caveat:** This library is **archived** and no longer maintained. It depends on older versions of wagmi/viem/rainbowkit that may conflict with current versions.

### The `builder-components-embed` Repo

Also archived. This was a JavaScript-based embed approach, but no documentation is available.

### Practical Integration Options for ZAO OS

Given the lack of an official embed/iframe solution, here are the realistic approaches:

**Option A: Link Out**
Simply link to `nouns.build/dao/{network}/{token-address}` and open in a new tab. Zero integration effort.

**Option B: Fork builder-template-app**
Fork the MIT-licensed template, customize it, and either:
- Deploy as a subdomain (e.g., `dao.zao.fm`)
- Integrate its pages directly into ZAO OS's Next.js app router

**Option C: Use @buildeross/sdk + hooks from the monorepo**
Pull the SDK package from the monorepo and build custom auction/governance UI directly in ZAO OS. This gives full control but requires significant development.

**Option D: Direct contract interaction**
Use Wagmi + Viem (already in ZAO OS) to interact with the deployed Builder DAO contracts directly. Read auction state, place bids, display proposals -- all custom UI.

**Option E: Iframe with proxy (hacky)**
If nouns.build does not set restrictive headers, an iframe might work. If it does, you could proxy the page through your own server and strip headers, but this is fragile and not recommended.

---

## 7. SwarthyHatter / SKTH

### What Was Found

**SwarthyHatter** (real name: Timothy, also known as "FkyKnives") is a Nouns Builder community member who posted in the Builder forum's "Introduce Yourself" thread. Key details:

- Web3 and DAO contributor since 2020
- Skills: product design, project management, technical writing, copywriting, public speaking
- Interested in building governance tools
- Early contributor to "City Nouns"
- Joined the Nouns/Lil Nouns community looking for a place to build and test governance tools

### SKTH

No search results connect "SKTH" to the Nouns Builder ecosystem, SwarthyHatter, or any specific DAO on nouns.build. The term does not appear in:
- Nouns Builder forum
- GitHub repos
- General web search results linking it to Nouns/Builder

If SKTH is a DAO on nouns.build, it may be very new or under a different name. You could check directly at `https://nouns.build/dao/base/{contract-address}` or `https://nouns.build/dao/ethereum/{contract-address}` if you have the token contract address.

---

## 8. Key URLs Reference

| Resource | URL |
|----------|-----|
| Nouns DAO | https://nouns.wtf |
| Nouns Builder (platform) | https://nouns.build |
| Nouns Builder docs | https://docs.nouns.build |
| Builder forum | https://forum.nouns.build |
| BuilderOSS GitHub | https://github.com/BuilderOSS |
| Main monorepo | https://github.com/BuilderOSS/nouns-builder |
| Template app | https://github.com/BuilderOSS/builder-template-app |
| Smart contracts | https://github.com/BuilderOSS/nouns-protocol |
| Builder-Farcaster | https://github.com/BuilderOSS/builder-farcaster |
| Components (archived) | https://github.com/BuilderOSS/nouns-builder-components |
| Code4rena audit | https://code4rena.com/reports/2022-09-nouns-builder |
| Older SDK | https://github.com/neokry/builder-sdk |
| @nouns/sdk (Nouns DAO) | https://www.npmjs.com/package/@nouns/sdk |

---

## 9. Integration Recommendation for ZAO OS

### Best Path: Option B or D

For ZAO OS, the most practical integration paths are:

**If you want a full governance UI:**
Fork `builder-template-app` (MIT license). It is already a Next.js app with TypeScript, Wagmi, and Viem -- same stack as ZAO OS. Customize the theme (navy + gold), integrate auth, and either deploy as a subdomain or merge key pages into ZAO OS's app router.

**If you want auction display + bidding only:**
Use Wagmi + Viem (already in ZAO OS) to read auction contract state and submit bids directly. Build a custom `<AuctionWidget />` component. The contract ABIs are available in the `nouns-protocol` repo or via the `@buildeross/sdk` package.

**What to avoid:**
- The archived `nouns-builder-components` library (outdated deps, unmaintained)
- The `@buildersdk/sdk` by neokry (abandoned since 2022)
- Iframing nouns.build directly (likely blocked, fragile even if not)

### Notable: builder-farcaster

The `BuilderOSS/builder-farcaster` repo (updated March 2026) connects Builder DAOs to Farcaster. This is directly relevant to ZAO OS as a Farcaster client and could be worth investigating for governance notifications or proposal sharing in Farcaster feeds.

---

## Sources

- [Nouns DAO](https://nouns.wtf/)
- [Nouns Builder](https://nouns.build/)
- [Nouns Builder About](https://nouns.build/about)
- [Nouns Builder Docs](https://docs.nouns.build/)
- [Nouns Governance Explained](https://www.nouns.com/learn/nouns-dao-governance-explained)
- [BuilderOSS GitHub](https://github.com/BuilderOSS)
- [builder-template-app](https://github.com/BuilderOSS/builder-template-app)
- [nouns-builder monorepo](https://github.com/BuilderOSS/nouns-builder)
- [nouns-protocol contracts](https://github.com/BuilderOSS/nouns-protocol)
- [nouns-builder-components (archived)](https://github.com/BuilderOSS/nouns-builder-components)
- [builder-sdk by neokry](https://github.com/neokry/builder-sdk)
- [Code4rena Nouns Builder Audit](https://code4rena.com/reports/2022-09-nouns-builder)
- [Protocol docs](https://github.com/code-423n4/2022-09-nouns-builder/blob/main/docs/protocol-docs.md)
- [SwarthyHatter forum post](https://forum.nouns.build/t/introduce-yourself/12/4)
- [Nouns Builder launch (Bankless)](https://metaversal.banklesshq.com/p/zora-launches-nouns-builder)
- [Nouns Builder (Decrypt)](https://decrypt.co/113225/now-anyone-can-create-an-ethereum-nft-dao-zora-nouns-builder)
- [Nouns Builder (HackerNoon)](https://hackernoon.com/build-a-dao-in-minutes-with-zoras-new-nouns-builder)
- [Nouns Structure (Amberdata)](https://blog.amberdata.io/nouns-a-structure-for-daos)
- [Nouns Center Intro](https://nouns.center/intro)
