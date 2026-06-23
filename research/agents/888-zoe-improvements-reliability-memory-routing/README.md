---
topic: agents
type: guide
status: research-complete
last-validated: 2026-06-23
superseded-by:
related-docs: 435, 465, 601, 547, 673, 759, 770, 773
original-query: "how we can improve ZOE - the @zaoclaw_bot concierge/dispatcher (Telegram, claude-max OAuth, 4-block memory, Hermes-brain pattern). Focus on practical, high-leverage upgrades: reliability (the auth-expiry blind spot that just bit us, monitoring/alerting), memory/recall quality, model routing/cost, capabilities, and UX. Ground every idea in the actual bot/src/zoe code and existing research docs."
tier: DEEP
---

# 888 — ZOE Improvements: Reliability, Memory, Model Routing, UX

> **Goal:** Concrete, code-grounded upgrades for ZOE (@zaoclaw_bot), led by the reliability/alerting gap that just caused a silent multi-day outage.

## Key Decisions (do these, in order)

| # | Decision | Why | Effort |
|---|----------|-----|--------|
| 1 | **Add a pre-flight `claude` auth check + alert** before the daily scheduled turns and on any `exit 1` containing "401/Invalid authentication" | The Max-plan OAuth token expired and ZOE failed silently ~12x/day for >1 day with zero alert (2026-06-23 incident). This is the single highest-leverage fix. | S |
| 2 | **External dead-man's-switch heartbeat** (healthchecks.io or self-hosted Uptime Kuma) pinged by each bot every run; alert on miss | Process-liveness (doc 465 watchdog) does NOT catch "process up but model auth dead". A heartbeat that only fires on a *successful* model path does. | S |
| 3 | **Classify model errors** (401-auth / 429-rate / timeout / bad-JSON) at `claude-cli.ts` and route: auth->alert+halt, 429->backoff-retry, timeout->1 retry | Today every failure is an identical generic `exit 1`; user sees "model call failed" with no signal and no retry. | M |
| 4 | **Telegram alert to Zaal on auth/infra failure**, deduped | Errors log to `console.error` only; nothing reaches Zaal. Reuse the existing `reportEvent()` path (`bot/src/index.ts`). | S |
| 5 | **Pull long-term memory into a turn** (call `readArchive()` + Bonfire recall proactively), not just the 8-turn ring | `readArchive()` exists (`memory.ts:464-489`) but is never called during a turn; ZOE forgets anything past 8 messages unless Bonfire keyword-matches. | M |
| 6 | **Fix the model-routing heuristic** - it sends any message containing "should" to Opus | `selectModel()` (`types.ts:140-162`) keyword match over-escalates cost on factual questions; add length+intent scoring or a cheap classifier pre-pass. | M |
| 7 | **Surface op results inline** ("opened TH-123, created task TK-45") | Today the user must run `/tasks` to see what a turn changed. | S |

## The live incident (why #1-4 lead)

On 2026-06-23 the `claude` CLI Max-plan OAuth token expired on the fleet box (`zaal@31.97.148.88`). Effect, observed:

- ZOE (`zoe-bot`): **12 model errors in 24h**, each surfaced to the user as a generic `(concierge error - ...)`; no alert to Zaal.
- @ZAOcoworkingBot (`cowork-agent`): every reply returned `the model call failed - try again in a moment` (`[claude-max/haiku] exit 1: ... 401 Invalid authentication credentials`).
- Both bots stayed `active` in systemd the whole time - **process liveness was green while the brain was dead.** A respawn-based watchdog (doc 465) would never have fired.
- Detection was accidental (manual Telegram test during an unrelated VPS migration). MTTR would have been days.

Root cause: ZOE/cowork both use the **claude-max provider** = spawn the local `claude` CLI (`bot/src/hermes/claude-cli.ts:38-202`), which relies on `~/.claude` OAuth. No code path validates that credential. Fix = decisions 1-4.

## Findings by area (current state -> gap -> fix)

### 1. Reliability
- **Model call:** `claude-cli.ts:86` spawns `claude`; non-zero exit rejects with first 400 chars of stderr (`:116-134`), **no retry**, **no error classification**. Auth-expiry looks identical to a tool-permission error.
- **Budget:** `call-budget.ts:62-81` caps 50 calls/day in-process; cap breach is `console.error` only - **does not escalate** via `reportEvent()`.
- **Bot-level catch:** `index.ts:194-199` logs + `reportEvent('error', ...)` to the cowork board, but with **no auth-vs-transient distinction** and no Zaal-facing alert.
- **Gap:** no pre-flight auth check, no heartbeat that proves the *model path* works, no retry/backoff, no alert routing.
- **Fix:** decisions 1-4. Concretely: a 60s systemd timer runs `claude -p ok </dev/null`; on success ping a healthchecks.io URL, on 401 send a deduped Telegram alert. (The `fleet-heartbeat` timer already built for the bots board, doc on VPS consolidation, is the natural host for this check.)

### 2. Memory / recall
- **4 blocks:** persona/human/working(8-turn ring)/tasks built in `memory.ts:528-560`; recall via Bonfire `/delve` (`recall.ts:125-220`, keyword graph search, not local vectors).
- **Gap:** `readArchive()` (`memory.ts:464-489`) is **dead code at turn time** - long-term memory is never injected; 8-turn ring drops same-chat context in ~30 min; no auto-extraction of learned facts back into `human.md`.
- **Fix:** decision 5 - inject top archive hits + Bonfire recall every turn; raise ring to ~16; add a nightly Haiku pass that promotes durable facts from captures into `human.md`.

### 3. Model routing / cost
- `selectModel()` (`types.ts:140-162`): strategic keywords OR >280 chars -> Opus; quick keywords AND <80 chars -> Haiku; else Sonnet. Workers fixed per role (`workers.ts:124-220`); only Hermes escalates on critic rejection (`dispatch.ts:31-52`).
- **Gap:** "how should I..." factual questions hit Opus; arbitrary length cutoffs; no cost feedback loop; workers don't escalate Haiku->Sonnet on failure; no budget-aware downgrade.
- **Fix:** decision 6 - a one-shot Haiku "route this" classifier beats keyword matching; add worker retry-escalation mirroring Hermes; downgrade to Haiku when near the daily cap.

### 4. Capabilities
- Commands + ops are broad (`index.ts:243-341`; task/quest/capture/crm/thread ops in `types.ts:120-195`). Tools are read-only + Playwright + dispatch (`concierge.ts:102-130`).
- **Gap:** no streaming (full CLI wait); code-fix only via Hermes; low-risk ops still gate on y/n.
- **Fix (lower priority):** auto-execute clearly-safe ops (task add, capture) without the gate; keep gates for external side-effects (posts, CRM, PRs).

### 5. UX
- Chunking + typing indicator + 6s/28s narration (`index.ts:114-150, 709-749`). Errors are generic `(concierge error - ...)` (`:928-935`).
- **Gap:** identical error text for auth vs bad-JSON; no recovery hint; no inline "what changed" summary; no group typing indicator.
- **Fix:** decision 3+7 - map error class to a human message ("ZOE's Claude login expired - Zaal's been pinged"), and append a one-line op summary.

## Already covered - do NOT duplicate

| Doc | Already decided/shipped |
|-----|------------------------|
| 435 | Morning brief / evening reflection / `/summarize` (shipped) |
| 465 | `events.jsonl` unified log, daily digest, respawn watchdog (planned) |
| 601 | Agent-stack cleanup: kill OpenClaw, Hermes-brain runtime (phases 1-2 started) |
| 547 | Per-bot `.env`, ZOE reads Bonfire only, graph cache (planned) |
| 673 | ZAOcoworkingBot -> Bonfire ingest (shipped v0.3.0) |
| 759/770/773 | Orchestrator readiness + 5 HIGH bug fixes, per-plan budgets (implemented) |

This doc's net-new scope = the **monitoring/alerting/failover layer** (decisions 1-4) that ties those together so ZOE never fails silently again, plus the memory/routing/UX fixes (5-7).

## Also See
- [Doc 465](../465-zoe-observability-dispatch-hardening/) - watchdog + events.jsonl (process liveness; this doc adds *model-path* liveness)
- [Doc 759](../759-zoe-orchestrator-gap-analysis/) - orchestrator gaps
- [Doc 773](../773-zoe-orchestrator-high-fixes/) - safety/cost fixes
- VPS consolidation note (memory `project_vps_consolidation`) - the `fleet-heartbeat` timer that should host the auth check

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add `claude -p` auth pre-flight check to the existing fleet-heartbeat timer + healthchecks.io ping | @Zaal | PR | This week |
| Deduped Telegram alert to Zaal on 401/auth failure via `reportEvent()` | @Zaal | PR | This week |
| Classify model errors in `claude-cli.ts` (auth/429/timeout/json) + retry on transient | @Zaal | PR | Next sprint |
| Inject `readArchive()` + Bonfire recall into every concierge turn; raise ring to 16 | @Zaal | PR | Next sprint |
| Replace `selectModel()` keyword heuristic with a Haiku route-classifier | @Zaal | PR | Backlog |
| Append inline op summary to replies ("opened TH-x, task TK-y") | @Zaal | PR | Backlog |

## Sources

- [FULL] `bot/src/hermes/claude-cli.ts:38-202` - model spawn + error handling (no retry, no error classification)
- [FULL] `bot/src/zoe/concierge.ts:90-214` - turn wrapper, 4 memory blocks, ops parsing
- [FULL] `bot/src/zoe/memory.ts:345-560` (blocks), `:464-489` (`readArchive`, unused at turn time)
- [FULL] `bot/src/zoe/recall.ts:125-220` - Bonfire `/delve` keyword recall
- [FULL] `bot/src/zoe/types.ts:120-195` (ops), `:140-162` (`selectModel` heuristic)
- [FULL] `bot/src/zoe/call-budget.ts:62-81` - 50/day cap, console-only
- [FULL] `bot/src/zoe/index.ts:114-150` (chunking), `:194-199` (bot.catch), `:709-749` (narration), `:928-935` (generic error)
- [FULL] Live incident 2026-06-23: `journalctl --user -u zoe-bot/cowork-agent` - 12 ZOE model errors/24h, `[claude-max/haiku] exit 1: 401 Invalid authentication credentials`, both units `active` throughout
- [FULL] Docs 435/465/601/547/673/759/770/773 (prior ZOE research, read for non-duplication)
- [FULL] healthchecks.io - dead-man's-switch / cron-monitoring pattern (external reference for decision 2): https://healthchecks.io/
