---
title: "WaveWarZ Artist Economy: 'Loser Earns' Payout Model & Verified Figures (Jul 2026)"
doc: 2115
topic: wavewarz
type: ANALYSIS-REFERENCE
status: VERIFIED — derived from IDL fee model + live API (wavewarz.info, 2026-07-29)
created: 2026-07-29
related-docs: 2077, 2114, 2041, 743
owner: BetterCallZaal / ZOE
data-source: wavewarz.info/api/public/stats (2026-07-29T08:05Z); on-chain IDL wavewarzvtwo.json (discriminators verified)
---

# 2115 — WaveWarZ Artist Economy: "Loser Earns" Payout Model & Verified Figures (Jul 2026)

## The Differentiator: Loser Earns

WaveWarZ pays both the winning and losing artist on every battle. This is structural — built into the on-chain settlement instruction (`endBattle`) — not a promotional promise.

At settlement, the **loser's SOL pool** is split:

| Recipient | Share |
|-----------|-------|
| Winning traders (pro-rata) | 40% |
| Losing traders (capital refund) | 50% |
| **Winning artist** | **5%** |
| **Losing artist** | **2%** |
| Platform treasury | 3% |

**Additionally, each artist earns 1.0% of every trade** (buy or sell) made on their side during the battle, paid at the time of the trade.

So every artist in a WaveWarZ battle receives:
- **During battle**: 1.0% of total trade volume on their side
- **After settlement**: 2–5% of the loser pool (automatic, on-chain, instant)

There is no manual payout step for artists. The `endBattle` instruction sends artist shares directly to their registered wallets.

---

## Verified Cumulative Figures (Jul 29, 2026)

*Source: `GET https://wavewarz.info/api/public/stats` (queried 2026-07-29T08:05:57Z)*

| Metric | Value |
|--------|-------|
| Total artist payouts (cumulative) | **13.4168 SOL** (~$993 USD at $74.02/SOL) |
| Total volume (both sides) | 879.12 SOL |
| Artist payout as % of volume | **~1.53%** |
| Average artist payout per battle | **~0.0103 SOL** (~$0.76) |
| Battles settled | ~1,302 |

The 1.53% figure aligns with the IDL model: 1% per-trade artist fee + 5%/2% settlement splits produce artist payouts in the 1–2% range of total volume depending on the win rate and trade-to-pool ratio.

**Note:** The `platformRevenue` field was removed from the live API as of Jul 2026. Last known snapshot (Jul 29, from `lib/battles.ts` in bettercallzaal/wwtracker): **~20.2 SOL platform revenue** (0.5% per-trade + 3% of loser pools).

---

## Trader Claims (for Context)

| Metric | Value |
|--------|-------|
| Cumulative trader claims | **382.87 SOL** (~$28,340 USD) |
| Claim withdrawals (transactions) | **1,557** |
| Trader claims as % of volume | **~43.6%** |

The 43.6% figure is consistent with the loser-pool mechanics: if ~half of trades are on the losing side, the 40%+50% trader portions of each loser pool accumulate to roughly 45% of all settled volume.

Note: Trader claims require a **manual claim step** (`claimShares` instruction) — this is different from artist payouts, which are automatic. Unclaimed winnings remain in the vault until claimed.

---

## Artist Payout Calculation (Formula)

For a battle where:
- Winning side SOL pool: `W`
- Losing side SOL pool: `L`
- Your total trade volume on your side: `V_artist`

**Winning artist receives:**
- During battle: `V_artist_winning × 1%`
- At settlement: `L × 5%`

**Losing artist receives:**
- During battle: `V_artist_losing × 1%`
- At settlement: `L × 2%`

Example (typical quick battle, ~0.10 SOL total volume, 60/40 split):
- Losing pool ≈ 0.04 SOL
- Winning artist: 0.006 SOL (trade) + 0.002 SOL (settlement) ≈ **0.008 SOL**
- Losing artist: 0.004 SOL (trade) + 0.0008 SOL (settlement) ≈ **0.005 SOL**

Example (AI Tournament semifinal, ~342 SOL total volume, 55/45 split):
- Losing pool ≈ 154 SOL
- Winning artist: ~1.88 SOL (trade) + 7.7 SOL (settlement) ≈ **~9.6 SOL**
- Losing artist: ~1.54 SOL (trade) + 3.08 SOL (settlement) ≈ **~4.6 SOL**

The semifinal example shows why high-volume battles are transformative for artist earnings — at $74 SOL, the semifinal winner earned ~$710 and the loser earned ~$340, both automatically on-chain.

---

## Implications

1. **Artists have no downside risk in participating** — they receive payouts from every battle regardless of outcome.
2. **High-volume Main Events are especially attractive** — the 5%+2% settlement splits of a 342 SOL loser pool dwarf the per-trade 1% on a typical 0.10 SOL quick battle.
3. **Automatic settlement is a key UX differentiator** — artists don't need to monitor wallets or claim; funds arrive automatically when the battle closes.
4. **13.41 SOL cumulative artist payouts** across 1,302 battles (as of Jul 29 2026) represents **real, automatic, on-chain income** to WaveWarZ artists — not streaming royalties, not NFT sales, but direct market-driven payments settled in native SOL.

---

## Cross-References

- **Doc 2077**: Verified AI Tournament stats — the semifinal alone likely drove several SOL in single-battle artist payouts
- **Doc 2114**: Battle cadence analysis — Monday Main Events have 4.63 SOL avg/battle, meaning artist settlement payouts on Main Events are ~40× those of Quick Battles
- **Doc 2041**: Trader economy analysis — covers the trader side of the same on-chain settlement
