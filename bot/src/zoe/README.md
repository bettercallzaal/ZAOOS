# bot/src/zoe — ZOE concierge brain

Replaces the openclaw container with a Hermes-style Claude Code CLI subprocess bot.

ZOE is Zaal Panthaki's personal concierge running on @zaoclaw_bot. Daily tasks, captures, proactive nudges, recall via Bonfire bridge.

## Architecture (Letta-inspired memory blocks)

Every concierge turn assembles 4 named blocks of context and invokes Claude Code CLI:

```
<persona>     — ZOE identity + Year-of-the-ZABAL voice rules
<human>       — Zaal facts (ENS, schedule, projects, relationships)
<working>     — last 5 turns from this Telegram thread
<tasks>       — open task queue snapshot
```

Then: `Zaal: <user message>` appended.

Claude responds. If response includes a JSON block with task_ops or captures, apply them. Reply text goes back to Zaal in Telegram.

## Files

| File | Purpose |
|---|---|
| `index.ts` | Telegram polling main entry, dispatch, scheduler boot |
| `concierge.ts` | runConciergeTurn — Claude CLI call + reply parsing |
| `memory.ts` | Memory block builder + persistence (~/.zao/zoe/) |
| `tasks.ts` | Task queue read/write + seed initial todos |
| `recall.ts` | Bonfire bridge (manual relay until SDK lands) |
| `brief.ts` | Morning brief generator (5am EST daily) |
| `reflect.ts` | Evening reflection generator (9pm EST daily) |
| `scheduler.ts` | node-cron triggers, no quiet hours |
| `types.ts` | Shared types + cost-routing helpers |

## Storage layout (host)

```
~/.zao/zoe/
  persona.md         — versioned in repo, copy on first boot
  human.md           — local cache, refreshed daily (Zaal facts)
  recent.json        — last 5 turns, FIFO ring buffer
  tasks.json         — open task queue
  sentinels/         — daily flags to prevent double-fires (e.g. morning-brief-2026-05-04.flag)
```

## Env vars

| Var | Required | Notes |
|---|---|---|
| `ZOE_BOT_TOKEN` or `TELEGRAM_BOT_TOKEN` | yes | @zaoclaw_bot Telegram token |
| `ZAAL_TELEGRAM_ID` | yes | Zaal's Telegram user_id (allowlist guard) |
| `ZOE_REPO_DIR` | no | default `/home/zaal/zao-os` |
| `ZAO_DEVZ_CHAT_ID` | no | for hourly tip cron (Phase 4) |
| `BONFIRE_API_KEY` | no | once Joshua.eth provisions, recall.ts uses SDK |
| `BONFIRE_ID` | no | bonfire UUID |
| `BONFIRE_AGENT_ID` | no | agent UUID |
| `ZOE_DEFAULT_MODEL` | no | default `sonnet` |
| `ZOE_HARD_MODEL` | no | default `opus` |
| `ZOE_QUICK_MODEL` | no | default `haiku` |

## Cost routing (Sprint 1 pattern from Hermes)

- Default: Sonnet (cheap, fast, $0 marginal via Max plan)
- Hard reasoning: Opus (when LLM self-flags `escalate: true` in JSON output)
- Quick factual: Haiku (auto-routed for short factual queries)

Hard cap: 50 LLM calls/day (alert if exceeded).

## Run locally (dev)

```bash
cd bot
pnpm install
ZOE_BOT_TOKEN=... ZAAL_TELEGRAM_ID=... pnpm tsx src/zoe/index.ts
```

## Production (VPS)

Add to existing `zao-devz-stack.service` systemd user unit, or create separate `zoe-bot.service`. Token comes from `bot/.env` or systemd `EnvironmentFile=`.

## Phase status (per doc 601)

- [x] Phase 1 scaffold — types, concierge, memory, tasks, recall, brief, reflect, scheduler, index, README (this commit)
- [ ] Phase 2 cutover — move TELEGRAM_BOT_TOKEN from openclaw to bot/.env, register zoe in systemd unit, test from phone
- [ ] Phase 3 — fold Devz bot into Hermes webhook
- [ ] Phase 4 — replace zoe-learning-pings python cron
- [ ] Phase 5 — Letta-style self-improving `human` block updates
- [ ] Phase 6 — TradingAgents debate mode for social/PM decisions (deferred per Zaal 2026-05-04)

## Anti-patterns (from doc 604 + openclaw experience)

- Never silent retry on empty result (openclaw's "·" ping bug)
- Never ask "Would you like me to..." — just do it
- Never claim memory state changes that didn't occur (doc 581)
- Empty-reply guard: validate response >5 chars before posting
- Quiet hours: NONE per Zaal feedback 2026-05-04 (rather get pinged than ignored)

## Related docs

- doc 461 — fix-PR pipeline (Hermes runtime pattern)
- doc 547 — multi-agent coordination
- doc 568 — local KG memory stack alternatives
- doc 570 — agentic memory architecture
- doc 581 — bot bug postmortem
- doc 599 — bridge group pattern (deferred autonomy)
- doc 600 — agentic stack v1 inventory
- doc 601 — Hermes-as-ZOE-brain decision (Option D)
- doc 603 — TradingAgents debate pattern (saved for Phase 6)
- doc 604 — best concierge agents 2026 (this scaffold's source of truth)
