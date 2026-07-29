---
title: "WaveWarZ V1→V2 Judging Transition: Charts Only to Poll+Charts+DJ Wavy (Mar 10, 2026)"
doc: 2116
topic: wavewarz
type: HISTORICAL-ANALYSIS
status: VERIFIED — from ww-battles.json feed + live API; battle counts match feed data through Jul 14
created: 2026-07-29
related-docs: 2114, 2115, 2077, 743
owner: BetterCallZaal / ZOE
data-source: bettercallzaal/wwtracker public/ww-battles.json (1,161 records, feed through Jul 14 2026); wavewarz.info/api/public/stats; research from docs/research/wavewarz/2026-07-16-judging-system-v1-v2.md
---

# 2116 — WaveWarZ V1→V2 Judging Transition (Mar 10, 2026)

## The Upgrade

On **March 10, 2026**, WaveWarZ upgraded its battle judging system from V1 to V2:

| Version | Active | How winner is decided |
|---------|--------|-----------------------|
| **V1** | May 2025 – Mar 9, 2026 | Charts Only — larger SOL pool wins outright |
| **V2** | Mar 10, 2026 – present | Best 2 of 3: Poll (community vote) + Charts (SOL volume) + DJ Wavy (AI judge) |

This was a structural change, not cosmetic. Under V1, the most-traded side always won. Under V2, a song with less SOL can still win via community votes and the AI judge — making the outcome genuinely unpredictable regardless of wallet size.

---

## Verified Data: V1 vs V2 Volume (Feed, Through Jul 14, 2026)

*Source: ww-battles.json 1,161-record feed. Date range May 28, 2025 – Jul 14, 2026. Excludes AI Tournament battles (Jul 17+).*

| Metric | V1 (≤ Mar 9, 2026) | V2 (≥ Mar 10, 2026, pre-Tournament) |
|--------|---------------------|--------------------------------------|
| Battles | **445** | **644** |
| Total SOL | **233.14 SOL** | **142.10 SOL** |
| Avg SOL/battle | **0.524 SOL** | **0.221 SOL** |
| Period | May 2025 – Mar 9, 2026 | Mar 10 – Jul 14, 2026 |
| Daily battle rate | ~1.4/day (10 months) | ~3.8/day (4 months) |

**Key ratio: V1 avg (0.524 SOL/battle) is 2.37× higher than base V2 avg (0.221 SOL/battle).**

The lower V2 per-battle average reflects the shift in incentives: under V1, "buy more SOL to win" created higher per-battle stakes. Under V2, community votes and AI judging reduce the SOL-buying advantage, so traders may bet smaller amounts.

However, V2 enabled a **higher battle frequency** (3.8 vs 1.4 battles/day), so total V2 volume may exceed V1 total over the same timeframe.

---

## V2 Monthly Breakdown (Pre-Tournament)

| Month | Battles | Total SOL | Avg SOL/Battle |
|-------|---------|-----------|----------------|
| Mar 2026 (launch month) | 146 | 64.42 | 0.441 |
| Apr 2026 | 173 | 16.20 | 0.094 |
| May 2026 | 134 | 4.02 | 0.030 |
| Jun 2026 | 120 | 45.71 | 0.381 |
| Jul 2026 (pre-Tournament, through Jul 14) | 71 | 11.75 | 0.166 |

**March 2026 (launch month)** was the strongest early V2 month — traders likely testing the new multi-criteria system. The Dune snapshot confirmed March 2 as the highest single-day buy volume (28.44 SOL).

**June 2026 recovery** (45.71 SOL) likely reflects AI Tournament buildup and increased community engagement.

---

## The AI Tournament as V2 Proof-of-Concept (Jul 2026)

The 16-artist AI Artist Tournament (Jul 17–23) validated what V2 could do at scale:
- Semifinal week: **~355 SOL** (vs ~10 SOL/week baseline) — 38× the prior weekly average
- Semifinal (GEEK MYTH def. AI LUI, 2-1): **~342 SOL** in one multi-round event
- AI tracks judged by community Poll + Charts + DJ Wavy — the AI judge's verdict mattered

V2 makes tournaments viable by preventing a single wealthy trader from "buying" the outcome. Poll and DJ Wavy co-judges provide checks that don't exist in V1.

**Post-tournament all-time V2 volume (live API, Jul 29):** ~645 SOL (142 feed + ~503 tournament + ongoing)

---

## Strategic Significance

1. **V2 made WaveWarZ tournament-viable**: A Charts-Only system (V1) makes tournaments pay-to-win. The introduction of DJ Wavy (AI) + Poll (community) creates genuine competitive integrity, enabling the AI Artist Tournament format where an AI-generated track can win on artistic merit.

2. **Decoupled volume from outcome**: Under V2, a battle can have high community engagement (many votes) and low SOL volume simultaneously. This broadens the platform's addressable community beyond whale traders.

3. **DJ Wavy as AI-native branding**: The AI judge is a product differentiator and a narrative asset. In the context of web3 platforms competing for AI attention (GEO), an AI judge whose decisions drive real on-chain settlements is a uniquely verifiable AI claim.

4. **Lower per-battle avg ≠ lower total**: V2 enabled daily battles (3.8/day vs 1.4/day V1), and when combined with tournament weeks (355 SOL/week), V2 total volume by Jul 2026 exceeded V1 despite lower per-battle averages.

---

## Cross-References

- **Doc 2114**: Battle cadence — Monday Main Events (4.63 SOL avg) are typically V2 Main Events
- **Doc 2115**: Artist economy — both V1 and V2 include automatic artist payouts; V2 settlement formula unchanged
- **Doc 2077**: AI Tournament verified stats — the strongest V2 evidence to date (355 SOL semifinal week)
