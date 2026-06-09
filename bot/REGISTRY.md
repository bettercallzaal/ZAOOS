# ZAO Bot Registry

Status of every bot/agent in the ZAO fleet — what's live, where it runs, how it's
checked. Mirrors CLAUDE.md "Primary Surfaces"; **update both together.**

_Last updated: 2026-06-08_

## Active fleet

| Bot | Handle | Source | Purpose | Runs on | On board? |
|-----|--------|--------|---------|---------|-----------|
| **ZOE** | `@zaoclaw_bot` | `bot/src/zoe/` | Concierge — tasks, captures, brief/reflect, recall, CRM, social drafts, group dispatch | systemd `zoe-bot` @ bots VPS (from `~/zao-os`, git) | ✅ heartbeat + ask/run_task/pause |
| **Hermes** | `@zoe_hermes_bot` | `bot/src/hermes/` | Autonomous fix-PR pipeline — coder (Opus) + critic (Sonnet) + auto-PR | In-process inside `zao-devz-stack` | ⏳ heartbeat code wired (`hermes` identity); needs token + redeploy |
| **ZAO Devz** | `@zaodevz_bot` | `bot/src/devz/` | Group `/fix` dispatch + hourly tip; dual-bot coder/critic narration | systemd `zao-devz-stack` (from `~/zaostock-bot` snapshot) | ✅ heartbeat + lifecycle |
| **ZAOstock** | `@ZAOstockTeamBot` | `bot/src/index.ts` (root) | Festival team coordination — **graduating** with ZAOstock spinout | systemd `zaostock-bot` (from `~/zaostock-bot` snapshot) | ✅ heartbeat + lifecycle |
| **Team bots** | `@zao_magnetiq_bot`, `@z_attabotty_bot` | `bot/src/teams/` | Magnetiq (design) + AttaBotty (music) personas | systemd `zao-team-bots` (**not running** — no tokens/unit on box) | ⚪ code-ready, dormant (decommissioned, see below) |
| **Bonfire** (reader) | `@zabal_bonfire` | bonfires.ai (agent `69ef…`) | Knowledge-graph recall + ingest | Bonfires platform (Genesis tier, wallet-gated) | ❌ off-VPS (no heartbeat path) |
| **DeepMeeting** | `@zdeepmeeting_bot` | bonfires.ai | GCvlcnti protocol authoring workbench (proposal-only shard) | Bonfires platform | ❌ off-VPS — ⚠️ **DM works, group routing broken** (Plat0x ticket) |

## Control plane (the `/bots` console — doc 800, shipped 2026-06-07)

Live team console at **`thezao.xyz/bots`** (session-gated; observe = any teammate, control/task = admins). Pull-based — bots poll the cowork server; the board never reaches into the VPS.

- **Observe:** heartbeats + activity events → green/red dots, per-bot task/last-error/feed. (`startHeartbeat` / `startHeartbeatAs` / `reportEvent` in `bot/src/lib/cowork.ts`.)
- **Control / Task / Converse:** command queue (`startCommandPoller` claims → executes → posts result). ZOE serves `ask` + `run_task` via the concierge; all bots do `pause`/`resume`/`restart`.
- **`zao-fleet-agent`** (`bot/src/fleet-agent/`, `bot/systemd/zao-fleet-agent.service`): host supervisor for UI **start/stop** — whitelisted `systemctl --user {start,stop,restart}` on known units via `execFile` (no shell). **STAGED + DISABLED** — enable only deliberately.
- Contract: `bot/COWORK_API.md` (mirrors `cowork-zaodevz/docs/BOT-API.md`).

## Coworking app (separate repo)

- **`@ZAOcoworkingBot`** + the web board — repo **`ZAODEVZ/ZAOcowork`** (on the cowork VPS at `/root/cowork-zaodevz`). Next.js, **deploys to `thezao.xyz` via Vercel** (Supabase backend). Now exposes the `/api/v1/bots*` fleet API + `/bots` board (no longer "an island").

## Decommissioned — DO NOT revive (doc 601, 2026-05-04)

- OpenClaw container + 7-agent squad (ZOEY / BUILDER / SCOUT / WALLET / FISHBOWLZ / CASTER) — code gone
- Composio AO orchestrator · ZOE v2 / Agent Zero migration
- 10-bot branded fleet (Magnetiq / Research / WaveWarZ / POIDH as own bots) — **⚠️ Magnetiq/AttaBotty code still present** in `bot/src/teams/`; cleanup pending (delete/archive or formally un-decommission)
- FISHBOWLZ (killed 2026-05-04) — **⚠️ code still present** in `src/components/fishbowlz`, `src/lib/fishbowlz`, `skills/fishbowlz`

## Infra

- **Bots VPS** `zaal@31.97.148.88` — systemd `--user` units: `zoe-bot`, `zao-devz-stack`, `zaostock-bot` (+ `zao-team-bots` dormant, `zao-fleet-agent` staged/off). Each an independent grammy long-poll loop; no central dispatcher.
- **Cowork VPS** `root@187.77.3.104` — runs `cowork-zaodevz` (→ Vercel/Supabase). **Different machine** from the bots.
- Coordination: `groups.json`, `~/.zao/zoe/` memory, Supabase (`hermes_runs`, CRM, `bot_heartbeats`/`bot_events`/`bot_commands`).
- Per-bot cowork tokens live **only** in VPS systemd drop-ins (`~/.config/systemd/user/<unit>.service.d/cowork.conf`) — never in git.

## Known gaps / tech-debt (priority order)

1. **⚠️ Untracked snapshot (top risk).** `zaostock-bot` *and* `zao-devz-stack`/`hermes` run from `~/zaostock-bot`, which is **not a git repo** — control-plane code there was hand-patched, so it can drift from `main` and isn't reproducible. Reconcile to a real git checkout.
2. **VPS runs a feature branch.** `~/zao-os` (zoe-bot) tracks `claude/gifted-euler-bYhl7`; point it at `main` now that PRs #795/#804 are merged.
3. **Hermes on the board** — code wired; needs `hermes=` token added to `COWORK_BOT_TOKENS` (Vercel) + `restart zao-devz-stack`. Blocked on the Vercel daily-deploy cap (~24h).
4. **Decommissioned code lingering** — Magnetiq/AttaBotty + FISHBOWLZ (above).
5. **Un-wired exports** — `pushItem` (ZOE capture→cowork) and Hermes `markDone` exist in the client but have no callsites yet.
6. **Bonfires bots off the board** — `@zabal_bonfire` / `@zdeepmeeting_bot` need a separate heartbeat path (different platform).
