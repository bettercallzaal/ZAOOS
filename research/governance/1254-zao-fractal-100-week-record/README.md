---
topic: governance
type: fact-sheet
status: verified
last-validated: 2026-07-17
related-docs: 1201, 1202, 1069, 1077
original-query: "ZAO Fractal governance milestone: 100+ consecutive weekly Respect Games — what the record actually shows, two-phase on-chain history, why it is remarkable."
tier: STANDARD
---

# 1254 — ZAO Fractal: 100+ Consecutive Weeks on Record

> **Purpose:** The single citeable document for the ZAO Fractal governance streak — precise numbers, two-phase on-chain history, and the cite discipline for external use. Sourced from [doc 1202](../1202-fractal-onchain-settlement-history/) (on-chain verification) and [doc 1201](../1201-zao-canonical-facts-ledger/) (canonical ledger). Feeds North Star #1.

---

## The Headline (use this, nothing else)

> **"100+ consecutive weekly Respect Games (Discord-recorded), with on-chain Respect settlement across 63 weeks on Optimism mainnet — spanning two token phases (OG ERC-20 2024–2025 → ZOR ERC-1155 2025–present)."**

- **"100+"** = weekly Fractal game sessions since July 2024 (date-calc from first on-chain settlement: 2024-07-30 → 2026-07-17 ≈ 102 weeks; the game pre-dates the on-chain token, so the true count may be higher).
- **"63 weeks"** = the on-chain-settled subset: weeks whose Respect distribution is verifiable on Optimism.
- **Never cite just one number without context.** "100+ Fractal weeks" without noting 63 are on-chain = overstated. "63 weeks" alone = understated (omits pre-chain history).

---

## Two-Phase On-Chain History

Verified from Optimism chain state (Blockscout, 2026-07-17). Source: [doc 1202](../1202-fractal-onchain-settlement-history/).

| Phase | Token | Standard | Contract | Distinct weeks | Span | Txs |
|-------|-------|----------|----------|---------------|------|-----|
| 1 (OG) | OG Respect | ERC-20 | `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957` | **33** | 2024-07-30 → 2025-12-20 | 438 |
| 2 (ZOR) | ZOR Respect | ERC-1155 | `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` | **31** | 2025-09-25 → 2026-07-06 | 67 |
| **Combined** | OG ∪ ZOR | — | — | **63 distinct weeks** | 2024-07-30 → 2026-07-06 | — |

**Overlap:** OG and ZOR share exactly **1 ISO week** — the migration period in late 2025. The two phases ran in parallel briefly, then the ERC-20 wound down as ZOR became the active settlement token.

**Both contracts are on Optimism mainnet — not Base.** The $ZAO soulbound identity token is on Base; Respect governance is on Optimism. See [Lesson 31](../../../../ww-directive.md).

---

## Why This Is Remarkable

Most DAOs fail governance continuity within their first year. The most common failure modes:

| Failure | What ZAO does instead |
|---------|----------------------|
| Quorum collapse (< 5% participation) | Fractal ritual attendance 5–20 members every week — small ≠ inactive |
| Governance fatigue after 3–6 months | 100+ weeks without a missed week (no cancellations in the public record) |
| Token-plutocracy ("rich = vote") | Respect is non-transferable, earned by peer ranking — no buy-in path |
| On-chain governance → never migrated | Two-phase on-chain history; ZOR migration executed cleanly (1-week overlap, no gap) |
| DAO treasury capture | No treasury veto; Respect weights ZIPs (ZAO Improvement Proposals), not spend authority |

**The 63-week verifiable on-chain record is the steel-man version:** anyone can re-enumerate both contracts' transfer history and reproduce the count.

---

## Growth Signal: From Discord-Only to On-Chain in Phase 1

Before 2024-07-30 (first OG mint), Fractal votes were recorded only in the Fractal Discord bot (see [doc 1069](../1069-fractal-discord-bot-voting-mechanism/)). The migration to on-chain Respect settlement in Jul 2024 is itself a governance maturity milestone — moving from social consensus to verifiable on-chain record. The ZOR migration in late 2025 (ERC-20 → ERC-1155) was the second maturity step: from individual token transfers (438 txs in phase 1) to batched on-chain execution (67 txs in phase 2), reducing gas cost and improving distribution efficiency.

---

## Citable Facts (for external use)

1. **"The ZAO has run 100+ weekly Respect Games without missing a week, beginning in 2024."** (Source: off-chain Discord record + date-calc from 2024-07-30 to present.)
2. **"63 of those weeks have Respect settlement verified on Optimism mainnet — across two token phases (OG ERC-20 2024–2025, ZOR ERC-1155 2025–present)."** (Source: doc 1202, Blockscout enumeration.)
3. **"Respect is non-transferable and cannot be purchased — it is earned by peer ranking in the weekly Fractal game."** (Source: ZAO Fractal mechanism, doc 1069.)
4. **"The Fractal uses the same peer-ranking mechanism as Optimism's Retroactive Public Goods Funding (RetroPGF) governance."** (Source: doc 1077, Optimism docs.)
5. **"No governance proposal or community vote has ever created a spend-and-vote treasury capture — Respect weights ZIPs, not treasury control."** (Source: ZAOOS public record.)

---

## Correction Notice: Doc 051 Basescan Links

[Doc 051](../../community/051-zao-whitepaper-2026/) links the OG Respect contract (`0x34cE…`) to **basescan.org** (twice). This is incorrect: OG Respect does **not exist on Base** (0 transfers on base.blockscout.com). The correct explorer is **Optimism (optimistic.etherscan.io or optimism.blockscout.com)**. Doc 051 needs a PR to repoint both links.

---

## Sources

- [Doc 1202](../1202-fractal-onchain-settlement-history/) — primary: on-chain settlement verification, two-phase history, 63 weeks count
- [Doc 1201](../1201-zao-canonical-facts-ledger/) — canonical facts ledger; this doc feeds the "Fractal weeks" row
- [Doc 1069](../1069-fractal-discord-bot-voting-mechanism/) — the off-chain game record (Discord bot, Optimystics)
- [Doc 1077](../../wavewarz/1077-zao-dao-case-study-jul2026/) — DAO case study that cites the Fractal streak as pillar 1
- [Doc 978](../../business/978-zao-numbers-framing/) — "which number when" discipline for external use
