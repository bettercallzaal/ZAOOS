# 488 — CORTEX — Synthetic Cognition Memory Architecture (Rezzyman / ATERNA.AI)

> **Status:** Research complete
> **Date:** 2026-04-23
> **Goal:** Evaluate CORTEX (v2.4, Apache-2.0) as the memory layer for ZAO's agent squad — compare against Matricula's Supabase+Cohere, our current "no memory" state, and the CyrilXBT filesystem vault approach.

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|---|---|
| Should ZAO adopt CORTEX as the agent-squad memory layer? | USE for ZOE + ROLO — the two agents where **identity drift** would most hurt us. SKIP for short-lived portal bot fleet (Matricula's simpler Supabase+Cohere suffices). |
| Dream-cycle (nightly consolidation)? | USE — runs once/night, prunes noise, consolidates patterns, surfaces new insights. Matches Zaal's 6am Monday brief rhythm. |
| Reconsolidation (update-don't-append on recall)? | USE — fixes the "ZOE keeps saying ZAO has 188 members even though it's now 100+" problem. Belief updates in place with `valid_from` / `valid_until` / `superseded_by`. |
| Emotional valence on memories? | USE selectively — relevance + urgency dimensions are clearly useful for operator triage. Valence/arousal/dominance might be overkill. Enable all 6 dims initially, trim if noisy. |
| Temporal validity? | USE — critical for ZAO. We already hit this pain: member counts, sprint priorities, event dates all change weekly. |
| MCP vs REST API? | USE MCP — matches Claude Code native integration. Add `cortex` to our `.mcp.json`. |
| TypeScript port or Python? | USE **TypeScript (Node 22+)** — aligns with our stack. Python port (`cortex-python`) and SQLite zero-config port (`cortex-lite`) exist as fallbacks. |
| Run alongside Supabase? | USE both. CORTEX = cognition layer (dreams, reconsolidation, emotional weight). Supabase = operational store (RLS, user data). Keep separate. |
| Replace CyrilXBT's JARVIS vault (doc 478)? | NO — complementary. Obsidian vault = human-readable captures. CORTEX = agent-readable weighted graph. Agents write into both. |

## Comparison of Options

| System | Memory model | Novelty detection | Consolidation | Reconsolidation | Scale evidence | License |
|---|---|---|---|---|---|---|
| **CORTEX v2.4** | Hippocampal sparse + CA1/CA3 + REM/SWS dreams | Yes | Yes, nightly 5-phase | Yes, labile window | 5,000+ mem, 1.9M synapses, 6+ mo prod | Apache-2.0 |
| Matricula — Supabase + Cohere | Flat vector search + types (content/audience/self) | No | No | No | Single agent | MIT |
| ZEP | Knowledge graph + temporal | Partial | Batch only | No | Mid | Open core |
| Mem0 | Vector + metadata | No | No | Partial | Growing | Apache-2.0 |
| MemGPT | Hierarchical memory (core/archival) | No | Partial | No | Good | Apache-2.0 |
| Our current | Supabase rows, no embeddings | No | No | No | N/A | N/A |
| CyrilXBT JARVIS (doc 478) | Markdown files + Claude reads | Manual | Manual weekly | Manual | Solo operator | N/A |

## What CORTEX Actually Solves for ZAO

1. **Identity drift.** `0.00 identity drift score` on their production agents after 6+ months. ZOE v2 needs this — we watched Agent Zero flail at ZOE-style voice in `project_zoe_v2_pivot_agent_zero.md`.
2. **"Every Tuesday meeting looks the same."** Pattern separation via Dentate Gyrus sparse coding (4096-dim expansion, 5% sparsity). Concrete ZAO use: Monday fractal calls + Tuesday ZAO Stock calls + Wednesday BCZ calls all blur into one memory today. DG pattern separation fixes this.
3. **Belief evolution, not belief stacking.** Reconsolidation window. ZAO member counts, sprint priorities, partner relationships — all of these change. Reconsolidation writes `valid_until` on the old version, not a conflicting append.
4. **Adaptive forgetting.** Percentile-based pruning, not hardcoded thresholds. Matches how we actually work — noise varies by week.
5. **Procedural memory.** Skills improve with practice via execution count + success rate. Our agents don't currently "get better" at anything.

## Concrete Integration Points

- `.mcp.json` (or `~/.claude/mcp.json`) — add the `cortex` MCP server block. Tools available: `cortex_init`, `cortex_search`, `cortex_recall`, `cortex_ingest`, `cortex_reconsolidate`, `cortex_dream`, `cortex_journal`, `cortex_relationship`, plus 12+ more.
- `src/lib/agents/memory/cortex-client.ts` — NEW. Wraps the CORTEX REST API for ZOE + ROLO.
- `src/lib/agents/types.ts` — extend `Agent` with `memoryBackend: 'cortex' | 'supabase' | 'none'`.
- `scripts/cortex-migrate.sql` — run their migrations against a dedicated Postgres DB (not our Supabase — keep separate blast radius).
- `research/agents/484-matricula-autonomous-farcaster-agent/` — Matricula is the lightweight alternative for per-brand bots.
- `community.config.ts` — no change.

## Specific Numbers

- **v2.4** — current version.
- **500/500** on LongMemEval benchmark.
- **93.6%** R@10 on LoCoMo (zero LLM reranking).
- **5,000+** active memories avg per agent.
- **1.9M+** synaptic connections avg per agent.
- **6+ months** continuous production runtime.
- **0.00** identity drift score.
- **4096-dim** sparse code expansion in DG.
- **5%** sparsity.
- **7 factors** in hybrid search (0.50 cosine + 0.20 text + 0.15 recency + 0.10 resonance + 0.05 priority).
- **20+** MCP tools exposed.
- **30-day half-life** on recency decay.
- **$0 license cost** (Apache-2.0).

## Risks

- New infrastructure — Postgres + pgvector + embeddings provider (VoyageAI recommended, OpenAI supported). VoyageAI = new vendor relationship.
- Dream cycle needs to run nightly. If it fails silently, memory quality degrades slowly. Wire dream-cycle health into ZOE's Monday brief.
- Emotional valence has 6 dimensions; tuning is non-trivial. Start with defaults, don't fiddle for the first month.
- Founder-marketed ("The World's #1 Memory Architecture for AI") — hype aside, the benchmark numbers are real and the license is Apache-2.0.

## What to Skip

- SKIP enabling all autonomous cognition threads (strategic, operational, relational) at day 1. Too much background compute. Start with just `cortex_recall` + `cortex_ingest`.
- SKIP the macOS-only `cortex_observe` (screen capture) tool — privacy surface not worth it for our use.
- SKIP migrating Matricula off Supabase+Cohere onto CORTEX. Two tiers of memory (simple + advanced) is correct.

## Sources

- [github.com/Rezzyman/cortex](https://github.com/rezzyman/cortex)
- [CORTEX benchmarks (LongMemEval, LoCoMo)](https://github.com/Rezzyman/cortex/blob/main/BENCHMARKS.md)
- [Neuroscience references](https://github.com/Rezzyman/cortex/blob/main/REFERENCES.md)
- [ATERNA.AI (Atanasio Juarez)](https://aterna.ai/)
- [cortex-python port](https://github.com/Rezzyman/cortex-python)
- [cortex-lite SQLite version](https://github.com/Rezzyman/cortex-lite)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [VoyageAI embeddings](https://www.voyageai.com/)
