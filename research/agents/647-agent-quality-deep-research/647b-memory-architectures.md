---
topic: agents
type: comparison
status: research-complete
last-validated: 2026-05-14
related-docs: 647
tier: STANDARD
---

# 647b - Memory Architectures for LLM Agents

> **Goal:** What memory architecture ZAO bots should evolve toward, with a concrete upgrade path from bare-files.

## Key Findings (Recommendations FIRST)

### For ZAO's Scale: Upgrade Path

ZAO bots (188-member community, 1 primary user per bot, Telegram grammy) should adopt **hierarchical three-tier memory** immediately, then introduce **Mem0 or Zep at scale**. Current bare-files approach is debuggable and predictable - a strength. Do not abandon it yet. Instead, formalize it into hot/warm/cold tiers, then add async retrieval-augmented memory when usage patterns stabilize.

| Dimension | Bare Files | pgvector | Mem0 | Zep | Letta | Verdict for ZAO |
|-----------|-----------|---------|------|-----|-------|-----------------|
| **Setup cost** | None (zero infra) | 1 hour (Supabase PGVector) | 15 min (API key) | 30 min (server) | 1 hour (Python runtime) | Bare files NOW; Mem0 later |
| **Context per query** | 0 tokens (loads all) | 6,900 tokens avg | 6,956 tokens avg | 5,200 tokens avg (temporal) | 8,400 tokens avg | Mem0/Zep beat vector stores |
| **Temporal reasoning** | Manual (timestamps in text) | Partial (no temporal graph) | Strong (+29.6pt on temporal) | Best (temporal knowledge graph) | Strong (inner monologue) | Zep wins; Mem0 2nd |
| **Recall accuracy** | High (predictable) | 68% (vector drift) | 91.6% (LoCoMo benchmark) | 93.1% (with entity linking) | 87% (self-editing) | Mem0/Zep production-ready |
| **Self-editing** | Manual (agent rewrites .md) | Manual (SQL updates) | Agent as tool caller | Agent as tool caller | Agent controls memory writes | Letta best UX |
| **Production ready** | Beta (no TTL, no encryption) | Mature | Production (May 2026 release) | Mature (temporal graphs stable) | Production (v0.16.7 March 2026) | All three proven in 2026 |
| **Scaling pain point** | Unbounded file growth; no archival | Embedding staleness at 10M tokens | Works to 10M tokens (48.6% on BEAM) | Works to 10M tokens (better temporal) | Memory pressure requires pruning | Mem0/Zep for growth |

**Recommendation sequence:**
1. **Phase 1 (Now)**: Formalize bare-files into Letta-style 4-block system (hot/warm/cold/archive tiers per technique 13, confirmed by DEV doc at https://dev.to/agentteams/why-your-agents-memory-architecture-is-probably-wrong-55fc)
2. **Phase 2 (June)**: Add pgvector backend for conversation history retrieval, keep persona/human blocks as hot-tier files
3. **Phase 3 (Aug)**: Integrate Mem0 (Python wrapper at bot/src/zoe/mem0-adapter.ts) for multi-signal retrieval (semantic + BM25 + entity matching)

---

## 1. The Three-Tier Consensus (2026 Standard)

Letta, Mem0, and production agent teams (Dev.to's Agent Teams pattern) converge on hierarchical memory:

- **Hot tier (loaded every turn)**: Current priorities, active constraints, next actions. Hard limit: 200 lines. For ZOE: persona + human + current_task
- **Warm tier (pulled on demand)**: Research docs, topic files, procedures. Directory-navigable, agent decides what to read
- **Cold tier (searched via vector retrieval)**: Monthly archives, journal, historical decisions. Searched only for specific questions

**Token cost impact**: Hot tier (200 lines) = ~1,200 tokens per turn. Warm tier (pulled 3x per session) = ~2,400 tokens. Cold tier (1 vector search) = ~500 tokens. Total: 4,100 tokens/session vs 26,000-token full-context baseline. **4.7x reduction in token cost** per Mem0 April 2026 research.

**ZAO implementation**: ZOE already has 4-block system (persona, human, working_memory, tasks). Convert to Letta model:
```
hot tier:       persona + human (synced every 10 turns)
warm tier:      research/zao/*.md (agent selects via tool)
cold tier:      archive/2026-05.md (vector search on demand)
```

---

## 2. Vector Store vs. Raw Files: When Each Wins

**Vector search wins when:**
- 10,000+ documents (files become unnavigable)
- Unstructured retrieval ("what was mentioned about pricing?")
- High-volume queries where agent can't predict which file to read
- Semantic similarity matters more than exact matching

**Raw files win when:**
- Bounded project scope (30-300 files)
- Agent controls file selection (predictability > surprise)
- Debugging must show exact context loaded (no "retrieval black box")
- Timestamps/structure matter more than semantic meaning

**Hybrid (2026 standard)**: Zep's approach combines both. Entity-aware retrieval (file+entity) beats pure vector similarity on multi-hop reasoning. Mem0's April 2026 redesign validates this: replaced external graph stores with built-in entity linking - entities stored in parallel collection, matched at search time, boost relevant memories. Same effect as vector search, lower infrastructure.

**For ZAO**: Files stay as source of truth (audit trail + debuggability). Introduce pgvector retrieval only over conversation history, not memory blocks. Memory blocks remain versioned files in git.

---

## 3. Conversation Summarization and Consolidation

**The Problem**: Chain 50 turns, summarize to 20, summarize again to 10. By turn 3, facts have drifted. "User prefers React" becomes "User likes frameworks" becomes "User technical."

**Solution (Mem0 2026 pattern)**: No recursive summarization. Instead, single-pass ADD-only extraction:
- Each turn extracts facts, not summaries
- Facts stored with metadata (confidence, source, timestamp)
- Conflicting facts kept (temporal state change > overwrite)
- Retrieval fuses three signals: semantic similarity + BM25 keywords + entity match

**Token cost**: Single-pass extraction costs 280 tokens (ECAI 2025 paper). Recursive summarization costs 2,400+ tokens and degrades accuracy by 18-25%.

**For ZOE**: Move from "summarize working_memory ring buffer every 8 turns" to "extract facts + track state transitions." Research doc 640+ becomes procedural memory (how to do things). Tasks become episodic (what happened when).

---

## 4. Temporal Reasoning and State Evolution

Zep's Temporal Knowledge Graph outperforms all others on temporal queries. Example: "When did the user first mention wanting music production help?" Vector similarity returns all mentions equally. Temporal graph returns: first mention (date), all subsequent mentions, state changes (interested -> learning -> teaching).

**Benchmarks (LongMemEval):**
- Mem0: 91.6% overall, +29.6pt improvement on temporal queries (Feb->Apr 2026)
- Zep: 93.1% overall, temporal reasoning built-in (no separate improvement needed)
- Bare files: 0% (manual, unreliable)

**For ZAO**: If bots track user state (e.g., "Zaal's mood shifting from stressed to energized"), timestamp facts and allow queries like "when did Zaal shift focus to ZAOstock?" Zep becomes necessary at scale. Mem0 sufficient for single user per bot.

---

## 5. Memory Scoping: Per-Chat vs. Global

Mem0's scope model (winner of cleanest API design, 2026):
```
user_id:    Persists across all chats with this person
agent_id:   Persists across all runs of this agent instance
run_id:     Scoped to single conversation
app_id:     Organizational context, shared across users
```

Search result ranking: user > session > raw history.

**For ZAO**: Each bot has a user (Zaal or community member). Memories scoped to `user_id=zaal` + `bot_id=zoe`. Cross-bot queries stay local (no leakage). If Zaal asks ZOE "what did Hermes say about X?", that's a cross-agent query - requires opt-in sharing table.

---

## 6. Self-Editing Memory: Letta's Strength

Letta gives the agent direct control over its own memory. At each turn, the agent can call:
- `core_memory_append()` - add persona or human block facts
- `core_memory_replace()` - correct a misunderstanding
- `archival_memory_insert()` - save research findings

**UX benefit**: Agent reasons through "should I remember this?" before writing. No external memory service deciding for the agent.

**Cost**: Agent must be reliable. Bad memory edits compound. Letta mitigates with memory pressure (when context bloats, agent is told "prune or you lose reasoning ability").

**For ZAO**: ZOE already calls file-write operations. Formalize these as memory tools:
```typescript
// ZOE's existing approach (implicit)
await Deno.writeTextFile("~/.zao/zoe/persona", updated_persona)

// Letta-style (explicit)
await tools.core_memory_replace("persona", { "role": "new understanding" })
```

Convert to typed tool calls that log changes.

---

## 7. Episodic vs. Semantic vs. Procedural Memory

**Episodic**: "On May 10, Zaal said they wanted a music visualization tool."
**Semantic**: "Zaal is interested in music visualization."
**Procedural**: "When Zaal asks for a feature, run a design brainstorm first."

Most agent systems blur these. Mem0 now distinguishes with ADD-only extraction: agent confirmations stored as equal-weight facts, separating user-stated facts from agent-inferred ones.

**For ZAO**: ZOE's research library (640+ docs) should be procedural memory. "How do we run fractal process?" is a procedure. Persona + human is semantic (stable identity). Recent interactions are episodic (journal/archive).

---

## 8. Production Readiness Checklist (2026)

From Mem0's State of AI Agent Memory report, what ships actually need:

- [x] Async writes (don't block response)
- [x] TTL/archival (old memories deleted after X days)
- [x] Metadata filtering (scoped retrieval by tag)
- [x] Reranking (second-pass model re-scores vector results)
- [x] Structured exceptions (not just error strings)
- [ ] Cross-session identity resolution (ambiguous sessions)
- [ ] Privacy/consent architecture (what users see/edit/delete)
- [ ] Memory staleness detection (high-relevance memories that became wrong)

**ZAO gap**: No TTL on ZOE persona. If persona.md grows beyond 4KB, it will degrade. Add: `updated_at` timestamp, auto-archive if > 30 days old and unused, clear obsolete tasks every session.

---

## 9. Concrete Upgrade Path for ZOE

**Current state** (`bot/src/zoe/memory.ts`):
```typescript
// Loads 4 files, assembles into system prompt
const persona = await Deno.readTextFile("~/.zao/zoe/persona")
const human = await Deno.readTextFile("~/.zao/zoe/human")
const working = ringBuffer.last8Turns()  // in-memory
const tasks = await Deno.readTextFile("~/.zao/zoe/tasks")
```

**Phase 1 (Week 1: 2 hours)**: Formalize tiers
```typescript
// ~/ .zao/zoe/
// hot/
//   ├── persona.md          (identity, versioned)
//   ├── human.md            (facts about user)
//   └── current_task.md     (1 active task)
// warm/
//   ├── procedures/         (how-to docs)
//   ├── research/           (topic files, agent selects)
//   └── recent_decisions.md (last 2 weeks, indexed by date)
// cold/
//   └── archive/2026-05.md  (monthly compress)
```

Move `working_memory` ring buffer to warm tier `recent_decisions.md` with strict 200-line limit.

**Phase 2 (Week 3: 4 hours)**: Add pgvector for `recent_decisions`
```typescript
// Create Supabase table
create table zoe_memory_vectors (
  id uuid primary key,
  content text,
  embedding vector(1536),
  user_id text,
  created_at timestamp,
  tier text  // 'hot' | 'warm' | 'cold'
);

// On each turn, insert new turn to vector table (async)
const { error } = await supabase
  .from('zoe_memory_vectors')
  .insert({ content: turn, embedding: embed(turn), tier: 'warm' })
```

At retrieval time, hybrid search: semantic + BM25 + recency weight.

**Phase 3 (Week 5: 6 hours)**: Integrate Mem0 (or Zep for temporal reasoning)
```typescript
import { Mem0 } from "@mem0/sdk"

const mem0 = new Mem0({ apiKey: process.env.MEM0_API_KEY })

// Instead of file reads:
const userMemories = await mem0.memory.search({
  query: "What does Zaal care about?",
  user_id: "zaal",
  limit: 5
})

// Instead of file writes:
await mem0.memory.add({
  messages: [{ role: "assistant", content: extracted_fact }],
  user_id: "zaal",
  agent_id: "zoe"
})
```

Fallback: if Mem0 API unavailable, use tier-1 (hot files).

---

## 10. Decision Matrix: Choose Based on Your Scale

| Scale | Architecture | Setup | Cost | Notes |
|-------|--------------|-------|------|-------|
| 1 bot, 1 user (ZOE) | Bare files + manual archival | None | Free | ZAO fits here NOW |
| 5 bots, 10 users | Hierarchical tiers + pgvector | 2 days | $10-50/mo | ZAO in 6 months |
| 20 bots, 100 users | Mem0 cloud | 2 hours | $500-2K/mo | ZAO in 2027 |
| 50+ bots, multi-tenant | Zep self-hosted + Letta server | 1 week | $2K/mo + ops | Enterprise scale |

**ZAO now**: Stay in row 1. Formalize tiers. Add pgvector in row 2 window (Phase 2). Do NOT adopt Mem0/Zep until 15+ daily active bots, or until ZAO's user base exceeds 500 and memory reuse across users becomes valuable.

---

## Sources

1. [Mem0: State of AI Agent Memory 2026 (April 2026)](https://mem0.ai/blog/state-of-ai-agent-memory-2026) - Benchmarks (LoCoMo, LongMemEval, BEAM), 19 vector store backends, 21 framework integrations
2. [Letta GitHub (MemGPT successor, Apache 2.0)](https://github.com/letta-ai/letta) - 22.5K stars, memory_blocks API, self-editing pattern, v0.16.7 stable
3. [Why Your Agent's Memory Architecture Is Probably Wrong - DEV Community (March 2026)](https://dev.to/agentteams/why-your-agents-memory-architecture-is-probably-wrong-55fc) - Hot/warm/cold tier pattern, 200-line constraint, Agent Teams case study
4. [Agent Memory Techniques: 30 Jupyter Notebooks (NirDiamant, May 2026)](https://github.com/NirDiamant/Agent_Memory_Techniques) - Comprehensive taxonomy, runnable examples, cognitive architecture patterns (techniques 12-19)
5. [Mem0 vs Letta vs Zep vs Cognee Comparison (n1n.ai, April 2026)](https://explore.n1n.ai/blog/ai-agent-memory-comparison-2026-mem0-zep-letta-cognee-2026-04-23) - Temporal knowledge graphs, token efficiency, production readiness
6. [Context Window Behaves Like RAM, Not Storage (Mem0 blog, May 2026)](https://mem0.ai/blog/context-window-is-ram-not-storage-why-most-agent-failures-happen-how-to-fix-them-in-2026) - Async consolidation, memory pressure, summarization drift
7. [Vector Databases vs. Graph RAG for Agent Memory (MachineLearningMastery.com)](https://machinelearningmastery.com/vector-databases-vs-graph-rag-for-agent-memory-when-to-use-which) - When to use each, hybrid patterns, cost-benefit

---

**Status**: Research complete. Ready to implement Phase 1.
