---
topic: business
type: decision
status: research-complete
last-validated: 2026-08-06
superseded-by:
related-docs: 2209, 2210
original-query: "are the 171 festivals PRs good?! Is it just a waste of time or are we adding value to repo - do a well thought out analysis"
tier: STANDARD
---

# 2211 - Are the 171 zao-festivals PRs adding value? (a value analysis + a loop-governance lesson)

> **Goal:** The zao-festivals loop opened 171 open PRs overnight. Zaal: "are they good, or a waste?" Grounded value analysis of all 171 against the actual product, with a keep/kill map and the real fix.

## The verdict (one line)

**The CODE is good (real, tested, wired); merging ALL of it is net-negative.** ~90 PRs add value; ~40 would dilute a sharp tool into a kitchen sink. The loop writes clean code but has no product owner, so it 10x'd the scope past what the event needs.

## The product reality (what reframes it)

zao-festivals = "**ZAOstock team dashboard, mobile**" (Expo/RN) - an INTERNAL tool for the volunteer organizing team of a **free community music festival** (ZAOstock, Oct 3 2026, Ellsworth ME). On `main` today it has **7 focused modules**: artists, budget, notes, rsvps, sponsors, timeline, volunteers. The 171 PRs would take it to **76 modules - a 10x scope explosion.**

## Value breakdown (data-grounded, all 171 categorized)

| Bucket | Count | Verdict |
|--------|-------|---------|
| Bug fixes (`fix:`) | 29 | **KEEP** - real quality (UTC date bugs, keyboard nav, a11y, json-parse safety) |
| Tests (`test:`) | 21 | **KEEP** - real coverage |
| chore / ci / docs | 6 | **KEEP** - a CI workflow, .env.example, stale-doc fix |
| lib / hooks utils | 13 | **KEEP** - harmless building blocks (formatCurrency, useDebounce, date-utils) |
| Real app improvements | ~11 | **KEEP** - tabs, module search, home countdown, RSVP fixes |
| **Core day-of modules** | ~20 | **KEEP** - set-times, run-of-show, team roster, volunteer/door/gate check-in, incident + first-aid log, emergency protocols, weather, countdown, contacts |
| **Sprawl modules** | 31 | **CLOSE** - enterprise festival-ops a volunteer free show won't open (below) |
| **Duplicates** | 5 | **CLOSE** - keep the best of each redundant set (below) |

**Merge ~135, close ~36.**

### The 31 sprawl modules (close)

tip-pool calculator, cash-box reconciliation, revenue/P&L summary, artist settlement, artist-payment tracker, merch inventory + merch sales, food-vendor orders, crew-meal dietary tracker, hydration-station + waste-station level trackers, supply low-stock tracker, power/generator status board, radio-channel assignment board, press-credential + photo/media-zone trackers, sponsor-activation checklist, wristband inventory, access-control + zone-assignment boards, vendor check-in + vendor status board, noise-complaint log, crowd-feedback kiosk, social-media content calendar, volunteer-hours tracker, bag-check tracker, artist-shuttle tracker, equipment-checkout log, artist-hospitality/rider tracker, stage-plots reference.

These are individually plausible for a *large commercial* festival; collectively they're ops a small volunteer team will never navigate on show day.

### The 5 duplicates (close the loser, keep one)

- Gate/attendance: keep #169 (gate count); close #199 (entry counter), #237 (headcount clicker)
- Incident: keep #171 (log); close #197 (report log)
- Lost & found: keep #170 (log); close #196 (tracker)
- Parking: keep #174 (status board); close #201 (lot board)

## Two structural tells (why this is bloat, not just volume)

1. **They can't even all merge.** The 69 module PRs each edit the SAME nav registry (the `MODULES` array in `MoreScreen`), so they conflict with each other - most will not merge cleanly even if you wanted them. A coherent feature set doesn't structurally collide with itself.
2. **Duplicates.** The loop shipped lost&found, incident, parking, and gate/headcount 2-3x each - it wasn't tracking what it had already built (no dedup check).

## The real fix (not better code - a product owner)

The loop writes clean, tested, wired components. What it lacks is **a backlog + a scope cap.** It invents a feature per tick to have something to do, so it runs past the product. The fix:

- **Give the festivals loop a real priority queue** ("the app needs these N modules, here they are - do NOT invent more; improve/finish existing before adding").
- **Cap the module count** for a volunteer-team dashboard (~25-30, not 76).
- **Dedup pre-flight** (`gh pr list` + grep) before building anything - the consolidation directive added 2026-08-06 (doc 2209) codifies this; this incident shows it must be enforced, not just written.

## Also See

- [Doc 2209](../../security/2209-repo-estate-audit-aug6/) - the 5-pileup estate audit (this is the deep-dive on #1) · [Doc 2210](../../infrastructure/2210-zao-os-operating-manual/) - loop governance
- `.claude/rules/workflow-discipline.md` rule 2 (loop governance), `code-restraint.md` (the anti-bloat ladder), `loop-evals.md` (the Karpathy anti-bloat gate)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Execute: merge the ~135 keeps (fixes/tests/utils/core-modules), close the 36 sprawl+dupes - accepting that many module keeps will conflict on the shared nav file and need rebase/re-run | Zaal | Merge/close | 2026-08-06 |
| Give the festivals loop a real backlog + a ~25-module scope cap + enforced dedup pre-flight; pause it until the queue exists | Zaal | Config | 2026-08-07 |
| Fold the "one PR per shared-file feature = structural conflict" lesson into the loop consolidation directive | Zaal | Config | 2026-08-13 |

## Sources

- Live `gh pr list`/`gh pr diff` on all 171 open PRs + `gh api contents app/modules` (current 7 modules) + the repo README, 2026-08-06 - **[FULL]**
- Sampled PR #240 (curfew-watch) diff: real screen + nav wiring + a unit test - confirms code quality **[FULL]**
