---
topic: agents
type: decision
status: research-complete
last-validated: 2026-05-18
related-docs: 601, 650, 665, 668, 669, 673
tier: DISPATCH
---

# 673 - ZOE <-> Bonfires Dialog + Automation (Phase 2 Research)

> Zaal asked: "how will [Phase 1] actually work? can we research how to make bonfires more of an automated thing and make the ZOE and it talk to each other?" 5 parallel sub-agents traced Phase 1, audited Bonfires automation primitives, mapped ZOE's hook surfaces, investigated the @zabal_bonfire deployed agent, and wrote the Phase 2 build spec.

## Headline

Phase 1 (shipped today) is one-way: ZAOcoworkingBot -> ZABAL bonfire. ZOE doesn't know the bonfire exists yet. **Phase 2 fixes that with 3 P0 hooks + leverages 3 free Bonfires automation primitives.** Build is ~265 LoC across 3 new files. **Single blocker: confirm the bonfire query endpoint shape with Ryan before code lands.**

## What Phase 1 Actually Does (sub-doc 673a)

Concrete trace of /add -> kEngram landing:

```
Telegram /add -> grammy -> commands.ts cmdAdd
  -> mutateActions (Octokit write to actions.json)
  -> reply to user
  -> fireBonfire('add', item, ctx) [v0.3.0 new]
    -> enqueue ~/.zaocoworking/bonfire-spool.jsonl (PENDING)
    -> POST tnt-v2.api.bonfires.ai/v1/bonfires/69ef.../kengram/batch
       body: { nodes: [todo:25], edges: [CREATED_BY, BELONGS_TO, ASSIGNED_TO] }
    -> on 2xx: spool line -> SENT
    -> on err: stays PENDING, retried on next drainSpool()
```

**Verification**: spool line shows `status: sent` AND node visible at zabal.bonfires.ai. Both required.

**Failure modes**: API down = spool retains; partial write impossible (atomic per request); wrong endpoint path (untested guess) = all writes fail silently to spool. 5 attempts then quarantine to `.dead.jsonl`.

**Gap today**: Only 8 slash commands trigger bonfire writes. Group @mentions to the bot hit the LLM concierge path which does NOT call `fireBonfire`. Telegram conversations are NOT broadly ingested.

## Bonfires Automation Wins (sub-doc 673b)

What Bonfires does FOR US automatically, no API calls needed:

| Primitive | Status | Win for ZAO |
|---|---|---|
| Auto-KG extraction (20-min loop) | CONFIRMED | Pipe events in; KG self-organizes for free. Survives bot restarts. |
| Synthesis-frontend auto-publish | CONFIRMED | Bonfires renders completed HyperBlogs as public feed at app.bonfires.ai/hyperblogs. ZAO's agents can auto-publish team summaries with no manual dashboard work. |
| Adaptive graph_mode | CONFIRMED | LLM decides per-query if KG retrieval is needed. ~40% token savings vs static-pull. |
| Webhooks / push events | UNKNOWN | Not documented; ask Ryan |
| MCP server | EXISTS, undocumented install | ZOE could mount Bonfires as MCP tools natively. Path 2 in 673d. |
| Cross-bonfire federation | PROBABLE | If ZAO mints multi-bonfire later, cross-ref likely works |

**Top 3 to USE in Phase 2**: 20-min auto-extract (passive, free), synthesis auto-publish (for the morning brief), adaptive graph_mode (for cost containment).

## ZOE's Hook Surfaces (sub-doc 673c)

8 candidate hook points mapped, top 3 are P0 load-bearing:

| # | Hook | File:line | Impact |
|---|---|---|---|
| 1 | LLM dispatch system-prompt injection | `bot/src/zoe/concierge.ts:22-51 buildSystemBlocks()` | Every turn gets bonfire context. ~2-4KB cached. Risk LOW. |
| 2 | Memory-write mirror | `bot/src/zoe/concierge.ts:115-127 after splitReplyAndOps()` | When ZOE updates tasks/sidequests, fire async POST to bonfire. Keeps graph in sync with ZOE's decisions. Risk MED (write protocol). |
| 3 | Morning brief intake | `bot/src/zoe/brief.ts:60-100 generateMorningBrief()` | Pull bonfire overnight activity into the 5am brief. Single daily coordination point. Risk LOW. |

Other 5 surfaces (P1-P2): scheduler post-slate enrichment, voicememo auto-extraction, tools.ts new tools, /vm command bonfire-write, transcripts ingest.

## The @zabal_bonfire Deployed Agent (sub-doc 673d)

The bonfire ALREADY has its own agent. ZOE can talk to it via 3 protocols:

| Protocol | Latency | Use case |
|---|---|---|
| REST API direct (`tnt-v2.api.bonfires.ai`) | 100-200ms | ZOE's daily fact-checking, factual recall. **Phase 2 default**. |
| MCP WebSocket (bonfires-mcp from LobeHub) | 300-800ms | Natural-language tools embedded in Claude Code. Phase 2.5 / 3. |
| Telegram relay (@zabal_bonfire mention) | 2-10s | Most conversational. Experimental; needs in-group test. Phase 3+. |

**Identity**: Agent ID `69ef871f0d22ed7e6f2b243c`, ERC-8004 reputation token #32009 on Base. The token is a TRUST BADGE other agents can query to assess reliability, NOT a permission gate.

**Behavior**: 15 production personality traits enforce extraction discipline, dedup, title normalization, state truthfulness. Doesn't hallucinate facts not in its graph.

## Phase 2 Build Spec (sub-doc 673e)

Architecture: ZOE gets `bonfire_query` and `bonfire_recent` tools injected into her Claude Max prompt. She reads team activity on-demand (Zaal asks "what did Iman ship?") and on a schedule (06:00 UTC snapshot feeds morning brief + post slate).

**New files** (3 files, ~265 LoC):

```
bot/src/zoe/bonfire/
  client.ts   85 lines   HTTP wrapper + disk cache for query/recent
  tools.ts   120 lines   LLM tool schemas (bonfire_query, bonfire_recent)
  types.ts    60 lines   KGNode, KGEdge, CachedSnapshot shapes
```

**Modified files**:
- `bot/src/zoe/concierge.ts` - register tools + inject context block (~30 lines)
- `bot/src/zoe/brief.ts` - pull overnight bonfire activity (~25 lines)

**Env contract delta** (shared with ZAOcoworkingBot's existing values):
```
BONFIRE_API_KEY=...          # same key
BONFIRE_ID=69ef871f0d22ed7e6f2b243a
BONFIRE_QUERY_TIMEOUT_MS=10000  # optional, default 10s
BONFIRE_SNAPSHOT_TTL_MINUTES=30 # optional, default 30
```

**8 locked decisions**:
1. HTTP REST direct (not subprocess, not MCP yet) - VERDICT
2. Pull on-demand, not subscribe to push - VERDICT (push UNKNOWN per 673b)
3. Read-only in Phase 2; ZOE writes deferred to Phase 3 - VERDICT
4. 10s timeout, best-effort failure - VERDICT
5. 30-min disk cache for snapshot queries - VERDICT
6. Tool surface = 2 tools (`query`, `recent`); no write tool yet - VERDICT
7. graph_mode = adaptive (per 673b ~40% token save) - VERDICT
8. Cron snapshot at 06:00 UTC into brief - PROPOSED, Zaal to confirm

**5 acceptance tests**:
1. ZOE answers "what is everyone working on?" by pulling /list-equivalent from bonfire
2. ZOE proactively DMs Zaal about a stale item discovered via bonfire query
3. Morning brief includes "yesterday: X done across Y brands"
4. Zaal asks "what did Iman ship this week?" -> ZOE queries by COMPLETED_BY edge
5. Failed bonfire query falls back to stale cache or "can't reach bonfire" reply

## What's Blocking The Build

| Blocker | Who | When |
|---|---|---|
| Confirm bonfire query endpoint shape returns the KGSearchResult schema we assume | Ryan (joshua.eth) | DM this week |
| Baseline perf test (single query p50 < 5s) | Zaal local terminal | After endpoint confirmed |
| Decide cron snapshot time (06:00 UTC vs 11:00 UTC ET vs other) | Zaal | One-line confirm |

Once these 3 land, ~265 LoC + tests in ~4-6h.

## Automation Roadmap

| Phase | What | Status | Time |
|---|---|---|---|
| Phase 1 | ZAOcoworkingBot -> bonfire one-way | SHIPPED today v0.3.0 | done |
| Phase 2 | ZOE reads bonfire (tools + brief + concierge injection) | SPEC LOCKED, blocked on endpoint confirm | 4-6h |
| Phase 2.5 | bonfires-mcp via Claude Code MCP server | UNKNOWN install pattern | Ask Ryan |
| Phase 3 | ZOE writes facts to bonfire (memory mirror) | Hook point identified, write protocol unknown | TBD |
| Phase 3.5 | Cross-bot KG (Magnetiq, AttaBotty, ZAOstockTeamBot pipe in) | Pattern proven by Phase 1; copy-paste | 2h each |
| Phase 4 | Multi-bonfire federation (per-brand) | Pending Bonfires platform support | Trigger on Ryan SDK drop |
| Phase 5 | Synthesis auto-publish (weekly team digest as a HyperBlog) | Free per 673b CONFIRMED primitive | 1h config |

## Healthy Patterns To Preserve

- Spool-before-POST (Phase 1) - never lose an event
- Best-effort hook (never throw to user reply)
- Env-gated kill switch (BONFIRE_ENABLED=false to disable)
- File:line-cited hook surfaces (673c) - no mystery edits
- Read-only Phase 2 (no write risk while we learn the API)

## Cross-References

- [Sub-doc 673a](673a-phase-1-trace/) - what Phase 1 actually does
- [Sub-doc 673b](673b-bonfires-automation/) - 8 Bonfires automation primitives audited
- [Sub-doc 673c](673c-zoe-architecture/) - 8 ZOE hook surfaces, top 3 P0
- [Sub-doc 673d](673d-zabal-bonfire-bot/) - the deployed agent + 3 protocols
- [Sub-doc 673e](673e-phase-2-spec/) - 265-LoC build spec
- [Doc 665](../665-bonfires-deep-dive-zao-integration/) - entry point
- [Doc 669](../669-bonfires-everything-we-know/) - canonical Bonfires hub
- [Doc 601](../601-agent-stack-cleanup-decision/) - canonical agent surfaces

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| DM Ryan: confirm `POST /v1/bonfires/{id}/kg/search` shape returns KGSearchResult per 673e spec | @Zaal | DM | This week |
| Smoke test Phase 1: `/add Bonfire smoke test` then check spool sent + node visible | @Zaal | Local test | Now |
| Confirm cron snapshot time for ZOE morning brief (06:00 UTC vs other) | @Zaal | Decision | Before Phase 2 build |
| After endpoint confirmed: ship Phase 2 in 3 PRs (client.ts/types.ts, tools.ts, brief.ts+concierge.ts wiring) | Next session | PR | 4-6h |
| Re-audit Doc 669 if Ryan ships the SDK before Phase 2 lands (swap REST for native call) | @Zaal | Doc edit | Trigger on Ryan |
| Mint Phase 5 synthesis HyperBlog config (weekly team digest) | @Zaal | Bonfires dashboard | After Phase 2 stable |
