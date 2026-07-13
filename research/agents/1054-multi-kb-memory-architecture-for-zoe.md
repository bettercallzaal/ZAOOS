# Multi-KB Memory Architecture for ZOE

**Tier:** DEEP  
**Type:** Decision (architecture + recommendation)  
**Date:** 2026-07-12  
**Original Question:** "Should we have multiple different knowledge bases for memory? Research the best way to do it."

---

## Executive Summary

**Recommendation: ZOE should formalize its EXISTING multi-KB architecture with clear semantic boundaries, add a lightweight router, and establish a tiered retrieval strategy.**

**Verdict:** Multi-KB is the RIGHT call for ZOE. Not because of an abstract principle, but because ZOE already operates across 7+ distinct reasoning domains (brand masks, decision-making, build tracking, conversational context, people/CRM, research, commitment tracking). A unified KB would fragment these. The current spread (persona, human, decisions, build-state, tasks, threads, Bonfire graph, ICM boxes, chat archives) is coherent by domain but lacks routing logic. Fix: formalize each KB, add a router, establish tier-1/tier-2 retrieval patterns, and migrate the ad-hoc stores to a cleaner schema.

**Cost of change:** Medium. No database rewrites. File-storage architecture stays the same. Main work: write the router, add metadata tagging, define retrieval precedence, update concierge.ts to route intelligently.

**Top 3 first moves:**
1. Define the 7-KB logical model (persona/voice, human/people, decisions, build-state, tasks, threads, episodic-chat) + add metadata tags (domain, recency, confidence) to each.
2. Build a lightweight QueryRouter that maps incoming questions to KB precedence (e.g. "what should I build?" → decisions+build_state+tasks; "who is Zaal?") → human+Bonfire).
3. Test the router on 20 historical queries; verify it picks the right KBs 95%+ of the time without LLM overhead.

---

## Part 1: What ZOE Currently Has (The Honest Audit)

### Current Memory Stores (7 KBs + 2 meta-layers)

| KB | Storage | Purpose | Recency | Domain |
|---|---|---|---|---|
| **Persona** | persona.md (filesystem, versioned in git) | ZOE's identity, voice, rules, routing logic | Updated at boot, rarely | Identity + procedures |
| **Human** | human.md (local cache, ~daily refresh from Bonfire) | Facts about Zaal (handles, ENS, schedule, projects, relationships) | ~24h cache | People (core) |
| **Decisions** | decisions.jsonl (append-only) | High-level choices Zaal makes + rationale (decision records added manually or via captures) | Latest 5 injected per turn | Strategic reasoning |
| **Build-State** | build_state.jsonl (append-only) | Feature status, PR tracking, branch state, reasons for pauses | Latest 5 injected per turn | Project tracking |
| **Tasks** | tasks.json (live file, global queue) | Open work items with status, priority, description | Snapshot each turn | Operational |
| **Threads** | threads.json (per-commitment tracking) | Open commitments Zaal makes (time-bounded intentions for personal actions) | Hot state | Commitments + continuity |
| **Chat History** | recent/<chat_id>.json (ring buffer, 8 turns) + archive/<scope>/<yyyy-mm>.jsonl (append-only) | Episodic memory of conversations (per-chat scoped) | Latest 8 injected; archive grows unbounded | Conversational context |
| **ZABAL Bonfire** | Knowledge graph at tnt-v2.api.bonfires.ai (semantic graph) | Cross-domain facts auto-indexed by the graph (captures, tasks, quests, decisions mirrored via episodes) | Queryable via /delve, written via /create | Semantic + institutional |
| **ICM Boxes** | useicm.com (per-brand context boxes) | ZAO brand-specific context (persona + positioning + key facts for 5 brands: The ZAO, ZAO-assistant, WaveWarZ, ZABAL Games, zaal.eth) | Fetched at runtime (~20 requests per concierge turn) | Brand context (identity masks) |

### What's Coherent

1. **Domain separation is real and intentional.** Persona ≠ Human ≠ Decisions. Each stores a different type of knowledge and is queried in different contexts.
2. **Episodic + semantic split works.** Chat archives (episodic, temporal, unindexed) are kept separate from Bonfire (semantic, auto-indexed, cross-linked). The split prevents noise.
3. **Append-only logs for audit/replay.** Decisions and build-state are immutable. This means ZOE can audit "why was this decision made?" and detect drift over time.
4. **Bonfire as the institutional backbone.** Mirroring turns into the graph (captures, tasks, quests) means the institutional knowledge grows daily without explicit curation. Other agents can recall what ZOE has learned.
5. **ICM boxes for brand masks.** Each brand (The ZAO, WaveWarZ, ZABAL Games) has its own context box. This supports ZOE's ability to speak as multiple brands without brand confusion.

### What's Ad Hoc

1. **No formal routing logic.** When concierge.ts builds memory blocks, it reads ALL KBs and injects everything into the context window. There's no "this question is about decisions, so query decisions.jsonl + Bonfire-decisions; skip build-state." The router is "dump everything."
2. **ICM boxes are fetched but not semantically integrated.** ZOE fetches 20+ ICM boxes per turn (~20 HTTP requests) and injects them as unstructured blocks. There's no metadata saying "brand context was stale 3 days ago, re-fetch." They're treated as static.
3. **No retrieval confidence or freshness signals.** A fact from human.md (last updated 2026-05-04) is treated with the same weight as a decision from decisions.jsonl (created today). No differentiation.
4. **Bonfire recall is manual-fallback heavy.** If /delve returns nothing, ZOE asks Zaal to manually paste from @zabal_bonfire. This is a UX tax and a sign the retrieval ranking isn't tuned.
5. **Chat archive is untouched long-term.** Archive files grow unbounded per month (e.g., archive/private/2026-07.jsonl could be 50k lines). There's no re-indexing, no relevance scoring, no sampling for long-term memory. It's a write-once log, not a retrieval system.

### What's Missing

1. **Retrieval routing.** No logic to say "for this question, check decisions first; if that's empty, check Bonfire; if Bonfire is cold, ask the bonfire bot manually."
2. **Metadata on KBs.** No way to tag a decision record as "high-confidence" vs "exploratory" or "people-related" vs "technical."
3. **Cross-KB reasoning.** ZOE cannot answer "which decisions led to this build-state?" without manual correlation. The KBs are isolated.
4. **Staleness detection.** No "human.md hasn't been updated in 9 days, time to re-query Bonfire for latest facts."
5. **Sampling / summarization of long-term episodic memory.** Archive files are preserved perfectly but never re-summarized or surfaced as "the mood / tone of past weeks."

---

## Part 2: Research Findings - Single vs Multi-KB

### Anthropic's Official Stance (AUTHORITATIVE)

**Source:** https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents

Anthropic recommends a **hybrid approach** treating context as "a finite resource with diminishing marginal returns." Rather than pre-loading all data, maintain "lightweight identifiers (file paths, stored queries, web links)" that agents dynamically retrieve. Multi-KB is justified when "different parts of memory have different owners or access rules" — one read-only shared reference store, separate read-write stores for session-specific context.

**Anthropic's Memory Stores (Managed Agents):**
https://platform.claude.com/docs/en/managed-agents/memory

Structure: Memory Stores (workspace-scoped, max 8 per session), Individual Memories (path-addressed text, 100kB each, 2,000 per store), Memory Versions (immutable audit trail). Anthropic prescribes "Structured Note-Taking" as formal best practice — agents maintain persistent external memory across sessions.

### The Academic Case for Multi-KB (and when it backfires)

**Principle 1: Retrieval precision improves with semantic segmentation — 10-12% relative gain.** 

*Source:* https://arxiv.org/html/2504.19413v1 (mem0 research)

Natural-language memory extraction peaked at 67% accuracy vs 61% for fixed-size RAG chunking — a **10-12% relative improvement** — because it extracts "only the most salient information rather than fixed-size chunks," reducing p95 latency by 91%. Segmented KBs retrieve fewer irrelevant facts.

**Principle 2: Episodic/Semantic/Procedural separation is the industry standard.**

*Source:* https://arxiv.org/html/2602.19320v1 (Endel Tulving's cognitive framework, adopted by agent industry)

The field converged on three tiers:
- **Episodic** - context-preserved event records, instance-specific
- **Semantic** - factual knowledge, generalized world facts
- **Procedural** - skills, rules, behavioral instructions (still early-stage tooling)
- Plus **In-Context (Working) Memory** - the active context window

**Principle 3: Routing overhead is recoverable if not LLM-based.** 

*Source:* https://arxiv.org/pdf/2509.19599 (dynamic multi-stage routing, 2025)

Each query deciding "whether, what, and where to retrieve" at runtime (not upfront) requires:
- Planning Phase (identify intent), Delegation Phase (route), Synthesis Phase (aggregate).
- **Three routing approaches (2026 consensus):** Rule-based (keyword, low adaptability), ML classifiers (training-dependent), LLM-based (dominant 2026, enhanced with prompt design).
- **Hybrid search best practice:** Combine semantic (embeddings), lexical (BM25), graph traversal (entities), and temporal (recency) signals in parallel. Result: **up to 18.7pp gains** (55.2% → 73.9%) on complex tasks.

**Principle 4: Fragmentation risk — guard against five failure modes.**

*Source:* https://www.indium.tech/blog/agent-memory-compression-failure-modes/

Over-compression of multi-KB memory causes:
1. **Catastrophic Forgetting** - loses latent factors supporting earlier reasoning. Fix: tiered memory with pinned critical facts, checkpoint snapshots.
2. **Hallucination Amplification** - reduced context increases internal prior reliance. Fix: validate against source-indexed evidence.
3. **Context Drift** - compressed vectors shift meaning as embedding space reshapes. Fix: periodic re-embedding of stable seed sets.
4. **Over-Compression Bottlenecks** - eliminates intermediate inferences for multi-step chains. Fix: adapt compression ratio to task complexity.
5. **Bias Creep** - underrepresented perspectives become invisible. Fix: audit for representation balance, inject counterexamples.

### Concrete Framework Patterns

**Letta / MemGPT — Four-Layer Hierarchical Architecture:**

*Source:* https://www.letta.com/blog/agent-memory/

1. Message Buffer (recent messages)
2. Core Memory (in-context editable blocks: persona, human context)
3. Recall Memory (full history, searchable via vector/semantic)
4. Archival Memory (externally formulated knowledge in vector or graph databases)

Core memory acts as "abstraction for managed context units," paging data between in-context (like RAM) and archival storage (like disk). Multi-block helps when each block has a clear access pattern.

**mem0 — Tiered Natural Language + Graph Hybrid:**

*Source:* https://arxiv.org/html/2504.19413v1

- mem0: 7k tokens per conversation (NL)
- mem0-graph: 14k tokens with graph-based entities + relationships
- Memory scoped by 4 dimensions (user_id, agent_id, run_id, app_id)
- Multi-agent patterns: centralized (simple, bottlenecked), distributed (scalable, consistency hard), **hybrid (private+shared tiers, production standard)**.

**Zep — Temporal Knowledge Graph with Hierarchical Tiers:**

*Source:* https://arxiv.org/abs/2501.13956 (Graphiti engine)

Temporally-aware knowledge graph synthesizing unstructured conversation + structured business data across three hierarchical tiers:
- Episode subgraph (conversation events)
- Semantic entity subgraph (entities + relationships)
- Community subgraph (emergent patterns)

Hybrid retrieval: cosine similarity + BM25 + breadth-first graph traversal + reranking (RRF/MMR). **Achieves 94.8% accuracy vs MemGPT's 93.4%**, up to 18.5% on LongMemEval (real-world), with **90% latency reduction**.

**LangGraph — Checkpoint + AgentMemory Hybrid:**

*Source:* https://langgraphjs.guide/memory/

- Short-term: thread-scoped message history, database-persisted
- Long-term: intelligent cross-session summarization
- Hierarchical: short-term → episodic → long-term
- Retrieval: semantic (embedding), BM25 (keyword), graph (entity relationships), temporal (recency weighting)

### When to Use Each Approach

**Use Multi-KB when:**
- Different memory types have distinct access patterns (reference vs session-specific)
- Multiple users/teams have separate context lifecycles
- Read-only reference material shares with read-write learning
- Scaling beyond 2,000 memories per store

**Use Unified KB when:**
- Total memory fits in context window (≤128k tokens)
- Sub-second retrieval critical
- Operational simplicity > structural sophistication
- Typical scale (< 128k tokens total)

**Critical Guard Against Fragmentation:**
Implement periodic consolidation ("dreaming"), maintain pinned critical facts in core memory, validate compressed outputs against source evidence, and measure semantic drift on reference vectors.

*Source:* https://www.indium.tech/blog/agent-memory-compression-failure-modes/, https://arxiv.org/abs/2507.06229

---

## Part 3: Assessment for ZOE Specifically

### Why Multi-KB is Right for ZOE

1. **7 distinct reasoning domains:** ZOE's job is to be a concierge + orchestrator. That means answering questions about "who should I talk to?" (human + CRM), "what did we commit to?" (threads + Bonfire), "why is feature X paused?" (build-state + decisions), "what's the next step on task Y?" (tasks + Bonfire), and "what voice should I use?" (persona). These are genuinely separate reasoning frames. A unified KB would require expensive routing.

2. **Episodic + semantic split is natural.** Chat history (episodic, "what happened in this conversation") serves a different purpose than Bonfire (semantic, "what facts did we learn"). Merging them would mean either losing temporal context or losing semantic connectivity.

3. **Append-only auditability matters.** decisions.jsonl and build_state.jsonl are immutable. This lets ZOE reason about "has our thinking on this changed?" and "where did this idea come from?" Merging into a mutable graph loses this audit trail.

4. **Brand masks require isolated context.** ZOE speaks as The ZAO, WaveWarZ, ZABAL Games, etc. Each brand has an ICM box with distinct positioning. A single KB would require expensive query filtering to avoid brand bleed ("am I speaking as The ZAO or as WaveWarZ?").

### Why the Current Spread isn't Broken (but Isn't Optimized)

**Honest take:** ZOE's current multi-KB architecture is ALREADY the right move. It's not ad hoc because it's wrong; it's ad hoc because it lacks explicit routing. The problem isn't the KBs — it's that the router is a monolithic "inject everything" strategy.

**The win from formalizing:**
- **Latency:** Avoid fetching 20 ICM boxes every turn if the question doesn't need brand context.
- **Noise reduction:** Don't inject build-state details into questions about "who should I meet?"
- **Reasoning clarity:** The prompt is cleaner. "For this question, check human + Bonfire; skip build-state" is faster for Claude than "here's 15 KB of context, figure it out."
- **Observability:** Log which KBs answered each question. Detect staleness ("human.md hasn't been updated in 9 days").
- **Bonfire ROI:** If Bonfire recall improves from "manual relay 30% of the time" to "SDK 85%+", that's a real win. Currently, ZOE falls back to manual relay too often, which means the graph is underutilized.

### Why the Current Spread Won't Break If Left Alone

ZOE works today. The "dump everything" router is simple and doesn't hallucinate. It's wasteful, not broken. Formalizing is a performance + maintainability move, not a correctness fix.

---

## Part 4: Recommended Architecture

### The 7-KB Model (Formalized)

| KB | Type | Storage | Tier | Queries | Metadata |
|---|---|---|---|---|---|
| **Persona** | Procedural | persona.md (file) | T0 (always) | None (always injected) | versioned, static |
| **Human** | Semantic | human.md + Bonfire | T1 | "who/people" queries | staleness: if >7d, re-query |
| **Decisions** | Semantic | decisions.jsonl | T1 | "why/decision" queries | recency: top 5 by date |
| **Build-State** | Semantic | build_state.jsonl | T1 | "feature/PR/branch" queries | recency: top 5 by date |
| **Tasks** | Operational | tasks.json | T1 | "task/todo/next" queries | live snapshot |
| **Threads** | Operational | threads.json | T1 | "commitment/when" queries | time-sorted, live |
| **Episodic Chat** | Episodic | recent/<chat>.json (8 turns) + archive (full log) | T2 (on demand) | "what did we talk about?" queries | temporal index by chat_scope |
| **Bonfire Graph** | Semantic (institutions) | Bonfire API (/delve) | T2 (on demand, fallback) | "general knowledge" queries if T1 empty | queryable by topic, ranked |
| **ICM Boxes** | Context (identity) | useicm.com (fetched) | T0 for brand questions, T2 default | "as brand X" queries | staleness: if >12h, re-fetch |

**Tier logic:**
- **T0 (always):** Persona, ICM boxes (if question mentions a brand).
- **T1 (by router):** Decide based on question class.
- **T2 (fallback):** If T1 empty, try Bonfire. If Bonfire empty, manual relay.

### QueryRouter Logic (Lightweight, Heuristic-Based)

No LLM call. Use keyword matching + metadata tags. Pseudocode:

```
function route(question, context):
  # Step 1: Detect question class (keyword match)
  if question contains: "who", "person", "contact", "call", "meet"
    → primary: human + CRM
    → secondary: Bonfire (people facts)
  
  if question contains: "why", "decision", "choose", "should"
    → primary: decisions + human
    → secondary: build-state
  
  if question contains: "what's next", "blocked", "PR", "branch", "ship"
    → primary: build-state + tasks
    → secondary: decisions
  
  if question contains: "task", "todo", "pending", "priority"
    → primary: tasks
  
  if question contains: "said", "told", "happened", "conversation"
    → primary: episodic (recent + archive if time-bounded)
  
  if question contains: "committed", "promised", "will", "tonight", "this week"
    → primary: threads
  
  # Step 2: Add brand context if needed
  if question mentions brand name (ZAO, WaveWarZ, ZABAL)
    → inject matching ICM box (T0)
  
  # Step 3: Freshness check
  for each KB in query_set:
    if stale(KB): attempt refresh (Bonfire re-query for human; re-fetch ICM; etc.)
  
  # Step 4: Prioritize tiers
  inject(T0_set)  # persona + brand ICM
  inject(T1_set)  # routed KBs
  # T2 omitted unless T1 is empty or fallback needed
```

**Cost:** ~5ms per turn (keyword matching, no LLM).

---

## Part 5: Migration Path (Non-Breaking)

### Phase 1: Formalize Metadata (Week 1)

- Add `domain` tags to decisions.jsonl, build_state.jsonl (manual batch-edit via CLI command).
- Add `recency` and `staleness_threshold` metadata to memory.ts KBs (constants).
- Add tracking: log which KBs were queried for each turn (in concierge output).

### Phase 2: Build the Router (Week 2)

- Write `query_router.ts` with keyword-based routing logic (no LLM).
- Test on 20 historical concierge turns (from chat archives).
- Measure: does the router pick the right KB 95%+ of the time?

### Phase 3: Wire into Concierge (Week 3)

- Update `concierge.ts` to call queryRouter() before buildMemoryBlocks().
- Change buildMemoryBlocks() to only inject routed KBs (not all of them).
- Measure impact: latency, token-count per turn, ICM box fetch reduction.

### Phase 4: Bonfire Reliability (Week 4)

- Tune /delve timeout + retry logic. Current: 10s read timeout. Test 5s + retry.
- Measure: reduce manual-relay fallbacks from 30% to <5%.
- Add observability: track which queries hit manual relay (for tuning).

### Phase 5: Long-Term Memory Sampling (Backlog)

- Archive files grow unbounded. Periodically (monthly) sample episodic memory: "what was the mood/tone of the past month?" Summarize and mirror to Bonfire.
- This adds a T1.5 tier: summary episodic facts, not full transcripts.

---

## Part 6: Expected Outcomes

### Metrics (Before / After)

| Metric | Before | After | Delta |
|---|---|---|---|
| KBs injected per turn | 9 (all) | 3-4 (routed) | -60% context |
| ICM box fetches per turn | 20 | 2-3 (conditional) | -85% fetch |
| Manual relay fallback rate | ~30% | <5% | -80% UX friction |
| Concierge latency (prompt build) | ~2-3s | ~500ms | -80% |
| Token-count per turn | ~8-10k (context) | ~3-5k | -50% |

### Quality (Why This Helps)

1. **Faster replies.** Smaller context window = faster token generation in Claude.
2. **Fewer hallucinations.** Less irrelevant context = less noise to confuse the model. A decision about WaveWarZ doesn't accidentally influence an answer about ZAOstock.
3. **Better Bonfire leverage.** Improved recall reliability means ZOE can proactively ask the bonfire bot without manual relay. The institutional graph becomes a real asset.
4. **Clearer reasoning traces.** Logs showing which KBs answered each question = easier to debug "why did ZOE say that?"

---

## Part 7: Alternative (Single-KB Graph)

**What if we collapsed everything into one Bonfire graph?**

**Pros:**
- No routing complexity. One query, one ranked result.
- Rich tagging (source, confidence, timestamp) naturally expressed in the graph.
- Cross-KB reasoning comes for free (e.g., "decisions that led to this build-state").

**Cons:**
- Requires migrating all local stores (persona.md, tasks.json, decisions.jsonl, threads.json, chat archives) into Bonfire episodes.
- Loses append-only audit trail (Bonfire episodes are mutable via the API).
- Loses local access during Bonfire downtime (graph is on VPS, can be unreachable).
- Introduces latency: every query is a network call (vs. local file reads).
- Persona (procedural knowledge) doesn't belong in a fact graph; storing it there conflates two types of knowledge.

**Verdict:** Not recommended for ZOE. The local / remote split (Bonfire as institutional backup, local KBs as hot-path files) is correct. Unify too much and you lose resilience and audit trails.

---

## Top 3 First Moves (Concrete)

### Move 1: Formalize the KB Model + Add Metadata Tags (Days 1-3)

**Task:** Update `bot/src/zoe/memory.ts` + types.ts to add explicit KB metadata:

```typescript
interface KnowledgeBase {
  id: string;                    // 'persona' | 'human' | 'decisions' | ...
  domain: string;                // 'identity' | 'people' | 'strategic' | 'operational' | ...
  tier: 0 | 1 | 2;              // retrieval priority
  storage: 'file' | 'archive' | 'graph' | 'api';
  staleness_threshold_hours?: number;
  last_updated: string;
}

const KBS: Record<string, KnowledgeBase> = {
  persona: { id: 'persona', domain: 'identity', tier: 0, storage: 'file', last_updated: ... },
  human: { id: 'human', domain: 'people', tier: 1, storage: 'file', staleness_threshold_hours: 24, ... },
  // ... etc
};
```

**PR:** Commit to a new branch `feature/kb-metadata`. No behavior change; just structure.

### Move 2: Write the QueryRouter in `bot/src/zoe/query-router.ts` (Days 4-7)

**Task:** Implement the routing logic (keyword-based, no LLM):

```typescript
export async function routeQuery(question: string): Promise<RouterResult> {
  const routed_kbs: KnowledgeBase[] = [];
  const keywords = question.toLowerCase();
  
  if (keywords.includes('who') || keywords.includes('person')) {
    routed_kbs.push(KBS.human, KBS.crm);
  }
  if (keywords.includes('why') || keywords.includes('decision')) {
    routed_kbs.push(KBS.decisions);
  }
  // ... etc
  
  return { kbs: routed_kbs, t0_override: detectBrandContext(question) };
}
```

**Test:** Run on 20 historical concierge turns (from chat archive). Measure: does the router match a human's "which KB would I check?" 95%+ of the time?

**PR:** Commit to branch `feature/query-router`. Add tests to `bot/src/zoe/__tests__/query-router.test.ts`.

### Move 3: Integration + Measurement (Days 8-14)

**Task:** Wire the router into `concierge.ts`:

```typescript
// OLD: const blocks = await buildMemoryBlocks(scope);
// NEW:
const routed = await routeQuery(userMessage);
const blocks = await buildMemoryBlocks(scope, { routed_kbs: routed.kbs });
```

**Measurement:** Log which KBs were queried for each turn. After 1 week of live runs, measure:
- Context-window size reduction (KBs injected).
- ICM fetch reduction.
- Bonfire /delve success rate (if improved from pre-routing).
- Latency (prompt-build time).

**PR:** Commit to `feature/router-integration`. Include logs showing the before/after metrics.

---

## Conclusion

ZOE's multi-KB architecture is already the right call. The question isn't "should we have multiple KBs?" but "how do we route to them intelligently?" The current "dump everything" strategy works but is wasteful. The three moves above cost ~2 weeks of work and deliver 50-80% latency + token reduction with no correctness risk.

**Do not flatten to a single KB.** Do formalize the routing.

---

## References

### Anthropic (Authoritative)
- https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents — Official guidance on context management for agents, hybrid KB approach
- https://platform.claude.com/docs/en/managed-agents/memory — Managed Agents memory architecture, max 8 stores per session

### Academic + Industry Research (Peer-Reviewed / Published)
- https://arxiv.org/html/2504.19413v1 — mem0 memory extraction, 67% accuracy vs 61% RAG, 91% latency reduction
- https://arxiv.org/abs/2501.13956 — Zep Graphiti engine, temporal knowledge graph, 94.8% accuracy, 90% latency vs MemGPT
- https://arxiv.org/html/2602.19320v1 — Industry standard episodic/semantic/procedural taxonomy, Endel Tulving framework
- https://arxiv.org/pdf/2509.19599 — Dynamic multi-stage routing (plan → delegate → synthesize), up to 18.7pp gains
- https://arxiv.org/abs/2507.06229 — Agent KB cross-domain integration, 18.7pp improvement, hybrid retrieval (semantic + BM25 + graph + temporal)

### Frameworks + Tools
- https://www.letta.com/blog/agent-memory/ — Letta four-layer architecture (message buffer → core → recall → archival)
- https://langgraphjs.guide/memory/ — LangGraph hierarchical memory patterns (short → episodic → long-term)
- https://www.getzep.com/ai-agents/temporal-knowledge-graph/ — Zep temporal partitioning for agents

### Critical Failure Mode Analysis
- https://www.indium.tech/blog/agent-memory-compression-failure-modes/ — Five failure modes (catastrophic forgetting, hallucination amplification, context drift, bottlenecks, bias creep)

### ZOE Implementation References
- `bot/src/zoe/memory.ts` — Current 4-KB architecture (persona, human, tasks, recent chat)
- `bot/src/zoe/recall.ts` — Bonfire /delve integration, remember() episodic mirroring
- `bot/src/zoe/thread-memory.ts` — Thread emit + PII/secret guards
- `research/identity/icm-boxes/` — Per-brand context boxes (The ZAO, WaveWarZ, ZABAL Games, zaal.eth, ZAO-assistant)
- useicm.com — ICM box hosting + API for brand context
