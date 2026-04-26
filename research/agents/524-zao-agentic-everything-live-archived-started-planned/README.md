---
topic: agents
type: audit
status: research-complete
last-validated: 2026-04-25
related-docs: 90, 200, 234, 239, 247, 256, 288, 325, 346, 354, 415, 432, 461, 467, 471, 473, 484, 488, 489, 491, 496, 506, 507, 508, 523
tier: DISPATCH
---

# 524 - ZAO Agentic Systems - Everything Map (LIVE / STARTED / PLANNED / ARCHIVED)

> **Goal:** Master index of every named agent / bot / orchestrator across ZAO OS, BCZ, ZAOstock, and the VPS. Live + started + planned + archived in one doc, so future planning never re-treads.

Built from 4-agent dispatch on 2026-04-25: codebase + research-doc audit, VPS service inventory, WIP + open-PR survey, deprecation graveyard. Extends doc 523 (architecture decisions); this doc is the inventory.

## Executive Summary

| Bucket | Count | Notable |
|--------|-------|---------|
| **LIVE** (code in repo + running) | 9 | VAULT, ZAOstock bot, OpenClaw gateway, Paperclip, ZOE concierge, AO, Cloudflare tunnels, Caddy, Hermes scaffold (PR #307) |
| **STARTED** (scaffold or partial) | 14 | ZOE v2, Stock-Coder, Hermes-Stock, Research bot, ZOEY, ROLO, SCOUT, WALLET, BUILDER, CASTER, POIDH bot, Magnetiq bot, WaveWarZ bot, Devz bot |
| **PLANNED** (research only) | 17 | Matricula 4-layer loop, Council of High Intelligence, CORTEX, GRU pattern, SelfHeal, Karpathy autoresearch, ss-triage-router, etc. |
| **ARCHIVED / DEPRECATED** | 11 | TRAE SOLO, ElizaOS v2 (paused), FISHBOWLZ standalone, ZOE v1, Mac-hosted OpenClaw, VPS 2 (never existed), Conductor.build, Milady AI, Mission Control v2, Hindsight, Railway-hosted ElizaOS |

Total names tracked: **51 agentic entities** across the four buckets. Not all should be built; the discipline is knowing which.

## LIVE - In Repo + Running Right Now

| Name | Where | Trigger | LLM | Last touched | Function |
|------|-------|---------|-----|--------------|----------|
| **VAULT** | `src/lib/agents/vault.ts` + `runner.ts` + `/api/cron/agents/vault` | Vercel cron 6am UTC daily | none (rules) | 2026-04-25 | Treasury daily routine: claim budget -> ETH price -> 0x swap -> burn 1% ZABAL -> Farcaster cast -> autostake (90% DRY 14d conviction) |
| **BANKER** | `src/lib/agents/banker.ts` (same runner) | Vercel cron 2pm UTC | none | 2026-04-25 | COC Concertz promoter trades. **Wallet unfunded; trading_enabled=false** |
| **DEALER** | `src/lib/agents/dealer.ts` (same runner) | Vercel cron 10pm UTC | none | 2026-04-25 | FISHBOWLZ-era room economy trader. **Wallet unfunded; trading_enabled=false** |
| **ZAOstock Telegram bot** (`@ZAOstockTeamBot`) | `bot/` deployed to VPS at `~/zaostock-bot/` | Telegram messages + 4 crons (6am/6pm EST + Mon 9am + Fri 5pm) | Minimax M2.7 (awaiting Claude swap when ANTHROPIC_API_KEY lands) | 2026-04-25 (PR #303 Tier 1 cohesion + PR #307 Hermes pending) | 17 commands: status, mytodos_all, do, idea, note, gemba, ask, circles, op, press, fix (Hermes, pending merge), digest, etc. |
| **OpenClaw gateway** | docker `openclaw-openclaw-gateway-1` on VPS | systemd via docker-compose | multi (Anthropic / OpenAI / Groq / LiteLLM via plugins) | container up 6 days, healthy | Long-lived agent runtime; hosts ZOE workspace + sub-agents (CEO, Researcher) |
| **Paperclip AI** | systemd user `paperclipai`, port 3100, embedded Postgres :54329 | always-on | configurable | 5 days uptime | Heartbeat orchestrator; task queue + agent dispatch |
| **ZOE concierge bot** | `~/bin/bot.mjs` running under tmux | manual + cron triggers | Anthropic via env | active 2026-04-25 | Telegram DM concierge; sends [ZOE TIP] messages, morning briefs, evening recaps |
| **AO agent framework** | port 14801 + `:3000` + ttyd `:7681` | manual sessions | varies | 8 days running | Arweave AO terminal mux (`ao.zaoos.com`) |
| **Cloudflare tunnels** | systemd user `cloudflared` | always-on | n/a | 37h uptime | Routes paperclip / ao / zoe `.zaoos.com` -> VPS internal ports |

**Side rails (not agents but agentic substrate):**
- Caddy reverse proxy x2 (ports 3002 / 3003 / 3006)
- Postgres (Paperclip embedded, :54329)
- Ollama (port 11434, staged for local-LLM bots, not actively dispatched)
- ZOE dashboard (port 5072, 17 days uptime)
- ZOE proxy (port 5071, python)

**Crons on VPS** (17 total, daily):
- `0 6` follower-snapshot, `0 9` morning-brief, `0 1` evening-reflect, `0 2` daily-digest, `0 8` nightly-research (Hermes), `0 23` wavewarz-sync, `*/15` test-checklist-ping, `* * * * *` watchdog + auto-sync, `*/2` session-watcher, `@reboot` start-agents + pixel-startup + patch-ao-plugin
- Disabled: `*/30` zoe-learning-pings (commented out, env keys not loaded)

## STARTED - Scaffold or Partial Code, Not Fully Wired

| Name | Where | Status | Blocker | Doc ref |
|------|-------|--------|---------|---------|
| **Stock-Coder** (Fixer half of Hermes pair) | `bot/src/hermes/coder.ts` | code complete in PR #307 | merge + ANTHROPIC_API_KEY on VPS + migration applied | 523 |
| **Hermes-Stock** (Critic half) | `bot/src/hermes/critic.ts` | code complete in PR #307 | same as Stock-Coder | 523 |
| **Hermes runner + commands** | `bot/src/hermes/{runner,commands,git,pr,db}.ts` + migration | code complete in PR #307 | same | 523 |
| **ZOE v2** (single agent, dual-brain via ss-triage-router) | OpenClaw on VPS, SOUL/MEMORY/AGENTS/TASKS files | files in place, ss-triage-router NOT yet installed | install ss-triage-router MCP per doc 473 | 256, 473, 523 |
| **ZAO Devz bot** | `infra/portal/bin/bots/zao-devz/` scaffold | Approach 1 design only, no live code | Hermes pair validated first | 467 |
| **Research bot** | `infra/portal/bin/bots/research/` planned | not started | wraps `/zao-research` skill | 467 |
| **Magnetiq bot** | `infra/portal/bin/bots/magnetiq/` planned | not started; no Magnetiq API exists | Zaal pre-creates retention drops | 467 |
| **WaveWarZ bot** | `infra/portal/bin/bots/wavewarz/` planned | not started | sprint scaffold + portal-state JSON | 467 |
| **POIDH bot** | `infra/portal/bin/bots/poidh/` planned | not started | bounty discovery on /poidh Farcaster channel | 415, 467 |
| **ZOEY** (action executor) | role defined, no code yet | scaffold only | dispatch surface from ZOE | 256, 288, 460 |
| **ROLO** (contact / rolodex) | role defined, no code yet | scaffold only | needs `contacts` table + indexer | 296, 464 |
| **SCOUT** (research) | role defined, no code yet | scaffold only | wrap `/zao-research` skill | 288 |
| **WALLET** (Privy + portfolio + x402) | role defined, no code yet | scaffold only | Privy wallet wiring | 288, 460, 465 |
| **BUILDER** (code generation) | role defined, no code yet | scaffold only | overlaps Stock-Coder; rename or merge | 288 |
| **CASTER** (cross-platform publish) | role defined, no code yet | `src/lib/publish/*.ts` files exist for X, Discord, Bluesky, Threads, Lens, Hive but no agent runners | wire each platform runner + cron | 288 |
| **QuadWork** (4-agent dev team Head + Dev + 2 Reviewers) | install plan in doc 491; runs on `zao-chat` + `zao-brain`, NOT on `zao-os` | doc complete, install pending | $4/day cap; cross-frontier review (Codex + Claude) | 487, 491 |
| **agent_memories table + Matricula 4-layer loop** | not yet migrated | spec only | new pgvector table + nightly Haiku consolidation cron | 484, 523 |

## PLANNED - Research Only, No Code Commitment Yet

| Name | What it would do | Why valuable | Doc ref |
|------|------------------|--------------|---------|
| **ss-triage-router MCP** | Haiku triage / Sonnet voice / Opus heavy code routing | 75% cheaper than dual-Opus per doc 473 | 473 |
| **Matricula 4-layer loop** | Action -> Metrics -> Reflection -> Strategy w/ energy budget | self-improvement w/o human in loop | 484 |
| **GRU Telegram orchestrator pattern** | supergroup-topics for multi-bot fanout, knowledge graph + escalation | natural fit for ZAO Telegram-first fleet | 523 |
| **SelfHeal arxiv 2604.17699** | Fixer + Critic + retry loop | already shipped via Hermes pair (PR #307) | 523 |
| **Council of High Intelligence (Nyk)** | 11-agent softmax deliberation | use for hard architectural calls | 171 |
| **CORTEX** (hippocampal memory + dream cycles) | persistent agent identity, 0% drift over 6mo | use for ZOE + ROLO only | 488 |
| **Hermes local-LLM fleet** (Nous Hermes + Qwen3.6 27B on Ollama) | run branded bots locally on VPS, no Claude burn for cheap branded agents | ~$0/month per bot | 354, 483 |
| **Karpathy autoresearch loop** | binary-checklist 3-experiments/day worker tuning | continuous prompt improvement | 253, 259 |
| **ElevenLabs voice for ZOE** | Zaal voice clone for voice bot | brand voice on Telegram voice messages | 325 |
| **POIDH bounty integration** (Farcaster) | autonomous bounty discovery + reply | community task pipeline | 415 |
| **Composio AO orchestrator** | unified agent dashboard via Composio Tool Router | external integrations (Gmail/Slack/Notion) | 415, 508 |
| **AgentLint pre-merge guard** (multiple forks) | 33 evidence-backed checks on agent repos | hook into `/review` skill | 508, 523 |
| **AgentGuardHQ/agentguard** | 26 invariants (secrets, blast radius, branch protection) | pre-push enforcement | 523 |
| **Anthropic Cybersecurity Skills (mukul975, 4.8K stars)** | 754 skills, 38 domains, MITRE/NIST mapped | use Trail of Bits 29-skill subset, skip the 754 mega-pack | 507 |
| **ZAO Bootcamp curriculum** (Housecall Pro 5-day model) | onboard non-technical artists to AI tools | reuse ZOE + Composio + ComfyUI + Markable + Empire Builder | 508 |
| **Farcaster-protocol skill** (publish to OSS) | document ZAO's signer + Neynar + mini-app patterns | recruiting magnet, similar lift to QuadWork OSS | 507 |
| **xmtp-encrypted-messaging skill** | document ZAO's burner-key + group convo patterns | community contribution, Coinbase XMTP team boost | 507 |

## ARCHIVED / DEPRECATED - Honest Graveyard with Lessons

| Name | Date killed | Why | Replacement | Lesson |
|------|-------------|-----|-------------|--------|
| **TRAE AI SOLO** (ByteDance VS Code fork) | 2026-04-24 | Telemetry continues post-opt-out (~500 calls / 7min / 26MB idle, 5yr retention). Conflict with `.claude/rules/secret-hygiene.md` | Claude Code Max sub | Vendor telemetry is a hard blocker. Trust domain + regulatory posture > UX |
| **ElizaOS v2 (alpha)** | paused 2026-04-24 | Three unresolved memory leaks (bootstrap cache, zero-vector embedding, unbounded latestResponseIds). 60% dev effort fighting framework vs domain | OpenClaw + Claude Agent SDK | Wait for beta. Steal patterns, not framework |
| **ElizaOS as primary runtime** | superseded earlier | mentioned doc 90, never adopted | OpenClaw on VPS | Framework churn > premature adoption |
| **FISHBOWLZ standalone product** | 2026-04-16 | partnership pivot to Juke (nickysap) Farcaster audio | Juke partnership; FISHBOWLZ code parked | Distribution moats are strategic |
| **FISHBOWLZ agentic 3-tier (admin / ZOEY / BYOK)** | paused mid-design with FISHBOWLZ | blocked on partnership pivot | resume if partnership reverses | Agent-as-room-participant is rich; don't abandon the patterns |
| **ZOE v1** (7 sub-agents) | 2026-04-09 | nobody invoked sub-agents; M2.7 too dumb; copy-paste friction | ZOE v2 (single agent, ss-triage-router routing) | Specialization without user intent = complexity. Single agent + smart routing > sprawl |
| **ZOE v2 "two-brain" M2.7+Opus** (initial v2 design) | superseded 2026-04-22 | dual-Opus too expensive; M2.7 ceiling hit | ss-triage-router MCP (Haiku/Sonnet/Opus) | Haiku-first classification cheaper than custom dual-brain |
| **Mac-hosted OpenClaw** | 2026-04-17 | development machine != agent host | VPS 1 only | Separate dev from ops |
| **VPS 2** (proposed second box) | 2026-04-23 | never existed; mistaken memory entry | VPS 1 only (memory `project_no_vps2`) | Inventory actual infra before designing for phantom boxes |
| **Conductor.build** | dropped earlier | Mac-only, didn't help Windows home rig | Composio AO | Cross-platform > single-OS tool |
| **Milady AI** (ElizaOS evolution) | rolled into ElizaOS deferral | superseded by OpenClaw | OpenClaw + Claude SDK | Same as ElizaOS lesson |
| **Mission Control v2 / Hindsight** | research-only, never adopted | OpenClaw / Supabase+Cohere chosen instead | OpenClaw + Supabase + Cohere | Don't run all candidates - pick one and ship |

**Blocked items (waiting on Zaal-only action - these are NOT killed, just parked):**
- Vercel OAuth security rotation (P0 URGENT, doc 471) - supply chain breach
- InfraNodus trial / VoxCPM2 / OpenWhisp installs - Zaal sign-off
- Recoupable / Coinflow merchant accounts
- BANKER + DEALER wallet funding

## Infrastructure Substrate (What Everything Runs On)

```
                      Mac (dev only - never live agents)
                             |
                             | git + ssh
                             v
                    +------------------+
                    |   VPS 1          |
                    |   31.97.148.88   |   <- only VPS, period
                    |   Hostinger KVM2 |
                    |   8GB RAM, 27d up|
                    +------------------+
                       |          |          |
                  systemd      docker      tmux/cron
                       |          |          |
       ----------------+          |          +----------------
       |                          |                          |
   zaostock-bot              openclaw                     ZOE bot
   paperclipai               gateway                      claude
   cloudflared               + ZOE                        sessions
                             workspace                    AO web
                             + sub-agents                 ttyd
                             (CEO,Researcher)
                                |
                                | tunnel (named: zao-agents)
                                v
       paperclip.zaoos.com  ao.zaoos.com  zoe.zaoos.com

                         +----+
                         |Vercel|  <- VAULT/BANKER/DEALER cron live here
                         +----+      ZAO OS Next.js, 301 routes
                            |
                            v
                       +---------+
                       |Supabase |  <- agent_config, agent_events, hermes_runs (pending),
                       |Postgres |     stock_*, all RLS
                       +---------+
                            |
                            v
                       +-----+
                       |Base |  <- ZABAL, SANG, agent wallets,
                       |chain|     0x Swap, Privy, EIP-712
                       +-----+
```

**Zero-trust boundaries:**
- `SUPABASE_SERVICE_ROLE_KEY` server-only (Vercel + bot env)
- `NEYNAR_API_KEY` server-only
- `APP_SIGNER_PRIVATE_KEY` server-only
- `ANTHROPIC_API_KEY` per-host: Mac (Claude Code), VPS (when Hermes lands), NEVER browser

## In-Flight PRs + Branches

| PR | Title | Branch | Blockers |
|----|-------|--------|----------|
| **#307** OPEN | feat(bot): Hermes dual-bot scaffold + scripts archive | `ws/hermes-scaffold-plus-scripts-archive` | (a) apply migration `bot/migrations/hermes_runs.sql`; (b) add `ANTHROPIC_API_KEY` to VPS bot env; (c) restart `zaostock-bot` systemd |

**Stale branches (>4 days, no PR, candidates for cleanup):**
- `ws/ao-research-doc415` (remote gone)
- `ws/stock-tuesday-recover` (remote gone)
- `ws/zoe-ping-act-button-0420` (remote gone)
- `ws/stock-apr21-buildout` (2 commits ahead, no PR)
- `ws/stock-artist-claim` (2 commits ahead, no PR)
- `ws/stock-doc476-maxone` (1 commit ahead, no PR)
- `ws/a1-a2-bot-fleet-0421` (work merged, branch lingers)
- `ws/b1-b2-b3-zoe-hardening-0421` (work merged, branch lingers)
- `ws/bot-hermes-only` + `ws/bot-hermes-dual-bot-scaffold` + `ws/scripts-clean-final` (parallel-session chaos from this session, replaced by `ws/hermes-scaffold-plus-scripts-archive`)

## Top Bugs Blocking Forward Motion

| # | Bug | Status |
|---|-----|--------|
| 1 | safe-git-push.sh portable timeout fix | **FIXED 2026-04-25** (this session); fail-closed on gh errors; merged-PR push test confirmed blocked |
| 2 | GitHub branch protection on main | **APPLIED 2026-04-25** (this session); enforce_admins=true |
| 3 | OpenClaw jina-reader MCP failing hourly | **FIXED 2026-04-25** (this session); removed entry, gateway restarted clean |
| 4 | OpenClaw Telegram dispatch broken (`channel unavailable: telegram`) | NOT FIXED - intentionally `enabled=false`; ZAOstock bot uses separate token, this is cosmetic noise; leave |
| 5 | ZAOstock bot SIGTERM hangs (90s+ timeout) | OPEN - add graceful shutdown handler in `bot/src/index.ts` (low impact, log spam only) |
| 6 | Stale processes on VPS (ClawDown 22d, 3 idle Claude CLI sessions) | OPEN - cleanup in next ops pass |
| 7 | BANKER + DEALER wallets unfunded | OPEN - Zaal funding decision |
| 8 | Hermes_runs migration not applied | OPEN - blocks PR #307 first /fix run |
| 9 | ANTHROPIC_API_KEY missing on VPS bot env | OPEN - blocks PR #307 first /fix run |

## What This Means in Plain Terms

**ZAO has 9 things actually running today.** Of those, 1 (VAULT) does autonomous work that earns or loses money daily. 1 (ZAOstock bot) handles real team operations. 7 are infrastructure.

**ZAO has 14 things scaffolded.** None are dangerous to ship; all need their last-mile wiring (env keys, migrations, restarts). The Hermes pair (Stock-Coder + Hermes-Stock) is the one that unlocks the rest because it teaches the pattern for autonomous PRs.

**ZAO has 17 things designed but not built.** Most are reference patterns (Matricula, GRU, SelfHeal) we've already partly absorbed via Hermes + ss-triage-router. The remaining 10-12 are real future work, prioritized by doc 467 rollout (Week 1-6 + Month 2).

**ZAO has 11 things consciously killed.** The graveyard is healthy. Most decisions trace to: framework instability (ElizaOS), distribution moats (FISHBOWLZ -> Juke), vendor telemetry (TRAE), or pattern superseding (ZOE v1 -> v2).

The risk vector is **not under-building**. It's letting the STARTED bucket grow past 14 without finishing wires. Every new STARTED item should displace an existing one or close 2 ARCHIVED ones.

## Next 30 Days - Concrete Sequence

**This week (P0):**
1. Merge PR #307 (Hermes scaffold)
2. Apply `bot/migrations/hermes_runs.sql` in Supabase
3. Add `ANTHROPIC_API_KEY` to VPS bot env (`~/zaostock-bot/.env`)
4. Restart `zaostock-bot` systemd unit
5. First `/fix` test in Telegram - validate end-to-end
6. Swap `bot/src/llm.ts` Minimax -> Claude (Sonnet default, Opus for `/do`)

**Next sprint:**
7. Install `ss-triage-router` MCP on ZOE (doc 473)
8. Add `agent_memories` pgvector table + nightly Haiku consolidation cron (Matricula loop, doc 484)
9. Add `BANKER` + `DEALER` wallet funding decision (or formally archive these names)
10. Fix `zaostock-bot` SIGTERM graceful-shutdown handler

**Week 3-4 (per doc 467 staging):**
11. Ship Research bot (reactive `/research` Telegram command wrapping `/zao-research`)
12. Build portal `/bots` status page (posts-today, rate-limit-usage, last-trigger)

**Month 2:**
13. Promote ZAO Devz to Approach 3 (AO-native, persistent worktree, Claude Code toolbelt)
14. Build + publish `farcaster-protocol` skill to OSS (recruiting magnet per doc 507)
15. Ship Magnetiq + WaveWarZ + Devz bots (per doc 467)
16. Re-validate this doc 524 with production data from 30 days of Hermes runs

## Sources

- Doc 523 - ZAO agentic systems audit + fix-PR + Hermes architecture
- Doc 467 - Bot fleet design (Magnetiq / WaveWarZ / Stock / Devz / Research)
- Doc 473 - ss-triage-router for ZOE
- Doc 484 - Matricula 4-layer self-improvement loop
- Doc 488 - CORTEX hippocampal memory
- Doc 491 - QuadWork install
- Doc 506 - TRAE SOLO skip-decision
- Doc 507 - 1,116 skills curated picks
- Doc 508 - Creator infra signals
- Doc 90 - AI-run community agent OS (foundational)
- Doc 256 - ZOE Agent Factory vision
- Doc 200 - Definitive Community OS vision
- 4-agent dispatch reports (this session, codebase + VPS + WIP + graveyard)

Memory cross-refs:
- `project_zoe_v2_redesign`, `project_zoe_v2_pivot_agent_zero`
- `project_fishbowlz_deprecated`, `project_fishbowlz_status`, `project_fishbowlz_agents_design`
- `project_trae_ai_skip`, `project_no_vps2`, `project_ao_vps_portal_decision`
- `project_openclaw_status`, `project_vps_skill`
- `project_paperclip_infra`, `project_zoe_dashboard`
- `project_agent_squad_dashboard`
- `project_fix_pr_pipeline_live` (just saved this session)
- `project_research_followups_apr21` (Vercel OAuth + blocked items)
- `project_zaostock_bot_live`, `project_tomorrow_first_tasks`

## Staleness + Verification

- Live services verified via `ssh zaal@31.97.148.88` 2026-04-25 (docker ps, systemctl, ps aux, netstat)
- Codebase agent paths verified via grep + ls 2026-04-25
- Open PR + branch list via gh CLI 2026-04-25
- Star counts on stealable repos verified via gh api 2026-04-25
- High-churn buckets (PRs, in-flight branches): re-validate weekly
- Architecture buckets (LIVE/ARCHIVED): re-validate monthly

## Next Actions

| # | Action | Owner | Type | By When |
|---|--------|-------|------|---------|
| 1 | Merge PR #307 (Hermes scaffold) | @Zaal | review + merge | This week |
| 2 | Apply hermes_runs.sql in Supabase + add ANTHROPIC_API_KEY to VPS bot env + restart systemd | @Zaal | manual ops | This week |
| 3 | First `/fix` test in Telegram, capture output for cost calibration | @Zaal | manual test | After step 2 |
| 4 | Swap `bot/src/llm.ts` Minimax -> Claude when API key on VPS | @Zaal / Quad | code | This week |
| 5 | Install `ss-triage-router` MCP per doc 473 as ZOE classifier | @Zaal | MCP install | Next sprint |
| 6 | `agent_memories` pgvector table + nightly Haiku consolidation cron (Matricula 4-layer) | @Zaal | migration + cron | Next sprint |
| 7 | ZAOstock bot SIGTERM graceful-shutdown handler | @Zaal / Quad | code | Next sprint |
| 8 | Cleanup stale branches (8 listed) via `git push origin --delete` | @Zaal | git ops | Anytime |
| 9 | Cleanup VPS stale processes (ClawDown ws_client + 3 Claude CLI sessions) | @Zaal | SSH ops | Anytime |
| 10 | Funding decision: BANKER + DEALER wallets, or formally archive | @Zaal | decision | When ready |
| 11 | Build + publish `farcaster-protocol` skill OSS (recruiting magnet) | @Zaal / Quad | new repo | Mid-May |
| 12 | Vercel OAuth rotation (P0 URGENT per doc 471) | @Zaal | security ops | This week |
| 13 | Re-validate this doc 2026-05-25 with 30 days of Hermes production data | Claude | audit | 2026-05-25 |

## Also See

- Doc 523 (sister doc) - architecture decisions, fix-PR pipeline activation, Hermes spec
- Doc 461 - safe-git-push.sh hook design
- Doc 467 - bot fleet phased rollout
- Doc 471 - Vercel OAuth supply chain breach (P0 URGENT)
- `bot/src/hermes/*` - the live scaffold matching Hermes spec
- `~/.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/MEMORY.md` - memory index
