---
topic: agents
type: decision
status: research-complete
last-validated: 2026-05-06
related-docs: 547, 568, 613, 614, 615, 618, 619
tier: DISPATCH
---

# 620 - Bonfire push-everything: auto-ingest pipeline for Zaal's personal knowledge graph

> **Goal:** Make Bonfire writes happen automatically from every source Zaal touches, so `@recall` always returns useful answers. No manual curation.

## Key Decisions

| Decision | Action | Why |
|---|---|---|
| Bonfire stays as the primary KG substrate | YES, 60-day experiment from 2026-05-06 | Already wired into ZOE, Zaal pays for Genesis tier, Joshua responsive. Re-evaluate by 2026-07-05. |
| Dual-write to local mirror as insurance | YES | Vendor-lockin hedge. Same code path, free, gives a clean exit if Bonfire breaks. Mirror = Cognee or local Neo4j on VPS 1. |
| Auto-push from streams (Telegram, Farcaster, voice) | YES, ship in this order | Telegram first (uses existing grammy hook, lowest friction). Farcaster second (Neynar webhook). Voice last (smallest volume). |
| Auto-push from static sources | YES, in this order | Memory files BACKFILL-ONCE FIRST (135 files, gating step). Then research docs (740) nightly vector + hot-doc full-graph. Then newsletter drafts + voice transcripts via file watcher. |
| Auto-recall during draft generation | YES | Newsletter + social agents call `recall(topic)` BEFORE writing. Inject result as context. Failure mode = continue without it (don't block). |
| Sources footer on every recall reply | YES, configure in Bonfire UI | Without grounding, ZOE can't tell synthesis from fact. Until Sources land, no auto-publish of recall content. |
| Privacy + redaction layer before push | YES, mandatory | 5 regex strip patterns + Telegram-group inbound gate (push Zaal's outbound only, skip others without consent). |
| Client-side dedup via SHA256 hash log | YES | `~/.zao/zoe/bonfire-pushed.sqlite`. Skip re-push if hash seen. Avoids 540 docs * 5 cross-refs = 2700 dupes problem. |
| One Bonfire (personal) for now | YES | Separate ZAO-public bonfire later if/when we open-source the personal-graph stack. Cross-bonfire recall not yet supported. |
| Daily cost ceiling | $50/mo at full volume | Estimated 0.50-4.50/day worst-case. If creeps past $100/mo: trigger alternative eval. |

## What This Is

5 sub-agents ran [STANDARD] tier research in parallel. Each owns one cut of the auto-push problem. Synthesis below.

The shape:

```
                   Zaal does a thing
                          |
        +-----------------+--------------------+
        |                                      |
   STREAM SOURCES                       STATIC SOURCES
   (live, event-driven)                 (file/disk, scheduled)
        |                                      |
   Telegram DM/group                  Memory files (135)
   Farcaster casts                    Research docs (740)
   Voice (Whisper)                    Newsletter drafts (daily)
                                      Voice transcripts (file)
                                      GitHub PRs/commits
                                      Archive backfill (1x)
        |                                      |
        +-----------------+--------------------+
                          |
                  REDACT + DEDUP + LOG  <-- 620c operational layer
                          |
                  POST /ingest_content (Bonfire)
                          |
                  job_id -> /jobs/{id}/status
                          |
                  Graph node lands
                          |
                  +-------+-------+
                  |               |
            @recall <q>     auto-recall in draft
                  |               |
            ZOE response    Newsletter/social with context
```

## Sub-doc Index

| Sub | Topic | What's inside |
|-----|-------|---------------|
| [620a](./620a-stream-source-ingest.md) | Stream sources | Telegram (DM + groups), Farcaster (Neynar webhook), voice (OpenWhisp -> Whisper). Per-message vs per-conversation push. Wiring into existing `bot/src/zoe/index.ts` grammy hook. |
| [620b](./620b-static-source-ingest.md) | Static sources | 740 research docs, 135 memory files, newsletter drafts, GitHub artifacts, one-time archive backfill (Telegram, FC history, bookmarks, Lu.ma). Cron + file-watcher patterns. |
| [620c](./620c-privacy-dedup-cost.md) | Operational layer | 5 redaction regex patterns, SHA256 dedup, audit jsonl log, rate limit (max 3 active jobs), cost model (~$0.50-4.50/day), one-graph decision. |
| [620d](./620d-recall-feedback-loop.md) | Recall loop | Auto-recall in newsletter/social agents, multi-hop test queries, grounding via Sources footer, negative-result logging, 3 metrics for "is push working" (hit rate, node growth, qualitative). |
| [620e](./620e-alternatives-reality-check.md) | Reality check | Cognee 17K, Graphiti 25K, LightRAG 34K, Khoj 34K, Mem0 54K, Reor 8K stars. Hybrid dual-write recommendation. Exit triggers documented. 60-day re-evaluation. |

## Synthesis: The 9-Step Ship Order

Read the sub-docs for detail. This is the sequenced rollout, smallest difficulty first, highest unlock first.

| # | Step | Source(s) | Difficulty (1-10) | Unlocks |
|---|------|-----------|-------------------|---------|
| 1 | **Backfill memory files (135)** to Bonfire as full-graph entities | `~/.claude/projects/.../memory/` | 4 | Recall actually returns Zaal's facts. Today recall is empty because Bonfire is empty. This is the gating step. |
| 2 | **Wire dedup + redact + audit log** | All future pushes | 5 | Operational safety. Without this, step 3+ leaks secrets and creates dupes. |
| 3 | **Telegram DM auto-push** via grammy hook | `bot/src/zoe/index.ts` | 4 | Daily ZOE conversation feeds graph. Highest live-volume source for Zaal. |
| 4 | **Configure Bonfire agent system prompt** to append Sources footer | Bonfire UI | 2 | Recall replies are grounded; ZOE can show "from doc 547, memory file X". |
| 5 | **Auto-recall in newsletter agent** | `bot/src/zoe/agents/newsletter.ts` | 5 | Closes the loop. Drafts become context-aware. |
| 6 | **Research-doc cron** (nightly vector + hot-doc full-graph) | `research/` (740 docs) | 6 | KG indexes the full ZAO institutional memory. |
| 7 | **Farcaster cast push** via Neynar webhook | `src/lib/farcaster/neynar.ts` | 6 | Public-facing artifacts in graph. |
| 8 | **Voice transcript file-watcher** | OpenWhisp (doc 560) | 3 | Voice notes become first-class facts. |
| 9 | **Local mirror dual-write** | New: `~/.zao/zoe/local-graph/` | 5 | Insurance against Bonfire vendor risk. |

Step 1 is mandatory before anything else. Steps 2-9 can ship in any order after that, but the sequence above orders by ROI per unit difficulty.

## Hard Numbers

- **Bonfire endpoints used:** `POST /ingest_content` (full graph), `POST /ingest_content_vector_only` (cheap), `POST /agents/{id}/chat` (recall), `GET /jobs/{id}/status` (poll)
- **Bonfire agent UUID:** `69f13a649469bbc15bf61c10` (Zaal personal graph)
- **Existing memory files to backfill:** 135 (verified via `ls ~/.claude/projects/.../memory/ | wc -l`)
- **Existing research docs:** 740 (verified via `find research -name README.md`)
- **Daily push volume estimate:** 50-90K chars (~15-30K LLM-equivalent tokens)
- **Daily cost estimate:** $0.50 (vector-only diff) to $4.50 (everything full-graph). Genesis tier already includes baseline allowance.
- **Concurrent job ceiling:** 3
- **Dedup hash store:** `~/.zao/zoe/bonfire-pushed.sqlite`
- **Audit log:** `~/.zao/zoe/bonfire-pushes.log` (jsonl)

## What This Doc Does NOT Decide

- The exact Bonfire agent system prompt text (Zaal edits in Bonfire UI; not source-controlled).
- Whether to open a separate "ZAO Public" bonfire for community-readable docs (deferred until ZAO Public launches).
- The replacement substrate if Bonfire fails the 60-day eval. 620e ranks the alternatives but doesn't pick one.
- Whether to ingest Discord DMs (out of scope; consent gate is too messy without explicit per-server policy).

## Failure Modes

| Failure | Symptom | Recovery |
|---------|---------|----------|
| Secret leaked into Bonfire | post-hoc grep of audit log finds API key in `content` field | Rotate the leaked key immediately. Email Joshua to remove that node. Tighten regex. |
| Dedup hash collision (2 different facts same hash) | `@recall` returns wrong fact | Hash collisions on SHA256 of human-typed text are vanishingly rare. If it happens once: log + ignore. If twice: switch to SHA512. |
| Bonfire job queue stuck | `/jobs/active` count climbs, no completions | Pause auto-push (sentinel file `~/.zao/zoe/bonfire-paused.flag`). Email Joshua. ZOE falls back to local-only memory. |
| Recall hit rate < 30% after backfill | Most queries return empty | Diagnose: are pushes actually landing in graph? Check `/jobs/{id}/status` for the last 20. Check Bonfire UI to see node count. If pushes succeed but recall fails: agent system prompt is wrong, fix in UI. |
| Bonfire shuts down or 10x pricing | Vendor risk realized | Local mirror (step 9) is the disaster recovery. Migrate to Cognee or Graphiti from sub-doc 620e. Re-ingest from local mirror, not from sources (faster). |

## Also See

- [Doc 547 - Multi-agent coordination Bonfire+ZOE+Hermes](../547-multi-agent-coordination-bonfire-zoe-hermes/)
- [Doc 568 - Aware Brain alternatives](../../infrastructure/568-aware-brain-kg-chat-memory-stack/) (KG-chat alternatives audit)
- [Doc 613 - Hermes canonical agent framework](../613-hermes-canonical-agent-framework/)
- [Doc 614 - Bonfire ontology](../614-bonfire-ontology/)
- [Doc 615 - ZOE pipeline audit](../615-zoe-pipeline-audit/)
- [Doc 618 - AGENTS.md spec audit](../../dev-workflows/618-agents-md-spec-zaoos-audit/)

## Next Actions

| # | Action | Owner | Type | Difficulty | Trigger |
|---|--------|-------|------|------------|---------|
| 1 | Backfill 135 memory files to Bonfire as full-graph entities | Claude | Script + PR | 4 | After PR #482 (618) merged |
| 2 | Add `bot/src/zoe/bonfire-write.ts` with `ingestContent()` + redact + dedup + audit | Claude | PR | 5 | After step 1 |
| 3 | Wire grammy hook in `bot/src/zoe/index.ts` to call `ingestContent()` on every Telegram turn | Claude | PR | 4 | After step 2 |
| 4 | Edit Bonfire agent system prompt in UI to append Sources footer | Zaal | UI edit | 2 | This week |
| 5 | Wire `recall(topic)` precall in `newsletter.ts` and future `social.ts` | Claude | PR | 5 | After step 4 |
| 6 | Cron job: nightly research-docs vector-only push + on-commit hot-doc full-graph push | Claude | systemd timer + PR | 6 | After steps 1-5 stable |
| 7 | Neynar webhook -> POST /api/farcaster/cast-to-bonfire route | Claude | PR | 6 | After step 6 |
| 8 | OpenWhisp -> file watcher -> push voice transcript | Claude | shell + systemd | 3 | After OpenWhisp installed (doc 560) |
| 9 | Dual-write to local mirror (Cognee or Neo4j on VPS 1) | Claude | PR + infra | 5 | After step 8, before 60-day eval |
| 10 | 60-day eval: keep Bonfire or migrate? | Zaal + Claude | Decision review | n/a | 2026-07-05 |

## Sources

- [Bonfire OpenAPI spec](https://tnt-v2.api.bonfires.ai/openapi.json) - verified 2026-05-06
- [Bonfire homepage](https://bonfires.ai)
- [Cognee](https://github.com/topoteretes/cognee) - 17K stars
- [Graphiti](https://github.com/getzep/graphiti) - 25K stars
- [LightRAG](https://github.com/HKUDS/LightRAG) - 34K stars
- [Khoj](https://github.com/khoj-ai/khoj) - 34K stars
- [Mem0](https://github.com/mem0ai/mem0) - 54K stars
- [Reor](https://github.com/reorproject/reor) - 8K stars
- [Neynar webhooks docs](https://docs.neynar.com/reference/webhooks)
- Live source: `bot/src/zoe/recall.ts` on VPS at 31.97.148.88
