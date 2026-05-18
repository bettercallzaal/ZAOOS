# bot/src/zoe — ZOE concierge brain

Replaces the openclaw container with a Hermes-style Claude Code CLI subprocess bot.

ZOE is Zaal Panthaki's personal concierge running on @zaoclaw_bot. Daily tasks, captures, proactive nudges, recall via Bonfire bridge.

## Architecture (Letta-inspired memory blocks)

Every concierge turn assembles 4 named blocks and passes them to Claude Code CLI as `appendSystemPrompt`. The user's message is passed separately as the prompt:

```
<persona>         — ZOE identity + Year-of-the-ZABAL voice rules + elder/lineage + group behavior
<human>           — Zaal facts (ENS, schedule, projects, relationships)
<working_memory>  — chat scope label + last N turns (per-chat, FIFO)
<tasks>           — open task queue snapshot
```

User prompt: `Zaal: <message>` for DMs or `<First Name>: <message>` for group members.

`persona.md` on disk is the **single source of truth** for ZOE's identity. `memory.ts` seeds `PERSONA_DEFAULT` on first boot; edits to `~/.zao/zoe/persona.md` survive code updates.

Claude responds. If response ends with a JSON block (task_ops + captures + escalate), apply ops + log captures. Reply text goes back to the chat.

## Elder + lineage

ZOE is the elder of the ZAO bot lineage. Child bots (ZAOstockTeamBot, Magnetiq, Attabotty, ZAO Devz, future brand bots) inherit her voice + anti-patterns + format rules verbatim. Children override only domain (what they do) and tools (what they touch).

Template for forging a child: `~/.zao/zoe/bootloader-template.md` (seeded on first boot from `BOOTLOADER_DEFAULT` in `memory.ts`).

## DMs vs groups

| Path | Trigger | Memory scope | Senders |
|---|---|---|---|
| DM | `chat.type === 'private'` and `from.id === ZAAL_TELEGRAM_ID` | `recent/private.json` | Zaal only |
| Group | Configured in `groups.json` AND mode gate passes AND sender in allowlist | `recent/<chat_id>.json` | per-group allowlist |

Group modes (see `groups.ts`):
- `silent` (default for new groups): never reply
- `mention`: reply only when `@zaoclaw_bot` is mentioned or message replies to ZOE
- `all`: reply to every allowlisted sender

Admin commands (Zaal-only):

```
/zg status                       show config for this chat
/zg enable [silent|mention|all]  register chat (default silent, allowlist seeded with Zaal)
/zg mode <silent|mention|all>    change mode
/zg add <user_id>                allowlist a sender (or reply to user with /zg add)
/zg remove <user_id>             remove from allowlist
/zg list                         list all configured groups
```

Unconfigured groups log non-Zaal sender IDs to journal so Zaal can discover Telegram IDs for bootstrap.

## Files

| File | Purpose |
|---|---|
| `index.ts` | Telegram polling main entry, DM + group dispatch, scheduler boot, /zg admin |
| `concierge.ts` | `runConciergeTurn` — Claude CLI call with rendered memory blocks + reply parsing |
| `memory.ts` | 4-block builder + per-chat recent + persona/human/bootloader seeds |
| `groups.ts` | Per-Telegram-chat config (mode + member allowlist + persona override) |
| `tasks.ts` | Task queue read/write + seed initial todos |
| `recall.ts` | Bonfire bridge (manual relay until SDK lands) |
| `brief.ts` | Morning brief generator (5am EST daily) |
| `reflect.ts` | Evening reflection generator (9pm EST daily) |
| `scheduler.ts` | node-cron triggers, no quiet hours |
| `types.ts` | Shared types + cost-routing helpers |

## Storage layout (host)

```
~/.zao/zoe/
  persona.md                 source of truth, seeded on first boot, hand-editable
  human.md                   Zaal facts, refreshed via Bonfire RECALL when SDK lands
  bootloader-template.md     child-bot persona seed
  recent/
    private.json             DM with Zaal (legacy recent.json migrated here)
    <chat_id>.json           per-group working memory, FIFO ring (max 8 turns)
  tasks.json                 open task queue
  groups.json                per-chat group config (mode + allowlist)
  sentinels/                 daily flags to prevent double-fires
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

- [x] Phase 1 scaffold — types, concierge, memory, tasks, recall, brief, reflect, scheduler, index, README
- [x] Phase 2 cutover — TELEGRAM_BOT_TOKEN in bot/.env, zoe-bot.service live
- [x] Phase 2.1 — wire memory blocks into concierge (was bypassed pre-2026-05-13)
- [x] Phase 2.2 — group support (per-chat config, mention gating, member allowlist)
- [x] Phase 2.3 — elder + lineage layer in persona, bootloader-template.md for child bots
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
