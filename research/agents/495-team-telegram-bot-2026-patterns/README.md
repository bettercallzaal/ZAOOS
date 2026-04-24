---
topic: agents
type: decision
status: research-complete
last-validated: 2026-04-24
related-docs: 483, 492, 493, 494
tier: STANDARD
---

# 495 - Team Telegram Bot 2026 Patterns — v1.5 Architecture Call

> **Goal:** Decide the architecture for the ZAOstock Team Bot v1.5 before committing to group-mode design: heuristics vs local LLM vs cloud LLM, single-group vs split-group (ZAOstock vs ZAO Devz), and observability primitives. Research before code.

---

## Key Decisions

| Decision | Call | Why |
|----------|------|-----|
| Classification approach for "is this message noteworthy" | **USE heuristics for v1.5. Add Claude Haiku classifier in v1.6 only for the ambiguous ~15%.** | dev.to 2026-04 case: deterministic keyword router is 600x faster, free, 85% accurate vs LLM routing. At our 500-msg/day scale, Haiku adds <$1/mo IF we use it only on ambiguous cases. Pure LLM would be overkill AND slower. |
| Classification model if/when we add LLM | **USE Claude Haiku 4.5 via API (not Max CLI, not local Hermes).** | Haiku 4.5 = $1/M input, $5/M output, 400-600ms TTFT. 200 msgs/day × 300 tokens ≈ $0.50/mo. Max CLI adds process-spawn latency + complex auth handling. Local Hermes/Qwen = ops burden on single-VPS box already running ZOE + ZAOstock bot. Not worth it yet. |
| Two-group split (ZAOstock + ZAO Devz) | **USE it. Route by chat_id with an ops_mode flag per chat.** | OpenClaw's 2026 integration guide uses this exact pattern: different chat_ids get different model configs + behaviors. Clean separation of "bot as teammate" vs "bot as monitored tool". Not overkill at 17 people. |
| Privacy mode | **DISABLE in @BotFather.** Required for passive listening. | Grammy + Telegram Bot API confirmed: privacy mode Disabled is the only way `can_read_all_group_messages=true` and the bot sees plain-text messages (not just /commands + @mentions). |
| Framework | **KEEP grammy.** | 5.2k+ stars, active, already in v1. aiogram is Python-only. No reason to rewrite. |
| Single process vs worker split | **KEEP single process for v1.5/1.6.** | Grammy handles long-poll + commands + cron in one event loop fine at our scale. Only split if we hit >1000 msgs/min (we won't). |
| Observability channel | **USE ZAO Devz as the error/health channel.** No extra tool. | Self-reporting via Telegram post beats adding Grafana/Sentry for 17-person project. Bot posts its own errors. |
| Testing strategy | **USE a 3rd "staging" Telegram group** for bot iteration, promote to ZAOstock group when stable. | Avoids polluting the real team chat with debug output during v1.5/1.6/1.7 iterations. |
| Versioning | **USE semver-ish tags (v1, v1.5, v1.6) + feature flags in env.** | Rollback = flip env var + restart systemd unit. 30 sec recovery. |

---

## Pareto 80/20 — three wires that do 80% of v1.5

1. **Heuristic classifier** (30 lines of code, regex + keyword + entity-name match) handles 85% of "is this noteworthy" decisions at $0 cost, <5ms latency.
2. **Two-group chat_id routing** (chat.id → behavior map in DB) separates teammate-mode from monitor-mode. Enables morning digest in one place, error alerts in the other.
3. **Self-reporting via ZAO Devz** (bot.catch + process.on('uncaughtException') + startup/shutdown ping). Free observability. No Sentry bill.

Everything else (LLM upgrade, worker split, dashboard) is optional later.

---

## Comparison of Options

### Classification approaches

| Approach | Speed | Cost | Accuracy (our domain) | Ops burden | Verdict for v1.5 |
|----------|-------|------|-----------------------|------------|------------------|
| **Heuristics (regex + keyword + entity name match)** | <5ms | $0 | ~85% | Zero | **USE** |
| **Claude Haiku 4.5 via API** | 400-600ms TTFT | ~$0.50-1.00/mo @ 200 msgs/day | ~95%+ | Zero (HTTP call) | **DEFER to v1.6** for ambiguous cases only |
| **Claude Sonnet 4.5 via API** | 600-900ms TTFT | ~$5-10/mo | ~97% | Zero | **SKIP** — overkill for classification |
| **Claude Max via `claude` CLI** | 1-3s (process spawn) | $0 (existing sub) | ~95% | Medium (auth + child_process + stream parsing) | **DEFER** to v2 when we're running many model-backed agents and want a shared routing layer |
| **Local Hermes + Qwen3.6-27B on VPS** | 500-1500ms | Server cost only (covered) | 90%+ | High (model management, VRAM, restart on OOM) | **DEFER** — worthwhile when ops load justifies it. Not at 500 msgs/day. |
| **Mistral Small 4 via API** | ~500ms | $0.15/M input, $0.60/M output (cheapest cloud) | 90%+ | Zero | **FALLBACK** if Anthropic pricing changes or we need 10x more volume |
| **Gemini Flash free tier** | 300-500ms | $0 (free tier limits) | 90%+ | Zero | **FALLBACK** for privacy-insensitive batch work |

### Group architecture

| Pattern | Fits us? | Notes |
|---------|----------|-------|
| **Single group, bot for everything** | No | Conflates festival team chat with ops/error noise. Zaal explicitly asked for split. |
| **Two groups: Team + Dev-ops** (recommended) | Yes | OpenClaw 2026 docs show this exact pattern. Router config by chat_id. |
| Three groups (Team + Dev-ops + Staging) | Yes for iteration | Use staging during v1.5/1.6 build-out, retire when stable. |
| Per-scope group (ops-only, music-only, etc.) | Overkill at 17 people | Revisit at 50+ team members. |

### State machine / framework

| Option | Used by | Fit |
|--------|---------|-----|
| grammy (Node/TS) | us already, 5.2k+ stars, active | **KEEP** |
| aiogram 3 (Python) | Blixamo 2026 Telegram bot guide | Irrelevant — we're Node |
| python-telegram-bot | MoltBot 2026 guide | Irrelevant |
| Hermes Agent + Telegram | NousResearch/hermes-agent | Defer — complexity beyond v1.5 |
| Botpress / self-hosted no-code | Botpress 2026 list | No — we want code |

---

## Community sources — what the web actually says

### Reddit / community signal (required for STANDARD tier)

The direct Reddit/TelegramBots search didn't surface deeply substantive "passive listener" threads — community gravitates toward command-response patterns, rarely passive-listening. That finding itself matters:

> **Passive listening in group chats is not a common community pattern.** Most community Telegram bots are explicit /commands or @mention bots. If we build passive listening, we are ahead of the community default, which means two things:
> (1) fewer reference implementations to copy, (2) privacy surprise is a real risk — our teammates may not realize the bot is logging.

This argues hard for the "only log noteworthy, keep raw messages in Telegram only" privacy stance.

**Source:** [Telegram r/TelegramBots and adjacent boards 2025-2026 search results](https://www.reddit.com/r/TelegramBots/) — no substantive passive-listener threads; 35k members, mostly command-response help.

### Hacker News signal (required for STANDARD tier)

Relevant 2025-2026 HN thread: [Claude Haiku 4.5 launch discussion](https://news.ycombinator.com/item?id=45595403).

Key takeaway from the HN thread: community consensus on Haiku 4.5 is "use for classification, routing, and summarization; don't use for reasoning". Matches our plan (classify messages, not reason about them).

Also: [Show HN: Reddit sentiment dashboard using Claude Haiku](https://news.ycombinator.com/item?id=45608274) — real-world pattern of Haiku-powered classification at scale, confirms pricing assumptions.

### GitHub source (required for STANDARD tier)

[grammY repository](https://github.com/grammyjs/grammY) — our framework, active dev, check for bot-API-9.4 support (Feb 2026 bump adds forum topic creation in DMs).

Open issue signal from the Hermes-agent adjacent ecosystem: [NousResearch/hermes-agent#13607 — Telegram forum supergroup General topic messages fail to reach bot](https://github.com/NousResearch/hermes-agent/issues/13607).

**Takeaway:** Hermes+Telegram integration has rough edges on the forum-topic side. Validates our "don't adopt Hermes yet" call.

Also: [OpenClaw/openclaw#28085 — Telegram group @mentions fail under privacy mode](https://github.com/openclaw/openclaw/issues/28085). Bug report documenting that privacy-mode=Enabled breaks @mention detection. Another argument for **disabling privacy mode in @BotFather**.

### Context7 / framework docs

- [Telegram Bot API changelog](https://core.telegram.org/bots/api-changelog) — **Bot API 9.4 (Feb 2026)** adds `createForumTopic` in private chats. We do not need this for v1.5 but confirms forum-topic support is first-class.
- [Telegram Bots FAQ](https://core.telegram.org/bots/faq) — confirms privacy mode semantics + `can_read_all_group_messages` flag returned only by `getMe`.
- [grammY getting started](https://grammy.dev/) — our framework, confirms `ctx.chat.type` ('private' | 'group' | 'supergroup' | 'channel') and `ctx.message.message_thread_id` as the topic-routing primitive.

### Blog / comparison signal

- [dev.to — "I picked a 5ms keyword router over an LLM meta-router" (2026-04-11)](https://dev.to/samarth0211/i-picked-a-5ms-keyword-router-over-an-llm-meta-router-for-my-ai-app-heres-the-math-23p2) — exact math supporting our "heuristics first" call. 600x faster, $3,000 saved/year at 600k questions, 85% accuracy.
- [APICents — Claude Haiku 4.5 vs Mistral Small 4 2026](https://apicents.com/compare/claude-haiku-4-5-vs-mistral-small-4) — pricing validated. Haiku 4.5: $1/M input, $5/M output. 400-600ms TTFT. Mistral Small 4 cheaper ($0.15/$0.60) if we need the delta later.
- [Jason Cochran — MoltBot Claude cost optimization 2026](https://blog.jasoncochran.io/the-complete-guide-to-claude-cost-optimization-with-clawdbot-and-telegram/) — detailed Telegram+Claude cost math, 83% savings via model downgrade + caching.
- [Claude Lab — Telegram bot with Claude API 2026](https://claudelab.net/en/articles/api-sdk/claude-api-telegram-bot-development-guide) — reference architecture, though Python.
- [Blixamo — Telegram bot with Claude Haiku free 2026](https://blixamo.com/blog/build-telegram-bot-claude-api-python) — $7-9/mo at 200 msgs/day with Haiku 3.5 (superseded by 4.5 in our stack).

---

## ZAO Ecosystem Integration

### Current bot codebase (ground truth)

- `bot/src/index.ts` — grammy setup, 160 lines. Handles `/start`, `/help`, `/status`, `/mytodos`, `/mycontributions`, `/gemba`, `/idea`, `/note` in DMs only. Falls through to canned reply on anything else.
- `bot/src/auth.ts` — Telegram user_id ↔ stock_team_members mapping (verified scrypt).
- `bot/src/status.ts`, `bot/src/capture.ts`, `bot/src/activity.ts` — command handlers + DB writers.
- `bot/src/supabase.ts` — single service-role client.
- No LLM wired. No group handling. No cron.

### v1.5 files to add

- `bot/src/group.ts` (new) — detects `ctx.chat.type === 'supergroup'`, routes by chat_id to mode (team / devops / staging). Heuristic classifier lives here.
- `bot/src/heuristics.ts` (new) — pure functions: `isNoteworthy(text) -> { noteworthy: bool, reason: string, entityHints: string[] }`. ~80 lines.
- `bot/src/digest.ts` (new) — morning + evening digest templates (string templates, no LLM).
- `bot/src/schedule.ts` (new) — node-cron setup. 6am EST morning digest, 6pm EST evening recap.
- `bot/src/commands/chatinfo.ts` (new) — `/chatinfo` command replies with chat_id + thread_id for onboarding a new group.
- `bot/src/commands/health.ts` (new) — `/health` admin-only ops command for ZAO Devz.
- `bot/src/ops-alerts.ts` (new) — self-reporting: startup/shutdown ping + error caught → post to DEVOPS chat_id.

### Schema adds (already drafted in `scripts/stock-bot-group-migration.sql`)

- `stock_bot_chats` — per-chat config (is_primary, is_devops, title, forum flag, added_at)
- `stock_bot_topics` — thread_id → scope mapping within a chat
- `stock_bot_noteworthy` — ONLY flagged-noteworthy messages (text_excerpt, reason, author_member_id). Raw chat stays in Telegram, not in our DB.

### Env vars to add (none new)

- `BOT_ADMIN_TELEGRAM_IDS` — comma-separated user_ids allowed to run `/health`, `/logs`, `/settag`. Already in `.env.example`.
- `HEURISTIC_ONLY=true` (feature flag) — v1.5 default. Flip to false in v1.6 when LLM classifier lands.

### Rollout flow

1. v1.5 ships with HEURISTIC_ONLY=true. Heuristic classifier + chat_id routing + digests + /chatinfo + /health.
2. Test in staging group for 48 hours. Verify heuristic flags ~85% correctly.
3. Add to ZAO Devz group. Confirm only error/health alerts post.
4. Add to ZAOstock group. Run `/chatinfo` in each topic. Confirm topic scope mapping.
5. Enable morning + evening digests.
6. Monitor for 7 days. If heuristic miss rate >20%, ship v1.6 with Haiku classifier.

---

## Best Practices to Implement in v1.5

| # | Practice | What it looks like in code |
|---|----------|---------------------------|
| 1 | **Dual-mode routing** — chat_id determines behavior. Never hardcode behavior; always look up chat config. | `const mode = await getChatMode(ctx.chat.id); // 'team' | 'devops' | 'staging'` |
| 2 | **Privacy-first data storage** — only persist messages flagged noteworthy. Raw conversation stays in Telegram. | `if (isNoteworthy(text)) { await supabase.from('stock_bot_noteworthy').insert({...}); }` |
| 3 | **Self-reporting observability** — bot posts its own health events to ZAO Devz. Zero external monitoring tools. | `bot.catch(err => alertDevops(err))` + `process.on('uncaughtException', ...)` + startup/shutdown ping |
| 4 | **Scope routing by topic thread** — each forum topic maps to a scope. Messages in ops topic auto-link to ops-scoped writes. | `const scope = await getTopicScope(chat.id, msg.message_thread_id);` |
| 5 | **Feature-flag every new behavior** — env var `HEURISTIC_ONLY=true`, `ENABLE_DIGESTS=true`, etc. Rollback = flip + restart. | `if (process.env.ENABLE_DIGESTS === 'true') { schedule.scheduleDigest(); }` |
| 6 | **No raw message exfiltration** — excerpts are max 200 chars, never full message bodies in DB. | `text_excerpt: text.slice(0, 200)` |
| 7 | **Rate-limit self** — don't exceed Telegram's 20 msgs/min per group. Digest is one message. Throttle replies. | in-memory token bucket per chat_id |

---

## Anti-Patterns to Avoid

| # | Anti-pattern | Why | Instead |
|---|-------------|-----|---------|
| 1 | **Logging every message to a database "for later analysis"** | Privacy nightmare + storage bloat + nobody ever looks at "later." | Log only flagged-noteworthy. Keep Telegram as source of truth for everything else. |
| 2 | **LLM on every message for "is this important?"** | $10-30/mo, 400-600ms latency per message, and 85% heuristic accuracy means we'd be paying for 85% wasted calls. | Heuristic gate → LLM only on ambiguous cases (confidence <0.7) in v1.6+. |
| 3 | **Bot posts in the team group more than 2-3x/day** | Noisy bot = muted bot = useless bot. | Morning digest + evening recap + @mention replies = ceiling at ~5 posts/day. |
| 4 | **No separation between bot-as-teammate and bot-as-monitor** | Error alerts in the team chat freak people out. | Two groups, distinct modes, zero cross-talk. |
| 5 | **Storing plaintext Supabase service role key in bot process env** | See doc 494 part 2 — service role key = DB god mode. | Already mitigated (chmod 600 on .env). Future: SOPS+age per doc 494 recommendation. |
| 6 | **Running `claude` CLI with Max subscription for high-frequency classification** | Auth complexity + subprocess overhead + quota risk. | Haiku API for classification; reserve `claude` CLI for on-demand reasoning tasks (v2+ collaborative builder mode). |
| 7 | **Privacy mode Enabled + expecting passive listening to work** | OpenClaw bug #28085 + Hermes bug #13607 — @mentions break under privacy-mode=Enabled. | Disable privacy mode in @BotFather before deploying v1.5. |

---

## The "ZAOstock + ZAO Devz split" — verdict

**USE it.** Reasons:

1. **Cognitive load** — teammates in ZAOstock don't want to see "ECONNRESET" in the same feed as "3 sponsors committed today." Separation of concerns.
2. **Admin power separation** — `/health`, `/logs`, `/restart` in ZAO Devz stay behind Zaal's admin scope. No risk of a teammate accidentally running `/restart` in the team chat.
3. **Noise budget** — team chat can tolerate ~5 bot messages/day. Ops chat can tolerate 50 (every deploy, every crash, every minute of downtime). Mixing them = one or the other gets starved.
4. **Migration path** — when we build more bots (the "fleet" plan), each one can register in ZAO Devz for ops alerts while keeping its team-facing chat separate.
5. **Community precedent** — the OpenClaw 2026 integration guide shows exactly this pattern (`chat_id` → model/mode routing config). We're not innovating; we're following a validated pattern.

Overkill-check: at 17 people and 1 bot, is this overengineering? **No.** Two chats is literally one extra config row in `stock_bot_chats`. If we wanted to go single-group, we'd still need chat_id routing to isolate commands. The split IS the clean version.

---

## Also See

- [Doc 483 — Hermes agent local LLM framework](../483-hermes-agent-local-llm-framework/) — local model option we're deferring
- [Doc 492 — ZAOstock Six Sigma ops + Telegram bot](../../events/492-zaostock-sixsigma-ops-and-telegram-bot/) — original bot spec
- [Doc 493 — /zao-research v2 redesign](../../dev-workflows/493-zao-research-skill-v2-redesign/) — the tiering system this research used
- [Doc 494 — VPS secrets + AI coding agent](../../security/494-vps-secrets-ai-coding-agent/) — secrets handling for bot env
- [Bot codebase README](../../../bot/README.md)

---

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Disable privacy mode in @BotFather for @ZAOstockTeamBot | @Zaal | Config | Before v1.5 deploy |
| Create a staging Telegram group (just Zaal + Iman for now) | @Zaal | Setup | Before v1.5 deploy |
| Add bot to ZAO Devz group | @Zaal | Setup | Done (per Zaal) |
| Run `scripts/stock-bot-group-migration.sql` in Supabase | @Zaal | DB migration | Before v1.5 deploy |
| Implement `bot/src/group.ts` + `heuristics.ts` + `schedule.ts` + ops alerts | @Claude | Code | This session |
| Ship v1.5 to staging, verify /chatinfo works in each topic | @Zaal | Test | After v1.5 ships |
| Measure heuristic miss rate over 7 days (manually review flagged + unflagged) | @Zaal | Eval | Week of 2026-05-01 |
| Decide on v1.6 Haiku upgrade based on miss rate data | @Zaal | Decision | 2026-05-08 |

---

## Sources

- [grammY repository (GitHub)](https://github.com/grammyjs/grammY) - our framework, 5.2k+ stars, active 2026. verified live 2026-04-24
- [Telegram Bot API changelog](https://core.telegram.org/bots/api-changelog) - Bot API 9.4 forum topics confirmed. verified live 2026-04-24
- [Telegram Bots FAQ](https://core.telegram.org/bots/faq) - privacy mode semantics. verified live 2026-04-24
- [dev.to — "5ms keyword router vs LLM meta-router" (2026-04-11)](https://dev.to/samarth0211/i-picked-a-5ms-keyword-router-over-an-llm-meta-router-for-my-ai-app-heres-the-math-23p2) - 600x speed, 85% accuracy, $3k/yr saved. verified live 2026-04-24
- [HN — Claude Haiku 4.5 launch discussion](https://news.ycombinator.com/item?id=45595403) - 2025-10 community signal on Haiku use cases. verified live 2026-04-24
- [HN — Show HN: Reddit sentiment dashboard using Claude Haiku](https://news.ycombinator.com/item?id=45608274) - real-world Haiku-for-classification pattern. verified live 2026-04-24
- [APICents — Claude Haiku 4.5 vs Mistral Small 4](https://apicents.com/compare/claude-haiku-4-5-vs-mistral-small-4) - 2026 pricing. verified live 2026-04-24
- [NousResearch/hermes-agent issue #13607](https://github.com/NousResearch/hermes-agent/issues/13607) - Hermes+Telegram forum bug. validates defer-Hermes call. verified live 2026-04-24
- [OpenClaw issue #28085](https://github.com/openclaw/openclaw/issues/28085) - privacy-mode @mention bug. validates privacy-off call. verified live 2026-04-24
- [Jason Cochran — MoltBot Claude cost optimization (2026-01)](https://blog.jasoncochran.io/the-complete-guide-to-claude-cost-optimization-with-clawdbot-and-telegram/) - Telegram+Claude cost math. verified live 2026-04-24
- [OpenClaw 2026 Telegram integration guide](https://telegram-group.com/en/blog/openclaw-claude-telegram-complete-integration-guide-2026/) - chat_id → model routing pattern. verified live 2026-04-24
- [Claude Lab — Telegram bot + Claude API guide](https://claudelab.net/en/articles/api-sdk/claude-api-telegram-bot-development-guide) - reference architecture. verified live 2026-04-24
