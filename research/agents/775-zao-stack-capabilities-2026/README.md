---
topic: agents
type: market-research
status: research-complete
last-validated: 2026-05-30
superseded-by:
related-docs: 601, 734, 759, 771, 772
original-query: "What is newly possible with ZAO's full tooling stack as of 2026-05-30 (live Bonfire graph recall via /delve, ZOE orchestrator Gap 1+2, Supabase public/private CRM, 190-endpoint Bonfires API with typed intake, Hermes, cross-bot relay): what NEW capabilities/workflows are unlocked, what's the highest-leverage next build, and how does it compare to other 2026 AI-agent-stack builders. Tier DEEP."
tier: DEEP
---

# 775 - What ZAO's Agent Stack Can Do Now (2026-05-30)

> **Goal:** Inventory the new capabilities unlocked after this session's work (live graph recall, orchestrator Gaps 1+2, Supabase CRM, typed Bonfire intake), name the single highest-leverage next build, and position the stack honestly against the 2026 agent-stack field.

## Key Decisions (recommendations first)

| # | Decision | Why |
|---|----------|-----|
| 1 | **Highest-leverage next build: a typed-triple ingestion path** (use the live `/knowledge_graph/add_triples` + typed `/entity` + `/edge` + `/ontology/ingest` endpoints) for meetings + CRM, instead of prose episodes. | The Bonfires kernel (doc 771) AND the 2026 field consensus both reward deterministic typed extraction over LLM prose extraction. The API already exposes it (doc 771 findings). This is the one move that puts ZAO at the frontier on knowledge quality, not par. |
| 2 | **Spread recall (`/delve`) beyond ZOE DMs** to `/meeting`, Hermes, and the CRM. | Recall just went live but ONLY in ZOE's private concierge turn (PR #744). The same `recall()` graph context would sharpen meeting recaps, Hermes fix-context, and CRM dedupe. Cheap to extend - the function exists. |
| 3 | **Agent-fed CRM from Gmail/GCal** (MCPs already connected) is now buildable end-to-end. | CRM tables + bot write API + ZOE `crm_op` shipped (doc 772). The missing piece is the extract->dedupe->upsert loop from email/calendar - the exact "AI chief of staff" pattern Lindy/Dex sell. ZAO has the substrate; competitors mostly do post-hoc enrichment. |
| 4 | **Use Gap 2 multi-agent dispatch for native research fan-out** inside ZOE. | The GATEWAY + 8-worker dispatch landed (doc 759). ZOE can now run `/zao-research`-style parallel investigation itself instead of Zaal driving it from a terminal. |
| 5 | **Do NOT build a bespoke memory engine.** Ride Bonfires (graph) + the recall/mirror wiring. | Mem0/Zep have billions-scale temporal-reasoning proof; ZAO can't out-engineer that. The win is the typed-intake + CRM coupling on top, not the memory core. |

## What is newly possible (that wasn't before this session)

1. **Graph-grounded ZOE answers, live.** ZOE now runs a `/delve` query against the Bonfire graph before each DM and injects hits as `<bonfire_recall>` context. Proven live: a "zabal gamez" query returned 5 graph hits in the journal. Before: recall was dead (wrong endpoint), ZOE answered only from repo Read + memory blocks.
2. **Typed knowledge ingestion (not just prose).** The live API exposes `/knowledge_graph/add_triples`, `/api/kg/add-triplet`, typed `/entity` + `/edge`, `/ontology/{ingest,match,gaps}`, and the procedural `/agents/{id}/stack/*`. ZAO can write structured facts, not just prose episodes that the backend has to re-extract.
3. **Agent-fed CRM.** Supabase `crm_contacts` + `crm_interactions` (public/private RLS), a `/network` public feed, a `/crm` admin dashboard, and a ZOE `crm_op` write path (doc 772). ZOE can log "met X, talked about Y" straight into the CRM from a Telegram message.
4. **Multi-agent dispatch under one gateway.** Gap 1 (`decompose.ts`) + Gap 2 (8 worker subagents via the Agent/Task tool, GATEWAY pattern) landed. ZOE owns the task graph and can fan work out to workers - the supervisor topology that is 2026 best practice.
5. **Autonomous code-fix loop (Hermes) + cross-bot relay** were already live; they now compose with recall + CRM (e.g. a fix PR can be graph-grounded; a relay can log its outcome to CRM).

## Positioning vs the 2026 field (honest)

| Axis | ZAO | Field leader (2026) | Verdict |
|------|-----|---------------------|---------|
| Knowledge-graph memory | Bi-temporal Neo4j (Graphiti fork) + GLiNER2 + Gemini, typed intake available | Mem0 (56.9K stars, 93.4% LongMemEval, $24M), Zep (63.8% LongMemEval, temporal graphs) | **Behind on benchmarked temporal-reasoning depth**, par on architecture. ZAO's typed-intake is frontier but unproven at scale. |
| Typed/deterministic extraction | GLiNER2 pipeline + typed-triple endpoints (rarely used yet) | LazyGraphRAG (700x cheaper queries), FastGraphRAG (6x cheaper), RetriCo/GLiNER, Youtu-GraphRAG (ICLR 2026) | **Ahead of the pack IF Decision 1 ships** - prose-only is the laggard position; typed is consensus. |
| Multi-agent orchestration | GATEWAY (1 supervisor, 8 workers, 3 critics, $50/day cap) | LangGraph (33K stars, 34.5M PyPI/mo, supervisor), CrewAI (44.6K stars), Mastra (pivoted network->supervisor Feb 2026) | **Par.** GATEWAY = the consensus supervisor pattern. Solid, not novel. |
| Agent-fed CRM / operator | Supabase RLS CRM + ZOE write path + graph mirror | Lindy ($49/mo, 4000+ integrations), Dex ($12/mo, relationship recall) | **Ahead on integration depth** (native structured write + graph), behind on breadth of connectors. |
| Long-term operator continuity | `/delve` per turn + Letta-style blocks | Mem0/Zep production-proven | **Behind on proof**, the wiring is sound. |

**One-paragraph read:** ZAO's stack is a 2026-current hybrid - Mem0-style selective memory + LangGraph-style supervisor orchestration + Lindy-style CRM coupling, on a GLiNER-based extraction substrate that is cheaper than full GraphRAG. It is **ahead on knowledge-engineering + CRM coupling, par on orchestration governance, behind on benchmarked temporal-reasoning depth.** The differentiator to press is deterministic typed knowledge tied to a structured CRM and a real community - not the memory core, which the field has already mass-produced.

## Findings (the numbers)

- **Mem0**: 56,921 GitHub stars, $24M funded, 93.4% LongMemEval (vs 67.8% baseline), ~6,787 tokens/retrieval vs 25K+ full-context, p50 0.708s.
- **Zep**: 63.8% LongMemEval (~15 pts over vector-only).
- **LangGraph**: 33,343 stars, ~34.5M PyPI downloads/mo, ~2.4x faster than CrewAI on research tasks (46.8s vs 111s p50).
- **CrewAI**: 44,600+ stars, 10M+ agent runs/mo, ~23% more token-efficient than LangGraph, 3x overhead on simple flows.
- **LazyGraphRAG** (Microsoft): ~0.1% of full-GraphRAG indexing cost, 700x cheaper queries at equal accuracy. **FastGraphRAG**: 6x cheaper. **Youtu-GraphRAG** (ICLR 2026): 33.6% lower token cost + 16.62% higher accuracy vs SOTA.
- **Mastra**: $22M Series A (Feb 2026), pivoted from LLM-routed `.network()` to supervisor after hitting 5 walls (memory propagation, routing fragility, observability, nesting, concurrency).
- **ZAO live**: Bonfires API = 190 endpoints; ZAO bonfire = 283 chunks; `/delve "What is ZAO?"` = 51 episodes; recall proven live (5 hits on "zabal gamez").

## Also See

- [Doc 759](../759-agent-best-practices-and-zoe-orchestrator-gap/) - the orchestrator gap analysis + GATEWAY decision (17-Q grill)
- [Doc 771](../../identity/771-bonfires-procedural-memory-kernel-fcg/) - Bonfires kernel decode + the live-API surface (typed intake endpoints)
- [Doc 772](../../business/772-crm-supabase-native/) - the Supabase-native CRM design
- [Doc 734](../734-hermes-orchestrator-framework/) - Hermes autonomous fix-PR pipeline
- [Doc 601](../601-agent-stack-cleanup-decision/) - the canonical 5-surface agent stack

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Build the typed-triple ingestion path (meetings/CRM -> `/knowledge_graph/add_triples` + `/entity`/`/edge`) | Claude | PR | Next sprint (Decision 1) |
| Extend `recall()` to `/meeting`, Hermes, CRM dedupe | Claude | PR | After typed-intake |
| Build the Gmail/GCal -> CRM extract-dedupe-upsert loop (agent-fed CRM) | Claude | PR | After CRM #739 merges + secrets set |
| Use Gap 2 dispatch for a native ZOE research fan-out (replace terminal-driven /zao-research for simple cases) | Claude | Spike | Backlog |
| Re-validate this positioning doc when Mem0/Zep benchmarks shift or the FCG kernel ships publicly | @Zaal | Staleness | 2026-06-30 |

## Sources

- [Mem0 GitHub + LongMemEval benchmarks](https://github.com/mem0ai/mem0) - `[FULL]` (stars + benchmark figures verified)
- [Mem0 v2 accuracy paper (ECAI 2025, arXiv 2504.19413)](https://arxiv.org/abs/2504.19413) - `[FULL]`
- [State of AI Agent Memory 2026 (Towards AI)](https://pub.towardsai.net/the-state-of-ai-agent-memory-in-2026-what-the-research-actually-shows-0b77063c2c2b) - `[FULL]`
- [LazyGraphRAG (Microsoft Research)](https://www.microsoft.com/en-us/research/blog/lazygraphrag-setting-a-new-standard-for-quality-and-cost/) - `[FULL]`
- [FastGraphRAG (CircleMind)](https://github.com/circlemind-ai/fast-graphrag) - `[FULL]`
- [Youtu-GraphRAG (Tencent, ICLR 2026)](https://github.com/TencentCloudADP/Youtu-GraphRAG) - `[FULL]`
- [RetriCo (Knowledgator/GLiNER)](https://github.com/Knowledgator/RetriCo) - `[FULL]`
- [LangGraph GitHub](https://github.com/langchain-ai/langgraph/) - `[FULL]` (stars verified)
- [CrewAI vs LangGraph vs OpenAI Agents benchmark](https://markaicode.com/benchmarks/multi-agent-benchmark/) - `[FULL]`
- [Mastra network->supervisor migration (5 walls)](https://dev.to/jackchenme/5-walls-multi-agent-frameworks-hit-receipts-from-mastras-year-of-network-to-supervisor-3am3) - `[FULL]`
- [Supervisor-plus-gate pattern catalog](https://www.agentpatternscatalog.org/patterns/supervisor-plus-gate/) - `[FULL]`
- [Lindy AI chief of staff](https://stormy.ai/blog/ai-chief-of-staff-lindy-business-automation) - `[FULL]`
- [Dex vs Clay 2026](https://getdex.com/blog/dex-vs-clay/) - `[FULL]`
- Live Bonfires API (`https://tnt-v2.api.bonfires.ai/openapi.json`) - `[FULL]` - probed 2026-05-30, see doc 771.
