# 1079 — WaveWarZ Battle Intelligence Layer

> **Type:** STANDALONE  
> **Status:** Active (July 2026)  
> **Source:** wwtracker public repo · bettercallzaal/wwtracker  
> **Data:** 1,107 battles · May 2025 – Jul 2026 · public/ww-battles.json

---

## What this is

The WaveWarZ Battle Intelligence Layer is a set of 12 client-side analytics components built into [wwtracker](https://github.com/bettercallzaal/wwtracker) — the ZAO's public analytics dashboard for WaveWarZ. These components transform the raw on-chain battle dataset (1,107 battles, 921 unique songs, 27 artist handles) into readable, sortable, interactive intelligence with no backend beyond a static JSON file.

All components are open-source, zero-dependency, and render purely from `public/ww-battles.json` — a snapshot updated via the WaveWarZ intelligence feed at `wavewarz-intelligence.vercel.app`.

---

## Dataset snapshot (July 2026)

| Metric | Value |
|--------|-------|
| Total battles | 1,107 |
| Unique songs | 921 |
| Artist handles (tagged) | 27 |
| Date range | May 28 2025 – Jul 17 2026 |
| Active days | 223 of 414 calendar days |
| Total volume | ~375 ◎ (in dataset) |
| Most-battled song | "WaveWarZ, the electric vibez" (38 battles) |
| Most-battled handle | RoCkY2GriMeY (36 battles, Jun–Jul 2026) |
| Peak month | Mar 2026 — 117.68 ◎ on 188 battles |
| Peak single day | 16 battles |

---

## The 12 analytics components

### §1 — MonthlyVolume

15-month bar chart of volume ◎ and battle count by month. Toggle between views. Peak bar highlighted amber. Key insight: **March 2026 produced 117.68 ◎ on 188 battles** — more than any other month, driven by a high-stakes MAIN event series.

### §2 — BattleTypeBreakdown

Three-card layout showing MAIN, COMMUNITY, and QUICK battle types with stacked volume bar. Key insight: **MAIN events are 3.6% of all battles but drive 70.4% of total volume** (avg 6.78 ◎/battle vs 0.093 ◎ for QUICK). Community battles (24 total) raised funds for charitable causes.

| Type | Count | % of battles | Vol ◎ | % of vol | Avg ◎/battle |
|------|-------|-------------|--------|----------|--------------|
| MAIN | 39 | 3.6% | 264.25 | **70.4%** | 6.78 |
| COMMUNITY | 24 | 2.2% | 15.33 | 4.1% | 0.64 |
| QUICK | 1,026 | 94.2% | 95.66 | 25.5% | 0.093 |

### §3 — DowActivity

Day-of-week bar chart with three toggles (# battles / vol ◎ / avg vol per battle). Key insight: **Monday drives 213.16 ◎ on only 46 battles** — the highest per-battle average by far (4.63 ◎ vs 0.10 ◎ on Saturday). This confirms Monday as the MAIN event slot on WaveWarZ.

| Day | Battles | Vol ◎ | Avg ◎/battle |
|-----|---------|--------|--------------|
| Mon | 46 | **213.16** | **4.63** |
| Thu | 184 | 58.83 | 0.32 |
| Sat | 224 | 23.46 | 0.10 |

### §4 — MarginDistribution

Histogram of win margins across 5 buckets (0–20%, 21–40%, 41–60%, 61–80%, 81–100%). Key insight: **bimodal distribution** — 30.8% of battles are very close (≤20% margin) and 23.9% are blowouts (≥81% margin), with relatively few in the middle ranges. Two crowd behaviors: genuine song contests vs. consensus bets.

| Bucket | Count | % |
|--------|-------|---|
| 0–20% (very close) | 316 | **30.8%** |
| 21–40% | 204 | 19.9% |
| 41–60% | 163 | 15.9% |
| 61–80% | 98 | 9.6% |
| 81–100% (blowout) | 245 | **23.9%** |

Average margin: 46%. Median: 38%.

### §5 — BattleCalendar

GitHub-style contribution heatmap showing battle activity for every day across 14 months. Toggle battles vs. volume view. Five-bucket amber intensity ramp. Month labels and day-of-week axis. Key insight: the platform has been **consistently active since Jan 2026** (daily presence most weeks) with earlier months showing event-only spikes.

### §6 — BattleArena

Handle rankings table showing total battles, wins, losses, win%, volume, and streak for all 27 tagged handles. Sortable by any column. Shows which artists are the most active and most successful on the platform.

### §7 — RecentStandings

Rolling 30-day form table — only the battles within the last 30 days, ranked by activity. Top 3 highlighted amber. Shows who's currently most active, not just all-time leaders. As of July 2026: RoCkY2GriMeY leads with 28 battles in the window.

### §8 — ArtistEarnings

Estimated per-handle earnings from battle fees. Formula: winner ≈ 3% of vol (WIN_RATE), loser ≈ 1.5% of vol (LOSS_RATE). Based on the platform's 1% artist trade fee + winner/loser settlement split. Cross-checked against platform-confirmed total artist payouts (9.05 ◎). Top estimated earner: GodclouD (~0.207 ◎).

### §9 — ArtistProfile

Full profile for any of the 27 handles: W/L record, win %, total vol, avg vol/battle, biggest win, and top rival. Battle log sortable by date/vol/result. Winning songs highlighted amber. Defaults to GodclouD (14W/6L, 7.64 ◎ total, 66% win rate in tagged battles).

### §10 — HandleH2H

Head-to-head lookup for any two handles. Score bar shows win ratio at a glance. Full bout log with date, songs, vol, and outcome. Swap button flips sides. Defaults to **GodclouD vs RoCkY2GriMeY** — the platform's top rivalry at 8 bouts and 2.74 ◎ total vol.

### §11 — RivalryBoard

All head-to-head pairs with 2+ battles, ranked by total bouts. 15 confirmed rivalries identified. Shows the depth of the competitive ecosystem — certain artists keep seeking each other out.

### §12 — BiggestBattles

Top 25 battles by volume, with type breakdown cards. Shows the platform's most significant individual events and how MAIN events dominate the top slots.

---

## Song intelligence

### SongRecords component (bonus — section 08 music)

108 tracks with 3+ battles from 921 unique songs. Records show which tracks are the **cultural anchors** of the WaveWarZ platform — the most re-used, most tested songs in the ecosystem.

| Song | Battles | W | L | Win % | Vol ◎ |
|------|---------|---|---|-------|--------|
| WaveWarZ, the electric vibez | 38 | 21 | 17 | 55% | 4.69 |
| Fuck yo feelingZ | 21 | 15 | 6 | 71% | 7.18 |
| Young Buck | 21 | 11 | 10 | 52% | 4.50 |
| No Regrets | 20 | 16 | 4 | 80% | 0.28 |
| Paradise | 18 | 12 | 6 | 67% | 5.16 |

---

## Architecture

```
public/ww-battles.json          ← 1,107 battles (fetched via npm run fetch:battles)
├── id, type, date
├── a, b                        ← song titles
├── aHandle, bHandle            ← artist handles (tagged from Jun 2026+)
├── winner                      ← winning song title
├── vol                         ← total battle volume in SOL
└── margin                      ← win margin (winning pool % - losing pool %)

components/
├── MonthlyVolume.tsx           ← monthly vol/battles bar chart
├── BattleTypeBreakdown.tsx     ← MAIN/QUICK/COMMUNITY type cards
├── DowActivity.tsx             ← day-of-week activity chart
├── MarginDistribution.tsx      ← win margin histogram
├── BattleCalendar.tsx          ← GitHub-style heatmap
├── BattleArena.tsx             ← handle rankings table
├── RecentStandings.tsx         ← 30-day rolling form
├── ArtistEarnings.tsx          ← estimated per-handle earnings
├── ArtistProfile.tsx           ← full handle profile + battle log
├── HandleH2H.tsx               ← head-to-head lookup
├── RivalryBoard.tsx            ← confirmed H2H rivalries
├── BiggestBattles.tsx          ← top 25 by volume
└── SongRecords.tsx             ← song W/L records
```

All components: no backend calls, pure client-side from ww-battles.json. Zero added npm dependencies. TypeScript with full type safety.

---

## Key findings

1. **Monday = MAIN event day.** 213 ◎ concentrated in 46 battles on Mondays (avg 4.63 ◎/battle vs 0.10 ◎ on Saturdays). Platform economics are driven by weekly high-stakes MAIN events, not daily quick battle volume.

2. **3.6% of battles = 70% of volume.** MAIN events produce the economic gravity. QUICK battles build community and cadence.

3. **Bimodal crowd behavior.** 31% very close (fan-split songs) + 24% blowouts (consensus favorites) — the crowd knows when a song is clearly better and when the contest is real.

4. **March 2026 peak.** 117.68 ◎ on 188 battles — the platform's largest month, correlating with the high-vol MAIN event period visible in PRs and community records.

5. **27 artist handles generating repeated rivalries.** GodclouD vs RoCkY2GriMeY (8 bouts, top rivalry) demonstrates that WaveWarZ creates genuine competitive arcs between artists, not just one-off battles.

6. **Song longevity.** "WaveWarZ, the electric vibez" has been deployed 38 times across the dataset — cultural stickiness for a single track in a competitive format.

---

## Sources

- wwtracker repo: `github.com/bettercallzaal/wwtracker`
- Battle data: `public/ww-battles.json` (fetched from `wavewarz-intelligence.vercel.app`)
- Live stats API: `wavewarz.info/api/public/stats`
- Platform: `wavewarz.com`
- All component PRs: wwtracker #106–#120 (Jul 2026)
- Related ZAO docs: 1076 (estate audit), 1077 (DAO case study), 1078 (analytics infrastructure)
