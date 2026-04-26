---
topic: agents
type: decision
status: research-complete
last-validated: 2026-04-25
related-docs: 90, 200, 256, 461, 467, 473, 484, 491, 506, 507, 508, 523, 524
tier: DISPATCH
---

# 527 - Multi-Bot Telegram Coordination - The Best-Practice Playbook for ZAO

> **Goal:** Stop the multi-bot collisions that broke `/fix` (ZOE replied "Unknown skill: fix" intercepting another bot's command), spec the supervisor + specialist + topic-lane architecture, and give Zaal a single ordered route from "fix today" -> "ship the full fleet."

Built from 16-agent dispatch (Apr 25 2026): Telegram patterns, Reddit voice + ops + coordination, X production stories, supervisor patterns, codebase audit, Anthropic official docs, security threat model, observability stack, YouTube/podcast UX, HackerNews skeptic discourse, cost calibration, anti-pattern catalog.

## Key Decisions (P0 fixes)

| Decision | Verdict | Why |
|----------|---------|-----|
| **Re-enable privacy mode on @ZAODevZBot + @HermesZAOdevzbot** (we incorrectly disabled it earlier) | **YES, today** | Privacy mode = ENABLED makes a bot only see commands directed at it (`/cmd@BotName`) + replies + @mentions. Disabled = bot sees ALL messages. Bots don't need to read other bots' messages - the dual-bot uses `bot.api.sendMessage` direct, not by reading. Re-enable via @BotFather: `/setprivacy` -> Enable. Then kick + re-add bots to ZAO Devz group. |
| **Fix ZOE's "Unknown skill: fix" interceptor** | **YES, today** | ZOE on VPS at `~/bin/bot.mjs` line 710 calls `handleTodoCommand()` for every slash command. Returns null for unknown -> falls through to Claude which says "Unknown skill: X". Fix: explicit allowlist of ZOE's commands (todo/done/list/p0/p1/note/recap/summarize/focus/tip/help). Anything else -> return early, don't call Claude. |
| **Adopt supervisor + specialist with topic lanes** (per Anthropic + LangGraph + Cursor consensus) | **YES, this week** | ZOE = supervisor (mention-only). Specialists = privacy-mode-on, only respond to direct `/cmd@BotName`. Add 4 forum topics: General / Coder / Critic / Festival Ops. Each specialist posts to its own topic. Eliminates collision class entirely. |
| **Drop bot-name suffix collision** | **YES, today** | grammy's `bot.command('fix')` matches `/fix@OtherBot` too. Add middleware: if message contains `@BotName` and BotName != ours, drop. Doc 523 codebase audit found this in `bot/src/devz/index.ts:187`. |
| **Adopt Claude Code CLI Max-plan auth (already shipped PR #310)** | **YES, validated** | Anthropic Managed Agents pattern: orchestrator + subagents with isolated context. Max plan flat $200/mo absorbs marginal cost. Cost calibration confirms ZAO budget caps ($5 Coder, $1 Critic) are 5-10x safe margin. |
| **Adopt Phoenix self-hosted on VPS for observability** | **YES, next sprint** | $0 incremental, OpenTelemetry-native, multi-agent span hierarchy. Beats Langfuse (5+ services to self-host) + Helicone (deprecated, acquired by Mintlify Mar 2026). Phoenix container + Postgres = ~150MB RAM on VPS. |
| **Add per-task budget caps + circuit breakers** | **YES, this sprint** | Veltrix data: cost cut from $4.42/day -> $1.46/day (67% reduction) just by adding per-task budgets + loop detection. Mr.Chief: 81% cost cut from model routing. ZAO ships Hermes Coder Opus + Critic Sonnet today; needs $5/$1 hard caps + auto-pause at fleet ceiling $20/day. |
| **Add deterministic gates + machine-verifiable completion (Ralph Loop pattern)** | **YES, sprint 2** | HN consensus: 95% of multi-agent projects fail because scaffolding is missing, not because models aren't smart. Hermes already has Critic gate (score >=70). Add: lint/typecheck/test pass before Critic even sees diff. |
| **Block Coder writes to bot/src/hermes/, .env*, .git/hooks/, package.json, .husky/** | **YES, today (extend HERMES_FORBIDDEN_PATHS)** | Doc 506 + supply-chain research: npm postinstall is the #1 vector. Self-modification + secret writes are #2 + #3. Already partly in code; extend list. |
| **Add npm install allowlist + ignore-scripts=true** | **YES, this sprint** | Shai-Hulud worm Oct-Nov 2025 hit 25K+ repos via postinstall. Axios compromise Mar 2026 (100M weekly downloads). Coder must run `npm ci`, never `npm install <new-pkg>`. Set `.npmrc: ignore-scripts=true`. |
| **Stop adding bots until first /fix end-to-end works** | **YES, hard rule** | dgeorgiev.biz post-mortem: shipped 16 agents, threw most away, kept 2. Mr.Chief: 31 -> stable after model-routing. Riley Brown: "narrow specialists with 7-10 skills > one mega-agent with 50". Validate Hermes pair end-to-end FIRST, then fan out. |

## Three Bugs Blocking First /fix

From codebase audit + Telegram screenshot:

| # | Bug | File / source | Fix |
|---|-----|----------------|-----|
| 1 | ZOE intercepts every `/<word>` -> falls through to Claude -> "Unknown skill" | VPS `~/bin/bot.mjs:710` `handleTodoCommand()` returns null then ZOE calls Claude on raw text | Add explicit allowlist; if command not in `[todo,done,list,p0,p1,note,recap,summarize,focus,tip,help]` AND has `@AnotherBot` suffix, return immediately |
| 2 | grammy `bot.command('fix')` matches `/fix@OtherBot` too | `bot/src/devz/index.ts:187` regex `replace(/^\/fix(@\w+)?\s*/, '')` strips ANY `@mention` | Add filter middleware: extract `@suffix`, if suffix exists and != `me.username`, return without firing handlers |
| 3 | Privacy mode disabled on @ZAODevZBot + @HermesZAOdevzbot (my earlier wrong call) | BotFather setting | `/setprivacy` -> Enable for both, then kick + re-add to group |

## Multi-Bot Architecture Decision

**Pattern:** Supervisor (ZOE) + privacy-mode specialists + forum topic lanes.

```
ZAO Devz (forum supergroup -1003953353016)
  |
  +-- General topic     -> announcements, /help, /whoami
  +-- Coder topic       -> /fix dispatched here, ZAODevZBot posts work
  +-- Critic topic      -> HermesZAOdevzbot posts grades + PR links
  +-- Festival Ops      -> /status /do /idea (ZAOstockTeamBot, optional)

Routing rules:
  ZOE              -> mention-only (group), DM-always (private). Privacy OFF but middleware-gated.
  ZAODevZBot       -> privacy ON. Only fires on /cmd@ZAODevZBot. Posts to Coder topic.
  HermesZAOdevzbot -> privacy ON. Posts to Critic topic. Observer in General.
  ZAOstockTeamBot  -> privacy ON. Stays in its own group; remove from ZAO Devz.
```

**Why supervisor not mesh:** Cursor + Anthropic + Bayezian all converged on orchestrator-worker after trying mesh. Mesh = N(N-1)/2 connections = combinatorial chaos at scale (HN thread 47761625). Supervisor = O(N), debuggable, accountable.

**Why topic lanes not channel-per-bot:** Single chat keeps Zaal's mental model unified. Topics give each agent its own thread without spawning 4 separate Telegram groups (per Riley Brown 111K-view demo + OpenClaw multi-agent kit).

## Cost Calibration

Per-task notional caps (Max plan absorbs marginal; numbers are "would-have-cost" if metered):

| Component | Per-call avg | Cap | Daily budget | Source |
|-----------|--------------|-----|--------------|--------|
| Hermes Coder (Opus 4.7) | $0.05-$0.50 | $5.00 | 10 calls/day = $5 | RelayPlane $0.019-$0.53/task; Inventiple multi-agent $0.31/run |
| Hermes Critic (Sonnet 4.6) | $0.01-$0.10 | $1.00 | 10 calls/day = $1 | Sonnet 60% of Opus cost (Infralovers); review pass = small context |
| ZOE TIPs (Haiku triage + Sonnet response) | $0.20-$0.40 | n/a per-call | $10/day fleet cap | Vince Venditti $7.33/day for 7 agents; Mr.Chief 81% cut via routing |
| **Fleet total** | | | **$18/day notional** | Max plan flat $200/mo = 11x safe headroom |

Rate-limit projection: Max plan ~500 requests/month at standard complexity. ZAO at 10 /fix/day = 300-900 req/month. Stays in plan unless > 15 /fix/day for 2 weeks straight; then evaluate direct API.

**Cost guardrails to ship:**
- Per-task cap enforced via Claude CLI `--max-budget-usd` flag (already in coder.ts/critic.ts)
- Fleet daily ceiling: auto-pause new /fix runs at $20/day notional
- Prompt cache mandatory: explicit `cache_control: ephemeral` on system prompts (Mar 2026 TTL changed 1hr -> 5min, costs 3-5x without)
- Loop detection: if same trace ID has > 10 agent invocations in 2 min, hard-stop + alert

## Security Hardening (Threat-Model-Driven)

10 P0/P1/P2 defenses from security agent. Already shipped or pending in `bot/src/hermes/`:

| # | Defense | Status |
|---|---------|--------|
| P0 1 | LLM tagging on Critic input ([EXTERNAL_SOURCE]/[INTERNAL_REASONING]) | NOT SHIPPED - add to critic.ts system prompt |
| P0 2 | File write allowlist (block .env, .git/hooks, package.json, CLAUDE.md) | PARTIAL - HERMES_FORBIDDEN_PATHS exists, extend |
| P0 3 | PR output sanitization (regex-strip secrets before gh pr create) | NOT SHIPPED - add to pr.ts |
| P0 4 | Telegram accountId binding (each bot's chat scope explicit) | SHIPPED - devz/index.ts checks `ctx.chat?.id !== devzChatId` |
| P1 5 | npm package allowlist + ignore-scripts=true | NOT SHIPPED - add to .npmrc + Coder system prompt |
| P1 6 | Message tool scoping (bot can only post to its bound chat) | SHIPPED via narrator pattern |
| P1 7 | Session keys + spending limits (EIP-7702 for trading agents) | OUT OF SCOPE for Hermes; relevant for VAULT/BANKER/DEALER |
| P1 8 | Token budget monitoring (daily cap + alerts) | NOT SHIPPED - add Redis tracker |
| P2 9 | Credential output redaction hook (PostToolUse) | NOT SHIPPED - add to .claude/settings.json |
| P2 10 | Bot identity headers in every message | PARTIAL via narrator prefix |

## Observability Stack

Recommended: **OpenTelemetry Collector + Arize Phoenix self-hosted on VPS 1**. Cost: $0 incremental.

3 files to create:
- `scripts/observability/docker-compose.yml` - OTel Collector + Phoenix containers
- `bot/src/observability/otel-setup.ts` - SDK init + grammy.js middleware emitting spans per message
- `bot/src/observability/span-emitters.ts` - helpers for `gen_ai.invoke_agent`, `gen_ai.execute_tool`, `telegram.message_received`

Trace propagation: Coder hands to Critic via `OTEL_TRACE_ID` + `OTEL_PARENT_SPAN_ID` env vars to Claude CLI subprocess. Single trace tree for entire /fix loop.

Per-agent panels: tokens in/out, cost, p50/p95 latency, success rate, retry count, escalation rate. Plus Telegram-specific: messages-per-bot, command-failure rate, mention-without-reply count.

Alerts: bot down >5min, /fix run stuck >15min, multi-agent loop (>10 invocations / 2min), secret leakage (regex in output), cost spike >$20/day.

## Anthropic Official-Doc Alignment

What ZAO already does correctly (per official Claude Agent SDK + Managed Agents docs):
- Multi-agent supervisor pattern (ZOE + 3 specialists) ✓
- Decoupled execution (each bot is its own process) ✓
- Tool restrictions per agent (Coder gets Edit/Write, Critic gets Read-only) ✓
- Parallel execution (workers don't block ZOE) ✓
- Transparency (Supabase event log + Telegram chat = audit trail) ✓

Gaps to close:
- Add explicit stop criteria (denial counter + machine-verifiable completion)
- Document tool ACI per bot in `bot/src/hermes/TOOLS.md`
- Implement context object (`getEvents()` API) for run replay
- Per-bot cost tracking in `agent_executions` Supabase table
- Formalize handoff protocol (Coder -> Critic -> back) with Zod schema

## Persona Spec for 4 Bots (from voice agent)

| Bot | Voice | Sample message |
|-----|-------|----------------|
| **ZOE** (orchestrator) | Direct, options-first, no "I think". Uses "Data shows" / "Trade-off is". | "Three paths to fix the bug: (1) revert + retry on different branch, (2) cherry-pick the safe parts, (3) escalate to Zaal. (1) safest, ships soonest. Your call." |
| **ZAODevZBot** (Coder) | Sardonic builder. Status-first. Lead with what broke + what's next. No sugar. | "Coder starting (1/3) on run abc12345. Issue: Add /healthcheck. Reading bot/src/index.ts now." |
| **HermesZAOdevzbot** (Critic) | Skeptical peer reviewer. Finds the flaw first. Risk tags BLOCKING / ADVISORY / NITPICK. | "Score 55/100 (NEEDS REVISION). Issues: (1) missing Zod validation on input, (2) no test for edge case. Loop back." |
| **ZAOstockTeamBot** (Festival ops) | Coordinator with checklist focus. Status tags [PENDING] [DONE] [RED FLAG]. No emoji. | "[SPONSORSHIP STATUS] Tier 1: 2/3 committed. RED FLAG: Sound design unowned. Who claims it?" |

System prompts kept in `~/.openclaw/` SOUL.md + bot-side appendSystemPrompt for Hermes Coder + Critic. Constraint reinforcement injected every 30 turns to prevent persona drift (per Mindra + David Mieloch research).

## Anti-Pattern Blacklist (Never Ship)

From graveyard agent + 10 production post-mortems:

1. Polite-looping agents (Kahlotar: $4K in 40 min)
2. Runaway token loops (FinOps: $47K in 11 days)
3. Context window cliff - agents forget early instructions silently
4. Cascade failures - bad output poisons downstream agents
5. Nondeterministic LLM-classifier routing - same input, different paths
6. No max iteration cap - agents loop forever
7. Shared mutable context - state corruption, race conditions
8. RAG over-reliance - fragile retrieval drowning the prompt
9. Personality over-engineering - character breaks under load
10. Untested escalation queue - "needs human" sits forever

ZAO must NEVER ship: bots without inter-message Zod schemas, open-ended retries, shared mutable state, LLM-only routing (use rules first), cost attribution without per-bot caps, escalation queues without named owners, systems without circuit breakers, state in conversation history.

## Suggested Route - Concrete Order of Operations

### Today (next 2-3 hours)

1. **Re-enable privacy mode** on @ZAODevZBot + @HermesZAOdevzbot via @BotFather `/setprivacy` -> Enable. Kick + re-add to group.
2. **SSH VPS, fix ZOE's `handleTodoCommand`** to allowlist known commands + return early on unknown. ~10 lines edit.
3. **Add grammy bot-name filter middleware** to bot/src/devz/index.ts: drop messages where `@suffix` exists and != our username.
4. **Extend HERMES_FORBIDDEN_PATHS** in bot/src/hermes/types.ts to include `.git/hooks/`, `.husky/`, `package-lock.json`, `tsconfig.json`, `CLAUDE.md`.
5. **Test /fix end-to-end** with the simple healthcheck task. Confirm Coder + Critic narration sequence in chat with no ZOE interceptor noise.

### This week

6. **Add per-task budget caps** to runner.ts - kill Hermes run if Coder exceeds $5 or Critic exceeds $1 cumulative.
7. **Add fleet daily ceiling** - in-memory counter of fleet $/day; auto-refuse new /fix when > $20.
8. **PR output sanitization** in pr.ts - regex-strip ANTHROPIC_API_KEY, sk-ant-*, ghp_*, 64-char hex, etc. before gh pr create.
9. **LLM tagging** on Critic system prompt - mark untrusted external content with [EXTERNAL_SOURCE].
10. **npm allowlist** - set `ignore-scripts=true` in repo .npmrc; Coder system prompt forbids `npm install <new-pkg>`.
11. **Add 4 forum topics** to ZAO Devz group: General / Coder / Critic / Festival Ops. Update narrator to post Coder messages to Coder topic, Critic to Critic topic.
12. **Iman test message v2** - now reflects topic-lane UX + privacy mode behavior. (Replaces Apr 25 message that assumed disabled privacy).

### Next sprint (1-2 weeks)

13. **Phoenix observability** on VPS 1 - docker-compose up + grammy.js OTel SDK middleware. Trace propagation from Telegram -> bot -> Claude CLI subprocess.
14. **`agent_executions` Supabase table** for per-bot cost + token tracking, queryable by agent_name + date.
15. **`agent_memories` pgvector table + Matricula 4-layer loop** for ZOE (per doc 484). Nightly Haiku consolidation cron.
16. **Install ss-triage-router MCP** on ZOE (per doc 473) - Haiku triage / Sonnet voice / Opus heavy.
17. **Coder pre-flight tests** - run `npm run typecheck` + `npm run lint` before Critic even sees the diff. Machine-verifiable completion (Ralph Loop pattern).
18. **Persona SOUL.md files** for ZOE, ZAODevZBot, HermesZAOdevzbot, ZAOstockTeamBot - explicit voice + constraint reinforcement.

### Month 2

19. **Ship Research bot** as 5th member of fleet - reactive `/research <topic>@ResearchBot` wrapping `/zao-research` skill.
20. **Then Magnetiq, WaveWarZ, POIDH bots** per doc 467 staging. Each adopts the Hermes pattern (Coder/Critic for code work, single-agent for ops/social).
21. **Re-validate this doc** with 30 days of production /fix data + cost actuals + collision counts.

## Sources

16-agent dispatch (Apr 25 2026):
- Agent 1: Telegram multi-bot coordination 2026 (privacy mode, namespacing, forum topics)
- Agent 2: Multi-agent UX patterns (LangGraph supervisor, SOUL.md, MCP)
- Agent 3: Codebase audit (collisions, ZOE bug, grammy filter behavior)
- Agent 4: Reddit r/AIAgents/ClaudeCode/LocalLLaMA (OpenClaw dominance, traffic-light pattern, $/agent/day)
- Agent 5: Reddit r/selfhosted/HomeLab (systemd vs PM2, .env strategy, restart policies)
- Agent 6: Reddit voice/UX (frameworks > personas, [Label] prefixing, token-cost-of-voice)
- Agent 7: X production stories (Ralph Loop, Turnfile, Nicky 10-agent swarm, multi-bark-pack, Terra)
- Agent 8: X dispatch + supervisor (Cursor + Anthropic + Bayezian consensus, $0.028/task)
- Agent 9: X Telegram-native fleet (forum topics, multi-bot vs native, Daniel Georgiev's 16->2 post-mortem)
- Agent 10: Anthropic official (Managed Agents, Claude Agent SDK subagents, internal research system)
- Agent 11: Security threat model (10 P0/P1/P2 defenses, prompt-injection chains, Shai-Hulud npm worm)
- Agent 12: Observability (Phoenix vs Langfuse vs Helicone, OpenTelemetry GenAI semconv, trace propagation)
- Agent 13: YouTube/podcast UX (Cole Medin, Riley Brown 111K views, Cognition Devin, persona drift)
- Agent 14: HackerNews skeptic (95% failure rate, infrastructure isolation > prompts, 14K-session study)
- Agent 15: Cost calibration (Veltrix $2.80/day, AgentForgeAI $4.05/day, Mr.Chief 81% reduction, $18/day notional for ZAO)
- Agent 16: Anti-pattern catalog (10 production removals + ZAO blacklist)

Plus existing ZAO research:
- Doc 461 - safe-git-push.sh defense in depth (LIVE this session)
- Doc 467 - bot fleet rollout
- Doc 473 - ss-triage-router for ZOE
- Doc 484 - Matricula 4-layer loop
- Doc 506 - TRAE SOLO skip (vendor risk)
- Doc 507 - 1,116 skills curated
- Doc 508 - creator infra signals
- Doc 523 - agentic systems audit + Hermes spec
- Doc 524 - everything-map (LIVE/STARTED/PLANNED/ARCHIVED)

## Staleness + Verification

- Telegram Bot API patterns: verified via official docs Apr 25 2026
- Anthropic SDK: verified via platform.claude.com docs Apr 25 2026
- Cost data: 10 production sources Mar-Apr 2026, real $ figures
- HN consensus: 12 threads, 50+ direct quotes, 2024-2026 timespan
- Re-validate by 2026-05-25 with first 30 days of production /fix data

## Next Actions

| # | Action | Owner | Type | By |
|---|--------|-------|------|-----|
| 1 | Re-enable privacy on both new bots via BotFather | Zaal | Telegram action | Today |
| 2 | Fix ZOE handleTodoCommand allowlist + return-early on unknown | Claude (SSH VPS) | Code edit on `~/bin/bot.mjs` | Today |
| 3 | Add grammy bot-name filter middleware to devz/index.ts | Claude | Code | Today |
| 4 | Extend HERMES_FORBIDDEN_PATHS list | Claude | Code | Today |
| 5 | First /fix end-to-end test with privacy + middleware in place | Zaal in Telegram | Manual | Today |
| 6 | Per-task budget caps + fleet daily ceiling | Claude | Code | This week |
| 7 | PR output sanitization in pr.ts | Claude | Code | This week |
| 8 | LLM tagging on Critic input | Claude | Code | This week |
| 9 | npm allowlist + ignore-scripts=true | Claude | Config | This week |
| 10 | 4 forum topics in ZAO Devz + topic routing in narrator | Zaal + Claude | Telegram + code | This week |
| 11 | Iman test message v2 | Claude | Clipboard | After step 5 |
| 12 | Phoenix observability docker-compose on VPS | Claude | Infra | Next sprint |
| 13 | agent_executions table + cost tracking | Claude | Migration + code | Next sprint |
| 14 | agent_memories pgvector + Matricula 4-layer | Claude | Migration + code | Next sprint |
| 15 | ss-triage-router MCP on ZOE | Claude | MCP install | Next sprint |
| 16 | Coder pre-flight tests (typecheck + lint) before Critic | Claude | Code | Next sprint |
| 17 | SOUL.md persona files for all 4 bots | Claude | Markdown | Next sprint |
| 18 | Ship Research bot as 5th fleet member | Claude | New service | Month 2 |
| 19 | Magnetiq + WaveWarZ + POIDH bots | Claude | Per doc 467 | Month 2 |
| 20 | Re-validate this doc with 30-day prod data | Claude | Audit | 2026-05-25 |

## Also See

- Doc 523 (architecture decisions) - sister doc, this one extends it with collision fixes + multi-bot UX
- Doc 524 (everything-map) - complete agent inventory
- Doc 461 - safe-git-push.sh hooks (LIVE)
- Doc 467 - bot fleet rollout staging
- Doc 506 - TRAE skip (vendor risk reference)
- `bot/src/hermes/*` - the live Hermes pair
- `bot/src/devz/index.ts` - dual-bot entry, the file most needing the bot-name filter middleware
