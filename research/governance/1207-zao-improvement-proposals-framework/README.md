---
topic: governance
type: guide
status: research-complete
last-validated: 2026-07-17
related-docs: 718c, 718g, 188, 941, 942, 1201, 1202, 1206
original-query: "ZIPs documentation — ZAO Improvement Proposals framework and retroactive registry"
tier: DEEP
---

# 1207 - ZAO Improvement Proposals (ZIPs): Framework and Registry

> **Purpose:** Establish the ZIP (ZAO Improvement Proposal) format, define the governance process for adopting ZIPs through ZAO's OREC, and document a retroactive registry of known governance decisions that constitute ZAO's governance history. ZIPs make ZAO's governance legible to external researchers, builders, and potential partners. This is a North Star deliverable.

---

## What Is a ZIP?

A **ZAO Improvement Proposal (ZIP)** is a formal specification for a change to ZAO's governance protocol, infrastructure, community standards, or operational procedures. ZIPs follow the tradition of improvement proposal systems used by Bitcoin (BIPs), Ethereum (EIPs), and Filecoin (FIPs) — a numbered, structured, community-reviewed approach to governance evolution.

ZIPs are NOT:
- Day-to-day operational decisions by ZAO contributors
- WaveWarZ product decisions (those are Hurricane/Ike's domain)
- Individual project choices by ZAO members

ZIPs ARE:
- Changes to the Fractal Game mechanics (scoring, cadence, criteria)
- Deployments or upgrades to on-chain contracts (OREC, OG, ZOR)
- Changes to Respect token policy (decay/burn proposals, distribution rules)
- New on-chain infrastructure (new contracts, new ledgers, new chains)
- Foundational community standards (voting criteria, membership rules)

---

## ZIP Process

ZAO uses the OREC (Optimistic Respect-based Executive Contract) as the binding on-chain execution layer. The ZIP lifecycle:

```
Idea → Draft ZIP → Community Discussion (Discord) → Formal Proposal (via /propose bot command)
    → OREC Vote (48h voting + 48h veto window) → Execution (if passed) → On-Chain Settlement
```

### Step 1: Draft
Anyone in ZAO can author a ZIP draft. Format: see ZIP Template below. Share in `#governance` channel for feedback.

### Step 2: Proposal
Use `/propose [title] [description] [type]` in the ZAO Discord bot. Type = `governance` for ZIPs. The bot creates a voting thread and a proposal record in Supabase.

### Step 3: OREC Vote
For major changes (on-chain contract upgrades, token policy), the proposal escalates to an OREC vote on Optimism. The OREC passes when:
- YES weight ≥ minimum threshold
- YES weight > 2× NO weight

This is the "optimistic" model: a motivated minority can veto; a passive majority cannot block. See Doc 718c for full OREC mechanics.

### Step 4: Execution
Passed OREC proposals are executed on-chain. If the ZIP mints Respect, changes bot configuration, or deploys contracts, those changes go live post-execution.

### Step 5: Documentation
After adoption, the ZIP is marked `[ADOPTED]` in the registry below and assigned a permanent number.

---

## ZIP Template

```markdown
## ZIP-NNN: [Short Title]

**Status:** [DRAFT | PROPOSED | ADOPTED | REJECTED | SUPERSEDED]
**Author:** @handle
**Type:** [Governance | Infrastructure | Token Policy | Community Standards | Process]
**Created:** YYYY-MM-DD
**On-chain ref:** [OREC tx hash if on-chain] | [Discord proposal ID if Discord-only]

### Motivation
Why is this change needed? What problem does it solve?

### Specification
What exactly changes? Be precise: contract addresses, parameter values, timing.

### Rationale
Why this approach vs. alternatives?

### Backwards Compatibility
What is the impact on existing Respect holders, sessions, or infrastructure?

### Implementation
How will this be executed? On-chain or Discord-only?
```

---

## Retroactive ZIP Registry

ZAO has been running governance for 100+ weeks without a formal ZIP numbering system. This retroactive registry documents the governance decisions that shaped ZAO's current protocol. Numbers are assigned in approximate chronological order.

Status codes:
- ✅ `ADOPTED` — decision was made, implemented, and is active
- 🔵 `PROPOSED` — formally proposed, not yet voted/adopted
- 📜 `FOUNDATIONAL` — pre-ZIP (established at founding, predates formal proposal process)

---

### ZIP-001: ZAO Fractal Launch and Founding Parameters

| Field | Value |
|-------|-------|
| **Status** | ✅ ADOPTED (📜 FOUNDATIONAL) |
| **Type** | Governance |
| **Date** | 2024-07-30 (start of Fractal 1) |
| **On-chain ref** | None (pre-OREC; OG era) |

**Specification:** ZAO Fractal launches as a weekly governance ceremony for ZAO's music community. Parameters:
- Cadence: Mondays 6pm EST
- Group size: 6 members per group
- Scoring: Standard Fibonacci — 55/34/21/13/8/5 Respect points
- Voting criteria: ZAO Vision (music/art/tech), Contribution, Collaboration, Innovation, Onboarding
- Ledger: Airtable (OG era) with ERC-20 Respect token (`0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957`) on Optimism

**Source:** Doc 718g (Fact 1), Doc 696, Doc 188

---

### ZIP-002: Year 2 Fibonacci Escalation (2x Scoring)

| Field | Value |
|-------|-------|
| **Status** | ✅ ADOPTED |
| **Type** | Governance |
| **Date** | ~2025-08 (start of Year 2) |
| **On-chain ref** | None (scoring rule change, bot-level) |

**Motivation:** ZAO's Year 2 cohort is more stable and experienced than Year 1. Standard Fibonacci (55/34/21/13/8/5) produces lower differentiation for a mature, high-trust community.

**Specification:** Fibonacci multiplier changed from 1× to 2×:
- Rank 1: 55 → 110 Respect
- Rank 2: 34 → 68 Respect
- Rank 3: 21 → 42 Respect
- Rank 4: 13 → 26 Respect
- Rank 5: 8 → 16 Respect
- Rank 6: 5 → 10 Respect
- Total per session: 136 → 272 Respect distributed

**Rationale:** More aggressive differentiation rewards the top contributors more strongly as the community matures and contribution variance increases. Consistent with the Fibonacci principle (each level ~60% above the previous).

**Source:** Doc 718g (Fact 3: "Rationale: ZAO's longer runway (100+ weeks) and stable cohort"), Doc 188 line 116, Doc 696 line 116

---

### ZIP-003: ZOR ERC-1155 Deployment and OREC Activation

| Field | Value |
|-------|-------|
| **Status** | ✅ ADOPTED |
| **Type** | Infrastructure |
| **Date** | 2025-09-11 (Fractal 74) |
| **On-chain ref** | ZOR contract: `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c`, OREC: `0xcB05F9254765CA521F7698e61E0A6CA6456Be532` — Optimism Mainnet |

**Motivation:** After 73 weeks of off-chain Airtable tracking, ZAO needed a verifiable, permissionless, immutable governance ledger. Manual Airtable management did not scale and created a trust dependency on the admin.

**Specification:**
- Deploy ZOR ERC-1155 Respect token (`0x9885CC...`) on Optimism
- Deploy OREC executor (`0xcB05F9...`) on Optimism
- Fractal 74+ mints Respect via OREC, permanently on-chain
- OG ERC-20 (`0x34cE89...`) frozen as historical record; 122 holders, 38,484 supply
- ORDAO vote weight uses OG Respect at proposal block (historical power) + ZOR for new distribution
- Executor keys held by zaal.eth + civilmonkey.eth (intentional operating-core concentration during growth phase)

**Rationale:** Two-ledger model preserves historical truth (OG, frozen) while enabling democratic future (ZOR, only OREC can mint). No manual admin overrides on ZOR minting — removes human bottleneck. Moves ZAO's governance record from trust-based (Airtable) to code-based (on-chain).

**Source:** Doc 718c (full OREC mechanics + contract addresses), Doc 718g (Fact 2: Two-era Respect ledgers), Doc 115 (ZAO Respect data reconciliation plan), Doc 696 lines 103-116

---

### ZIP-004: Respect Burn/Decay Proposal (Pending)

| Field | Value |
|-------|-------|
| **Status** | 🔵 PROPOSED (Doc 941, 2026-05-27) |
| **Type** | Token Policy |
| **Date** | 2026-05-27 (proposed, not yet voted) |
| **On-chain ref** | None yet |

**Motivation:** ZAO's current Respect model is a raw lifetime sum (no decay). Long-tenured members accumulate governance weight indefinitely, creating an insider-entrenchment risk over time. A decay mechanism would make Respect a *flow* (measuring current relevance) rather than a *stock* (measuring historical contribution).

**Specification (from Doc 941):** Six-vote ballot covering:
1. Banked/active Respect split (a portion of accumulated Respect becomes "banked" — protected from decay; the rest is "active" and subject to decay)
2. 180-day half-life for active Respect
3. Multi-signal participation model (attend + vote = full weight)
4. Earned grace (long-tenured members get decay protection for a transition period)
5. Year 3 legacy migration (bridging OG Respect to the new model)
6. Bounty routing from decay pool back to active contributors

**Rationale:** Aligns ZAO's governance with monetary-policy research (Doc 935): Respect as a *flow* of current relevance, not a permanent stock. Gitcoin 90-day expiry, Coordinape epoch reset, Colony 50%/90-day decay are precedents.

**Status note:** This is a proposed design that has NOT been voted on as of July 2026. It is Whitepaper Roadmap material (Doc 942, Ch 10) — the *intended future*, not current architecture. See Whitepaper honesty tensions (Doc 718 README) for why this distinction matters.

**Source:** Doc 941 (full proposal), Doc 942 (whitepaper outline v2), Doc 935 (monetary policy for merit), Doc 718b (Respect mechanism design)

---

### ZIP-005: ZAO OS Fractal Integration (In Progress)

| Field | Value |
|-------|-------|
| **Status** | 🔵 PROPOSED / In Development |
| **Type** | Infrastructure |
| **Date** | ~2026 (ongoing) |
| **On-chain ref** | ZAO OS Farcaster client, /fractals page |

**Motivation:** ZAO Fractal currently runs in Discord with a separate bot (fractalbotmarch2026). Moving governance data into ZAO OS (the Farcaster social client) makes governance a first-class community activity rather than a separate Discord process.

**Specification:** ZAO OS `/fractals` page integrates:
- Leaderboard with OG + ZOR Respect balances
- Session history
- OREC proposal status
- Inline participation (play Fractal from within the social client)

**Source:** Doc 114 (ZAO Fractal live infrastructure), Doc 718g (Fact 6: Embedded in Social Infrastructure), Doc 1068 (fractal frontend build spec), Doc 1072 (fractal own frontend tech path)

---

## Open Governance Questions (Pre-ZIP Stage)

These decisions have been discussed but not yet formalized as ZIPs:

| Topic | Doc | Status |
|-------|-----|--------|
| Whitepaper audience, form (whitepaper vs. + constitution), voice | Doc 718, 942 | Blocked on Zaal decision |
| Decay/burn adoption path (ZIP-004 ballot timing) | Doc 941, 942 | Proposed, not scheduled |
| OREC decentralization (all-members submit on-chain, not just zaal.eth + civilmonkey.eth) | Doc 718 README (honest tension) | Stated goal, no ZIP yet |
| All-members ledger reconciliation (full OG + ZOR merge) | Doc 115 | Infrastructure roadmap |
| ZIP numbering / formal ZIP process adoption | This doc (1207) | Proposed here |

---

## ZIPs and the North Star

ZIPs serve the North Star directly: **"The ZAO = THE case study of a successful DAO."**

A DAO without a governance proposal record is not a case study — it is a claim. ZIPs make ZAO's governance *legible*: enumerable, numbered, citable, dated, and independently verifiable (for on-chain ZIPs).

When researchers, builders, or partners ask "how does ZAO make governance decisions?", the answer is: "OREC + ZIPs. See the registry."

---

## Also See

- [Doc 718c](../718-zao-fractal-whitepaper-foundations/718c-ordao-onchain-architecture.md) — OREC mechanics (the binding layer for ZIPs)
- [Doc 718b](../718-zao-fractal-whitepaper-foundations/718b-respect-game-mechanism-design.md) — Respect Game mechanism (what ZIPs govern)
- [Doc 941](../941-respect-burn-decay-proposal/) — ZIP-004 full proposal
- [Doc 942](../942-zao-fractal-whitepaper-outline-v2/) — whitepaper roadmap (ZIPs as Ch 10 material)
- [Doc 115](../../identity/115-zao-respect-data-reconciliation/) — OG/ZOR ledger reconciliation plan
- [Doc 1206](../1206-zao-comparative-dao-state-july2026/) — ZAO vs. the field (why ZIPs matter for the case study)
- [Doc 188](../188-zao-fractal-bot-process/) — Bot command reference (Discord /propose system)

## Sources

- **Doc 718c** — ORDAO/OREC architecture (contract addresses, OREC mechanism) `[FULL]`
- **Doc 718g** — ZAO fractal distinctness (scoring escalation facts, founding timeline) `[FULL]`
- **Doc 718b** — Respect Game mechanism design (Fibonacci, decay theory) `[FULL]`
- **Doc 188** — ZAO Fractal Bot process (Discord proposal commands, Fibonacci config) `[FULL]`
- **Doc 941** — Burn/decay proposal (ZIP-004 source) `[FULL]`
- **Doc 942** — Whitepaper outline v2 (roadmap context for ZIP-004/005) `[FULL]`
- **Doc 935** — Monetary policy for merit (theoretical basis for decay) `[FULL]`
- **Doc 696** — Fractal lineage summary (founding and transition history) `[FULL]`
- **Doc 115** — ZAO Respect data reconciliation (OG/ZOR ledger plan) `[FULL]`
- **Doc 1206** — Comparative DAO state July 2026 (ZIPs and case study context) `[FULL]`
