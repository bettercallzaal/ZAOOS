---
topic: wavewarz
type: standalone
status: PR open (wwtracker PR #156)
last-validated: 2026-07-17
related-docs: 1235, 1234, 1227, 1226
original-query: "wave 18: §01 WwNow live snapshot + §02 RevenueFloor — complete intro and floor sections"
tier: STANDALONE
---

# 1236 — wwtracker Analytics Wave 18: §01 + §02 Stack (Jul 2026)

**Doc:** 1236
**Type:** STANDALONE
**Status:** PR open (wwtracker PR #156)
**Written:** 2026-07-17 (ww build loop)

---

## What was built

Two sections expanded in a single wave — both involved simple pre-emption of existing branches with live-API components.

| Section | Before | After |
|---|---|---|
| §01 What WaveWarZ is | AboutWaveWarZ → HowItWorks | AboutWaveWarZ → HowItWorks → **WwNow** |
| §02 The treasury floor | BalanceDashboard | BalanceDashboard → **RevenueFloor** |

---

## Component: WwNow (§01 tail)

**Source:** `feat/wwnow-wave11` (PR #149)

Live API card placed at the bottom of §01 so the "what is it" section ends with real-time proof the platform is active.

| Tile | Value | Source |
|---|---|---|
| BATTLES | `battles.total` | stats API |
| quick · main breakdown | `battles.quickBattles` / `battles.mainEvents` | stats API |
| VOLUME | `volume.totalSol ◎` / `$totalUsd` | stats API |
| ARTIST PAYOUTS | `artistPayouts.totalSol ◎` + "1% of every trade, instant onchain" | stats API |
| LIVE NOW (if active) | `liveBattle.count` battles, `liveBattle.vol ◎` at stake | stats API |
| BATTLE SCHEDULE (when quiet) | "Mon – Fri · 8:30 PM EST · wavewarz.info" | hardcoded |

**Render strategy:** returns `null` while loading (no flash of empty space above the fold). Shows `● LIVE` badge when data is present.

---

## Component: RevenueFloor (§02 tail)

**Source:** `feat/revenue-floor-wave10` (PR #148)

Live card placed below `BalanceDashboard` in §02. Shows the platform revenue above the 3.5 SOL operating floor — the distributable buffer.

**Data flow:** fetches `wavewarz.info/api/public/stats` → `platformRevenue.totalSol` − `FLOOR_SOL (3.5)` = distributable buffer → shows per-recipient breakdown (ops 33%, Hurricane/Candy/Zaal 22% each).

This is a lighter version of `DistributableNow` (§04, wave 14) — it surfaces the same signal in the context of §02 where the floor is introduced, so the user immediately sees the "how much is above the floor" answer right when they learn what the floor is.

---

## Pre-emption (Lesson 28)

| Pre-empted branch | PR | Files |
|---|---|---|
| feat/wwnow-wave11 | #149 | WwNow.tsx |
| feat/revenue-floor-wave10 | #148 | RevenueFloor.tsx |

PRs #148, #149, and #156 can merge in any order — zero conflict. Wave 18 is the superset.

---

## §01 design rationale

§01 is the first section most visitors read. It needs to:
1. **Explain** what WaveWarZ is (AboutWaveWarZ)
2. **Show the mechanics** of how a battle works (HowItWorks)
3. **Prove it's real** with live numbers (WwNow)

Without WwNow, §01 is entirely static. A visitor could read it and wonder "but is this actually running?" WwNow closes that loop with live battles/volume/payout data, ending the intro section on a "yes, this is real and active right now" note.

---

## §02 design rationale

§02 introduces the treasury floor concept via BalanceDashboard (Dune live data). RevenueFloor adds the revenue layer: not just "is the wallet above the floor" but "how much revenue has accumulated above it, and what would each person receive today."

This creates a two-part §02:
- **BalanceDashboard** — the balance signal (Dune, live)
- **RevenueFloor** — the revenue signal (stats API, live)

---

## NORTH STAR alignment

- **ZAO = THE case study:** WwNow makes §01 citable in real time. Any visitor, journalist, or researcher reading the "what is WaveWarZ" section now sees live proof numbers alongside the description. The section becomes self-verifying.
- **ZAO IP = a staple in onchain art, music:** WwNow shows artist payouts — "1% of every trade, instant onchain" — as a top-level live fact in the intro section. Artist earnings are front and center, not buried in analytics.

---

## 3 citable facts (wave 18 context, Jul 2026)

1. **Artist payouts are instant onchain** — 1% of every trade settles to the artist immediately (shown live in WwNow §01)
2. **The platform has a hard 3.5 SOL operating floor** — RevenueFloor shows live distributable buffer above it (§02)
3. **WaveWarZ runs Mon–Fri 8:30 PM EST** — WwNow shows live battle status or the standing schedule when no battle is active
