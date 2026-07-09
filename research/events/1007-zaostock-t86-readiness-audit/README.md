---
topic: events
type: audit
status: research-complete
last-validated: 2026-07-09
superseded-by:
related-docs: "609, 610, 871, 990, 1004"
original-query: "Getting ready for zaostock"
tier: STANDARD
---

# 1007 — ZAOstock T-86 Days Readiness Audit (Oct 3, 2026)

> **Goal:** Reconcile scattered April/May 2026 planning memory against the live zaostock.com codebase and the current (2026-07-09) cowork tracker to produce one accurate readiness picture, 86 days out from Oct 3. Close the exact tracker item due today ("confirm Art of Ellsworth deadline + Oct 1-4 overlap") along the way.

## Key Decisions

| Recommendation | Why |
|---|---|
| Close today's tracker task "ZAOstock: confirm Art of Ellsworth deadline + Oct 1-4 overlap" now | Resolved by this research: Art of Ellsworth: Maine Craft Weekend runs Thu Oct 1 - Sun Oct 4, 2026; the statewide Maine Craft Weekend proper is Oct 3-4. ZAOstock's Oct 3 date sits inside both windows - no scheduling conflict |
| Confirm with Cara Romano (Heart of Ellsworth) that ZAOstock's published 12pm-6pm window is acceptable | Heart of Ellsworth's own listed daily hours for Art of Ellsworth are 12:00 PM - 4:00 PM. ZAOstock's sponsor and program pages both list 12pm-6pm - two hours past HoE's own stated close. Not a conflict on its face, but it should be said out loud to the anchor partner rather than assumed |
| Pull a fresh Supabase snapshot of the ZAO STOCK project (`yjrlaxpjusmrfylumban`) | The only row-count data available (doc 610) is from 2026-05-05 - over two months stale. This session's Supabase MCP tool is scoped to the wrong project (`etwvzrmlxeobinrlytza`, the cowork tracker), so team/circle/sponsor/budget counts in this doc are last-known, not live |
| Correct two facts in `project_zao_stock_confirmed.md` that are now wrong | The memory says "Steve Peer: NOT yet onboard" and "Wallace Events tent rental (not yet onboarded)" - both are now false. The live sponsor page lists Steve Peer as an advisor ("37 years Ellsworth music scene"), and the live program page states "Weather: tent coverage via Wallace Events, rain or shine" |
| Check the sound-system booking status directly | Doc 610's production audit flagged "Sound system is make-or-break - book by June 1" as the top infrastructure risk. That deadline is now 5+ weeks past with no confirmation found anywhere checked this session (memory, tracker, codebase) that it happened |
| Get a current-owner check on the Finance / Marketing / Music / Ops circle coordinator seats | As of the May 5 team roster (`project_zao_stock_team.md`), all four of those coordinator seats were listed "(open)." Doc 871 (2026-06-17) proposed Dcoop for lineup, Candy/Zaal for venue+ops, Jay-or-Duh (uncertain) for sponsors, Chikodi for volunteers - all flagged as needing a named understudy. The live tracker (2026-07-09) confirms Jay + Duh are now actively working sponsors phase-two kickoff, closing that one. Lineup, venue, and volunteers still have no confirmed-understudy update found this session |
| Get the Wallace Events stage + tent agreement signed, or confirm it already is | Doc 871 (2026-06-17) explicitly called this out as "currently a handshake" and listed signing it as a this-week action. The live `/program` page states "tent coverage via Wallace Events, rain or shine" as settled fact. These two sources are three weeks apart and in tension - the public copy may be ahead of the actual paperwork |

## Findings

### 1. The exact deadline due today is resolved - no conflict

The 2026-07-06-dated tracker item "ZAOstock: confirm Art of Ellsworth deadline + Oct 1-4 overlap" is due today, 2026-07-09, and was still open. Direct verification: **Art of Ellsworth: Maine Craft Weekend runs Thursday, October 1 through Sunday, October 4, 2026** (Heart of Ellsworth's own calendar listing states "Thursday, October 1, 2026 12:00 PM Sunday, October 4, 2026" verbatim). The **statewide** Maine Craft Weekend event proper - the narrower, state-organized tour - runs **October 3 + 4, 2026** per mainecraftweekend.org's own homepage. ZAOstock's confirmed date, October 3, sits inside both windows. There is no date conflict to resolve; the open question was always going to close as "confirmed, no overlap issue." [FULL - both Heart of Ellsworth's calendar page and mainecraftweekend.org fetched via exa, exact dates quoted directly from source]

One wrinkle: Heart of Ellsworth's Maine Public community-calendar listing for Art of Ellsworth gives daily hours as **12:00 PM - 4:00 PM**. ZAOstock's own sponsor page (`/sponsor`) and program page (`/program`) both list the festival running **12pm - 6pm**. Not a real conflict - ZAOstock isn't bound by HoE's own hours - but worth flagging to Cara Romano directly rather than assuming it's fine by omission. [FULL - Maine Public listing fetched via exa]

### 2. Real progress since the April/May snapshots that stale memory doesn't reflect

Direct reads of the live codebase (`zaostock/src/app/sponsor/page.tsx`, `/program/page.tsx`, `/apply/page.tsx`, `/musicians/submit/page.tsx`) show several things resolved since the last time anyone updated the relevant memory:

- **Steve Peer** ("37 years Ellsworth music scene") is now listed as one of 5 named advisors, alongside Adam Place (Songjam), Craig Gonzalez (Whop), Tom Fellenz, and Tyler Stambaugh (Magnetiq). `project_zao_stock_confirmed.md` still says "NOT yet onboard" - that's stale as of this audit.
- **Wallace Events** tent rental is at least *publicly* confirmed: the program page states "Weather: tent coverage via Wallace Events, rain or shine," which is further along than the April memory's "not yet onboarded." But doc 871 (2026-06-17, three weeks more recent than that memory but still 3 weeks stale relative to this audit) explicitly flagged it as "currently a handshake" and listed "sign the Wallace Events stage + tent agreement (stop the handshake risk)" as an immediate action. No source checked this session confirms the agreement is actually signed rather than just publicly assumed. Treat this as **unconfirmed, not resolved**, until someone checks.
- **The domain/repo cutover to `ZADEVZ/zaostock`** that doc 871 listed as a this-week action item on 2026-06-17 is done: `git remote -v` on the local zaostock checkout confirms `origin` is `https://github.com/ZAODEVZ/zaostock.git`.
- **Fiscal sponsorship is resolved and more developed than the April "FailOften confirm FA umbrella THIS WEEK" ask** described. The live sponsor page names a specific structure: **New Media Commons**, "a fiscally sponsored project of Fractured Atlas," handling the tax-deductible/donor path, plus a separate entity called **ENTERACT** handling production/treasury (2% fee) for the commercial-sponsor path. ENTERACT does not appear in any memory file checked this session - it's new information not yet captured anywhere durable.
- **The musician open call is live and matches the April 25 decision exactly**: `/musicians/submit` states the Sept 3, 2026 cutoff for final materials, rolling review, explicitly "not pay-to-play," and correctly uses "submit"/"submissions" language per the naming rule in `project_zaostock_open_call.md`.
- **Volunteer signup (`/apply`) is live** with 8 role types and 5 shift blocks - this wasn't described in any prior memory at all, a fully new build.
- **The day-of program is drafted**: 17 timed blocks from noon doors to ~6pm wind-down, 2 WaveWarZ battles, "Full lineup announces August 2026," "Final version locks September 2026." [FULL - all five pages read directly from the live repo]

### 3. Sound system booking status is unknown and the deadline has passed

Doc 610 (production audit, 2026-04-11) named the sound system as the single make-or-break infrastructure item and set a hard internal deadline of **June 1, 2026** to have it booked. That date is now 38 days in the past relative to this audit (2026-07-09). Nothing checked this session - not the tracker, not memory, not the codebase - shows this as resolved, in progress, or even mentioned again after the original April audit. This is either quietly handled and undocumented, or a genuine gap that's gone unflagged for over a month. [FULL search of available sources - tracker, memory, codebase - zero mentions found post-April]

### 4. Circle/workstream ownership has moved twice since May, and only one seat is confirmed current

The 2026-05-05 team roster (`project_zao_stock_team.md`) locked 6 circles with Finance/Marketing/Music/Ops all coordinator "(open)." Doc 871 (2026-06-17) reframed this as "5 workstreams" and proposed named mains - Dcoop (lineup), Candy/Zaal (venue+ops), "Jay or Duh?" (sponsors, explicitly uncertain), Chikodi (volunteers), Zaal (site+media) - while flagging that workstreams 2-5 had **no named understudy** and sponsors had **no confirmed main** as of that date. The live tracker (2026-07-09) now shows Jay + Duh both actively working a "phase-two kickoff: Sponsors main" task due tomorrow - the sponsors seat is credibly resolved. Lineup (Dcoop), venue+ops (Candy/Zaal), and volunteers (Chikodi) show no update past the June 17 proposal anywhere checked this session - still open questions on whether they were confirmed and whether any got an understudy. [PARTIAL - tracker task titles imply current sponsor ownership; the other three workstreams' status is last-known from doc 871, not verified this session]

### 5. Tracker shows genuine momentum, plus one internal contradiction worth resolving

Querying the live cowork tracker for "zaostock" (2026-07-09) returns 15 items. Notable:

- **DONE, ahead of schedule:** "ZAOstock funding: start MaineCF Hancock County + Fractured Atlas crowdfund" - marked done despite a due date of 2026-07-31, three weeks out.
- **DONE:** "ZAOstock: file Mass Gathering permit with Ellsworth Police[/City]" - the actual filing task is marked complete.
- **Still OPEN, same due date (2026-08-19):** "ZAOstock: permit OR City co-sponsorship (call Roddy first)." This is a live contradiction worth resolving directly with Zaal: if the permit was filed and marked done, why does a same-deadline task about needing "permit OR co-sponsorship" - implying the path isn't settled - remain open? Possible explanations: the filing was submitted but not yet approved, or the co-sponsorship path is a parallel backup being kept alive regardless. Either is fine, but the two tracker rows currently read as contradictory on their face. [FULL - both task rows read directly from the tracker; the underlying reason for the contradiction was not independently resolved this session]
- **Due tomorrow (2026-07-10):** an inbox-sourced item to send Chesnee an image asset for Maine Craft Weekend promotion, and the Jay/Duh sponsor phase-two kickoff noted in Finding 4.
- **Due 2026-07-10:** review this session's own doc 990 (ZAOstock SEO Audit) - already shipped, this task just needs Zaal's review pass.

### 6. Two parallel sponsorship structures have circulated; only one is live

The May 4 cobuild (doc 609) described a 3-tier plan: "main-stage / broadcast / year-round." The live `/sponsor` page instead runs 3 tracks - **Local Partners, Virtual Partners, Ecosystem Partners** - with explicit fiscal routing through New Media Commons/Fractured Atlas or ENTERACT. The live version is clearly the current, shipped one; any pitch deck or outreach copy still referencing "main-stage/broadcast/year-round" language is stale and should be retired. [FULL - both versions read directly, doc 609 vs. live `/sponsor` page]

## Also See

- [Doc 609 — ZAOstock Co-Build May 4 2026 — Six-Circle Lock](../609-zaostock-cobuild-six-circles-may4/) — the team-structure decisions this audit checks against current state
- [Doc 610 — ZAOstock Database Consolidation](../../infrastructure/610-zaostock-database-consolidation-may4-5/) — source of the May 5 Supabase snapshot referenced in Finding 3/4; now 2+ months stale
- [Doc 871 — ZAOstock Phase Two: Execution Sprint to Oct 3](../871-zaostock-phase-two-execution-sprint/) — 2026-06-17, the most recent internal planning doc found this session; source of the Wallace Events "handshake" flag and the 5-workstream ownership proposal in Finding 4
- [Doc 990 — ZAOstock SEO Audit](../../business/990-zaostock-seo-audit/) — technical/discoverability audit of zaostock.com from this same week
- [Doc 1004 — ZAO Festivals Brand Audit](../../business/1004-zaofestivals-brand-audit/) — sibling audit of the zaofestivals.com/socials layer
- Tracker task `research-doc-990` (todo, due 2026-07-10) — SEO audit review, already shipped, needs Zaal's pass
- Tracker task from source `zaal-master:2026-07-06` (todo, due 2026-08-19) — "ZAOstock: permit OR City co-sponsorship (call Roddy first)" — see Finding 5 contradiction
- Memory: `project_zao_stock_confirmed.md`, `project_zao_stock_production_audit.md`, `project_zaostock_spinout.md`, `project_zaostock_master_strategy.md`, `project_zaostock_open_call.md`, `project_zaostock_team_meeting.md`, `project_zao_stock_meeting_apr10.md`, `project_zao_stock_pitch_answers.md`, `project_ellsworth_thursday_concert_series.md`, `project_zao_contribution_circles.md`, `project_zao_stock_team.md` — all read this session, several now partially superseded by this doc (see Findings 2-4)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Mark tracker task "confirm Art of Ellsworth deadline + Oct 1-4 overlap" done, citing this doc's Finding 1 - shipped when tracker status flips to done | Zaal | Todo | 2026-07-09 |
| Confirm with Cara Romano that the 12pm-6pm window (vs. HoE's own listed 12-4pm) is fine for Oct 3 - shipped when confirmed in writing (email or TG) | Zaal | Todo | 2026-07-11 |
| Pull a fresh row-count snapshot of the ZAO STOCK Supabase project (`yjrlaxpjusmrfylumban`) - shipped when `project_zao_stock_team.md` is updated with current team/circle/sponsor/budget numbers replacing the May 5 figures | Zaal | Task | 2026-07-14 |
| Confirm sound-system booking status (internal deadline was June 1, now 5+ weeks overdue) - shipped when a vendor name + booked date is recorded in the ops circle's tracker or memory | Zaal | Todo | 2026-07-11 |
| Get a current-owner confirmation for the lineup (Dcoop), venue+ops (Candy/Zaal), and volunteers (Chikodi) workstreams proposed in doc 871 - shipped when each has both a confirmed main and a named understudy in the tracker | Zaal | Task | 2026-07-18 |
| Confirm whether the Wallace Events stage + tent agreement is actually signed (doc 871 called it a handshake on 2026-06-17) - shipped when a signed-date is recorded, or the site copy is walked back until it is | Zaal | Todo | 2026-07-11 |
| Update `project_zao_stock_confirmed.md` to correct the Steve Peer line and add the Wallace Events handshake-vs-signed caveat per Finding 2 - shipped when the memory file is edited | Zaal | Todo | 2026-07-10 |

## Sources

- Live cowork tracker query (`zao-tracker search "zaostock"`, `"permit"`, `"sound system"`) — [FULL, queried 2026-07-09]
- `zaostock/src/app/sponsor/page.tsx`, `/program/page.tsx`, `/apply/page.tsx`, `/musicians/submit/page.tsx`, `/team/page.tsx`, `/festivals/page.tsx` — [FULL, read directly from the live repo 2026-07-09]
- `zaostock` git log (last 30 commits) — [FULL, read 2026-07-09]
- [Doc 609 — ZAOstock Co-Build May 4 2026](../609-zaostock-cobuild-six-circles-may4/) — [FULL, internal]
- [Doc 610 — ZAOstock Database Consolidation](../../infrastructure/610-zaostock-database-consolidation-may4-5/) — [FULL, internal]
- [Doc 871 — ZAOstock Phase Two: Execution Sprint to Oct 3](../871-zaostock-phase-two-execution-sprint/) — [FULL, internal]
- `zaostock` `git remote -v` — [FULL, confirmed `ZADEVZ/zaostock.git` origin, resolving doc 871's domain/repo cutover action item]
- Memory files: `project_zao_stock_confirmed.md`, `project_zao_stock_production_audit.md`, `project_zaostock_spinout.md`, `project_zaostock_master_strategy.md`, `project_zaostock_open_call.md`, `project_zaostock_team_meeting.md`, `project_zao_stock_meeting_apr10.md`, `project_zao_stock_pitch_answers.md`, `project_ellsworth_thursday_concert_series.md`, `project_zao_contribution_circles.md`, `project_zao_stock_team.md` — [FULL, read 2026-07-09]
- [Art of Ellsworth: Maine Craft Weekend — Heart of Ellsworth calendar](https://www.heartofellsworth.org/calendar/2026/10/1/art-of-ellsworth-maine-craft-weekend) — [FULL, fetched via exa 2026-07-09]
- [Maine Craft Weekend 2026 — official site](https://mainecraftweekend.org/) — [FULL, fetched via exa 2026-07-09]
- [Art of Ellsworth: Maine Craft Weekend — Maine Public community calendar](https://www.mainepublic.org/community-calendar/event/art-of-ellsworth-maine-craft-weekend-03-06-2026-08-42-28) — [FULL, hours quoted directly via exa search 2026-07-09]
- Reddit search (`"Maine Craft Weekend" OR "Art of Ellsworth" site:reddit.com`) — [FULL search executed, zero on-topic results — documented negative signal]
- `mcp__supabase-cowork__get_project_url` check — [FULL - confirmed this session's Supabase MCP scope is the cowork tracker project (`etwvzrmlxeobinrlytza`), not ZAO STOCK's own project; documented as a real access gap, not silently worked around]
