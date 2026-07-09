---
topic: governance
type: decision
status: research-complete
last-validated: 2026-07-04
related-docs: 935, 936, 941, 718b
original-query: "deep dive Vitalik's mechanisms, map against the ZAO model, find alignments to add to the papers"
tier: DEEP
---

# 967 - Vitalik x The ZAO: Mechanism Alignment Map

> **Goal:** Map Vitalik Buterin's actual governance/economic mechanisms against The ZAO's real model, and surface concrete, paper-ready additions that strengthen the papers. Feeds edits to the whitepaper suite (grounded, Zaal-reviewed).

## What The ZAO already embodies (Vitalik-aligned today)

| Vitalik mechanism | ZAO equivalent | Where |
|---|---|---|
| Soulbound tokens (DeSoc) | Respect (OG + ZOR), non-transferable, earned, immutable | Technical WP |
| Anti-coin-voting | "contribution over capital" creed, Respect not for sale | Manifesto + Technical |
| Human-only governance | only humans earn Respect; agents are tools | Technical WP |
| Optimistic execution | OREC (48h vote + 48h veto, YES > 2*NO) | Technical WP 3.1 |
| Consensus-driven, sybil-resistant | 2/3 group consensus, random groups, weekly recurrence | Technical WP 2.3 |
| Equal distribution | Gini ~0.23 vs token DAOs 0.97+ | doc 718b |

The ZAO is already a live cultural implementation of Vitalik's DeSoc + anti-plutocracy thesis, for musicians.

## Five alignments to add (ranked by leverage)

### 1. Retroactive Respect Recognition (RetroPGF pattern)
Annual community vote on which shipped projects/performances/organizers drove the most impact in the past 12 months, allocated by quadratic voting. Fixes the "quiet infrastructure work never fits a 3-minute share" gap (doc 718b) and gives async builders and late joiners a way in. Precedent: Optimism RetroPGF distributed $100M+. Paper home: Manifesto (new "celebration" commitment) + Technical WP (retrospective Respect). Risk: same winners every year -> mitigate with a 2-year repeat cooldown.

### 2. Quadratic Funding for the ZAO Fund
Allocate the Fund's discretionary capital via quadratic funding so many small backers outweigh one whale. Network capital allocated by network taste, not only the founder's. Precedent: Gitcoin Grants, $20M+ via QF. Paper home: Whitepaper section 5. Risk: collusion/sybil -> mitigate with Respect-gated contributions + per-member caps + MACI.

### 3. Plurality contribution paths (DeSoc)
Earn Respect from verified contribution across systems - merged code, organized events (Luma/Cal.com), published research (ArDrive), peer attestations (EAS) - not only the weekly Fractal call. Lets distributed builders earn without breaking the synchronous culture (weekly Fractal stays primary). Paper home: Manifesto section 1 + Technical WP 2.5.

### 4. Conviction voting
Vote weight scales with how long a member locks Active Respect (1mo = 1x, 3mo = 2x, 6mo+ = 4x). Long-term builders outweigh passive whales. Precedent: conviction voting (SourceCred, Commons Stack), Vitalik's long-term-alignment writing. Paper home: Technical WP section 3.

### 5. MACI private ranking (anti-collusion)
Weekly ranks submitted encrypted with a ZK proof that 2/3 consensus was reached, without revealing individual vote patterns - kills visible collusion and social pressure while keeping the public final result. Precedent: MACI (Vitalik + PSE). Paper home: Technical WP 2.4.

## Requires Zaal's confirmation before final

- Decay adoption + timeline (doc 941 Banked/Active, 180-day half-life).
- Whether QF + conviction voting fit the culture - both are less synchronous than the weekly in-person Fractal, which is the heart of the model. Additions must not dilute that.

## Next Actions

| Action | Owner | By When | Shipped = |
|--------|-------|---------|-----------|
| Draft each addition into the right paper as a PR proposal | Claude Code | rolling | PR open on ws/zao-whitepaper per addition |
| Decide decay timeline + QF/conviction culture fit | Zaal | before v1.0 | recorded here |
| Add a "Frontier Alignments" appendix to the Technical WP | Claude Code | this week | PR merged |

## Sources

- [Liberal Radicalism / Quadratic Funding (Buterin, Hitzig, Weyl 2019)](https://papers.ssrn.org/sol3/papers.cfm?abstract_id=3243656)
- [Decentralized Society / SBTs (Weyl, Ohlhaver, Buterin 2022)](https://papers.ssrn.org/sol3/papers.cfm?abstract_id=4105763)
- [Soulbound (Vitalik 2022)](https://vitalik.eth.limo/general/2022/01/26/soulbound.html)
- [Moving beyond coin voting governance (2021)](https://vitalik.eth.limo/general/2021/08/16/voting.html)
- [d/acc retrospective (2025)](https://vitalik.eth.limo/general/2025/01/05/dacc2.html)
- [Plurality (2024)](https://vitalik.eth.limo/general/2024/08/21/plurality.html)
- Optimism RetroPGF (Round 3, $100M+). Gitcoin QF ($20M+). MACI (PSE). EAS attestations.
- ZAO papers (ws/zao-whitepaper), governance docs 935/936/941/718b.
