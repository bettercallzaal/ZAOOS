---
topic: wavewarz
type: standalone
status: PR open (wwtracker PR #155)
last-validated: 2026-07-17
related-docs: 1234, 1233, 1218, 1216
original-query: "wave 17: §03 growth stack — CumulativeGrowth + MilestonesTimeline + GrowthMomentum"
tier: STANDALONE
---

# 1235 — wwtracker Analytics Wave 17: §03 Growth Stack (Jul 2026)

**Doc:** 1235
**Type:** STANDALONE
**Status:** PR open (wwtracker PR #155)
**Written:** 2026-07-17 (ww build loop)

---

## What was built

**§03 (Growth over time)** expanded from a single `PlatformGrowth` bar chart to a 4-component narrative stack. Three components added via pre-emption:

| Component | Source branch | Function |
|---|---|---|
| `CumulativeGrowth.tsx` | feat/wave13-cumulative-growth (PR #151) | Dual-axis: cumulative SOL volume + battle count since May 2025 |
| `MilestonesTimeline.tsx` | feat/milestones-timeline | 9+ verified on-chain milestones with dates + context |
| `GrowthMomentum.tsx` | feat/wave13-cumulative-growth (PR #151) | Last-7 / last-30 vs prior-30 day battle count + % trend |

---

## §03 final stack (wave 17)

```
PlatformGrowth      ← monthly bar chart of battle count (existing)
CumulativeGrowth    ← dual-axis cumulative VOL (◎) + battle count trajectory
MilestonesTimeline  ← 9 verified milestones: IRL events, vol crossings, battle counts
GrowthMomentum      ← last-7/30 vs prior-30 pace check with % trend indicator
```

§03 now answers four questions:
1. **How did battle count grow month by month?** (PlatformGrowth)
2. **What does cumulative growth look like?** (CumulativeGrowth — the curve, not just the bars)
3. **When did key moments happen?** (MilestonesTimeline — the verified event log)
4. **Is the platform accelerating or decelerating?** (GrowthMomentum — 30-day momentum signal)

---

## MilestonesTimeline: verified milestones (Jul 2026)

| Date | Milestone | Verified |
|---|---|---|
| Dec 2024 | ZAO-CHELLA IRL event (Art Basel, Wynwood, Miami) | Research docs |
| Dec 2024 | PolyRaiders Holiday Heat — first charity battle | Research docs |
| Feb 2025 | Love Song Benefit Series — ~$1,497 total raised | Research docs |
| May 28, 2025 | Platform opens — first battle on-chain | ✓ ww-battles.json |
| May 29, 2025 | First MAIN-type event | ✓ ww-battles.json |
| ~Nov 2025 | 100 ◎ cumulative volume | ✓ computed |
| Mar 16, 2026 | 500th battle | ✓ computed |
| Mar 2026 | Peak month — 117.68 ◎ volume | ✓ BATTLE_STATS |
| Mar 16, 2026 | 250 ◎ cumulative volume | ✓ computed |
| Jun 26, 2026 | 1,000th battle | ✓ computed |
| Jul 2026 | 500 ◎ total platform volume (live) | Live API |
| Oct 3, 2026 | ZAOstock IRL event — Franklin St Parklet, Ellsworth ME | Announced |

**Verification methodology:** milestones marked ✓ are computed from ww-battles.json sorted chronologically. "Research docs" milestones are from ZAOOS community research (docs 1220, 1223). "Announced" = wavewarz.info Events page.

---

## GrowthMomentum: pace signal

Shows `last7` / `last30` / `prior30` battle counts from ww-battles.json with a % change indicator (last30 vs prior30). If last30 > prior30: "accelerating"; if lower: "decelerating". Snapshot date hardcoded at `SNAPSHOT_DATE = "2026-07-17"` for reproducibility.

---

## Pre-emption (Lesson 28)

Wave 17 pre-empts two source branches:

| Pre-empted branch | PR | Files copied |
|---|---|---|
| feat/wave13-cumulative-growth | #151 | CumulativeGrowth.tsx, GrowthMomentum.tsx |
| feat/milestones-timeline | (no PR) | MilestonesTimeline.tsx |

PRs #151 and #155 can merge in any order — zero conflict. Wave 17 is the superset.

---

## Why distinct from existing components

| Component | Data source | Shows |
|---|---|---|
| `PlatformGrowth` | ww-battles.json | Monthly battle count bars — pace |
| `CumulativeGrowth` (NEW) | ww-battles.json | Cumulative SOL + battles — the curve shape |
| `BattleTempo` (§05) | ww-battles.json | Monthly battle count bars (same data, different context) |
| `MilestonesTimeline` (NEW) | battles.json + research | Specific dated events on the growth curve |
| `GrowthMomentum` (NEW) | ww-battles.json | 30-day momentum signal — is it growing? |

`CumulativeGrowth` shows the S-curve shape that monthly bars hide. `MilestonesTimeline` anchors the curve to real events. `GrowthMomentum` gives a live health signal — the "is this platform still moving?" question.

---

## NORTH STAR alignment

- **ZAO = THE case study:** MilestonesTimeline is the most citable single component in the tracker. It shows WaveWarZ has: 3 IRL events, 2 charity series, 1,000+ battles, 500+ SOL volume, 14+ months of operation. Every milestone has a date and source. This is the DAO case study in timeline form.
- **ZAO IP = a staple in onchain art, music:** The Dec 2024 IRL events (Art Basel, Wynwood) and the charity battle series ($1,497 to HuRya) appear in the timeline — putting WaveWarZ music battles at physical events and real-world giving on the same axis.

---

## 4 citable facts (wave 17 context, Jul 2026)

1. **WaveWarZ crossed 1,000 battles on Jun 26, 2026** — 13 months after platform open (May 28, 2025)
2. **March 2026 = both peak battle month (188) and peak revenue month (3.72 ◎)** — the same month drives both volume records
3. **WaveWarZ has been running IRL events since Dec 2024** — ZAO-CHELLA (Art Basel, Miami) preceded the platform's on-chain tracker launch by 5+ months
4. **$1,497 raised for HuRya Empowerment Foundation** via 2 charity battle series before the tracker even launched — charity format predates on-chain record
