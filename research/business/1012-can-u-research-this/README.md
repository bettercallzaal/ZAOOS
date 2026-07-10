---
topic: business
type: market-research
status: research-complete
last-validated: 2026-07-10
superseded-by:
related-docs:
original-query: "https://l2beat.com/stages can u research this."
tier: STANDARD
---

# 1012 - can u research this.

> Drafted by ZOE's research-worker from "https://l2beat.com/stages can u research this.". Auto-committed to main for durability; review + deepen as needed.

I have enough data. Now I'll compile the full research document addressing all flagged hard requirements.

## Findings

```markdown
---
topic: L2Beat Stages Framework - Rollup Maturity Classification
type: infrastructure-research
status: complete
last-validated: 2026-07-10
related-docs: []
original-query: "https://l2beat.com/stages — research the stage framework, how projects are classified, and what it means for the ZAO ecosystem"
---

## Key Decisions / Recommendations

| # | Decision / Recommendation | Rationale | Priority |
|---|--------------------------|-----------|----------|
| 1 | Explicitly document ZAO's trust assumption on Base (Stage 0) and Optimism (Stage 1) as accepted counterparty risk | ZAO's ZOUNZ DAO, ZABAL NFTs, and Respect/Hats contracts (`community.config.ts:115,233`) sit on these chains. Neither has reached Stage 2. Users bridging assets inherit the Security Council upgrade risk. | High |
| 2 | Monitor Base for Stage 1 progression in 2026 and add a note to `community.config.ts` if/when it qualifies | Base is ZAO's primary NFT/DAO chain. A Stage 1 upgrade reduces centralized upgrade risk for ZAO community assets. L2Beat is the authoritative tracker. | Medium |
| 3 | Apply L2Beat stage as a minimum filter when evaluating future chain integrations | Vitalik Buterin publicly supports only Stage 1+ projects starting 2025. Building new ZAO integrations on Stage 0 chains exposes ZAO members to unilateral upgrade risk. | Medium |

---

## Background

The L2Beat Stages Framework is the industry standard for evaluating how decentralized and trust-minimized a rollup has become. Proposed by Vitalik Buterin on Ethereum Magicians (November 2022) and operationalized by the L2BEAT team (published June 2023), the framework was motivated by a straightforward observation: a rollup that can be upgraded by a team multisig in 24 hours is not meaningfully different from a centralized sidechain, regardless of what its marketing says. The stages framework provides a clear, comparable yardstick.

The framework does NOT rate security per se - it rates decentralization as a proxy for security. The L2BEAT team is explicit about the limitation: "Decentralization is a proxy for security, including bug risk, only if the team decides to decentralize when the risk from permissioned operators exceeds bug risk." A Stage 2 rollup with a critical bug in its proof system is arguably less safe than a Stage 1 rollup with an active Security Council ready to intervene.

## Stage Comparison Table

| Criterion | Stage 0 (Full Training Wheels) | Stage 1 (Limited Training Wheels) | Stage 2 (No Training Wheels) |
|-----------|-------------------------------|-----------------------------------|-------------------------------|
| Trust model | Team-controlled; a small group holds upgrade keys and can change anything unilaterally | Security Council multisig controls upgrades; compromising 75%+ of Council is required to block exit | Code-controlled; Security Council can only respond to onchain-detected bugs |
| Exit window | None required for upgrades | 7-day exit window for non-Council upgrades; 5-day challenge period for optimistic rollups | 30-day exit window for any upgrade, except adjudicated onchain bug fixes |
| Security Council rules | Not required (N/A) | 8+ members; 50%+ must be external; 75% threshold for consensus; geographically diverse | Exists but is strictly limited - no discretionary intervention, only responding to onchain errors |
| Proof system | Must be implemented; 5+ external actors must be able to submit fraud proofs | Required and functional (fraud or validity proof in production) | Permissionless - any actor can submit fraud proofs, no whitelist |
| Example chains (2024) | Polygon zkEVM, zkSync Era, Optimism (early); many OP Stack L2s without proof systems | Arbitrum One, Optimism (post-Security Council upgrade), zkSync Lite | None achieved as of 2025 (the target endpoint) |

## Framework Evolution (2025 Updates)

The 2025 framework update tightened Stage 0 requirements significantly. Projects must now have a functioning proof system even to qualify as Stage 0 - OP Stack chains without proof systems and Orbit chains with insufficient proposer whitelists were moved out of the Stage 0 category entirely (reclassified as "Not a Rollup" on L2BEAT). The June 2025 revision also updated Security Council assessment methodology and introduced Alt-DA (Alternative Data Availability) framework considerations.

## ZAO Ecosystem Relevance

ZAO's two primary on-chain environments are Optimism and Base (see `community.config.ts:115` for `chain: 'optimism'` Respect/Hats contracts, and `community.config.ts:233` for `chain: 'base'` ZOUNZ DAO and ZABAL NFT contracts).

- **Optimism**: Achieved Stage 1 in 2024 with a proper Security Council configuration. ZAO's Respect tokens and Hats Protocol deployment on Optimism sit under the Security Council trust model - upgrades require 75% Council consensus, and non-Council upgrades have a 7-day exit window.
- **Base**: Built on OP Stack and operated by Coinbase. As of 2024 it was Stage 0 (no standalone proof system). If Base has not yet adopted a proof system post-2025 framework change, it may sit in the "Not a Rollup" reclassification zone on L2BEAT. This is the higher-risk chain for ZAO given ZOUNZ DAO and ZABAL NFTs are there.

Practically, this does not require immediate action - these chains are industry-standard and ZAO is not alone in using them. But it means ZAO should treat any chain migration or new L2 integration as a moment to check L2BEAT stage before committing contracts.

---

## Next Actions

| Action | Owner | Timeline |
|--------|-------|----------|
| Check current Base stage at `l2beat.com/scaling/projects/base` and update this doc | ZOE / Zaal | By next infrastructure review |
| Add a comment to `community.config.ts` near the `chain: 'base'` line noting the L2BEAT stage and last-verified date | Engineering (ZOE can do this autonomously) | Next code pass |
| Add L2BEAT stage check to ZAO's chain evaluation checklist for any future L2 integration | Zaal | Before next chain integration decision |

---

## Sources

- [FULL] The Stages Framework - L2Beat Methodology Forum - https://forum.l2beat.com/t/the-stages-framework/291
- [FULL] Introducing Stages - a framework to evaluate rollups maturity - L2BEAT on Medium - https://medium.com/l2beat/introducing-stages-a-framework-to-evaluate-rollups-maturity-d290bb22befe
- [FULL] A Primer on Rollup Stages - BanklessDAO (Black Flag DAO, Layer 2 Review) - https://banklessdao.substack.com/p/a-primer-on-rollup-stages-layer-2
- [PARTIAL - no live stage data for individual chains returned] Stages - L2BEAT live page - https://l2beat.com/stages
- [PARTIAL - 2025 framework tightening described but no full current chain list] L2BEAT announces framework changes: L2s will face tougher rules in 2025 - Cryptopolitan - https://www.cryptopolitan.com/ko/l2beat-framework-l2s-tougher-rules-2025/
```

---

## Recommended Action (for parent ZOE)

Save this doc to `research/infrastructure/1012-l2beat-stages-framework/README.md`. The core finding for ZAO: both primary chains (Optimism and Base) are below Stage 2, meaning ZAO user assets carry Security Council trust assumptions. This is industry-normal but worth documenting explicitly. No urgent code change is required; a comment in `community.config.ts` near the chain declarations is the lowest-effort follow-through.
