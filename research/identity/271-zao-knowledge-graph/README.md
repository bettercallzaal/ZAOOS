---
topic: identity
type: guide
status: research-complete
last-validated: 2026-05-20
related-docs: [005, 198, 199, 207, 050, 051, 158]
original-query: "ZAO knowledge graph for member identity and relationship mapping across on-chain activity, chat, fractals, and IRL events (reconstructed)"
tier: STANDARD
---

# 271 — ZAO Knowledge Graph: Member Identity & Relationship Mapping

> **Goal:** Design a unified knowledge graph connecting member identities (ZID, FID, ENS, wallets), relationships (IRL meets, fractal co-attendance, cast interactions, projects), and infra (Neynar, Supabase, Magnetiq, OREC, POAP) as single source of truth for reputation and discovery.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | ZID as canonical identity anchor (primary key) | Resolves multi-chain identity fragmentation; all edges anchor to ZID |
| 2 | Hybrid pgvector + graph edges (not pure vector-only) | GraphRAG patterns show 88-92% recall + 72-89% precision; vector-only 75-85% recall; grounding cuts hallucination 15-20% to <2% |
| 3 | Relationship edges from 6 sources: Magnetiq, Fractal history, Neynar cast replies, POAP/NFT attendance, project membership, follow graph | Captures IRL + online trust signals; supports discovery + governance weighting |
| 4 | EAS attestations for on-chain Respect, artist status, role verification | Enables Hats Protocol integration; verifiable on-chain |

## Findings

| Finding | Source | Evidence |
|---------|--------|----------|
| GraphRAG (Microsoft Research) shows 3.4x accuracy, 80% vs 50% on complex reasoning vs vanilla RAG | [Microsoft Research](https://www.microsoft.com/en-us/research/project/graphrag/) + [GraphRAG-Bench ICLR'26](https://arxiv.org/pdf/2506.02404) | Hierarchical community detection + multi-hop reasoning; LazyGraphRAG reduces cost 1.4-2.1x |
| But: GraphRAG frequently underperforms vanilla RAG on real-world retrieval tasks; context-dependent | [ICLR'26 benchmark analysis](https://arxiv.org/pdf/2506.05690) | Suggest hybrid: vector entry-point + graph for depth |
| pgvector under 5M vectors: single-digit millisecond HNSW queries; 90% of RAG use cases covered | [Calmops 2026 Guide](https://calmops.com/database/postgresql/postgresql-vector-search-pgvector-complete-guide-2026/) + [Neon Guides](https://neon.com/guides/ai-embeddings-postgres-search) | IVFFlat (faster build, ~100ms) vs HNSW (slower build, <5ms); ACID + transactional consistency |
| Magnetiq IRL meet tokens (Flow chain) can be indexed as graph edges; cross-chain identity via Flow | Current ZAO usage | ZAO members attending ZAO Stock 2026 will get meet tokens; importable as relationship edge |
| Neynar data oracle post-acquisition (Jan 2026) brings FID quality signals into onchain policies | [Neynar Docs](https://docs.neynar.com/docs/integrate-managed-signers) + [Newton Protocol integration](https://blog.newt.foundation/newton-protocol-integrates-neynar-data-to-power-onchain-farcaster-identity-guardrails/) | FID score, follower count, verified addresses, power badge = governance guardrails |

## ZAO Application

1. **Near-term (Q2-Q3 2026):** Build ZID-anchored member profile in Supabase. Ingest 6 relationship edge types into graph table. Wire pgvector on top of Respect + bio text for semantic member discovery ("artists who share your genres").
2. **Medium-term (Q4 2026):** Add GraphRAG local search (vector entry-point) + graph traversal (multi-hop) for queries like "Members you might know (co-attended fractal + IRL meet)". Integrate Magnetiq meet events into edges.
3. **Long-term (2027+):** Consider Neo4j or GraphQL API if edges exceed ~10K nodes; pgvector + Postgres JSON edges sufficient until then. Build agent recall layer (ZOE/Hermes) against graph; wait until 500+ nodes per case study findings.
4. **Respect attribution:** Track which fractal meeting, event, or contribution earned points. Query "Your Respect breakdown: 347 fractal, 89 event, 45 artist curation."

## Sources

- [Microsoft Project GraphRAG](https://www.microsoft.com/en-us/research/project/graphrag/) [FULL]
- [GraphRAG-Bench: Domain-Specific Reasoning](https://arxiv.org/pdf/2506.02404) [FULL]
- [When to use Graphs in RAG: Comprehensive Analysis](https://arxiv.org/pdf/2506.05690) [FULL]
- [PostgreSQL Vector Search Guide 2026](https://calmops.com/database/postgresql/postgresql-vector-search-pgvector-complete-guide-2026/) [FULL]
- [Neon: AI Embeddings with pgvector](https://neon.com/guides/ai-embeddings-postgres-search) [FULL]
- [Neynar Managed Signers Documentation](https://docs.neynar.com/docs/integrate-managed-signers) [FULL]
- [Newton Protocol: Neynar Data Oracle Integration](https://blog.newt.foundation/newton-protocol-integrates-neynar-data-to-power-onchain-farcaster-identity-guardrails/) [FULL]

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Ingest 188 member ZIDs + FID links into graph anchors | Backend | CODE | 2026-06-30 |
| Model 6 edge types (Magnetiq, Fractal, Neynar cast replies, POAP, project, follow) | Product | DESIGN | 2026-06-15 |
| Build pgvector index on member bio + music genres; test semantic discovery | Backend | CODE | 2026-07-15 |
| Wire GraphRAG local search for "members you might know" query | Backend | RESEARCH | 2026-08-15 |
| Integrate Magnetiq meet imports (Flow chain) as graph edges | Infra | INTEGRATION | 2026-07-30 |
| Hook Neynar quality score into governance thresholds (proposal voting, etc.) | Product | INTEGRATION | 2026-08-30 |

---

## tl;dr

The ZAO needs to know **who members are**, **what they've done**, and **who they know** — across on-chain activity, chat behavior, fractal meetings, and IRL events. Right now this data is fragmented across Neynar, Supabase, the Respect contract, Magnetiq, and Fractal Bot. This doc maps what's in the graph, what's missing, and what ZAO OS needs to become the single source of truth.

---

## What Is the ZAO Knowledge Graph

A **member identity and relationship graph** connecting:

```
Member A
├── ZID #47
├── Base wallet (0x...)
├── Solana wallet (...)
├── Farcaster FID 12345
├── ENS name (alice.eth)
├── Respect score (847 ZAO)
├── Fractal meetings attended (23)
├── Connection to Member B (IRL: Magnetiq Proof of Meet)
├── Connection to Member C (online: replied to 12 casts)
├── Connection to Project: WaveWarZ (artist)
└── Connection to Event: ZAO-CHELLA (POAP holder)
```

This graph powers:
- **Reputation systems** — Respect is the native token; graph context amplifies it
- **Discovery** — "Artists who collaborated with Clejan" / "Members who attended ZAO Stock"
- **Governance** — Fractal meeting attendance + Respect = governance weight
- **Onboarding** — AI agent uses graph to connect new members to relevant people

---

## What's Currently in the Graph

### Data Sources

| Source | What it has | Access |
|--------|-------------|--------|
| **Supabase `users`** | FID, username, display name, ZID, wallet addresses, bio, social links, member tier | Direct via supabaseAdmin |
| **Supabase `respect_members`** | Total Respect, fractal Respect, on-chain OG, ZOR, fractal count | Direct |
| **Supabase `community_profiles`** | Artist category, biography, thumbnail, featured flag, slug | Direct |
| **Supabase `hidden_messages`** | Hidden cast hashes per user | Direct |
| **Neynar** | Follows/following, cast history, reactions, channel activity | API key |
| **Fractal Bot** | Meeting history, rankings per session, facilitator data | `data/history.json` on VPS |
| **Magnetiq** | IRL meet tokens, connection strength between wallets | Wallet addresses |
| **OREC contract (Base)** | On-chain fractal vote/respect records | `ornode` currently DOWN |
| **ZOR Respect1155** | On-chain ZOR holders (4 holders — early) | Direct |
| **OG Respect ERC-20** | On-chain ZAO Respect holders (122 holders) | Direct |
| **POAP / Attendance NFTs** | ZAO Stock (future), ZAO-CHELLA, PALOOZA | TBD |

### What's Connected in ZAO OS Today

**Members page** (`/members`):
- ZID, username, display name, ENS, bio
- Respect total + fractal count
- Artist category + thumbnail
- Social platform links
- Activity (last active)

**Chat / Casts:**
- Cast history from channel feed (Neynar, cached in Supabase `channel_casts`)
- Reaction counts (likes, recasts)
- Reply counts per cast

**Fractal meetings:**
- Meeting attendance tracked by Fractal Bot (`data/history.json`)
- Per-session rankings per member
- Facilitator history

---

## What's Missing

### Identity Gaps

| Gap | What it is | Why it matters |
|-----|-----------|---------------|
| **Cross-chain identity resolution** | Linking Base wallet ↔ Solana wallet ↔ FID to one ZID | Can't build unified Respect, social graph, or governance |
| **Social graph depth** | Follower/following is surface; need "meaningful connections" (replied, collaborated, met IRL) | Discovery and trust signals |
| **Project membership** | Who's officially on the WaveWarZ team vs just participated once? | Governance, credit, incubator eligibility |
| **Respect attribution** | Where did someone's Respect come from? Which fractal meeting, which contribution? | Accountability, growth tracking |
| **ENS / Basename resolution** | Many members have ENS but it's not displayed or used for routing | Identity on-chain |

### Relationship Gaps

| Gap | What it is | Why it matters |
|-----|-----------|---------------|
| **Magnetiq integration** | IRL meet tokens not imported into ZAO OS | Can't show "you met this person at ZAO Stock" |
| **Fractal meeting graph** | Members who attended the same fractal meeting = edge in graph | Discovery, trust, governance sub-networks |
| **Cast interaction graph** | "Member A replied to Member B 40 times" = meaningful relationship | Discovery, engagement health |
| **Project collaboration graph** | Co-produced a track, co-authored a proposal, co-organized an event | Cross-pollination, team formation |
| **Event attendance** | POAP / attendance NFT holders as a graph edge | IRL community bonding |
| **Cross-platform identity** | Member has Lens, Nostr, Bluesky but ZAO OS doesn't know | Discovery outside of FC |

### Infra Gaps

| Gap | What it is | Why it matters |
|-----|-----------|---------------|
| **OREC node is DOWN** | `ornode` endpoints unreachable; on-chain fractal votes not flowing | Can't verify Respect on-chain |
| **No unified member profile** | ZAO OS profile ≠ Fractal Bot history ≠ Neynar profile | Fragmented identity |
| **Respect attribution** | Don't know which fractal meeting earned which Respect points | Hard to track growth |
| **Knowledge graph DB** | Not using graph DB (could use Supabase + pgvector for similarity) | Scale limitation |

---

## How to Build It: The ZID-First Approach

The fix starts with **ZID as the canonical identity anchor**:

```
ZID #47 (canonical identifier)
    ├── Base wallet (verified via signature)
    ├── Solana wallet (manual or via cross-chain attestation)
    ├── Farcaster FID (linked via signer)
    ├── ENS (resolved from wallet)
    └── ZAO OS profile (display name, bio, avatar)
```

Every other graph relationship anchors to ZID.

### Phase 1: ZID Resolution (Q2 2026 — from whitepaper)

1. Sequential ZIDs — ZID 1 = Zaal, ZID 2 = Candy, etc.
2. ZID minted as on-chain identifier on Base
3. Cross-chain wallet linking via signed attestation messages
4. Display ZID on ZAO OS profile + on-chain

### Phase 2: Relationship Edges (Q3 2026)

| Edge type | Source | How to capture |
|-----------|--------|----------------|
| IRL meet (Magnetiq) | Wallet address shared at event | Import Mintiq meet events |
| Fractal meeting co-attendance | Fractal Bot history | Import from `data/history.json` |
| Cast reply chain | Neynar / Supabase | Count replies between FIDs in `channel_casts` |
| Co-attendance at event | POAP / attendance NFT | On-chain token holder list |
| Project collaboration | Manual project membership + on-chain tx | ZAO OS project pages |
| Follow relationship | Neynar | Follower graph for trust signals |

### Phase 3: Graph Query & Display (Q3–Q4 2026)

- **"Members you might know"** — based on fractal co-attendance + Magnetiq meets
- **"Active collaborators on this project"** — based on co-authorship of casts about the project
- **"Trust path to Member X"** — shortest path through ZAO relationships
- **Respect attribution** — breakdown of where Respect came from (fractal sessions, event attendance, project leadership)

---

## The Multi-Chain Identity Problem

The ZAO spans 4 chains. Each member might have identities on all of them:

| Chain | Identity type | Tool |
|-------|--------------|------|
| **Base** | $ZAO Respect, Hats roles, ZID | Etherscan, ZOA OS profile |
| **Solana** | WaveWarZ participation | Solana explorer |
| **Flow** | Magnetiq meet tokens | Magnetiq.xyz |
| **Optimism** | ORDAO fractal votes (if OREC recovers) | Optimism explorer |

**Current state:** These are siloed. ZAO OS bridges them via ZID, but only as much as users have connected.

**Goal:** One ZAO identity that resolves your Base wallet, Solana wallet, and FID — visible to other members as a unified profile.

---

## Knowledge Graph for AI Agents

The ZAO OS research library (213+ docs) is itself a knowledge graph — but it's primarily for **human** navigation and **AI agent** context. For AI agents to use it well:

1. **Doc 197** (OpenClaw agent memory/knowledge system) — already covers how agents use the research
2. **`_graph/KNOWLEDGE.json`** — machine-readable index, 191 docs
3. **AI onboarding agent** (planned for Q4 2026) — would use ZAO knowledge graph to greet new members with context: "You're ZID #X, you've attended 3 fractal meetings, you're connected to Member Y who shares your interest in hip-hop"

---

## Key Files

| File | What it tracks |
|------|---------------|
| `src/lib/db/supabase/schema.sql` | User profiles, Respect, community_profiles |
| `src/lib/farcaster/neynar.ts` | Neynar API integration |
| `src/hooks/useChat.ts` | Cast history + channel activity |
| `research/_graph/KNOWLEDGE.json` | Research library machine-readable index |
| `research/207-zao-vps-agent-stack/` | Fractal bot history (`data/history.json`) |
| `community.config.ts` | Channels, branding, admin FIDs, contract addresses |

---

## References

- [Doc 050 — Complete Guide](./050-the-zao-complete-guide/) — ZAO overview
- [Doc 051 — Whitepaper 2026](./051-zao-whitepaper-2026/) — ZID + multi-chain identity
- [Doc 158 — Member Naming / ENS / Basenames](./158-zao-member-naming-ens-basenames/) — ENS resolution
- [Doc 198 — Social Graph Analytics](./198-social-graph-analytics-discovery/) — technical graph analysis
- [Doc 199 — Advanced Social Graph](./199-advanced-social-graph-features/) — graph features
- [Doc 207 — VPS Agent Stack](./207-zao-vps-agent-stack-session-log/) — fractal bot data

---

## Next Steps

1. **Build ZAO Stock page in ZAO OS** — event info, ticket signup, NFT attendance tokens
2. **Import Magnetiq meet events** — connect meet tokens to ZAO OS profiles
3. **Restore OREC node** or find alternative — on-chain fractal vote verification
4. **Fractal co-attendance graph** — import `data/history.json` into Supabase as graph edges
5. **Cross-chain wallet linking** — signed attestation flow for Base + Solana

## Implementation Status (ZAOOS Codebase)

**Currently implemented:**
- Supabase users table with FID, wallets, display name, bio
- Supabase respect_members table: Respect ledger (fractal + on-chain)
- Neynar API integration for cast history + reactions (cached in channel_casts)
- Fractal Bot history on VPS (data/history.json) — not yet imported to graph

**Not yet implemented:**
- ZID as primary anchor in schema (FID currently primary)
- Relationship edge tables (IRL meet, fractal co-attendance, cast reply chains, POAP attendance, project membership, follow graph)
- pgvector indexes on member bio + music genres for semantic discovery
- GraphRAG local/global search queries
- Magnetiq meet token imports (Flow) as edges
- EAS attestations for Respect verification
- Neynar Data Oracle integration for quality-score gating

**Scale limits today:** ~188 ZAO members + 500 most-cited research docs; below threshold for agent integration per case-study patterns

---

*Living document. ZOE ⚡ — ZAO OS orchestration layer.*
