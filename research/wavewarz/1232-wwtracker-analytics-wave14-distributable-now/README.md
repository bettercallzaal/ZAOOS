---
topic: wavewarz
type: standalone
status: PR open (wwtracker PR #152)
last-validated: 2026-07-17
related-docs: 1231, 1230, 1219
original-query: "wave 14: DistributableNow live-API card in §04 — revenue minus floor, per-recipient distributable amounts"
tier: STANDALONE
---

# 1232 — wwtracker Analytics Wave 14: DistributableNow (Jul 2026)

**Doc:** 1232
**Type:** STANDALONE
**Status:** PR open (wwtracker PR #152)
**Written:** 2026-07-17 (ww build loop)

---

## What was built

**`DistributableNow.tsx`** — a live-API card placed in §04 (Profitability + the split) answering the question: *"if a distribution ran right now, what would each recipient receive?"*

Fetches `wavewarz.info/api/public/stats` → `platformRevenue.totalSol` + `solPriceUsd`. Computes buffer = revenue − 3.5 SOL floor. Shows per-recipient amounts in SOL + USD at the 33%/22%/22%/22% split.

---

## Component design

| Element | Content | Source |
|---|---|---|
| LIVE REVENUE | `platformRevenue.totalSol` | Live stats API |
| OPERATING FLOOR | 3.5 ◎ | `lib/config.ts` FLOOR_SOL |
| DISTRIBUTABLE BUFFER | revenue − floor (or "below floor") | Computed |
| Per-recipient tiles | buffer × 33%/22%/22%/22%, SOL + USD | Computed |
| `● LIVE` badge | Shows when data resolves | State |
| Loading / error states | "fetching live stats…" / "stats unavailable" | State |

**Below-floor state:** when revenue < FLOOR_SOL, the buffer tile shows "below floor" with how far short, and the per-recipient grid is hidden entirely.

---

## §04 final stack (wave 14)

```
EconomicsBreakdown   ← static BATTLE_STATS fee rates + implied split at total revenue
DistributableNow     ← live API: revenue − floor, per-recipient now (NEW, wave 14)
Profitability        ← static DISTRIBUTIONS history (all TBD, awaiting founder data)
```

§04 now answers three distinct questions:
1. **How does the platform earn?** (EconomicsBreakdown — fee structure, total accumulated)
2. **What's distributable right now?** (DistributableNow — live floor-adjusted buffer)
3. **What has actually been distributed?** (Profitability — historical events)

---

## Why distinct from existing components

| Component | Data source | Shows |
|---|---|---|
| `EconomicsBreakdown` | Static `BATTLE_STATS` | Total accumulated revenue split — no floor deduction |
| `DistributableNow` | Live stats API | Revenue − floor = actual distributable, per recipient, in USD |
| `Profitability` | Static `DISTRIBUTIONS` | Historical distribution events (all currently TBD) |

The key distinction from EconomicsBreakdown: it shows the full `platformRevenueSol` split across recipients — **including the floor amount**. `DistributableNow` deducts the floor first, so it answers the correct operational question. A visitor asking "how much could Hurricane receive today?" needs `DistributableNow`, not either existing component.

---

## Pre-emption (Lesson 28)

`feat/economics-breakdown` (PR #142) adds `EconomicsBreakdown.tsx` to §04. Wave 14 copies it verbatim from that branch and renders it above `DistributableNow`. PR #152 and PR #142 can merge in any order with zero conflicts.

---

## NORTH STAR alignment

- **ZAO = THE case study:** The floor model (distribute excess above 3.5 SOL) is WaveWarZ's most distinctive financial discipline — it shows a DAO running a real P&L. `DistributableNow` makes that discipline visible in real-time. Any researcher verifying "is WaveWarZ profitable?" can see the live buffer.
- **ZAO IP = a staple in onchain art, music:** The distributable buffer updates live as battles play — it's a live proof that onchain music battles generate real distributable revenue.

---

## 4 citable facts (wave 14 context, Jul 2026)

1. **WaveWarZ operates a 3.5 SOL operating floor** — excess revenue distributes to the core team
2. **Live platform revenue tracked at wavewarz.info/api/public/stats** — no auth, CORS open, 60s cache
3. **Distribution split: 33% operations, 22% each to Hurricane, Candy, Zaal** — codified in `lib/distributions.ts`
4. **DistributableNow shows real-time buffer** = live revenue − 3.5 SOL floor, per recipient in SOL + USD
