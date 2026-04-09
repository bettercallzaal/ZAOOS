# 309 - Snapchain vs Hypersnap: Protocol Architecture Deep Dive

> **Status:** Research complete
> **Date:** April 9, 2026
> **Goal:** Understand the technical architecture of Farcaster's Snapchain, Cassie Heart's Hypersnap fork, Quilibrium's privacy layer, and what this infrastructure means for ZAO OS

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Snapchain understanding** | STUDY this doc - ZAO OS runs on top of Snapchain whether through Neynar or haatz.quilibrium.com. Understanding the data layer helps make better architecture decisions |
| **Hypersnap as ZAO's read provider** | KEEP using haatz.quilibrium.com (already integrated in `src/lib/farcaster/neynar.ts` via `FARCASTER_READ_API_BASE`). Hypersnap is a production-grade Snapchain fork with search indexing, not a toy |
| **Privacy features** | WATCH Quilibrium's oblivious hypergraph - if Cassie adds privacy-preserving queries to Hypersnap, ZAO OS gets private community analytics for free |
| **Validator participation** | SKIP for now - becoming a Snapchain validator requires community election by 15 voters every 6 months. ZAO should focus on building the client, not infrastructure governance |
| **On-chain FID operations** | USE the contract knowledge here when implementing FID registration for ZAO agents (CASTER, ZOE). IdGateway on OP Mainnet, $7 storage + gas |
| **Quilibrium token (QUIL)** | SKIP - token is at $0.015 (down 96.7% from ATH $0.457). Not relevant to ZAO OS until Quilibrium's privacy features are production-ready |

## Comparison: Snapchain vs Hypersnap vs Quilibrium

| Feature | Snapchain (farcasterxyz) | Hypersnap (farcasterorg) | Quilibrium Network |
|---------|------------------------|------------------------|-------------------|
| **Purpose** | Farcaster data layer | Independent Farcaster fork | Decentralized compute/storage platform |
| **Language** | Rust | Rust (fork of Snapchain) | Go |
| **Consensus** | Malachite BFT (Tendermint) | Malachite BFT (same) | Proof of Meaningful Work |
| **TPS** | 10,000+ | 10,000+ (same engine) | Unknown |
| **Finality** | 780ms | 780ms (same engine) | Unknown |
| **Validators** | 11 (elected by 15 voters, 6-month terms) | Independent (farcasterorg, 13 members) | Node operators (fair launch) |
| **Sharding** | Account-level, deterministic | Account-level (same) | Hypergraph-based |
| **Pruning** | 7-day block history, daily snapshots | 7-day (same) | No pruning (permanent) |
| **Privacy** | None (all data public) | None yet (Quilibrium privacy planned) | Oblivious Transfer + MPC |
| **Search** | No built-in search | Tantivy search indexing | Unknown |
| **Neynar API compat** | Not directly (raw gRPC/HTTP) | Full Neynar v2 API layer | Not applicable |
| **License** | MIT | GPL-3.0 | Proprietary (whitepaper public) |
| **Owner** | Neynar (acquired Jan 2026) | farcasterorg (independent) | Quilibrium Inc |

## Snapchain Architecture (The Data Layer ZAO OS Runs On)

### The Problem It Solved: Deltagraph Failures

Before Snapchain (pre-April 2025), Farcaster used a **Deltagraph** - a CRDT-based gossip network where hubs eventually converged on the same state. This had critical problems:

| Problem | Impact |
|---------|--------|
| No global ordering | Nodes disagreed on message state |
| Gossip failures | Messages permanently lost |
| Unbounded state growth | 2 GB/day, ~500 TPS max |
| Full-history sync | New nodes had to replay everything |

Snapchain replaced this with a **blockchain-like ordered data layer** specifically designed for social networks.

### How Snapchain Works End-to-End

```
User Action (cast, like, follow)
    |
    v
App Key Signs Transaction (Ed25519)
    |
    v
Broadcast to Snapchain P2P Network (libp2p gossipsub)
    |
    v
Validator Receives Transaction
    |
    v
Malachite BFT Consensus (11 validators, Tendermint-based)
    |
    v
Transaction Ordered into Block
    |
    v
Block Contains: producer sig + prev hash + state root + txns
    |
    v
Account State Updated (deterministic Merkle trie)
    |
    v
State Propagated to All Nodes
    |
    v
Nodes Serve Data via gRPC + HTTP API (port 3381)
    |
    v
Neynar/Hypersnap Adds Rich API Layer on Top
    |
    v
ZAO OS Fetches via /v2/farcaster/* Endpoints
```

### Transaction Model

Snapchain transactions are fundamentally different from general-purpose blockchains:

| Property | Snapchain | Ethereum |
|----------|-----------|----------|
| Turing complete | No (fixed social primitives only) | Yes |
| Cross-account effects | No (single-account only) | Yes |
| Gas fees | No (storage rent model) | Yes |
| Prunable | Yes (7-day block history) | No |
| Transaction types | Cast, like, follow, profile update, delete | Arbitrary |

This design is why sharding is trivial - accounts are independent, so you can shard by FID with zero cross-shard coordination.

### Consensus: Malachite BFT

| Detail | Value |
|--------|-------|
| Algorithm | Tendermint BFT (Malachite Rust implementation, originally for Starknet) |
| Validators | 11 active |
| Voters | 15 community-elected (select validators) |
| Election cycle | Every 6 months via on-chain GitHub repository signatures |
| Fault tolerance | Up to 3 malicious validators (1/3 BFT threshold) |
| Block time | Sub-second |
| Finality | 780ms average |
| Leader rotation | Periodic or after timeout |

### Sharding

```
Shard 0: FIDs 0-99999      (Chain 1 - Tendermint)
Shard 1: FIDs 100000-199999 (Chain 2 - Tendermint)
...
Shard N: FIDs ...           (Chain N - Tendermint)
Global:  Bundles shard roots (Chain N+1 - Tendermint)
```

- Accounts assigned to shards via deterministic function of FID
- Each shard produces its own state root (Merkle trie)
- Global chain bundles all shard roots into global state root
- No cross-shard communication needed (account independence)
- Linear horizontal scalability

### Pruning & Storage

| Mechanism | Detail |
|-----------|--------|
| Block retention | 7 days (non-epoch blocks) |
| Epoch blocks | Never pruned (chain parameters, leader schedules) |
| Daily snapshots | Published publicly for new node sync |
| Snapshot size | ~200 GB |
| Storage rent | Fixed USD price, paid in ETH via Chainlink oracle |
| Rent period | 1 year per unit |
| Overflow behavior | Oldest transactions auto-pruned (no rejection) |
| Archival nodes | Optional - can keep full history |

### Performance

| Metric | Value |
|--------|-------|
| Throughput | 10,000+ TPS (testnet showed 1,000-2,000 TPS without extensive sharding) |
| Alpha test | 70,000 blocks in one day |
| Capacity | ~2 million daily active users |
| Previous system (Deltagraph) | ~500 TPS, 100,000 users |
| Improvement | 20x TPS, 20x user capacity |
| Mainnet launch | April 16, 2025 |

## On-Chain Contracts (OP Mainnet)

The security-critical components live on Optimism:

| Contract | Purpose | Key Detail |
|----------|---------|------------|
| **IdRegistry** | Maps Ethereum addresses to FIDs | One FID per address, sequential assignment |
| **IdGateway** | FID registration entry point | Requires 1 storage unit purchase (~$7) |
| **StorageRegistry** | Storage unit rental | Fixed USD price, paid in ETH (Chainlink oracle), 1-year terms |
| **KeyRegistry** | Signing key management | Ed25519 (EdDSA) keys, state machine: null -> added -> removed |
| **KeyGateway** | User-facing key addition | Fee enforcement, pausable |
| **Bundler** | Batch operations | Register FID + rent storage + add key in one tx |
| **SignedKeyRequestValidator** | Key metadata validation | Verifies EdDSA signatures and FID ownership |

**Base Mainnet:**
| Contract | Purpose |
|----------|---------|
| **TierRegistry** | Farcaster Pro subscription tiers ($120/year) |

## Hypersnap: What Makes It Different

Hypersnap is a **fork** of `farcasterxyz/snapchain` maintained by the independent `farcasterorg` organization. Based on analyzing its `Cargo.toml` (version 0.11.5):

### Same Foundation
- Same Malachite BFT consensus crates (`malachitebft-core-consensus`, `malachitebft-engine`, `malachitebft-network`, `malachitebft-sync`)
- Same libp2p networking (gossipsub, noise, TCP, QUIC)
- Same RocksDB storage
- Same protobuf/tonic gRPC
- Same ed25519-dalek cryptography
- Same alloy Ethereum integration (for on-chain contract reads)

### Key Additions
| Addition | Crate | Purpose |
|----------|-------|---------|
| **Search indexing** | `tantivy` | Full-text search across Farcaster data - this is how haatz serves the Neynar-compatible search endpoints |
| **Cloud storage** | `aws-sdk-s3` | Snapshot storage/retrieval from S3 |
| **HTTP framework** | `hyper` | The Neynar v2 API compatibility layer |
| **Metrics** | `cadence` | Performance monitoring dashboard (the one Cassie mentioned) |

### The "Hyperdimensional" Part

The name references Quilibrium's **hypergraph data structure**. While not yet fully integrated, the vision is:

1. **Current:** Hypersnap = Snapchain + search indexing + Neynar API layer
2. **Future:** Hypersnap + Quilibrium's oblivious hypergraph = privacy-preserving social data

## Quilibrium's Privacy Architecture

### Oblivious Hypergraph

Traditional databases store data in tables/trees where the structure reveals information. Quilibrium's hypergraph stores data in a structure where:

1. **Node operators can't see what they store** - data is encrypted at rest
2. **Queries don't reveal what you're looking for** - via oblivious transfer
3. **Computation happens on encrypted data** - via multi-party computation (MPC)

### How Oblivious Transfer Works (Simplified)

```
Alice (sender) has messages m0, m1
Bob (receiver) wants message mc (c = 0 or 1)

1. Alice sends point A = a*G on elliptic curve
2. Bob sends B = b*G (if c=0) or B = A + b*G (if c=1)
3. Alice computes keys k0 = H(a*B), k1 = H(a*(B-A))
4. Alice sends E0 = Enc(k0, m0), E1 = Enc(k1, m1)
5. Bob can only compute kb = H(b*A) which equals either k0 or k1
6. Bob decrypts mc, cannot decrypt m(1-c)
```

**Result:** Alice doesn't know which message Bob chose. Bob only gets the message he asked for.

### Quilibrium's Cryptographic Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Signatures | BLS48-581 | Ownership verification (post-quantum consideration) |
| Key management | Ed448 | Access control |
| OT extension | Ferret-based Correlated OT over LPN | 200x faster than basic OT |
| MPC | Multi-party computation | Compute on encrypted data |
| Routing | Shuffled Lattice Routing Protocol | Anonymous message delivery |
| Addressing | Planted Clique Addressing Scheme | Network topology |
| Key exchange | Triple-Ratchet Protocol | Forward secrecy |
| Gossip | Custom gossip layer | State propagation |
| Consensus | Proof of Meaningful Work | Nodes do useful cryptographic computation |

### QUIL Token

| Metric | Value |
|--------|-------|
| Current price | $0.0153 (April 2026) |
| All-time high | $0.4571 (September 2024) |
| Decline from ATH | -96.7% |
| Distribution | Fair launch - no pre-mine, no VC, no ICO |
| Earning mechanism | Node operators contribute compute/storage |
| Issuance model | Generational - new emissions when network surpasses computational milestones |

## Why This Matters for ZAO OS

### Current Integration (Already Built)

ZAO OS already uses Hypersnap via the dual-provider pattern in `src/lib/farcaster/neynar.ts`:
- `FARCASTER_READ_API_BASE=https://haatz.quilibrium.com` for free reads
- `NEYNAR_BASE=https://api.neynar.com` for writes
- `fetchWithFailover()` tries haatz first, falls back to Neynar

This means ZAO OS traffic flows through Hypersnap nodes that:
1. Run the same Malachite BFT consensus as Snapchain
2. Store the same account-sharded data
3. Add Tantivy search indexing on top
4. Serve a Neynar v2 compatible REST API

### Future Implications

| Timeline | What Could Change | ZAO OS Impact |
|----------|------------------|---------------|
| **Now** | haatz provides free reads | Saves $25+/month on Neynar |
| **6 months** | Hypersnap adds privacy queries | ZAO could run private community analytics without exposing member data |
| **1 year** | Quilibrium privacy layer on Hypersnap | Private DMs via protocol (alternative to XMTP), private voting, anonymous feedback |
| **2 years** | ZAO runs own Hypersnap node | Full data sovereignty, custom search indexes, community-specific API |

### The Political Dimension

Understanding the infrastructure helps understand the politics:

```
On-Chain (OP Mainnet)              Off-Chain (Snapchain Network)
  |                                   |
  IdRegistry (FIDs)                  Snapchain (farcasterxyz)
  StorageRegistry (rent)               - 11 validators
  KeyRegistry (signing keys)           - Neynar controls
  TierRegistry (Pro subs)              - MIT license
                                       |
                                     Hypersnap (farcasterorg)
                                       - Independent fork
                                       - 13 members, 2-reviewer rule
                                       - GPL-3.0 license
                                       - Cassie Heart / Quilibrium
                                       - Free API at haatz.quilibrium.com
                                       |
                                     Quilibrium (future)
                                       - Privacy layer
                                       - Oblivious hypergraph
                                       - MPC computation
```

**ZAO OS sits at the application layer** and benefits from competition between Neynar (centralized efficiency) and farcasterorg (decentralized independence). The dual-provider architecture hedges both directions.

## Technical Glossary

| Term | Definition |
|------|-----------|
| **Malachite BFT** | Rust implementation of Tendermint consensus, originally built for Starknet by Informal Systems |
| **Account-level sharding** | Partitioning data by FID so each shard is independent - no cross-shard coordination |
| **Epoch block** | Special block storing chain parameters and leader schedules - never pruned |
| **State root** | Merkle trie root hash representing all account states at a given block |
| **Oblivious Transfer** | Cryptographic protocol where sender doesn't learn which data receiver selected |
| **MPC** | Multi-Party Computation - multiple parties compute a function without revealing their inputs |
| **Hypergraph** | Generalization of a graph where edges can connect any number of nodes (not just 2) |
| **CRDT** | Conflict-Free Replicated Data Type - the old Deltagraph consensus approach |
| **Deltagraph** | Farcaster's pre-Snapchain gossip-based data sync system (deprecated April 2025) |
| **Proof of Meaningful Work** | Quilibrium's consensus where nodes perform useful cryptographic computation |
| **Ed25519/EdDSA** | The signing algorithm used for Farcaster App Keys and Snapchain transactions |
| **BLS48-581** | Quilibrium's signature scheme with post-quantum considerations |
| **Tantivy** | Rust full-text search engine (like Lucene) - used by Hypersnap for search indexing |
| **libp2p** | Peer-to-peer networking library used by both Snapchain and Hypersnap |

## Sources

- [FIP: Snapchain Proposal (farcasterxyz/protocol #207)](https://github.com/farcasterxyz/protocol/discussions/207) - Original technical specification
- [Snapchain Documentation](https://snapchain.farcaster.xyz) - Official docs
- [Farcaster Architecture Overview](https://docs.farcaster.xyz/learn/architecture/overview) - Hybrid on-chain/off-chain design
- [Farcaster Contracts (docs.md)](https://github.com/farcasterxyz/contracts/blob/main/docs/docs.md) - On-chain contract specs
- [Quilibrium Whitepaper](https://quilibrium.com/quilibrium.pdf) - MPC platform architecture
- [Quilibrium Protocol Overview](https://docs.quilibrium.com/docs/protocol/overview/) - Protocol components
- [Quilibrium Oblivious Transfer](https://docs.quilibrium.com/docs/learn/oblivious-hypergraph/oblivious-transfer/) - OT cryptographic details
- [Hypersnap Repository (GPL-3.0)](https://github.com/farcasterorg/hypersnap) - Fork source code
- [Snapchain: How Farcaster Rewired Social Media (HeimLabs)](https://medium.com/@heimlabs/snapchain-how-farcaster-rewired-social-media-for-a-decentralized-future-e4c525754786) - Technical analysis
- [Snapchain Novel Data Layer (Cuckoo AI)](https://cuckoo.network/blog/2025/04/07/farcasters-snapchain-a-novel-data-layer-solution-for-web3-social-networks) - Performance analysis
- [Farcaster Protocol Paradox (BlockEden)](https://blockeden.xyz/blog/2025/10/28/farcaster-in-2025-the-protocol-paradox/) - Ecosystem analysis
- [Quilibrium Token Data (CryptoRank)](https://cryptorank.io/price/quilibrium) - QUIL price and metrics
