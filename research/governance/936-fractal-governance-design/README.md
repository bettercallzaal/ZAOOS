---
topic: governance
type: decision
status: research-complete
last-validated: 2026-07-01
related-docs: 935, 877, 835, 004
original-query: "go hard on the fractal stuff from all our learning - the ZAO fractal governance mechanics grounding the whitepaper (paired with doc 935 monetary policy for merit)"
tier: DEEP
---

# 936 - Fractal Governance Design (the ZAO Respect Game, verified)

> **Goal:** The *how the weekly machine runs* companion to doc 935 (the *what* - monetary policy for merit). Three deep threads: the Respect Game protocol (F1), fractal scaling (F2), and ZAO's current state + migration (F3). Grounded in the actual code, with agent hallucinations corrected.

## GROUND TRUTH FIRST (code-verified, read before anything else)

**ZAO Respect has NO decay and NO burn today.** `src/lib/respect/voteWeight.ts` computes governance weight as `Math.round(ogValue + zorValue)` - the **raw sum** of a member's OG (ERC-20) and ZOR (ERC-1155) balances on Optimism. There are zero decay references anywhere in `src/lib/respect/`.

**Correction, loud:** two research agents (F1, F3) claimed ZAO "already runs ~2%/week off-chain decay (34-week half-life)." **This is false** - it does not exist in the code; the agents echoed doc 935's *example* decay figure (`R(t)=R(t-1)*0.98`) as if it were live. The whitepaper must NOT state that ZAO already decays Respect. The brief's premise is correct: 2 years minted, no decay, no burn. The burn/decay in doc 935 is a NEW proposal, not a formalization of something existing.

**What IS real:** two ledgers, both on Optimism, both read on-chain and **summed** for weight:
- **OG Respect** - ERC-20, older, effectively frozen (the Airtable/curator era).
- **ZOR Respect** - ERC-1155, minted via the on-chain ORDAO flow (the current era).

This two-ledger reality is what makes the doc-935 Banked/Active split *natural* (OG -> Banked legacy, ZOR-forward -> Active) - but it is a mapping to BUILD, not one that exists.

## The Respect Game protocol (F1, canonical + external-sourced)

Lineage: Daniel Larimer's fractal democracy (fractally, "More Equal Animals") -> Optimism Fractal / Eden Fractal / ORDAO. ZAO runs it weekly (Mondays 6pm EST, 100+ weeks).

The weekly meeting:
1. **Randomized breakout groups** of ~6 (re-randomized every week - this is load-bearing for collusion resistance).
2. Each member gives a **3-4 minute** account of their mission-aligned contribution that week.
3. The group **ranks itself by 2/3 consensus** (open discussion). If the room cannot reach consensus, **no one in that room earns Respect that week** - a real anti-deadlock and anti-collusion property.
4. Ranks pay out on the **golden-ratio Fibonacci ladder**: 55 / 34 / 21 / 13 / 8 / 5 (each rank ~φ=1.618x the one below; 136 per full group). Non-transferable, soulbound.

**Sybil/collusion resistance** = weekly random re-assignment (coalitions can't reform) + 2/3 consensus (a lone bad actor can't force a ranking) + non-transferability (weight is reputation, not purchasable) + synchronous timing (all groups at once, limits multi-account play). Honest caveat for the paper: canonical sources emphasize Fibonacci for *proportionality/fairness*, NOT explicitly Sybil resistance - the "exponential incentive resists gaming" argument is ZAO's interpretation, so frame it as ours, not as established fact.

**Verify before printing (agent-stated, code-unconfirmed):** a ZAO-specific "2x curve" (110/68/42/26/16/10); OG's "38,484 total / 122 holders"; specific fractal-count boundaries; the `OREC.proposeBreakoutResult()` submission bottleneck and the CivilMonkey detail. Credible as leads, not paper-ready facts.

## Scaling the fractal (F2, externally grounded)

- **Rounds to consensus:** `rounds ≈ log(N) / log(group_size)`. 188 members = 2-3 rounds (one session). ~500 = 3-4 rounds (twice-weekly or a standing council). ~1000+ = a hybrid, not pure recursion.
- **Do NOT use strict recursion** - recursing 6-person groups upward collapses to 1-2 people at the apex = oligarchy. Use the **Optimism Fractal hybrid**: Level 0 six-person breakouts -> Level 1 elected delegates (10-12, ~8-week terms, no back-to-back) -> Level 2 Sages Council (5-6 chosen by **sortition** from Level 1).
- **Sortition is the anti-oligarchy engine.** Random selection makes coordinated capture vanishingly unlikely (NeurIPS 2022 sortition work: ~2e-9 for a coup of a small random parliament) and sidesteps Condorcet's paradox / Arrow's impossibility (it doesn't aggregate preferences). Dunbar-style ~3x scaling holds across militaries, firms, primates, DAOs.
- **Honest frontier gap:** there is little empirical data on multi-level fractals at 500-5000 (Genesis Fractal tested ~97). ZAO scaling 188 -> 1000+ via ZABAL Gamez would be a genuine frontier case - a strength to claim, but claim it as untested.

## How the monetary policy (doc 935) sits on the machine

The proposed weekly loop, end to end (NEW parts flagged):
1. Members gather -> **randomized** into ~6-person groups.
2. 3-4 min contributions -> **2/3-consensus ranking** -> Fibonacci payout.
3. Result submitted on-chain (ORDAO / OREC) -> 48h vote + 48h veto -> execution **mints ZOR** (all existing).
4. **[NEW] Active-Respect decay** applied on a rolling window (doc 935: 180-day half-life recommended, NOT compounding 50%/mo). OG -> Banked (never burns); ZOR-forward -> Active (decays, gates governance + bounties).
5. **[NEW] Missed-participation burn**, softened by **grace tokens** (earned while active, not buyable) + first-miss amnesty.
6. **[NEW] Participation is multi-signal** - attendance OR a judged bounty ship OR a 2-peer attestation stops the burn.
7. **[NEW] Active Respect gates bounty routing** - Safe + Snapshot judging on Base (doc 935 P1-D), no bridge.

The one build that unblocks scale (real, from code + F3): **gas-free member submission.** Today only a couple of wallets can submit breakout results on-chain; a relayer-backed submit button in ZAO OS lets every member submit - prerequisite for both wider participation and the multi-signal model.

## Next Actions
| Action | Owner | Type | Gate |
|---|---|---|---|
| CONFIRM (before whitepaper print): does any ledger decay? Answer = no, per code. State "no decay today" as fact. | Zaal | Verify | code = truth |
| Verify the ZAO 2x curve, OG totals, fractal-count boundaries against the contract + fractal bot | Zaal | Research | primaries only |
| Decide burn/decay proposal options (doc 935) against this loop | Zaal | Governance | fractal vote |
| Scope the gas-free relayer submit button (the real scaling unblock) | Dev | Build | testnet first |

## Sources
Code (ground truth, FULL): `src/lib/respect/voteWeight.ts`, `onchainBalances.ts`, `leaderboard.ts` (raw OG+ZOR sum, no decay). Repo: docs 004 (Respect Tokens), 877 (Plurality Hubs), 835 (Deep Funding), 935 (Monetary Policy for Merit). External (FULL/PARTIAL): fractally.com + "More Equal Animals" (Larimer), edenfractal.com, optimystics.io / github.com/sim31/ordao, NeurIPS 2022 sortition work, Condorcet/Arrow/Dunbar literature. Corrected: the "2%/week decay already exists" claim (F1, F3) is a hallucination - not in code.
