---
topic: events
type: decision
status: research-complete
last-validated: 2026-07-11
superseded-by:
related-docs: "1007, 1013, 1030, 1031, 1032, 1033, 1034"
original-query: "find more ways to optimize (ZAOstock, after 9 research docs shipped in one session)"
tier: STANDARD
---

# 1035 — ZAOstock Master Punch List: Every Open Action, Deduplicated and Prioritized

> **Goal:** Nine ZAOstock research docs shipped in this session (1007, 1013, 1030-1034), each with its own Next Actions table. Several actions appear in two different docs under different framing. Nobody can execute against nine scattered tables. This doc is the single, deduplicated, priority-ordered list - the connective tissue the research itself was missing.

## Key Decision

The real optimization at this point in the project isn't more research - it's stopping research sprawl and making everything already found executable. This doc does that: 27 distinct actions across 9 docs collapse into 19 real items once duplicates are merged, sorted into four urgency tiers instead of nine separate By-When columns.

**Update 2026-07-11:** the Tier 1 "confirm ZAOville venue private vs. public" item is RESOLVED - private (DCoop's house), no permit needed. Removed from the table below; see doc 1013 for the updated budget number ($450-$1,100).

## Tier 1 - This week (by Jul 18) - blocking or time-sensitive

| Action | Source doc(s) | Why it's Tier 1 |
|---|---|---|
| **Book the Cadillac Mountain vehicle reservation for Oct 3** | 1034 | Time-sensitive and easy to forget - the 90-day booking window opened around July 5, reservations required through Oct 25 |
| **Name a livestream/broadcast lead** | 1030, 1031 (duplicate, merged) | Unowned since May across 3 different docs (609 said Thy Revolution, 720 said Onaji, 871's June reorg has no broadcast workstream at all). Blocks doc 1030's entire media plan from having an owner |
| **Name a Site Lead and a First Aid Lead for Oct 3** | 1032 | Doc 1032's entire safety plan and staffing matrix has no named decision-maker yet - these are the two roles everything else depends on |
| **Verify the "$391K in grants" Heart of Ellsworth figure before it's repeated again** | 1031 | Currently on the live `/sponsor` page; HoE's own FY2023 filings show ~$161-166K, a 2.4x gap. Don't let this go to press or a sponsor conversation unverified |
| **Update the stale $5K/$25K ZAOstock budget figure in `project_zao_stock_confirmed.md`** | 1013 | The file most likely to get quoted by a future session if not fixed - cheap to fix, keeps compounding if not |

## Tier 2 - Next 2 weeks (by Aug 1)

| Action | Source doc(s) | Why it matters |
|---|---|---|
| **Confirm the city-sponsored permit exemption path with Ellsworth PD/City Hall** | 1031, 1032 (duplicate, merged) | Ordinance Chapter 14 requires 45 days' notice (Aug 19 deadline) + a surety bond unless ZAOstock qualifies for exemption via the Art of Ellsworth umbrella - this determines which path to file, not just when |
| **Confirm sound-system booking status** | 1007 | Flagged "book by June 1" in April; zero confirmation found anywhere this session, 6+ weeks past its own internal deadline |
| **Get a current-owner confirmation for lineup (Dcoop), venue+ops, and volunteers workstreams** | 1007 | Only the sponsors workstream (Jay/Duh) is confirmed active; the rest haven't been checked since doc 871 (June 17) |
| **Buy the ATEM Mini Pro switcher ($325) and the audio DI/interface bundle (~$250-300)** | 1030 | The two genuinely new purchases the media plan needs - everything else comes from owned gear |
| **Reach out to one of HoE's 4 Downtown Grants Program bank partners for a warm co-sponsor conversation** | 1031 | Concrete, named list (Franklin Savings, Bangor Federal Credit Union, First National Bank, Machias Savings) via the Zaal builder-profile onepager already drafted |
| **Build the new `/acadia` page and add the 2 restaurant/shuttle/sculpture-trail items to the live `/ellsworth` page** | 1034 | Real content is written and ready; this is now an implementation task, not a research gap |
| **Confirm mutual-aid EMS availability/response time with local fire/ambulance for Oct 3** | 1032 | The one safety-plan item that needs an external confirmation, not just an internal decision |
| **Update `/sponsor` page with the Route 1/Route 3 traffic numbers and Main Street America framing** | 1031 | Real numbers exist now (30,000+ vehicles/day, Acadia's 2025 record 4.08M visits) - the page currently uses soft "gateway to Acadia" language instead |

## Tier 3 - By mid-August

| Action | Source doc(s) | Why it matters |
|---|---|---|
| **Decide whether the Aug 15 dry run (doc 504) is happening, still planned, or dropped** | 1032 | Doc 1032's entire operations plan is untested if the dry run never runs - and Aug 15 is now less than 5 weeks out |
| **Pull a fresh Supabase snapshot of the ZAO STOCK project's team/circle/sponsor/budget data** | 1007 | The last real snapshot is from doc 610, May 5 - everything since is inference from tracker/memory, not a direct check |
| **Confirm porta-potty, radio rental (if budgeted), and first-aid supply sourcing** | 1032 | Vendors need to be booked, not just researched, with enough lead time before Oct 3 |
| **Do a deliberate photo scouting pass at the Tier-1 Acadia locations** (Cadillac, Jordan Pond, Otter Cliffs, Bass Harbor, Schoodic) | 1033 | Needed to actually seed the Week 3+ slots in the photo/promo calendar |
| **Confirm what the 2 existing artist videos are** (format, length) and whether Fellenz + Dcoop are the only 2 confirmed artists so far | 1033 | Determines how the artist content track in the photo/promo calendar is actually built |
| **Run Supabase's free Database Advisor against ZAOstock's own project for an RLS check** | (carried over from doc 1009/1011's ecosystem-wide finding, applied to ZAOstock specifically) | A real credential-exposure pattern already happened once in a sibling ZAO project (ZAOcowork) - worth a 10-minute check on ZAOstock's own database too |

## Tier 4 - By September / pre-event

| Action | Source doc(s) | Why it matters |
|---|---|---|
| **Assign the 3 crew-window rosters (load-in/event-run/load-out) against the current team** | 1032 | Needs real names next to the staffing matrix, not just role counts |
| **Set up the Mon/Wed/Fri posting cadence in Firefly (or whatever runs ZAO's social scheduling)** | 1033 | Should start immediately in practice, but the actual scheduling setup can follow once Tier 1-2 items are handled |
| **Run a full speed test at the actual Franklin Street Parklet venue** for the streaming connectivity plan | 1030 | Needs the venue and equipment in hand first - naturally sequenced after Tier 2's gear purchase |
| **Run a full end-to-end test stream** with all gear, ideally at the real venue, at least 2 weeks before Oct 3 | 1030 | The final verification step - only meaningful once everything above it is actually done |
| **Run a full walkthrough of the day-of operations timeline with the team**, at least 2 weeks before Oct 3 | 1032 | Same logic - this is the dress rehearsal, not a standalone task |

## What this doc deliberately does NOT include

- Doc 1011 (ZAO ecosystem database architecture) - real and important, but ecosystem-wide, not ZAOstock-specific. Its own Next Actions stand on their own.
- Anything from doc 1009 (zaofestivals.com brand audit) not directly touching ZAOstock's Oct 3 execution - that doc's actions are brand/domain work, a different track.
- The ZABAL Gamez / Loops judging-infrastructure idea Zaal raised mid-session - a real, separate thread, deliberately not folded in here since it's not part of Oct 3 execution.

## Also See

- [Doc 1007](../1007-zaostock-t86-readiness-audit/), [Doc 1013](../../business/1013-zaofestivals-budgets-zaostock-zaoville/), [Doc 1030](../1030-zaostock-livestream-media-production/), [Doc 1031](../../business/1031-zaostock-why-ellsworth-why-this-model/), [Doc 1032](../1032-zaostock-day-of-operations-plan/), [Doc 1033](../1033-zaostock-photo-promo-calendar/), [Doc 1034](../1034-zao-guides-acadia-ellsworth-excursions/) — the 7 source docs this punch list consolidates

## Next Actions

This doc's own action IS the punch list above - no separate table. The one meta-action:

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Review this doc weekly and cross off items as they close, rather than letting new research docs re-scatter the list | Zaal | Task | ongoing, first check-in 2026-07-18 |

## Sources

- Docs 1007, 1013, 1030, 1031, 1032, 1033, 1034 (all shipped this session) — [FULL, internal, direct synthesis of each doc's own Next Actions table]
