# Zaostock Hermes Bot — Design

**Status:** planned, not built
**Date:** 2026-04-29
**Repo target:** bettercallzaal/zaostock-bot (alongside command bot)
**Brain:** Claude Code CLI on VPS (uses Max subscription)
**Mode:** on-demand only, no scheduled jobs
**TG bot:** new token from @BotFather (e.g. @ZAOstockHermesBot) — separate from @ZAOstockTeamBot

---

## What it is

An agentic Telegram bot that answers questions and runs research for the ZAOstock team. Lives in the same repo as the command bot but runs as a separate daemon with its own TG token.

The command bot is rule-based (regex match → Supabase query → reply). Hermes is open-ended — you ask a question in natural language, it figures out which sources to consult, runs the research, and returns a synthesized answer.

## What it can read

Three data sources, ranked by speed:

| Source | Latency | Use for |
|--------|---------|---------|
| **zaostock Supabase** (NEW project, live data) | 100-300ms | Team status, sponsor pipeline, overdue todos, activity log, budget snapshot |
| **`research/` folder** (`/home/node/zaostock-bot-workspace/zaoos/research/`, ~570 docs) | <1s grep | Past ZAO research, decisions, pitches, lessons |
| **Web** (Exa MCP via Claude Code CLI) | 5-30s | Anything outside ZAO — vendor pricing, similar festivals, current events, market data |

Hermes picks the right source automatically based on the question — no need for the user to specify.

## Commands

### Tier 1 — Fast (DB + research/ folder only)

| Command | Returns |
|---------|---------|
| `/brief` | "What's changed in the last 24h" — pulls activity_log, new sponsors, status changes, overdue items, recent meeting notes. ~5s. |
| `/status <area>` | Targeted snapshot. Areas: `team`, `sponsors`, `artists`, `budget`, `circles`, `todos`, `timeline`, `meetings`. ~3s. |
| `/recall <keyword>` | Greps `research/` for past ZAO docs matching keyword. Returns top 3 with 2-line summary each + paths. ~5s. |
| `/whoami` | Shows linked team member info (replicates command bot, included for convenience). |

### Tier 2 — Slow (web + DB combined)

| Command | Returns |
|---------|---------|
| `/research <topic>` | Open web research. Hermes calls Exa, summarizes, cross-references with internal docs. ~15-30s. Uses streaming "researching..." messages so user sees progress. |
| `/ask <question>` | Open question. Hermes decides which sources to use, may chain multiple. The general-purpose endpoint when no specific command fits. ~10-30s. |

### Tier 3 — Reflective

| Command | Returns |
|---------|---------|
| `/decide <question>` | Frames a decision. Pulls relevant context from all 3 sources, lays out options + tradeoffs, recommends one. Useful for things like "should we book Wallace Events this week?" or "is Steve Peer worth pitching now or later?". |
| `/audit <area>` | Looks for risks or gaps in a given area. e.g. `/audit budget` → flags overcommitment, missing categories. `/audit timeline` → lists overdue + unrealistic dates. |

## Architecture

```
Telegram                                     VPS (Hostinger 31.97.148.88)
   |                                            |
   |  /research wallace events tent quote      |
   v                                            v
[@ZAOstockHermesBot] -- grammy --> [hermes daemon] -- spawn --> [claude CLI subprocess]
                                          |                              |
                                          |                              v
                                          |                       [Anthropic Max sub
                                          |                        via Claude Code CLI]
                                          |                              |
                                          v                              v
                                   Supabase REST                   Exa MCP / Web
                                   (NEW zaostock)                  research/ folder
                                                                   (local clone)
```

### Why Claude Code CLI not Anthropic SDK direct

- Reuses the existing Max subscription on the VPS (no new API billing)
- Inherits MCP servers already configured for ZOE (Exa, Supabase, etc) — hermes gets web search + DB access for free
- Same pattern as ZOE/QuadWork — proven on this box already

### How a single command gets answered

```
User: /research what tent rental costs in Maine for 200 people

1. Hermes daemon receives Telegram message
2. Sends "researching..." typing indicator + placeholder reply
3. Spawns: claude --print "research tent rental costs Maine 200 people"
   - Claude has Exa MCP, web access
   - Returns markdown summary
4. Hermes formats for Telegram (plain text, no markdown rendering issues)
5. Edits the placeholder reply with the answer
6. If answer >4000 chars (Telegram limit), splits into 2-3 messages
7. Logs query + answer to a hermes_runs table for audit + future improvement
```

## Auth model

Same as command bot — only team members linked via `/link <name>` can use hermes. Public users get "DM @bettercallzaal for access" auto-reply.

Use the existing `team_members.telegram_id` linkage. Hermes shares the auth helper with the command bot.

## Files (when we build it)

```
src/hermes/
├── index.ts              entry point, grammy bot wiring
├── claude-cli.ts         spawn + parse Claude CLI subprocess
├── auth.ts               check tg_id is linked team_member
├── commands.ts           command handlers (/brief, /status, /research, etc)
├── context/
│   ├── db.ts             pulls live snapshots from Supabase for prompt context
│   ├── research.ts       greps research/ folder for relevant docs
│   └── prompt.ts         builds the Claude system prompt with all 3 sources
└── format.ts             markdown -> telegram, length splitting
```

## DB additions (new migrations on zaostock Supabase)

```sql
-- track every hermes invocation for audit + later improvement
CREATE TABLE hermes_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES team_members(id),
  command text NOT NULL,
  query text,
  response text,
  sources jsonb DEFAULT '{}'::jsonb,    -- which sources were consulted
  duration_ms integer,
  cost_estimate_usd numeric(10,4),       -- always 0 since Claude Max sub, but tracked anyway
  created_at timestamp with time zone DEFAULT now()
);
CREATE INDEX hermes_runs_member_idx ON hermes_runs(member_id, created_at DESC);
CREATE INDEX hermes_runs_recent_idx ON hermes_runs(created_at DESC);

ALTER TABLE hermes_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON hermes_runs FOR ALL USING (true) WITH CHECK (true);
```

## Open questions to revisit when we build

1. **Concurrency:** if 3 people invoke `/research` at the same time, do we queue or spawn 3 Claude subprocesses? (Default: spawn, claude CLI handles it.)
2. **Rate limit per user:** cap commands per minute? (Default: 10/min.)
3. **Cost ceiling:** Claude Max sub is unlimited, but if we ever switch to API, need a daily ceiling. (Defer.)
4. **MCP scoping:** does hermes' Claude subprocess inherit ZOE's MCP servers, or does it need its own list? (Need to test on VPS — likely needs own `.mcp.json` in workspace.)
5. **`/decide` and `/audit`:** these tier-3 commands are aspirational. Build tier-1 + tier-2 first, then add 3 only if there's demand.
6. **research/ folder access:** zaostock-bot repo doesn't naturally include research/. Either:
    - a) Clone ZAOOS in workspace as a sibling, hermes greps it (separate sync needed)
    - b) Pull research/ docs into zaostock Supabase as a separate `research_docs` table (decouples bot from ZAOOS repo)
    - c) Use openclaw gateway to ZOE who has the research/ folder already
   Decide at build time.

## Proposed build sequence

1. Stand up the command bot in the new repo first (no hermes yet)
2. Get the command bot stable on NEW Supabase
3. Add hermes skeleton — empty bot, just `/whoami` + `/brief` (DB-only, simplest)
4. Add `/status` and `/recall` (still local, no Claude CLI yet)
5. Wire Claude CLI subprocess for `/research`, `/ask`
6. Add `/decide` and `/audit` if there's demand

Don't build all of this in one go — ship tier 1 first.

## Acceptance criteria (when built)

- Linked team member runs `/brief` in TG → gets a markdown summary of last 24h activity within 10s
- `/research wallace events tent` → returns 5+ web sources synthesized within 30s
- `/recall steve peer` → finds and surfaces past ZAO research docs about Steve Peer
- `/status sponsors` → tabular summary of sponsor pipeline by tier
- All hermes invocations logged to `hermes_runs` for review
- Only linked team members can invoke; non-linked users get auto-rejection

---

**Build trigger:** when user says "build hermes" or "kick off the agentic bot." Until then this doc is the spec.
