---
topic: wavewarz
type: standalone
status: PR open (wwtracker PR #148)
last-validated: 2026-07-17
related-docs: 1219, 1224, 1225
original-query: "wave 10 analytics: Revenue vs Floor tile in §02 using live stats API — no Dune needed"
tier: STANDALONE
---

# 1227 — wwtracker Analytics Wave 10: Revenue vs Floor (Jul 2026)

**Doc:** 1227
**Type:** STANDALONE
**Status:** PR open (wwtracker PR #148)
**Written:** 2026-07-17 (ww build loop)

---

## What was built

**`RevenueFloor.tsx`** — a new component placed in §02 (The treasury floor) alongside `BalanceDashboard`. Fetches `wavewarz.info/api/public/stats` live to show cumulative platform revenue vs the 3.5 SOL operating floor as a ratio, bar, and breakdown tiles.

---

## Component design

| Element | Content |
|---|---|
| **Hero metric** | `X.X×` — platform revenue ÷ FLOOR_SOL (live) |
| **Bar** | Full-width = total revenue earned; red marker at the floor position |
| **Tile 1** | Platform Revenue: totalSol ◎ + $USD · 3.16% take rate label |
| **Tile 2** | Artist Payouts: totalSol ◎ + $USD · 1.79% rate label |
| **Tile 3** | Total Fees Generated: sum of both ◎ + $USD |
| **Footer** | Revenue split reminder: 33% ops · 22% each Hurricane/Candy/Zaal |

Live values (2026-07-17): **4.98×** ratio · 17.44 SOL platform revenue · 9.07 SOL artist payouts · 26.51 SOL total fees.

---

## Why this belongs in §02, not §04

| §02 question | §04 question |
|---|---|
| "Is the platform self-sustaining?" | "How does revenue distribute?" |
| Cumulative revenue vs threshold (floor) | Fee structure + founder split |
| Answered by RevenueFloor (wave 10) | Answered by EconomicsBreakdown (wave 7, PR #142) |

The distinction: §02 is about **survival** (balance vs floor), wave 10 extends it with **proof of self-sufficiency** (total revenue earned vs floor). §04 is about **structure** (how fees split). Same numbers, different questions.

---

## Placement in §02

`BalanceDashboard` (Dune-powered live balance) → **`RevenueFloor`** (stats API cumulative revenue)

BalanceDashboard answers: "What is the wallet balance right now vs the floor?"
RevenueFloor answers: "How much total revenue has the platform generated vs the floor?"

---

## Pre-emption

No open branches modify §02's render function. `fix/howit-appshell-floor-sol` (changes §02 intro from hardcoded `"3.5"` to template literal `${FLOOR_SOL}`) was absorbed into this PR's AppShell change.

---

## Also: FLOOR_SOL fix absorbed

The §02 intro now uses:
```tsx
intro: `the headline. the platform wallet's daily balance held against a ${FLOOR_SOL} SOL operating floor — plus a live read on how much revenue the platform has earned above it.`
```
Instead of hardcoded `"3.5 SOL"`. This is consistent with the rest of AppShell (which already uses the constant) and removes a drift risk.

---

## NORTH STAR alignment

- **ZAO = THE case study of a successful DAO:** The `4.98×` ratio is a single citable number proving WaveWarZ has generated 5× its operating floor in platform revenue alone — the platform is self-sustaining, not just surviving. This is the strongest "platform health" signal in the tracker.
- **ZAO IP = a staple in onchain art, music and culture:** The artist payouts tile (9.07 SOL = $669) alongside platform revenue makes visible that the platform's economic model benefits artists, not just the founders.

---

## 4 citable facts (Jul 2026 live data)

1. **4.98× floor ratio**: Platform revenue (17.44 SOL) is 4.98× the 3.5 SOL operating floor
2. **17.44 SOL platform revenue** from 3.16% take rate on buy volume
3. **9.07 SOL artist payouts** from 1.79% direct payout rate — instant and onchain
4. **26.51 SOL total fees generated** combined (platform + artist) from 524+ SOL total volume
