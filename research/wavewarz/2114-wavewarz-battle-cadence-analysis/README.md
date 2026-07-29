---
title: "WaveWarZ Battle Cadence: Day-of-Week & Monthly Volume Patterns (Jul 2026)"
doc: 2114
topic: wavewarz
type: ANALYSIS-REFERENCE
status: VERIFIED — derived from ww-battles.json (1,161-record intelligence feed, Jul 2026) + live API
created: 2026-07-29
related-docs: 2077, 2078, 2042
owner: BetterCallZaal / ZOE
data-source: bettercallzaal/wwtracker public/ww-battles.json (1,161 records, May 2025–Jul 2026); wavewarz.info/api/public/stats (queried 2026-07-29T08:05Z)
---

# 2114 — WaveWarZ Battle Cadence: Day-of-Week & Monthly Volume Patterns (Jul 2026)

## Summary

WaveWarZ runs on a predictable weekly rhythm: **Monday = Main Events** (high-volume catalog battles, ~4.6 SOL avg); **Tuesday–Saturday = Quick Battles** (nightly, ~0.10–0.14 SOL avg). Mondays account for only 4% of battles by count but 57% of feed-tracked volume. Monthly data shows March 2026 as the historical peak (188 battles, 117.68 SOL), followed by the AI Tournament week of Jul 17–23 (355 SOL not yet in the feed snapshot).

---

## Day-of-Week Volume Breakdown

*Source: ww-battles.json feed, 1,161 battles (May 2025–Jul 14, 2026). Dataset does not include Jul 17–29 AI Tournament battles (high-volume; those appear only in the live API totals).*

| Day | Battles | Total SOL | Avg SOL/Battle | Notes |
|-----|---------|-----------|----------------|-------|
| **Monday** | **46** | **213.16** | **4.63** | Main Events — catalog vs catalog, tournament rounds |
| Tuesday | 210 | 29.44 | 0.14 | Quick Battles (nightly stream) |
| Wednesday | 205 | 20.94 | 0.10 | Quick Battles |
| Thursday | 200 | 62.30 | 0.31 | Quick Battles (slightly elevated — possibly coincident Main Events) |
| Friday | 217 | 26.64 | 0.12 | Quick Battles |
| Saturday | 238 | 29.30 | 0.12 | Quick Battles (weekend) |
| Sunday | 45 | 11.39 | 0.25 | Quick Battles (fewer per day) |
| **Total feed** | **1,161** | **393.17** | **0.34** | Feed snapshot — excludes AI Tournament week |

**Key ratio:** Monday Main Event avg (4.63 SOL) is **~39× the Tuesday–Friday Quick Battle avg** (~0.12 SOL).

Monday accounts for 4% of battles by count but 54% of feed-tracked volume.

---

## Why Mondays Are Different

WaveWarZ runs two battle formats:
- **Quick Battles**: single-song vs single-song, nightly (Mon–Sat, ~8:30 PM EST). Low stakes.
- **Main Events**: catalog vs catalog across multiple rounds, used for tournaments and featured matchups. Much higher trader participation and SOL volume per battle.

The platform schedules most Main Events on Mondays — the "launch night" of the weekly programming cycle. Tournament rounds (e.g. the 16-artist AI Artist Tournament, Jul 2026) also tend to run Monday–Thursday over a week.

---

## Battle Type Distribution (Feed)

| Type | Count | % of feed |
|------|-------|-----------|
| QUICK | 1,098 | 94.6% |
| MAIN | 39 | 3.4% |
| COMMUNITY | 24 | 2.1% |

**Note:** The live API reports 165 mainBattles vs 39 in the feed — the feed significantly undercounts Main Events. This is a known intelligence-feed coverage gap (see doc 2078). The live API (`wavewarz.info/api/public/stats`) is authoritative for total battle counts.

---

## Monthly Volume Trajectory

*Note: Jul 2026 data in this table covers May 28–Jul 14 only (pre-AI-Tournament). The AI Tournament week (Jul 17–23) contributed ~355 SOL and is NOT captured in the feed snapshot below.*

| Month | Battles | Total SOL | Avg SOL/Battle |
|-------|---------|-----------|----------------|
| May 2025 | 2 | 8.39 | 4.20 |
| Jun 2025 | 3 | 2.15 | 0.72 |
| Jul 2025 | 2 | 20.52 | 10.26 |
| Aug 2025 | 3 | 14.25 | 4.75 |
| Sep 2025 | 7 | 26.06 | 3.72 |
| Oct 2025 | 9 | 28.23 | 3.14 |
| Nov 2025 | 17 | 12.07 | 0.71 |
| **Dec 2025** | **57** | 3.66 | **0.06** |
| Jan 2026 | 137 | 33.43 | 0.24 |
| Feb 2026 | 166 | 31.12 | 0.19 |
| **Mar 2026** | **188** | **117.68** | **0.63** |
| Apr 2026 | 173 | 16.20 | 0.09 |
| May 2026 | 134 | 4.02 | 0.03 |
| Jun 2026 | 120 | 45.71 | 0.38 |
| Jul 2026 (pre-Tournament) | 143 | 29.68 | 0.21 |

**Key observations:**
- **Dec 2025**: Battle frequency exploded (57/month) as daily Quick Battles launched, but avg SOL/battle dropped sharply — the platform shifted from infrequent high-stakes battles to nightly community events.
- **Mar 2026**: Peak volume month (117.68 SOL, 0.63 avg) — likely driven by a tournament or featured matchup. Dune data confirms March 2 as the single highest buy-volume day (28.44 SOL).
- **Apr–May 2026**: Volume slump — community cooling off after March peak.
- **Jun 2026**: Recovery (45.71 SOL) — AI Tournament bracket buildup + more consistent Main Events.
- **Jul 2026 AI Tournament (Jul 17–23)**: Not in feed, but contributed ~355 SOL that week (38× the prior weekly average). See doc 2077 for verified AI Tournament stats.

---

## Live API vs Feed Gap (Jul 29, 2026)

| Metric | Feed (ww-battles.json) | Live API (wavewarz.info) |
|--------|------------------------|--------------------------|
| Battles | 1,161 | 1,302 |
| Volume | 393.17 SOL | 879.12 SOL |
| Gap | 141 battles | 485.95 SOL |

The 141-battle / 486 SOL gap is almost entirely the AI Tournament battles (Jul 17–29), which the intelligence feed had not yet captured as of this snapshot.

---

## Implications for Traders

1. **Monday = Main Event night**: If you're looking for high-volume, high-stakes battles, Monday EST evenings are when the platform's biggest events typically run.
2. **Weeknight Quick Battles**: Low-volume (~0.1 SOL avg) but high frequency — good for accumulating battle XP / leaderboard position.
3. **March seasonal pattern**: Historical data suggests March has been a peak engagement period — possibly coinciding with broader web3 activity cycles or platform-organized tournaments.
4. **Tournament detection**: When live API `last7dSol` > 50 SOL, a tournament is likely active. Normal weekly volume is ~5–10 SOL.

---

## Data Source Notes

- **ww-battles.json**: Intelligence feed scraped via `scripts/ww-battles-fetch.ts` from `wavewarz.info`. 1,161 records as of Jul 29 2026 refresh. Known to undercount MAIN battles (39 in feed vs 165 in live API).
- **Live API**: `GET https://wavewarz.info/api/public/stats` — no auth, 60s cache. Returns live aggregates: total battles, volume, artist payouts, trader claims, live battle.
- **Dune snapshot**: `lib/wwData.ts` (generated 2026-06-14) — decodes on-chain instruction mix; shows `buyShares` peak of 28.44 SOL on 2026-03-02, confirming the Mar 2026 volume spike.
