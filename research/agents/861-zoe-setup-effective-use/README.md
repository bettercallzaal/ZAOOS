---
topic: agents
type: guide
status: research-complete
last-validated: 2026-06-15
related-docs: "759, 796, 858, 859, 860, 801"
original-query: "better ways to use ZOE and check how its set up and ways to more effectively do this"
tier: DEEP
---

# 861 - ZOE: how it's set up + how to use it effectively

> **Goal:** the canonical how-to for getting value from ZOE - what it is, exactly how it's wired today (June 2026), the habits that make it useful, the commands, and the gotchas. Companion to doc 860 (the improvement roadmap); this one is for the USER.

## Key Decisions (the habits that actually make ZOE useful)

| # | Do this | Why |
|---|---------|-----|
| 1 | **Feed it your day.** End of day, tell ZOE what you shipped / who you talked to / what you decided. | ZOE is only as smart as the graph. It writes your input to the Bonfire graph + CRM; the brief, recall, and proactive nudges all run on that. Stale input = stale answers (the sponsor reply was 3 weeks behind for exactly this reason). |
| 2 | **Use it as memory, not Google.** "ZOE what do we know about X" - it reads the graph (`/delve`) + greps research. | Faster than digging 860+ docs. Name a doc number / person / date and recall fires harder. |
| 3 | **Answer the 9pm reflection.** | That Did/Stuck/Tomorrow prompt is how ZOE updates what it knows about you (the reflexion loop, `reflexion.ts`). Skipping it starves the learning. |
| 4 | **Delegate research:** "ZOE look into X for me" | Spins up a research-worker (Haiku, ~30 min, 5-7 sources). Anything you'd open 10 tabs for. |
| 5 | **Tell it commitments:** "I told Tom I'd send the deck" | ZOE opens an open-thread and nudges you before it's overdue (`threads.ts`). A promise-tracker if you feed it promises. |
| 6 | **Reply to ZOE's proactive pings** | An unanswered ping counts toward the self-throttle; ZOE raises its own bar after 3 unacked. Replying keeps it calibrated. |

## How ZOE is set up (architecture, verified from code)

- **Runtime:** a systemd user unit `zoe-bot` on VPS 1 (`zaal@31.97.148.88`), `tsx src/index.ts`, polling as `@zaoclaw_bot`. Source: `bot/src/zoe/`.
- **Brain:** the Claude Code CLI (`callClaudeCli`), Sonnet default. `selectModel()` routes strategic/long messages to Opus, short factual to Haiku.
- **Memory (Letta-style 4 blocks, rebuilt per turn):** `persona` (identity/voice, `~/.zao/zoe/persona.md`), `human` (Zaal facts), `working` (last 8 turns/chat), `tasks` (open queue) - plus `quests` + `open_threads`. Source: `memory.ts`.
- **Knowledge graph:** ZABAL Bonfire. ZOE READS via `recall()` -> `POST /delve` (12 episodes, injected as `<bonfire_recall>`) and WRITES captures via `remember()`. Source: `recall.ts`.
- **Orchestration (GATEWAY, doc 759):** ZOE dispatches to 8 worker subagents (`research-worker`, `code-reviewer`, `comms-drafter`, `data-runner`, `brief-writer`, `recap-agent`, `watcher-agent`, `task-dispatcher`) + 3 critics. Code-fix routes to Hermes (`@zoe_hermes_bot`).
- **Self-improvement:** `reflexion.ts` (confidence-scored memory patches from your reflection answers, y/n or voice-note) + `learn.ts` (weekly clustering of critic issues -> per-worker prompt learnings).

## What ZOE does proactively (the scheduler + reasoning tick)

| Surface | When | What |
|---------|------|------|
| **Morning brief** | 5am ET (09:00 UTC) | Top priorities, last-24h commits (ZAOOS + cross-repo), open PRs, inbox. Always-on floor. |
| **Evening reflection** | 9pm ET (01:00 UTC) | Did/Stuck/Tomorrow, anchored on your most-relevant open commitment. Feeds reflexion. |
| **Reasoning tick** | hourly | Gathers candidates, scores them, speaks AT MOST one if it clears the 0.6 threshold. Most ticks stay silent. |

**Proactive tags now live (the reasoning tick's candidates):**
- `[STALE PR]` - your PRs stuck 4-21 days (tuned down from 48h after noise)
- `[CI FAIL]` - red builds on your open PRs (score 0.82, high)
- `[GRAPH]` - a watched front (ZAOstock, WaveWarZ, ZABAL Games, Brazil network, ZAO Festivals) cold 10+ days
- inactivity check-in - quiet 4h+ during waking hours -> one soft "on track?"
- `[CALENDAR]` - an event starting within 2h (reads `~/.zao/private/gcal-*.json`; no-op until GCal is pulled into a session)
- thread nudges/decisions - commitments due/overdue; 2 snoozes -> "resolve or drop?"

All compete in one gate (`proactive.ts` `pickBest` + threshold). Self-throttle: 3 unacked -> ZOE raises its bar + asks to dial back.

## Commands + toggles

| Command | Does |
|---------|------|
| (just talk) | Concierge - ask, delegate, capture. DM `@zaoclaw_bot`. |
| `stop nudges` / `start nudges` | Mute/unmute the task-queue nudge |
| `/drafts` | Review the social-post drafts ZOE queued |
| `/zg ...` | Group config (enable ZOE in a Telegram group: `/zg enable mention`) |
| `/inbox` (in a Claude session) | Process ZOE's email queue (`zoe-zao@agentmail.to`) |
| voice note | Transcribed + used (good for the reflection or a brain-dump) |

## Gotchas (learned this session)

- **Don't message ZOE right at 9pm.** The evening reflection arms an "await-reflection" capture - a new request sent in that window gets logged as your reflection answer. Answer the reflection first, then ask.
- **Timezone:** fixed 2026-06-15 - the brief/reflect labels were showing the VPS's UTC; now pinned to `America/New_York`.
- **ZOE can edit its own production code.** It self-implemented the inactivity + calendar nudges. Powerful, but it left them uncommitted + unverified - it can ship a bug just as easily. **Open guardrail:** route ZOE self-edits through a PR/review, not straight to the live file (doc 860 Tier C).
- **Nudges are signal-gated, not useful-by-default.** If a class of ping isn't useful (PR/graph were flagged not-useful), tell ZOE and tune or disable it - the threshold + your feedback are the controls.

## Also See

- [Doc 860](../860-zoe-improvement-roadmap/) - the improvement roadmap (what to build next)
- [Doc 859](../859-zoe-bonfire-connection-proactivity/) - the graph-driven proactivity design
- [Doc 858](../858-bonfires-graphiti-current-state/) - the Bonfire graph ZOE reads/writes
- [Doc 796](../796-zoe-conversational-proactive-redesign/) - the reasoning-tick proactivity
- [Doc 759](../759-zoe-orchestrator-architecture/) - the GATEWAY + 8-worker architecture

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Build the habit: end-of-day "here's what happened" to ZOE | @Zaal | Habit | Daily |
| Decide: wire calendar nudge to auto-pull GCal so it fires (currently no-op) | @Zaal | Decision | Next |
| Add the ZOE-self-edit guardrail (self-edits via PR, not live file) | @Zaal/Claude | PR | Soon |
| Merge this session's ZOE branch (persona/recall/brief/events/TZ) | @Zaal | Merge | When ready |

## Sources

- `bot/src/zoe/` read in full this session: `index.ts`, `concierge.ts`, `memory.ts`, `recall.ts`, `proactive.ts`, `scheduler.ts`, `brief.ts`, `reflect.ts`, `events.ts`, `nudges.ts`, `threads.ts`, `reflexion.ts`, `learn.ts`, `workers.ts` [FULL - direct code audit + live VPS verification]
- Live VPS state: `zoe-bot` active, proactive-log.jsonl, seen-events.json [FULL - SSH this session]
- [Doc 860 / 859 / 858] - the ZOE research from this session [FULL]
