---
topic: events
type: audit
status: research-complete
last-validated: 2026-07-06
superseded-by:
related-docs: 978
original-query: "YoZF calendar: pick priority events by deadline - from the ZAO events calendar, surface the events that actually need action/prep by deadline, separated from the ambient standing Spaces"
tier: STANDARD
---

# 979 - YoZF calendar: priority events by deadline

> **Goal:** The ZAO events calendar is dense. This doc separates the ambient standing Spaces (show up, no prep) from the true dated milestones that need action by a deadline - and surfaces the gap: the milestones that matter most are NOT on the shared calendar at all.

## The core finding

Pulled the ZAO shared Google Calendar for the window 2026-07-06 onward. **59 of 60 events are recurring instances** - the calendar is an ambient standing feed of daily community Spaces, not a deadline board. Because of the recurrence density, one API page covers only ~10 days (Jul 6-16). More importantly: **the dated ZAO milestones that need prep are not on this calendar** - they live only in repo/memory. That is the real problem to fix.

So "pick priority events by deadline" resolves into three tiers:

## Tier 1 - Dated milestones that need prep (NOT on the shared calendar - add them)

These are the true deadline events. Grounded in repo/memory, not the calendar:

| Event | Date | What it needs | Source |
|-------|------|--------------|--------|
| **COC Concertz #7** | 2026-07-18 | Pilot: drop wallet gate, capture numbers (headcount/wallets/tips/signups). Already a Wed-main-topic on the board | tracker + memory |
| **ZABAL Games (August)** | Aug 2026 | Confirm mentor metrics + post criteria + build board; part of the 3-month build-a-thon (Jun/Jul/Aug) | [[project_zabal_games]] |
| **ZAOstock 2026** | 2026-10-03 | Franklin St Parklet; permits, sponsors (MaineCF/Fractured Atlas), Art of Ellsworth deadline overlap (Thu-main-topic) | [[project_zao_stock_confirmed]] |

**Action: put these three on the shared calendar** so they stop living only in the tracker. A milestone not on the calendar is a milestone that ambushes you.

## Tier 2 - ZAO-owned standing surfaces (recurring; light prep, show up)

These ARE on the calendar and are ZAO's own owned surfaces - the ones worth protecting because consistency is the whole brand:

| Surface | Cadence | Note |
|---------|---------|------|
| **OP Fractal** | Thursdays 1:00pm ET | The governance call - the ~101-week unbroken streak (Doc 975). Highest-protect: the streak IS the credibility. |
| **WaveWarZ Spaces - midday** | Daily 11:00am ET | The battle/Spaces engine |
| **WaveWarZ Battles + Spaces - evening** | Daily 8:30pm ET | Evening battles |
| **COC Mental Health Space** | Thursdays 4:00pm ET | COC community |
| **COC Space** | Fri/weekend 5:00pm ET | COC community |

## Tier 3 - Ambient external community Spaces (optional, zero ZAO action)

The bulk of the 60 events - other communities' recurring Spaces on the calendar for awareness, not obligation: EZ's Corner, PIGEON COOP, TrickysNFTs, KFM Community Call, Lil Nouns, Stilo World, Digital Nomads, My African Dream, Sports C3NT3R, TalkshowONPOINT, The Social Hour, Freetalk Sunday (Eduard x Zaal), etc. No prep, drop-in only. These should NOT compete for attention with Tier 1.

## The one change that fixes this

The calendar can't tell you what's "priority by deadline" because the two things that ARE deadline-driven (Tier 1) aren't on it, and everything that IS on it is standing/recurring (Tiers 2-3). Fix: **add the Tier 1 milestones to the shared calendar with a distinct color/prefix (e.g. "[ZAO MILESTONE]")** so priority is visible at a glance instead of buried under 5-6 daily Spaces.

## Also See

- [Doc 978](../../business/978-zao-numbers-framing/) - the numbers framing; the standing Spaces (Tier 2) are where those numbers get made.
- [[project_zao_stock_confirmed]], [[project_zabal_games]] - the Tier 1 milestone details.
- Tracker: COC #7 is a Wed-main-topic, Art of Ellsworth a Thu-main-topic (scheduled 2026-07-06).

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add the 3 Tier-1 milestones (COC #7 07-18, ZABAL Games Aug, ZAOstock 10-03) to the ZAO shared calendar with a "[ZAO MILESTONE]" prefix | @Zaal | Calendar | 2026-07-13 |
| Protect the OP Fractal Thursday slot as non-movable (the ~101-week streak is the credibility asset) | @Zaal | Ops | 2026-07-09 |
| Decide which Tier-3 external Spaces are worth keeping on the calendar vs muting to cut noise | @Zaal | Calendar | 2026-07-20 |

## Sources

- [FULL] ZAO shared Google Calendar (id 2f7a48a...cde75@group.calendar.google.com), pulled 2026-07-06, window 2026-07-06 onward: 60 events, 59 recurring, span Jul 6-16 (recurrence density caps one page at ~10 days).
- [FULL] Tracker (zaal-personal) + memories [[project_zao_stock_confirmed]] / [[project_zabal_games]] - the Tier-1 milestone dates.
- [PARTIAL] Events beyond Jul 16 - not returned in one page due to recurring-instance density; the Tier-1 milestones (the ones that matter past Jul 16) are sourced from repo/memory instead, and are the events that should be ADDED to the calendar anyway.
