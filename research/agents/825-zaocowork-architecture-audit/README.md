---
topic: agents
type: audit
status: research-complete
last-validated: 2026-06-08
related-docs: "650, 668, 679, 712, 800, 801, 816, 824"
original-query: "audit the whole project of zaocowork and how things connect together"
tier: STANDARD
---

# 825 - ZAOcowork: whole-system architecture + how it connects

> **Goal:** One map of the entire ZAOcowork (cowork-zaodevz) system - the web app, the database, both API surfaces, the Telegram agent, the bot control plane, the GitHub integration, and the three machines they run on - and how every piece talks to every other.

Internal-state audit. Sources: the cowork repo (`ZAODEVZ/ZAOcowork` on the COWORK box + GitHub), the Supabase DB (`etwvzrmlxeobinrlytza`) via the MCP, and the live bots box - all read directly, marked `[FULL]` below.

## Key findings (read first)

| # | Finding | So what |
|---|---------|---------|
| 1 | **One Supabase DB (`etwvzrmlxeobinrlytza`) is the hub.** The web app, the Telegram agent, and the bot fleet all read/write the same `tasks` table. | Single source of truth - good. But 6 different writers converge here (see section 5); keep inserts going through the DB's id assignment (014/015). |
| 2 | **Three machines + Vercel, one DB.** Web on Vercel; Telegram agent on the COWORK box (187.77.3.104); bots on the BOTS box (31.97.148.88). | No single host is the system; a map is needed to reason about any change. This doc is that map. |
| 3 | **ZAOcowork is a full ops/CRM/PM platform, not a todo list.** 23 tables: PM (tasks/deps/proposals), people (team/circles), taxonomy (brands/projects), events-CRM (sponsors/artists/volunteers/contacts/meeting_notes), planning (budget/goals), audit/notify, and the bot control plane. | Several CRM/event tables are ZAOstock-era and may be dormant - candidate for a use audit (finding 6). |
| 4 | **Two API surfaces with different auth.** Internal `/api/*` (session cookie) for the board; external `/api/v1/*` (bot token, some dual) for bots + the control plane. | Clean separation. The dual-auth reads (`/api/v1/bots*`) are the bridge that lets the board render machine data. |
| 5 | **The bots box runs an untracked snapshot** (`~/zaostock-bot`) for the devz + zaostock units, not the git clone. | Drift risk (carried from doc 816). zoe-bot runs from the git clone; the other two from a hand-patched snapshot. |
| 6 | **DDL is dashboard-only** (the `supabase-cowork` MCP is read-only; no DB password on the boxes). | Every migration (010-015) is pasted into the Supabase SQL editor by Zaal. Known friction. |

## 1. The system map

```
                         Supabase  etwvzrmlxeobinrlytza   (the hub - 23 tables)
                          tasks(460) team_members(4) projects circles brands
                          bot_heartbeats/events/commands  task_dependencies/proposals
                          sponsors artists volunteers contacts meeting_notes budget goals
                          activity_log audit_logs comment_notifications task_source_cache
                              ^              ^                         ^
              service key /   |  service key |          service key   |  bot tokens
              PostgREST       |              |                        |
                              |              |                        |
        +---------------------+      +-------+--------+      +--------+-----------------+
        |  WEB APP (Vercel)   |      | TELEGRAM AGENT |      |  BOT FLEET (control plane)|
        |  thezao.xyz         |      | @ZAOcoworking  |      |  zoe / zaodevz / zaostock |
        |  ZAODEVZ/ZAOcowork  |      | COWORK box     |      |  BOTS box 31.97.148.88    |
        |  Next 15            |      | 187.77.3.104   |      |  ZAOOS bot/src/lib/cowork |
        |  session-cookie auth|      | /root/.../agent|      |  + zao-fleet-agent(staged)|
        +----------+----------+      +----------------+      +---------------------------+
                   |  /api/v1 (bot token)            ^                    |
                   |  + GitHub webhook               | heartbeat/events/  |
                   v                                 | commands (POST/GET)|
            GitHub  ZAODEVZ/ZAOcowork  <-- auto-close on PR merge --------+
            (PRs linked via cowork#<id>, source-resolver + /api/v1/auto-close)
```

## 2. Web app (thezao.xyz)

- **Repo/deploy:** `ZAODEVZ/ZAOcowork`, Next.js 15 App Router, `next build` -> Vercel -> thezao.xyz. Push to `main` auto-deploys.
- **Pages:** `/` (board), `/my-work`, `/activity`, `/todo`, `/shipped` (public, default-deny), `/bots` (control plane), `/chat` (AI assistant), `/admin`, `/settings`, `/marketing`, `/music`, `/login`.
- **Auth:** `lib/auth.ts` - HMAC-signed cookie (`iman-session`), `AUTH_SECRET` on Vercel. 4-tier model (Auto/Notify/Ask/Block); `getSession`/`isAdmin`/`isLead`. 4 team users in `team_members` + env-password fallback for the founding roster.
- **Internal API (`/api/*`, session-authed):** `chat`, `dependencies`, `digest`/`my-digest`, `forecast`, `github` (webhook), `my-mentions`, `proposals`, `repo-activity`, `search`, `source-status`, `tasks-min`.
- **Lib spine:** `data.ts` (task read/write + id mapping), `team.ts`, `projects.ts`, `brands-db.ts`, `dependencies.ts`/`dep-flow.ts`, `proposals.ts`, `mentions.ts`/`notify.ts`/`comment_notifications`, `source-resolver.ts`/`source-status.ts`/`auto-close.ts` (GitHub), `bot-auth.ts`, `supabase-server.ts`, `telegram.ts`, `public-feed.ts`, `audit.ts`, `rate-limit.ts`.

## 3. External contract + control plane (`/api/v1/*`)

The machine-facing surface (doc 800). Auth = per-bot Bearer token (`bot-auth.ts`, `COWORK_BOT_TOKENS` on Vercel); the read endpoints also accept a session cookie so the board can render them.

| Endpoint | Auth | Used by |
|----------|------|---------|
| `POST/PATCH /api/v1/items[/:id]` | bot token | ZOE pushItem, Hermes markDone, /meeting append-actions |
| `POST /api/v1/auto-close` | cron token | GitHub-merge auto-close (poll + webhook) |
| `POST /api/v1/bots/heartbeat` | bot token | every bot, 60s liveness + meta |
| `GET /api/v1/bots` | bot token OR session | /bots board |
| `POST /api/v1/bots/events` + `GET /api/v1/bots/:bot/events` | bot / dual | activity feed |
| `POST /api/v1/bots/commands` (enqueue) | session + isAdmin | board control buttons |
| `GET /api/v1/bots/commands` (?bot / ?scope=host) | bot token | bot-self poll / fleet-agent |
| `POST /api/v1/bots/commands/:id/result` | bot token | command result |
| `GET /api/v1/bots/:bot/commands` | bot / session | board command history |

Bot clients live in **ZAOOS** `bot/src/lib/cowork.ts` (heartbeat/events/commands + `startHeartbeat`/`startHeartbeatAs`/`startCommandPoller`). Fleet: `zoe`, `zaodevz`, `zaostock` heartbeating; `hermes` staged; `zao-fleet-agent` (whitelisted systemctl) staged + disabled.

## 4. Data model - how the tables connect (tasks at the center)

- `tasks` (460 rows, 29 cols) is the spine. FKs/links: `owner_id -> team_members`, `project_id -> projects`, `circle_id -> circles`, `brands[]` -> `brands`, plus `task_dependencies` (a DAG: blocked<->todo auto-flow via `dep-flow.ts`), `task_proposals` (suggested tasks awaiting approval), `task_source_cache` (GitHub PR state for auto-close), `comment_notifications`/`activity_log`/`audit_logs`.
- `legacy_id` is now a **DB-assigned sequential number** (migrations 014 renumber + 015 trigger `tasks_slug_guard` + sequence `tasks_legacy_id_seq`); a non-numeric insert is auto-renumbered and the slug stashed in `metadata.source_slug`. The board deep-link is `?task=<legacy_id>` ([[feedback_meeting_todo_links_readback]]).
- **Events-CRM cluster** (`sponsors`, `artists`, `volunteers`, `contact_log`, `meeting_notes`, `budget_entries`, `goals`): the ZAOstock/ops half of the platform (doc 712 CRM). Low/zero approx-row counts - audit for live use.
- **Control-plane cluster** (`bot_heartbeats`, `bot_events`, `bot_commands`): doc 800, keyed by bot name = the token identity.

## 5. Who writes into `tasks` (the convergence)

Six writers, one table:
1. **Board UI** (session) - the primary human path.
2. **Telegram agent** (@ZAOcoworkingBot, COWORK box) - `/`-commands + NL, same Supabase.
3. **`/meeting` `append-actions.sh`** - meeting action items (`legacy_source=meeting:<slug>`).
4. **`zao-tracker`** (Mac) + research-doc/pr-auto rows.
5. **Bots** - ZOE `pushItem`, Hermes `markDone` via `/api/v1/items`.
6. **GitHub auto-close** - PR merge -> `/api/v1/auto-close` flips linked tasks to done.

All converge on the one `tasks` table with the DB owning id assignment - the recent 014/015 fix removed the slug/number drift that broke `?task=` links.

## 6. Infra topology (three machines + Vercel + one DB)

| Surface | Host | Path/Deploy |
|---------|------|-------------|
| Web app | Vercel | `ZAODEVZ/ZAOcowork` main -> thezao.xyz |
| Telegram agent (@ZAOcoworkingBot) | COWORK box `187.77.3.104` | `/root/cowork-zaodevz/agent/` (systemd); same Supabase |
| Bot fleet (zoe/zaodevz/zaostock) | BOTS box `31.97.148.88` | systemd user units; zoe = git clone `~/zao-os`, devz+zaostock = untracked snapshot `~/zaostock-bot` |
| Database | Supabase | `etwvzrmlxeobinrlytza` - web + agent + bots all use it |
| DDL/migrations | Supabase SQL editor | dashboard-only (MCP read-only, no DB pw on boxes) |

## Risks / open items

- **Snapshot drift** (finding 5): devz + zaostock run a hand-patched, untracked `~/zaostock-bot` - changes must be re-patched in place; no git history. Converging onto the git clone is the durable fix.
- **Dormant CRM/event tables** (finding 3): sponsors/artists/volunteers/contacts/meeting_notes/budget/goals look unused post-ZAOstock-spinout - confirm and archive or revive.
- **DDL friction** (finding 6): every schema change is a manual dashboard paste; an `exec_sql` RPC or a stored DB password (secrets-managed) would unblock automated migrations.
- **Mention/tag approval bug** (live, doc 824): tagging a user on a task does not ping ("approve it yourself" error) - already a tracked Zaal task (#457).

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Decide: converge devz+zaostock onto the git clone, or formally track `~/zaostock-bot` | Zaal/Iman | Infra | This week |
| Audit the events-CRM tables (sponsors/artists/volunteers/...) for live use; archive dormant | Zaal | DB | Next |
| Fix the mention/tag approval ping (task #457) | Zaal | Build | This week |
| Consider an `exec_sql` RPC (service-key gated) to end dashboard-only DDL | Zaal | Infra | Low priority |

## Also See

- [Doc 800](../800-cowork-bot-control-plane/) - control plane design
- [Doc 816](../816-cowork-control-plane-and-project-audit/) - control plane + todo/github audit
- [Doc 801](../801-zoe-cowork-systems-audit-consolidation/) - ZOE/cowork systems audit
- [Doc 712](../../business/712-zao-crm-coworking-app/) - CRM-in-cowork
- [Doc 650](../650-cowork-zaodevz-imanagent/) - origin + imanagent

## Sources

- [FULL] Supabase `etwvzrmlxeobinrlytza` - `information_schema` table+column counts, `pg_class` row estimates (23 tables), live (2026-06-08).
- [FULL] Cowork repo on the COWORK box - `src/app/api/*` routes, `src/app/*` pages, `src/lib/*` modules, `agent/` (Telegram bot), `package.json` (2026-06-08).
- [FULL] `/api/v1/*` route inventory + `bot-auth.ts` + `auth.ts` (read this session, docs 800/816).
- [FULL] Bots box `31.97.148.88` - systemd units + snapshot layout (this session).
