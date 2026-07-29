---
title: "WaveWarZ Treasury Floor Model: 3.5 SOL Operating Floor — On-Chain Verified (Jun 2026)"
doc: 2117
topic: wavewarz
type: FINANCIAL-REFERENCE
status: VERIFIED — Dune on-chain data (Jun 2026 snapshot) + live API platform revenue
created: 2026-07-29
related-docs: 2115, 2114, 743
owner: BetterCallZaal / ZOE
data-source: Dune Analytics (solana.account_activity for FNjYtwKVsbQzSmoBgLqa8ZGSJTzexQJi6xmV97iakq37, snapshot 2026-06-14); wavewarz.info/api/public/stats (2026-07-29T08:23Z)
---

# 2117 — WaveWarZ Treasury Floor Model: 3.5 SOL Operating Floor

## The Model

WaveWarZ operates with an explicit "floor" model for its treasury wallet (`FNj...`):

- The treasury keeps a **~3.5 SOL operating floor** at all times
- Revenue accumulates above 3.5 SOL
- The team "skims" excess periodically, maintaining the floor balance

This is disclosed publicly (in the app's HowItWorks section and documentation):
> "Floor — the ~3.5 SOL the treasury keeps; founders skim the excess."

---

## On-Chain Verification (Dune, Jun 2026 Snapshot)

Platform treasury: **`FNjYtwKVsbQzSmoBgLqa8ZGSJTzexQJi6xmV97iakq37`**

Dune query over `solana.account_activity` for this wallet (since 2025-08-01, snapshot 2026-06-14):

| Metric | Value |
|--------|-------|
| Total SOL in | **50.57 SOL** |
| Total SOL out | **47.06 SOL** |
| **Net balance** | **+3.51 SOL** |
| Floor target | 3.5 SOL |
| Delta (actual vs target) | **+0.01 SOL** |

**The treasury net lands within 0.01 SOL of the stated 3.5 SOL floor.** This is strong on-chain confirmation that `FNj` is the `wavewarz_wallet` and the skim/floor model is real and functioning as described.

The treasury also signs every battle (it's the top `tx_signer` with 5,022 txs, excluded from the trader leaderboard for this reason), mixing platform ops SOL flows with the balance tracking.

---

## How the Treasury Accumulates Funds

Platform revenue sources (per on-chain IDL):

| Source | Rate |
|--------|------|
| Per-trade fee | 0.5% of each `buyShares` or `sellShares` transaction |
| Settlement fee | 3.0% of the loser pool at each `endBattle` |

**Estimated platform revenue (computed from Jul-29 live API data):**

- Total volume: 879.12 SOL (both-sides trades) → ~4.4 SOL per-trade revenue at 0.5%
- ~1,302 battles settled; avg battle vol ~0.675 SOL; loser pool ≈ 45% of vol ≈ 0.304 SOL/battle
  → 3% × 0.304 × 1,302 ≈ **11.9 SOL** settlement revenue
- **Total estimated: ~16.3 SOL** *(rough; actual ~20.2 SOL per Jul-29 snapshot)*

The gap between estimated (16.3) and actual (20.2) reflects approximation errors in the loser-pool fraction and trade-side split. The 20.2 SOL figure from the live API snapshot (before the field was removed in Jul 2026) is the authoritative cumulative total.

---

## Intraday Dynamics

The Dune data shows an intraday high of **4.65 SOL** on June 13, 2026 — peaking above the 3.5 floor before the daily skim brought it back down. This is consistent with the skim model: revenue accumulates above 3.5 SOL during the day, then the team removes the excess.

The treasury balance oscillates between ~3.5 SOL (after skim) and peak SOL (before skim). The wwtracker's Floor tab tracks these as "daily close" (post-skim) vs "intraday high" (pre-skim peak), computed from `account_activity` as `max_by(post_balance, block_time)` per day.

---

## Why This Matters

1. **Self-sustaining model**: The platform generates enough revenue per battle cycle to maintain operational funds without external capital. At 1,302 battles and 879 SOL volume, the treasury generated ~20.2 SOL → net 3.51 SOL retained after all outflows.

2. **Floor = operating runway**: 3.5 SOL at $74/SOL = ~$260. This is the minimum the team keeps liquid for gas, battle initiation, and ops — not a profit reserve.

3. **Verifiable on-chain**: Unlike most Web2 platforms where financials are opaque, WaveWarZ's revenue flows are readable directly on Solana and Dune. The treasury verification is reproducible by anyone with a Dune account.

4. **Skim discipline**: The near-exact alignment of actual net (3.51) vs target floor (3.5) shows the team actively manages the skim rather than letting it accumulate. This is a positive signal for treasury health and predictable operations.

---

## Cross-References

- **Doc 2115**: Artist economy — the 5%/2% settlement splits and 1% per-trade fee go to artists; 3% to treasury
- **Doc 2114**: Battle cadence — Monday Main Events (4.63 SOL avg/battle) drive disproportionate treasury revenue
- **Doc 2116**: V1/V2 transition — V1 era higher volume per battle generated faster treasury accumulation
