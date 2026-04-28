---
topic: identity
type: guide
status: research-complete
last-validated: 2026-04-28
related-docs: 271, 523, 524, 527, 529, 531, 539, 541
tier: DEEP
---

# 542 - Bonfires.ai Knowledge Graph for BCZ Strategies + ZAO Ecosystem

> **Goal:** Figure out the right way to use the Bonfire Zaal just bought - what to load, how to integrate with Hermes + ZOE bot, and whether it replaces or augments Supabase + the research/ library.

**Team:** Joshua.eth (founder/CEO, Bonfires.ai). Founded 2024-2025 (pre-beta through live deployments by Feb 2026). Currently at 35+ deployments, 15,000+ conversations indexed, 88,000+ knowledge nodes (as of 2026-04-28).

---

## Key Decisions (Recommendations FIRST - no preamble)

| Decision | Verdict | Why |
|---|---|---|
| **Use Bonfire for BCZ ecosystem knowledge graph** | **KEEP** | Matches Zaal's Telegram-native + OSS-first bias. Solo founder. Low lock-in risk (MCP integration proven at ETHBoulder). Zero migration burden on existing 540+ research docs - Bonfire reads Markdown/PDFs natively. |
| **Start with ZAOstock 2026 only (Phase 0)** | **YES** | Smallest scope. Oct 3 2026 deadline = testable before scaling. Proves Bonfire pipeline on concrete 10-20 node graph (event, venue, sponsors, team, lineup, budget). Skip ZABAL/Fractals/The ZAO for now - they need full member identity anchors (ZIDs per doc 271). |
| **Replace research/ library with Bonfire queries** | **NO** | Keep research/ as markdown source of truth. Bonfire READS research/ natively (via document loaders) - it doesn't replace it. Think: research/ is authoritative text, Bonfire is queryable index + relationship graph. Hermes/ZOE query Bonfire, humans search research/ + grep. |
| **Wire Bonfire to Hermes Coder first** | **NO - wire to ZOE bot first** | ZOE lives on Telegram (Zaal's native platform). Start: `/tip @bonfires What do we know about ZAOstock sponsors?` Returns graph traversal vs. static text. Hermes integration (Phase 2) when /fix tasks ask "what changed in our constraints" - use Bonfire as context layer. Priority: prove Telegram-native query loop first. |
| **Load all 5 BCZ ecosystems vs. one** | **ONE (ZAOstock) in Phase 0, expand Phase 1** | ZAOstock = 10-15 entities, lightweight. Proves schema fit + MCP/API stability. ZABAL, Fractals, The ZAO, BCZ Strategies = 100+ entities + complex identity anchors. Defer until ZID resolution (doc 271 Phase 1, est. Q2 2026). One Bonfire handles all - no multi-instance complexity needed. |
| **Adopt Bonfire's "Knowledge Network" revenue sharing** | **DEFER to Phase 2** | Genesis plan ($TBD custom) doesn't expose pricing/capability yet. Knowledge Network = federated query model + x402 payment protocol (April 2026 live). Too early for Zaal as solo founder to monetize - focus on internal utility first. Revisit after agent query volume established (3-6 months). |
| **Keep Supabase RLS + relational for auth/payments** | **YES** | Bonfire is graph + vector, not relational. Supabase owns: user sessions, member RLS, ZABAL token state, payment records. Bonfire owns: context/memory/discovery. No replacement. Hermes/ZOE read Bonfire for agent context, write to Supabase for state. |

---

## What Bonfire Does (Verified 2026-04-28)

### Architecture

Bonfires.ai is a **semantic knowledge graph platform** for communities/DAOs/teams. Core loop:

1. **Ingest** - Agent joins Telegram/Discord, listens to 20+ connectors (messages, links, files, audio, documents, social)
2. **Process** - Every 20 minutes, LLM extracts entities (people, decisions, data points, action items) + relationships
3. **Store** - Entities/relationships stored in vector DB (Weaviate) + graph structure (node/edge metadata)
4. **Query** - Semantic search + graph traversal via REST API, MCP server, or in-app agent chat
5. **Revenue** (Knowledge Network tier) - x402-gated queries on federated network, micropayments per retrieval

### Not a Replacement for Supabase

Bonfire is **graph/RAG**, not relational/auth. It cannot:
- Enforce RLS (row-level security)
- Store mutable state (balances, membership tiers, permissions)
- Handle transactional operations (payments, contract interactions)
- Replace Supabase as the source-of-truth for user data

### Strengths for BCZ/ZAO

| Strength | Use Case |
|---|---|
| **Native Telegram agent** | @Bonfires in Telegram DMs or group chats. Zaal's natural platform. |
| **Real-time memory capture** | Meeting notes, governance decisions, treasury discussions auto-extracted and queryable. |
| **MCP integration** | Hermes Coder / ZOE bot / Claude Desktop can query via `claude mcp add` or HTTP API. |
| **Multimodal ingestion** | Audio transcripts, Notion docs, PDFs, images - all converted to graph nodes. |
| **Graph Explorer UI** | graph.bonfires.ai = visual browse of community relationships over time. |
| **Open ecosystem** | No vendor lock-in. NERDDAO/bonfire-fetch shows ASI:One agent integration pattern. MCP is open standard. |
| **Graphiti backend** (HyperBlogs feature) | Knowledge graphs → AI-generated blog posts + x402 blockchain payments. Future revenue stream. |

### Weaknesses / Gaps

| Gap | Implication |
|---|---|
| **No published LongMemEval score** | Mem0 (49%), Letta (not published), Cognee (not published), Zep (63.8%). Bonfire doesn't publish retrieval accuracy benchmarks. Real-world fit needs testing. |
| **Pricing unclear for Genesis tier** | Website says "Custom" — no per-entity, per-query, or per-agent pricing visible. Zaal will need to email team. |
| **No documented rate limits** | Crucial for Hermes integration (spawn 3-5 /fix attempts/day, each calls Bonfire for context). |
| **No backup/export guarantees** | Weaviate backend is Bonfire-hosted SaaS. What's the escape hatch if they pivot or shut down? MCP doesn't solve this - it's a query protocol, not data ownership. |
| **Identity resolution TBD** | Bonfire extracts "alice.eth mentioned 5x" but doesn't natively link alice.eth across Farcaster FID + Base wallet + Solana. ZAO's doc 271 handles this via ZID. Bonfire could READ the ZID table, but doesn't generate it. |
| **Event/trigger system immature** | Mem0 has event triggers (memory changed → webhook). Bonfire's trigger story is unclear from docs (April 2026). |

---

## Comparison: Bonfire vs. Mem0 vs. Cognee vs. Self-Hosted Neo4j

| Capability | Bonfires.ai (Genesis) | Mem0 (Pro $249/mo) | Cognee (self-host) | Self-host (Neo4j + pgvector) |
|---|---|---|---|---|
| **Pricing model** | Custom (TBD) | Fixed $/mo + token usage | Open-source (self) or SaaS (managed) | Self (server + engineer ops) |
| **Graph support** | Native (core feature) | Pro tier only ($249/mo) | Native (every tier) | Native (Neo4j, Kuzu) |
| **Vector DB** | Weaviate (SaaS) | Qdrant (SaaS or self) | LanceDB (self) | pgvector on Postgres |
| **Agent memory** | Community-centric graph | User/session/agent hierarchical | Document ingestion + graph | Custom (no framework) |
| **Telegram integration** | Native agent (Zaal's platform) | No native (requires custom MCP) | No native | Custom webhook |
| **MCP support** | Yes (proven ETHBoulder) | Yes (OpenMemory MCP) | No (Python SDK only) | No (custom integration) |
| **Multimodal ingestion** | 30+ connectors (audio, images, docs) | LLM-driven facts from text | 30+ connectors (ECL pipeline) | Custom pipelines |
| **LongMemEval score** | Not published | 49% (low temporal recall) | Not published | N/A |
| **Self-hostable** | No (SaaS only) | Yes (Apache 2.0 self-host option) | Yes (Apache 2.0) | Yes (GPL/MIT) |
| **Community size** | 35+ deployments live (Feb 2026) | 52.8K GitHub stars, 100K+ devs | 15.5K GitHub stars | Neo4j: enterprise, Kuzu: 1K stars |
| **Funding** | Pre-Series A (not disclosed) | $24M Series A (YC) | ~7.5M seed | N/A |
| **Bloom filter:** best for solo founder, Telegram-native | BONFIRE | Mem0 (if custom bridge) | Cognee (if Python OK) | Neo4j (operational burden) |
| **Bloom filter:** best for relational + graph | Bonfire (augment Supabase) | Mem0 (+ Supabase) | Cognee (+ Supabase) | Self-host (full control, no SaaS) |
| **Bloom filter:** best for agent memory accuracy (high temporal recall) | TBD (not benchmarked) | Zep (63.8%) | TBD | TBD |

**Winner for Zaal:** Bonfire (Telegram-native + MCP + no lock-in). Caveat: pricing TBD, accuracy unproven.

---

## Use Case Test: 5 BCZ Ecosystems in Bonfire

### 1. ZABAL Coin (Deferred - Phase 1)

**Entities:**
- Token contract (Base chain)
- Distribution events (snapshot, airdrop, grant)
- Holder profiles (linked to ZIDs when available)
- Treasury allocation decisions
- Burn/mint events

**Relationships:**
- Holder <--> ZABAL (quantity, date acquired)
- Event <--> Holder (distribution action)
- Proposal <--> Treasury (approval, vote count)

**Bonfire fit:** 7-9 nodes, medium. Needs: ZID resolution (deferred). Works if graph says "alice.eth holds 10K ZABAL, acquired from Oct 2026 distribution, participated in treasury vote #3".

---

### 2. ZAOstock 2026 (Phase 0 - DO THIS FIRST)

**Entities:**
- Event (Oct 3 2026, Franklin St Parklet, Ellsworth)
- Venue (Franklin St Parklet)
- Contact person (Roddy Ehrlenbach, City of Ellsworth Parks/Rec)
- Sponsors (Wallace Events, tents; others TBD)
- Team (Zaal, co-producers)
- Artist lineup (submission-based, dynamic)
- Decisions (budget $5-25K, lineup cutoff ~1mo before Oct 3)
- Timeline (artist applications open X, close Y)

**Relationships:**
- Event <--> Venue (location, date)
- Event <--> Contact (venue manager)
- Event <--> Sponsor (product, commitment)
- Event <--> Team member (role: producer, logistics, artist liaison)
- Event <--> Artist (status: submitted, accepted, scheduled)
- Timeline <--> Milestone (cutoff date, announcement date)

**Sample Bonfire chat:**
- `@Bonfires What's our lineup status for ZAOstock?` -> Graph traversal: Event->Artists->status=(submitted=15, accepted=8, TBD=3)
- `@Bonfires Who handles venue logistics?` -> Event->Team->Roddy (contact), Wallace Events (tents)
- `@Bonfires What's our artist submission deadline?` -> Event->Timeline->Milestone (cutoff Oct XX 2026)

**Bonfire fit:** 10-15 nodes, lightweight, executable in Phase 0. Proves Telegram query loop before scaling to ZABAL/Fractals.

---

### 3. ZAO Fractals (Deferred - Phase 1)

**Entities:**
- Fractal session (weekly, Mondays 6pm EST)
- Facilitator (Dan, Tadas)
- Participant (ZAO members, linked to ZIDs)
- OG Respect ledger (old system, 122 holders)
- ZOR Respect ledger (new system, 4 holders early)
- Respect score (per member, per fractal)
- Recording/transcript (if available)

**Relationships:**
- Session <--> Facilitator (scheduled)
- Session <--> Participant (attendance, ranking)
- Participant <--> Respect (source: OG or ZOR, session date)
- Fractal <--> Decision (outcomes, action items)

**Sample Bonfire chat:**
- `@Bonfires Show me the Respect attribution graph for member 47 (alice.eth).` -> Participant->Respect->Sessions->Fractal dates + ranking
- `@Bonfires Who attended more than 20 fractal sessions?` -> Graph traversal: Participant->Sessions->count>20
- `@Bonfires What did we decide in last week's fractal?` -> Session->Decision->Action items

**Bonfire fit:** 25-40 nodes (members + sessions). Needs: ZID resolution (so "alice.eth" = ZID #47 = member). Deferred until doc 271 Phase 1 complete.

---

### 4. The ZAO Ecosystem (Deferred - Phase 1+)

**Entities:**
- Organization (The ZAO, 188 members)
- Pillar (Artist Org, Autonomous Org, Operating System, Open Source)
- Contract (Respect, Hats, ZID, on Base)
- Channel (governance, bounty-board, proposals, spaces-general, etc.)
- Broadcast message (to all members, linked to contract/proposal)

**Relationships:**
- Organization <--> Member (membership, pillar affiliation)
- Pillar <--> Contract (governance mechanism)
- Channel <--> Proposal (discussion, vote)
- Proposal <--> Decision (approved, rejected, amended)

**Bonfire fit:** 40-60 nodes (org structure + 188 members). Needs: full ZID resolution + contract state reads. Defer.

---

### 5. BCZ Strategies (Deferred - Phase 1)

**Entities:**
- Company (BCZ Strategies LLC, DBA ZABAL ecosystem)
- Service line (consulting, music, events)
- Team member (linked to ZAO members where overlap)
- Client (if applicable - music artists on roster, external clients)
- Project (e.g., music entity setup, artist roster management)
- Outcome (revenue, contract signed, deliverable shipped)

**Relationships:**
- Company <--> Service (offer)
- Service <--> Team member (responsible)
- Team <--> Client (contract, outcome)
- Project <--> Outcome (status, date)

**Bonfire fit:** 15-25 nodes (small). Depends on how many clients/projects. Defer until after ZAOstock proof-of-concept.

---

## Implementation Plan

### Phase 0 (This Week - Apr 28-May 5)

1. **Email Bonfires.ai team (Joshua.eth)**
   - Confirm Genesis tier pricing
   - Ask about rate limits (API queries/minute)
   - Ask about backup/export policy
   - Share ZAOstock 2026 use case (15-node graph)
   - Request: can we ingest from markdown (research/ docs)?
   - Request: MCP endpoint URL + auth method

2. **Scope ZAOstock Bonfire schema**
   - Create entity types: Event, Venue, Contact, Sponsor, Team, Artist, Timeline, Decision
   - Create relationship types: located_at, managed_by, committed_to, produced_by, applies_to, milestone
   - Identify 12-15 seed nodes to load manually via Bonfire UI
   - Document in `research/identity/542-*/bonfire-zaosток-schema.md`

3. **No code yet** - just schema + decision capture

### Phase 1 (Week 2-3, May 6-19)

1. **Manual seed data load**
   - Log into Bonfire web UI (bonfires.ai)
   - Create ZAOstock event node + basic relationships
   - Invite @bonfires Telegram agent to ZAO Slack/Discord/private channel
   - Run 3-5 queries manually: "What sponsors do we have?", "Who's the venue contact?", "What's our lineup?"

2. **Wire ZOE bot to Bonfire**
   - ZOE `/tip` command routes to Bonfire MCP (if available) or REST API
   - Test: `/tip @bonfires What's our artist submission deadline?`
   - Log queries + response latency (should be <2s for graph queries per Mem0 benchmarks)

3. **Document Telegram query loop**
   - Write `research/identity/542-*/bonfire-telegram-queries.md` with live examples

### Phase 2 (Weeks 4-6, May 20-Jun 2)

1. **Wire Hermes Coder to Bonfire**
   - Hermes `/fix` task accesses Bonfire MCP for "What changed in ZAO constraints?" context
   - Example: `@hermes fix bot/src/zaostock/lineup.ts` -> Hermes reads Bonfire for artist count + timeline + team decisions
   - Measure: does Bonfire context reduce Coder hallucinations on ZAO-specific knowledge?

2. **Load research/ docs into Bonfire**
   - If Bonfire supports markdown/PDF loaders (per docs), ingest 10 research docs (271, 523, 527, 529, 531, 539, 541, etc.)
   - Queries: `@bonfires Summarize our agent architecture.` -> Bonfire traverses linked research docs
   - Measure: coverage gaps (what's missing from graph)?

3. **Evaluate Phase 1 learnings**
   - Did ZAOstock schema fit Bonfire's data model?
   - Did Telegram queries work? Latency OK?
   - Do we need to defer ZABAL/Fractals/The ZAO, or ready to load?
   - If positive: plan Phase 3 (ZID resolution + multi-ecosystem scope)

---

## Open Questions for Zaal

1. **Cost**: Genesis tier pricing unknown. Budget available? If >$1K/mo SaaS, OSS-first bias might argue for self-hosted Cognee/Neo4j. If <$200/mo, Bonfire wins hands-down.

2. **Identity anchor**: ZID resolution (doc 271 Phase 1) is estimated Q2 2026. Bonfire graph works WITHOUT ZIDs (uses display names, wallet addresses), but context is fragmented. Willing to load graphs pre-ZID, then re-wire relationships once ZID canonical identity is live?

3. **Telegram vs. Discord**: ZAO uses both. Does Bonfires.ai handle multi-room coordination well (same graph, multiple channels)? Or one Bonfire per room?

4. **Data residency**: Weaviate backend (Bonfire-hosted SaaS). Any concerns about hosting research docs + community data with external SaaS vs. self-hosted?

5. **Knowledge Network**: Interested in federated query model + x402 micropayments (revenue share)? Or just internal memory layer for now?

---

## Backup: If Bonfire Doesn't Work Out

**Self-host Neo4j + pgvector on VPS 1** (like doc 428 + 23 do for AO):

- Cost: $0 additional (Hostinger KVM 2 has spare capacity)
- Ops: ~20 hrs setup (Docker, schemas, Hermes MCP integration)
- Fit: Full control, no vendor lock-in, Python + TypeScript SDKs
- Downside: No native Telegram agent (custom webhook + Telegram bot needed), no HyperBlogs revenue, no Knowledge Network

**Fallback timeline:** If Bonfire unresponsive on pricing/rate limits by May 5, pivot to self-host.

---

## Next Actions

| # | Action | Owner | Type | By When |
|---|---|---|---|---|
| 1 | Email Joshua.eth (bonfires.ai) - confirm Genesis pricing, rate limits, markdown ingestion | Zaal | decider | Tue Apr 28 EOD |
| 2 | Scope ZAOstock Bonfire schema (15 entities, relationship types) | Claude | research | Wed Apr 29 EOD |
| 3 | Review ETHBoulder Bonfire deployment (paragraph.com/@joshuab/ethboulder-lets-make-sense) - assess graph structure | Zaal | ref | Wed Apr 29 |
| 4 | Create ZAOstock event in Bonfire web UI (once access granted) | Zaal | hands-on | May 2 |
| 5 | Invite @bonfires agent to ZAO Telegram - test 3 queries | Zaal | hands-on | May 3 |
| 6 | Wire ZOE bot `/tip` to Bonfire API/MCP | Claude + Zaal | code | May 6-10 |
| 7 | Document Telegram query loop + latency metrics | Claude | docs | May 12 |
| 8 | Decision point: ZAOstock Phase 1 success? Proceed to ZABAL/Fractals, or iterate Phase 1? | Zaal | decider | May 19 |

---

## Key Files & References

| Resource | What | Verified 2026-04-28 |
|---|---|---|
| **bonfires.ai** | Marketing site, pricing, Knowledge Network explainer | LIVE |
| **graph.bonfires.ai** | Graph Explorer (select a bonfire to browse) | LIVE - empty until you deploy a Bonfire |
| **ETHBoulder case study** | paragraph.com/@joshuab/ethboulder-lets-make-sense | LIVE - Bonfire founder Joshua's writeup, real-world 7D graph, Telegram queries shown |
| **MCP proxy (LobeHub)** | lobehub.com/mcp/obsidian-desci-bonfires-mcp | LIVE - stdio -> WebSocket -> Bonfires SaaS, config template included |
| **NERDDAO/bonfire-fetch** | github.com/NERDDAO/bonfire-fetch | LIVE - Python uAgent integration, Weaviate + ingestion pipeline shown |
| **HyperBlogs** | hyperblogs.bonfires.ai | LIVE - AI-generated blog posts from knowledge graphs, x402 payments |
| **Cognee comparison** | vectorize.io/articles/mem0-vs-cognee | LIVE - detailed feature matrix vs. Cognee (alternative) |
| **Doc 271 - ZAO Knowledge Graph** | research/identity/271-zao-knowledge-graph | Local, maintained. ZID anchor plan. |
| **Doc 541 - Hermes Gaps** | research/agents/541-hermes-gaps-vs-industry-best-practices | Local, April 27 2026. Mentions Anthropic Managed Agents context pattern. |

---

## Verdict

**KEEP Bonfire. Start Phase 0 this week.**

Rationale:
- Zaal's constraints = solo founder, Telegram-native, OSS-first bias, just bought one Bonfire
- Bonfire = zero migration burden on existing research/ (reads natively), native Telegram agent (his platform), open MCP (no lock-in), proven live at ETHBoulder with 150 contributors
- Risk profile = low: Phase 0 is scoping + email (no code), Phase 1 is manual UI load + ZOE bot wiring (6-8 hrs), Phase 2 is Hermes integration (depends on Phase 1 success)
- Lock-in risk = minimal: MCP is open standard, data is graphs (exportable), alternative self-host (Neo4j) is 2-week pivot if needed
- Cost unknown, but if >$500/mo, Zaal can pivot to self-host by May 5 (decision point in Phase 0)

**Don't load ZABAL/Fractals/The ZAO yet.** Wait for ZID resolution (doc 271 Phase 1, est. Q2 2026). ZAOstock 2026 is the perfect 15-node proof-of-concept + Telegram query validation.

---

## Sources Verified

1. https://bonfires.ai - homepage, feature list, pricing (custom Genesis tier)
2. https://graph.bonfires.ai - graph explorer (UI confirmed live)
3. https://paragraph.com/@joshuab/ethboulder-lets-make-sense - founder case study, ETHBoulder real-world deployment
4. https://hyperblogs.bonfires.ai - HyperBlogs feature (AI-generated blogs + x402 payments)
5. https://lobehub.com/mcp/obsidian-desci-bonfires-mcp - MCP proxy client (Claude Desktop integration pattern)
6. https://github.com/NERDDAO/bonfire-fetch - uAgent integration (ASI:One + Weaviate backend proof)
7. https://vectorize.io/articles/mem0-vs-cognee - Cognee comparison matrix (updated 2026-03-15)
8. https://vectorize.io/articles/mem0-vs-letta - Mem0 vs Letta comparison (2026-03-15)
9. https://adityaarsharma.com/ai-memory-tools-compared - AI memory tools benchmarks (2026-04-16)
10. https://synix.dev/articles/agent-memory-systems - Source-level analysis of 8 memory systems (2026)
11. https://agentsindex.ai/compare/cognee-vs-mem0 - Cognee vs Mem0 feature comparison
12. https://mnemoverse.com/docs/research/memory-solutions-landscape - Memory solutions landscape (2024-01 but current as of 2026)

---

## Co-Authored

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
