# Quilibrium Network

> Source: [github.com/QuilibriumNetwork](https://github.com/QuilibriumNetwork)

## What Is Quilibrium?

A **decentralized protocol** combining compute, storage, and networking into a unified infrastructure layer. Founded by **Cassandra Heart**.

---

## Core Architecture

| Component | Description |
|-----------|-------------|
| **Consensus** | Proof of Meaningful Work (PoMW) — nodes do cryptographically useful computation |
| **Data Structure** | Hypergraph (not blockchain/DAG) — richer data relationships |
| **Privacy** | Oblivious Hypergraph — node operators can't see what they store/compute |
| **Communication** | Channels — primitives for messages, data, state transitions |
| **Cryptography** | Oblivious transfer + MPC (multi-party computation) |
| **Language** | Go (main client: `ceremonyclient` repo) |

---

## QUIL Token

- Native token of Quilibrium
- **Fair launch** — no pre-mine, no VC, no ICO
- Earned by node operators contributing compute/storage
- Used for: paying for network resources, incentivizing nodes, staking
- Tradeable on DEXs

---

## Developer Tools

| Resource | Description |
|----------|-------------|
| `ceremonyclient` | Main node client (Go) |
| gRPC API | Exposed by node for querying state, submitting transactions |
| Go libraries | Core protocol libraries |

**No JavaScript/TypeScript SDK** as of early 2025. Web integration requires a Go bridge service.

---

## Relevance to ZAO OS

| Layer | Current Approach | Quilibrium Future |
|-------|-----------------|-------------------|
| **Identity (ZIDs)** | PostgreSQL + EAS | ZID attestations on Quilibrium (privacy-preserving) |
| **Reputation** | Off-chain tracking | Respect token state on Quilibrium |
| **Content** | Farcaster Hubs | Censorship-resistant backup storage |
| **Media** | CDN links | Decentralized storage referenced by content hashes |
| **Compute** | Centralized servers | Feed algorithms, moderation on Quilibrium |

### Integration Approach
1. Run a Quilibrium node as part of app infrastructure
2. Build Go middleware service bridging Farcaster Hub events ↔ Quilibrium state
3. Store ZID attestations and Respect balances on Quilibrium
4. Use privacy features for DMs, private groups

---

## Maturity Assessment

| Factor | Status |
|--------|--------|
| Protocol stability | Active development, evolving |
| Developer docs | Sparse — community-driven (Discord) |
| JS/TS SDK | Not available — Go only |
| Network size | Growing but smaller than established L1s |
| Production readiness | Not yet for primary infrastructure |

---

## Strategy

- **Now:** Design with Quilibrium-compatible data schemas
- **Near-term:** Build on PostgreSQL + EAS (proven, fast to iterate)
- **Medium-term:** Experiment with Quilibrium node for ZID/Respect storage
- **Long-term:** Migrate identity + reputation infrastructure to Quilibrium

---

## Resources

- Website: [quilibrium.com](https://quilibrium.com)
- GitHub: [github.com/QuilibriumNetwork](https://github.com/QuilibriumNetwork)
- Community: Quilibrium Discord
