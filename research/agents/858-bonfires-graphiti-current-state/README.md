---
topic: agents
type: guide
status: research-complete
last-validated: 2026-06-14
related-docs: "665, 669, 759, 781, 798, 799, 855, 856, 857"
original-query: "keep researching Bonfires - understand the platform, the engine, how to build on it, and whether ZOE should move to graph memory (continuation of the DeepMeeting/GCvlcnti learning thread)"
tier: DEEP
---

# 858 - Bonfires / Graphiti: current-state + build guide

> **Goal:** the consolidated, verified understanding of Bonfires (ZAO's knowledge-graph platform) and Graphiti (its engine) as of June 2026 - what's real, how to build on it, and whether ZOE should use graph memory. Supersedes the now-stale docs 665/669 (last validated 2026-05-21).

## Key Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | BUILD on Bonfires/Graphiti - the engine is proven + low-lock-in | Graphiti is getzep's OSS framework: 27.4k stars, Apache 2.0, active (commit 2026-06-11), verified benchmarks (94.7% LoCoMo, 155ms p95). kEngrams export to markdown/canvas/owl AND the engine is OSS - if Bonfires dies, self-host Graphiti and keep the graph. |
| 2 | **Do NOT migrate ZOE's core memory to the graph.** Keep Letta-style blocks for the concierge. | Two independent memory analyses agree: graph memory wins for multi-agent + temporal + relationship inference; it's overkill for a single-user concierge (ZOE serves mostly Zaal). Letta blocks are fast + working. |
| 3 | USE the graph for SHARED ecosystem knowledge, queried on demand | ZOE keeps Letta memory; the ZABAL graph holds people/projects/decisions; ZOE queries it via `/delve` when it needs ecosystem facts (already wired in `recall.ts`). Hybrid, not migration. |
| 4 | Integration path = Bonfires HTTP API now (`/ingest_content` + `/delve`), Graphiti Python SDK direct only if self-hosting later | `recall.ts` already calls `/delve` live. No need for the heavier direct-Graphiti+Neo4j path unless ZAO self-hosts. |
| 5 | $KNOW is NOT live; x402-gating is the real monetization, same stack as WaveWarZ | Don't promise $KNOW rewards. The "Knowledge Network" = x402-gated graph queries (thirdweb facilitator on Base) - the exact stack WaveWarZ already uses. |

## The stack, top to bottom

- **Graphiti** (getzep, Apache 2.0, 27.4k stars) = the engine. Temporal context graphs: every fact has a validity window; entities evolve; everything traces to **episodes**. Backends: Neo4j / FalkorDB / Kuzu / Neptune. Hybrid retrieval (semantic + keyword + graph). Uses an LLM for entity/edge extraction + dedup. Ships its own MCP server.
- **Bonfires** (NERDDAO) = the productized wrapper: Telegram bots, kEngrams (merkle-portable subgraphs), ontology profiles, the 12 graph-hygiene constraints, a Python SDK/CLI (`bonfire init`/`chat`), HTTP API at `tnt-v2.api.bonfires.ai`.
- **Monetization** = x402-gated graph APIs (`x402-gated-api`, `scaffold-x402-bonfires`) + the future $KNOW token. Same x402/thirdweb/Base stack as WaveWarZ.
- **ZAO's instance** = the ZABAL bonfire (`zabal.bonfires.ai`); ZOE/Hermes read/write it.

## Build facts (verified from source + real implementations)

### The API that works today
- **Ingest:** `POST /ingest_content {bonfire_id, content, source, episode_type}`. ALWAYS set a human-readable `episode_name` - else auto-generated `episode:<timestamp>` junk pollutes search (real pepo-the-polyp bug).
- **Recall:** `POST /delve {bonfire_id, query}` -> `{episodes, entities, relationships}`. NOTE: `/delve` is keyword + graph heuristic, NOT pure vector - call `/vector_store/search` separately if you need semantic passages.
- **Immutable:** no update/delete endpoint. Version bad data via `episode_type` labels (e.g. `coral_v1` -> `coral_v2`) and filter old in queries.
- **Cap results for latency:** pepo caps to ~10 entities / 15 edges / 8 episodes to stay under 3s (Telegram times out at 10s, `/delve` must finish in ~8s).

### Graphiti direct (only if ZAO self-hosts later)
- `graphiti.add_episode(...)` (fire-and-forget; LLM extraction is 5-30s), `graphiti.search_(query, config=EDGE_HYBRID_SEARCH_RRF)` (<100ms, no LLM cost) vs cross-encoder config (1-2s, high precision). Custom entity types via Pydantic. `group_id` isolates per-user/per-repo. Cost ~$0.05-0.08/episode (extraction+dedup).

### Real production patterns (from pepo-the-polyp, bonfires-chat, memento-mori)
- Usage = voice/text in Telegram -> `/delve` -> summarize top 3 + entity graph -> reply.
- Triples (`/api/kg/add-triplet`) for dense/structured graphs (game state); free-text ingest for documents.
- Viz tools: `pulse.html` (activity + entity-frequency heatmap, catches spam ingests) and `memory-explorer.html` (searchable episode cards) in `bonfire-tools`.
- Scale seen: ~8k episodes / ~200 entities, performance fine. No published SLAs above that.

## Memory landscape (why ZOE stays on blocks)

| System | Type | Benchmark | Fit for ZOE |
|--------|------|-----------|-------------|
| Letta (ZOE now) | Block memory | none published | Good for single-user concierge - keep it |
| Graphiti/Zep | Temporal graph | 94.7% LoCoMo, 155ms | Use for shared ecosystem graph, not ZOE core |
| Mem0 | Memory layer | ~94% (marketing) | Easiest integration; not needed if staying Letta |
| Vector RAG | Baseline | ~50-90% | The thing graph beats on temporal/relations |

Graph memory genuinely wins for: multi-agent shared knowledge, temporal reasoning ("what was true then vs now"), multi-hop relationship inference, negations/corrections. ZOE-as-single-user-concierge needs none of those for its CORE memory - so blocks stay, graph is the shared layer.

## Also See

- [Doc 856](../../security/856-mira-cross-chat-graph-leakage/) - keep Mira out of the private graph
- [Doc 857](../../infrastructure/857-ton-telegram-native-strategy/) - TON/Telegram SKIP
- [Doc 855](../../community/855-gcvlcnti-bonfire-admin-relationship-log/) - the thread this came from
- Docs 665/669 - prior Bonfires docs, now stale; this supersedes their technical content
- `zdeepmeeting` repo `bonfire-hub/` - the running learning notes

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Mark docs 665/669 superseded-by 858 | @Zaal | Edit | Next |
| Keep ZOE on Letta blocks; use `recall.ts` /delve for ecosystem facts (no migration) | @Zaal | Decision | Confirmed here |
| When ingesting to the graph: always set episode_name + episode_type | @Zaal | Standing rule | Ongoing |
| Evaluate x402-gating the ZABAL graph (reuse WaveWarZ stack) | @Zaal | Spike | Later |
| Self-host Graphiti (Neo4j) only if Bonfires SLA/cost becomes a blocker | @Zaal | Trigger | If needed |

## Sources

- [Graphiti (getzep)](https://github.com/getzep/graphiti) [FULL - README, API, 27.4k stars, commit 2026-06-11]
- [Zep research / benchmarks](https://www.getzep.com/research/) [FULL - LoCoMo 94.7%, LongMemEval 90.2%, p95 155-162ms]
- [Mem0](https://github.com/mem0ai/mem0) + [pricing](https://mem0.ai/pricing) [FULL - $19-249/mo, 58.6k stars]
- [Letta](https://github.com/letta-ai/letta) [FULL - block memory, no published benchmark]
- [pepo-the-polyp (production Bonfires user)](https://github.com/MesoReefDAO/pepo-the-polyp) [FULL - real /delve + ingest patterns, latency caps]
- [NERDDAO bonfires-sdk / bonfire-tools / x402-gated-api](https://github.com/NERDDAO) [FULL - SDK v0.4.0, CLI, viz tools, x402 gating]
- G-Long arXiv 2606.13115 (graph memory +40.8% retrieval recall) [PARTIAL - abstract/claim, paper not deep-read]
