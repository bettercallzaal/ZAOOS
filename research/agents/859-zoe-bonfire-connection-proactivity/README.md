---
topic: agents
type: guide
status: research-complete
last-validated: 2026-06-15
related-docs: "796, 759, 858, 781, 801, 855"
original-query: "/zao-research the ZOE and bonfires connection points, and make ZOE more active in my day to day"
tier: STANDARD
---

# 859 - ZOE <-> Bonfire connection points + making ZOE more active

> **Goal:** map exactly how ZOE connects to the Bonfire graph today, and turn that connection into the engine that makes ZOE more proactively useful day-to-day. The two are the same problem: ZOE's proactivity is currently blind to the graph.

## Key Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Add a **graph-driven candidate source** to ZOE's proactive reasoning tick | ZOE's tick today only sees threads/tasks/inactivity/calendar. The Bonfire graph (people, projects, decisions) is the richest proactive signal and is untapped. This is the single highest-leverage change. |
| 2 | First three graph-driven nudges: **stale relationship**, **open decision**, **stale project** | Each is a concrete, high-value "be useful" ping derivable from the graph, and each fits the existing single-best-thing + threshold gate (so no new noise). |
| 3 | Keep the threshold gate (doc 796) - feed it MORE candidates, don't lower the bar | "More active" = more good candidates competing, not a chattier bot. The gate + self-throttle already protect against noise. |
| 4 | ZOE answers graph questions from `/delve` recall directly (now 12 episodes) - the bonfire BOT is not in the loop | Bot-to-bot Telegram limit makes tagging the bonfire bot a dead end; ZOE reads the same graph via API. (Fixed this session.) |

## Connection points (current state, from code)

ZOE <-> Bonfire lives in `bot/src/zoe/recall.ts`:

| Direction | Path | What | Status |
|-----------|------|------|--------|
| **READ** | `recall()` -> `POST /delve {bonfire_id, query}` | Pulls ranked episodes, injected into the turn as `<bonfire_recall>`. | Live. Raised 5 -> **12 episodes** + source + 500-char body this session (was too thin). |
| **WRITE** | `remember()` -> `POST /knowledge_graph/episode/create` | Mirrors ZOE's captures/decisions into the graph as episodes (secret-scanned first). | Live. The graph grows from daily ZOE use. |
| **MIRROR** | `mirrorTurn()` | Captures + task/quest changes get mirrored to the graph each turn. | Live. |
| **Persona** | graph-access block (`persona.md`) | ZOE answers ZAO/sponsor/project/person questions from `<bonfire_recall>`; does NOT tag the bonfire bot. | Deployed this session. |

So the graph is already ZOE's shared long-term memory: she reads it for context and writes her captures back. **What's missing: she never PROACTIVELY queries the graph to find things worth surfacing.**

## ZOE's proactivity today (doc 796)

- **Scheduler floors** (`scheduler.ts`): 5am morning brief (always-on floor), 9pm evening reflection, hourly forward nudge (next move from `tasks.json`). No quiet hours ("rather get pinged than ignored").
- **Reasoning tick** (`proactive.ts`, doc 796): "cron -> silent reasoning -> speak only if it clears the bar." Gathers candidates, scores, speaks AT MOST the single best one, only if over threshold. Most ticks stay silent. Guards: single-best-thing, silence-observability, unacked self-throttle.
- **Candidate kinds today:** `thread-nudge | thread-decision | task-nudge | inactivity | calendar`. All sourced from `tasks.json` + open threads + calendar. **Zero graph-sourced candidates.**

## The plan: make ZOE more active via the graph

Add a `bonfire` / graph candidate source feeding the existing tick. Each candidate is a one-line proactive ping ZOE can surface when it wins the tick:

| New candidate | Graph signal (via /delve or a targeted query) | The ping | Noise guard |
|---------------|-----------------------------------------------|----------|-------------|
| **stale-relationship** | a Person node with last-interaction > N weeks | "You haven't talked to [person] in 3 weeks - last was [context]." | Only ecosystem people Zaal flagged; high score decay so it rarely beats a due thread. |
| **open-decision** | a Decision/TODO node still unresolved past its date | "[decision] from [date] is still open - close it or drop it?" | Must have an explicit open marker; dedupe against threads. |
| **stale-project** | a Project node with no new episodes in N days | "[project] has gone quiet - [last state]. Still live?" | Only Zaal's active projects; weekly cadence max. |
| **graph-gap (weekly)** | the completeness-critic pattern: what's missing/unverified | "Worth capturing: [X] - it's referenced but not in the graph." | Weekly only, lowest priority. |

Mechanics: a new `gatherBonfireCandidates()` in `proactive.ts` runs a couple of targeted `/delve` queries (or a future graph endpoint), maps results to `Candidate`s with a `bonfire` kind, and hands them to the existing `pickBest` + threshold. No new send path, no new noise budget - it just enriches the candidate pool.

Plus two tuning levers (do AFTER the candidate source ships, measure first):
- Watch the silence-rate log; if ZOE is too quiet, nudge the threshold down a notch.
- Add a lightweight "what did you ship / who did you talk to today" graph-write prompt so the relationship/project recency data exists to nudge on.

## Also See

- [Doc 796](../796-zoe-conversational-proactive-redesign/) - the reasoning-tick proactivity system this extends
- [Doc 858](../858-bonfires-graphiti-current-state/) - Bonfires/Graphiti build facts (why /delve, episode hygiene)
- [Doc 759](../759-zoe-orchestrator-architecture/) - locked ZOE orchestrator (GATEWAY)
- [Doc 801](../801-zoe-cowork-systems-audit-consolidation/) - the systems audit

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Build `gatherBonfireCandidates()` in proactive.ts (stale-relationship first) | @Zaal/Claude | PR | Next |
| Add `bonfire` to CandidateKind + score function | @Zaal/Claude | PR | With above |
| Ensure relationship/project recency data is in the graph (write path) | @Zaal | Check | Before nudges fire |
| Measure silence-rate for a week, then tune threshold | @Zaal | Observe | After ship |
| Merge the deployed recall.ts (12 episodes) + persona changes (PRs this session) | @Zaal | Merge | When rate limit clears |

## Sources

- `bot/src/zoe/recall.ts`, `proactive.ts`, `scheduler.ts`, `nudges.ts`, `concierge.ts` [FULL - read this session]
- Live VPS state (zoe-bot active, /delve verified, persona deployed) [FULL - SSH this session]
- [Doc 796 reasoning-tick design] [FULL]
