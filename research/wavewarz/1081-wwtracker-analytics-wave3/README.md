# 1081 — WaveWarZ Analytics Wave 3: Artist Intelligence (Jul 2026)

**Type:** STANDALONE  
**Status:** PRs open, pending merge  
**Date:** 2026-07-17  
**Repo:** bettercallzaal/wwtracker  
**Related:** 1078 (analytics infrastructure), 1079 (battle intelligence), 1080 (wave 2)

---

## Overview

Wave 3 adds three components focused on **artist-level intelligence** derived from the handle-tagged battle record. All data comes from `public/ww-battles.json` (1,089 battles as of 2026-07-17; 140 handle-tagged). No external API calls — purely computed from the battle history.

These components serve the NORTH STAR: WaveWarZ as the ZAO's live, citable proof that onchain music competition works. Artist streaks and rivalries are the social layer that makes the data shareable and memorable.

---

## Components

### 1. HotStreaks — PR #131

**File:** `components/HotStreaks.tsx`  
**Location:** AppShell section 07 (traders), after TraderScorecard

**What it shows:**
- **CURRENTLY HOT** — artists on an active win streak (≥ 2 consecutive wins), top 8 by current streak length, amber highlight
- **RECORD STREAKS** — all-time best win streaks for any qualifying artist, top 8

**Algorithm:**
- Battles sorted by numeric `id` (monotonic timestamp integer) for correct chronological ordering — avoids date string parsing issues with mixed formats
- An artist's streak increments on each consecutive win; resets to 0 on any loss
- Minimum 3 total tagged battles to qualify (filters one-off handles)

**Key data (2026-07-17):**
- GodclouD: currently hot (~5W), record ~8W
- _0xQuan: record ~6W
- Hurric4n3Ike: currently hot (~5W)

---

### 2. WinRateLeaderboard — PR #132

**File:** `components/WinRateLeaderboard.tsx`  
**Location:** AppShell section 07 (traders), after HotStreaks (pending merge)

**What it shows:**
Artist W/L/win% leaderboard for all handles with 5+ decided battles. Ranked by win rate, ties broken by total battles. Top 3 highlighted in amber with proportional bar.

**15 qualifying artists (2026-07-17):**

| Rank | Handle | W | L | Win% |
|------|--------|---|---|------|
| 1 | GodclouD | 15 | 6 | 71.4% |
| 2 | _0xQuan | 14 | 6 | 70.0% |
| 3 | Hurric4n3Ike | 3 | 2 | 60.0% |
| 4 | dopestilo | 11 | 8 | 57.9% |
| 5 | shawnsporter | 8 | 6 | 57.1% |
| 6 | luiwrites | 10 | 9 | 52.6% |
| 7 | BennyJ504WaveWarz | 14 | 13 | 51.9% |
| 8 | Stormbourne | 14 | 15 | 48.3% |
| 9 | CannonJones973 | 13 | 15 | 46.4% |
| 10 | AporkALYPSE78 | 6 | 7 | 46.2% |
| 11 | PKMNCTO | 4 | 5 | 44.4% |
| 12 | Kata7yst | 2 | 3 | 40.0% |
| 13 | WaveWarzAfrica | 2 | 3 | 40.0% |
| 14 | srchappell | 3 | 5 | 37.5% |
| 15 | RoCkY2GriMeY | 9 | 27 | 25.0% |

Draws and undecided battles excluded from win% calculation.

---

### 3. HeadToHead — PR #133

**File:** `components/HeadToHead.tsx`  
**Location:** AppShell section 06 (battles), below the Battles table

**What it shows:**
17 cross-artist rivalry cards (matchups with 2+ battles), sorted by total battle count. Each card shows both handles, a proportional win bar (amber = leader), and W-L scores.

**Top rivalries (2026-07-17):**

| Matchup | Record | Notes |
|---------|--------|-------|
| GodclouD vs RoCkY2GriMeY | 8-0 | Most dominant rivalry |
| CannonJones973 vs _0xQuan | 2-4 | Most battles (6 total) |
| RoCkY2GriMeY vs Stormbourne | 1-3 | |
| Stormbourne vs _0xQuan | 1-2 | |
| _0xQuan vs dopestilo | 3-0 | |

**Algorithm:** Self-battles (same handle on both sides) excluded. For each matched pair, handles are sorted alphabetically to canonicalize the key. Only battles where both `aHandle` and `bHandle` are set count.

---

## NORTH STAR Alignment

These three components make WaveWarZ battle data **shareable and citable as a proof layer for ZAO's onchain art/music culture thesis:**

1. **HotStreaks** → real-time social signal ("GodclouD is on a 5-win streak right now")
2. **WinRateLeaderboard** → merit-based ranking that can be cited externally ("71.4% win rate across 21 battles")
3. **HeadToHead** → rivalry narrative ("8-0 head-to-head — the most lopsided record in WaveWarZ history")

All are derived from the on-chain battle record, making them verifiable claims, not platform assertions.

---

## Technical Notes

- **Handle coverage:** Handles were added to battles Jun 2026+. 140/1,089 battles are handle-tagged. This number grows with every new tagged battle.
- **Data source:** `public/ww-battles.json` — baked into the Next.js build, no runtime API call
- **Sorting:** All three components sort by numeric `id` (not date string) to avoid mixed date format issues
- **Threshold design:** HotStreaks uses min 3 total battles; WinRateLeaderboard uses min 5 decided battles; HeadToHead uses min 2 cross-artist battles

---

## PR Status

| PR | Component | Branch | Status |
|----|-----------|--------|--------|
| #131 | HotStreaks | feat/hot-streaks | Open, 111/111 tests green |
| #132 | WinRateLeaderboard | feat/artist-winrate | Open, 111/111 tests green |
| #133 | HeadToHead | feat/head-to-head | Open, 111/111 tests green |
