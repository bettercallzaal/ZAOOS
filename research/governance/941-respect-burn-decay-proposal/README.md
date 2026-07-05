---
topic: governance
type: decision
status: proposal-draft
last-validated: 2026-07-02
related-docs: 935, 936, 942
original-query: "draft the votable burn/decay proposal from docs 935 (monetary policy for merit) + 936 (fractal design)"
tier: STANDARD
---

# 941 - Respect Burn/Decay: the votable proposal

> **What this is:** the fractal-ready proposal drawn from the research (doc 935 monetary policy, doc 936 fractal design). Each section is a discrete vote with a recommended default, the one-line rationale, and the tradeoff. Vote each independently.
>
> **Ground truth (confirmed in code, 2026-07-02):** Respect has NO decay and NO burn today - governance weight is `Math.round(OG + ZOR)`, a raw sum. So this is not a tweak; it is adding the mechanism from scratch. Frame: "monetary policy for merit" - Respect is an inflationary, decaying flow that measures *current* relevance and *routes* money; it is not money and cannot be bought or sold.

## Why do anything (the case for decay)
Issuance already scales 1x -> 2x -> 3x per year, so an inactive Y1 holder's *relative* weight falls ~5x over 3 years from dilution alone. Decay is the accelerator that keeps standing tied to *recent* contribution, not tenure. Precedent: the systems that thrive frame decay as recency/fairness (Gitcoin 90-day expiry, Coordinape epoch reset), not punishment. The one live DAO precedent, Colony, decays 50%/90 days.

---

## VOTE 1 - Adopt the Banked / Active split?
- **Proposal:** split Respect into **Banked** (lifetime total, never burns - your rank, legacy, and membership) and **Active** (a rolling, decaying balance that sets governance weight + bounty access).
- **Recommended: YES.** It separates "honor what you did" from "weight what you're doing now," and it cleanly handles the Y3 legacy question (see Vote 5). Validated by SourceCred's cred/grain architecture (the split survived even when the org wound down).
- **Tradeoff:** two numbers to track instead of one. Mitigated - Banked is just the running sum you already have; Active is the new decaying view.

## VOTE 2 - Active decay shape
- **Option A - One-time 50% haircut:** miss the window, Active drops to 50% once, recoverable on return. The mercy option.
- **Option B - 180-day trailing half-life (RECOMMENDED):** `Active(t) = Active0 * e^(-0.00385t)` (t in days). Skip a month, -2% (unfelt); skip a quarter, -27% (felt). Matches the Fractal/ZABAL cycle.
- **Option C - Compounding 50%/month:** 1-month half-life = a guillotine (3.5x faster than Colony); inactive Y1 holder near 0% within a year, no recovery. Only if Respect is meant as a month-to-month permission slip.
- **Recommended: B.** Gradual, quarterly-friendly, keeps long-term members visible. **Not C** - it is member erasure, not discipline.

## VOTE 3 - What stops the decay (participation)
- **Proposal:** the burn is paused by **ANY ONE** of, per window: (a) fractal attendance, (b) a judged bounty ship, (c) two peer attestations (EAS, free on Base).
- **Recommended: YES (multi-signal).** "Participation is what you ship, not where you sit." Attendance alone is ~$0 to fake (one call login); a judged ship or a 2-peer quorum is costly to fake. A shipped bounty on a missed-call week should still count.
- **Tradeoff:** more to verify than attendance-only - but EAS attestations are free and judges already review ships.

## VOTE 4 - Grace for legitimate absence
- **Proposal:** **earned grace tokens** - ~2 per active year, each = 30-day absence immunity; can only be earned while active (no stockpiling). Plus a one-time **first-miss amnesty** (auto-granted) and a **1-activation-per-quarter** cap.
- **Recommended: YES.** Covers newborn/surgery/sabbatical without a loophole. Explicitly **not** Duolingo-style buyable freezes (those let you hold standing while contributing nothing).

## VOTE 5 - Y3 legacy migration
- **Proposal:** snapshot the 2 years of no-decay Respect (OG + ZOR to date) into **Banked** at a "Y3 Census." Active starts fresh from that epoch forward.
- **Recommended: YES.** No aristocracy (old Respect confers standing, not current governance power), no retroactive purge (nothing is taken away). This is why the Banked/Active split is the clean answer to the hardest open question.

## VOTE 6 - Route bounties by Active Respect (can defer)
- **Proposal:** gate POIDH bounty judging by Active Respect (e.g. Curator tier+), claim submission stays permissionless.
- **Recommended: YES, phase 2.** Buildable today off-chain (Safe multisig judged by a Snapshot strategy reading Active Respect on Base) - no bridge, ~a day. Makes Respect *route the money*, the core thesis.

---

## The one implementation unblock (not a vote - just do it)
Today only ~2 wallets can submit breakout results on-chain (gas friction on `OREC.proposeBreakoutResult()`). A **gas-free relayer submit button in ZAO OS** lets every member submit - prerequisite for wider participation AND the multi-signal model (Vote 3). Scope this first.

## Summary ballot
1. Banked/Active split - **YES**
2. Active decay - **B (180-day half-life)**
3. Participation - **multi-signal YES**
4. Grace - **earned tokens YES**
5. Y3 migration - **snapshot to Banked YES**
6. Bounty routing by Active - **YES, phase 2**

## Sources
Doc 935 (monetary policy for merit - the research + precedent), doc 936 (fractal design - the Respect Game + the verified no-decay ground truth). Verify-before-final: the ZAO 2x issuance curve and OG totals (leads, not confirmed facts, per doc 936).
