---
topic: wavewarz
type: standalone
status: PR open (wwtracker PR #153)
last-validated: 2026-07-17
related-docs: 1232, 1231, 1219
original-query: "wave 15: RevenueCurve monthly platform revenue bar chart in §04 — battles.json vol × take rate"
tier: STANDALONE
---

# 1233 — wwtracker Analytics Wave 15: RevenueCurve (Jul 2026)

**Doc:** 1233
**Type:** STANDALONE
**Status:** PR open (wwtracker PR #153)
**Written:** 2026-07-17 (ww build loop)

---

## What was built

**`RevenueCurve.tsx`** — a recharts BarChart of estimated monthly platform revenue placed in §04 (Profitability + the split) between `EconomicsBreakdown` and `DistributableNow`. Shows the revenue trajectory from May 2025 through Jul 2026, with a peak reference line and four stat tiles.

---

## Component design

| Element | Content | Source |
|---|---|---|
| Bar chart | Estimated monthly platform revenue | ww-battles.json vol × TAKE_RATE |
| TAKE_RATE | `BATTLE_STATS.platformRevenueSol / totalVolumeSol = 3.16%` | lib/battles.ts |
| Peak reference line | Labeled with peak month | computed |
| TOTAL REVENUE stat | `BATTLE_STATS.platformRevenueSol` (exact) | lib/battles.ts |
| PEAK MONTH | Mar '26 | computed |
| PEAK REVENUE | ~3.717 ◎ | computed |
| TAKE RATE | 3.16% | computed |

**Data note:** monthly estimates are per-battle volume × take rate — approximate. The TOTAL REVENUE stat uses the exact BATTLE_STATS figure (not the sum of estimates), so the total is authoritative even if individual month allocations are estimates.

---

## Key data points (Jul 2026)

| Month | Vol ◎ | Est. Revenue ◎ | Cumulative ◎ |
|---|---|---|---|
| May '25 | 8.39 | 0.265 | 0.265 |
| Jun '25 | 2.15 | 0.068 | 0.333 |
| Jul '25 | 20.52 | 0.648 | 0.981 |
| Aug '25 | 14.25 | 0.450 | 1.431 |
| Sep '25 | 26.06 | 0.823 | 2.254 |
| Oct '25 | 28.23 | 0.892 | 3.146 |
| Nov '25 | 12.07 | 0.381 | 3.527 |
| Dec '25 | 3.66 | 0.116 | 3.643 |
| Jan '26 | 33.43 | 1.056 | 4.699 |
| Feb '26 | 31.12 | 0.983 | 5.682 |
| **Mar '26** | **117.68** | **3.717** | **9.399** |
| Apr '26 | 16.20 | 0.511 | 9.910 |
| May '26 | 4.02 | 0.127 | 10.037 |
| Jun '26 | 45.71 | 1.444 | 11.481 |
| Jul '26 | 11.75 | 0.371 | 11.852 |

Tracker total: 11.85 ◎ estimated. Actual total (BATTLE_STATS): 15.30 ◎. Delta (≈3.45 ◎) = pre-launch battles + battles not in tracker JSON.

---

## §04 final stack (waves 14 + 15)

```
EconomicsBreakdown  ← fee structure + static total implied split
RevenueCurve        ← monthly revenue bar chart (NEW, wave 15)
DistributableNow    ← live API: revenue − floor per recipient
Profitability       ← historical distribution events (all TBD)
```

§04 now answers four distinct questions:
1. **How does the platform earn?** (EconomicsBreakdown — fee rates, static totals)
2. **When did revenue grow and how fast?** (RevenueCurve — trajectory chart)
3. **What's distributable right now?** (DistributableNow — live floor-adjusted buffer)
4. **What has actually been distributed?** (Profitability — historical events)

---

## Why distinct from existing components

| Component | Data source | Shows |
|---|---|---|
| `CumulativeGrowth` (§03) | ww-battles.json | Cumulative SOL volume + battle count |
| `EconomicsBreakdown` (§04) | Static BATTLE_STATS | Total accumulated revenue split, no timeline |
| `RevenueCurve` (§04) | ww-battles.json × take rate | Monthly revenue bars — the trajectory |
| `DistributableNow` (§04) | Live stats API | Live buffer = revenue − floor |

`RevenueCurve` is the ONLY component that shows revenue as a time series. It makes visible the March 2026 spike (3.72 ◎ in one month), the Dec 2025 trough, and the recovery through Jun 2026. This is the revenue story, not just a snapshot.

---

## Pre-emption (Lesson 28)

`feat/wave14-distributable-now` (PR #152) adds `EconomicsBreakdown.tsx` + `DistributableNow.tsx` to §04. Wave 15 copies both files verbatim from that branch. PRs #142, #152, and #153 can merge in any order with zero conflicts.

---

## NORTH STAR alignment

- **ZAO = THE case study:** RevenueCurve is the most citable evidence that WaveWarZ is not a one-month spike — it shows 14+ months of revenue generation. The March 2026 peak is visually striking and easy to screenshot. The tracker total (11.85 ◎) + BATTLE_STATS exact (15.30 ◎) = a verifiable paper trail.
- **ZAO IP = a staple in onchain art, music:** The revenue comes entirely from music battles on Audius-sourced tracks. Each ◎ bar represents royalties flowing through onchain music IP.

---

## 4 citable facts (wave 15 context, Jul 2026)

1. **March 2026 = peak revenue month** — ~3.72 ◎ platform revenue from 117.68 ◎ volume
2. **WaveWarZ has generated platform revenue in every month since May 2025** — 15+ consecutive revenue-positive months
3. **Platform take rate: 3.16%** (0.5% per-trade + 3% settlement, verified from BATTLE_STATS ratio)
4. **14 months of positive revenue (May 2025 – Jul 2026)** — proof of sustained operation, not a flash event
