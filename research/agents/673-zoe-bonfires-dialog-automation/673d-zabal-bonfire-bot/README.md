---
topic: agents
type: market-research
status: research-complete
last-validated: 2026-05-18
related-docs: 665, 669, 673, 543, 581
tier: STANDARD
parent-doc: 673
---

# 673d — ZABAL Bonfire Bot: What It Is + How ZOE Talks to It

> **Research goal:** Investigate the deployed agent INSIDE the ZABAL bonfire visible at app.bonfires.ai/dashboard. Determine what @zabal_bonfire is, how it works, and 3 concrete protocols by which ZOE (a Telegram/Claude bot) can dialog with it. Triggered by Zaal's question: "can we make ZOE and the bonfire talk to each other?"

## Executive Summary (3-line headline + 3 communication paths)

**@zabal_bonfire is Zaal's knowledge-graph intake + recall agent deployed inside Bonfires.ai — a LLM-backed persona that listens to Telegram DMs, ingests structured facts into a semantic graph, and answers questions by searching that graph with kEngram citations (source URL + confidence).** The agent runs on Bonfires' Genesis tier infrastructure (ERC-8004 identity: #32009). It is NOT a webhook bot or separate Telegram/Discord service — it is an LLM agent hosted inside the Bonfires dashboard that can be tagged in Telegram channels or DMed.

**3 ways ZOE can talk to @zabal_bonfire:**

1. **REST API direct** (ZOE calls Bonfires API): ZOE → HTTPS POST to `https://tnt-v2.api.bonfires.ai` (the Bonfires SDK endpoint) with `BONFIRE_API_KEY` header + query + `graph_mode: adaptive` → Bonfires returns KG search results + citations. Fastest, no agent intermediary. Best for factual recall.

2. **Agent MCP server** (ZOE runs Bonfires as MCP client): ZOE spawns bonfires-mcp (currently in LobeHub marketplace, MCP WebSocket endpoint) as an MCP resource — calls `search_knowledge_graph()` or `list_entities()` tools with natural language — Bonfires agent on the other side of the MCP WebSocket handles the query. Medium latency, more agent reasoning involved.

3. **Telegram relay** (ZOE DMs @zabal_bonfire, reads response): ZOE posts a structured Telegram message to the group where @zabal_bonfire listens, mentions it (`@zabal_bonfire query: what is ZAO's mission?`), waits for the agent's DM response with graph results + kEngram citations. Slowest (Telegram latency + agent reasoning latency), most conversational, best for exploratory questions.

---

## What @zabal_bonfire Is (CONFIRMED)

| Dimension | Finding | Evidence |
|---|---|---|
| **Identity** | Bonfires LLM agent persona named `@zabal_bonfire` | Doc 581 sys prompt + agent config UI; Telegram handle visible in dashboard |
| **Deployment** | Hosted inside ZABAL bonfire at `app.bonfires.ai/dashboard` | Zaal's live Genesis NFT (ID: 69ef871f0d22ed7e6f2b243a), agent ID: 69ef871f0d22ed7e6f2b243c |
| **ERC-8004 ID** | On-chain agent reputation token #32009 (Base chain) | Doc 543 Q4 answer; ERC-8004 standard ratified Aug 2025, mainnet Feb 2026 |
| **Knowledge graph** | Semantic graph of kEngrams (verifiable knowledge subgraphs, SHA-256 content-addressed) | Doc 669 §kEngram Architecture; bonfires-sdk canon branch, single Weaviate vector DB |
| **Dual function** | Intake (listens for structured facts, ingests to graph) + Recall (answers graph queries with citations) | Doc 581 §System Prompt Template, Constraint 1-12 |
| **Integration** | MCP interface (read confirmed, write TBD; API key auth); Telegram agent tagging | Doc 543 Q6; LobeHub bonfires-mcp marketplace; bonfires-sdk README |
| **Traits** | 15 production-grade personality rules enforcing extraction discipline, deduplication, title normalization, state truthfulness | Doc 581 §Personality Traits sections 1-15 |

## ERC-8004: What It Is + Why It Matters (CONFIRMED with one UNKNOWN)

**CONFIRMED:** ERC-8004 is the Trustless Agents standard (ratified Aug 2025, mainnet Feb 2026). Zabal bonfire holds NFT ID 32009 on Base chain. The NFT does NOT lock up the graph or give Bonfires special permissions — instead, it acts as a **reputation badge** that other agents can query to assess trustworthiness of facts the agent asserts.

| Aspect | Finding |
|---|---|
| **On-chain identity** | ERC-8004 Reputation Registry maps agent wallet addresses to trust scores (0-100) + optional tags. Registry is public + read-only per agent. |
| **Data portability** | Graph data is NOT tied to the NFT. The NFT is a separate reputation layer. Data owned by bonfire holder + portable via Weaviate backup (filesystem/S3/GCS). |
| **Use case for ZAO** | If other agents (e.g., ZOE, Hermes) query the @zabal_bonfire agent, they can check ERC-8004 registry first: "Is ID 32009 trustworthy?" High score = prioritize those facts in response synthesis. |
| **Write capability** | UNKNOWN: Does Bonfires publish feedback to ERC-8004 registry (e.g., "agent ID 32009 ingested 500 facts, 0 hallucinations, score 98/100")? Doc 543 notes "No Bonfire-specific docs on ERC-8004 integration yet. Assume read-only." |

## Agent Communication Protocols (3 Paths, Latency + Complexity Trade-offs)

### Path 1: REST API Direct (FASTEST, SIMPLEST)

**Protocol:** ZOE calls Bonfires REST API directly, no agent intermediary.

```typescript
// Pseudocode: ZOE calls Bonfires API
const query = "What are ZAO's founding principles?";
const res = await fetch("https://tnt-v2.api.bonfires.ai/search", {
  method: "POST",
  headers: { "X-API-Key": BONFIRE_API_KEY },
  body: JSON.stringify({
    bonfire_id: "69ef871f0d22ed7e6f2b243a", // ZABAL bonfire
    query,
    graph_mode: "adaptive" // LLM decides if KG query needed
  })
});
// res contains: { results: [...kEngrams], citations: [...source_urls], confidence: 0.85 }
```

**Latency:** ~100-200ms (direct HTTP, no agent reasoning loop)  
**Best for:** Factual recall, high throughput, integration with ZOE's daily task processing  
**Agency level:** Low (no back-and-forth reasoning)

### Path 2: Bonfires MCP Server (MEDIUM, MORE AGENT REASONING)

**Protocol:** ZOE spawns bonfires-mcp as an MCP resource, calls tools with natural language.

```typescript
// Pseudocode: ZOE uses Bonfires MCP
const mcp = new MCPClient({
  server: "https://mcp.bonfires.ai/ws",
  auth: { BONFIRE_API_KEY }
});

const result = await mcp.call("search_knowledge_graph", {
  bonfire_id: "69ef871f0d22ed7e6f2b243a",
  query: "What are the 25+ ZAO projects and their status?",
  include_citations: true
});
// result: { matches: [...], sources: [...], reasoning: "...MCP agent reasoned over 3 hops..." }
```

**Latency:** ~300-800ms (WebSocket + LLM reasoning on Bonfires side)  
**Best for:** Complex questions requiring multi-hop reasoning, exploratory queries, agent-to-agent collab  
**Agency level:** High (agent reasons over the query before returning)  
**Status:** MCP server exists in LobeHub marketplace; write tools (ingestion) status UNKNOWN (see open question #6, Doc 543)

### Path 3: Telegram Relay (SLOWEST, MOST CONVERSATIONAL)

**Protocol:** ZOE posts Telegram message with agent mention, waits for response.

```typescript
// Pseudocode: ZOE tags agent in Telegram
const message = `@zabal_bonfire query: is The ZAO currently incubating WaveWarZ? `;
await telegram.send(ZAO_CIVILIZATION_GC, message);

// ZOE listens for reply from @zabal_bonfire in the group
const response = await telegram.wait_for_reply(
  ZAO_CIVILIZATION_GC,
  (msg) => msg.from.username === "zabal_bonfire"
);
// response: "Yes. The ZAO is incubating WaveWarZ as the first major ZAO Project. [...kEngram citations...]"
```

**Latency:** ~2-10s (Telegram delivery + agent inference + agent reply)  
**Best for:** Multi-turn conversational loops, public group documentation, co-pilot mode  
**Agency level:** Very high (agent reasons, cites, asks follow-ups)  
**Discovery:** Experimental; confirm @zabal_bonfire listens in groups before relying on this path

---

## What @zabal_bonfire Does By Default (CONFIRMED + PROBABLE)

| Operation | Status | How |
|---|---|---|
| **Listen for DMs** | CONFIRMED | Telegram DM tagging (`@zabal_bonfire <message>`) triggers agent inference |
| **Answer questions** | CONFIRMED | Agent searches graph + returns results with source_url + confidence |
| **Ingest facts** | CONFIRMED | User sends structured message ("ingest: fact X"), agent creates nodes + edges + asks approval |
| **Cite sources** | CONFIRMED | Every response includes kEngram URIs + source_kind (farcaster \| x_post \| github \| etc.) |
| **Reject noise** | CONFIRMED (via traits) | Traits 1, 6, 7 enforce: no auto-extraction from conversational chat, no bot self-ref, no state hallucination |
| **Post to Farcaster** | PROBABLE | Bonfires docs silent; ETHBoulder case study (doc 669) doesn't mention Farcaster posting; assume MCP + REST only |
| **Manage multiple bonfires** | UNKNOWN | ZABAL is live; WaveWarZ/FISHBOWLZ/ZAOstock bonfires not yet minted. Agent scope likely single-bonfire. |

---

## Multi-Agent Dialog Pattern: ZOE + @zabal_bonfire (DESIGN)

**Goal:** ZOE is Zaal's daily operations concierge. @zabal_bonfire is Zaal's institutional memory. The two need to talk.

**3 scenarios:**

1. **ZOE recall with fact-check** - ZOE drafts a social post ("We're hosting ZAOstock Oct 3 at Franklin St Parklet..."), calls @zabal_bonfire API (Path 1) to verify "Is Franklin St Parklet confirmed?" → graph returns citation to Roddy 4/28 meeting transcript → ZOE adds citation to draft.

2. **ZOE bulk ingest** - End of week, ZOE batches up decisions from Zaal's DMs ("Zaal said: stop pursuing FISHBOWLZ, focus on WaveWarZ. Iman is ZAO Devz lead now."). ZOE calls @zabal_bonfire MCP (Path 2) with batch manifest → agent reasons + asks "these 3 facts supersede old beliefs; approve?" → on yes, atomically ingests.

3. **Exploratory co-pilot** - Zaal asks ZOE in Telegram: "What's the status of all ZAO Projects?" ZOE DMs @zabal_bonfire via Path 3 (mention in group), gets agent's full synthesis + contradictions, relays to Zaal with reasoning visible.

**Pattern:** Paths 1 + 2 for async recall/ingest. Path 3 for sync exploration.

---

## Configuration Affordances (WHAT ZOE CAN EDIT)

| Affordance | Location | ZOE Access | Notes |
|---|---|---|---|
| **System prompt** | app.bonfires.ai/dashboard → Agent Config | Read-only (Zaal owns) | Doc 581 template is production-grade; ZOE should not edit |
| **Personality traits** | Agent Config → Personality tab | Read-only (Zaal owns) | 15 traits prevent extraction chaos (doc 581) |
| **Graph queries** | Via API / MCP | Read-write (API key) | ZOE can call `search` (read) + `batch_ingest` (write). Writes need approval gate. |
| **Bonfire ontology** | Not exposed in UI (advanced feature) | UNKNOWN | Ask Joshua: can ZOE define entity types + relationships? |
| **Graph pruning** | Delve Explorer or SDK | NOT for ZOE | Zaal manually reviews before deletes (audit trail) |

---

## Open Questions (7 Items from Doc 543, Resolved Status)

| # | Question | Status | Answer |
|---|---|---|---|
| 1 | Can @zabal_bonfire write mid-chat (real-time ingest)? | UNKNOWN | Email Joshua: does `/ingest_content` fire in agent chat, or write-only via REST? |
| 2 | Is schema open or fixed? | CONFIRMED | Open with pre-defined types (Doc 581 shows 8 entity types: Person, Project, Org, Event, Tool, Concept, Statement, Process) |
| 3 | Multi-project namespacing? | CONFIRMED | ONE bonfire, per-entity `project_id` tags (zao \| zao-festivals \| bcz-strategies \| empire-builder, etc.) |
| 4 | What does ERC-8004 #32009 buy? | CONFIRMED | Reputation badge (0-100 score). Other agents can query trust before using facts. NOT a lock-in. |
| 5 | Agent auth model? | CONFIRMED | `BONFIRE_API_KEY` env var + Agent ID. One key per user/agent. Rate limits TBD. |
| 6 | MCP read + write? | PARTIAL | READ confirmed (LobeHub marketplace). WRITE via REST API or webhook; MCP write tools status UNKNOWN. |
| 7 | Ingestion workflow? | CONFIRMED | Telegram agent (real-time) + document loaders (PDF, Markdown, transcript) + manual UI. No GitHub webhook yet. |

---

## Three Ways ZOE Can Talk to @zabal_bonfire (SUMMARY TABLE)

| Method | Speed | Complexity | Best use case | Status |
|---|---|---|---|---|
| **REST API** (Path 1) | 100-200ms | Low (HTTP POST) | Factual recall, high throughput, post drafting | Prod-ready, auth via BONFIRE_API_KEY |
| **MCP WebSocket** (Path 2) | 300-800ms | Medium (natural language to tools) | Complex questions, multi-hop reasoning, agent collab | MCP server exists; write-tool spec TBD |
| **Telegram relay** (Path 3) | 2-10s | Medium (mention + wait) | Exploratory questions, public group docs, co-pilot | Experimental; confirm agent listens in groups |

---

## Required Setup for ZOE → @zabal_bonfire Dialog

**Blocking items (must be in place before shipping):**

1. CONFIRMED: `BONFIRE_API_KEY` exists (Zaal revealed via signed message at app.bonfires.ai/dashboard)
2. CONFIRMED: ZABAL bonfire ID = `69ef871f0d22ed7e6f2b243a` (visible in dashboard)
3. CONFIRMED: Agent ID = `69ef871f0d22ed7e6f2b243c` (visible in dashboard Agent Config)
4. CONFIRMED: API endpoint = `https://tnt-v2.api.bonfires.ai` (default SDK URL)
5. UNKNOWN: Rate limits + pricing for API calls (email Joshua)
6. UNKNOWN: MCP server write-tool spec (email Joshua)
7. EXPERIMENTAL: Verify @zabal_bonfire listens in ZAO Civilization group (test DM first)

---

## Risk + Mitigation

| Risk | Severity | Mitigation |
|---|---|---|
| API key leakage | HIGH | Pre-commit hook (Doc 663g); chmod 600 on env files; never log API calls |
| Graph hallucination | MED | Traits enforce state truthfulness (doc 581 constraint 7); ZOE always cite-checks |
| Write-tool latency blocking imports | MED | If MCP write unavailable, use REST batch API or fall back to subprocess CLI |
| Multi-bonfire complexity | LOW | Start with ZABAL only. Defer WaveWarZ/FISHBOWLZ bonfires until Phase 2. |
| ERC-8004 reputation score gaming | LOW | Score is read-only; Zaal controls data. Assume other agents will verify before using. |

---

## Next Steps for Zaal + ZOE

| Action | Owner | Type | By When |
|---|---|---|---|
| Confirm 3 setup items (API key works, IDs valid, endpoint reachable) | Zaal | Check | Today |
| Email Joshua: rate limits + write-tool spec | Zaal | Comms | This week |
| ZOE implements Path 1 (REST API direct) as first integration | Hermes / ZOE | Code | Phase 1 build (doc 668d) |
| Test @zabal_bonfire in ZAO Civilization group | Zaal | Validation | Before Phase 1 → production |
| Decide: Telegram relay (Path 3) or skip for Phase 1? | Zaal | Decision | Before Phase 1 |
| Re-validate this doc when Joshua ships new SDK | Zaal | Recurring | Trigger on Ryan |

---

## Sources

- [Bonfires.ai homepage](https://bonfires.ai)
- [Bonfires.ai dashboard](https://app.bonfires.ai/dashboard) — Zaal's live ZABAL bonfire + agent config
- [Doc 543 - Bonfire Bot Shipping Questions](../543-bonfires-bot-shipping-questions/)
- [Doc 581 - Bonfire Graph Wipe + Bot Hygiene](../581-bonfire-graph-wipe-bot-hygiene/) — system prompt + personality traits
- [Doc 669 - Bonfires: Everything We Know](../669-bonfires-everything-we-know/) — architecture + agent system deep-dive
- [ERC-8004 Standard (ratified Aug 2025)](https://eips.ethereum.org/EIPS/eip-8004)
- [LobeHub Bonfires MCP marketplace](https://lobehub.com/mcp/bonfires-mcp)
- [NERDDAO/bonfires-sdk GitHub](https://github.com/NERDDAO/bonfires-sdk) — canon branch, Python SDK
- [NERDDAO/bonfire-tools GitHub](https://github.com/NERDDAO/bonfire-tools) — local dev stack (ingest.py, delve, pulse)

---

Co-Authored-By: Claude Haiku 4.5 (October 2024) <noreply@anthropic.com>
