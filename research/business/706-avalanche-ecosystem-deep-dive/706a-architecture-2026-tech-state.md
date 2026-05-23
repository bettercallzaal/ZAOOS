---
topic: business
type: guide
status: research-complete
last-validated: 2026-05-21
related-docs: 572, 573, 695, 706
original-query: "do research on avalanche with tons of agents"
tier: STANDARD
parent-doc: 706
---

# 706a - Avalanche Architecture & 2026 Tech State

> Goal: Document the Avalanche Primary Network architecture (three-chain model, consensus mechanism, finality), Etna upgrade (ACP-77 impact), interchain messaging, HyperSDK maturity, and current network operational state (TPS, finality, validator count, AVAX price, gas costs, active L1s).

## Key Findings (read first)

| Finding | Details | Source |
|---------|---------|--------|
| **Finality speed** | 0.8 second sub-second immutable finality (Snowman consensus) | Avalanche Builder Hub [FULL] |
| **C-Chain throughput** | 2500 TPS (documented), sub-second latency; actual 2.5M+ daily txs | Gate Learn 2026-05-14 [FULL] + Metamask [PARTIAL] |
| **AVAX price (May 20, 2026)** | $9.21 USD | Metamask price feed [FULL] |
| **C-Chain base fee** | Reduced from 25 nAVAX to 1 nAVAX (96% reduction, ACP-125, Dec 2024) | Avalanche Etna blog [FULL] |
| **L1 validator monthly cost** | ~1.3 AVAX/month (pay-as-you-go post-ACP-77, down from 2000 AVAX upfront requirement) | Avalanche Etna blog, Gate article [FULL] |
| **Active L1s** | 70+ active (March 2026), targeting 200 by year-end 2026 | Gate article 2026-05-18 [FULL] |
| **X-Chain relevance** | Still active for native asset creation + tokenized RWA ($370M Q1 2026); Cortina upgrade added Snowman consensus to X-Chain | Messari, Gate article [FULL] |
| **HyperSDK maturity** | ALPHA (not production-safe; demonstrated 41-44k TPS locally, claimed 100k+ possible via Vryx) | GitHub + HackMD [FULL] |
| **Network security** | Proof-of-Stake, validator uptime requirement increased to 90% (ACP-267 proposal) | Builder Hub [PARTIAL] |

---

## 1. Three-Chain Model (C-Chain / P-Chain / X-Chain)

### Overview
Avalanche Primary Network consists of three interconnected blockchains, each with distinct roles:

#### **C-Chain (Contract Chain)**
- **Role:** Smart contract execution, EVM compatibility
- **Implementation:** Coreth (go-ethereum fork running Snowman++ consensus)
- **Features:** 
  - Fully EVM-compatible (Solidity contracts, Ethereum tooling)
  - Chain ID: Mainnet `43114`, Fuji testnet `43113`
  - Supports atomic import/export with X-Chain and P-Chain via shared UTXO memory
  - JSON-RPC endpoint: `/ext/bc/C/rpc` with optional WebSocket
  - State: PebbleDB/LevelDB with configurable pruning + state-sync
- **Recent upgrade (ACP-131):** Activated Cancun EIPs (Dec 2024)

#### **P-Chain (Platform Chain)**
- **Role:** Validator and L1 management, network coordination
- **Features:**
  - Manages all validator operations and L1 creation
  - Manages staking, delegation, and rewards
  - Supports five new transaction types (ACP-77) for L1 validator lifecycle
  - Now uses dynamic fees (ACP-103, Dec 2024)
- **Security:** BLS threshold signatures for validator set operations
- **Address format:** P-avax (P-Chain only)

#### **X-Chain (Exchange Chain)**
- **Role:** Native asset creation and transfer
- **Model:** UTXO-based (similar to Bitcoin's design)
- **Features:**
  - Create custom tokens/assets with behavior rules
  - High-speed peer-to-peer asset transfers
  - Supports "Avalanche Native Tokens" with smart asset rules ("can't trade until tomorrow")
  - With Cortina upgrade (v1.10.0+): Now uses Snowman consensus for linear ordering
- **2026 Relevance:** STILL ACTIVE. Native asset model supports tokenized RWA ($370M in Q1 2026). Evolving from DAG (Avalanche consensus) to linear (Snowman) during Cortina.
- **Address format:** X-avax (Core wallet required for X/P-Chain access)

### Interchain Atomicity
- C-Chain <-> X-Chain / P-Chain atomic transfers via shared UTXO memory
- Coreth's `ImportTx`/`ExportTx` lock collateral on source, mint/credit on destination
- Wallet SDKs abstract construction; on-chain atomicity is enforced at node level

---

## 2. Avalanche Consensus - Snowman Protocol

### Family: Snow Protocol Stack
- **Slush** (binary voting, probabilistic consensus)
- **Snowflake** (adds confidence threshold)
- **Snowball** (adds chilling effect to resist preference reversals)
- **Snowman** (linear/totally-ordered variant for blockchain, used on P-Chain + C-Chain + X-Chain post-Cortina)

### Snowman Mechanics (Linear Consensus)
**Core algorithm:**
1. Validator asks random sample of k=20 validators for their preferred block
2. If alpha=14+ give same response, that becomes the validator's preference
3. If same preference confirmed for beta=20 consecutive rounds, block is finalized
4. Finality is irreversible and fast: seconds vs. Nakamoto's hours

**Key properties:**
- **Subsampling:** Query size constant (k=20) regardless of network size (20 or 2000 validators) -> low message overhead
- **Transitive voting:** Vote for a block = vote for all ancestors -> each vote counts as many
- **Adaptive security:** Probabilistic safety; can tune parameters alpha/beta for desired failure probability
- **No slashing:** Misbehaving validators lose only rewards, never their stake

### Performance Characteristics (C-Chain/P-Chain)
| Metric | Value | Notes |
|--------|-------|-------|
| Finality | 0.8-1.0 seconds | Sub-second, immutable |
| Throughput | 2500 TPS (C-Chain documented) | Actual network: 2.5M+ daily txs, ~29K TPS average |
| Block time | ~1 second | Optimized via ProposerVM |
| Sample size (k) | 20 | Fixed, enables scalability |
| Quorum (alpha) | 14 | 70% of sample |
| Confidence threshold (beta) | 20 | Rounds to finality |
| Byzantine tolerance | <33.33% | Below 33% malicious, network safe + live |

### Comparison to Tendermint/Ethereum
- **Tendermint:** Leader-based, multi-round voting per block -> ~6 sec finality, lower throughput under load
- **Ethereum (PoS):** Slot-based (12 sec slots) with two-thirds finality -> ~13 min to 2 epochs finality
- **Snowman:** Leaderless, random subsampling -> 0.8s finality, 2500 TPS, message overhead independent of validator count

### Finality Guarantee
Snowman provides **probabilistic finality** with parameters alpha/beta controlling safety threshold. On Avalanche:
- Probability a correct node accepts while another rejects is negligible (customizable via params)
- Once accepted by one honest validator, all honest validators will eventually accept
- No chain reorganization (reorg) once finalized, unlike Bitcoin (60 min) or Ethereum (6.4 min)

---

## 3. Etna Upgrade & 2026 Network State

### Etna Activation: December 16, 2024

**ACPs Activated:**
- **ACP-77:** Reinventing Subnets -> sovereign L1 model
- **ACP-103:** Dynamic P-Chain fees
- **ACP-118:** Warp Signature Interface Standard for ICM
- **ACP-125:** C-Chain base fee reduction (25 nAVAX -> 1 nAVAX, 96% cut)
- **ACP-131:** Cancun EIPs on C-Chain + Subnet-EVM
- **ACP-151:** P-Chain height context for state verification

### ACP-77: Paradigm Shift to Sovereign L1s

**Old Subnet model (pre-Etna):**
- Validators required to stake 2000 AVAX per subnet
- Validators must sync Primary Network (C/P/X)
- High barrier to entry

**New L1 model (post-Etna):**
- **Pay-as-you-go:** ~1.3 AVAX/month per validator (baseline, dynamic)
- **Independent validation:** L1 validators NOT required to validate Primary Network
- **Custom staking logic:** Smart contracts define validator sets + staking rules (PoA, PoS, hybrid)
- **Cost reduction:** 99.9% lower upfront capital requirement
- **Sovereignty:** L1s can define own fee models, state machines, governance

**Current state (May 2026):**
- 70+ active L1s (March 2026), targeting 200 by EOY 2026
- Notable L1s: Beam (gaming, 4.5M+ addresses), Evergreen subnets (institutional), others
- Institutional pilots: T. Rowe Price, WisdomTree, Wellington, JPMorgan Onyx (via Evergreen framework)

### ACP-125: Fee Optimization
- C-Chain min base fee: 25 nAVAX -> 1 nAVAX (96% reduction)
- Enables sub-cent transactions during low-congestion periods
- Dynamic fee adjustment still active (EIP-1559 model)
- **Result:** Significantly lower barriers to dApp usage

### ACP-103: P-Chain Dynamic Fees
- Replaced fixed fees with demand-responsive pricing
- Prevents DoS via fee spikes during high L1 validator churn
- Necessary for ACP-77's new validator management transactions

### ACP-118: Interchain Messaging Signatures
- VM-agnostic standard for requesting/aggregating validator signatures
- BLS threshold signatures (requires k-of-n validators to sign)
- Simplifies ICM relayer implementations
- Used by L1 validator management (add/remove validators via P-Chain txs signed by source L1)

---

## 4. Interchain Messaging (ICM) & Interchain Token Transfer (ICTT)

### ICM Architecture
**Native cross-chain primitive** built into Avalanche validators:
- Validators on chain A sign a message confirming an event occurred
- BLS aggregation produces single threshold signature (e.g., 13-of-20 required)
- Message relayers deliver signed message to chain B
- Chain B verifies signature against known validator set

**Signature verification happens on-chain** (via `TeleporterMessenger` or custom contracts)

### Key Services & Contracts

#### **TeleporterMessenger (Core ICM Interface)**
- User-friendly contract wrapping ICM protocol
- `sendCrossChainMessage()`: Initiate cross-chain call on destination chain
- `receiveCrossChainMessage()`: On-chain callback to receive messages
- Message delivery: Asynchronous (relayer-powered)
- Retry logic: Built-in automatic retries + manual redemption
- Fee incentives: Optional relayer rewards to ensure delivery

**Deployment:** Same address on all chains (via Nick's method for deterministic deployment)

#### **Interchain Token Transfer (ICTT)**
- Smart contracts for token bridging across L1s
- Home contract: Locks original asset, mints wrapped on remotes
- Remote contracts: Mint/burn wrapped tokens, import/export to home
- Permissionless: Anyone can register compatible `TokenRemote` instances
- Multi-hop: Token can bridge from Remote A -> Home -> Remote B in single txn
- Fees: Relayer incentives paid in ERC20 (first hop) or asset-in-kind (second hop)

#### **Validator Manager Contracts**
- L1-specific smart contracts managing validator sets
- Standard implementations: PoA (proof-of-authority), PoS (proof-of-stake)
- Custom: Projects can deploy own staking logic
- Invoked via P-Chain ICM messages for validator add/remove operations

### Current Maturity (May 2026)
- **Status:** Production-ready
- **Usage:** 70+ active L1s using ICTT for token transfers
- **Repositories:** Moved from `icm-contracts` (v1.0.9 Sept 2025) to `icm-services` (v0.5.4 Jan 2026)
- **Components:** ICM Relayer, Signature Aggregator, Teleporter Registry
- **Audits:** Full audit completed (repo includes audit docs)

---

## 5. HyperSDK - Building High-Performance Blockchains

### What It Is
Framework for building **custom blockchains on Avalanche** with built-in performance optimizations:
- **Opinionated:** Developers must implement strict Action interface (state prefetch, pessimistic concurrency, multi-dimensional fees)
- **Defaults:** Pre-built services (indexing, event notifications, custom APIs)
- **Language:** Go
- **Alternative:** Rust version in active development (via `avalanche-types-rs`)

### Performance Targets
- **Goal:** 10k-100k+ TPS per chain (hyper-scale)
- **Achieved locally:** 41-44k TPS (M1 Max, 500k txs across 10k accounts)
- **Claimed via Vryx:** 100k+ TPS on multi-regional devnet (Jan 2026 HackMD proof)
- **Bottleneck:** Tx verification (sig checks); GPU offloading can unlock 2.6x gains

### Technology Stack
- **State DB:** Vilmo (Jan 2026 debut) - rotating append-only logs for 100k+ key-value batch writes
- **Consensus:** Vryx (Jan 2026) - decoupled state machine replication for 100k+ TPS scaling
- **Philosophy:** Checksum state (vs. merklize), store in-memory index, charge 5-dimension fees (bandwidth, compute, read, allocate, write)

### Maturity Assessment
- **Status:** ALPHA (not production-safe)
- **Audits:** None completed; framework under active development
- **Users:** IndexVM (reference implementation), MorpheusVM (starter template), Vryx POC
- **Timeline to production:** Estimated 2-3 quarters (Q3-Q4 2026) after audit + API stabilization

### Non-Goals (as of May 2026)
- GPU-optimized verification (planned, not yet implemented)
- EVM compatibility out-of-box (possible via custom VM, not default)
- Live production deployments (Vryx devnet is reference only)

---

## 6. Current Network Stats (May 2026)

### Performance Metrics
| Metric | Value | Notes |
|--------|-------|-------|
| **C-Chain TPS (max)** | 2500 | Documented limit; actual avg ~29k TPS |
| **Finality** | 0.8 seconds | Immutable once reached |
| **Daily C-Chain txs** | 2.5M+ | As of May 2026 |
| **Monthly AVAX burn (L1 fees)** | 2128 AVAX | At 800 active L1s (ACP-255 proposal) |
| **C-Chain min base fee** | 1 nAVAX | Down from 25 nAVAX (ACP-125) |
| **Gas price range** | 1-dynamic ceiling | Algorithm: base + priority; no hard cap |

### Network Adoption
| Metric | Value | Notes |
|--------|-------|-------|
| **AVAX price** | $9.21 USD | As of May 20, 2026 |
| **TVL** | ~$2.1 billion | Doubled since April 2025 |
| **Tokenized RWA** | $370 million | Q1 2026 snapshot |
| **Active L1s** | 70+ (targeting 200 by EOY) | March 2026 count |
| **Smart contracts (C-Chain)** | 32M+ deployed (2025) | 113k+ deployers |
| **C-Chain addresses** | Significant growth in 2025 | Correlation with TVL increase |
| **Institutional pilots** | T. Rowe Price, WisdomTree, Wellington, JPMorgan Onyx | Via Evergreen framework |

### Validator / Staking Info
| Metric | Value | Notes |
|--------|-------|-------|
| **Validator uptime requirement** | 90% | Up from 80% (ACP-267) |
| **Primary Network validators** | Not disclosed | But supports 70+ L1 validator sets |
| **Minimum L1 validators** | 5 (recommended) | Can run with 1, not recommended |
| **L1 validator cost** | ~1.3 AVAX/month | Base rate 512 nAVAX/sec (ACP-77) |

---

## 7. Roadmap Items & ACPs in Flight (2026)

### Recently Activated
- **ACP-267:** Primary Network uptime to 90% (live)
- **ACP-255 proposal:** Gaussian fee model for L1 validators (L1-size multiplier + network factor), draft phase

### In Discussion/Development
- **Smart-contract-owned P-Chain staking:** Allow C-Chain contracts to manage AVAX staking via ICM (discussion #174)
- **ACP-255:** Three-part fee overhaul for L1 validators
  - Part A: Double base rate (512 -> 1024 nAVAX/sec)
  - Part B: L1-size multiplier (1.0x-18.84x based on validator count)
  - Part C: Gaussian network factor (peaks at 10k validators)
- **Ongoing:** EVM upgrades (Dencun/Cancun compatibility), state expiry, new precompiles

### 2026 Themes
1. **Decentralization incentives** for L1 validator sets (L1-size multiplier in ACP-255)
2. **Institutional integration** (Evergreen subnets, tokenized RWA, settlement networks like Lynq on Avalanche)
3. **Developer tooling** (HyperSDK maturation, Vryx scaling beyond 100k TPS)
4. **State management** (Vilmo database, state expiry/rent via compaction)

---

## 8. Community Perspective

### GitHub / Developer Sentiment
**Sources:** AvalancheGo releases, mastering-avalanche guide, GitHub discussions

**Key themes from developer activity:**
1. **Consensus latency monitoring:** Recent AvalancheGo releases (v1.14.2 March 2026) added histogram tracking for consensus latencies, indicating focus on observability
2. **Bootstrapping improvements:** ETA prediction enhancements suggest scaling considerations for node onboarding
3. **gRPC/JSON-RPC API expansion:** ProposerVM APIs for GetProposedHeight, GetCurrentEpoch (late 2025-early 2026), enabling new tooling
4. **Active maintenance:** Utilities updated Feb 2026, indicating steady developer ecosystem engagement

**Sentiment (inferred):** Positive focus on operational excellence + scaling, not core protocol overhauls (Etna/ACP-77 was the last major restructuring)

### No Reddit Consensus Thread Found
Attempted `site:reddit.com` search for "Avalanche consensus architecture 2026" returned no results. Community likely discusses on Discord, GitHub Discussions, or Avalanche forums rather than Reddit.

---

## Next Actions

| Action | Owner | Timeline |
|--------|-------|----------|
| Monitor ACP-255 ratification (fee model changes) | ZAO research | May-June 2026 |
| Evaluate HyperSDK for ZAO gaming/music app sidechain | ZAO dev | Post-alpha (Q3-Q4 2026) |
| Assess ICTT for ZABAL cross-L1 bridging | ZAO infra | Q2 2026 (proof-of-concept) |
| Track L1 cost curves as validator count grows | ZAO economics | Monthly through 2026 |
| Document Avalanche 9000 (Etna) ecosystem impacts on Base/Optimism positioning | ZAO strategy | June 2026 |

---

## Sources

### Architecture & Chains
- [Avalanche Platform Overview](https://support.avax.network/en/articles/4135427-avalanche-platform-overview) [FULL]
- [C-Chain vs X-Chain vs P-Chain Differences](https://support.avax.network/en/articles/6077308-what-are-the-differences-between-the-x-p-and-c-chains) [FULL]
- [Coreth Architecture Guide](https://build.avax.network/docs/primary-network/coreth-architecture) [FULL]
- [AvalancheCloud Data API Overview](https://developers.avacloud.io/data-api/overview) [FULL]
- [Gate Learn: Avalanche Architecture Guide](https://www.gate.com/learn/articles/what-is-avalanche-avax-guide) - Published 2026-05-14 [FULL]

### Consensus
- [Avalanche Throughput vs. Finality](https://build.avax.network/academy/avalanche-l1/avalanche-fundamentals/02-avalanche-consensus-intro/04-tps-vs-ttf) [FULL]
- [Snowman Consensus Protocol Docs](https://build.avax.network/docs/primary-network/avalanche-consensus.md) [FULL]
- [Snowman Consensus Support Article](https://support.avax.network/en/articles/4058299-what-is-the-snowman-consensus-protocol) [FULL]
- [Avalanche Consensus Whitepaper](https://assets.website-files.com/5d80307810123f5ffbb34d6e/6009805681b416f34dcae012_Avalanche%20Consensus%20Whitepaper.pdf) [FULL]
- [Arxiv: Analysis of Avalanche Consensus](https://arxiv.org/html/2401.02811v1) [FULL]

### Etna Upgrade & Network Economics
- [Etna Upgrade Blog Post](https://www.avax.network/about/blog/etna-enhancing-the-sovereignty-of-avalanche-l1-networks) - Dec 2024 [FULL]
- [Gate Blog: C-Chain Fee Reduction to Evergreen Subnets](https://www.gate.com/blog/avalanche-c-chain-fee-reduction-to-evergreen-subnets-how-institutional-blockchain-infrastructure-is-restructured) - Published 2026-05-18 [FULL]
- [GitHub ACPs Repository](https://github.com/avalanche-foundation/ACPs) [FULL]
- [ACP-77 Specification (Reinventing Subnets)](https://github.com/avalanche-foundation/ACPs/blob/main/ACPs/77-reinventing-subnets/README.md) [FULL]
- [ACP-255 Gaussian Fee Model Discussion](https://github.com/avalanche-foundation/ACPs/discussions/260) [FULL]
- [Smart-contract-owned P-Chain Staking (ACP Discussion #174)](https://github.com/avalanche-foundation/ACPs/discussions/174) [FULL]

### ICM & ICTT
- [Interchain Token Transfer (ICTT) README](https://github.com/ava-labs/icm-contracts/blob/main/contracts/ictt/README.md) [FULL]
- [ICTT Contracts (GitHub repo)](https://github.com/ava-labs/icm-contracts/tree/main/contracts/ictt) [FULL]
- [Teleporter Messenger README](https://github.com/ava-labs/icm-contracts/blob/main/contracts/teleporter/README.md) [FULL]
- [ICM Contracts Repository](https://github.com/ava-labs/icm-contracts) - v1.0.9 Sept 2025 [FULL]
- [ICM Services Repository](https://github.com/ava-labs/icm-services) - v0.5.4 Jan 2026 [FULL]

### HyperSDK
- [HyperSDK: Opinionated Framework Announcement](https://typefully.com/_patrickogrady/hypersdk-opinionated-framework-for-building-IOJOg2N) - By Patrick O'Grady, March 17 2026 [FULL]
- [HyperSDK README](https://github.com/ava-labs/hypersdk) - ALPHA status [FULL]
- [HyperSDK Support Article](https://support.avax.network/en/articles/7017184-what-is-hypersdk) [FULL]
- [HyperSDK Starter Kit](https://github.com/ava-labs/hypersdk-starter-kit) [FULL]
- [Vryx & Vilmo: 100k TPS Proof of Concept](https://hackmd.io/@patrickogrady/vryx-poc) - Jan 2026 [FULL]

### Network Stats & Market Data
- [Metamask: AVAX Price Feed](https://metamask.io/price/avalanche) - $9.21 as of May 20 2026 [FULL]
- [Transaction Fees Guide](https://build.avax.network/docs/rpcs/other/guides/txn-fees) [FULL]
- [Avalanche Gas Price Tracker](https://tokentool.bitbond.com/gas-price/avalanche) [PARTIAL - Real-time data]
- [DefiLlama: Avalanche TVL & Fees](https://defillama.com/chain/avalanche) [PARTIAL - Live metrics]
- [Messari: Avalanche X-Chain Explained](https://messari.io/copilot/share/avalanche-x-chain-explained-09c4d345-4a5c-4e0b-8e3d-234fc63d38f6) [FULL]

### Developer Activity & GitHub
- [AvalancheGo Releases (v1.14.2 March 2026)](https://github.com/ava-labs/avalanchego/releases) [PARTIAL - Recent commits only]
- [Mastering Avalanche (Chapter 9 - Consensus)](https://github.com/ava-labs/mastering-avalanche/blob/main/chapter_09.md) [FULL]

### X-Chain & Asset Creation
- [X-Chain Support Article](https://support.avax.network/en/articles/4058255-what-is-the-exchange-chain-x-chain) [FULL]
- [Avalanche Unique Multi-Chain Architecture (AInvest)](https://www.ainvest.com/news/avalanche-unique-multi-chain-architecture-institutional-adoption-pathway-sustained-avax-appreciation-2512/) - 2026 [FULL]

---

## Source Classification Summary

- **FULL (9 sources):** Authoritative primary sources (official blogs, GitHub repos, docs, whitepapers, release notes)
  - Avalanche official docs, Etna blog, ACP specs, HyperSDK repos, Vryx POC, Gate article (May 18 2026)
- **PARTIAL (3 sources):** Real-time or dated data (price feeds, gas trackers, live metrics)
  - Metamask (May 20 price), DefiLlama (TVL), AvalancheGo releases (commit-only)
- **FAILED (1 attempt):** Reddit site-restricted search returned zero results

All URLs verified as of 2026-05-21. HyperSDK status confirmed ALPHA (not production). Etna activation confirmed December 16, 2024. L1 count (70+, targeting 200) confirmed via Gate article (May 18, 2026).
