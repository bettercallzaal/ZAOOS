# 314 - Quilibrium Network: Comprehensive Deep Dive

> **Status:** Research complete
> **Date:** April 10, 2026
> **Goal:** Comprehensive understanding of the Quilibrium protocol, ecosystem, GitHub repos, token economics, developer tools, and long-term ZAO OS integration strategy

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Quilibrium as long-term infra** | WATCH closely - Quilibrium is building the most ambitious decentralized compute/storage/privacy stack in crypto. 7+ years of development, v2.1 (Bloom) live, 16 active GitHub repos. Not ready for ZAO OS production use yet, but the trajectory is strong |
| **haatz.quilibrium.com (already integrated)** | KEEP using - already integrated in `src/lib/farcaster/neynar.ts` via dual-provider pattern. Saves $99+/mo on Neynar reads. This is ZAO's current touchpoint with Quilibrium |
| **Quorum Messenger** | STUDY - Quorum is Quilibrium's flagship app (mobile + desktop), world's first P2P E2EE group messenger. If it reaches critical mass, ZAO could use Quorum as an alternative communication channel to XMTP |
| **Q Storage (5GB free tier)** | INVESTIGATE for ZAO media - Q Storage offers 5GB free, no egress fees, built-in encryption + replication. USE for decentralized media backup of ZAO music/art assets when SDK stabilizes |
| **Klearu (E2EE ML)** | SKIP for now - fascinating tech (private LLM inference via 2PC) but AGPL-3.0 with commercial restriction to Quilibrium mainnet only. Revisit when ZAO needs privacy-preserving AI moderation |
| **MetaVM (ZK proof system)** | SKIP - ZK proofs for RISC-V/EVM/Solana BPF execution. Not relevant to ZAO OS until governance needs verifiable computation |
| **Running a Quilibrium node** | SKIP - minimum 8 vCores, 16GB RAM, 32GB storage for meaningful rewards. ZAO doesn't need direct network participation yet |
| **QUIL token** | SKIP as investment - $0.0131, down 97.1% from ATH ($0.4571 Sep 2024). Market cap $11.81M. Fair launch (no VC/premine) is philosophically aligned with ZAO but token is speculative |
| **QNS (Q Name Service)** | WATCH - name marketplace live in Quorum Mobile. If ZAO members want `.q` names, this is the path. Prices in QUIL/wQUIL/USDC |
| **JS SDK for Channels** | INVESTIGATE - `quilibrium-js-sdk-channels` repo exists (TypeScript, updated Dec 2025). This is the bridge between ZAO OS (Next.js) and Quilibrium's channel primitives |

## What is Quilibrium?

Quilibrium is a **decentralized protocol combining compute, storage, networking, and privacy** into a unified infrastructure layer - essentially a decentralized AWS. Founded by **Cassandra Heart** (ex-Farcaster, ex-Coinbase), development started around 2018 as a Discord alternative and evolved over 7 years into a full platform-as-a-service protocol.

**Mission:** "Secure every bit of traffic on the web."

**What makes it different from other L1s:**
- Not a blockchain - uses a **hypergraph** data structure (edges connect any number of nodes, not just 2)
- **Proof of Meaningful Work** consensus - nodes do useful cryptographic computation, not arbitrary hashing
- **Oblivious Hypergraph** - node operators literally cannot see the data they store or compute on
- **Shared-nothing architecture** (like ScyllaDB) - parallel processing without resource conflicts
- **No wallets/seed phrases** - uses device passkeys (like Google account auth) via secure enclaves
- **Fair launch** - no VC funding, no pre-mine, no ICO, no airdrops. Mining only

## Network Performance Claims

| Metric | Specification |
|--------|---------------|
| Max messages/second | 100 million |
| Estimated TPS | 1.5-2.5 million |
| Transaction finality | 0.2-10 seconds |
| Target scale | 2 billion daily active users |
| Consensus hardware floor | Raspberry Pi capable |

These are ambitious targets. For context, Ethereum does ~15 TPS, Solana ~4,000 TPS. Quilibrium claims orders of magnitude higher through sharding and shared-nothing architecture.

## Protocol Architecture

### Four Layers

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Consensus** | Proof of Meaningful Work, frame-based intervals, VDFs | Deterministic transaction ordering via useful cryptographic computation |
| **Cryptography** | BLS48-581 signatures, Ed448, ZK proofs, Ferret OT | Authorization, access control, privacy-preserving verification |
| **Data** | Oblivious Hypergraph, RDF schema, encryption at rest | Privacy-preserving storage with semantic relationships |
| **Network** | BlossomSub gossip, SLRP/RPM routing, libp2p | P2P communication with anonymous message delivery |

### Cryptographic Stack (Deep)

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Signatures | BLS48-581 | Post-quantum consideration, ownership verification |
| Key management | Ed448 | Access control |
| OT extension | Ferret-based Correlated OT over LPN | 200x faster than basic oblivious transfer |
| MPC | Multi-party computation | Compute on encrypted data |
| Routing | Shuffled Lattice Routing Protocol (SLRP) | Anonymous message delivery (mixnet) |
| Addressing | Planted Clique Addressing Scheme | Network topology |
| Key exchange | Triple-Ratchet Protocol | Forward secrecy for group messaging |
| Gossip | BlossomSub (custom) | State propagation across nodes |
| Proofs | KZG polynomial commitments | BLS48-581 and BLS12-381 curve support |
| Timestamping | VDFs (Verifiable Delay Functions) | Block timestamping and storage proof |

### Privacy Architecture

**How data stays private from node operators:**

1. **Feldman verifiable secret shares** - Shamir split of data blocks
2. **ElGamal encryption** - Each share encrypted individually
3. **Fiat-Shamir transform** - Cryptographic challenge mechanism
4. Partial share revelation (insufficient for reconstruction) proves data exists without revealing plaintext

**Crime prevention balance:** Cryptographic accumulator bundles in coins verify funds don't originate from illicit sources while maintaining anonymity. Nodes can blacklist problematic shards via revealed decryption keys.

## Version History

| Version | Codename | Release Date | Key Changes |
|---------|----------|-------------|-------------|
| 1.4.20 | - | Pre-2024 | Last v1.x release |
| 2.0.0 | Dusk | October 14, 2024 | Major rewrite, native QUIL tokens, new consensus |
| 2.0.2-p1 | Dusk | October 26, 2024 | Stability patches |
| 2.1.0 | Bloom | September 30, 2025 | Memory/storage shift for node economics, reduced CPU dominance |
| 2.1.0-p2 | Bloom | October 23, 2025 | Current production version |

**Roadmap phases:** Dusk (current) -> Equinox (streaming, advanced apps) -> Event Horizon (AI/ML model training)

## QUIL Token Economics

| Metric | Value |
|--------|-------|
| Current price | $0.0131 (April 2026) |
| Market cap | $11.81M |
| 24h volume | $16.39K (very thin) |
| Circulating supply | 902.28M QUIL |
| All-time high | $0.4571 (September 23, 2024) |
| All-time low | $0.001452 (October 30, 2024) |
| Decline from ATH | -97.1% |
| Exchange listings | 2 exchanges, 3 trading pairs |
| Bridge | wQUIL ERC-20 on Ethereum (`0x8143182a775c54578c8b7b3ef77982498866945d`) |

### Emission Model

- **Generational threshold model** - not a fixed schedule like Bitcoin halvings
- **Generation 1 (current):** Active, difficulty steadily increasing
- **Generation 2:** Triggers ~2033 when network-wide average difficulty reaches first major threshold
- **Projected supply:** ~1.3B tokens as of early 2025, estimated ~1.6-1.7B by 2033
- **Fair launch:** Mining is the ONLY way to acquire QUIL. No allocation to VCs, no premine, no airdrops

### Token Utility

QUIL is a **utility token** for: storing data, launching applications, executing applications, querying information on the Quilibrium network. Quilibrium Inc explicitly states it's "not intended for speculation, investment, or financial gain."

## GitHub Ecosystem (16 Active Repos)

| Repo | Lang | Stars | Updated | Description |
|------|------|-------|---------|-------------|
| **monorepo** | Go/C++/Rust | 147 | Apr 6, 2026 | Protocol v2.1 Bloom, libraries, light client. AGPL-3.0 |
| **quorum-mobile** | TypeScript | 41 | Apr 6, 2026 | React Native mobile app (iOS + Android). Flagship consumer product |
| **quorum-desktop** | TypeScript | 32 | Apr 5, 2026 | Desktop version of Quorum messenger |
| **quorum-shared** | TypeScript | 2 | Apr 9, 2026 | Shared types, hooks, utilities for Quorum apps |
| **klearu** | Rust | 23 | Mar 13, 2026 | E2EE ML primitives - private LLM inference via 2PC. AGPL-3.0 |
| **bedlam** | Go | 25 | Sep 2025 | Network testing/chaos tool (extracted from monorepo) |
| **metavm** | Rust | 7 | Mar 8, 2026 | ZK proof system for RISC-V, EVM, Solana BPF execution |
| **channel** | Rust | 13 | Dec 2025 | Double and triple ratchet protocol implementation |
| **docs** | JavaScript | 6 | Feb 2026 | Public documentation site |
| **balance** | Rust | 4 | Mar 30, 2026 | Token balance/accounting system |
| **rpm** | Rust | 3 | Apr 9, 2026 | RPM (Routing Protocol for Mixnets) implementation |
| **go-libp2p-stack** | Go | 1 | Feb 2026 | Forked libp2p networking stack |
| **qtools** | Shell | 1 | Feb 2026 | Node management tooling |
| **quilibrium-js-sdk-channels** | TypeScript | 1 | Dec 2025 | JavaScript SDK for Quilibrium channels |
| **quilibrium-names-sdk** | Rust | 0 | Dec 2025 | QNS (Q Name Service) SDK |
| **quilibrium-rs-sdk-verkle** | Rust | 0 | Dec 2025 | BLS48-581 Verkle Tree + RDF structured proofs |

### Monorepo Architecture (50+ directories)

| Category | Contents |
|----------|----------|
| Core | `node`, `consensus`, `channel`, `config`, `lifecycle` |
| Crypto | `bls48581`, `bulletproofs`, `vdf`, `verenc`, `dkls23_ffi` |
| Networking | `go-libp2p*`, `go-multiaddr*`, `hypergraph`, BlossomSub |
| Data | `pebble`, `types`, `protobufs` |
| Infra | `docker`, `rpm`, `scripts`, `dashboards/grafana` |

**Tech breakdown:** Go (78.6%), C++ (10.5%), Rust (7.4%), C (2.6%)

**License:** AGPL-3.0 - but the interpretation clarifies this applies to "node provisioning and management tooling for deploying alternative networks," not to user applications or standard node deployments. Using the API is fine.

## Quorum: The Flagship App

Quorum is Quilibrium's consumer-facing product - a P2P E2EE group messenger.

| Feature | Details |
|---------|---------|
| **Platforms** | iOS, Android (React Native), Desktop (Electron/Tauri) |
| **Messaging** | World's first P2P E2EE group messaging (Triple-Ratchet) |
| **Auth** | Device passkeys (no seed phrases, no traditional wallet) |
| **Communities** | Spaces - self-moderated community rooms |
| **Naming** | QNS (Q Name Service) - buy/sell `.q` names in QUIL/wQUIL/USDC |
| **Monetization** | Quorum Apex - community subscriptions with revenue sharing in QUIL |
| **Protocols** | TCP, QUIC, Websockets, LoRa (!) |
| **Status** | Beta, sideloading available, QNS live |

### Quorum vs XMTP (ZAO's Current E2EE Choice)

| Feature | Quorum | XMTP |
|---------|--------|------|
| E2EE protocol | Triple-Ratchet (Quilibrium native) | MLS (Messaging Layer Security) |
| Group messaging | Yes (P2P, no server) | Yes (via MLS groups) |
| SDK for web apps | JS SDK (channels, early) | Mature JS/React SDK |
| Auth | Passkeys | Wallet signatures |
| Decentralization | Fully P2P | XMTP network nodes |
| Maturity | Beta | Production |
| ZAO integration | Not yet | Built (`src/contexts/XMTPContext.tsx`) |

## Q Storage

| Feature | Details |
|---------|---------|
| Free tier | 5 GB |
| Pricing model | Competitive with AWS S3, targeting Cloudflare R2 parity |
| Egress fees | $0 for public bucket queries |
| Encryption | Built-in at no additional cost |
| Replication | Built-in at no additional cost |
| Static hosting | Yes - CNAME routing to custom domains |
| Status | Available, SDK in development |

## Klearu: E2EE Machine Learning

Klearu is Quilibrium's implementation of privacy-preserving ML inference. 11 Rust crates:

| Crate | Purpose |
|-------|---------|
| `klearu-core` | LSH foundations, SLIDE training (sub-linear complexity) |
| `klearu-accel` | SIMD vectorization (AVX2/NEON), BF16 quantization |
| `klearu-llm` | LLaMA-compatible LLM inference with GQA and RoPE |
| `klearu-vision` | Vision transformers (DaViT, ViT, Swin, DINOv2, SigLIP) |
| `klearu-mpc` | 2PC building blocks (Ferret OT, Ristretto255 OPRF) |
| `klearu-private` | Private LLM inference - server holds weights, client input stays encrypted |

**Use case for ZAO:** Privacy-preserving AI moderation where content is scored without Quilibrium nodes seeing the content. Currently ZAO uses Perspective API (`src/lib/moderation/moderate.ts`) which requires sending content to Google.

**Blocker:** AGPL-3.0 with commercial restriction to Quilibrium mainnet only.

## Node Running Economics

### Hardware Requirements (v2.1 Bloom)

| Resource | Minimum | Optimal Ratio |
|----------|---------|---------------|
| CPU | 4 vCores | 1 core : 2GB RAM : 4GB disk |
| RAM | 8 GB | Scale with cores |
| Storage | 16 GB | Scale with cores |
| Example optimal | 8 vCores | 16GB RAM, 32GB storage |

**v2.0 vs v2.1 shift:** v2.0 was CPU-dominated (more cores = more rewards). v2.1 shifts bottleneck to memory/storage per worker, reducing CPU dominance and making rewards more accessible.

**Earnings:** You earn rewards during node sync. No snapshot download required. Rewards scale with hardware but "any node that uses just the minimum will find rewards are minimal."

## Comparison: Quilibrium vs Other Decentralized Infra

| Feature | Quilibrium | ICP (DFINITY) | Filecoin | Arweave | Akash |
|---------|-----------|---------------|----------|---------|-------|
| Focus | Compute + Storage + Privacy | Compute (canisters) | Storage | Permanent storage | Compute marketplace |
| Privacy | Oblivious Hypergraph, MPC, OT | None | None | None | None |
| Consensus | Proof of Meaningful Work | Threshold BFT | Proof of Spacetime | Proof of Access | Proof of Stake |
| Token | QUIL ($0.013, $11.8M mcap) | ICP ($6.50, $3.4B mcap) | FIL ($2.80, $1.8B mcap) | AR ($5.20, $340M mcap) | AKT ($1.50, $380M mcap) |
| Maturity | v2.1 (beta-ish) | Production (5+ years) | Production (3+ years) | Production (4+ years) | Production (2+ years) |
| Unique angle | Privacy-first everything | Web-speed smart contracts | Incentivized IPFS | Pay-once permanent store | GPU marketplace |
| JS SDK | Early (channels only) | Mature (agent-js) | Mature | Mature (arweave-js) | N/A (API) |
| ZAO relevance | High (Farcaster infra + privacy) | Low | Medium (media storage) | Medium (permanent art) | Low |

## ZAO OS Integration

### Current State (Already Built)

ZAO OS already touches Quilibrium through Hypersnap:
- `src/lib/farcaster/neynar.ts` - dual-provider pattern with `FARCASTER_READ_API_BASE=https://haatz.quilibrium.com`
- `fetchWithFailover()` tries haatz first, falls back to Neynar
- Saves $99+/mo on Neynar API fees for read-heavy operations (feeds, profiles, search)

### Integration Roadmap

| Timeline | What | Why | Files Affected |
|----------|------|-----|----------------|
| **Now** | Keep haatz dual-provider | Free reads, already working | `src/lib/farcaster/neynar.ts` |
| **Q3 2026** | Evaluate `quilibrium-js-sdk-channels` | Could replace XMTP for E2EE messaging if SDK matures | `src/contexts/XMTPContext.tsx`, new `src/lib/quilibrium/` |
| **Q4 2026** | Q Storage for media backup | 5GB free, encrypted, replicated. Store music/art assets | New `src/lib/storage/qstorage.ts` |
| **2027** | QCL app deployment | If Quilibrium matures, deploy ZAO-specific logic (curation, moderation) as a QCL app on the network | New service layer |
| **2027+** | Privacy-preserving identity | Move ZID attestations to oblivious hypergraph. Node operators can't see member data | `src/lib/auth/`, `src/lib/db/` |

### What ZAO Would Gain from Deep Quilibrium Integration

1. **Privacy-preserving social data** - member activity, voting patterns, listening habits stored where node operators can't see them
2. **Censorship-resistant backup** - if Farcaster/Neynar goes hostile, ZAO's data is independently stored
3. **Free infrastructure** - Q Storage free tier, haatz free API, potential compute credits
4. **Philosophical alignment** - fair launch, no VC, community-owned infrastructure matches ZAO's decentralized music community values
5. **Encrypted AI moderation** - Klearu could replace Perspective API for content moderation without sending content to Google

### What's Blocking Deeper Integration

1. **JS SDK immaturity** - `quilibrium-js-sdk-channels` has 1 star, last updated Dec 2025
2. **No production SLA** - haatz is community-run, best effort
3. **AGPL-3.0 licensing** - monorepo and klearu are AGPL. Fine for API usage, problematic if ZAO needs to modify and deploy node code
4. **Thin token liquidity** - $16K daily volume. If ZAO needed QUIL for network fees, acquiring meaningful amounts would be difficult
5. **Small ecosystem** - 147 stars on monorepo vs thousands for comparable projects

## Cross-Reference with Existing Research

| Doc | What It Covers | What This Doc Adds |
|-----|---------------|-------------------|
| **006 (archived)** | Basic Quilibrium overview | Outdated (pre-v2.0). This doc supersedes it |
| **304** | Hypersnap + haatz free API | Already integrated. This doc covers the broader ecosystem beyond Farcaster |
| **309** | Snapchain vs Hypersnap protocol deep dive | Focused on Farcaster data layer. This doc covers Quilibrium's compute, storage, privacy, and app ecosystem |
| **005 (ZID)** | Long-term Quilibrium for identity | Still aspirational. JS SDK needs to mature first |

## Sources

- [Quilibrium Official Website](https://quilibrium.com)
- [Quilibrium Protocol Overview](https://docs.quilibrium.com/docs/protocol/overview/)
- [Quilibrium Tokenomics](https://docs.quilibrium.com/docs/discover/quilibrium-tokenomics/)
- [Quilibrium FAQ](https://docs.quilibrium.com/docs/discover/FAQ/)
- [Quilibrium GitHub Organization](https://github.com/QuilibriumNetwork)
- [Quilibrium Monorepo (AGPL-3.0)](https://github.com/QuilibriumNetwork/monorepo)
- [Quorum Mobile](https://github.com/QuilibriumNetwork/quorum-mobile)
- [Klearu E2EE ML](https://github.com/QuilibriumNetwork/klearu)
- [MetaVM ZK Framework](https://github.com/QuilibriumNetwork/metavm)
- [QUIL Price Data (CryptoRank)](https://cryptorank.io/price/quilibrium)
- [Quilibrium Network Dashboard](https://dashboard.quilibrium.com/)
- [Quilibrium Node System Requirements](https://docs.quilibrium.com/docs/run-node/system-requirements/)
- [Quilibrium Release Changelog](https://quilibrium.guide/release-change-log)
- [Quilibrium Whitepaper (PDF)](https://quilibrium.com/quilibrium.pdf)
- [Web3 Galaxy Brain - Cassandra Heart Interview](https://web3galaxybrain.com/episode/Cassandra-Heart-Founder-of-Quilibrium)
- [Quilibrium Community Forum](https://quilibrium.discourse.group/)
- [Quilibrium on X (@QuilibriumInc)](https://x.com/QuilibriumInc)
- [Flagship.FYI Deep Dive](https://flagship.fyi/outposts/dapps/a-deep-dive-into-quilibrium/)
- [Coinmonks - Can We Build an Internet Nobody Owns](https://medium.com/coinmonks/quilibrium-can-we-build-an-internet-that-nobody-owns-3ce2bcd166f6)
