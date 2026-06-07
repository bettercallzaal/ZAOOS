# Bot ↔ Coworking API (ZAOOS side)

How the ZAO bot fleet talks to **cowork-zaodevz** over its REST API.

- **Contract source of truth:** `cowork-zaodevz/docs/BOT-API.md` (PR #63). If a field
  changes there, change it here + in `bot/src/lib/cowork.ts`.
- **Client:** `bot/src/lib/cowork.ts` — dormant by default, fault-tolerant.
- **Fleet status:** `bot/REGISTRY.md`.

## Endpoints (all `Authorization: Bearer <per-bot token>`)

| Method | Path | Body | Returns |
|--------|------|------|---------|
| POST | `/api/v1/items` | `{title, assignee?, due_date?, notes?, source?}` | `{id}` (legacy `#N`) |
| PATCH | `/api/v1/items/:id` | `{status?, assignee?, due_date?, notes?}` | updated task |
| POST | `/api/v1/bots/heartbeat` | `{status?, meta?}` (bot = the token) | ok |
| GET | `/api/v1/bots` | — | `{bots:[{bot,status,ts,meta,online,ageSeconds}]}` |

**Field mapping** (client field → cowork): `assignee`→owner (name; unknown → `Open`),
`due_date`→`due` (YYYY-MM-DD), `notes`→`notes`, `source`∈`TASK_SOURCES` (default
`human-bot`). `id` is always the legacy `#N`, not the UUID. Status accepts
`TODO|WIP|BLOCKED|DONE|TRIAGE` (lowercase / `in_progress` also tolerated).

## Per-bot scope

| Bot | Uses | Notes |
|-----|------|-------|
| **Hermes** | `markDone` (non-merge only), `heartbeat` | Merge-driven closes are auto-handled by cowork's GitHub webhook + `/api/v1/auto-close` (link the PR via `cowork#<id>`). `markDone` is only for closing a task **without** a merge. |
| **ZOE** | `pushItem`, `heartbeat` | `/meeting` + captures push action-items here instead of Octokit. |
| **ZAO Devz** | `heartbeat`, `pushItem` (opt) | |
| **ZAOstock** | `heartbeat` | |
| Bonfire / DeepMeeting | — | Bonfires-platform, not cowork callers. |

## Env (per bot process — each systemd unit gets its own token)

```
COWORK_API_URL=https://<cowork-app-host>
COWORK_BOT_TOKEN=tok_…        # this bot's token (identifies it server-side)
```

If either is unset the client is **dormant**: every call returns `{ok:false, skipped:true}`
and never touches the network. So the fleet is safe to deploy before the cowork side
is configured.

## Client usage

```ts
import { pushItem, markDone, startHeartbeat } from '../lib/cowork';

// ZOE / meeting — push a captured action item
const r = await pushItem({ title: 'Follow up with X', assignee: 'Zaal', source: 'zoe' });
if (r.ok) console.log('cowork item', r.data?.id);

// Hermes — close a task WITHOUT a merge (merge closes are automatic)
await markDone(123, 'handled out-of-band');

// Any bot — heartbeat from startup (no-op while dormant)
const stop = startHeartbeat(60_000, () => 'up', { unit: 'zoe-bot' });
```

## Wire-up status

Heartbeats are **wired into the live bot startups** (env-gated — no-op until tokens exist):

- ✅ **ZOE** (`bot/src/zoe/index.ts`) — `unit: 'zoe-bot'`
- ✅ **ZAO Devz** (`bot/src/devz/index.ts`) — `unit: 'zao-devz-stack'` (covers devz + hermes, same process)
- ✅ **ZAOstock** (`bot/src/index.ts`) — `unit: 'zaostock-bot'`
- ⏳ **Team bots** (`bot/src/teams/index.ts`) — NOT wired; boots Magnetiq/AttaBotty which doc 601 flagged to fold into ZOE. Confirm live before adding.

Still manual (no obvious call site yet):
- **Hermes `pushItem`/`markDone`** — call only where a task is created/closed *outside* the normal PR-merge path (merge closes are auto-handled by cowork's webhook).
- **ZOE / `/meeting` `pushItem`** — wire when the capture→cowork push is built.

## Go-live checklist

**Cowork side (cowork-zaodevz repo):**
1. Set `COWORK_BOT_TOKENS="hermes=…,zoe=…,zaodevz=…,zaostock=…"` on Vercel.
2. Apply `supabase/migrations/010_bot_heartbeats.sql` (heartbeat endpoints 503 gracefully until then).

**ZAOOS side (this repo / VPS):**
3. Set `COWORK_API_URL` + the matching `COWORK_BOT_TOKEN` in each systemd unit's env.
4. Add the `startHeartbeat(...)` line to each bot entry (above).
5. Restart units; confirm via `GET /api/v1/bots`.
