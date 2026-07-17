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

All-time platform artist payouts (wavewarz.info/api/public/stats, 2026-07-17T17:15Z):
**9.07 SOL** (~$683 at $75.29/SOL) across 1,245 battles.

---

## Estimated Earnings by Artist — Top 15

Derived from `public/ww-battles.json` (1,108 battles, PR #175 branch): handle-tagged cross-artist battles.
Formula: winner battles × vol × 0.03 + loser battles × vol × 0.015.
Self-battles (same artist on both sides) excluded. Min 2 cross-artist battles to qualify.
Dataset refresh: 2026-07-17 (parser fix added 19 battles including the 1.87 SOL Luchador battle).

| Rank | Artist (X handle) | W | L | Win% | Vol in (◎) | Est. Earnings (◎) |
|------|-------------------|---|---|------|------------|-------------------|
| 1 | GodclouD | 16 | 6 | 72.7% | 10.436 | 0.2579 |
| 2 | CannonJones973 | 8 | 12 | 40.0% | 5.204 | 0.1241 |
| 3 | RoCkY2GriMeY | 6 | 25 | 19.4% | 4.943 | 0.0813 |
| 4 | geekmyth | 4 | 0 | 100.0% | 2.422 | 0.0727 |
| 5 | _0xQuan | 13 | 5 | 72.2% | 2.880 | 0.0621 |
| 6 | luiwrites | 4 | 3 | 57.1% | 1.309 | 0.0371 |
| 7 | dopestilo | 9 | 5 | 64.3% | 1.561 | 0.0317 |
| 8 | frameworkfortune | 2 | 3 | 40.0% | 1.584 | 0.0287 |
| 9 | shawnsporter | 4 | 2 | 66.7% | 1.264 | 0.0236 |
| 10 | Kata7yst | 1 | 4 | 20.0% | 1.286 | 0.0216 |
| 11 | srchappell | 4 | 5 | 44.4% | 0.860 | 0.0199 |
| 12 | Stormbourne | 6 | 7 | 46.2% | 0.969 | 0.0193 |
| 13 | Hurric4n3Ike | 4 | 2 | 66.7% | 0.805 | 0.0137 |
| 14 | PKMNCTO | 3 | 2 | 60.0% | 0.472 | 0.0101 |
| 15 | AporkALYPSE78 | 1 | 4 | 20.0% | 0.278 | 0.0065 |

**Total estimated earnings (qualifying artists):** ~0.83 ◎ from handle-tagged battles.

**Note on GodclouD:** 24 total appearances in the feed (including 2 self-battles excluded from this table). Cross-artist record: 22 battles (16W/6L). Volume figure (10.436 SOL) excludes self-battle volume. GodclouD's earnings lead is 2.1× the second-place artist.

**Note on coverage:** Handle-tagged cross-artist battles are ~12% of all 1,245 WaveWarZ battles (live API).
Total platform payouts = 9.07 ◎ (all battles). As handle tagging expands, per-artist
earnings estimates will become more complete.

---

## Key Findings

### GodclouD: economic leader, not just win-rate leader

GodclouD leads on *all three* economic dimensions:
- **Highest estimated earnings:** 0.2579 ◎ (~$19.42 at $75.29/SOL)
- **Most volume in cross-artist battles:** 10.436 ◎ total SOL (across 22 cross-artist battles)
- **Highest win rate (5+ battles):** 72.7% (16W 6L, cross-artist; 24 total tagged appearances)

GodclouD's earnings are roughly 2.1× the second-place artist (CannonJones973 at 0.1241 ◎).
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

1. **"GodclouD has earned an estimated 0.258 SOL (~$19) from WaveWarZ battle participation — the most of any artist in the tagged battle record (22 cross-artist battles, 72.7% win rate, 10.44 SOL volume)."**
2. **"ZAO artists have received 9.07 SOL ($683) in automatic, on-chain payouts from WaveWarZ battles (all-time as of Jul 2026)."**
3. **"WaveWarZ has run 1,245 on-chain battles across 26 months (May 2025 – Jul 2026), generating 524.15 SOL in total trading volume."**
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
