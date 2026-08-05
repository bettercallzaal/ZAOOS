---
topic: agents
type: decision
status: research-complete
last-validated: 2026-08-05
superseded-by:
related-docs: 2199, 2200, 621
original-query: "i thought we had bonfires as a memory map what happened to pushing and pulling from there /zao-research this and then lets make ZOE really understand the zao and all our needs including helping build the coworking board so i can share with the team the todos currently happening"
tier: STANDARD
---

# 2201 - Bonfire IS ZOE's memory map: what's actually there, the real gap, and making ZOE understand ZAO + the board

> **Goal:** Answer "what happened to Bonfire push/pull", reconcile it with the doc 2199 "add a failure memory" rec, and chart how ZOE actually understands ZAO + surfaces the live team todos.

## Key Decisions (recommendations first)

| # | Decision | Why |
|---|----------|-----|
| 1 | **Nothing broke - Bonfire push/pull is BUILT and LIVE. Doc 2199's "failure memory" was wrong to propose a NEW store; it should be Bonfire episodes (push a `failure`/`lesson` episode, pull via `/delve`).** | `recall.ts` = the working bridge (WRITE `/knowledge_graph/episode/create`, READ `/delve`); `thread-memory.ts` writes an episode on every thread open/resolve/drop; `BONFIRE_API_KEY/ID/AGENT_ID` are all set in live ZOE; the turn injects a `<bonfire_recall>` block. The substrate exists - use it, don't fork it. |
| 2 | **The real gap is CONTENT, not plumbing: the graph is dominated by shallow research-doc STUBS, not current-state ZAO knowledge.** A live delve for "ZAO current priorities" returned 17 episodes that were mostly `"ZAO research doc #276... Type: research. Status: unknown"` - titles, not substance. | ZOE can pull the graph but the graph doesn't hold "what are we doing right now." Fix: push RICH current-state episodes (priorities, live decisions, the ZAO context canon doc 621) - not just doc-title stubs from the research mirror. |
| 3 | **The live coworking-board todos are NOT in Bonfire - they live in the cowork tracker Supabase. To "share the todos currently happening", ZOE reads the TRACKER directly (it already holds `COWORK_TRACKER_URL/KEY`), not the graph.** | A delve for "coworking board current team todos" returned research docs about dashboards, not the actual board. Bonfire = semantic/durable knowledge; the tracker = live task state. ZOE needs BOTH, pulled from their real homes. |

## What "memory + a real gate + seeing inside a run" means once reconciled with Bonfire

- **MEMORY = Bonfire** (built; needs richer episodes + the board bridge - decisions 2/3). NOT a new SQLite store (corrects doc 2199).
- **A REAL GATE = loop-evals / deterministic checks** (docs 2198, 2200) - unchanged; Bonfire is not a gate.
- **SEEING INSIDE A RUN = OTel step-level tracing** (doc 2200) - separate from Bonfire. Tracing = execution telemetry ("where did this run fail"); Bonfire = semantic knowledge ("what did Zaal commit to / what is ZAO"). Both needed; different substrates. Don't conflate them.

## The grounding (real fetches this run)

- `bot/src/zoe/recall.ts` header: WRITE + READ both verified live 2026-05-30; the old `/vector_store/search` bug (always count:0) was fixed by switching to `/delve` - a "What is ZAO?" delve returned 51 episodes.
- `bot/src/zoe/thread-memory.ts`: on thread transitions ZOE composes a prose episode -> ZABAL graph (with secret/PII scan + a retry queue in `bonfire-queue.ts`), so "future agents can recall what Zaal committed to."
- `bot/src/zoe/memory.ts` turn contract: (1) direct `/delve` recall injected into `<bonfire_recall>`; (2) ZOE drives `@zabal_bonfire_bot` itself for knowledge questions - "you drive; Zaal supervises."
- Live delve (this run): "current priorities" + "coworking todos" both returned ~17 episodes, overwhelmingly research-doc metadata stubs (`Status: unknown`), plus a couple of real meeting recaps (Vishnu x Zaal DevCon Buddy). Confirms decisions 2 + 3.

## Making ZOE understand ZAO + help the board (the plan)

1. **Feed the graph current-state, not stubs.** Push the ZAO context canon (doc 621) + a periodic "current priorities / active decisions" episode (from `reflect.ts` + the board) as RICH episodes, so a delve for "what are we doing now" returns substance. The research-doc mirror should push the doc's Goal + Key Decisions, not just its title + "Status: unknown".
2. **Bridge the board into ZOE.** ZOE reads the cowork tracker (it holds the creds - the build-candidate buttons already query it) and can produce a shareable "current team todos, grouped by goal/owner" view. This is the literal "share with the team the todos currently happening."
3. **Complement the goal-sorter, don't duplicate it.** A parallel Mac session is sorting the board's 364 unsorted items under goals (-> ~33 collapsed rows; its handoff bundle is in ZOE's cockpit HANDOFFS lane). ZOE's job is to supply the ZAO TAXONOMY (from the Bonfire canon) that the sort needs, then surface the sorted todos - not to re-run the sort.
4. **Two ZAO-taxonomy decisions the goal-sorter surfaced belong to Zaal** (they define what ZOE "understands"): (a) The ZAO is 170 of 364 items, only 46 matched three goals - stays one brand, or becomes a parent of several? (b) zol / sparkz / fractal - brands or concepts? (ZOLs are contribution credits, which doesn't obviously make a brand.) These are the canonical facts that, once decided, get written to Bonfire as the source of truth ZOE reads.

## Also See

- Doc 2199 (failure-memory - corrected here to "Bonfire episodes, not a new store") / Doc 2200 (tracing + verify-replan, separate from Bonfire)
- Doc 621 - ZAO context canon (the rich ZAO-understanding source to ingest)
- [[project_bonfire_delve_recall]] / [[project_bonfires_zao_integration]] / [[project_zao_tracker_unified]]

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Make the research-doc -> Bonfire mirror push the doc's Goal + Key Decisions (rich), not just title + "Status: unknown" - shipped when a delve for a recent doc returns its decisions, not just its title | @Zaal | PR | 2026-08-22 |
| Add a ZOE "current team todos" command that reads the cowork tracker + groups by goal/owner into a shareable block - shipped when ZOE posts a live todos summary Zaal can forward to the team | @Zaal | PR | 2026-08-19 |
| Push a weekly "ZAO current priorities + active decisions" rich episode to Bonfire (from reflect.ts + the board) so "what are we doing now" delves return substance - shipped when the episode exists and a delve surfaces it | @Zaal | PR | 2026-08-26 |
| DECIDE the two taxonomy questions (The ZAO one-brand-or-parent; zol/sparkz/fractal brands-or-concepts), then write the answer to Bonfire as canon - decided when the two answers are episodes in the graph | @Zaal | Decision | 2026-08-08 |
| Refactor doc 2199's failure-memory action to "Bonfire `failure` episodes + /delve recall", not a new SQLite store - shipped when doc 2199's table is amended | @Zaal | PR | 2026-08-12 |

## Sources

- `bot/src/zoe/recall.ts` (live code) - [FULL] the push/pull bridge + the /delve fix history
- `bot/src/zoe/thread-memory.ts`, `bonfire-queue.ts`, `memory.ts` (live code) - [FULL] episode-write on thread transitions + the `<bonfire_recall>` turn contract + bonfire-bot relay
- Live `/delve` queries against the ZABAL bonfire (this run) - [FULL] "current priorities" + "coworking todos" each returned ~17 episodes, mostly research-doc stubs -> the content gap (decisions 2/3)
- Live ZOE env (`~/zao-bot-live/bot/.env`, names only) - [FULL] BONFIRE_API_KEY/ID/AGENT_ID present -> configured + live, not dormant
- The Mac goal-sorter handoff bundle (`~/.zao/handoff/session-2026-08-05-zoe-goal-sorter/`) + its PR collapsing 364 -> ~33 rows - [PARTIAL] relayed via Zaal's paste, not fetched by me; the two taxonomy decisions are from that bundle

_Fetch method: live code reads + live Bonfire /delve on the VPS (grounded, not web). No exa this doc - the source of truth is ZOE's own code + graph._
