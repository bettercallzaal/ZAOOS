# 23 — Austin Griffith, Scaffold-ETH & the ETH Skills Ecosystem

> **Status:** Research complete
> **Goal:** Map Austin Griffith's builder tools, BuidlGuidl community model, and the broader onchain credentials/skills ecosystem
> **Date:** March 2026

---

## 1. Austin Griffith — Who Is He?

- **Role:** Ethereum Foundation, Developer Growth division
- **Focus:** Developer onboarding, mentoring, tooling — lowering barrier to entry for Ethereum development
- **Education:** Master's in Electrical Engineering, University of Wyoming
- **Recognition:** Vitalik Buterin called him "The Quadratic Freelancer" (top grantee in Gitcoin Grants Round 3)
- **Funding:** $220K+ through Gitcoin Grants, 10K+ contributors
- **Philosophy:** Learn-by-building, obsessed with making Ethereum accessible

### Social Presence

| Platform | Handle |
|----------|--------|
| **Farcaster** | @austingriffith (active) |
| **Twitter/X** | @austingriffith |
| **GitHub** | austintgriffith |
| **Website** | austingriffith.com |

### Current Focus (2025-2026)

Pivoted heavily into **AI agents on Ethereum**:
- Built **ClawdBot/OpenClaw** — autonomous AI agent that writes its own code, deploys its own dApps, manages its own treasury
- Launched **ETHSkills.com** — curated skill files for AI agents
- Deeply involved with **ERC-8004** standard (Trustless Agents)
- Presented extensively at **ETHDenver 2026** alongside Jesse Pollak (Base)

---

## 2. Scaffold-ETH

### Scaffold-ETH 1 (Legacy)

- GitHub: scaffold-eth/scaffold-eth — **8,400+ stars, 3,000+ forks**
- Status: Maintenance mode, superseded by SE-2

### Scaffold-ETH 2 (Current)

- GitHub: scaffold-eth/scaffold-eth-2 — **~1,900 stars, 1,200+ forks**
- Docs: docs.scaffoldeth.io
- Website: scaffoldeth.io
- Last updated: December 2025 (active development)

### Tech Stack

| Layer | Tool |
|-------|------|
| **Frontend** | Next.js |
| **Smart Contracts** | Hardhat or Foundry (user's choice) |
| **Ethereum Hooks** | Wagmi |
| **Primitives** | Viem |
| **Wallet** | RainbowKit |
| **Language** | TypeScript throughout |

### Key Features

- **Contract Hot Reload** — frontend auto-adapts as you edit contracts
- Custom React hooks wrapping wagmi with TypeScript autocompletion
- Pre-built web3 UI components
- Burner Wallet and local faucet for testing
- AI-ready — "everything agents need to build on Ethereum"
- Extension system for adding capabilities

### Notable Extensions (2025-2026)

| Extension | What It Does |
|-----------|-------------|
| SIWE | Sign-In with Ethereum |
| EFP | Ethereum Follow Protocol social graph |
| Subgraph | Event indexing |
| x402 | Micropayments protocol |
| EIP-712 | Typed message signing |
| Ponder.sh | Event indexing |
| ERC-20 | Token contracts |
| EIP-5792 | Wallet capabilities |
| RANDAO | On-chain randomness |
| Dynamic.xyz | Social login |
| Full list | scaffoldeth.io/extensions |

---

## 3. BuidlGuidl

- Website: buidlguidl.com
- Substack: buidlguidl.substack.com

### What It Is

A curated collective/DAO of Ethereum builders creating products, prototypes, and tutorials. The "graduation" destination for SpeedRunEthereum completers.

### Key Stats

| Metric | Value |
|--------|-------|
| **Builders** | 1,358 active |
| **Builds** | 1,263 uploaded |
| **ETH Streamed** | 772.83 ETH |
| **Projects Launched** | 600+ |
| **Payments Distributed** | 300+ ETH |

### How It Works

- **Streams:** ETH payment streams rewarding ongoing contributions. Represents MAX monthly withdrawal.
- **Batches:** Cohort-based programs for SpeedRunEthereum graduates. Batch 13 live as of early 2026.
- **Cohorts:** 9 distinct groups — Sand Garden, Nodes, Batches, ShipYard, Media, Workshops, NiftyInk, Owners, Mercenaries
- **BG Grants:** grants.buidlguidl.com — funds developers who completed SRE or batch programs

### Notable Builds

- **abi.ninja** — contract interaction interface
- **Hacked wallet recovery** — asset recovery using Flashbots
- **address.vision** — token/NFT holdings explorer across EVM chains
- **BuidlGuidl Client** — for running Ethereum full nodes

### Funders

Ethereum Foundation, Optimism, ENS, Gitcoin, Octant, Arbitrum Foundation

### Relevance to ZAO OS

BuidlGuidl's model directly mirrors what ZAO OS is building:
- **Gated membership** (must complete SpeedRunEthereum) = ZAO's allowlist gate
- **Stream/grant system** for rewarding contributors = Respect token distribution model
- **Batch/cohort model** for onboarding = ZAO member onboarding waves
- **Capture the Flag** program (96 teams at Devcon Bangkok)
- **University Tour** partnership with Ethereum Foundation

---

## 4. SpeedRunEthereum

- Website: speedrunethereum.com
- GitHub: BuidlGuidl/SpeedRunEthereum — 392 stars, 3,800 forks
- Challenges repo: scaffold-eth/se-2-challenges

### What It Is

Gamified learning platform — complete Ethereum challenges built on Scaffold-ETH 2. Each challenge delivers one key "aha" moment. Completed challenges become public proof in your portfolio.

### Current Challenges (10 Core)

| # | Challenge | Concept |
|---|-----------|---------|
| 0 | Tokenization | Create a unique token (SE-2 basics) |
| 1 | Crowdfunding | Coordinated group funding |
| 2 | Token Vendor | ERC-20 + vending machine |
| 3 | Dice Game | Blockchain randomness |
| 4 | Build a DEX | Decentralized exchange with reserve ratios |
| 5 | Oracles | Three oracle systems |
| 6 | Over-Collateralized Lending | Lending with liquidation |
| 7 | Stablecoins | Decentralized stablecoin system |
| 8 | Prediction Markets | Bet on future outcomes |
| 9 | ZK Voting | Zero-knowledge proof voting |

### Additional Challenges

- Multisig Wallet (cohort-based)
- SVG NFT
- ETH Tech Tree (advanced Solidity)
- Capture the Flag (12 smart contract security challenges)

### Pipeline

Complete SpeedRunEthereum → join BuidlGuidl → get a stream/grant

---

## 5. ETH.Build

- Website: eth.build
- GitHub: austintgriffith/eth.build

A drag-and-drop visual programming sandbox for learning Ethereum. Wire together blocks to understand cryptographic hashing, key pairs, transactions, and smart contracts visually.

Status: Still available, open source, not actively developed (finished educational tool).

---

## 6. Other Austin Griffith Projects

### Burner Wallet (2018)

- GitHub: austintgriffith/burner-wallet
- Auto-generates Ethereum keypair on page load
- Used at ETHDenver for food/drink payments
- Used xDai sidechain for fast, cheap transactions
- Analogous to cash: quick, easy, less secure

### Punk Wallet

- Website: PunkWallet.io
- Evolved from Burner Wallet
- Disposable web3 wallet, no seed phrases
- Forkable for custom use cases

### ETHSkills.com (NEW — 2026)

- Website: ethskills.com
- GitHub: austintgriffith/ethskills
- **Built by Austin's AI agent**
- Curated `SKILL.md` files that AI agents can consume to learn Ethereum interaction patterns
- Integrates with **Blockscout's MCP** (Model Context Protocol)

Skill URL structure:
```
ethskills.com/SKILL.md
ethskills.com/tools/SKILL.md
ethskills.com/building-blocks/SKILL.md
ethskills.com/orchestration/SKILL.md
ethskills.com/addresses/SKILL.md
```

Tools covered: Foundry, Scaffold-ETH 2, Blockscout MCP, abi.ninja, x402 SDKs

Installable: `claude plugin install https://github.com/austintgriffith/ethskills`

### ClawdBot / OpenClaw / CLAWD

- Austin's autonomous AI agent that **writes its own code, deploys its own dApps, manages its own treasury** without human intervention
- Built **12 live dApps** on Base and Ethereum — all shipped by AI with no human code review
- Open-source framework: originally ClawdBot, renamed to **OpenClaw** (Anthropic trademark claim)
- **149,000 GitHub stars and 22,000+ forks in a single week** (Jan 2026)
- **$CLAWD token** launched on Base as community memecoin
- Presented at ETHDenver 2026 alongside Jesse Pollak (Base)

### ERC-8004: Trustless Agents

- Proposed August 13, 2025; **live on Ethereum mainnet January 29, 2026**
- Co-authored by Marco De Rossi (MetaMask), Davide Crapis (EF), Jordan Ellis (Google), Erik Reppel (Coinbase)
- Creates three on-chain registries: **Identity, Reputation, Validation** for AI agents
- v2 specification in development with enhanced MCP support and x402 integration
- Austin deeply involved in promoting and building on this standard

### Nifty.ink

- NFT creation platform with instant artist onboarding via burner wallets
- Meta transactions, sidechains, bridge to Ethereum mainnet

---

## 7. Relevance to ZAO OS

### Scaffold-ETH 2 for Smart Contracts

**Highly useful.** If ZAO OS needs smart contracts (Respect tokens, Hats trees, NFT gates):
- Next.js + Wagmi + Viem stack **directly overlaps** with ZAO OS's architecture
- **ERC-20 extension** accelerates Respect token development
- **SIWE extension** complements Farcaster authentication
- **Contract Hot Reload** speeds up smart contract iteration
- Supports **Base** as deployment target (Farcaster-native chain)

### BuidlGuidl as Community Model

| BuidlGuidl Pattern | ZAO OS Equivalent |
|--------------------|--------------------|
| SpeedRunEthereum gate | Allowlist + invite codes |
| ETH streams for contributors | Respect token distribution |
| Batch cohorts | Member onboarding waves |
| Builder profiles | ZID (ZAO Identity) |
| Capture the Flag | Community challenges/quests |

### Farcaster-Specific

- SE-2 has a **Sign In with Farcaster** community extension
- Austin is active on Farcaster (@austingriffith)
- Base chain is primary deployment target (Farcaster-native)
- **OnchainKit** (Coinbase/Base) works alongside SE-2 for Mini App dev

### ETHSkills for AI-Assisted Development

If using AI agents (Claude) to build ZAO OS, ETHSkills.com provides curated skill files for more effective Ethereum development.

---

## 8. The Broader ETH Skills / Onchain Credentials Landscape

### The Composable Credentials Stack

| Layer | Tool | What It Does |
|-------|------|-------------|
| **Roles & Permissions** | Hats Protocol | Non-transferable ERC-1155 role tokens in tree hierarchy (up to 15 levels). Dynamic eligibility. |
| **Attestations** | EAS (attest.org) | Open-source attestations onchain or offchain. Used by Coinbase for verification. Deployed on mainnet, Optimism, Base, Arbitrum. |
| **Access Gating** | Guild.xyz | 100+ integrations. Combines on-chain + off-chain requirements. Guild Pins as non-transferable NFTs. |
| **Quests & Progression** | Layer3 | Onchain quest platform. Interoperable credential infrastructure. Stake 150K L3 tokens to publish tasks. |
| **Quests & Distribution** | Galxe | Web3's largest onchain distribution platform. Quest, Passport, Score, Compass, Alva. ZK-powered credential management. |
| **Badges & Milestones** | Otterspace | Soulbound badges (EIP-4973). Non-transferable NFTs on Optimism. No-code interface for DAOs. |
| **AI Agent Identity** | ERC-8004 | Trustless agent registries: Identity, Reputation, Validation. Live on mainnet Jan 2026. |

### Hats Protocol (Deep Dive)

- Website: hatsprotocol.xyz
- Onchain roles as non-transferable ERC-1155 tokens in tree hierarchy
- Dynamic eligibility: token holdings, staking, elections, badges, POAPs, subscriptions
- Auto-grant and revoke based on custom logic
- **Perfect for ZAO OS** community roles (Curator, Moderator, Artist, etc.)

### EAS (Ethereum Attestation Service)

- Website: attest.org
- Open-source public good
- Coinbase uses it for onchain account/country verification
- Builder guide for agent-based attestations exists
- **ZAO OS use:** Music curation attestations, contribution verification

### Guild.xyz

- 100+ integrations (Discord, Telegram, Twitter, GitHub, Google Workspace)
- Combines on-chain (tokens, NFTs, POAPs) with off-chain (social credentials, allowlists)
- Guild Pins: non-transferable NFTs as proof of membership
- **ZAO OS use:** Reference model for access gating, or potential integration

### Layer3

- Onchain quest platform with interoperable credential infrastructure
- Users earn achievements for mastering on-chain skills
- **ZAO OS use:** Model for gamified engagement (listen quests, curation challenges)

### Galxe

- Web3's largest onchain distribution platform
- ZK technology for privacy-preserving credential management
- Quests run directly on-chain
- **ZAO OS use:** Quest model for engagement mechanics

### Otterspace

- Soulbound badges (EIP-4973) for DAOs
- Non-transferable NFTs on Optimism (cents to claim)
- No-code interface
- **ZAO OS use:** Badges for milestones (first post, first curated track, 100 listens)

---

## How This Maps to ZAO OS's 9-Layer Roadmap

| ZAO Layer | Relevant Tools |
|-----------|---------------|
| **1. MVP (Chat)** | Scaffold-ETH 2 SIWF extension |
| **2. Music Feed** | — |
| **3. ZIDs (Identity)** | EAS attestations, Hats Protocol |
| **4. Respect Tokens** | Scaffold-ETH 2 ERC-20 extension, BuidlGuidl stream model |
| **5. Hats Roles** | Hats Protocol, Guild.xyz |
| **6. AI Memory** | ETHSkills.com for AI agent development |
| **7. Quilibrium** | — |
| **8. Cross-Post** | — |
| **9. XMTP DMs** | — |

---

## Sources

- [Austin Griffith's website](https://austingriffith.com/)
- [Austin Griffith on GitHub](https://github.com/austintgriffith)
- [Gitcoin Impact: Austin Griffith](https://impact.gitcoin.co/austin-griffith)
- [Austin Griffith on Farcaster](https://farcaster.xyz/austingriffith)
- [Scaffold-ETH 2 GitHub](https://github.com/scaffold-eth/scaffold-eth-2)
- [Scaffold-ETH 2 Docs](https://docs.scaffoldeth.io/)
- [Scaffold-ETH 2 Extensions](https://scaffoldeth.io/extensions)
- [BuidlGuidl](https://buidlguidl.com/)
- [BuidlGuidl 2024 Year in Review](https://buidlguidl.substack.com/p/a-year-of-building-buidlguidl-2024)
- [BuidlGuidl Grants](https://grants.buidlguidl.com/)
- [SpeedRunEthereum](https://speedrunethereum.com/)
- [ETH.Build](https://eth.build/)
- [ETHSkills.com](https://ethskills.com/)
- [ETHSkills GitHub](https://github.com/austintgriffith/ethskills)
- [ERC-8004: Trustless Agents](https://eips.ethereum.org/EIPS/eip-8004)
- [EF dAI Team](https://ai.ethereum.foundation/)
- [Blockscout: ETHDenver 2026 & AI Agents](https://www.blog.blockscout.com/updates-from-the-edge-ethdenver-2026-ai-agents/)
- [CoinDesk: ERC-8004](https://www.coindesk.com/markets/2026/01/28/ethereum-s-erc-8004-aims-to-put-identity-and-trust-behind-ai-agents/)
- [CryptoRank: ClawdBot on Base](https://cryptorank.io/insights/analytics/ai-season-on-base-how-clawdbot-kicked-off-the-agent-economy)
- [EAS (attest.org)](https://attest.org/)
- [Hats Protocol](https://www.hatsprotocol.xyz/)
- [Guild.xyz](https://guild.xyz/)
- [Galxe](https://www.galxe.com/)
- [Layer3](https://layer3.mirror.xyz/b-ZXfupfjV2wzcjJENSptZabRRDoTv9-hmC44W7TyEQ)
- [Otterspace](https://www.otterspace.xyz/)
