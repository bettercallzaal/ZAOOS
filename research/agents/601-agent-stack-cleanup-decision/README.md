---
topic: agents
type: decision
status: research-complete
last-validated: 2026-05-04
related-docs: 234, 415, 461, 506, 523, 524, 527, 547, 549, 569, 570, 581, 590, 599, 600
tier: DEEP
---

# 601 — Agent Stack Cleanup Decision

> **Goal:** Stop the bot proliferation. Pick the smallest viable agent stack that actually serves Zaal day-to-day, and kill the rest. Replaces the implicit "add another bot" pattern with a written decision.

## Recommendation (no preamble — direct call)

**Collapse to 3 surfaces. Kill 5+ pieces of overhead.**

```
PRIMARY (3 surfaces Zaal touches daily):
  1. Claude Code CLI    — code, research, writing, planning
  2. Bonfire DM bot     — capture, recall, decisions, daily reflection
  3. ZAOstock Team Bot  — team-only, scoped, untouched

KILL OR DEPRECATE:
  - ZOE openclaw container (@zaoclaw_bot)  → kill, replace with Bonfire-as-ZOE
  - ZAO Devz bot                           → fold /SHIP FIX into Hermes webhook, drop Telegram-side
  - ZOE learning pings cron                → kill, Bonfire's task scheduling can do this
  - Bot-to-bot bridge group                → kill, autonomous coordination is fantasy until SDK lands
  - 10-bot fleet plan                      → permanent defer, never build
  - "ZAO Recall Relay Bot" idea            → don't create, fixes a problem that goes away when ZOE is killed

KEEP IN BACKGROUND (specialists, rarely user-facing):
  4. Hermes coder/critic                   — code-fix only, triggered by /SHIP FIX or PR webhook
  5. VAULT/BANKER/DEALER trading agents    — autonomous within parameters, src/lib/agents

REMOVE FROM CONSIDERATION:
  - OpenClaw ZOEY + WALLET sub-agents (never used)
  - Composio AO pilot (paused, decommission)
  - FISHBOWLZ (paused 2026-04-16, formal kill)
  - ZOE v2 redesign (skip, Bonfire eats this role)
```

**Net:** 3 daily surfaces, 2 background specialists, ~6 dead branches deprecated. From ~12 systems to 5. **Zaal's daily reality stays the same; maintenance load drops massively.**

## The Mess (current state, brutal)

| System | What it does | Tech debt |
|---|---|---|
| ZOE @zaoclaw_bot | Concierge, daily tasks | OpenClaw container with 60+ extension plugins, custom config schema, telegram channel disabled-by-default, sqlite for embeddings only (not messages), Minimax model dependency, can't actually call message.send tool to bridge — confirmed broken 2026-05-03 |
| ZAOstock Team Bot | Team check-ins | Working. Scoped. Healthy. **Don't touch.** |
| ZAO Devz bot | /SHIP FIX router | Bot/devz module exists. Tiny scope. /SHIP FIX could be a webhook directly, no Telegram needed |
| ZOE learning pings | Hourly tip in Devz | Python cron + 3 env files + a wrapper script + state files. Tip generation could live anywhere. |
| Hermes coder/critic | Auto-PR fix | Healthy when triggered. Triggers rare. Doesn't need Telegram identity. |
| Bonfire @zabal_bonfire | Personal KG + recall | **Works.** 1100+ nodes, 15 traits, recall verified. Has its own task scheduling, memory search, group access. |
| Bridge group `-5111907600` | Bot-to-bot relay | Created today. ZOE can't actually post to it autonomously (LLM tool not exposed). Solving requires new bot + 30 lines of bash. **Building 2 bots to coordinate 2 bots is the smell.** |
| OpenClaw ZOEY | Action sub-agent | Configured, never used. |
| OpenClaw WALLET | On-chain ops sub-agent | Configured, never used. |
| Composio AO | Agent orchestrator pilot | Installed on bcz, paused per memory. Pile of containers running for nothing. |
| 10-bot fleet plan | Brand-specific bots | Project memory `project_tomorrow_first_tasks.md`. Never built. Aspirational. Should stay aspirational. |
| FISHBOWLZ | Audio rooms standalone | Paused 2026-04-16. Formally dead. |

**Pattern:** every time a need comes up, a new bot/agent/extension gets added. Old ones don't die. Tech debt compounds.

## What Zaal Actually Does Day-to-Day

Auditing the last 2 weeks of session logs + memory + the master schedule:

| Time | Activity | Surface used |
|---|---|---|
| 4:30am-9am | Wake, gym, prime build | None / Mac |
| 9am-12pm | Code work, research, deep build | **Claude Code CLI** |
| 12pm-1pm | Lunch + content stream | Phone (Telegram, X, Farcaster posts) |
| 1pm-4pm | Meetings, calls, captures while mobile | **Telegram** (DM, ZAOstock standup, group chats) |
| 4pm-7pm | Prime building #2 | **Claude Code CLI** |
| Evening | Reflection, plan tomorrow | Phone or Mac (mixed) |

**Reality:** Claude Code + Telegram = 95% of agent-mediated work. Everything else is debug-on-Zaal's-time.

## Why Bonfire Eats ZOE's Job

ZOE @zaoclaw_bot was supposed to be the daily concierge. But Bonfire bot ALREADY handles:

| ZOE's intended job | Does Bonfire already do it? |
|---|---|
| Capture ideas | Yes — DM bot, paraphrase + commit pattern |
| Track tasks | Yes — Bonfire has task scheduling tool enabled per Platform tab |
| Save decisions to memory | Yes — that's literally Bonfire's job |
| Daily check-in | Could be — proactive Bonfire prompt at end of day |
| Recall what happened | Yes, with source citations + status attributes — verified 2026-05-03 |
| Cross-link between projects | Yes — graph relationships |
| Voice / personality | Yes — 15 personality traits configured |
| Proactive nudges | Yes — Bonfire's task scheduling can send reminders |
| File ingestion (md, pdf) | Yes — Document Store tool |

**ZOE isn't a unique value-add anymore.** It was the right idea before Bonfire shipped. Now it's redundant + worse (broken telegram channel, complex container, no useful memory).

## Three Architecture Options (decision required)

### Option A — STATUS QUO + glue (rejected)

Keep all current bots. Build the recall relay. Add another bot to fix the script-can't-read-replies problem. Build 10-bot fleet next year.

**Outcome:** more tech debt, more 3am debug sessions, never feels finished.

**Verdict: ❌ this is what got us here.**

### Option B — BONFIRE-AS-ZOE (recommended)

Bonfire becomes the personal concierge. ZOE openclaw container goes away. Daily flow:

- Mobile capture: DM @zabal_bonfire `INGEST FACT: <thing>` or just talk to it like you talk to ZOE
- Recall: DM @zabal_bonfire `RECALL: <question>`
- Daily reflection: Bonfire schedules a 9pm DM "what did we ship today?", you reply, it commits to graph
- Tasks: Bonfire's task scheduling tool, no separate todo system
- Hermes still receives /SHIP FIX via webhook (no need to be on Telegram bot directly — Hermes already runs from PR triggers)
- ZAOstock Team Bot stays as-is for team work (different audience)

**Migration cost:** ~4 hours
- Configure Bonfire's task scheduling for daily reflection
- Add 2-3 more personality traits to handle "task tracker" voice
- Stop the openclaw container
- Update DNS for any /chat → /openclaw routes (ZOE dashboard at zoe.zaoos.com if it exists)
- Update CLAUDE.md to point at Bonfire DM as the daily-ZOE replacement

**Maintenance gain:** massive. Stop managing openclaw extensions, telegram channel toggles, Minimax dependency, scout.sqlite, AGENTS.md/SOUL.md drift.

**Verdict: ✅ ship this.**

### Option C — KILL ALL BOTS, ONLY CLAUDE CODE (too austere)

Just Claude Code CLI + Bonfire as a database (no Bonfire bot). Mobile = Notes app. No proactive nudges.

**Verdict: ❌ loses mobile capture which is real (45 min/day per audit). Bonfire bot already works fine on mobile, no reason to kill it.**

## Concrete Migration Plan (Option B)

### Phase 1 — verify Bonfire can replace ZOE (today, 30 min)

1. Open Bonfire bot Platform tab → ensure Task Scheduling feature toggle is ON (was on per Personality screenshot)
2. Add 3 new personality traits to Bonfire to cover ZOE's voice:
   - `daily_reflection` — at 9pm EST DM Zaal "what shipped today, what's stuck, what's tomorrow's first task" — 3 questions, capture answers as graph nodes
   - `task_tracker` — when Zaal says "task: X" or "todo: X" or "/add X", commit as Task node with status: open. When Zaal says "done X", flip to status: shipped
   - `proactive_nudge` — if no fact ingested in 12+ hours, ping Zaal "anything to capture from the last half-day?"
3. Test: tomorrow morning, do entire day's work via Claude Code + Bonfire bot only. No DMs to @zaoclaw_bot.

### Phase 2 — kill openclaw (this week, 1 hour)

1. `ssh zaal@31.97.148.88 'docker stop openclaw-openclaw-gateway-1 && docker update --restart=no openclaw-openclaw-gateway-1'`
2. Disable any cron jobs that still reference `~/zoe-bot/` or `~/.openclaw/`
3. Disable openclaw watchdog respawn rule
4. Keep the container around for 30 days as backup, then `docker rm` after grace period
5. Reclaim VPS resources (~600MB RAM, some CPU)

### Phase 3 — fold Devz bot into Hermes (this week, 1 hour)

1. /SHIP FIX in ZAO Devz channel currently: ZAO Devz bot receives → forwards to Hermes via HTTP
2. Better: GitHub PR webhook → Hermes directly. Devz channel just gets a "Hermes is fixing PR X" notification posted by Hermes (one-way, not interactive)
3. Stop running ZAO Devz bot module on VPS
4. Update Hermes to post status updates to ZAO Devz channel as a one-way notifier

### Phase 4 — kill ZOE learning pings (this week, 30 min)

1. Bonfire generates the same tips natively (LLM + graph context)
2. Schedule via Bonfire's task scheduling: hourly "post a ZAO learning tip in @ZAODevzCommunity General"
3. Configure Bonfire's "Allowed groups" to include the ZAO Devz general topic
4. Stop the python cron at `~/zoe-learning-pings/run.sh`

### Phase 5 — mark Composio AO + 10-bot fleet permanent defer (this week, doc only)

1. Update `project_composio_ao_pilot.md` memory: status `decommissioned 2026-05-04`
2. Update `project_tomorrow_first_tasks.md` memory: status `permanent defer — Bonfire eats this role`
3. Stop running Composio containers on bcz, reclaim resources

### Phase 6 — formalize Hermes + ZAOstock Team Bot as the only background services (this week, doc only)

Update `CLAUDE.md` "Workflow Orchestration" section:
- Primary surfaces: Claude Code CLI, Bonfire DM, ZAOstock Team Bot
- Background: Hermes (PR-triggered), trading agents (parameter-driven)
- No new bots without a written /zao-research justification doc explaining why Bonfire can't do it

## Kill List (formally deprecated)

| Item | Action | When |
|---|---|---|
| ZOE @zaoclaw_bot openclaw container | Stop + disable restart, keep 30d as backup | Phase 2 |
| ZAO Devz bot module | Replace with Hermes one-way notifier | Phase 3 |
| ZOE learning pings cron | Replace with Bonfire scheduled task | Phase 4 |
| Bot-to-bot bridge group | Leave group alive as passive ingest only, never wire autonomy | Now |
| ZAO Recall Relay Bot (proposed today) | Don't create | Now |
| OpenClaw ZOEY + WALLET sub-agents | Decommission with the parent container | Phase 2 |
| Composio AO pilot | Stop containers, mark memory `decommissioned` | Phase 5 |
| 10-bot fleet plan (`project_tomorrow_first_tasks`) | Permanent defer, mark memory | Phase 5 |
| FISHBOWLZ | Already paused, mark formally dead | Phase 5 |
| ZOE v2 redesign brainstorm | Skip — Bonfire eats this role | Phase 5 |
| Hermes Telegram interface (proposed in doc 599 #19) | Don't build | Now |
| Quarterly bridge transcript export | Skip, bridge group is passive ingestion only | Now |

## Risks of Option B

| Risk | Mitigation |
|---|---|
| Bonfire trial expires 2026-05-29 without API key from Joshua.eth | Quarterly OWL export protects corpus. If Bonfire dies, fallback is LightRAG self-host (doc 568). |
| Bonfire's task scheduling can't actually do the proactive nudges | Test in Phase 1. If it can't, keep openclaw running until alternative built. |
| Mobile users (Cassie, Steve Peer) confused that ZOE is now Bonfire | Document in CLAUDE.md + ZAOstock Team Bot help text. They mostly DM Zaal anyway. |
| ZAO Devz General topic stops getting hourly tips during phase 4 transition | Keep cron running until Bonfire scheduled task verified working. |
| Trading agents (VAULT/BANKER/DEALER) somehow depend on openclaw | They don't — they live in `src/lib/agents/` and run from runners. Verify before Phase 2. |
| Hermes loses /SHIP FIX trigger during Phase 3 transition | Keep both paths working until webhook proven. |

## What Stays vs Goes Summary

| Surface | Status after cleanup | Daily user |
|---|---|---|
| **Claude Code CLI** | KEEP — primary | Zaal |
| **Bonfire DM bot @zabal_bonfire** | KEEP — primary, expanded role | Zaal |
| **ZAOstock Team Bot @ZAOstockTeamBot** | KEEP — scoped, untouched | ZAOstock team |
| **Hermes coder/critic** | KEEP — background, simplified | PR webhook |
| **VAULT/BANKER/DEALER** | KEEP — autonomous trading | (background) |
| ZOE @zaoclaw_bot openclaw | KILL Phase 2 | n/a |
| ZAO Devz bot module | KILL Phase 3 | n/a |
| ZOE learning pings cron | KILL Phase 4 | n/a |
| Bridge group autonomy | DEFER permanently until Bonfire SDK | n/a |
| 10-bot fleet | DEFER permanently | n/a |
| Composio AO | DECOMMISSION | n/a |
| FISHBOWLZ | DEAD | n/a |

## Implementation Difficulty (1-10 scale, no time estimates per Zaal feedback memory)

| Phase | Difficulty | Dependencies |
|---|---|---|
| Phase 1 (Bonfire trait config + verify) | 2 | Just Bonfire UI access |
| Phase 2 (kill openclaw) | 3 | Backup confirmation, no live dependencies |
| Phase 3 (fold Devz into Hermes webhook) | 5 | Hermes git webhook listener config |
| Phase 4 (Bonfire scheduled tips) | 4 | Bonfire scheduling tool tested |
| Phase 5 (memory updates) | 1 | None |
| Phase 6 (CLAUDE.md update) | 1 | None |

Total cleanup: difficulty 16/60 — under-half complexity to delete vs build. Cleanup is easier than building was.

## Counter-arguments + responses

> **"What if Bonfire goes away in 6 months?"**
> Quarterly OWL export to git. Migration to LightRAG (doc 568) is a 1-2 day port if forced. Bonfire is replaceable — that's why we never built ZOE-tightly-coupled-to-Bonfire.

> **"What if I want a brand-specific bot for X later?"**
> Write a /zao-research doc justifying why Bonfire can't do it. If you can't justify, you don't need it. Most "I want a bot for X" turns out to be "I want a graph fact about X that Bonfire already has."

> **"What about cross-bot autonomy — bots talking to each other?"**
> Wait for Bonfire's MCP server. Until then, Zaal is the orchestrator. The bridge group experiment from 2026-05-03 confirmed this is too early.

> **"Hermes feels lonely without Telegram identity."**
> Hermes runs from PR webhooks. It already gets all the trigger surface it needs. Adding Telegram = adding state, complexity, ANOTHER bot to maintain.

> **"What about the 10-bot fleet for ZAO branding?"**
> The fleet plan was a 2026-04 brainstorm. Each "brand bot" was supposed to be a personality with its own Telegram account. Bonfire can host all those personalities as different agents within the same bonfire (per Bonfires.ai's multi-agent capability). One bonfire, many personality-traited agents, no new tokens or services.

## What Daily Reality Looks Like After Cleanup

**Zaal's morning:**
- Wake → check phone → DM Bonfire: "morning, what's on for today?"
- Bonfire replies with yesterday's open tasks + reflection notes from last night
- Zaal heads to gym → comes back → Claude Code

**Zaal mid-day:**
- Lunch stream → captures via DM to Bonfire: "ingest fact: [insight from stream]"
- Group chat with Cassie about ZAOstock → meaningful decision happens → forwarded to Bonfire DM as INGEST FACT

**Zaal end-of-day:**
- Bonfire DMs at 9pm: "what shipped today, what's stuck, tomorrow's first task?"
- 3-message reflection captures the day
- Sleep

**Claude Code workflow (parallel):**
- Daily research, code, writing
- When graph context needed: switch to phone, DM Bonfire `RECALL: <q>`, copy reply back to Claude Code
- When SDK arrives: Claude Code calls Bonfire MCP server directly, no copy-paste

**No more:**
- "Why is ZOE not responding?" sessions
- Container restart loops
- Bot-to-bot bridge debug
- Multiple AGENTS.md files to maintain

## Open Questions (resolve before Phase 2 kill)

1. Does Bonfire's scheduled tasks actually fire on cadence? Test in Phase 1 with a 5-min reminder.
2. Does Bonfire bot work in groups other than DM? (For learning pings to ZAO Devz topic.)
3. Are there any cron jobs / scripts on VPS that depend on openclaw being up?
4. Does the zoe-dashboard at zoe.zaoos.com actually get used? (If yes, that's a separate decision; if no, kill DNS.)
5. Joshua.eth API key timeline — if SDK access lands in 2 weeks, postpone Phase 2 to do migration cleanly with API.

## Also See

- [Doc 547](../547-multi-agent-coordination-bonfire-zoe-hermes/) — earlier multi-agent spec (now superseded by Option B)
- [Doc 549](../../identity/549-bonfire-personal-second-brain/) — Bonfire as second-brain rationale
- [Doc 590](../../identity/590-bonfire-power-user-playbook/) — Bonfire daily use
- [Doc 599](../599-zao-bonfire-bridge-operating-group/) — bridge spec, now status: DEFER PERMANENT
- [Doc 600](../600-agentic-stack-coordination-v1/) — current state inventory (this doc proposes the cleanup of that state)

## Next Actions

| Action | Owner | Type | When |
|--------|-------|------|------|
| Approve this plan | @Zaal | Decision | Today |
| Phase 1 — Bonfire trait config + scheduled task test | Claude via /vps + Bonfire UI | Config | Today |
| Phase 2 — Stop openclaw container, disable restart | Claude via SSH | Infra | This week |
| Phase 3 — Hermes webhook absorbs /SHIP FIX | Claude | Code | This week |
| Phase 4 — Bonfire scheduled tips replace cron | Claude + Bonfire UI | Config | This week |
| Phase 5 — Update memory files (composio decommissioned, 10-bot deferred, fishbowlz dead, zoe-v2 skip) | Claude | Doc | This week |
| Phase 6 — CLAUDE.md primary-surfaces section + "no new bots without doc" rule | Claude | Doc | This week |
| Add to project memory: "Option B locked 2026-05-04, see doc 601" | Claude | Memory | After approval |

## Sources

- Doc 234 (OpenClaw guide) — internal, openclaw deep dive showed complexity vs use
- Doc 415 (Composio AO pilot) — internal, paused for 3+ weeks
- Doc 461 (fix-PR pipeline live) — internal, Hermes is healthy
- Doc 506 (TRAE AI skip) — internal, telemetry concerns drive simplicity preference
- Doc 523 (agentic systems audit) — internal, audit caught silent timeouts
- Doc 524 (live/archived/started/planned) — internal, accountability of agentic state
- Doc 527 (multi-bot Telegram coordination) — internal, 16-agent dispatch research = aspirational, not built
- Doc 547 (Bonfire-ZOE-Hermes coordination) — internal, original 3-system spec
- Doc 549 (Bonfire as second-brain) — internal, second-brain pattern that now becomes the daily ZOE
- Doc 569 (YapZ ingest strategy) — internal, validates Bonfire can absorb large corpus
- Doc 570 (personal KG agentic memory) — internal, "agents on small corpus = noise" principle
- Doc 581 (Bonfire bot hygiene) — internal, 8 bug classes documented
- Doc 590 (Bonfire power-user playbook) — internal, daily-use pattern
- Doc 599 (bridge group spec) — internal, now status DEFER per this doc's recommendation
- Doc 600 (agentic stack coordination v1) — internal, proposes "Zaal orchestrator + 3 surfaces" — this doc collapses to even fewer surfaces
- Lived experience 2026-04-29 → 2026-05-04 (this session) — primary source for tech debt audit
