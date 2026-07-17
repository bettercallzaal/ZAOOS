---
topic: wavewarz
type: market-research
status: research-complete
last-validated: 2026-07-17
related-docs: 1078, 1079, 1080, 1081, 1211, 1214
original-query: "Document wwtracker analytics wave 4 — TopRivalries, BattleTempo, LivePlatformStats, NailBiters (Jul 2026)"
tier: STANDARD
---

# 1216 — wwtracker Analytics Wave 4: Rivalry, Tempo, Live Stats, and Closest Battles (Jul 2026)

> **Purpose:** Document the fourth wave of wwtracker analytics components built in July 2026, following waves 1 (Doc 1079), 2 (Doc 1080), and 3 (Doc 1081). Wave 4 introduces rivalry tracking, temporal momentum, live API integration, and dramatic-moment highlighting.

## One-Paragraph Summary

Wave 4 adds four analytics components to wwtracker: **TopRivalries** (artist head-to-head series records — GodclouD 8-0 vs RoCkY2GriMeY is the platform's top rivalry in 8 battles), **BattleTempo** (recharts ComposedChart showing monthly battles and SOL volume — peak Mar '26 with 188 battles and 117.7 ◎), **LivePlatformStats** (real-time tile fetching `wavewarz.info/api/public/stats` on mount, showing all 6 API fields including live battle count), and **NailBiters** (10 closest cross-artist battles by margin — top result: 0% margin dead heat, jaifeezy def. CannonJones973). All four are TypeScript-clean with zero added npm dependencies beyond recharts (already in package).

---

## Component Details

### 1. TopRivalries — §08 Music Section

**Branch:** `feat/song-arena-rankings` | **PR:** #93 (updated with this component)

Computes all artist pairings with 2+ battles from the 140 handle-tagged battle dataset. Filters out same-artist entries (aHandle == bHandle). Shows series record for each pair.

| Metric | Value |
|---|---|
| Total cross-artist tagged pairs | 51 |
| Pairs with 2+ battles (rivalries) | 17 |
| Pairs with 3+ battles | 9 |
| Most-contested pair | GodclouD vs RoCkY2GriMeY (8 battles, 8-0) |
| Most evenly matched | CannonJones973 vs \_0xQuan (6 battles, 4-2) |

**Top 5 Rivalries:**

| Pair | Battles | Record |
|---|---|---|
| GodclouD vs RoCkY2GriMeY | 8 | GodclouD 8-0 (dominant) |
| CannonJones973 vs \_0xQuan | 6 | \_0xQuan 4-2 |
| RoCkY2GriMeY vs Stormbourne | 4 | Stormbourne 3-1 |
| \_0xQuan vs dopestilo | 3 | \_0xQuan 3-0 |
| Stormbourne vs \_0xQuan | 3 | \_0xQuan 2-1 |

**Design decisions:** Canonical pair key is alphabetical sort (lo < hi) so pairs are counted exactly once regardless of who was "A" or "B" side in each battle. Leader highlighted in amber. Volume shown per pair as additional signal.

**Citable fact:** "GodclouD vs RoCkY2GriMeY is WaveWarZ's top rivalry: 8 battles, GodclouD undefeated 8-0. The platform's competitive format generates lasting narrative arcs between artists." (Source: TopRivalries component, PR #93, 2026-07-17)

---

### 2. BattleTempo — §05 Analytics Section

**Branch:** `feat/platform-pulse` | **PR:** #122 (updated with this component)

A recharts `ComposedChart` showing monthly battle counts (amber bars, left Y-axis) and SOL volume (dim line, right Y-axis) from May 2025 to July 2026 (15 months). Three stat tiles: Peak Month, Months Active, Current Month (partial).

| Metric | Value |
|---|---|
| Data range | May 2025 — Jul 2026 (15 months) |
| Peak month | Mar 2026 — 188 battles, 117.7 ◎ |
| Months active | 15 |
| Current month (partial) | Jul 2026 — 71 battles as of 2026-07-17 |
| Growth: May '25 → peak | 2 battles → 188 battles (+9,300%) |

**Design decisions:** Uses two independent Y-axes (battle count left, SOL volume right) because the scales differ by ~100×. Recharts `ComposedChart` with `Bar` + `Line` gives the dual-axis in a single chart without a separate library.

**Citable fact:** "WaveWarZ battle volume grew from 2 battles (May 2025, platform launch) to 188 battles in March 2026 — a 94x increase in 10 months." (Source: BattleTempo, PR #122, data from public/ww-battles.json)

---

### 3. LivePlatformStats — §05 Analytics Section

**Branch:** `feat/platform-pulse` | **PR:** #122

Fetches `https://wavewarz.info/api/public/stats` on component mount (client-side, `useEffect`). Shows all 6 API fields in a tile grid: volume (SOL + USD), battles (total + breakdown), artist payouts (SOL + USD), platform revenue (SOL + USD), trader claims (SOL + withdrawal count), and live battle count if active. Graceful loading/error fallback. Shows `● LIVE` badge when data loads. Shows last-updated time from `updatedAt` field.

**API fields shown:**

| Field | Display | Notes |
|---|---|---|
| `volume.sol` / `volume.usd` | TOTAL VOLUME | Live from wavewarz.info |
| `battles.total` + breakdown | BATTLES | quick / mainEvent breakdown in sub |
| `artistPayouts.sol` / `.usd` | ARTIST PAYOUTS | Live |
| `platformRevenue.sol` / `.usd` | PLATFORM REVENUE | Live |
| `traderClaims.sol` / `.withdrawalCount` | TRADER CLAIMS | Live |
| `liveBattle.count` / `.vol` (conditional) | LIVE NOW | Only shown if count > 0 |

**Design decisions:** Complements the Hurricane handoff doc (PR #136) by demonstrating the API live in the tracker. Live SOL price shown from `solPriceUsd` field for context.

**Citable fact:** "wwtracker integrates the wavewarz.info public stats API, showing real-time platform metrics independently of the Dune bake cycle. The API is public, CORS-open, and has a 60s cache." (Source: LivePlatformStats PR #122 + API doc PR #136)

---

### 4. NailBiters — §05 Analytics Section

**Branch:** `feat/platform-pulse` | **PR:** #122

Shows the 10 closest cross-artist battles (lowest margin) from the tagged dataset. Filters: `aHandle != bHandle` AND `vol > 0` (excludes empty/test battles). Displays: winner handle def. loser handle, margin%, date, SOL volume.

| Metric | Value |
|---|---|
| Total tagged cross-artist battles with volume | 79 |
| Closest (0% margin) | jaifeezy def. CannonJones973, Jul 1, 2026, 0.197 ◎ |
| Second closest | GodclouD def. CannonJones973 (wait — winner was CannonJones973), Jun 17 2026, 0.099 ◎ |
| Highest-stakes close battle | GodclouD vs luiwrites, 3% margin, 1.051 ◎ |

Note: 0% margin battles = exact 50/50 split in trader votes. These are true dead heats, not ties (one side wins by tiebreak or first-voter rule).

**Design decisions:** Vol > 0 filter removes 5 zero-volume 0%-margin battles (likely test or tiebreak-only battles). These would dominate the top of the list uninterestingly. The component footnotes "0% margin = exact dead heat in trader votes" for interpretive clarity.

**Citable fact:** "The closest WaveWarZ battle ever fought: jaifeezy defeated CannonJones973 at exactly 0% margin (0.197 ◎ at stake, Jul 1, 2026) — a true 50/50 split of trader votes." (Source: NailBiters component, PR #122, 2026-07-17)

---

## §05 Analytics Section — Final State (after wave 4)

After wave 4 merges, §05 "Platform analytics" will render:

1. **PlatformAnalytics** — all-time baked stats (volume, battles, type breakdown, traders)
2. **PlatformPulse** — pace/trend signals (last-7-day, 30-day trend, avg vol/battle)
3. **BattleTempo** — monthly battle count + volume chart (15 months)
4. **LivePlatformStats** — real-time API tile
5. **NailBiters** — 10 closest tagged battles

Section intro: *"the full on-chain picture — baked analytics, pace trends, monthly battle tempo, live stats direct from the API, and the 10 closest battles ever fought."*

---

## Wave Summary (All Waves)

| Wave | Doc | Components | Key Components | PR |
|---|---|---|---|---|
| Wave 1 | 1079 | 12 | BattleArena, HandleH2H, RivalryBoard, BiggestBattles, SongRecords, RecentBattles | #119 |
| Wave 2 | 1080 | 6 | ArtistStandings, PlatformPulse, MilestonesTimeline, SongRematches, BattleTypeEvolution, CommunityBattles | #110, #119, #121-#124 |
| Wave 3 | 1081 | 3 | HotStreaks, WinRateLeaderboard, ArtistVolume | #135 |
| **Wave 4** | **1216** | **4** | **TopRivalries, BattleTempo, LivePlatformStats, NailBiters** | **#93, #122** |

---

## Sources

- `public/ww-battles.json` (wwtracker, 1,245 battles, 2026-07-17)
- PR #93 (TopRivalries.tsx commit: `1d2f0cd`, wwtracker feat/song-arena-rankings)
- PR #122 (BattleTempo: `153704f`; LivePlatformStats: `d7804b3`; NailBiters: `6f76561`, wwtracker feat/platform-pulse)
- PR #136 (wavewarz.info stats API contract doc — LivePlatformStats API spec)
- [Doc 1078](../1078-wwtracker-analytics-infrastructure/) — wwtracker infrastructure overview
- [Doc 1081](../1081-wwtracker-analytics-wave3/) — Wave 3 (preceding wave)
- [Doc 1214](../1214-wavewarz-creative-ecosystem-jul2026/) — ZAO IP catalog (TopRivalries rivalry data also cited there)
