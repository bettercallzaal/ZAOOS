# 428 — ZAOstock Run-of-Show Program (Oct 3, 2026)

> **Status:** Draft v2 — needs team feedback Tuesday Apr 21
> **Date:** 2026-04-17
> **Goal:** Design the day-of program for ZAOstock with fluid pacing — ~15-min content blocks separated by 5-10 min transition buffers, WaveWarZ bracket for multi-set performances, short (5-10 min) talks interspersed, and built-in contingency for real-world slippage.

---

## Key Decisions

| Decision | Choice |
|----------|--------|
| Base content block | ~15 min (music set), ~10 min (talk), ~5 min (WaveWarZ round segment) |
| Transition buffer | 5-10 min between every block — DJ crossfade, artist swap, catch-your-breath |
| Total runtime | 12pm-6pm window with fluid timing, not a rigid grid |
| Musician format | Hybrid: 5-6 traditional sets + 4-artist WaveWarZ bracket with 3 rounds |
| Talk format | 5 slots x 5-10 min, between sets, topic-specific |
| Breaks | 1 explicit 15-min mid-day break. Transition buffers serve as mini-breaks throughout. |
| Contingency | Every block swappable. Talks cut first. DJ fills any gap. Weather moves under tent with zero schedule change. |
| WaveWarZ voting | Live QR code vote after each round. Uses existing WaveWarZ infra (reference docs 099, 101, 180). |

## Proposed Schedule — fluid blocks with 5-10 min flex between

Times below are **approximate targets** not hard clocks. Each row assumes a 5-10 min transition before the next starts. MC watches the clock and keeps the flow moving but never cuts a set mid-song.

Legend in text: [MUSIC] = artist set, [TALK] = 5-10 min talk, [BATTLE] = WaveWarZ round, [DJ] = DJ fill / transition, [BREAK] = explicit break.

| Target start | Block | Duration | Flex after |
|--------------|-------|----------|-----------|
| 12:00 | [DJ] Doors open + welcome DJ | 15 min | — |
| 12:15 | [MUSIC] Artist 1 — opening set | 25-30 min | 5-10 min |
| ~12:50 | [TALK] Welcome to ZAOstock — what this is (Zaal) | 5-10 min | 5 min |
| ~13:05 | [MUSIC] Artist 2 | 15-20 min | 5-10 min |
| ~13:35 | [TALK] Web3 music 101 — why this matters (DCoop / Hurric4n3) | 5-10 min | 5 min |
| ~13:50 | [MUSIC] Artist 3 | 15-20 min | 5-10 min |
| ~14:20 | [BREAK] Official break — food, bathroom, mingle | 15 min | — |
| ~14:35 | [TALK] An artist's perspective (WaveWarZ contestant) | 5-10 min | 5 min |
| ~14:50 | [BATTLE] WaveWarZ Round 1 — 4 artists x 5 min | ~25 min (with transitions between artists) | 5-10 min |
| ~15:25 | [DJ] Voting break + audience QR vote | 5-10 min | — |
| ~15:35 | [BATTLE] WaveWarZ Semi-Final — top 2 x 7-8 min | ~20 min | 5-10 min |
| ~16:00 | [TALK] The ZAO — how to get involved (Candy / FailOften) | 5-10 min | 5 min |
| ~16:15 | [MUSIC] Artist 4 | 15 min | 5-10 min |
| ~16:35 | [TALK] Partners + Year 2 preview (Zaal) | 5-10 min | 5 min |
| ~16:50 | [BATTLE] WaveWarZ Final — 2 artists x 10 min | ~25 min | 5-10 min |
| ~17:20 | [DJ] Final voting + winner announce | 5 min | — |
| ~17:25 | [MUSIC] Closing set — WaveWarZ winner OR special guest | 25-30 min | — |
| ~17:55 | [DJ] Closing DJ + afterparty call to Black Moon | until 18:00 | — |

**Total content:** 5 music sets + 3 WaveWarZ rounds + 5 talks + 1 closing set. Four WaveWarZ artists each perform 2-3 times depending on bracket advancement. Net unique artist appearances: 10 (5 traditional + 4 WaveWarZ repeat + 1 closing winner).

## Why fluid pacing (not rigid 15-min grid)

1. **Musicians run over.** A rigid grid punishes the crowd and the artist when a great set wants 2 more minutes. Fluid lets it breathe.
2. **Transitions take longer in reality.** Swapping a band's gear takes 10-12 min, not 3. Building flex in prevents the whole afternoon from collapsing by 4pm.
3. **Talks slide into available gaps.** If a transition is fast, talk goes long. If slow, talk shortens or cuts.
4. **Crowd energy can be read.** Hot crowd = extend. Cold crowd = tighten up, skip a talk, get to the next music.
5. **WaveWarZ voting is variable.** First round might take 3 min, final round might take 8. Flex absorbs it.

## WaveWarZ Bracket Mechanics

4 artists compete. 3 rounds. Multi-set performance for bracket artists.

**Round 1** (target ~14:50) — All 4 artists perform 5 min each. Audience votes via QR code. Takes ~25 min including 5-min transitions between artists.

**Semi-Final** (target ~15:35) — Top 2 vote-getters each get 7-8 min. Audience votes again. ~20 min total.

**Final** (target ~16:50) — 2 finalists. Last chance. 10 min each. Winner gets the 25-30 min closing set slot (~17:25).

**Fee structure for WaveWarZ artists:**
- Base fee: $300 per artist (all 4)
- Winner bonus: $500 for the closing set
- Total: 4 x $300 + $500 = $1,700 (vs 4 x $400 single set = $1,600). Nearly break-even for way more audience engagement and showcase time.

## Talk Slot Spec

Each talk is **5-10 min, hard-timed by moderator (Candy).** 2-min sign, 30-sec sign, stop sign. Standalone value if kept or cut.

| # | Title | Speaker | Purpose |
|---|-------|---------|---------|
| 1 | Welcome to ZAOstock — what this is | Zaal | Frame the day for new attendees |
| 2 | Web3 music 101 — why this matters | DCoop / Hurric4n3 | Bridge onchain + IRL audiences |
| 3 | An artist's perspective | A WaveWarZ contestant | Humanize the artists |
| 4 | The ZAO — how to get involved | Candy or FailOften | Community acquisition pitch |
| 5 | Partners + Year 2 preview | Zaal | Sponsor thank-you + tease 2027 |

**Cut order:** talks are first to cut if running late. Order 1 through 5 = which gets cut first when time is tight. The welcome talk (1) is actually cut-first because the music itself is the welcome.

## Contingency / Movability

Plan for entropy. Every block is atomic and swappable.

| Scenario | Move |
|----------|------|
| Artist cancels day-of | Slot becomes extended DJ + bump next block up |
| Artist runs 5 min over | Compress next transition; stay on schedule |
| Artist runs 10+ min over | Cut next talk; keep music flow |
| Talk speaker no-shows | DJ fills; announce "program change" |
| Rain / weather | Move under Wallace Events tent — zero schedule change |
| WaveWarZ voting tech fails | Moderator picks winner by crowd volume (clap-off) |
| Audience thin / tired | Cut last talk + closing DJ, end on WaveWarZ Final + closing set |
| Audience hot | Extend closing set, slide afterparty call to 18:00 |
| Sound issue mid-set | DJ jumps in, troubleshoot 2-3 min, resume |

**Rule of thumb:** protect music, cut talks. Music is what they came for.

## Tech / Production Notes per Block Type

| Block type | Setup needed | Transition time |
|-----------|-------------|----------------|
| Solo artist + laptop/DJ | 1 mic, 1 line in | 3-5 min |
| Band with instruments | Full stage reset, line check | 10-12 min |
| WaveWarZ round | Artists pre-staged, QR screen on, clean swap | 3-5 min between artists |
| Talk | 1 mic, no backing | 1-2 min (walk-up) |
| DJ transition | Pre-loaded, crossfade | 0 min (continuous) |

**Implication:** avoid two full bands back-to-back without DJ buffer. Already reflected in the schedule.

## Tracking This in the Dashboard

Two options for data model:

**Option A (Year 1 ship, recommended):**
Add `day_of_start_time` (TIME) + `day_of_duration_min` (INT) columns to `stock_artists`. Use the existing Timeline tab for a day-of view. Zero new tables.

**Option B (Year 2):**
Dedicated `stock_program` table with slot_type enum, ownership, cut order, and flex buffer fields:

```sql
CREATE TABLE stock_program (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  target_start TIME NOT NULL,
  duration_min INT NOT NULL,
  flex_after_min INT DEFAULT 5,
  slot_type TEXT CHECK (slot_type IN ('music','talk','wavewarz','dj','break')),
  title TEXT,
  owner_id UUID REFERENCES stock_team_members(id),
  artist_id UUID REFERENCES stock_artists(id),
  notes TEXT,
  cut_order INT,
  sort_order INT
);
```

Recommend Option A for Year 1.

## ZAO Ecosystem Integration

**Files that would touch if we build this:**
- `src/app/stock/page.tsx` — update public lineup section with "music sets + WaveWarZ + talks" framing
- `scripts/stock-team-setup.sql` — add `day_of_start_time` + `day_of_duration_min` if picking Option A
- New `/stock/program` public page — public day-of schedule (locks in Sept 2026)
- Timeline tab in `/stock/team` — filter toggle for "day-of program" view

**WaveWarZ research to reference:**
- [099 — Prediction market music battles](../../wavewarz/099-prediction-market-music-battles/)
- [101 — WaveWarZ ZAO whitepaper](../../wavewarz/101-wavewarz-zao-whitepaper/)
- [180 — WaveWarZ integration blueprints](../../wavewarz/180-wavewarz-integration-blueprints/)
- [406 — Coinflow ISV deep dive (WaveWarZ x ZAO)](../../business/406-coinflow-isv-deep-dive-wavewarz-zao/)

## Next Actions

1. **Tuesday Apr 21 meeting** — bring this draft schedule. Team votes on format (traditional vs WaveWarZ hybrid).
2. **DCoop + Hurric4n3** — confirm WaveWarZ tech feasibility with existing infra.
3. **Post-approval** — add `day_of_start_time` + `day_of_duration_min` columns to `stock_artists`. Seed the ~15 program slots. Timeline tab gets a day-of filter.
4. **June 2026** — start locking specific artists to time slots (wait until confirmed count is higher).
5. **Sept 2026** — finalize run-of-show, print physical schedule cards for attendees with approximate times marked clearly.

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
