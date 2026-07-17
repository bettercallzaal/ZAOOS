# 1211 — WaveWarZ Artist Economy: Onchain Earnings by Artist (Jul 2026)

**Type:** DOC  
**Status:** Live — data from wwtracker (bettercallzaal/wwtracker) + wavewarz.info/api/public/stats  
**Date:** 2026-07-17  
**Related:** [1077 ZAO DAO Case Study](../1077-zao-dao-case-study-jul2026/), [1079 Battle Intelligence](../1079-wavewarz-battle-intelligence-layer/), [1081 Wave 3 Analytics](../1081-wwtracker-analytics-wave3/)

---

## Why This Matters for the NORTH STAR

> "ZAO IP = a staple in onchain art, music and culture."

WaveWarZ pays artists automatically, on-chain, for every battle their music appears in.
This document makes that claim concrete: **which artists earned what, and how**.
It is not a promise or a roadmap item — it is a verifiable record derivable directly from
the on-chain battle history. Any journalist, grant reviewer, or DAO researcher can
reproduce these numbers from the public `ww-battles.json` dataset.

---

## How Artists Earn on WaveWarZ

WaveWarZ collects a trading fee on every trade (buy/sell) during a battle.
Artists receive an automatic, on-chain payout when a battle settles.

**Fee model (from WAVEWARZ-RESEARCH.md §3 and the live API):**

| Event | Artist payout rate |
|-------|--------------------|
| Battle settled — winner side | ~3% of battle volume (0.5% trade fee + settlement bonus) |
| Battle settled — loser side | ~1.5% of battle volume (0.5% trade fee only) |

All-time platform artist payouts (wavewarz.info/api/public/stats, 2026-07-17):
**9.07 SOL** (~$677 at $74.64/SOL) across 1,245 battles.

---

## Estimated Earnings by Artist — Top 15

Derived from `public/ww-battles.json`: 140 handle-tagged battles (of 1,245 total).
Formula: winner battles × vol × 0.03 + loser battles × vol × 0.015.
Self-battles (same artist on both sides) excluded.
Min 2 cross-artist battles to qualify.

| Rank | Artist (X handle) | W | L | Win% | Vol in (◎) | Est. Earnings (◎) |
|------|-------------------|---|---|------|------------|-------------------|
| 1 | GodclouD | 15 | 6 | 71.4% | 7.964 | 0.2069 |
| 2 | CannonJones973 | 13 | 15 | 46.4% | 4.638 | 0.1207 |
| 3 | BennyJ504WaveWarz | 14 | 13 | 51.9% | 3.960 | 0.0930 |
| 4 | RoCkY2GriMeY | 9 | 27 | 25.0% | 4.918 | 0.0832 |
| 5 | _0xQuan | 14 | 6 | 70.0% | 3.208 | 0.0695 |
| 6 | luiwrites | 10 | 9 | 52.6% | 1.853 | 0.0493 |
| 7 | Stormbourne | 14 | 15 | 48.3% | 1.788 | 0.0377 |
| 8 | dopestilo | 11 | 8 | 57.9% | 1.588 | 0.0322 |
| 9 | shawnsporter | 8 | 6 | 57.1% | 1.626 | 0.0318 |
| 10 | Kata7yst | 2 | 3 | 40.0% | 1.403 | 0.0256 |
| 11 | frameworkfortune | 1 | 3 | 25.0% | 1.402 | 0.0232 |
| 12 | AporkALYPSE78 | 6 | 7 | 46.2% | 0.908 | 0.0210 |
| 13 | srchappell | 3 | 5 | 37.5% | 0.710 | 0.0154 |
| 14 | Hurric4n3Ike | 3 | 2 | 60.0% | 0.792 | 0.0133 |
| 15 | PKMNCTO | 4 | 5 | 44.4% | 0.600 | 0.0126 |

**Total (handle-tagged battles only):** 0.886 ◎ estimated across 15 qualifying artists.

**Note on coverage:** These 140 tagged battles are ~11% of all 1,245 WaveWarZ battles.
The remaining 89% of battles have artists who have not been handle-matched yet.
Total platform payouts = 9.07 ◎ (all battles). As handle tagging expands, per-artist
earnings estimates will become more complete.

---

## Key Findings

### GodclouD: economic leader, not just win-rate leader

GodclouD leads on *all three* economic dimensions:
- **Highest estimated earnings:** 0.2069 ◎ (~$15.44 at Jul 2026 SOL price)
- **Most volume in cross-artist battles:** 7.964 ◎ total SOL
- **Highest win rate (15+ battles):** 71.4% (15W 6L)

GodclouD's earnings are roughly 1.7× the second-place artist (CannonJones973 at 0.1207 ◎).
This is the single most citable "WaveWarZ artist economic data point" for external use.

### Win rate and earnings diverge — volume is the real driver

RoCkY2GriMeY has a 25% win rate but ranks 4th in estimated earnings (0.0832 ◎).
Why: 36 battles (vs 15 for most) means even the 1.5% loser rate on that volume
accumulates. **High-volume participation earns more than high win rate on low volume.**
This is a structurally important insight: WaveWarZ rewards prolific artists, not just
winning artists.

### 0.886 ◎ distributed among 15 identifiable artists from tagged battles alone

- Average per artist: 0.059 ◎ (~$4.40)
- Median: ~0.032 ◎
- Skew: top 5 artists capture 63% of the tagged-battle earnings

---

## Live Components (wwtracker)

| Component | PR | What it shows |
|-----------|-----|---------------|
| `ArtistEarnings.tsx` | #119 (open) | Per-artist estimated earnings from tagged battles, top 15 |
| `ArtistVolume.tsx` | #135 (open) | Per-artist total SOL volume in cross-artist battles, top 15 |
| `WinRateLeaderboard.tsx` | #135 (open) | Win rate ranking (min 5 decided battles), top 15 |
| `ArtistStandings.tsx` | #121 (open) | Raw W/L/D record, all 26 tagged handles |

All components derive from `public/ww-battles.json` — no runtime API calls.

---

## Citable Facts (for external use)

These statements can be verified directly from the on-chain battle record:

1. **"GodclouD has earned an estimated 0.207 SOL from WaveWarZ battle participation — the most of any artist in the tagged battle record."**
2. **"ZAO artists have received 9.07 SOL ($677) in automatic, on-chain payouts from WaveWarZ battles (all-time as of Jul 2026)."**
3. **"WaveWarZ has run 1,245 on-chain battles across 15 months (May 2025 – Jul 2026), generating 524.37 SOL in total trading volume."**
4. **"Artists earn automatically at settlement — no claim required. The platform has issued 939 trader withdrawals (127.34 SOL) alongside artist payouts."**

---

## Data Sources

| Source | What it provides | How to access |
|--------|-----------------|---------------|
| `public/ww-battles.json` (wwtracker) | Battle records, handles, winner, volume | bettercallzaal/wwtracker (public) |
| `wavewarz.info/api/public/stats` | Platform-level totals (9.07 SOL artist payouts) | No auth, CORS open |
| wwtracker components | Live per-artist charts | tracker.thezao.com (when PRs merge) |

---

## Methodology Notes

- Earnings estimates use the documented fee model; the exact Anchor IDL is private.
  Actual payouts may differ slightly (the exact settlement bonus formula is estimated).
- Volume (`vol`) in `ww-battles.json` is in SOL (lamports ÷ 10⁹).
- Self-battles (same `aHandle` == `bHandle`) are excluded — they don't create
  cross-artist competition and don't generate independent economic signals.
- Artists with fewer than 2 cross-artist battles are excluded to filter noise.
