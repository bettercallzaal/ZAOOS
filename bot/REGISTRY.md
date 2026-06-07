# ZAO Bot Registry

Status of every bot/agent in the ZAO fleet — what's live, where it runs, how it's
checked. Mirrors CLAUDE.md "Primary Surfaces"; **update both together.**

_Last updated: 2026-06-07_

## Active fleet

| Bot | Handle | Source | Purpose | Runs on | Status / health check |
|-----|--------|--------|---------|---------|----------------------|
| **ZOE** | `@zaoclaw_bot` | `bot/src/zoe/` | Concierge — tasks, captures, brief/reflect, recall, CRM, social drafts, group dispatch | systemd `zoe-bot` @ VPS 1 (grammy long-poll + Claude CLI subprocess) | `systemctl --user status zoe-bot` |
| **Hermes** | `@zoe_hermes_bot` | `bot/src/hermes/` | Autonomous fix-PR pipeline — coder (Opus) + critic (Sonnet) + auto-PR | In-process, spawned by ZOE / ZAO Devz dispatch | runs logged to Supabase `hermes_runs` |
| **ZAO Devz** | `@zaodevz_bot` | `bot/src/devz/` | Group `/fix` dispatch + hourly learning tip; dual-bot coder/critic narration | systemd `zao-devz-stack` @ VPS 1 | `systemctl --user status zao-devz-stack` |
| **ZAOstock** | `@ZAOstockTeamBot` | `bot/src/index.ts` (root) | Festival team coordination (sponsors, artists, volunteers, todos) — **graduating** with ZAOstock spinout | systemd `zaostock-bot` @ VPS 1 | `systemctl --user status zaostock-bot` |
| **Bonfire** (reader) | `@zabal_bonfire` | bonfires.ai (agent `69ef…`) | Knowledge-graph recall + multi-corpus ingest | Bonfires platform (Genesis tier, wallet-gated) | Bonfires dashboard |
| **DeepMeeting** | `@zdeepmeeting_bot` | bonfires.ai | GCvlcnti protocol authoring workbench (proposal-only shard) | Bonfires platform | Bonfires dashboard — ⚠️ **DM works, group routing broken** (Plat0x ticket open) |

## External / separate repos

- **Coworking** — `@ZAOcoworkingBot` — repo **`songchaindao-dot/cowork-zaodevz`** (on VPS at `/root/cowork-zaodevz`). Next.js web app + Node bot (Hermes pattern). Stores todos in `data/actions.json` via GitHub Octokit (SHA-dance). **No HTTP API** — see "Known gaps." The `/meeting` skill posts action items here via Octokit.

## Decommissioned — DO NOT revive (doc 601, 2026-05-04)

- OpenClaw container + 7-agent squad (ZOEY / BUILDER / SCOUT / WALLET / FISHBOWLZ / CASTER)
- Composio AO orchestrator
- ZOE v2 / Agent Zero migration plan
- 10-bot branded fleet (Magnetiq / Research / WaveWarZ / POIDH as own bots)
- FISHBOWLZ (paused 2026-04-16, killed 2026-05-04 — Juke partnership stands)

## Infra

- **VPS 1** (Hostinger KVM2), user `zaal`. Three systemd user units: `zoe-bot`, `zao-devz-stack`, `zaostock-bot`.
- **No central dispatcher** — each VPS bot is an independent grammy long-poll loop.
- Coordination: `groups.json`, `~/.zao/zoe/` memory blocks, Supabase (`hermes_runs`, CRM). Bonfire/DeepMeeting run off-VPS on the Bonfires platform.

## Known gaps

- **No centralized health/status** — no HTTP health endpoint, no heartbeat, no dashboard. Checked manually via `systemctl --user status <unit>` / `journalctl --user -u <unit> -f`.
- **Coworking is an island** — `cowork-zaodevz` exposes no API, so Hermes/ZOE/`/meeting` can't programmatically read or update its todos (doc 672 **P3.5**).
- **DeepMeeting group routing broken** on the Bonfires platform (Plat0x ticket open). DM works.
