# 428 — ZAOstock Run-of-Show Program (Oct 3, 2026)

> **Status:** Draft v1 — needs team feedback Tuesday Apr 21
> **Date:** 2026-04-17
> **Goal:** Design the day-of program for ZAOstock using 15-min block structure, WaveWarZ bracket for multi-set performances, short (5-10 min) talks interspersed, and built-in contingency for real-world slippage.

---

## Key Decisions

| Decision | Choice |
|----------|--------|
| Base block | 15 min — aligns with festival-scheduling best practice for small events, fits 24 blocks in the 12pm-6pm window |
| Total runtime | 6 hours (12pm-6pm) as currently advertised on `/stock` |
| Musician format | Hybrid: 6 traditional sets (15-20 min each) + 4 WaveWarZ bracket artists who appear 2-3 times |
| Talk format | 5 slots × 10 min each, between sets, topic-specific |
| Breaks | 1 mid-day 15-min official break (14:25-14:40) + implicit breaks via DJ transitions |
| Contingency | Every slot tagged swappable. DJ fills any gap. Talk slots first to cut if running over. |
| Voting / WaveWarZ | Live QR-code vote after each round (use existing WaveWarZ infra — reference docs 099, 101, 180) |

## Proposed Schedule — 24 × 15-min blocks

Legend: 🎵 music · 🎤 talk · 🥊 WaveWarZ · 🎧 DJ/transition · ☕ break

| Time | Block | Content | Owner | Cut order |
|------|-------|---------|-------|-----------|
| 12:00-12:15 | 1 | 🎧 Doors + welcome DJ | DJ | — |
| 12:15-12:45 | 2-3 | 🎵 Artist #1 — full 30-min opener | (TBD confirmed) | 8 |
| 12:45-12:55 | 4a | 🎧 DJ changeover | DJ | — |
| 12:55-13:05 | 4b | 🎤 Talk #1: "Welcome to ZAOstock — what this is" | Zaal | **1 (cut first)** |
| 13:05-13:20 | 5 | 🎵 Artist #2 (15 min) | (TBD) | 7 |
| 13:20-13:30 | 6a | 🎧 DJ transition | DJ | — |
| 13:30-13:40 | 6b | 🎤 Talk #2: "Web3 music 101 — why this matters" | DCoop | **2** |
| 13:40-13:55 | 7 | 🎵 Artist #3 (15 min) | (TBD) | 6 |
| 13:55-14:10 | 8 | 🎧 DJ + mini-break | DJ | — |
| 14:10-14:25 | 9 | 🎵 Artist #4 (15 min) | (TBD) | 5 |
| 14:25-14:40 | 10 | ☕ **Official break** (food, bathroom, mingle) | — | — |
| 14:40-14:50 | 11a | 🎤 Talk #3: "An artist's perspective" | (WaveWarZ finalist) | **3** |
| 14:50-15:20 | 11b-12 | 🥊 **WaveWarZ Round 1** — 4 artists × 5 min | Hurric4n3 hosts | — |
| 15:20-15:30 | 13a | 🎧 DJ + audience voting (QR code) | DJ + WW tech | — |
| 15:30-15:50 | 13b-14 | 🥊 **WaveWarZ Semi-final** — top 2 × 7-8 min | Hurric4n3 | — |
| 15:50-16:00 | 15a | 🎤 Talk #4: "The ZAO — how to get involved" | Candy / FailOften | **4** |
| 16:00-16:15 | 15b-16 | 🎵 Artist #5 (15 min) | (TBD) | 9 (keep) |
| 16:15-16:30 | 17 | 🎵 Artist #6 (15 min, quick DJ xfer) | (TBD) | 10 (keep) |
| 16:30-16:40 | 18a | 🎤 Talk #5: "Partners + year 2 preview" | Zaal | **5** |
| 16:40-17:00 | 18b-19 | 🥊 **WaveWarZ Final** — winner battle (20 min total) | Hurric4n3 | — |
| 17:00-17:10 | 20 | 🎧 DJ + final voting | DJ | — |
| 17:10-17:40 | 21-22 | 🎵 **Closing set** — WaveWarZ winner OR headliner | Winner | — |
| 17:40-18:00 | 23-24 | 🎧 Closing DJ + afterparty call to Black Moon | DJ | — |

**Total music slots:** 6 traditional artist sets + 4 WaveWarZ artists (who appear 2-3 times each) + 1 closing set = **11 artist performances across ~7 unique artists** (the 4 WaveWarZ crew repeat).

## WaveWarZ Bracket Mechanics

**4 artists enter → 1 wins.** 3 rounds:

1. **Round 1 (14:50-15:20, 30 min)** — All 4 artists perform 5 min each. Audience votes (QR → onchain, reference WaveWarZ prediction market docs).
2. **Semi-final (15:30-15:50, 20 min)** — Top 2 vote-getters each get 7-8 min. Audience votes again.
3. **Final (16:40-17:00, 20 min)** — Top artist gets the closing 30-min set slot (17:10-17:40).

**Why this works:**
- Multiple-set performance for those artists (2-3 appearances = more time paid)
- Audience investment (they voted → they stick around)
- Natural escalation and finale
- Showcases the WaveWarZ product to potential sponsors/attendees
- Uses existing infrastructure (doc 178, 099, 101)

**Fee structure for WaveWarZ artists:** base fee + winner bonus. Budget as: 4 × $300 base + $500 winner bonus = $1,700 total (vs 4 × $400 single-set = $1,600). Nearly break-even, way more engagement.

## Talk Slot Specs

Each talk is **exactly 5-10 min**. Hard timed. Moderator (Candy) holds a 2-min sign → 30-sec sign → red STOP.

| # | Title | Speaker | Purpose |
|---|-------|---------|---------|
| 1 | Welcome to ZAOstock — what this is | Zaal | Frame the day for new attendees |
| 2 | Web3 music 101 — why this matters | DCoop / Hurric4n3 | Bridge onchain + IRL audiences |
| 3 | An artist's perspective | A WaveWarZ contestant | Humanize the artists |
| 4 | The ZAO — how to get involved | Candy or FailOften | Community acquisition pitch |
| 5 | Partners + Year 2 preview | Zaal | Sponsor thank-you + tease 2027 |

Talks are the **first to cut** if running over. All have standalone value if kept or skipped.

## Contingency / Movability

Plan for entropy. Every 15-min block is atomic and swappable:

| Scenario | Move |
|----------|------|
| Artist cancels day-of | Slot → DJ set, bump talks up one slot |
| Artist runs 5 min over | Skip next DJ transition, compress |
| Artist runs 10+ min over | Cut next talk slot |
| Talk speaker no-shows | DJ fills, announce "program change" |
| Rain / weather | Move under Wallace Events tent — no schedule change |
| WaveWarZ voting fails (tech) | Moderator picks based on crowd volume clap |
| Audience thin | Cut final talk + closing DJ, end on WaveWarZ Final + closing set |
| Audience hot | Extend closing set, push afterparty call to 18:00 |

**Rule of thumb:** protect music, cut talks. Music is what they came for.

## Tech / Production Notes per Slot Type

| Slot type | Setup needed | Changeover time |
|-----------|-------------|-----------------|
| Solo artist + laptop/DJ | 1 mic, 1 line in | 2-3 min |
| Band with instruments | Full stage reset, line check | 10-15 min |
| WaveWarZ round | Pre-set artists on stage, QR screen live | 5 min to reset between rounds |
| Talk | 1 mic, no backing | 1 min (walk-up) |
| DJ transition | Pre-loaded, crossfade | 0 min (continuous) |

**Implication:** avoid booking 2 full bands back-to-back without a DJ buffer. Already reflected in schedule.

## Tracking This in the Dashboard

Suggested data model additions (for Year 1 or Year 2):

**Option A — lightweight (Year 1 ship):**
Add `day_of_start_time` (TIME) + `day_of_end_time` (TIME) columns to `stock_artists` table. Sort by time. Timeline tab already handles this well.

**Option B — full program table (Year 2):**
New `stock_program` table:
```sql
CREATE TABLE stock_program (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  block_start TIME NOT NULL,
  block_end TIME NOT NULL,
  slot_type TEXT CHECK (slot_type IN ('music','talk','wavewarz','dj','break')),
  title TEXT,
  owner_id UUID REFERENCES stock_team_members(id),
  artist_id UUID REFERENCES stock_artists(id),
  notes TEXT,
  cut_order INT,
  sort_order INT
);
```

Recommend Option A for now — zero new table, reuses Timeline UX for day-of view.

## ZAO Ecosystem Integration

**Files to touch (if we decide to build this):**

- `src/app/stock/page.tsx` — update the public lineup section with "10 sets + WaveWarZ + talks" framing
- `scripts/stock-team-setup.sql` — add `day_of_start_time` columns if choosing Option A
- New `/stock/program` public page — public-facing schedule (after lineup locks)
- Timeline tab in `/stock/team` — already shows dated items, could add a day-of view filter

**Links to existing WaveWarZ research:**
- [099 — Prediction market music battles](../../wavewarz/099-prediction-market-music-battles/)
- [101 — WaveWarZ ZAO whitepaper](../../wavewarz/101-wavewarz-zao-whitepaper/)
- [180 — WaveWarZ integration blueprints](../../wavewarz/180-wavewarz-integration-blueprints/)
- [406 — Coinflow ISV deep dive (WaveWarZ × ZAO)](../../business/406-coinflow-isv-deep-dive-wavewarz-zao/)

## Next Actions

1. **Tuesday Apr 21 meeting** — bring this draft schedule. Get team vote on format (traditional vs WaveWarZ hybrid).
2. **DCoop + Hurric4n3** — review WaveWarZ bracket mechanics; confirm tech feasibility with existing WaveWarZ infra.
3. **After approval** — add `day_of_start_time` columns, seed the 11 program slots into `stock_artists` + expand Timeline tab with day-of view.
4. **June 2026** — start locking artists to specific slots. Before that, artists stay in pipeline without time assignment.
5. **Sept 2026** — finalize run-of-show, print physical schedule cards for attendees.

## Sources

- [The Festival Grid: Building a Schedule That Breathes — Ticket Fairy](https://www.ticketfairy.com/blog/the-festival-grid-building-a-schedule-that-breathes)
- [Festival Set-Length Strategy: 60 vs 90 vs 120 Minutes — Ticket Fairy](https://www.ticketfairy.com/blog/festival-set-length-strategy-60-vs-90-vs-120-minutes)
- [Festival Schedule Template Guide — Flowgrid](https://tryflowgrid.com/blog/festival-schedule-template-guide)
- [How to Throw a Small One Day Music Festival — SimpleTix](https://www.simpletix.com/how-to-throw-a-small-one-day-music-festival/)
- [Building a Festival Lineup: Crafting the Perfect Schedule — Ticket Fairy](https://www.ticketfairy.com/blog/2025/07/08/building-a-festival-lineup-crafting-the-perfect-schedule/)
- [WaveWarZ Music Battles](https://www.wavewarz.com/)

## Related ZAO Research

- [270 — ZAOstock Planning](../270-zao-stock-planning/)
- [274 — ZAOstock Team Deep Profiles](../274-zao-stock-team-deep-profiles/)
- [418 — Birding Man Festival Analysis](../418-birding-man-festival-analysis/)
- [425 — ZAOstock Dashboard UI](../425-zaostock-dashboard-ui-lean-kanban-patterns/)
