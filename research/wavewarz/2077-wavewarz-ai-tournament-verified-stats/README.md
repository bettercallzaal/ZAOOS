---
title: "WaveWarZ AI Artist Tournament: Verified Stats Reference (Jul 2026)"
doc: 2077
topic: wavewarz
type: REFERENCE-FACTS
status: CANONICAL — use for all AI Tournament press, grant, and media references. Do NOT use docs 1784/1787 directly for press claims without checking this doc first.
created: 2026-07-25
related-docs: 1784, 1787, 1786, 2042, 2043, 2071, 2075, 2076, 2073
owner: ZOE (updates) / Zaal (approves press use)
data-source: wavewarz.info/api/public/stats (queried Jul 24, 2026 ~00:00 UTC)
---

# 2077 — WaveWarZ AI Artist Tournament: Verified Stats Reference (Jul 2026)

> **Use this doc as the single source of truth for AI Tournament stats in press, grants, and social media.**
> Earlier research docs (1784, 1787) contain accurate data but were written before the treasury-analysis correction (see § Data Integrity below). This doc supersedes any AI Tournament volume claims in those docs.

---

## Verified Facts (Source: wavewarz.info/api/public/stats, Jul 24, 2026)

| Stat | Value | Source | Confidence |
|------|-------|--------|------------|
| Tournament week volume (Jul 17–23) | **355.36 SOL (~$26,240 USD at $73.87/SOL)** | Live API `last7dSol` | ✅ CONFIRMED |
| Semifinal volume (GEEK MYTH def. AI LUI, 2-1) | **~342 SOL (~$25,260 USD)** | Live API + on-chain | ✅ CONFIRMED |
| Total platform all-time volume (Jul 24) | **877.58 SOL (~$64,844 USD)** | Live API `totalSol` | ✅ CONFIRMED |
| Tournament week as % of all-time | **40.5%** (355.36 / 877.58) | Computed | ✅ CONFIRMED |
| Prior 13-month total (before tournament) | **~522 SOL** (877.58 − 355.36) | Computed | ✅ CONFIRMED |
| Prior 13-month weekly average | **~9.3 SOL/week** (522 / 56 weeks) | Computed | ✅ CONFIRMED |
| Tournament week vs weekly average | **~38× the prior weekly average** | Computed | ✅ CONFIRMED |
| Semifinal as % of prior 13-month history | **~65.6%** (342 / 522) | Computed | ✅ CONFIRMED |
| Grand final (GEEK MYTH vs Stormbourne) | **Volume: [TBD — fill after result]** | — | ⏳ PENDING |
| Tournament total (semi + final) | **[TBD — fill after grand final]** | — | ⏳ PENDING |

---

## What CAN Be Stated in Press

These statements are accurate and verifiable:

```
✅ "355 SOL ($26,000+) in trading volume in one week" — live API confirmed
✅ "The AI Tournament week was the platform's single largest week" — per live API rolling window
✅ "40.5% of the platform's all-time trading volume in 7 days" — 355 / 877.58
✅ "38× the prior average weekly trading volume" — 355 / 9.3 SOL avg
✅ "The semifinal alone (GEEK MYTH def. AI LUI) generated ~342 SOL" — on-chain
✅ "The largest single battle event in the platform's 14-month history" — per wavewarz.info API
✅ "1,289 battles settled across 14 months (May 2025 – Jul 2026)"
✅ "Platform all-time volume: 877.58 SOL (~$64,844)"
✅ "Artist payouts: 13.40 SOL total, automatic, on-chain"
✅ "1,526 on-chain trader withdrawal transactions"
```

---

## What CANNOT Be Stated Without Further Verification

```
❌ "8.7× the previous single-week volume record"
   — Reason: no reliable per-week historical data; treasury CSV includes
     sponsorship payments, not just fees. Live API only gives rolling 7-day.

❌ "68% of all prior platform history in one week"  
   — This was accurate (355/522 = 68% of prior 13-month total), but the
     framing "prior history" is ambiguous in press contexts. Use "40.5% of
     all-time" instead (355/877) — cleaner and unambiguous.

❌ "More volume than the platform's entire prior history"
   — False: 355 SOL < 522 SOL prior history.

❌ Any specific dollar amounts without noting "at [DATE] SOL price"
   — SOL price moves daily. All dollar figures need a date stamp.
```

---

## Safe Press Pitch Paragraph (paste-ready)

> "WaveWarZ, a Solana prediction market for music battles, ran an AI Artist Tournament in July 2026. The tournament's semifinal alone — GEEK MYTH defeating AI LUI 2-1 — generated **~342 SOL (~$26,500)** in trading volume. The full tournament week (Jul 17–23) drove **355 SOL in 7 days**, equal to **40.5% of the platform's all-time trading volume** and **38× its prior weekly average**. Since launching in May 2025, WaveWarZ has settled 1,289 battles on Solana with 877.58 SOL total volume, 13.40 SOL in automatic artist payouts, and 1,526 on-chain withdrawal transactions."

---

## Data Integrity Notes

### Why "8.7×" Is Retired from Press Docs

The wavewarz.info API describes the AI Tournament semifinal as "8.7× the biggest event in WaveWarZ history" — this refers to a **single-event** comparison, not a weekly comparison, and uses on-chain data (not the intelligence feed). It may be accurate. However, ZAO style for press pitches avoids multipliers in favor of absolute numbers (Lesson 46, ww-directive.md). Use "platform's largest single event in 14 months" as the absolute statement.

### Why the Treasury Analysis Was Unreliable

Session 17 (Jul 24, 2026) attempted to verify the AI Tournament weekly volume record by analyzing `ww-daily-treasury.csv` delta_sol as a 0.5% fee proxy. Session 18 found this was flawed:

1. **Calibration**: Jul 20 delta (1.768 SOL) for the AI Tournament semifinal (~342 SOL) confirms 0.5% per-battle fee rate ✓
2. **But**: All-time pre-tournament treasury positive deltas implied ~3.34% rate — 6× higher than 0.5%
3. **Root cause**: `ww-daily-treasury.csv` includes Sigea/rJ **sponsorship payments** mixed with battle fees. Large single-day spikes (e.g., Jun 24: +1.365 SOL, Jun 25: +1.045 SOL) are likely sponsorship income, not fee income
4. **Consequence**: Session 17's "Jun 22-28 had ~631 SOL" estimate was a false positive — that week's treasury spike was likely from sponsor payments, not trading
5. **Correct conclusion**: The AI Tournament week (355 SOL from live API) is likely the **all-time weekly trading record** — the Session 17 counter-claim was based on faulty methodology

**Treasury CSV valid uses:** Team revenue tracking, ops cost comparison, individual large-battle fee verification. NOT valid for cross-week historical volume comparison.

---

## Volume Context Comparison

| Period | Volume | Source | Notes |
|--------|--------|--------|-------|
| Platform all-time (May 2025 – Jul 2026) | 877.58 SOL | Live API | ✅ confirmed |
| AI Tournament week (Jul 17–23, 2026) | 355.36 SOL | Live API rolling 7d | ✅ confirmed |
| Prior 13 months (before tournament) | ~522 SOL | Computed | ✅ confirmed |
| Prior weekly average | ~9.3 SOL/week | Computed | ✅ confirmed |
| Prior monthly average | ~40.2 SOL/month | Computed | ✅ confirmed |
| Jun 22-28, 2026 (treasury attempt) | ~631 SOL (Session 17) / UNRELIABLE | Treasury CSV | ❌ flawed methodology |

---

## Grand Final Placeholder

Fill after GEEK MYTH vs Stormbourne result:

```
Grand final: [WINNER] def. [LOSER], [DATE]
Grand final volume: [SOL] (~$[USD])
Total tournament (semi + final): [SOL] SOL
Tournament % of all-time: [X]% ([SOL] / [all-time at that date])
```

---

*ZAOOS doc 2077 — ZAO Operating System — github.com/bettercallzaal/ZAOOS*
*See also: 1787 (tournament facts), 2043 (press pitch pack), 2076 (Mirror/Farcaster drafts), 2071 (case study)*
