---
topic: wavewarz
type: market-research
status: research-complete
last-validated: 2026-07-17
related-docs: 1078, 1079, 1080, 1081, 1214, 1216, 1218
original-query: "Document wwtracker analytics wave 7 — EconomicsBreakdown component (§04 Profitability, Jul 2026)"
tier: STANDARD
---

# 1219 — wwtracker Analytics Wave 7: Platform Economics Breakdown (Jul 2026)

> **Purpose:** Document the seventh wave of wwtracker analytics components, following waves 1-6 (Docs 1079, 1080, 1081, 1216, 1218). Wave 7 adds revenue-model transparency to §04 Profitability: the platform take rate, artist payout rate, and implied distribution math from actual accumulated totals.

## One-Paragraph Summary

Wave 7 ships **EconomicsBreakdown** (§04 profitability), a single component placed above the existing `Profitability` component. It answers the question `Profitability.tsx` does not: how does 484.46 SOL in buy volume translate into 15.3 SOL platform revenue (3.16%) and 8.66 SOL in artist payouts (1.79%)? The component shows three headline tiles (total buy volume, platform revenue + take rate, artist payouts + take rate), the per-trade/settlement fee structure from the on-chain IDL, and the implied 33%/22%/22%/22% distribution amounts at the current accumulated revenue total (ops 5.05 ◎, each founder 3.37 ◎). All data from `BATTLE_STATS` (lib/battles.ts, wavewarz.info API snapshot 2026-06-15) and `RECIPIENTS` (lib/distributions.ts). No live fetch.

---

## Component Details

### EconomicsBreakdown — §04 Profitability Section

**Branch:** `feat/economics-breakdown` | **PR:** #142  
**Conflicts with:** No other open PR (§04 untouched by all other branches — verified by full AppShell conflict audit, doc 1218)

Placed above the existing `Profitability` component. The two together give §04 a complete picture:

| Component | What it shows |
|---|---|
| `EconomicsBreakdown` (new) | Revenue model from volume: take rates, accumulated totals, fee table, implied split |
| `Profitability` (existing) | Distribution history (TBD), 33/22/22/22 pie chart, floor model explanation |

#### Key Figures

| Metric | Value | Source |
|---|---|---|
| Total buy volume (all time) | 484.46 ◎ | BATTLE_STATS.totalVolumeSol |
| Platform revenue accumulated | 15.30 ◎ | BATTLE_STATS.platformRevenueSol |
| Platform take rate | 3.16% of buy volume | 15.30 / 484.46 |
| Artist payouts accumulated | 8.66 ◎ | BATTLE_STATS.artistPayoutsSol |
| Artist payout rate | 1.79% of buy volume | 8.66 / 484.46 |

#### Implied Distribution at 15.30 ◎ Accumulated

| Recipient | % | Implied ◎ |
|---|---|---|
| WaveWarZ operations | 33% | 5.049 ◎ |
| Hurricane | 22% | 3.366 ◎ |
| Candy | 22% | 3.366 ◎ |
| Zaal | 22% | 3.366 ◎ |

#### Per-Battle Fee Table

| Mechanism | Rate |
|---|---|
| Per trade → platform | 0.5% of trade |
| Per trade → artist | 1.0% of trade |
| Settlement → winning traders | 40% of loser pool |
| Settlement → losing traders | 50% of loser pool (refund) |
| Settlement → winning artist | 5% of loser pool |
| Settlement → losing artist | 2% of loser pool |
| Settlement → platform | 3% of loser pool |

**Design decisions:**
- Placed ABOVE `Profitability` so the revenue-generation story comes first, then the distribution story
- Does NOT duplicate `Profitability`'s pie chart or distribution history table
- Snapshot footnote clearly cites 2026-06-15 wavewarz.info API snapshot
- "Implied split" labeled as implied — actual distribution events tracked in `Profitability` above
- `BATTLE_STATS.totalVolumeSol` (484.46) is from Dune via wavewarz.info, more accurate than ww-battles.json vol sum (375.24, undercount due to multi-round MAIN events)

**Citable fact:** "WaveWarZ generated 15.30 SOL in platform revenue from 484.46 SOL in buy volume (3.16% take rate), with an additional 8.66 SOL paid directly to artists (1.79%). Verified from wavewarz.info API, 2026-06-15 snapshot." (Source: EconomicsBreakdown component, PR #142, wwtracker)

---

## §04 Section Final State

After PR #142 merges, §04 "Profitability + the split" renders:

1. **EconomicsBreakdown** — revenue model, take rates, fee table, implied split
2. **Profitability** — distribution history (TBD), 33/22/22/22 pie chart, floor model

Section intro updated: *"how the platform earns from battles — take rates, accumulated revenue, and what distributes once the treasury clears the 3.5 SOL floor."*

---

## Wave Summary (All Waves)

| Wave | Doc | Components | Section | PR(s) |
|---|---|---|---|---|
| Wave 1 | 1079 | 12 | §06 battles | #119 |
| Wave 2 | 1080 | 6 | §03, §05, §07, §08, §09 | #110, #119, #121-#124 |
| Wave 3 | 1081 | 3 | §07 traders | #135 |
| Wave 4 | 1216 | 4 | §05, §08 | #93, #122 |
| Wave 5-6 | 1218 | 3 | §00, §03, §09 | #139, #140, #141 |
| **Wave 7** | **1219** | **1** | **§04** | **#142** |

**Total components built:** 29 across 7 waves

---

## Self-Retro Lessons (Waves 5-7)

Two new lessons added to ww-directive.md as part of this wave's retro:

- **Lesson 27:** AppShell conflict audit should grep for section IDs (`id:`), not just file presence. Branches modifying different section IDs have zero conflict risk — skip pre-emption.
- **Lesson 28:** Pre-emption requires copying source-branch component TSX files (`git show origin/feat-A:components/X.tsx`), not just AppShell changes. TypeScript fails on missing imports otherwise.

---

## Sources

- `public/ww-battles.json` (wwtracker, 1,089 battles, 2026-07-17)
- `lib/battles.ts` BATTLE_STATS (totalVolumeSol=484.46, platformRevenueSol=15.3, artistPayoutsSol=8.66; snapshot 2026-06-15)
- `lib/distributions.ts` RECIPIENTS (33%/22%/22%/22% split)
- PR #142 (EconomicsBreakdown.tsx, feat/economics-breakdown, 2026-07-17)
- [Doc 1077](../1077-zao-dao-case-study-jul2026/) — ZAO DAO case study (primary external citation)
- [Doc 1214](../1214-wavewarz-creative-ecosystem-jul2026/) — ZAO IP catalog
- [Doc 1218](../1218-wwtracker-analytics-wave5-6/) — Wave 5-6 (AppShell conflict audit methodology)
