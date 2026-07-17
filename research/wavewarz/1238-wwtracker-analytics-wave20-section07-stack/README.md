---
topic: wavewarz
type: standalone
status: PR open (wwtracker PR #158)
last-validated: 2026-07-17
related-docs: 1237, 1236, 1081, 1211
original-query: "wave 20: §07 full trader stack — TraderActivity + WinRateLeaderboard + HotStreaks + ArtistVolume + ArtistStandings"
tier: STANDALONE
---

# 1238 — wwtracker Analytics Wave 20: §07 Full Trader Stack (Jul 2026)

**Doc:** 1238
**Type:** STANDALONE
**Status:** PR open (wwtracker PR #158)
**Written:** 2026-07-17 (ww build loop)

---

## What was built

**§07 (Who's trading)** expanded from 3 existing components to an 8-component trader intelligence hub. Five new components added via pre-emption of `feat/wave12-trader-activity` (PR #150):

| Component | Type | Function |
|---|---|---|
| `TraderActivity` (NEW) | Live API | Real-time trading pulse: active traders, recent volume, live trade feed |
| `Leaderboard` | Existing | Ranked SOL PnL table |
| `Traders` | Existing | Full trader list with filters |
| `TraderScorecard` | Existing | Any-wallet PnL lookup |
| `WinRateLeaderboard` (NEW) | Static (battles.json) | Ranked W/L% for all tagged handles |
| `HotStreaks` (NEW) | Static (battles.json) | Current win/loss streak by artist |
| `ArtistVolume` (NEW) | Static (battles.json) | SOL volume bet on each artist across all battles |
| `ArtistStandings` (NEW) | Static (battles.json) | Full W/L record for all 27 tagged handles |

Wave 20 also carries the §01 + §02 live-tile expansion from wave18 (WwNow + RevenueFloor).

---

## §07 final stack (wave 20)

```
TraderActivity      ← live: who's trading right now, recent trades, volume
Leaderboard         ← cumulative SOL PnL by wallet
Traders             ← full searchable trader table
TraderScorecard     ← any wallet → PnL breakdown
WinRateLeaderboard  ← win rate ranking (GodclouD leads at 71.4%, min battles threshold)
HotStreaks          ← current active streak per artist handle
ArtistVolume        ← SOL wagered on each artist (popularity ≠ win rate)
ArtistStandings     ← W/L record for all 27 tagged handles
```

§07 now covers the full trader + artist intelligence story:
1. **Who's active right now?** (TraderActivity — live)
2. **Who has the most profit?** (Leaderboard)
3. **Full trader directory** (Traders)
4. **My personal PnL** (TraderScorecard)
5. **Who wins the most?** (WinRateLeaderboard)
6. **Who's on a streak?** (HotStreaks)
7. **Which artist attracts the most SOL?** (ArtistVolume)
8. **How does every handle stack up?** (ArtistStandings)

---

## Key data points (Jul 2026 context)

From doc 1081 (Wave 3 artist intelligence):

| Metric | Value |
|---|---|
| Tagged handles | 27 (of 1,107 total battles, 140 handle-tagged) |
| Win rate leader | GodclouD 71.4% (10/14 battles) |
| Prolific leader | Multiple handles 5+ battles |
| Volume-heaviest artist | Determined by ArtistVolume (live from battles.json) |
| Longest streak possible | GodclouD 8-0 in headliner format |

**Key insight:** Win rate and SOL volume diverge — popular artists (heavy bet volume) ≠ high-win-rate artists. ArtistVolume and WinRateLeaderboard together tell this story.

---

## Pre-emption chain (wave 20)

| Pre-empted branch | PR | Overlap |
|---|---|---|
| feat/wave12-trader-activity | #150 | §07 stack + §01/§02 |
| feat/wave18-section01-02-stack | #156 | §01/§02 only |
| feat/wwnow-wave11 | #149 | §01 WwNow |
| feat/revenue-floor-wave10 | #148 | §02 RevenueFloor |

PRs #148, #149, #150, #156, #158 can all merge in any order — zero conflict. Wave 20 is the superset for §07 + §01 + §02.

---

## NORTH STAR alignment

- **ZAO = THE case study:** The ArtistStandings and WinRateLeaderboard make every WaveWarZ battle handle's on-chain record public and searchable. 27 handles with verifiable W/L records — this is the performance ledger of a functioning music battle economy, citable as governance evidence.
- **ZAO IP = a staple in onchain art, music:** ArtistVolume shows how much SOL was wagered on each artist's music. The top volume artists are effectively the most-bet-on IP in the platform — an onchain measure of cultural relevance.

---

## 4 citable facts (wave 20 context, Jul 2026)

1. **GodclouD win rate: 71.4%** — highest among handles with 5+ battles (verified from ww-battles.json, 27 tagged handles)
2. **Win rate ≠ popularity** — the most-bet-on artists (by SOL volume) are not necessarily the highest win-rate artists; ArtistVolume and WinRateLeaderboard show this divergence
3. **27 tagged artist handles** in the battle record — out of 921 unique songs across 1,107+ total battles
4. **TraderActivity shows live trade feed** — real-time visibility into who is betting, on what, and how much, updated from the live stats API
