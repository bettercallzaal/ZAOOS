---
topic: business
type: guide
status: research-complete
last-validated: 2026-07-06
superseded-by:
related-docs: 974, 975, 977, 443, 050, 836
original-query: "ZAO Numbers - set up framing - a single honest way to present ZAO's ecosystem numbers so decks, the site, and casts stop citing conflicting figures"
tier: STANDARD
---

# 978 - ZAO Numbers: the framing guide

> **Goal:** ZAO's own docs cite conflicting figures for the same thing (188 vs 156 members; 795 vs ~1,125 battles; 435 vs ~491 SOL). This guide sets ONE honest framing - which number to use, for which audience, with which caveat - so every surface tells the same true story. It is a presentation standard, not new research; every number traces to a cited doc.

## The core principle

**Never round up, never conflate, always caveat the self-reported ones.** ZAO's real edge is longevity and receipts - "we are still here after 100 weeks" is a stronger claim than any inflated headline. Overstating a number to look bigger trades the one asset (credibility) that the whole positioning rests on. When two sources disagree, cite the MEASURED one and drop the modeled one.

## The canonical number set (use these)

### Community size - two different numbers, both true, do not conflate

| Number | What it actually is | Use for | Source |
|--------|--------------------|---------| -------|
| **188 members** | The gated Farcaster allowlist on Base (community size) | "how big is the community" | CLAUDE.md |
| **156 holders** | Unique on-chain Respect holders (governance participants) | "how many hold governance weight" | Doc 975 (on-chain) |

These are not the same population and must never be merged into one "~200" figure (the old inflated number that conflated Discord reach with holders). If a deck needs one line: "188-member community; 156 hold on-chain governance Respect."

### Governance - the receipts

| Claim | Number | Caveat | Source |
|-------|--------|--------|--------|
| Unbroken weekly Fractals | **~101 weeks** ("100+") | Corrects the old "90+"; use 100+ | Doc 975 / 977 |
| OG Respect supply | 38,484 (frozen) | measured | Doc 975 |
| Distribution Gini | **0.73** (OG-only, concentrated) | Do NOT claim "egalitarian / 0.23" - that was modeled and wrong (Doc 977) | Doc 975 |
| OREC proposal concentration | 94% from one relayer | State it - it is the honest limitation | Doc 975 |

The distribution number is the discipline test: the honest 0.73 (concentrated) beats the flattering-but-false 0.23. Own the concentration; it is what makes the rest credible.

### Build-in-public - strong, clean numbers

| Claim | Number | Source |
|-------|--------|--------|
| Daily newsletter editions | **400+** (across Year of the ZAO / ZABAL / ZTalent) | Doc 050 |
| Paid newsletter supporters | 78 | Doc 050 |
| ZAOOS codebase | 302 API routes, 295 components | CLAUDE.md / Doc 836 |

### Festivals - dated receipts

| Event | Where | When | Artists | Source |
|-------|-------|------|---------|--------|
| ZAO-PALOOZA | NFT NYC | Apr 2024 | 12 (6 new to web3) | Doc 050 |
| ZAO-CHELLA | Art Basel, Miami | Dec 2024 | 10, AR art, WaveWarZ LIVE | Doc 050 |
| ETH Denver | Denver | - | (referenced, confirm count) | Doc 443 |

### WaveWarZ - the one to caveat hardest

The numbers here are **self-reported and disagree across surfaces.** Doc 974 is the reconciled source. Present as directional, never precise:

- Volume: **~$33K (~491 SOL)** reconciled (Doc 974) - NOT "$37K / 435 SOL" (older deck figure). Pick one, cite Doc 974, flag "directional, pending a live on-chain pull."
- Battles: **~1,125** reconciled - NOT "795" (older figure).
- The load-bearing honest point from Doc 974: platform revenue has exceeded artist payouts. Do not bury it.

Until a live on-chain pull reconciles WaveWarZ (Doc 974 next action), every WaveWarZ number carries "self-reported / directional."

## The "which number when" cheat sheet

- **Sponsor deck** -> lead with dated festival receipts + 100+ weeks + 400+ newsletter editions. Concrete, verifiable, no crypto jargon.
- **Governance / DAO audience** -> 156 holders, ~101 weeks, Gini 0.73 stated honestly, 94% proposer concentration named as the limitation.
- **Farcaster / community cast** -> 188-member community, build-in-public, 400+ editions.
- **Never in any context** -> "~200 members", "Gini 0.23 / egalitarian", precise WaveWarZ dollar figures without the "directional" flag.

## Also See

- [Doc 975](../../governance/975-zao-respect-live-numbers/) - the measured Respect numbers behind the governance row.
- [Doc 977](../../governance/977-fix-fractals-documentation/) - the correction catalogue (why 0.23 and 48h are banned).
- [Doc 974](../../wavewarz/974-wavewarz-financials-snapshot-2026-07/) - the reconciled WaveWarZ figures + the directional caveat.
- Sibling tasks: "ZAO Numbers - people in spaces" (attendance metrics) and "ZAO Numbers - website analytics" (needs a live analytics account - not yet groundable).

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Adopt this canonical set in the next sponsor deck + thezao.xyz copy; purge "~200 / Gini 0.23 / precise WaveWarZ $" | @Zaal | Edit | 2026-07-20 |
| Confirm the ETH Denver artist count so the festivals row is complete | @Zaal | Research | 2026-07-20 |
| After Doc 974's live WaveWarZ pull, update the WaveWarZ figures here and drop "directional" | @Zaal | Edit | 2026-07-27 |

## Sources

- [FULL] CLAUDE.md (188 members, repo census), Doc 975 (on-chain Respect), Doc 977 (corrections), Doc 974 (WaveWarZ reconciled), Doc 050 (newsletter, festivals, 78 supporters), Doc 443 (sponsor-pitch figures, incl. the OLD 795/435 numbers this guide supersedes). All read 2026-07-06 from the ZAOOS working tree.
- [PARTIAL] ETH Denver artist count - referenced in Doc 443 but not stated; flagged as an open confirm above.
