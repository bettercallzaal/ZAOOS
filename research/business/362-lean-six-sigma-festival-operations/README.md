# 362 - Lean Six Sigma for ZAO Festival Operations

> **Status:** Research complete
> **Date:** 2026-04-15
> **Goal:** Apply Lean Six Sigma (DMAIC + 7 wastes + SIPOC) to ZAO Stock festival planning with 4 teams, 14 people, 172 days

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Framework** | USE DMAIC (Define-Measure-Analyze-Improve-Control) as the backbone for each team's weekly cycle |
| **Waste model** | USE the 7 Muda wastes adapted for volunteer event production (see below) |
| **Meeting structure** | USE the 5 Ps (Purpose, Participants, Process, Product, Preparation) for every standup |
| **Process mapping** | USE SIPOC diagrams for each team's workflow - map it once, reference every week |
| **Kanban board** | USE the existing `/stock/team` dashboard as the digital kanban - todo/in-progress/done |
| **Continuous improvement** | USE weekly retro questions (What worked? What's waste? What's blocked?) at end of each standup |
| **Skill** | BUILD a `/lean` skill that runs a waste audit on any process and suggests improvements |

---

## DMAIC Applied to ZAO Stock (172-Day Build)

### Define (Weeks 1-2, DONE)
- Event: October 3, 2026, Franklin Street Parklet, Ellsworth ME
- 4 teams: Operations, Finance, Design, Music
- 14 team members with leads assigned
- Budget: $5K-$25K range
- Success metric: 10 artists, full day, livestream, after-party

### Measure (Weeks 3-4, NOW)
Track these weekly in the `/stock/team` dashboard:

| Metric | How to Measure | Target |
|--------|---------------|--------|
| Tasks completed vs. created | Dashboard todo counts | Completion rate > 70% weekly |
| Standup attendance | Who reports each week | > 60% of team |
| Sponsor pipeline | Contacts made / responses / closed | 1 sponsor by May |
| Artist confirmations | Wishlist size / contacted / confirmed | 5 confirmed by July |
| Budget raised vs. spent | Finance team tracker | Break even by September |
| Days to next milestone | Timeline.md checkboxes | On track vs. behind |

### Analyze (Ongoing)
After 3-4 weeks of data, identify:
- Which team has the most blocked tasks?
- Which tasks take longest to move from todo to done?
- Where are handoffs failing between teams?
- What keeps getting pushed to "next week"?

### Improve (Ongoing)
Apply targeted fixes:
- If a team is blocked: does the lead need more authority? More people?
- If tasks stall: are they too big? Break into smaller pieces
- If standups run long: tighten the 5 Ps structure
- If sponsors aren't responding: change the pitch, not the volume

### Control (Final 30 days)
Lock processes, stop changing things, execute the plan:
- No new features or ideas after September 1
- Day-of runbook finalized by September 15
- Volunteer orientation by September 25
- Sound check October 2

---

## 7 Wastes (Muda) Adapted for Festival Production

| Waste | Manufacturing | ZAO Stock Equivalent | Fix |
|-------|-------------|---------------------|-----|
| **Transport** | Moving materials | Sending people to meetings they don't need to be in | Only relevant team members at sub-meetings |
| **Inventory** | Excess stock | Too many ideas/features not being acted on | Kill ideas older than 2 weeks with no action |
| **Motion** | Unnecessary movement | Switching between Discord, Slack, DMs, email for same info | Single source of truth (dashboard + Discord) |
| **Waiting** | Process delays | Waiting for someone to approve/respond before moving forward | Set 48-hour response SLAs, then the lead decides |
| **Overproduction** | Making too much | Planning more than you can execute | Max 5 active todos per team per week |
| **Over-processing** | Unnecessary effort | Perfect brand kit before first sponsor pitch | Ship ugly, iterate later |
| **Defects** | Errors/rework | Miscommunication leading to redone work | Written handoffs, not verbal |

---

## SIPOC for ZAO Stock

| Element | Details |
|---------|---------|
| **Suppliers** | Wallace Events (tents), sound vendor (TBD), Heart of Ellsworth (venue), sponsors, artists, volunteers |
| **Inputs** | Budget ($5-25K), team time (14 people, ~5 hrs/week each), venue (Parklet), equipment |
| **Process** | Weekly standups > team execution > monthly milestone check > event day |
| **Outputs** | 10-artist festival, livestream, after-party, sponsor visibility, content |
| **Customers** | Ellsworth residents, ZAO community (online + IRL), sponsors, artists |

---

## 5 Ps for Weekly Standups

Apply to every Tuesday 10am standup:

| P | What | ZAO Stock Implementation |
|---|------|--------------------------|
| **Purpose** | Why are we meeting? | Team reports + unblock tasks + weekly priorities |
| **Participants** | Who needs to be there? | Team leads required, members optional (open stage) |
| **Process** | How will it run? | 15 min reports (Ops > Finance > Design > Music) + 15 min brainstorm |
| **Product** | What's the output? | Updated dashboard, action items, transcript summary |
| **Preparation** | What's done before? | Each lead reviews their team's dashboard section |

---

## Comparison: Process Frameworks for Small Volunteer Teams

| Framework | Complexity | Best For | ZAO Fit |
|-----------|-----------|----------|---------|
| **Lean Six Sigma (DMAIC)** | Medium | Repeated processes with measurable outcomes | USE - weekly cycles are measurable |
| **Scrum/Agile** | High | Software teams with daily standups | SKIP - too heavy for volunteer festival crew |
| **Kanban** | Low | Visual task management | USE - already built into dashboard |
| **OKRs** | Medium | Quarterly goal alignment | PARTIAL - use for April goals, not full OKR |
| **Getting Things Done (GTD)** | Low | Personal productivity | SKIP - this is team, not individual |

**Recommendation:** Lean + Kanban hybrid. DMAIC as the strategic backbone, Kanban board (dashboard) for daily execution, weekly standups with 5 Ps structure, waste audit monthly.

---

## /lean Skill Concept

A skill that can be invoked on any process to identify waste and suggest improvements:

```
/lean [process description or file]
```

**What it does:**
1. Maps the process using SIPOC
2. Identifies the 7 wastes
3. Suggests specific cuts/improvements
4. Outputs a before/after comparison
5. Tracks improvements over time

**Use cases:**
- `/lean standup` - audit the standup format
- `/lean sponsorship-outreach` - audit the sponsor pipeline
- `/lean artist-booking` - audit the artist confirmation process
- `/lean content-workflow` - audit how content gets created and shared

---

## ZAO Ecosystem Integration

- Dashboard: `src/app/stock/team/` (existing Kanban board)
- Todos API: `src/app/api/stock/team/todos/route.ts`
- Goals API: `src/app/api/stock/team/goals/route.ts`
- Standup docs: `ZAO-STOCK/standups/dashboard.md`
- Timeline: `ZAO-STOCK/planning/timeline.md`
- Related: Doc 263 (Obsidian lean team model - validates small team approach)

---

---

## Deep Dive: Value Stream Maps Per Team

Each team has a distinct value stream. Map it once, reference every week.

### Operations Value Stream
```
Input: Task/decision needed
  > Identify owner (dashboard)
  > Owner reviews (48hr SLA)
  > Execute or delegate
  > Update dashboard status
  > Report at standup
Output: Task done, dashboard updated
```
**Key waste risk:** Waiting (Zaal is bottleneck on too many decisions). Fix: delegate authority to team leads for anything under $500 and non-venue decisions.

### Finance Value Stream
```
Input: Funding need identified
  > Research source (Giveth/GoFundMe/sponsor/grant)
  > Draft pitch/application
  > Submit/send
  > Follow up (7-day cycle)
  > Close or move to next target
Output: Money in or clear "no"
```
**Key waste risk:** Over-processing (perfecting pitch decks before sending anything). Fix: send the first version within 48 hours, iterate based on responses.

### Design Value Stream
```
Input: Visual asset needed
  > Brief from requesting team (1 sentence + reference)
  > First draft (72hr)
  > One round of feedback
  > Final version
Output: Asset delivered + stored in shared folder
```
**Key waste risk:** Defects (verbal briefs leading to mismatched expectations). Fix: written brief template - what, where it's used, size, deadline.

### Music Value Stream
```
Input: Artist identified
  > Research (profile, travel, availability)
  > Outreach (DM/email)
  > Confirm interest
  > Lock travel logistics
  > Add to lineup
Output: Artist confirmed with travel booked
```
**Key waste risk:** Inventory (huge wishlist with no outreach). Fix: max 3 artists in outreach at a time, don't add more until current batch responds.

---

## Deep Dive: Kaizen Sprints for ZAO Stock

A Kaizen sprint is a 3-5 day focused push where a small team solves one specific problem. Not the weekly grind - a concentrated burst.

### When to use a Kaizen sprint:
- A critical path item is stuck for 2+ weeks
- A handoff between teams keeps failing
- The same problem keeps appearing at standups

### ZAO Stock Kaizen sprint format (adapted for volunteers):

| Day | Focus | Output |
|-----|-------|--------|
| **Day 1** (2 hrs) | Define the problem. Map current state. | Problem statement + current state diagram |
| **Day 2** (2 hrs) | Root cause analysis. 5 Whys on each bottleneck. | Root causes identified |
| **Day 3** (2 hrs) | Design future state. Propose changes. | Future state map + action list |
| **Day 4** (execute) | Implement changes. Ship immediately. | Changes live |
| **Day 5** (1 hr) | Review. Did it work? Keep or revert. | Decision + lessons logged |

**Key adaptation:** Manufacturing does 8hr/day for 5 days. Volunteers can't do that. 2-hour blocks over a week work for ZAO. Run it in a dedicated Discord thread so async participation works.

### Suggested first Kaizen sprint: Sponsorship Outreach
- **Problem:** 0 sponsors contacted after 2 weeks
- **Root cause:** No pitch deck, unclear Fractured Atlas wording, no clear ask
- **Sprint goal:** Send first 3 sponsor pitches by end of sprint

---

## Deep Dive: Lean Metrics Dashboard

The `/stock/team` dashboard already has todos. Add these lean-specific views:

### Cycle Time Tracking
How long does a task take from creation to done?
- **Target:** < 7 days for standard tasks, < 3 days for urgent
- **Measure:** `created_at` to `updated_at` when status = 'done'
- **Action:** Any task open > 14 days gets reviewed at standup - is it too big? Blocked? Dead?

### Work In Progress (WIP) Limits
- **Operations:** Max 5 active (in_progress) todos
- **Finance:** Max 3 active todos
- **Design:** Max 3 active todos
- **Music:** Max 3 active todos
- **Action:** If a team hits WIP limit, finish something before starting anything new

### Throughput
Tasks completed per week per team. Track over time to see if velocity is improving.

| Week | Ops | Finance | Design | Music | Total |
|------|-----|---------|--------|-------|-------|
| Apr 14 | - | - | - | - | Baseline |
| Apr 22 | | | | | |
| Apr 29 | | | | | |

---

## Sources

- [EventOPS: How to Run a Lean Event Using Six Sigma](https://eventops.com/resources/2019/1/21/how-to-run-a-lean-event-using-six-sigma)
- [ISSSP: Lean Six Sigma in Meeting Effectiveness and Event Management](https://isssp.org/lean-six-sigma-in-meeting-effectiveness-and-event-management/)
- [GoLeanSixSigma: DMAIC Five Basic Phases](https://goleansixsigma.com/dmaic-five-basic-phases-of-lean-six-sigma/)
- [ASQ: Six Sigma Definition](https://asq.org/quality-resources/six-sigma)
- [ASQ: Value Stream Mapping Tutorial](https://asq.org/quality-resources/value-stream-mapping)
- [KaiNexus: What is a Kaizen Event](https://blog.kainexus.com/improvement-disciplines/kaizen/kaizen-events/what-is-a-kaizen-event-your-complete-guide-rapid-improvement)
- [Kaizen.com: Rapid Improvement Event](https://kaizen.com/insights/rapid-improvement-event-continuous-improvement/)
- Doc 263: Obsidian's Lean Team Model (internal research)
