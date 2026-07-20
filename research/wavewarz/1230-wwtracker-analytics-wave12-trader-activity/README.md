---
topic: wavewarz
type: standalone
status: PR open (wwtracker PR #150)
last-validated: 2026-07-17
related-docs: 1229, 1227, 1225
original-query: "wave 12: TraderActivity live trading pulse in §07 — marketplace health before individual leaderboard data"
tier: STANDALONE
---

# 1230 — wwtracker Analytics Wave 12: TraderActivity (Jul 2026)

**Doc:** 1230
**Type:** STANDALONE
**Status:** PR open (wwtracker PR #150)
**Written:** 2026-07-17 (ww build loop)

---

## What was built

**`TraderActivity.tsx`** — a live aggregate trading pulse card placed first in §07 (Who's trading). Fetches `wavewarz.info/api/public/stats` to show marketplace health metrics before visitors scroll into individual leaderboard data.

---

## Component design

| Element | Content | Source |
|---|---|---|
| Hero | `traderClaims.totalSol` ◎ + `withdrawalCount` count | live API |
| Tile: 24H VOLUME | `volume.last24hSol` ◎ + `$` conversion | live API |
| Tile: 7D VOLUME | `volume.last7dSol` ◎ + `$` conversion | live API |
| Tile: AVG CLAIM SIZE | `totalSol / withdrawalCount` ◎ + `$` | computed |
| Tile: TOTAL PAID OUT | `traderClaims.totalUsd` + SOL lifetime sub | live API |
| ● LIVE indicator | appears when data loads | state |

**Loading behavior:** skeleton text "fetching live stats…" while pending; silent "stats unavailable" on error. The card always renders (unlike WwNow which returns null) — it's in §07 below the fold, so layout shift is acceptable.

---

## Placement in §07

```
TraderActivity     ← pulse (NEW, wave 12) — aggregate health first
Leaderboard        ← who's winning, ranked by profit
Traders            ← full trader table
TraderScorecard    ← any-wallet PnL lookup
WinRateLeaderboard ← win % by artist (pre-empted from PR #121)
HotStreaks         ← current and all-time win streaks (pre-empted)
ArtistVolume       ← SOL volume by artist handle (pre-empted)
ArtistStandings    ← full W/L table, sortable (pre-empted)
```

The "aggregate before individual" ordering mirrors the rest of the tracker — §00 shows platform totals before §07 drills into who.

---

## Pre-emption (Lesson 28)

`feat/artist-standings` (PR #121) modifies §07 — adds `WinRateLeaderboard`, `HotStreaks`, `ArtistVolume`, `ArtistStandings`. Wave 12 copies all four component files verbatim from that branch and absorbs them into the §07 render. PR #150 and PR #121 can merge in either order with zero conflicts.

---

## Why §07 for wave 12

**Conflict scan results:**
- §01: already used (wave 11)
- §02: already used (wave 10)
- §03: `feat/growth-momentum` (PR #139) modifies it
- §04: wave 7 already touched it (PR #142)
- §05: mega PR #122 — huge conflict surface
- §06: massive PR #119
- **§07**: only `feat/scroll-narrative` (merged) touched it. Zero open conflict. ← CHOSEN
- §08: PR #120 (SongRecords) + `feat/artist-standings` add to it

§07 was the cleanest available target. TraderActivity's content — live aggregate marketplace stats — is semantically correct for a "traders" section.

---

## Stats API fields used

- `traderClaims.totalSol` — lifetime SOL claimed by winning traders
- `traderClaims.totalUsd` — USD equivalent
- `traderClaims.withdrawalCount` — number of claimShares transactions
- `volume.last24hSol` — buy-side volume last 24 hours
- `volume.last7dSol` — buy-side volume last 7 days
- `solPriceUsd` — for tile USD conversions

---

## Live values at time of writing (2026-07-17)

| Metric | Value |
|---|---|
| Total claimed | 127.34 ◎ |
| Withdrawals | 939 |
| Avg claim | ~0.136 ◎ |
| 24h volume | ~1.37 ◎ |
| 7d volume | ~12.96 ◎ |

These are live and auto-update on every page load.

---

## NORTH STAR alignment

- **ZAO = THE case study:** 127.34 SOL paid out to winning traders is hard proof that WaveWarZ runs a functioning prediction market, not a demo. Placing this at the top of §07 means any visitor looking at "who's trading" sees the macro number first.
- **ZAO IP = a staple in onchain art, music:** Trader claims are on-chain (`claimShares` vault transactions). Surfacing them live in the analytics layer deepens the "everything verifiable" story.

---

## 4 citable facts (live, Jul 2026)

1. **127.34 SOL paid out** to winning traders — lifetime aggregate
2. **939 successful withdrawals** — individual claimShares transactions
3. **~0.136 SOL avg claim** — 127.34 / 939
4. **Live 24h/7d volume** — auto-refreshes from stats API on every load
