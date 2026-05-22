---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-05-20
related-docs: 460, 467, 524, 527, 661, 663, 676
tier: STANDARD
---

# 683a - Bot Fleet Consolidation

> **Goal:** Audit the ZAO bot ecosystem for consolidation opportunities (merging codebases / shared patterns) and automation opportunities (removing manual steps, shared ingest layers). Identify which are cheap wins (difficulty <= 3, high value).

---

## Current State: 6+ Bots, 3 Repos, Significant Code Duplication

| Bot | Location | Host | Process model | Alive? | Lines | Framework |
|-----|----------|------|---------------|--------|-------|-----------|
| **ZOE** (concierge + dispatcher) | `/bot/src/zoe/` (ZAOOS) | VPS 187.77.3.104 | Claude Code CLI subprocess | YES | ~1.5K | grammy.js (Telegram) |
| **Hermes** (Coder/Critic auto-PR) | `/bot/src/hermes/` (ZAOOS) | VPS (spawns AO sessions) | Claude Code CLI subprocess | YES | ~1.6K | grammy.js (Telegram) |
| **ZAOstockTeamBot** | `/bot/src/teams/` (ZAOOS) | VPS 187.77.3.104 | Node process (systemd) | Planned | ~0.8K | grammy.js |
| **ZAOcoworkingBot** | `github.com/songchaindao/cowork-zaodevz/agent/` | VPS 187.77.3.104 | Node process (systemd) | YES | ~2.1K | grammy.js |
| **ZAOscribe** | `github.com/bettercallzaal/zaoscribe` | VPS 187.77.3.104 | (archived, Discord-based) | paused | ? | discord.py (Python) |
| **Trading Agents** (VAULT/BANKER/DEALER) | `/src/lib/agents/` (ZAOOS) | Vercel cron | Headless agents | YES | ~0.7K | TypeScript |

**Total bot code:** ~6.7K lines across 3 repositories.

---

## Consolidation Opportunities (Ranked by Value)

| Opportunity | Current state | Proposed consolidation/automation | Difficulty (1-10) | Value | Cheap win? |
|---|---|---|---|---|---|
| **1. Shared bot.mjs core + CLI wrappers** | Each bot re-invents telegram polling, session/cache handling, rate-limit checks, guardrail loops, error-retry. Code duplication ~40% across grammy bots. | Extract `bot-core.mjs` at `bot/_shared/bot-core.mjs`. All grammy bots (ZOE, Hermes, ZAOstock, ZAOcoworking) become thin wrappers. Share: concurrency limits, rate-limit Redis, circuit-breaker logic, message queue, conversation buffers, command parsing middleware. Per-bot: token, ALLOWED_USERS, ALLOWED_GROUPS, model-routing config, persona file. | 3 | HIGH | YES |
| **2. Shared Letta-style memory block builder** | ZOE has 4-block memory (persona/human/working/tasks). ZAOcoworkingBot duplicates similar per-user state. Each bot re-implements context-assembly from scratch. | Extract `memory-blocks.ts` with generic builder: `assembleMemoryBlocks(persona, human, working, context)`. Reuse in ZOE + ZAOcoworkingBot + future bots. Cost: ~2 hours. ROI: blocks 50+ lines per bot, enables knowledge-graph recall across all bots once Bonfire SDK lands. | 2 | HIGH | YES |
| **3. Cross-bot knowledge-graph writer (Bonfire bridge)** | ZOE mirrors captures to ZABAL bonfire via `mirrorTurn()`. ZAOcoworkingBot writes `/add /done` events separately. Hermes does NOT write to KG. Each has its own ingest pipeline or none at all. | Create `bot/_shared/bonfire-writer.ts` singleton with spool + retry. All bots write episode events atomically: `writeEpisode(botName, eventType, content, metadata)`. Single secret-scan gate + Supabase event log. Bonfire becomes the single source of truth for "what happened across all bots." Cost: ~4 hours. Unblocks 676c (content flywheel) + 676e (fractal contribution digest). | 4 | HIGH | YES |
| **4. Unified rate-limit + circuit-breaker module** | ZOE has per-user rate limits (50 calls/day). ZAOcoworkingBot has per-group throttle logic. ZAOstock rate-limit TBD. Hermes has coder/critic budget caps but no fleet-wide ceiling. Collision happens if ZOE + Hermes both fire at high load. | Extract `bot/_shared/rate-limiter.ts` + `bot/_shared/circuit-breaker.ts`. All bots register with a shared Redis backend: `await rateLimiter.check(botName, userId, 'response')`. Fleet-wide cap at $X/day (stop new /fix if Hermes daily cost > threshold). Post to Zaal in DM if > 5 circuit breaks in 1h. Cost: ~3 hours, ~150 lines. | 3 | MEDIUM | YES |
| **5. Unified persona/voice enforcement** | ZOE has persona.md. ZAOstock has inline persona string in code. ZAOcoworking has persona file per-group. Hermes Coder/Critic have voice baked into coder.ts/critic.ts system prompts. One voice update requires touching 4+ repos. | Extract `bot/_shared/persona-manager.ts` + per-bot `personas/<bot>.md` files at ZAOOS `bot/personas/`. CLI: `manage-personas --update zoe < new_voice.md`. Single source of truth. Nightly cache invalidation. Cost: ~2 hours. ROI: voice consistency audit becomes one grep, one update. Enables constraint-refresh per doc 527 (reinforce rules every 30 turns). | 2 | MEDIUM | YES |
| **6. Consolidated Telegram webhook dispatcher** | Today: each bot is a separate node process pulling from Telegram polling. If a message arrives for bot A while bot B is running, bot A misses it or double-fires. VPS runs multiple bot.mjs processes in tmux. | Single shared dispatcher (`bot/_shared/dispatcher.mjs`) subscribes to Telegram webhook once, routes by chat_id + command to per-bot queue. Reduces socket thrashing + Telegram rate limits. Requires Caddy webhook route + per-bot callback handlers. Cost: ~6 hours. Payoff: eliminate polling overhead, enable per-bot subscription filters. Risk: single point of failure. Defer to Phase 2. | 6 | MEDIUM | NO (defer) |
| **7. Shared Supabase table schema for bot events** | ZOE writes to event_log. Hermes writes agent_executions. ZAOcoworking writes separate table. No unified event structure. Cost tracking per-bot is manual. | Create `agent_events` table schema (bot_name, event_type, actor, metadata, cost_usd, created_at) used by ALL bots. One place to query "what happened yesterday." Enables cost audit + cross-bot correlation. Cost: ~2 hours migration + code. Value: unblocks observability (doc 527 Phoenix setup) + audit automation. | 2 | MEDIUM | YES |
| **8. Shared secret-scan + pre-commit guards** | ZOE has secret_scan.py. ZAOcoworking has its own. Hermes has pr-sanitize logic. Three separate implementations, different regexes, different thresholds. One bot leaks a key because someone didn't run their local pre-commit. | One `bot/_shared/secret-scan-pre-commit.sh` wrapped in bot CI + pre-push hooks. Mandatory in all 3 repos. Cost: ~1 hour. Value: force-blocks credential leaks ecosystem-wide. SECURITY WIN. | 1 | HIGH | YES |
| **9. Shared npm package for common utilities** | Rate-limit, circuit-breaker, memory-blocks, bonfire-writer, persona-manager, secret-scan all live in separate files or repo/bot copy-paste. New bot means 10+ manual copies. | Publish `@zaos/bot-core` private npm package (GitHub npm registry). Includes all shared modules above. Each bot: `npm i @zaos/bot-core` + instantiate. Single source of truth, single version. Cost: ~4 hours. ROI: eliminates all copy-paste above. Future bots ship 50% faster. | 4 | MEDIUM | YES |
| **10. Unified logging + alerting** | ZOE logs to stdout. Hermes logs to Supabase. ZAOcoworking logs to Telegram + stdout. No aggregation. Alert fatigue: Zaal gets pinged from 3 places. | Winston logger with multiple transports (stdout + Loki/Grafana on VPS + Telegram @zaoclaw_bot for P0 only). Cost: ~3 hours setup. ROI: Zaal sees all bot issues in one place. | 3 | MEDIUM | YES (partial) |

---

## Automation Opportunities (Ranked by Value)

| Automation | Current state | Proposed automation | Difficulty | Value | Cheap win? |
|---|---|---|---|---|---|
| **A1. Auto-load persona.md on bot startup** | Persona edits require code restart. Zaal edits `~/.zao/zoe/persona.md`, but bot doesn't reload until systemd restart. 15min+ lag. | Supervisor watchdog (`fs.watch()` on persona.md) triggers bot restart + memory recompile. Cost: ~30 min + 40 lines. Result: persona changes live in <1 min. | 2 | MEDIUM | YES |
| **A2. Auto-run typecheck + lint pre-push on all bot repos** | Today: no githooks. Devs can push broken code. | Pre-push hook in all 3 bot repos runs `npm run typecheck && npm run lint`. Cost: 30 min scripting + docs. ROI: catches compilation errors before PR. | 2 | MEDIUM | YES |
| **A3. Nightly cross-bot insights consolidation** | ZOE writes candidates to `~/.cache/zoe-telegram/candidates.jsonl`. ZAOcoworking writes separate file. Doc 467 says "nightly consolidation" but it's not implemented. Insights never promote to shared-insights.jsonl. | Cron job (2am ET): `consolidate-insights.mjs` reads all `/cache/zoe-telegram/*/candidates.jsonl`, clusters by tag, scores confidence, writes to `/openclaw-workspace/shared-insights.jsonl`. Syncs nightly to private zao-agents-memory repo. Cost: ~3 hours. Unblocks 676a (ZOE recall) + cross-bot learning. | 3 | HIGH | YES |
| **A4. Cost aggregation + daily budget alert** | Hermes has per-task caps ($5/$1), but no fleet-wide tracking. Zaal doesn't know daily spend until EOD. | Write `track-bot-costs.ts` cron (hourly): polls Supabase agent_events, sums cost_usd by date + bot_name, posts daily summary to Zaal 5pm ET. If > $X, posts alert. Cost: ~2 hours. Payoff: stay on budget, catch runaway agents. | 2 | HIGH | YES |
| **A5. Auto-generate bot status dashboard** | Doc 467 mentions portal `/bots` page (status tiles, rate-limit usage, last-trigger). Not shipped. Zaal has no UI for "are all my bots alive?" | Next.js page `/portal/bots` queries Supabase agent_events, renders tiles: bot name, last activity, cost today, uptime %, next scheduled. Auto-refresh 30s. Cost: ~4 hours. Payoff: Zaal sees fleet health at a glance. | 3 | MEDIUM | YES |
| **A6. Auto-seed new bot from template** | Launching a new bot (Magnetiq, WaveWarZ, Research per doc 467) requires copy-paste from ZOE or ZAOcoworking + edits. 30-60 min boilerplate. | Script `bin/create-bot.sh <botname> <telegram_token>` scaffolds: bot/ dir, persona.md, types.ts, .env.example, package.json, systemd unit file, Caddyfile block, git hook. Cost: ~3 hours. ROI: new bot ships in 15 min, eliminates 45 min of boilerplate. | 2 | MEDIUM | YES |
| **A7. Shared Telegram webhook instead of polling** | Each bot runs polling loop (5x Telegram API calls/min per bot). 3 bots = 15 calls/min, ~21.6K/day. Wastes bandwidth + Telegram rate-limit surface. | Single Caddy webhook endpoint (`/telegram/webhook`) + webhook secret + per-bot callback queue. Reduces to 1 webhook subscription. Cost: ~6 hours + risk (webhook point of failure). ROI: ~70% fewer Telegram API calls. Defer to Phase 2 after consolidation 1-5 ship. | 6 | MEDIUM | NO (defer) |

---

## Cheap Wins (Difficulty <= 3 + High Value)

Ship these first, high ROI per person-hour.

### Cheap Win 1: Shared bot.mjs core + per-bot persona file

**Files to create/modify:**
- Create: `/bot/_shared/bot-core.mjs` - shared telegram polling, concurrency, rate-limit check, guardrail loop, retry logic
- Create: `/bot/_shared/rate-limiter.ts` - Redis-backed rate limiter for per-user/group throttle
- Create: `/bot/_shared/circuit-breaker.ts` - 5-failure-in-24h -> read-only mode
- Create: `/bot/personas/zoe.md`, `/bot/personas/zaostock.md`, `/bot/personas/zaocoworking.md` - persona files (move from inline code + ~/.zao/zoe/)
- Modify: `/bot/src/zoe/index.ts` - wrap bot-core.mjs instead of inlining polling
- Modify: `/bot/src/hermes/commands.ts` - same
- Modify: `/bot/src/teams/index.ts` - same
- Copy pattern to: `cowork-zaodevz/agent/src/index.ts` (via submodule or direct copy)

**Effort:** 3 person-hours
**Value:** HIGH (blocks all future bots, eliminates 40% duplication)
**Start:** Monday morning

### Cheap Win 2: Shared Letta-style memory block builder

**Files to create:**
- Create: `/bot/_shared/memory-blocks.ts` - generic 4-block builder: `assembleMemoryBlocks(persona, human, working, context)` -> string
- Modify: `/bot/src/zoe/memory.ts` - use builder instead of inline assembly
- Modify: `cowork-zaodevz/agent/src/memory.ts` - same

**Effort:** 2 person-hours
**Value:** HIGH (enables knowledge-graph recall across bots, keeps personas DRY)
**Start:** Tuesday

### Cheap Win 3: Shared Supabase agent_events schema + shared write function

**Files:**
- Create: Migration script at `/scripts/migrations/2026-05-20_agent_events_schema.sql` (one table, all bots write to it)
- Create: `/bot/_shared/agent-event-writer.ts` - `writeEvent(botName, eventType, cost, metadata)`
- Modify: `/bot/src/zoe/concierge.ts` - call writeEvent() instead of custom logging
- Modify: `/bot/src/hermes/runner.ts` - same
- Copy pattern: `/cowork-zaodevz/agent/src/index.ts`

**Effort:** 2 person-hours
**Value:** HIGH (enables unified cost tracking, observability, cross-bot audit)
**Start:** Tuesday

### Cheap Win 4: Unified rate-limit + circuit-breaker

**Files:**
- Modify: `/bot/_shared/rate-limiter.ts` (already in Win 1, but expand it)
- Modify: `/bot/_shared/circuit-breaker.ts` (already in Win 1)
- Modify: all bot index.ts files to call both before Claude subprocess

**Effort:** 2 person-hours (included in Win 1, but test separately)
**Value:** MEDIUM (prevents cost runaway + collision bugs from doc 527)
**Start:** Wednesday

### Cheap Win 5: Shared secret-scan pre-commit guard

**Files:**
- Modify: `/.husky/pre-commit` or create `/.git/hooks/pre-push` with `bot/_shared/secret-scan-pre-commit.sh` call
- Modify: `cowork-zaodevz/.git/hooks/pre-push` (same)
- Add: `.npmrc` with `ignore-scripts=true` to both repos

**Effort:** 1 person-hour
**Value:** HIGH (SECURITY, force-blocks credential leaks)
**Start:** Immediate (highest risk)

### Cheap Win 6: Auto-load persona on file change

**Files:**
- Create: `/bot/_shared/persona-watcher.ts` - uses fs.watch() on persona.md, triggers graceful restart
- Modify: `/bot/src/zoe/index.ts` - add persona watcher on startup
- Modify: `/bot/src/teams/index.ts` - same

**Effort:** 1.5 person-hours
**Value:** MEDIUM (speed up persona iteration, unblock voice consistency work)
**Start:** Thursday

### Cheap Win 7: Nightly cross-bot insights consolidation

**Files:**
- Create: `/scripts/consolidate-insights.mjs` - read candidates.jsonl from all bots, cluster + score, write to shared-insights.jsonl
- Create: `/bot/.systemd/zoe-consolidation.service` - runs 2am ET daily
- Modify: `bot/src/zoe/index.ts` (ZOE concierge) to call consolidate-insights.mjs on startup

**Effort:** 3 person-hours
**Value:** HIGH (unblocks 676a ZOE recall + content flywheel + governance digest)
**Start:** Friday (after memory blocks ship)

### Cheap Win 8: Cost tracking + daily alert

**Files:**
- Create: `/scripts/track-costs.ts` - hourly cron, sums Supabase agent_events by bot + date
- Create: `/bot/.systemd/cost-tracker.timer` + `/bot/.systemd/cost-tracker.service`
- Modify: `/bot/src/zoe/index.ts` to listen for cost alerts + post to Zaal

**Effort:** 2 person-hours
**Value:** HIGH (prevents budget overruns, unblocks alerts in doc 527)
**Start:** Friday

---

## Sequence to Ship (Week 1-2)

| Day | Wins to ship | Person-hours | Blocker | Payoff |
|-----|------|----------|---------|--------|
| Mon | Win 5 (secret-scan) + Win 1 start (bot-core) | 1.5 + start | None | SECURITY gate closed, foundation laid |
| Tue | Win 1 finish + Win 2 (memory blocks) + Win 3 (Supabase schema) | 2 + 2 + 2 | bot-core stable | All bots unified on core + memory + logging |
| Wed | Win 4 (rate-limit/circuit) + Win 6 (persona watcher) | 2 + 1.5 | bot-core | Fleet safety gates + persona agility |
| Thu | Test cross-bot end-to-end (ZOE + ZAOstock + ZAOcoworking all use new core) | 2 | above | Validate consolidation works |
| Fri | Win 7 (insights consolidation) + Win 8 (cost tracking) | 3 + 2 | Supabase schema | Knowledge graph + budget visibility |
| **Total Week 1** | **All 8 cheap wins** | **~19 hours** | None | Bot fleet cut 40% duplication, 100% monitoring, all key guardrails in place |

---

## Phase 2 (Post-Week 1): Medium Complexity

After the cheap wins ship + are validated:

1. **Shared npm package** (`@zaos/bot-core`) - consolidates bot-core.mjs, rate-limiter, circuit-breaker, memory-blocks, bonfire-writer into one published module (~4 hours)
2. **Unified logging** (Winston + Loki on VPS) - single pane of glass for all bot logs (~3 hours)
3. **Bot status dashboard** (/portal/bots) - Next.js tiles showing health per bot (~4 hours)
4. **Create-bot script** - scaffold new bots in 15 min (~3 hours)

---

## Security Wins (Mandatory)

All bots must have by end of week:

1. **Secret-scan pre-commit** (Win 5) - blocks env vars, private keys, API tokens
2. **File write allowlist** - Hermes already has HERMES_FORBIDDEN_PATHS; add to all bots
3. **Per-task budget caps** - Hermes has $5/$1 caps; add to ZOE ($50/day), ZAOstock (unbounded, Zaal-only)
4. **Circuit breaker** (Win 4) - read-only mode after 5 guardrail rejections in 24h

---

## Related Docs

- **Doc 467** — bot fleet design + rollout (ZAOstock, Magnetiq, Research bots)
- **Doc 527** — multi-bot coordination patterns + privacy mode + security
- **Doc 676** — Bonfire KG utilization (wins 7 + 8 enable this)
- **Doc 661** — ZAOOS codebase audit
- **Doc 663** — library hygiene + dupe detection
- **Doc 460** — agentic stack end-to-end

---

## Risks + Mitigation

| Risk | Likelihood | Mitigation |
|------|-----------|-----------|
| Bot-core rewrite breaks existing bots | HIGH | Branch per bot in Win 1, test each separately before merge |
| Rate-limiter Redis connection fails | MED | Fallback to in-memory counter + log to Supabase |
| Persona reload loop cycles bot too fast | LOW | Debounce file watcher 5s, restart only if content changes |
| Insights consolidation runs too slowly (N candidates >> 100) | LOW | Defer clustering to async job, post interim results to Zaal |
| Cost tracking misses events due to Supabase lag | MED | Track locally in-memory, reconcile nightly |

---

## Why Now

The bot fleet is growing (doc 467 plans 5+ branded bots). Copy-pasting code 5+ times costs Zaal weeks of maintenance debt + collision bugs from doc 527. Consolidation up front = linear cost to add new bots, not quadratic.

---

## Next Action

1. Run `gh pr create` on Monday with a new branch `ws/bot-consolidation-683a` merging all 8 wins.
2. Zaal reviews + approves consolidation strategy (persona files, shared modules, Supabase schema).
3. Start Day 1 (Win 5 + bot-core) immediately after approval.
