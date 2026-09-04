# ZOE on the Pi - boot requirements + Pi measurement

Written 2026-08-27 22:21 EDT by the ZOE-TO-PI lane, from `origin/main` at `00625219`.
Every number below was measured this session; the method is stated next to it.
Nothing was installed or changed on the Pi.

Decision (Zaal, 2026-08-27 21:4x): "Move ZOE to the Pi now, VPS later." The brief
said the VPS had been down since 2026-08-23 and ZOE with it. **Measured 22:28 EDT
the same night: the VPS at `31.97.148.88` is UP (119 days uptime) and `zoe-bot` is
active and polling; `187.77.3.104` times out.** The "down" premise came from the
wrong address. Outcome in `RUNBOOK.md` Status.

## 1. What ZOE is, at boot

| Fact | Value | Source |
|---|---|---|
| Entry | `bot/src/zoe/index.ts` | `bot/systemd/zoe-bot.service` `ExecStart`, README "Run via" |
| Interpreter | `tsx` (TypeScript run directly; **no build step**, `tsconfig.json` has `noEmit: true`) | `bot/package.json` scripts, `bot/tsconfig.json` |
| Module type | ESM (`"type": "module"`) | `bot/package.json` |
| Transitive source graph | **176 files**: `src/zoe/**` (most), `src/hermes/*` (12), `src/cockpit/*` (3), `src/lib/*` (2), `src/supabase.ts`, and **`packages/heart-fleet/src` (11 files, OUTSIDE `bot/`)** | esbuild `--metafile` over the entry with `--packages=external` |
| npm packages actually imported by the graph | `@farcaster/hub-nodejs`, `@supabase/supabase-js`, `discord.js`, `dotenv`, `grammy`, `node-cron`, `tweetnacl`, `viem`, `zod` | esbuild metafile `external` list |
| Packages in `package.json` but NOT in ZOE's graph | `@discordjs/opus`, `@discordjs/voice`, `prism-media` (only `src/zai/**` imports them), `@modelcontextprotocol/sdk` | grep of `bot/src` excluding tests |
| Telegram transport | long-poll `bot.start()` (grammY). One consumer per token. | `bot/src/zoe/index.ts:3891` |
| Polling identity log line | `[zoe/index] polling as @<name>` - the health-check string | `bot/src/zoe/index.ts:3893` |

**Consequence for the layout:** because the graph imports `../../packages/heart-fleet`,
the Pi needs the **whole repo cloned**, not `bot/` alone. The VPS ran from
`~/zao-bot-live` (a full clone; `scripts/zoe-autodeploy.sh`), so the Pi mirrors that.

**Consequence for install:** `tsx` and `typescript` are **devDependencies**.
`npm ci --omit=dev` (the handoff's wording) would remove the interpreter the unit
runs. `install.sh` therefore runs a full `npm ci`. This is what the VPS did too
(`zoe-autodeploy.sh` runs `npm install`, not `--omit=dev`).

## 2. Node + toolchain

| Item | Repo wants | Pi has | Verdict |
|---|---|---|---|
| Node | `.nvmrc` = 22; `@types/node ^22` | **v20.20.2** (nodesource, `/usr/bin/node`) | OK to run. No dependency in `bot/package-lock.json` declares `engines.node > 20` (grepped). `tsx 4.21.0` supports 18+. Flag: 22 is the repo standard; upgrade is a later Zaal step, not tonight. |
| npm | - | 10.8.2 | OK |
| esbuild (boot-verify + `tsx`'s engine) | `tsx` -> `esbuild 0.27.7`; lock contains `@esbuild/linux-arm64 0.27.7` | arm64 prebuilt available | OK |
| git | required (`git` spawned 6x in graph: memory-git, hermes/git, research-doc) | `/usr/bin/git` | OK |
| `gh` | spawned by `cockpit/adapters.ts`, `hermes/pr.ts` (`GH_BIN_PATH`) | **absent** | Degrades: fix-PR pipeline + board `gh` adapters will error at use, not at boot. Zaal decides whether to install + auth `gh` on the Pi later. |
| `claude` CLI | `hermes/claude-cli.ts` spawns `HERMES_CLAUDE_BIN` or `claude`; concierge uses it only if `ZOE_USE_CLI=1` (default off) | present at `~/.npm-global/bin/claude` (not on the non-login `PATH`; `start-fleet.sh` adds it) | Unit sets `PATH` to include `~/.npm-global/bin`. Auth state on the Pi UNVERIFIED (not checked tonight - it would touch Claude state). Concierge default path uses `ANTHROPIC_API_KEY` via `models/router.ts`. |
| `codex` | `hermes/codex-cli.ts` default `~/.local/bin/codex` | absent | Degrades only when Hermes routes to Codex. |
| `ffmpeg`, `rsync`, `flock`, `tailscale` | - | present | Not needed by ZOE (transcription is Groq API, `transcribe.ts:3`). |
| Native build toolchain (`python3`, `gcc`, `make`) | only if `@discordjs/opus` has no prebuilt binary for linux-arm64 (it has `hasInstallScript: true`, node-pre-gyp with `--fallback-to-build`) | present | `npm ci` can compile it if the prebuilt download fails. ZOE never imports it, so a compile failure is an install-time nuisance, not a runtime one - `install.sh` retries with `--ignore-scripts` if the first `npm ci` fails on it (esbuild works without its postinstall because `@esbuild/linux-arm64` is an optionalDependency in the lock). |

## 3. Pi measurement (2026-08-27 22:12 EDT, `ssh zaal@ansuz`, read-only)

The handoff's exact command plus a few extras. Nothing installed.

| Probe | Result |
|---|---|
| `uname -m` | `aarch64` |
| Board / OS / kernel | Raspberry Pi 4 Model B Rev 1.5 / Debian 12 bookworm / 6.12.93+rpt-rpi-v8 |
| `nproc` | 4 |
| `node -v` | v20.20.2 (`process.arch` = arm64) |
| `free -m` | total 3796, used 1988, free 564, buff/cache 1365, **available 1808** |
| swap | **199 MB total, 199 MB used (full)** - no swap headroom |
| `df -h ~` | `/dev/mmcblk0p2` 59G, used 15G, **avail 42G** (26%) |
| `pm2 -v` | absent on `PATH` (a `pm2` binary exists in `~/.npm-global/bin`, unused - we use systemd, not pm2) |
| `systemctl --user status` | user manager running, 157 units loaded; **no `~/.config/systemd/user/` dir yet** (we create it) |
| `loginctl show-user zaal -p Linger` | **`Linger=no`** - user units do NOT start at boot until `sudo loginctl enable-linger zaal` (Zaal step; `sudo -n true` succeeded, so passwordless sudo is available) |
| `/run/user/1000` | exists (session bus reachable now because Zaal is logged in via tmux; linger makes that survive reboot) |
| uptime / load | 19 days; load 0.18 / 0.14 / 0.11 |
| Comparable node RSS (ZOL) | `zol-reply.js` 125 MB, `zol-threads.js` 125 MB, `zol-learn-zaal.js` 118 MB, `fleet-dashboard.js` 48 MB |
| tmux sessions | `fleet pi-research repor seor transcribe ytr zol zolt zolz` |
| cron | `@reboot` + `*/15` `start-fleet.sh` (self-heal by PROCESS match, not session name); ZOL daily/drain/watch crons |
| `~/.zao` | exists (`private/`, digests, `zol-drain.log`). **`~/.zao/zoe.env` absent** (correct - Zaal creates it). **`~/.zao/zoe/` absent** - ZOE will seed fresh state on first boot (`memory.ts:427-429`). |
| Repo on Pi | **none** (`~/zao-os`, `~/zao-bot-live`, `~/ZAOOS` all absent) - `install.sh` clones |
| GitHub SSH | `ssh -T` to GitHub over SSH: `Permission denied (publickey)` - the Pi has no GitHub key. Repo is **PUBLIC** (`gh repo view` -> `visibility: PUBLIC`), so **HTTPS clone works without one**. Pushing from the Pi (Hermes PRs, memory-git remote) would need a credential - Zaal's call, later. |
| Network | `github.com` 200, `registry.npmjs.org` 200 |
| Fleet dashboard | node listening on `100.117.191.11:8090` (Tailscale) - no port clash with ZOE (ZOE opens no listener) |

**Headroom read:** ZOE's RSS on the VPS was not measured (VPS down). The ZOL processes
are 120 MB each; ZOE's graph is larger and Hermes preflight spawns children with
`--max-old-space-size=4096` (`hermes/preflight.ts:70`) for test runs. With 1.8 GB
available and zero swap headroom, the unit carries `MemoryMax=1200M` so a runaway
ZOE cannot take ZOL down with it. A bigger swap / zram is a Zaal decision, not
tonight.

## 4. Environment variables - all 152 read by the graph

Method: exact regex `process.env.NAME` / `process.env['NAME']` over the 176-file
esbuild graph (`deploy/pi/envscan.cjs`, header has the regenerate command). Three files also read `process.env[name]`
dynamically: `zoe/env.ts` (the alias resolver), `zoe/identities.ts`, `zoe/curator.ts`
- their names are the aliases listed in section 4.1 and per-identity keys; not
enumerable statically.

### 4.1 Required at boot (process exits without them)

| Var | Where | Secret |
|---|---|---|
| `ZOE_BOT_TOKEN` **or** `TELEGRAM_BOT_TOKEN` | `zoe/index.ts:338-346` (`process.exit(1)`) | **YES** - the Telegram bot token |
| `ZAAL_TELEGRAM_ID` | `zoe/index.ts:339,347` (`process.exit(1)`) | no (a chat id, but keep it out of the repo) |

`zoe/env.ts` also defines aliases `ZAAL_DM_ID | ZAAL_CHAT_ID` and
`ZAAL_BOTZ_GROUP_ID | ZAALBOTS_GROUP_CHAT_ID`, `ZAAL_BOTZ_RESEARCH_THREAD |
ZAALBOTS_STATUS_THREAD_ID`; its `assertEnv()` is exported but **not called from any
file in the graph** (grepped), so those are warn-or-degrade, not boot-fatal.

### 4.2 Required on first use (throws lazily, not at boot)

| Var | Where | Secret |
|---|---|---|
| `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | `supabase.ts:7-10` `db()` throws `Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY` | key **YES** |
| `COWORK_TRACKER_URL` + `COWORK_TRACKER_KEY` | 12 files (board, tasks, relay, handoffs) - the cowork Supabase project | key **YES** |
| `COWORK_API_URL` + `COWORK_BOT_TOKEN` | `lib/cowork.ts:18-19` - **dormant no-op if unset** | token **YES** |

### 4.3 Secrets by name (22 real; 2 false positives noted)

`AGENTMAIL_API_KEY`, `ANTHROPIC_API_KEY`, `BONFIRE_API_KEY`, `BUS_TOKEN`,
`COWORK_BOT_TOKEN`, `COWORK_TRACKER_KEY`, `CUSTODY_PRIVATE_KEY`, `DISCORD_BOT_TOKEN`,
`FARCASTER_SIGNER_PRIVATE_KEY`, `FARCASTER_WRITE_API_KEY`, `FFX_TOKEN`, `GROQ_API_KEY`,
`OPENAI_API_KEY`, `OPENROUTER_API_KEY`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`SURPLUS_API_KEY`, `TELEGRAM_BOT_TOKEN`, `X402_PAYMENT_PRIVATE_KEY`, `XAI_API_KEY`,
`ZG_UPSTASH_REST_TOKEN`, `ZOE_BOT_TOKEN`.

Not secrets despite the name match: `CASTER_KEYWORDS`, `ZOE_FALLBACK_MAX_TOKENS`.

All of these live ONLY in `~/.zao/zoe.env` on the Pi, mode 600, written by Zaal
(RUNBOOK section 2). None appear in this repo, this doc, or any relay.

### 4.4 Path / host variables the unit sets explicitly

| Var | Code default | Unit sets | Why |
|---|---|---|---|
| `ZOE_HOME` | `~/.zao/zoe` (21 files) | leave default | state dir; same path convention as the VPS |
| `ZOE_REPO_DIR` | `/home/zaal/zao-os` (`index.ts:340`, `discord.ts:193`, `research-doc.ts:13`, `scheduler.ts`) | `%h/zao-bot-live` | the VPS default path does not exist on the Pi |
| `COCKPIT_CWD` | `/home/zaal/zao-os` (`cockpit/cockpit.ts:18`) | `%h/zao-bot-live` | same |
| `REPO_DIR` | fallback for `ZOE_REPO_DIR` (`research-doc.ts:13`) | `%h/zao-bot-live` | same |
| `COCKPIT_HOME` | `~/.zao/cockpit` | leave default | |
| `HOME` | - | systemd sets | `cockpit/adapters.ts`, `hermes/git.ts`, `hermes/codex-cli.ts` |
| `PATH` | - | `%h/.npm-global/bin:%h/bin:/usr/local/bin:/usr/bin:/bin` | `claude` lives in `~/.npm-global/bin`; `cockpit/adapters.ts` reads `PATH` |
| `HOSTNAME` | - | `ansuz` | `heart-canary.ts`, `scheduler.ts` label by host; systemd does not export it |
| `NODE_ENV` | - | `production` | parity with `bot/systemd/zoe-bot.service` |

### 4.5 Full inventory (name, secret flag, files that read it)

| Var | Secret | Read by |
|---|---|---|
| `AGENTMAIL_API_KEY` | **YES** | zoe/brief.ts, zoe/inbox-ingest.ts |
| `ANTHROPIC_API_KEY` | **YES** | zoe/models/router.ts |
| `BOARD_MINI_URL` | no | zoe/index.ts |
| `BONFIRE_API_KEY` | **YES** | zoe/recall.ts |
| `BONFIRE_API_URL` | no | zoe/recall.ts |
| `BONFIRE_ID` | no | zoe/recall.ts |
| `BONFIRE_STEWARD_FIDS` | no | zoe/bonfire-queue.ts |
| `BUS_PARTNER` | no | zoe/index.ts |
| `BUS_TOKEN` | **YES** | zoe/bus-send.ts |
| `BUS_URL` | no | zoe/bus-send.ts |
| `CALENDAR_ICS_URL` | no | zoe/calendar.ts |
| `CASTER_ENABLED` | no | zoe/index.ts |
| `CASTER_KEYWORDS` | no (name only) | zoe/farcaster/event-stream.ts |
| `CASTER_PERSONA` | no | zoe/index.ts |
| `COCKPIT_CWD` | no | cockpit/cockpit.ts |
| `COCKPIT_HOME` | no | cockpit/brief.ts |
| `CODEX_BIN` | no | hermes/codex-cli.ts |
| `COWORK_API_URL` | no | lib/cowork.ts |
| `COWORK_BOT_TOKEN` | **YES** | lib/cowork.ts |
| `COWORK_TRACKER_KEY` | **YES** | cockpit/adapters.ts, zoe/backlog-grill-runner.ts, zoe/board-command-executor.ts, zoe/handoffs-surface.ts, zoe/index.ts, zoe/orchestrator-tick.ts, zoe/relay-bridge.ts, zoe/task-comment-replies.ts, zoe/task-mention-notify.ts, zoe/task-teammate-ack.ts, zoe/team-tracker.ts, zoe/zol-queue.ts |
| `COWORK_TRACKER_URL` | no | cockpit/adapters.ts, zoe/backlog-grill-runner.ts, zoe/board-command-executor.ts, zoe/handoffs-surface.ts, zoe/index.ts, zoe/orchestrator-tick.ts, zoe/relay-bridge.ts, zoe/task-comment-replies.ts, zoe/task-mention-notify.ts, zoe/task-teammate-ack.ts, zoe/team-tracker.ts, zoe/zol-queue.ts |
| `CUSTODY_PRIVATE_KEY` | **YES** | zoe/farcaster/x402.ts |
| `DEBUG_ZOE` | no | zoe/index.ts |
| `DISCORD_BOT_TOKEN` | **YES** | zoe/discord.ts |
| `DISCORD_COMMUNITY_ASKS_ENABLED` | no | zoe/discord.ts |
| `DISCORD_WEBHOOK_STATUS` | no | zoe/discord-webhook.ts |
| `DISCORD_ZAAL_ID` | no | zoe/discord.ts |
| `FARCASTER_BOT_FID` | no | zoe/farcaster/event-stream.ts, zoe/farcaster/write.ts |
| `FARCASTER_NODE_GRPC` | no | zoe/farcaster/event-stream.ts, zoe/index.ts |
| `FARCASTER_NODE_GRPC_SSL` | no | zoe/farcaster/event-stream.ts |
| `FARCASTER_SIGNER_PRIVATE_KEY` | **YES** | zoe/farcaster/signer.ts |
| `FARCASTER_WRITE_API_BASE` | no | zoe/farcaster/write.ts |
| `FARCASTER_WRITE_API_KEY` | **YES** | zoe/farcaster/write.ts |
| `FARCASTER_WRITE_MODE` | no | zoe/farcaster/x402.ts |
| `FC_NETWORK_ID` | no | zoe/farcaster/write.ts |
| `FFX_ACTION_FN` | no | zoe/exec/ffx.ts |
| `FFX_ENDPOINT` | no | zoe/exec/ffx.ts |
| `FFX_KLEARU_FN` | no | zoe/exec/ffx.ts |
| `FFX_TOKEN` | **YES** | zoe/exec/ffx.ts |
| `FFX_VERIFY_OK` | no | zoe/exec/ffx.ts |
| `FRACTAL_JOIN_URL` | no | zoe/posts/fractal-promo.ts |
| `GH_BIN_PATH` | no | cockpit/adapters.ts |
| `GPT_MODEL_ID` | no | zoe/models/router.ts |
| `GROK_MODEL_ID` | no | zoe/models/router.ts |
| `GROQ_API_KEY` | **YES** | zoe/transcribe.ts |
| `GROQ_WHISPER_MODEL` | no | zoe/transcribe.ts |
| `HERMES_CLAUDE_BIN` | no | hermes/claude-cli.ts |
| `HERMES_CRITIC_BUDGET_USD` | no | hermes/critic.ts |
| `HERMES_CRITIC_FAST_MODEL` | no | hermes/claude-cli.ts |
| `HERMES_CRITIC_MODEL` | no | hermes/claude-cli.ts, hermes/runner.ts |
| `HERMES_FIXER_BUDGET_USD` | no | hermes/coder.ts |
| `HERMES_FIXER_FAST_MODEL` | no | hermes/claude-cli.ts |
| `HERMES_FIXER_MODEL` | no | hermes/claude-cli.ts, hermes/runner.ts |
| `HERMES_FLEET_DAILY_USD_CAP` | no | hermes/runner.ts |
| `HERMES_GIT_USER_EMAIL` | no | hermes/git.ts |
| `HERMES_GIT_USER_NAME` | no | hermes/git.ts |
| `HERMES_REPO_URL` | no | hermes/git.ts, hermes/pr-watcher.ts |
| `HERMES_ROUTING` | no | hermes/claude-cli.ts |
| `HERMES_ZAOCOWORK_REPO_URL` | no | hermes/git.ts |
| `HERMES_ZAOSTOCK_REPO_URL` | no | hermes/git.ts |
| `HOME` | no | cockpit/adapters.ts, hermes/codex-cli.ts, hermes/git.ts, zoe/research-doc.ts |
| `HOSTNAME` | no | zoe/heart-canary.ts, zoe/scheduler.ts |
| `KLEARU_BLOCK_LABELS` | no | zoe/safety/klearu.ts |
| `KLEARU_FAIL_MODE` | no | zoe/safety/klearu.ts |
| `KLEARU_IMAGE_CMD` | no | zoe/safety/klearu.ts |
| `KLEARU_TEXT_CMD` | no | zoe/safety/klearu.ts |
| `KLEARU_TIMEOUT_MS` | no | zoe/safety/klearu.ts |
| `MENTION_NOTIFY_MAP` | no | zoe/task-mention-notify.ts |
| `MODEL_ROUTING_ENABLED` | no | zoe/models/router.ts |
| `NODE_OPTIONS` | no | hermes/preflight.ts |
| `OPENAI_API_KEY` | **YES** | zoe/models/router.ts |
| `OPENROUTER_API_KEY` | **YES** | zoe/caster/reason.ts, zoe/models/router.ts, zoe/scheduler.ts |
| `OPENROUTER_BASE_URL` | no | zoe/caster/reason.ts |
| `OPENROUTER_HIGH_MODEL` | no | zoe/models/router.ts |
| `OPENROUTER_MODEL` | no | zoe/caster/reason.ts, zoe/models/router.ts |
| `OPENROUTER_REFERER` | no | zoe/caster/reason.ts |
| `PATH` | no | cockpit/adapters.ts |
| `REPO_DIR` | no | zoe/research-doc.ts |
| `SIGNER_BACKEND` | no | zoe/farcaster/signer.ts |
| `SUPABASE_ANON_KEY` | **YES** | zoe/index.ts |
| `SUPABASE_SERVICE_ROLE` | no | hermes/types.ts |
| `SUPABASE_SERVICE_ROLE_KEY` | **YES** | supabase.ts |
| `SUPABASE_URL` | no | supabase.ts, zoe/index.ts |
| `SURPLUS_API_KEY` | **YES** | zoe/models/router.ts |
| `SURPLUS_BASE_URL` | no | zoe/models/router.ts |
| `SURPLUS_MODEL` | no | zoe/models/router.ts |
| `TEAM_MEMBER_IDS` | no | zoe/task-teammate-ack.ts |
| `TELEGRAM_BOT_TOKEN` | **YES** | zoe/index.ts |
| `X402_PAY_TO` | no | zoe/farcaster/x402.ts |
| `X402_PAYMENT_PRIVATE_KEY` | **YES** | zoe/farcaster/x402.ts |
| `X402_USDC_ADDRESS` | no | zoe/farcaster/x402.ts |
| `X402_VALUE` | no | zoe/farcaster/x402.ts |
| `XAI_API_KEY` | **YES** | zoe/models/router.ts |
| `ZAAL_BOTZ_GROUP_ID` | no | zoe/index.ts, zoe/scheduler.ts |
| `ZAAL_BOTZ_HANDOFFS_THREAD` | no | zoe/scheduler.ts |
| `ZAAL_BOTZ_RESEARCH_THREAD` | no | zoe/index.ts, zoe/scheduler.ts, zoe/topic-router.ts |
| `ZAAL_TELEGRAM_ID` | no | zoe/index.ts |
| `ZAO_DEVZ_CHAT_ID` | no | zoe/index.ts |
| `ZAO_GROUP_ID` | no | zoe/scheduler.ts |
| `ZAOSTOCK_TEAM_GROUP_ID` | no | zoe/scheduler.ts |
| `ZG_UPSTASH_REST_TOKEN` | **YES** | zoe/bonfire-queue.ts |
| `ZG_UPSTASH_REST_URL` | no | zoe/bonfire-queue.ts |
| `ZOE_AGENTS_DIR` | no | zoe/workers.ts |
| `ZOE_ALWAYS_OPEN` | no | zoe/always-open-topics.ts |
| `ZOE_BOT_TOKEN` | **YES** | zoe/index.ts |
| `ZOE_CALL_CAP_ENFORCE` | no | zoe/call-budget.ts |
| `ZOE_CRITIC_HIGH_TIER` | no | zoe/critics/types.ts |
| `ZOE_CRITIC_PANEL` | no | hermes/critic.ts |
| `ZOE_CRITIC_PANEL_ALL_DIFFS` | no | hermes/critic.ts |
| `ZOE_CRITIC_PANEL_SHADOW` | no | hermes/critic.ts |
| `ZOE_CRITIC_PANEL_VERIFY` | no | hermes/critic.ts |
| `ZOE_CROSS_FAMILY_VERIFY` | no | zoe/critics/types.ts |
| `ZOE_DAILY_BUDGET_USD` | no | zoe/cost-governance.ts |
| `ZOE_DAILY_CALL_CAP` | no | zoe/call-budget.ts |
| `ZOE_DAILY_COST_CAP` | no | zoe/watcher.ts |
| `ZOE_DEFAULT_MODEL` | no | zoe/models/router.ts, zoe/types.ts |
| `ZOE_DM_BUILD` | no | zoe/index.ts |
| `ZOE_DRAFT_ANSWERS` | no | zoe/task-teammate-ack.ts |
| `ZOE_FAIL_RATE_WARN` | no | zoe/watcher.ts |
| `ZOE_FALLBACK_MAX_TOKENS` | no (name only) | zoe/models/router.ts |
| `ZOE_FLEET_UNITS` | no | zoe/fleet-health.ts |
| `ZOE_GRILL_MAX_OUTSTANDING` | no | zoe/backlog-grill.ts |
| `ZOE_GUARDRAILS` | no | zoe/concierge.ts |
| `ZOE_HARD_MODEL` | no | zoe/types.ts |
| `ZOE_HEAL_CAP` | no | zoe/fleet-health.ts |
| `ZOE_HEART_FLEET_CANARY` | no | zoe/heart-canary.ts |
| `ZOE_HERMES_SUBTASK_ESTIMATE_USD` | no | zoe/dispatch.ts |
| `ZOE_HOME` | no | hermes/critic.ts, zoe/always-open-topics.ts, zoe/cost-ledger.ts, zoe/curator.ts, zoe/extractors.ts, zoe/fleet-health.ts, zoe/handoffs-surface.ts, zoe/memory-git.ts, zoe/memory.ts, zoe/message-context.ts, zoe/nudge-ladder.ts, zoe/nudge.ts, zoe/orchestrator-tick.ts, zoe/outbox.ts, zoe/sidequests.ts, zoe/task-mention-notify.ts, zoe/task-teammate-ack.ts, zoe/topics.ts, zoe/work-loop.ts, zoe/work-park.ts, zoe/zaostock-approvals-surface.ts |
| `ZOE_IDENTITIES_PATH` | no | zoe/identities.ts |
| `ZOE_LOOP_LEASES` | no | zoe/scheduler.ts |
| `ZOE_LOW_SCORE` | no | zoe/watcher.ts |
| `ZOE_MAX_LEARNING_CHARS` | no | zoe/learn.ts |
| `ZOE_MAX_LEARNING_LINES` | no | zoe/learn.ts |
| `ZOE_MAX_SUBTASKS` | no | zoe/decompose.ts |
| `ZOE_MEMORY_GIT` | no | zoe/memory-git.ts |
| `ZOE_MISSION_CONTROL` | no | zoe/mission-control.ts |
| `ZOE_NUDGE_LADDER` | no | zoe/nudge-ladder.ts |
| `ZOE_ORCHESTRATOR_DAILY` | no | zoe/orchestrator-tick.ts |
| `ZOE_ORCHESTRATOR_ENABLED` | no | zoe/orchestrator-tick.ts |
| `ZOE_OUTBOX_DEMO` | no | zoe/heart-canary.ts |
| `ZOE_PLAN_BUDGET_USD` | no | zoe/dispatch.ts |
| `ZOE_PROACTIVE_THRESHOLD` | no | zoe/proactive.ts |
| `ZOE_QUICK_MODEL` | no | zoe/types.ts |
| `ZOE_RECALL_EPISODE_CHARS` | no | zoe/recall.ts |
| `ZOE_RELAY_TG_ENABLED` | no | zoe/orchestrator-tick.ts |
| `ZOE_REPO_DIR` | no | zoe/discord.ts, zoe/index.ts, zoe/research-doc.ts, zoe/scheduler.ts |
| `ZOE_REPO_IMPROVER_LEASES` | no | zoe/scheduler.ts |
| `ZOE_TASK_COMPLEXITY_ROUTING` | no | zoe/decompose.ts |
| `ZOE_USE_CLI` | no | zoe/concierge.ts |
| `ZOE_WAVE_CONCURRENCY` | no | zoe/dispatch.ts |
| `ZOE_WORKLOOP_DAILY` | no | zoe/work-loop.ts |
| `ZOL_THREAD` | no | zoe/index.ts |

## 5. Endpoints the graph calls (host literals, grepped)

| Host | Used by | Config var |
|---|---|---|
| `api.telegram.org` | grammY (implicit) + 4 literal uses | token |
| `tnt-v2.api.bonfires.ai` | `zoe/recall.ts` (Bonfire knowledge graph) | `BONFIRE_API_URL` (default), `BONFIRE_API_KEY`, `BONFIRE_ID` |
| Supabase (project URL from env, no literal) | `supabase.ts`, 12 tracker files | `SUPABASE_URL`, `COWORK_TRACKER_URL` |
| `openrouter.ai` | `models/router.ts`, `caster/reason.ts`, `scheduler.ts` | `OPENROUTER_*` |
| `api.groq.com` | `zoe/transcribe.ts` (voice memos) | `GROQ_API_KEY` |
| `api.agentmail.to` | `zoe/brief.ts`, `zoe/inbox-ingest.ts` | `AGENTMAIL_API_KEY` |
| `api.surplusintelligence.ai`, `api.x.ai`, `api.openai.com` | `models/router.ts` fallback rungs | `SURPLUS_*`, `XAI_API_KEY`, `OPENAI_API_KEY` |
| `github.com`, `raw.githubusercontent.com` | hermes git/pr, repo-improver | `HERMES_REPO_URL` etc. |
| `api.lu.ma`, `lu.ma` | events | `CALENDAR_ICS_URL` |
| `useicm.com`, `thezao.xyz`, `thezao.com` | brand grounding, board mini app | `BOARD_MINI_URL` |
| `example.com`, `cowork.example.com`, `discord.gg` | placeholders / invite text only | - |

All outbound; ZOE opens **no listening port**. Nothing to firewall on the Pi.

## 6. Data paths (state that must survive restarts)

Everything under `ZOE_HOME` = `~/.zao/zoe/` (from `memory.ts`, README "Storage
layout", and the grep): `persona.md`, `human.md`, `bootloader-template.md`,
`recent/<chat>.json`, `tasks.json`, `groups.json`, `topics.json`, `threads.json`,
`topic_thread_map.json`, `pinned-brief.json`, `pending-approvals.json`,
`checkpoints.json`, `calendar.json`, `focus_state.json`, `seen-events.json`,
`claude-health.json`, `backlog-grill-state.json`, `.zoe-msg-context.json`,
`decisions.jsonl`, `build_state.jsonl`, `inbox_context.jsonl`,
`triage_context.jsonl`, and dirs `archive/ cost/ events/ learnings/ outbox/ posts/
runs/ sentinels/ traces/ voice-memos/`. Plus `~/.zao/cockpit/` (`COCKPIT_HOME`) and
`~/.zao/private/` (gcal dumps).

On the Pi none of this exists yet. First boot seeds `persona.md`, `human.md`,
`bootloader-template.md` from the defaults in `memory.ts` and starts with empty
queues. **ZOE's working memory from the VPS (`~/.zao/zoe/` there) is unreachable
while the VPS is down**; RUNBOOK section 7 has the rsync to bring it over once it is
back, and the order of operations so the two never diverge.

## 7. What ZOE will and will not be able to do on the Pi (honest)

Works with just the two boot vars + Supabase + Bonfire + one model key:
Telegram DM + group concierge, memory blocks, scheduler (brief / reflect / nudges),
board reads and writes (cowork tracker), Bonfire capture + recall, voice memos
(Groq), Discord (if token set).

Degraded on the Pi until Zaal decides otherwise (each fails at USE with a logged
error, not at boot):

- **Hermes fix-PR pipeline** (`hermes/*`): needs `claude` auth on the Pi and `gh`
  (absent) plus a GitHub credential (none on the Pi).
- **Research-doc PRs / memory-git push**: same - no GitHub credential on the Pi.
- **Codex routing**: no `codex` binary.
- **Anything reading `/home/zaal/zao-os`**: covered by the unit's `ZOE_REPO_DIR`
  override; if a code path hardcodes the VPS path without the env, it will log
  ENOENT - report it, do not patch `bot/src` from this lane.

## 8. Risks + the one rule that bites

1. **Telegram single consumer (409).** `getUpdates` allows one poller per token.
   The VPS `zoe-bot.service` is `enabled` there and `zoe-autodeploy.sh` runs from
   cron every 10 min. **The moment the VPS comes back it will resume polling.**
   Two pollers = `409 Conflict: terminated by other getUpdates request` and both
   bots eat each other's updates. `[[project_zoe_one_instance_409]]`, burn of
   2026-06-29. RUNBOOK section 3 is the gate; `install.sh --start` refuses to start
   until it is acknowledged.
2. **Linger off.** Without `sudo loginctl enable-linger zaal` the unit dies on
   logout / does not start at boot. Zaal step (passwordless sudo is available).
3. **Swap is full.** `MemoryMax=1200M` on the unit protects ZOL; it does not create
   headroom.
4. **`@discordjs/opus` install script on arm64.** Not imported by ZOE; may still
   fail `npm ci`. `install.sh` retries with `--ignore-scripts`.
5. **Node 20 vs repo's 22.** No lock entry demands 22; verified by grep, not by a
   boot (no boot tonight). The esbuild bundle-verify in `install.sh` is the first
   real check, tomorrow.

## 9. Deviations from the handoff, stated

- `npm ci --omit=dev` -> full `npm ci` (section 1, tsx is a devDependency).
- "build" -> there is no build; the equivalent gate is the esbuild bundle-verify
  that `scripts/zoe-autodeploy.sh` already uses (`agent-loops.md` rule 30).
- Unit name `zoe.service` (per handoff) vs the VPS's `zoe-bot.service`. Kept the
  handoff's name; RUNBOOK section 8 maps one to the other for the move back.

## Sources (all read this session)

`bot/package.json`, `bot/package-lock.json`, `bot/tsconfig.json`, `bot/.env.example`,
`bot/src/zoe/index.ts` (l.1-60, 334-350, 3870-3899), `bot/src/zoe/env.ts`,
`bot/src/zoe/memory.ts`, `bot/src/zoe/README.md`, `bot/src/supabase.ts`,
`bot/src/lib/cowork.ts`, `bot/src/hermes/claude-cli.ts`, `bot/src/hermes/codex-cli.ts`,
`bot/src/zoe/transcribe.ts`, `bot/systemd/zoe-bot.service`,
`bot/scripts/install-bot-service.sh`, `scripts/zoe-deploy.sh`,
`scripts/zoe-autodeploy.sh`, `.claude/rules/*` (agent-loops 9/21/30/31/32,
silent-failure-guard, liveness-probe-guard, no-rm-rf), memory
`project_zoe_one_instance_409`; Pi: two read-only `ssh zaal@ansuz` probes at
22:12 and 22:14 EDT (`/home/zaal/start-fleet.sh`, `crontab -l`, `tmux ls`).
