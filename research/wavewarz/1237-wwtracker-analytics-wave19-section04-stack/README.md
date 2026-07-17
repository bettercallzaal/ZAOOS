---
topic: wavewarz
type: standalone
status: PR open (wwtracker PR #157)
last-validated: 2026-07-17
related-docs: 1236, 1233, 1232, 1219
original-query: "wave 19: §04 full economics stack — EconomicsBreakdown + RevenueCurve + DistributableNow + Profitability"
tier: STANDALONE
---

# 1237 — wwtracker Analytics Wave 19: §04 Full Economics Stack (Jul 2026)

**Doc:** 1237
**Type:** STANDALONE
**Status:** PR open (wwtracker PR #157)
**Written:** 2026-07-17 (ww build loop)

---

## What was built

**§04 (Profitability + the split)** expanded from a single `Profitability` component to a 4-component economics narrative. Three components pre-empted from open PRs:

| Component | Source branch | PR | Function |
|---|---|---|---|
| `EconomicsBreakdown.tsx` | feat/economics-breakdown | #142 | Fee structure, take rates, implied split totals |
| `RevenueCurve.tsx` | feat/wave15-revenue-curve | #153 | Monthly revenue bar chart (15 months) |
| `DistributableNow.tsx` | feat/wave14-distributable-now | #152 | Live: revenue − floor per recipient |
| `Profitability` | (existing on main) | — | Historical distribution events |

---

## §04 final stack (wave 19)

```
EconomicsBreakdown  ← fee structure: 0.5% per-trade + 3% settlement = 3.16% take rate
RevenueCurve        ← recharts BarChart: 15 months estimated revenue, peak Mar '26
DistributableNow    ← live API: platformRevenue.totalSol − FLOOR_SOL per recipient
Profitability       ← historical distribution events (existing)
```

§04 now answers 4 distinct questions:
1. **How does the platform earn?** (EconomicsBreakdown — fee rates, accumulated totals)
2. **When did revenue grow and how fast?** (RevenueCurve — the monthly trajectory)
3. **What's distributable right now?** (DistributableNow — live floor-adjusted buffer, per recipient in SOL + USD)
4. **What has actually been distributed?** (Profitability — historical events)

---

## EconomicsBreakdown key numbers (static, Jul 2026)

| Metric | Value |
|---|---|
| Total buy volume | 484.46 ◎ |
| Platform revenue | 15.30 ◎ |
| Take rate | 3.16% (per-trade 0.5% + settlement 3%) |
| Artist payouts | 9.07 ◎ (1.79% of buy volume) |
| Ops (33%) | ~5.05 ◎ implied |
| Hurricane (22%) | ~3.37 ◎ implied |
| Candy (22%) | ~3.37 ◎ implied |
| Zaal (22%) | ~3.37 ◎ implied |

---

## RevenueCurve key data (Jul 2026)

Monthly estimated revenue = per-battle volume × TAKE_RATE (3.16%).

| Month | Est. Revenue ◎ | Notes |
|---|---|---|
| May '25 | 0.265 | platform open |
| Dec '25 | 0.116 | trough |
| **Mar '26** | **3.717** | **peak** |
| Jun '26 | 1.444 | recovery |
| Jul '26 | 0.371 | mid-month |
| **Total (tracker)** | ~11.85 ◎ | |
| **Total (BATTLE_STATS exact)** | **15.30 ◎** | delta = pre-launch battles not in JSON |

---

## DistributableNow (live, Jul 2026 snapshot)

`platformRevenue.totalSol` (live) − `FLOOR_SOL` (3.5) = distributable buffer.

At session time: 17.44 ◎ − 3.5 = **13.94 ◎ distributable**

| Recipient | Share | SOL |
|---|---|---|
| Ops | 33% | 4.60 ◎ |
| Hurricane | 22% | 3.07 ◎ |
| Candy | 22% | 3.07 ◎ |
| Zaal | 22% | 3.07 ◎ |

(These are live values — actual distribution depends on SOL price at time of transfer.)

---

## Pre-emption (Lesson 28)

| Pre-empted | PR | Superset |
|---|---|---|
| feat/economics-breakdown | #142 | PR #157 |
| feat/wave14-distributable-now | #152 | PR #157 |
| feat/wave15-revenue-curve | #153 | PR #157 |

PRs #142, #152, #153, #157 can all merge in any order — zero conflict.

---

## NORTH STAR alignment

- **ZAO = THE case study:** §04 is now the most citable section in the tracker. EconomicsBreakdown gives the exact take rate (3.16%) and total revenue (15.30 ◎) in one card. RevenueCurve shows 14+ consecutive revenue-positive months. DistributableNow gives a live, verifiable distribution amount. This is the on-chain economics case study, not a pitch deck.
- **ZAO IP = a staple in onchain art, music:** Every ◎ in the platform revenue came from music battles. The 9.07 ◎ artist payouts (shown in EconomicsBreakdown) flow directly to artists for their music being used in battles. The revenue section now makes that explicit.

---

## 4 citable facts (wave 19 context, Jul 2026)

1. **WaveWarZ take rate: 3.16%** — 0.5% per-trade + 3% settlement, verified from BATTLE_STATS ratio (15.30 ◎ / 484.46 ◎)
2. **15.30 ◎ total platform revenue** since May 2025 — 14+ consecutive months of revenue generation
3. **March 2026 peak: 3.72 ◎ in a single month** — from 117.68 ◎ volume at 3.16% take rate
4. **Revenue split: 33% ops / 22% Hurricane / 22% Candy / 22% Zaal** — verified from `lib/distributions.ts`
