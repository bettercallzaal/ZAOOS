---
topic: wavewarz
type: standalone
status: PR open (wwtracker PR #151)
last-validated: 2026-07-17
related-docs: 1230, 1229, 1218
original-query: "wave 13: CumulativeGrowth recharts area chart in §03 — monthly cumulative SOL + battles curve from ww-battles.json"
tier: STANDALONE
---

# 1231 — wwtracker Analytics Wave 13: CumulativeGrowth (Jul 2026)

**Doc:** 1231
**Type:** STANDALONE
**Status:** PR open (wwtracker PR #151)
**Written:** 2026-07-17 (ww build loop)

---

## What was built

**`CumulativeGrowth.tsx`** — a recharts AreaChart of cumulative platform growth placed in §03 (Growth over time) after `PlatformGrowth`. Shows the full accumulation curve from May 2025 to present, with toggleable view (SOL volume vs battle count), reference lines at key milestones, and a stats grid below showing when each threshold was crossed.

---

## Component design

| Element | Content | Source |
|---|---|---|
| Area chart (vol mode) | Cumulative SOL volume by month | ww-battles.json aggregated |
| Area chart (battles mode) | Cumulative battle count by month | ww-battles.json aggregated |
| Reference line | 100 ◎ (vol mode) | computed |
| Reference line | 250 ◎ (vol mode) | computed |
| Reference line | 500 battles (battles mode) | computed |
| Reference line | 1,000 battles (battles mode) | computed |
| Stats grid | When each milestone was crossed | computed |

**Loading behavior:** all data computed from static ww-battles.json at module load — no fetch, no loading state.

**Toggle:** `vol ◎` (default) and `# battles` — same chart, different dataKey.

---

## Milestone crossings (computed, Jul 2026)

| Milestone | Month crossed |
|---|---|
| 100 ◎ cumulative volume | Nov 2025 |
| 250 ◎ cumulative volume | Mar 2026 |
| 500th battle | Mar 2026 |
| 1,000th battle | Jun 2026 |
| Tracker total | 375 ◎ / 1,089 battles (as of ww-battles.json snapshot) |
| Live platform total | 524+ ◎ / 1,245+ battles (live API) |

Note: tracker total < live total because the JSON tracker started May 2025 and pre-launch activity is not captured.

---

## Placement in §03

```
PlatformGrowth     ← Dune-based daily + cumulative (existing, most accurate)
CumulativeGrowth   ← battles.json monthly cumulative (NEW, wave 13)
MilestonesTimeline ← key platform dates as timeline list (pre-empted from PR #139)
GrowthMomentum     ← 30-day battle pace comparison (pre-empted from PR #139)
```

§03 tells the complete growth story: daily detail (Dune) → cumulative arc (battles.json) → key milestones → current momentum.

---

## Why distinct from existing components

| Component | Data source | View type | Section |
|---|---|---|---|
| `PlatformGrowth` | Dune (`ww-platform-volume.json`) | Daily bars + cumulative area | §03 |
| `CumulativeGrowth` | `ww-battles.json` | Monthly cumulative area + milestones | §03 |
| `MonthlyVolume` (PR #121) | `ww-battles.json` | Periodic bars (not cumulative) | §06 |
| `GrowthMomentum` (PR #139) | `ww-battles.json` | 30-day comparison tiles | §03 |

`CumulativeGrowth` is the only component that shows the S-curve trajectory of the platform's lifetime accumulation from battles.json with milestone markers. It fills the gap between Dune's daily chart (too granular for the growth story) and the milestone timeline list (no visual curve).

---

## Pre-emption (Lesson 28)

`feat/growth-momentum` (PR #139) adds `GrowthMomentum` and `MilestonesTimeline` to §03. Wave 13 copies both component files verbatim from that branch and absorbs them into the §03 render — PR #151 and PR #139 can merge in either order with zero conflicts.

---

## NORTH STAR alignment

- **ZAO = THE case study:** The cumulative curve from 0 to 375 ◎ (375+ in tracker; 524+ live) is the single most compelling visual for the ZAO's flagship app — a smooth S-curve showing sustained 14-month growth. Any researcher or journalist can screenshot it. The milestone markers (1,000th battle Jun 2026) are individually citable.
- **ZAO IP = a staple in onchain art, music:** The tracker dataset directly proves WaveWarZ is not seasonal — it grew through Dec '25 (100 battles), accelerated Jan–Mar '26 (591 battles by Mar), and sustained that pace through Jul '26.

---

## 4 citable facts (computed, Jul 2026)

1. **100 ◎ cumulative volume crossed Nov 2025** — within the first 6 months
2. **250 ◎ crossed Mar 2026** — the same month as the 500th battle
3. **1,000th battle Jun 26, 2026** — platform longevity milestone
4. **1,089 battles tracked in ww-battles.json** (live total 1,245+)
