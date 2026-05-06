# AGENTS.md - bot/

> Universal agent config for the `bot/` subtree. For repo-wide rules see [../AGENTS.md](../AGENTS.md). For Claude Code specifics see [../CLAUDE.md](../CLAUDE.md).

## What this is

`bot/` is the Telegram bot fleet running on VPS 1 (Hostinger KVM 2, `31.97.148.88`). All bots share the **Hermes canonical pattern** (research [doc 613](../research/agents/613-hermes-canonical-agent-framework/)):

> Each bot is a long-poll `grammy` process. LLM work is delegated to a `claude` CLI subprocess that authenticates via Zaal's Max plan ($0 marginal cost, no API key billing).

If you are about to wire a new LLM call directly to the Anthropic API, **stop**. Use `bot/src/hermes/claude-cli.ts` `callClaudeCli()` instead.

## Active bots

| Bot | Source | Telegram | Purpose |
|-----|--------|----------|---------|
| ZOE | `bot/src/zoe/` | `@zaoclaw_bot` | Single concierge: tasks, captures, brief/reflect, recall, newsletter, social drafts |
| Hermes | `bot/src/hermes/` | `@zoe_hermes_bot` | Autonomous fix-PR pipeline (coder + critic + auto-PR) |
| ZAO Devz | `bot/src/devz/` | `@zaodevz_bot` | Group dispatch + hourly learning tip cron |
| ZAOstock | `bot/src/index.ts` (root) | `@ZAOstockTeamBot` | Festival team coordination - graduates with ZAOstock spinout |

**Rule: no new bots without a numbered research doc + Zaal sign-off.** New brand voices = persona block in `bot/src/zoe/persona.md` or `brand.md`, NOT a new process. Reference `research/agents/601-agent-stack-cleanup-decision/`.

## Commands

```bash
cd bot
npm install
npm run dev            # ZAOstock bot (root index.ts) with watch
npm run dev:devz       # ZAO Devz group bot with watch
npm run start          # ZAOstock production
npm run start:devz     # ZAO Devz production
npm run typecheck      # tsc --noEmit
```

ZOE + Hermes have their own systemd units on VPS:

```bash
ssh zaal@31.97.148.88 'systemctl --user status zoe-bot zaostock-bot zao-devz-stack'
ssh zaal@31.97.148.88 'journalctl --user -u zoe-bot -f'
```

## Stack

- **Telegram:** `grammy` long-poll (NOT webhook)
- **DB:** Supabase via `@supabase/supabase-js` (service-role key, server-side only)
- **Cron:** `node-cron`
- **LLM:** `claude` CLI subprocess via `bot/src/hermes/claude-cli.ts`
- **Local LLM (classify only):** Ollama at `http://localhost:11434` with `llama3.1:8b` via `bot/src/zoe/ollama.ts`
- **Validation:** `zod`
- **Runtime:** `tsx` for dev, `node` via tsx-loader in production systemd

## Memory model (ZOE)

ZOE persists state at `~/.zao/zoe/` on the VPS (Letta-style memory blocks):

| File | Purpose |
|------|---------|
| `persona.md` | ZOE identity + voice (read every concierge turn) |
| `human.md` | What ZOE knows about Zaal |
| `recent.json` | Last N Telegram turns for context |
| `tasks.json` | Open tasks |
| `captures.md` | `note:` / `cc:` / `claude:` prefix captures |
| `facts.md` | Persistent facts (`remember`, `fact`, `fyi`, `actually`, `always`, `never`, `btw`, `note that` triggers) - 8000 char cap |
| `newsletters/<date>.md` | Year-of-the-ZABAL daily entries |
| `sentinels/` | Cron idempotency flags |

**Source-of-truth pointer:** `bot/src/zoe/memory.ts` `ZOE_PATHS` resolves the home dir. Don't hardcode paths.

## Voice + brand

- **`bot/src/zoe/persona.md`** - concierge identity, deployed to VPS at `~/.zao/zoe/persona.md`
- **`bot/src/zoe/brand.md`** - Year of the ZABAL voice rules: no emojis, no em dashes, fact-only, 11 banned slop phrases, 120-200 word cap on newsletter drafts
- New brand voices = new persona block here, NOT a new bot

## Conventions inside `bot/`

- **One file per concern.** Don't pile multiple agents into `index.ts`. New agent = new file under `bot/src/zoe/agents/`.
- **Agent registry** at `bot/src/zoe/agents/index.ts`. Export `name, description, triggers, handle()`.
- **Reply-aware UX.** ZOE detects Telegram reply-to-bot-message and routes to the matching agent's edit mode (see `bot/src/zoe/index.ts` reply handler).
- **Idempotent crons.** Every scheduled trigger writes a sentinel at `~/.zao/zoe/sentinels/<trigger>-<date>.flag` to prevent double-fires on restart.
- **No API-key LLM calls.** Use `callClaudeCli()` (Max plan auth) for writing tasks. Use Ollama for free classify/short-answer (`ollamaClassify`, 90s timeout for cold start).
- **Group vs DM.** Hourly learning tips go to ZAO Devz group (`devzChatId`). Brief + reflect go to Zaal DM. Don't cross the streams.

## Boundaries

### Always Do

- Validate Telegram input with Zod before passing to handlers
- Read existing memory blocks before responding (`buildFactsBlock`, `buildHumanBlock`, etc.)
- Log via `console.log`/`console.error` - systemd journal captures everything
- For destructive ops (delete tasks, clear facts), require explicit user confirmation via reply

### Ask First

- Adding a new bot or new Telegram process
- Changing `~/.zao/zoe/` schema or paths
- Wiring a new direct-API LLM (vs `claude` CLI)
- Adding a cron that pings Zaal more than once an hour

### Never Do

- Hardcode `ANTHROPIC_API_KEY` in source - use `callClaudeCli()`
- Write to `~/.zao/zoe/` from anywhere outside `memory.ts` helpers
- Spawn `claude` CLI without `stdio: ['ignore', 'pipe', 'pipe']` (systemd needs stdin closed - regression caught 2026-05-06)
- Pass `bare: true` to `callClaudeCli` - it skips Max plan OAuth and breaks auth
- Push admin/cron messages directly via `curl` to Telegram API without also calling `pushRecent()` - concierge memory misses them (see `feedback_admin_pushed_msgs_not_in_concierge_memory.md`)

## Secret hygiene

`.env` lives at `~/zaostock-bot/.env` (chmod 600) on VPS, never in repo. Re-provision via:

```bash
bash bot/scripts/sync-supabase-env.sh   # pulls keys from local .env.local
```

Required vars: `TELEGRAM_BOT_TOKEN`, `ZOE_TELEGRAM_BOT_TOKEN`, `HERMES_TELEGRAM_BOT_TOKEN`, `ZAOSTOCK_BOT_TOKEN`, `ZAAL_TELEGRAM_ID`, `DEVZ_CHAT_ID`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `BONFIRE_API_KEY`, `BONFIRE_AGENT_ID`.

Follow `.claude/rules/secret-hygiene.md` for any commit that touches `.env`-adjacent code.

## Key files

| File | Purpose |
|------|---------|
| `bot/src/hermes/claude-cli.ts` | `callClaudeCli()` - the canonical LLM entrypoint |
| `bot/src/hermes/runner.ts` | coder + critic + auto-PR pipeline |
| `bot/src/zoe/index.ts` | ZOE main grammy bot |
| `bot/src/zoe/concierge.ts` | per-turn LLM prompt builder + dispatch |
| `bot/src/zoe/memory.ts` | `ZOE_PATHS`, memory block readers/writers |
| `bot/src/zoe/scheduler.ts` | morning brief, evening reflect, hourly tip crons |
| `bot/src/zoe/agents/` | per-agent modules (recall, research, newsletter, zaostock) |
| `bot/src/zoe/persona.md` | ZOE identity (deployed to VPS) |
| `bot/src/zoe/brand.md` | Year of the ZABAL voice rules |
| `bot/src/zoe/USERGUIDE.md` | end-user (Zaal) command reference |

## Related research

- [Doc 613 Hermes canonical agent framework](../research/agents/613-hermes-canonical-agent-framework/)
- [Doc 607 Three bots one substrate](../research/agents/607-three-bots-one-substrate/)
- [Doc 614 Bonfire ontology](../research/agents/614-bonfire-ontology/)
- [Doc 615 Pipeline audit](../research/agents/615-zoe-pipeline-audit/)
- [Doc 618 AGENTS.md spec audit](../research/dev-workflows/618-agents-md-spec-zaoos-audit/)
