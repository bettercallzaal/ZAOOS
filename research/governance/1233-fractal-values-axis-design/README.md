---
topic: governance
type: design-spec
status: draft
last-validated: 2026-07-17
related-docs: 696 (fractal lineage), 1207 (ZIP framework), 1232 (growing-fractals playbook), 941 (burn/decay ZIP-004), 942 (whitepaper v2), 703 (ZAO fractal current state), 1202 (on-chain settlements), 718 (whitepaper foundations)
original-query: "Fractal values-axis stream (folded from zaofractal): the values-axis proof-of-values design = likely ZIP-2 (token vs weighted Respect dimension) + newcomer bootstrap. zoe picks up. (board task e98492aa)"
tier: STANDARD
---

# 1233 — Fractal Values-Axis: Proof-of-Values Design + ZIP-006 Draft

> **Purpose:** Design the ZAO Fractal's "values axis" — a second dimension for peer recognition beyond contribution ranking that explicitly captures values alignment with ZAO's mission. Compares two implementation paths (Token vs Weighted Respect Dimension), specifies the newcomer bootstrap mechanism, and drafts the ZIP-006 proposal for community adoption.

---

## One-Line Summary

> The ZAO Fractal currently ranks contributions on one axis (who did the most?). A values axis adds a second dimension (who best lives ZAO's values of music/art/technology, onchain ownership, and community?), producing a richer signal for governance weight and a clearer onboarding path for newcomers.

---

## The Problem

ZAO's Respect Game rankings today answer one question: **who contributed most?**

The five voting criteria (doc 1207):
1. Advancing the ZAO vision of music/art/technology
2. Contribution
3. Collaboration
4. Innovation
5. Onboarding new members

These are contribution-centric. The implicit assumption is that high contributors are also high values-alignment. That is mostly true — but it creates a blind spot:

- A prolific contributor who repeatedly acts against community norms (e.g., hostile communication, extractive behavior) accrues Respect without a countervailing signal.
- A newer member who embodies ZAO values deeply but hasn't yet produced major contributions has no way to surface that alignment.
- There is no explicit proof-of-values — nothing that lets a partner, GEO index, or new member say "these people demonstrably hold these values."

The values axis fills this gap: a secondary Respect-like signal that answers **who walks the talk?**

---

## Design Option A: Soulbound Values Token (Separate Track)

### What it is

A new soulbound ERC-1155 token on Optimism — call it **ZAV** (ZAO Values, pronounce "ZAV") — minted separately from ZOR. Members can earn ZAV once per governance period (e.g., quarterly), awarded by peers for demonstrated values alignment.

### How minting works

1. Any member who has ≥ 1 ZOR Respect can nominate another member for a ZAV grant.
2. Nomination includes a brief written rationale (1-3 sentences: which value, what evidence).
3. The proposal goes through the existing OREC optimistic voting window (48h vote + 48h veto).
4. If the OREC proposal passes, OREC mints ZAV to the nominee's wallet.
5. ZAV is soulbound (non-transferable), like ZOR.

### Governance weight

ZAV and ZOR are complementary, not additive. ZAV alone does not give governance weight for Respect Game scoring (which stays ZOR-based). Instead:

- ZAV holders get a **veto-weight boost** in OREC proposals: 1 ZAV = 2× OREC veto weight (so values-aligned members can more easily block proposals that conflict with ZAO values).
- ZAV is a **public attestation** — it appears on `zao.frapps.xyz` member profiles and in the ZAO OS member directory.
- For ZAO membership NFT gating purposes, ZAV ≥ 3 can substitute for ZOR minimum (newcomer bootstrap, see below).

### Advantages
- Clean separation of concerns: contribution (ZOR) ≠ values (ZAV)
- New token = citable, indexable, GEO-discoverable artifact
- Explicit peer-attestation trail (nominator + rationale on-chain)
- ZAV accumulation is slow (quarterly cadence) = hard to game

### Disadvantages
- New contract deployment (cost + Optimystics coordination)
- Governance overhead: each ZAV mint is an OREC proposal (friction for high-volume nominations)
- Two-token mental model adds complexity for new members

---

## Design Option B: Values Weighting in the Respect Game (Inline Dimension)

### What it is

No new token. Instead, the Respect Game ranking adds an explicit second-dimension prompt to the voting round. After the standard contribution ranking (ZOR), a second quick poll happens in the same session:

**"Of the members in your group, who most clearly demonstrated ZAO's core values this period?"**

The second poll produces a values-weighted ZOR bonus: the top-ranked member in the values poll receives +20% ZOR for that session. Second place receives +10%. No new token, no new contract.

### How scoring works (example with 2x Fibonacci base)

| Rank | Standard ZOR | Values bonus (top) | Values bonus (2nd) |
|---|---|---|---|
| 6 | 110 | +22 = 132 | — |
| 5 | 68 | — | +14 = 82 | 
| ... | ... | | |

The values poll is separate from the contribution ranking: member A can be rank 6 in contribution but rank 1 in values. Both signals matter and can diverge.

### Advantages
- Zero new infrastructure (same OREC, same ZOR, same frapps.xyz UI)
- Natural to the existing session format (adds ~5 min per session)
- Produces a secondary ranking signal within the existing ZOR ledger
- Contribution and values correlation is visible over time in the ZOR history

### Disadvantages
- Values signal is "buried" in the ZOR token — cannot be easily extracted or cited separately
- No standalone proof-of-values artifact for GEO indexing
- Bonus weighting must be tuned (20%/10% are initial estimates, may need calibration)
- Harder to bootstrap for newcomers (they need to be in a session group)

---

## Comparison

| Dimension | Option A (ZAV Token) | Option B (Inline Bonus) |
|---|---|---|
| New contract needed | Yes (ZAV ERC-1155) | No |
| Governance overhead | High (OREC vote per mint) | Low (built into session) |
| GEO-indexable artifact | Yes (ZAV token + rationale) | No |
| Mental model complexity | Higher | Lower |
| Newcomer accessibility | Via nomination (async) | Requires session attendance |
| Speed to implement | 3-6 months | 1-2 months (bot update only) |
| Best for | Establishing ZAO as values-documented DAO | Refining existing sessions |

**Recommendation:** Start with Option B (inline bonus) in Season 3 as a low-friction experiment. Evaluate after 2 seasons. If the values signal diverges meaningfully from the contribution signal, graduate to Option A (ZAV Token) as ZIP-007.

---

## Newcomer Bootstrap

### The problem

The Respect Game currently disadvantages newcomers: zero ZOR means zero governance weight, even if the newcomer demonstrably aligns with ZAO values and is actively contributing. The first 4-6 sessions are a "cold start" where the member is present but their signal is invisible.

From Eden Fractal's 4-year experience (doc 1227): the biggest adoption drop-off happens when newcomers feel like "visitors" who don't matter. The solution is giving them a meaningful role fast.

### Proposed bootstrap mechanisms (one or both)

**Bootstrap Mechanism 1: Onboarding Respect Grant**

Any existing ZOR holder can nominate a newcomer for a one-time "Onboarding Respect Grant" (e.g., 42 ZOR — equivalent to a rank-3 first session) within their first 30 days. This is an OREC proposal, passes optimistically if unchallenged.

- Criteria for nomination: newcomer has attended ≥ 2 sessions, introduced themselves in Discord, and made at least one documented contribution (GitHub PR, event attendance, content post, etc.).
- Effect: the newcomer is now a "ranked participant" and their contributions are visible in the Respect Game from week 3 onward.

**Bootstrap Mechanism 2: Contribution Attestation Path**

Newcomers who cannot attend Monday 6PM EST sessions can submit a contribution attestation: a written summary of ZAO-related work (with links/evidence). Any 3 existing ZOR holders can co-sign the attestation. Co-signed attestations trigger an OREC proposal for a bootstrap ZOR grant.

- This solves the timezone/schedule exclusion problem (ZAO-Africa, international members).
- Attestation is public and on-chain once the OREC proposal executes — becomes the newcomer's founding record.

**Bootstrap Mechanism 3: Values-Forward Entry (Option A path only)**

If ZAV token is adopted: newcomers can receive ZAV before ZOR. A newcomer who demonstrates clear values alignment (3+ member nominations) can receive ZAV within their first 2 weeks, even without a Respect session. ZAV ≥ 1 gives them a "voice but no vote" status: they can participate in OREC discussions and submit contribution requests but cannot initiate proposals.

---

## ZIP-006 Draft: Values Axis + Newcomer Bootstrap

```
## ZIP-006: Values Axis — Newcomer Bootstrap + Phase 1 Inline Bonus

Status: DRAFT
Author: ZAO Research Agent (for Zaal to review + propose formally)
Type: Governance
Created: 2026-07-17
On-chain ref: (pending formal proposal via /propose bot command)

### Motivation

The ZAO Fractal ranks contributions on one axis. This ZIP adds a values-
recognition dimension and a structured newcomer bootstrap to:
(1) Make ZAO's values alignment explicit and citable
(2) Reduce cold-start exclusion for new members
(3) Produce richer governance signal over time

### Specification (Phase 1 — Inline Bonus)

1. Starting Season 3 (first session after this ZIP is adopted), the Fractal
   Discord bot adds a second poll round per session:
   "Of your group, who most demonstrated ZAO's core values this period?"
   
2. Values criteria (three axes):
   a. Music/art/technology: created, curated, or promoted music/art/tech work
   b. Onchain ownership: advocated for creator rights, onchain tools, or
      ZAO's mission in any context (not just inside ZAO)
   c. Community: strengthened ZAO community through mentorship, inclusion,
      or conflict resolution

3. Scoring: top values-ranked member in each group receives +20% ZOR for that
   session. Second values-ranked receives +10%. Sourced from existing session
   Respect pool (no new tokens minted).

4. Bot update: /zaofractal command updated to include the values poll after
   the contribution ranking. Results posted in the same session summary.

### Specification (Newcomer Bootstrap)

1. Existing ZOR holders (≥ 1 ZOR) can submit a Bootstrap Nomination for any
   newcomer who has: attended ≥ 2 sessions, posted an introduction in Discord,
   and documented ≥ 1 contribution (with link).

2. Bootstrap Nomination = OREC proposal for 42 ZOR grant (rank-3 equivalent).
   Passes optimistically if unchallenged in 48h.

3. Contribution Attestation Path: newcomers who cannot attend Monday 6PM EST
   can submit a written attestation (with links). 3 co-signatures from existing
   ZOR holders trigger an OREC bootstrap proposal.

### Rationale

Phase 1 uses the existing ZOR infrastructure — no new contract, no new token.
The values bonus is calibrated at 20%/10% based on Eden Fractal's experience
that a ~20% differential is large enough to be meaningful but not distorting.
Bootstrap grants at 42 ZOR (rank-3 equivalent) give newcomers immediate
parity-of-presence without granting unearned governance weight.

Phase 2 (ZAV token, ZIP-007) is deferred until Phase 1 data reveals whether
the contribution and values signals diverge in practice (expected after 2 seasons).

### Backwards Compatibility

No existing ZOR balances change. Session-level scoring changes for Phase 1
require only a bot update (not an on-chain contract change). Bootstrap grants
are OREC proposals — same process as any other Respect distribution.

### Implementation

1. Bot update: `fractalbotmarch2026` — add values poll to `/zaofractal` command.
   Estimated effort: 1-2 sprints (Python, Discord.py).
2. OREC: no change needed for Phase 1 (bootstrap grants use existing
   /propose flow).
3. frapps.xyz: update session summary display to show values rankings alongside
   contribution rankings (Optimystics coordination needed).

### Open Questions for Zaal (DECISION NEEDED)

1. Is Phase 1 (inline bonus) the right starting point, or should we skip to
   Phase 2 (ZAV Token, ZIP-007) immediately?
2. Is 42 ZOR the right bootstrap grant size? (Rank-3 equivalent = meaningful
   but not outsized.)
3. Does the fractalbotmarch2026 Python codebase support the additional poll
   round? (Bot owner confirmation needed.)
4. Should the Contribution Attestation Path be co-signed by 3 members or 5?
5. Should ZAO-Africa be the first test case for the Attestation Path (given
   timezone/schedule constraints)?
```

---

## Governance Context

This is a proposed ZIP-006. The registry in doc 1207 currently lists:
- ZIP-001: Founding (✅ ADOPTED)
- ZIP-002: Year 2 Fibonacci (✅ ADOPTED)
- ZIP-003: ZOR + OREC Deployment (✅ ADOPTED)
- ZIP-004: Burn/Decay Proposal (🔵 PROPOSED)
- ZIP-005: ZAO OS Fractal Integration (🔵 PROPOSED)
- **ZIP-006: Values Axis + Newcomer Bootstrap (🟡 DRAFT — this doc)**

ZIP-005 (OS integration) and ZIP-006 (values axis) can proceed in parallel — they touch different subsystems.

---

## Implementation Checklist

When Zaal approves the approach:

- [ ] Present to ZAO community for feedback (Discord #governance)
- [ ] Issue formal `/propose` bot command for Phase 1 Inline Bonus
- [ ] OREC vote: 48h voting + 48h veto
- [ ] If adopted: update `fractalbotmarch2026` to add values poll
- [ ] Post session summary update to frapps.xyz (Optimystics coordination)
- [ ] Ship first Bootstrap Nomination for at least 2 newcomers in Season 3
- [ ] After 2 seasons: evaluate ZOR values-signal divergence → decide on ZIP-007 (ZAV token)

---

## Sources

- Doc 696 — Fractal lineage + voting criteria
- Doc 1207 — ZIP framework + existing ZIP registry (ZIP-001 through ZIP-005)
- Doc 1227 — Eden Fractal 4-year learnings (newcomer cold-start problem, contribution circles)
- Doc 1232 — Growing-fractals playbook (fractal ecosystem map, newcomer bootstrap path)
- Doc 703 — ZAO Fractal current state (May 2026)
- Doc 1202 — On-chain settlement history (63 verified settlements)
- Doc 941 — ZIP-004 Burn/Decay proposal (parallel ZIP in flight)
- Doc 942 — ZAO Fractal Whitepaper Outline v2 (roadmap context)
- Board task `e98492aa` — "Fractal values-axis stream"
