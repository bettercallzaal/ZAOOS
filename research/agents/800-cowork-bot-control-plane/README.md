---
topic: agents
type: design-proposal
status: needs-greenlight (scoped with Zaal 2026-06-07; phase 1 ready to build)
last-validated: 2026-06-07
related-docs: "799, cowork docs/BOT-API.md, bot/COWORK_API.md, bot/REGISTRY.md"
original-query: "i want to be able to do wayyy more with the bots on the coworking page with my team"
---

# 800 - Cowork Bot Control Plane

Turn the read-only `thezao.xyz/bots` status board (shipped 2026-06-07: heartbeats +
green/red dots) into a **tiered control plane** the team operates together.

Scoped with Zaal: **all four capabilities**, **tiered access** (everyone observes;
admins control / assign / command).

## Capabilities

| Tier | What the team does | Access |
|------|--------------------|--------|
| **Observe** | Each bot's current task, recent actions, last error, live log tail | everyone (logged-in session) |
| **Control** | start / stop / restart / pause a bot from the UI | admins |
| **Task** | assign a cowork todo to a bot -> it works it, posts result back | admins |
| **Converse** | ask a bot a question from the board, reply inline | admins (it triggers work) |

## Architecture — pull-based command queue (no new inbound VPS access)

The board never connects *to* the VPS. The bots already poll the cowork server every
60s (heartbeat). We extend that: **the board writes commands; bots pull + execute +
report back.** Same trust model we already shipped.

```
board (session + RBAC)  --POST command-->  cowork server (Supabase queue)
bots (bot token)        --GET pending-->   claim -> execute -> POST result
```

**New Supabase table `bot_commands`:**
`id, bot, command, args jsonb, status (pending|claimed|done|error), result jsonb,
created_by, created_at, claimed_at, completed_at`

**New endpoints (extend `/api/v1`):**
- `POST /api/v1/bots/commands` — board enqueues (session-authed, **RBAC-gated**)
- `GET  /api/v1/bots/commands?bot=<self>` — bot pulls its pending (bot-token-authed)
- `POST /api/v1/bots/commands/:id/result` — bot reports outcome (bot-token-authed)
- `POST /api/v1/bots/events` — bot reports activity (bot-token-authed)
- `GET  /api/v1/bots/:bot/events` — board reads activity feed (session-authed)

## Capability → mechanism

- **Observe** — bots enrich heartbeat `meta` (`current_task`, `last_error`, `uptime`)
  and emit activity events on key actions. Board renders a per-bot detail panel + feed.
- **Control** — start/stop/restart/pause are `bot_commands`. **Catch:** a *stopped*
  bot can't poll for its own "start." So host control needs a small always-on
  supervisor (below).
- **Task** — "assign to bot" on a cowork todo enqueues a `run_task` command (todo id +
  instructions). Hermes/ZOE claims it, runs (existing `dispatchHermesRun` / concierge),
  posts result, marks the todo via the `pushItem`/`markDone` contract we already built.
- **Converse** — board enqueues an `ask` command; bot claims, runs a turn, posts the
  reply; board polls + displays. Async chat via the queue (real-time is a later upgrade).

## RBAC (tiered)

The cowork session already exposes `isAdmin` (seen in `getSession` / NavBar). Enforce
in `POST /api/v1/bots/commands`: observe endpoints = any session; control/task/ask =
`isAdmin`. Every command row logs `created_by` for audit.

## ⚠️ Needs Zaal's explicit OK — the fleet-agent (new process)

To start/restart a **stopped** unit from the UI, one small always-on supervisor must
run on the bots box with `systemctl --user` access: `zao-fleet-agent` polls
`GET /api/v1/bots/commands?scope=host`, runs a **whitelisted** op
(`start|stop|restart <known-unit>`) — never arbitrary shell — and reports back.

Per CLAUDE.md ("no new bots/agent process without a doc + Zaal approval"): this doc is
the doc; **the fleet-agent ships only on Zaal's go.** Without it, Control still works
for *running* bots (they self-execute stop/restart), but starting a stopped unit stays
manual (SSH). Task/Converse/Observe do **not** need it.

## Security

- Board->server: session + `isAdmin` gate. Bot->server: per-bot token (already live).
- Bots only ever receive commands addressed to them.
- fleet-agent: whitelist of `{start,stop,restart} x {known units}` only.
- Destructive actions (stop/restart) get a confirm in the UI + audit row.
- No secrets in commands or UI.

## Phased plan (ship + verify each before the next)

- **Phase 1 — Observe** (no new process, pure-additive, immediate value): activity
  events table + endpoints, richer heartbeat meta, per-bot detail panel + feed on /bots.
- **Phase 2 — Control** (needs fleet-agent approval): command queue + start/stop/
  restart/pause buttons, admin-gated.
- **Phase 3 — Task**: cowork todo -> `run_task` -> Hermes/ZOE -> result back.
- **Phase 4 — Converse**: async ask/reply via the queue.

**Recommended start: Phase 1** — it's safe, additive, needs no new process or approval,
and gives the team the "what are the bots doing" view immediately.
