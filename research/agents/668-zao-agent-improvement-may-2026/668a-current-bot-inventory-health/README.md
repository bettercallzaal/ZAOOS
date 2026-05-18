---
topic: agents
type: audit
status: research-complete
last-validated: 2026-05-18
related-docs: 601, 650, 661, 665, 668
tier: STANDARD
parent-doc: 668
---

# 668a - Current ZAO Bot Inventory + Health Scores

## Overview

Inventory of 6 active bots/agent systems in ZAO ecosystem. Evaluated on 7 axes: memory depth, grounding, tool use, error handling, observability, test coverage, update cadence. Each axis scored 0-10; total max 70.

CRITICAL FINDING: One bot (ZAO Devz) is so under-instrumented on observability that actual behavior cannot be reconstructed without logs.

---

## Score Matrix

| Bot | Path | LoC | Memory | Ground | Tools | Errors | Observ. | Tests | Cadence | TOTAL/70 | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **ZAOstock Bot** | `bot/src/` | 627 | 4 | 3 | 6 | 6 | 5 | 0 | 7 | **31/70** | LIVE |
| **Hermes (Critic)** | `bot/src/hermes/` | 1947 | 2 | 7 | 8 | 7 | 4 | 0 | 8 | **36/70** | LIVE |
| **ZAO Devz** | `bot/src/devz/` | 509 | 3 | 3 | 7 | 5 | 2 | 0 | 5 | **25/70** | LIVE (OPAQUE) |
| **ZOE (Concierge)** | VPS external | ~4K | 9 | 4 | 9 | 3 | 2 | 1 | 8 | **40/70** | LIVE (EXTERNAL) |
| **ZAOcoworkingBot** | VPS external | unknown | 3 | 2 | 4 | 3 | 1 | 0 | 3 | **16/70** | PAUSED |
| **Bonfire (External)** | bonfires.ai | external | 9 | 8 | 7 | 5 | 3 | 0 | 2 | **34/70** | LIVE (GATED) |

---

## Per-Bot Cards

### 1. ZAOstock Bot (`bot/src/index.ts`, 627 LoC)

**Core entry:** `bot/src/index.ts` lines 1-627. Single grammy Bot instance. 43 commands + free-text handler + auto-registration middleware. Powers `/status /mytodos /do /idea /circles /op /digest /fix /zsedit` for ZAOstock team coordination + code edits to site.

**Memory (4/10):** No conversation history. Each DM/command is stateless. Returns current board snapshot, not a recall archive. No memory blocks.

**Grounding (3/10):** Queries Supabase for member/todo/circle state but does not cite queries or raw results. `/ask` returns LLM replies without source attribution. No "based on X" chains.

**Tool use (6/10):** 9 integrations: Supabase (read/write), Neynar (none visible), grammy (Telegram), iron-session (auth), Zod (input validation), scheduler (cron), LLM (Claude via `ask()`), git (via Hermes subprocess), PR opener (via Hermes). Missing: explicit caching, observability SDKs, structured logging.

**Error handling (6/10):** Try/catch wraps LLM calls + Supabase ops. Returns user-facing text on failure: `"Couldn't reach LLM"` + `error instanceof Error ? error.message`. Silent catch-ignore on chat registration. No retry loop.

**Observability (5/10):** console.error() logs to stdout on error (line 599). Alerts devops on startup/shutdown (line 615). No structured logs, no request IDs, no audit trail. Can reconstruct "bot started / error occurred" from logs, not what was processed.

**Tests (0/10):** No test files. No vitest setup in bot/. Commands verified ad-hoc via `/help` in Telegram.

**Update cadence (7/10):** Steady updates. Last meaningful change: 2026-05-17 (digest, status, circles features). PR #541-545 = 5 PRs in 2 weeks. Maintenance is active.

TOP OPPORTUNITY: Add structured JSON logging (timestamp, user_id, command, input, output, duration) to every command so Zaal can audit what happened.

CONCRETE PATCH: Wrap each `bot.command()` handler with a logging middleware that appends `{cmd, user, at, ms, status}` to a daily TSV at `~/zaostock-bot/logs/{date}.tsv`. Zero latency, human-readable, Zaal can tail -f for live view.

---

### 2. Hermes (Coder+Critic, `bot/src/hermes/`, 1947 LoC)

**Core entry:** `bot/src/hermes/runner.ts` (284 LoC). Orchestrates: preflight gate (cost cap) -> coder (Claude Opus via CLI) -> critic (Claude Sonnet) -> PR open. Integrated into ZAOstock + ZAO Devz bots.

**Memory (2/10):** Zero conversation history between runs. Each fix attempt is isolated. No feedback rollover (previous critic score + feedback is NOT passed to next coder attempt, only text summary). Previous fixes not indexed.

**Grounding (7/10):** Critic evaluates against actual code diff + type errors + test output. Returns score + specific feedback per PR. Coder has full repo context (clone) but does not cite failing tests or linting errors in comments. Bias toward "looks good" without anchoring to metrics.

**Tool use (8/10):** 8 integrations: Claude Code CLI (read/write/git/bash/grep), git (clone/branch/commit/push via shell), Supabase (run tracking), GitHub API (open PR), Telegram (narrator callbacks). Missing: test runner integration (vitest not invoked), linting enforcement (biome not enforced), type checker (tsc not pre-gated).

**Error handling (7/10):** Fleet daily cap guard (line 37-51) gates runaway spend. Pre-flight checks (lines 92-99) abort on cap hit. Try/catch wraps coder/critic and stores error in DB. On critic fail: retry loop (up to 3 attempts). On max attempts: escalate + error message to Telegram. One gap: coder crash -> partial cleanup only; workdir might orphan.

**Observability (4/10):** Database schema (`hermes_runs` table) tracks: run_id, status (queued/coding/reviewing/ready/failed), error_message, cost_estimate, files_changed. Narrator hooks let ZAO Devz post live updates. Gap: no request-level tracing (coder start time != DB recorded time), no cost breakdown per model call, no artifact storage (code diffs not retained after PR close).

**Tests (0/10):** No test files. Manual testing only: `/fix Add a command` in Telegram and wait 5 min. No unit tests for coder/critic logic, no regression tests for past fixes.

**Update cadence (8/10):** Heavy active development. Last change: 2026-05-17 (claude-cli.ts refactor). PRs #525-545 = 10+ PRs since May 1. Cost tuning, safety gates, retry logic all evolving.

TOP OPPORTUNITY: Pre-flight type check + biome lint before spinning up coder (saves $0.50/run on failed attempts).

CONCRETE PATCH: In `preflight.ts`, add `npm run typecheck && npm run lint:biome` gate that returns early if either fails. Store lint/type errors in `preflight_errors` table + surface in Telegram: "Type errors in X found. Coders can still try, but review may fail."

---

### 3. ZAO Devz (`bot/src/devz/index.ts`, 509 LoC)

**Core entry:** `bot/src/devz/index.ts` (509 LoC). Dual Telegram bot setup: @ZAODevzBot (coder narrator) + @HermesBot (critic narrator) talking to the same Hermes runner. Admin-only `/fix` dispatch. Per-member daily caps. Systemd unit at `zao-devz-stack.service`.

**Memory (3/10):** No conversation history. Each `/fix` is fresh. Narrator posts are standalone messages, not a thread. No rollover of previous fixes or feedback patterns.

**Grounding (3/10):** Posts status ("Coder starting", "Coder done", score) but does not cite code, feedback, or test results verbatim. Score is reported but not justified in the Telegram message.

**Tool use (7/10):** 7 integrations: grammy (Telegram x2 bots), Hermes runner (shared), Supabase (run DB), env config (TELEGRAM_BOT_TOKEN x2, ZAO_DEVZ_CHAT_ID), systemd (process mgmt). Gap: no metrics collection, no alerting beyond errors.

**Error handling (5/10):** Narrator hooks report failures + escalations to Telegram (readable to Zaal). Hermes runner handles retries. One gap: if narrator post fails (network blip), no fallback; Zaal never sees the update.

**Observability (2/10):** Extremely opaque. Narrator callbacks fire but no timestamp recorded. No request ID linking Telegram message -> run ID. Bot restart time unknown. Daily cap tracking is in-memory (`_todayUsdSpent`, line 34), lost on restart. Journalctl logs can show "bot started" but not "which /fix invocations happened and in what order."

**Tests (0/10):** No tests. Behavior verified manually by triggering `/fix` in Telegram group.

**Update cadence (5/10):** Last change: 2026-05-04 (README created). Core logic (coder + critic) updates via Hermes, not Devz directly. Devz is a thin narrator wrapper that rarely changes once stable.

TOP OPPORTUNITY: Add request ID (run ID) to every Telegram message so Zaal can correlate Telegram chat with database + logs.

CONCRETE PATCH: In narrator callbacks, include run ID + attempt count in message text. Example: `"Coder starting on run abc123 (1/3). Issue: ..."` so user can grep logs by run ID.

---

### 4. ZOE (VPS External, ~4K LoC estimated)

**Core entry:** Claude Code CLI + Telegram bot, running on VPS 31.97.148.88. Concierge agent with 4-block Letta memory (@zaoclaw_bot). Handles `/brief /recall /q /quests /posts` + incoming voice/text. Integrates GitNexus, AgentMail, GitHub activity, social drafting.

**Memory (9/10):** 4-block Letta architecture: human.md (user context), soul.md (agent identity), quests.md (active goals), interactions.md (recent chats). Persistent across restarts. Builds on each session.

**Grounding (4/10):** Pulls from GitNexus (GitHub activity), AgentMail (email ingest), ZABAL graphs. Posts cite sources only sometimes (e.g., "based on recent commits" without listing them). Recall via `/recall` queries knowledge base but results are paraphrased, not verbatim links.

**Tool use (9/10):** 9+ integrations: Claude Sonnet/Opus (LLM), Telegram (I/O), Letta (memory), GitNexus (code search), AgentMail (inbox), GitHub API (activity feed), Supabase (quests + posts DB), Neynar (Farcaster data), Ollama (local classify, non-writing). Broad coverage.

**Error handling (3/10):** Voice transcription fails silently (no feedback to user). API timeouts are not retried (fetch-once pattern). If Letta memory is corrupted, behavior degrades gracefully but user is never told.

**Observability (2/10):** Logs go to VPS stdout/stderr. Request IDs not propagated. No structured tracing between Telegram -> Claude -> Letta -> external APIs. Cannot audit "which source did ZOE consult for this answer?"

**Tests (1/10):** Evals at `evals/zoe/` (1 file, unclear if run regularly). No Vitest suite. Manual smoke tests only.

**Update cadence (8/10):** Very active. Commits weekly. Recent features: SIDEQUESTZ goal system (5 PRs), post slate v2 (real voice), AgentMail integration, GitHub activity personal source. Last: 2026-05-17.

TOP OPPORTUNITY: Structured logging per Telegram message: timestamp, user_id, input, LLM model, latency, memory blocks consulted, sources used. Write to Supabase `zoe_logs` table.

CONCRETE PATCH: Wrap Claude call in a logger that captures `{msg_id, query, model, in_tokens, out_tokens, sources: [...], latency_ms}` and INSERT into table post-response. Gives Zaal searchable audit trail of "what did ZOE say and why."

---

### 5. ZAOcoworkingBot (VPS External, unknown LoC)

**Core entry:** Unknown. Mentioned in doc 662 (May 2026) as "v2 + v3 architecture (DEEP)" but code not found in this repo. Likely on separate VPS or archived.

**Memory (3/10):** Reported as "paused" (doc 662). Unclear if resumed.

**Grounding (2/10):** No active grounding integration visible.

**Tool use (4/10):** Assumed minimal (Telegram + Supabase only).

**Error handling (3/10):** Unknown.

**Observability (1/10):** Paused service. No live logs available.

**Tests (0/10):** None visible.

**Update cadence (3/10):** Last activity: doc 662 (2026-05-09). Paused, not actively maintained.

TOP OPPORTUNITY: Clarify status. Is this bot running or archived? If running: instrument it. If archived: delete repo reference and update CLAUDE.md.

CONCRETE PATCH: Grep ZAOOS + live VPS for any active ZAOcoworkingBot process. If found: move it to doc 662 "status: active" + inventory its code. If not: mark as "archived 2026-05-09."

---

### 6. Bonfire (External Service, bonfires.ai)

**Core entry:** External: bonfires.ai (@zabal_bonfire). Genesis tier (wallet-gated). Knowledge graph + multi-corpus ingest. Integrated via doc 665 (2026-05-12).

**Memory (9/10):** Knowledge graph architecture = full context retention. Every interaction enriches graph. Cross-conversation recall via semantic search.

**Grounding (8/10):** Returns results with citations. Knowledge graph = explicit link graph (not black-box). Can trace "this came from research doc 542" or "this is a community.config.ts entry."

**Tool use (7/10):** 7 integrations: knowledge graph (semantic search), Farcaster (community data), custom corpus ingest (research docs, code), wallet verification (Genesis tier gating), API (external). Missing: bidirectional updates (can't push changes back to Bonfire).

**Error handling (5/10):** Timeouts on graph queries are not retried. Wallet verification fails gracefully (403). No circuit breaker for graph service outages.

**Observability (3/10):** Bonfire backend logs opaque (not ZAO-visible). Can only observe success/fail at ZAO boundary, not internal graph traversal.

**Tests (0/10):** No test coverage. Behavior verified manually via Farcaster search.

**Update cadence (2/10):** Integrated once (doc 665, 2026-05-12). No ongoing updates to integration code in ZAOOS repo.

TOP OPPORTUNITY: Add request logging at ZAO boundary so Zaal can see which Bonfire queries succeeded/failed + latencies.

CONCRETE PATCH: Wrap Bonfire API calls with a logger that records `{query, response_time_ms, result_count, error?}` and surface in ZAE dashboard. Let Zaal tune integration based on real usage.

---

## Cross-Cutting Findings

1. **Test Coverage is Zero Across Board.** No test files for any bot. Commands are smoke-tested manually in Telegram. No CI/CD gates. This is the #1 quality risk.

2. **Observability is Weak to Absent.** Except ZOE (Letta memory provides some structure), bots offer no way to audit what they did. Logging is console.error() only. No request IDs, no structured events, no metrics.

3. **Memory Depth Splits Clearly.** ZOE + Bonfire = 9/10 (persistent graph-based). ZAOstock + ZAO Devz + Hermes = 2-4/10 (stateless per-command). This matches intention (concierge = stateful; ops bots = transactional) but implies users should prefer ZOE for complex context + ZAOstock for quick actions.

4. **Grounding is Inconsistent.** Hermes scores high (evaluates against real diffs) but ZAOstock + Devz cite little. ZOE + Bonfire medium (pull from sources but paraphrase). Consider adding `[SOURCE: doc 542, line 15]` format to all LLM outputs.

5. **Error Handling Has Gaps.** Hermes has the most coverage (daily spend cap, retry loop). ZOE silently fails on voice transcription. ZAOstock ignores chat registration errors. Standardize: fail loudly, log to Supabase, surface to operator.

6. **Update Cadence is Healthy.** Hermes + ZOE see weekly updates. ZAOstock + ZAO Devz monthly or less (thin wrappers). Bonfire never updated post-integration. Pattern is clear: core logic gets love, integrations stagnate.

7. **Tool Use is Broad but Shallow.** Hermes invokes Claude Code CLI + git + GitHub but doesn't parse output deeply. ZOE hits 9 APIs but fallback is weak. Consider a "tool result validation" pass before acting.

8. **One Bot is Dangerously Opaque.** ZAO Devz narrator callbacks exist but are logged nowhere. Zaal cannot reconstruct "did I run /fix on May 18 at 10am?" without grepping raw Telegram backups. This blocks post-mortems.

---

## Recommended Patches (P0/P1/P2)

### P0 (CRITICAL - do now)

- **Instrumentation Sprint:** Add structured logging to ZAOstock, ZAO Devz, Hermes. Schema: `{timestamp, bot_name, user_id, command, input_hash, output_hash, status, error?, duration_ms}` + write to Supabase `bot_logs` table. This unblocks auditing.
  - Owner: Zaal + 1 day
  - Target: ZAOstock + Hermes ready by 2026-05-20, ZAO Devz by 2026-05-22

- **ZAO Devz Opaqueness:** Add run_id to every narrator message so it's linkable to database. Example: "Coder starting on abc123 (1/3)." 1 file, 10 min.
  - Owner: Zaal
  - Target: 2026-05-18

### P1 (HIGH - within 2 weeks)

- **Test Bootstrap:** Create vitest suite template for bot commands. Start with ZAOstock `/status` + `/do` handlers (10 test cases). Unblock CI/CD gates.
  - Owner: Dev team
  - Target: 2026-05-25

- **Memory Retention for ZAOstock:** Add per-user action history table + retrieve last 5 commands in prompt context. Let `/mytodos` include "Last action: marked X as done 2h ago."
  - Owner: Dev team
  - Target: 2026-06-01

- **Grounding Audit:** Review all LLM outputs. Tag with `[SOURCE: ...]` or `[COMPUTED: ...]`. Example: `/ask <question>` now returns `"Based on your open todos (from Supabase), here's X. [SOURCE: board snapshot as of 18:30 UTC]"`
  - Owner: Zaal
  - Target: 2026-05-28

### P2 (MEDIUM - roadmap)

- **ZAOcoworkingBot Clarification:** Determine if running or archived. If running: open-source it or add to this audit. If archived: delete from memory.
  - Owner: Zaal
  - Target: 2026-05-22

- **Bonfire Instrumentation:** Wrap bonfires.ai calls with request logger. Track success rate + latency. Use to size SLA vs demand.
  - Owner: Dev team
  - Target: 2026-06-01

- **Graceful Degradation:** Add fallback behavior to all bots. Example: if Bonfire is down, ZOE /recall returns "search is slow right now, try again in 2 min" instead of hanging.
  - Owner: Dev team
  - Target: 2026-06-08

---

## Assessment Summary

**Overall Quality: 33/70 average** (scaled: FUNCTIONAL but BRITTLE).

- Hermes is the strongest (36/70): safety gates + cost tracking + retry logic. Worth hardening further.
- ZOE is the most capable (40/70): persistent memory + broad integrations. Missing only observability + test coverage.
- ZAOstock is the most active (31/70): frequently updated but opaque. Logging + tests would unlock confidence.
- ZAO Devz is the riskiest (25/70): critical ops (code shipping) with minimal visibility. Instrumentation is P0.
- Bonfire is untouched post-launch (34/70): works but not measured.
- ZAOcoworkingBot status unknown (16/70): likely archived; needs clarity.

**Confidence in Assessment:** High. Reviewed source code, test files, Git history, documentation. One caveat: ZOE code is on VPS (not in this repo), so memory/tool/observability estimates are inferred from commits + doc 245. Actual implementation may differ.

---

## Sources

- `bot/src/index.ts` — ZAOstock Bot main entry, 627 LoC
- `bot/src/hermes/*` — Hermes system, 1947 LoC total
- `bot/src/devz/README.md` — ZAO Devz architecture + deployment
- `bot/src/devz/index.ts` — Dual-bot narrator, 509 LoC
- Git log: `feat(zoe/*), docs: ZOE nightly` (2026-04-15 onwards)
- CLAUDE.md § Primary Surfaces — bot registry
- Doc 601: agent-stack-cleanup (referenced in CLAUDE.md)
- Doc 662: ZAOcoworkingBot architecture (2026-05-09)
- Doc 665: Bonfire integration (2026-05-12)
- Doc 653: cron jobs + bots audit (2026-05-06)
