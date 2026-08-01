# Doc 2175 - ZOL & ZOE Sovereign-Agent Progression: Required Deliverables + Architect's Progress Report

**Status:** DESIGN / ASSESSMENT ONLY. Nothing in this doc activates any capability. No economic, on-chain, or public-autonomy action is enabled by it.
**Date:** 2026-08-01
**Trigger:** Brandon's 5-stage "ZOL & ZOE Sovereign-Agent Progression" proposal (staged, cautious, `$0`-default). This doc is the "Required Deliverables" Brandon asked for *before activation*, plus the Architect's Progress Report.
**Grounding:** A read-only file-by-file audit of origin/main (2026-08-01) + related repos. Every "EXISTS" traces to a file:line; every "PROPOSED-ONLY" is explicitly no-code. Per Brandon's rule: no PR is cited as proof unless its diff contains the code.
**Related:** [[project_brandon_organism_directives]], [[project_brandon_two_plane_architecture]] (Heart), [[project_dreamnet_trust_layer]], [[project_dreamnet_spore_sdk]], doc 2170 (diagnostic), 2171 (reaudit), 2169 (daily-note), 2174 (bidirectional relay).

---

## THE HONEST HEADLINE

The organism can **ACT** (receipts on real tool actions) and **REMEMBER** (the afferent digest routes receipts to memory). It cannot yet be **VERIFIED, CERTIFIED, TRUSTED, or ECONOMICALLY CONTROLLED**. It is a reliable operational loop with observability - **not yet a sovereign system.** ~25% of the 5-stage vision is production code, ~50% is built-but-flags-OFF, ~25% is research-only.

**Stage 0 (the readiness gate) is NOT fully passed** - so per Brandon's own rule, no later stage may proceed. The single highest-leverage move is to CLOSE STAGE 0 (turn the built organism ON), not to grow new limbs.

## DELIVERABLE 1 - CURRENT-STATE IMPLEMENTATION MAP (grounded)

| Stage | Score | Shipped (file:line on origin/main) | Gap |
|---|---|---|---|
| **0+5 Proprioception** | 7/10 | receipts.ts (emits on repo-improver/error-remediation/hermes), receipt-envelope.ts (`dreamnet.receipt.v1` + sha256, PR #2515), afferent-digest.ts (nightly receipts->memory, #2774), packages/heart-fleet/* (leases+liveness+outbox+reconcile, 5 props), cost-governance.ts ($10/day cap + alerts) | No `claims` table; memory retrieval ~88% orphaned; no reputation layer |
| **1 Identity/Certification** | 2/10 | src/lib/ens/resolve.ts + subnames.ts (ENS resolve + subname request, NOT wired to routing) | Zero ToolGym/University/competency-claim code |
| **2 Economics** | 3/10 | cost-governance.ts (LLM budget cap live); approval_class field in schema | No ERC-4337/CDP code; approval gates are POST-facto (audit), not pre-dispatch; no on-chain spend policy |
| **3 Temporal (WarpKeeper)** | 0/10 | (Sparkz operational, but zero history) | No snapshots/state-diff/rollback/0xSplits code anywhere |
| **4 Farcaster agency** | 6/10 | src/lib/publish/farcaster.ts (Neynar posting + rate-limit error handling); ZOL (@zolbot) + ZOE both post | No mass-reply guard, no PRE-approval gate, no unified rate limiter |

**Flags (all default OFF, verified):** `ZOE_HEART_FLEET_CANARY`, `ZOE_REPO_IMPROVER_LEASES`, `ZOE_OUTBOX_DEMO`. So the Heart lease/fencing/outbox is coded + tested but **governs nothing in prod today.**

## DELIVERABLE 2 - DEPENDENCY & OWNERSHIP MAP

| Layer | Owner (authority) | Depends on | Sovereignty note |
|---|---|---|---|
| Identity (ENS/DID) | **Zaal** (retains, per proposal) | ENS resolver; a registrar for *.dreamnet.eth (unverified) | Do not claim `zol/zoe.dreamnet.eth` issued until resolution + ownership verified |
| Memory | Zaal (dotfiles repo is source of truth) | Supabase (receipts), the memory store | One brain, many lanes |
| Execution authority | ZOE orchestrator; Heart leases (when ON) | packages/heart-fleet, agent_runs table | Currently ungoverned (flags off) |
| Economic authority | **Zaal, explicit, per-action** | (none live) - CDP/4337 not integrated | `$0` default; human-gated; human-executed. Claude designs, never executes |
| Federation | ZAO (first conformant node) | DreamNet Spore SDK (spec) | ZAO impl is independent; SDK = spec, not a dependency for survival |

## DELIVERABLE 3 - SECURITY + ECONOMIC THREAT MODEL

- **Runaway spend** (Stage 2): an agent with a funded account drains it. Mitigation: `$0` default; `$50/day` ceiling only after explicit promotion; per-action limit; contract+function allowlist; human approval above threshold; **pre-dispatch approval gate (does not exist yet - build before any funding)**; simulate-before-submit; idempotency keys; emergency pause.
- **Key compromise** (Stage 2): agent key leaks. Mitigation: keys in `~/.zao/private` (chmod 600, never committed - secret-hygiene.md); rotation procedure; separate keys per agent (ZOL != ZOE); on-chain allowlist limits blast radius even if key leaks.
- **Impersonation / engagement farming** (Stage 4): agent posts as a human, mass-replies, fake engagement. Mitigation: no impersonation, no mass reply/follow, per-channel daily cap (build - none exists), conversation-quality threshold, approval-class for sensitive comms, receipts on meaningful actions.
- **Fabricated competency** (Stage 1): an agent claims authority it did not earn. Mitigation: competency claims must carry test traces + evidence + verification + expiry; authority increases only when claims REPEATEDLY survive verification (Brandon's rule).
- **Vacuous receipts** (Stage 0/5): a receipt emitted for a no-op, inflating apparent throughput. Mitigation: receipts assert the real effect (silent-failure-guard.md), the day-7/done-condition promotion signals are behavioural not self-reported.
- **Split-brain execution** (Stage 0): two instances double-act. Mitigation: Heart leases/fencing (built - **flip the flag to make it real**).

## DELIVERABLE 4 - STAGED ROLLOUT (per Brandon's ladder, promote each capability separately)

`simulate -> verify -> testnet -> limited guarded production -> review -> broader authority`

- **Phase A (now): CLOSE STAGE 0.** Deploy the merged proprioceptive layer; verify receipts flow + the digest runs; flip `ZOE_REPO_IMPROVER_LEASES=true` + verify a lease fences a real path; do the memory curation pass; define the emergency-pause + owners. NO economic/certification/public-autonomy work until this passes.
- **Phase B: Stage 4 guardrails (cheap, high-safety-value).** Build the mass-reply guard + pre-approval gate + unified rate limiter for the ALREADY-LIVE Farcaster agents. This hardens what's already public. No new spend.
- **Phase C: Stage 1 pilot (design + sim).** One ZOL tool (`post_farcaster`) through a ToolGym-style competency harness; produce a competency claim with traces. Identity `zol.dreamnet.eth` = verify resolution/ownership, do NOT claim issued.
- **Phase D: Stage 2 scaffolding (SIM/TESTNET ONLY).** Design the ERC-4337/CDP account with `$0` default + allowlists + pre-dispatch approval gate + simulation harness + reconciliation. Testnet only. NO mainnet funding, NO real value. Human-gated at every promotion.
- **Phase E: Stage 3 (observation only).** WarpKeeper = reliable temporal observation of Sparkz (snapshots/diffs) FIRST. Automated keeper actions stay disabled until contracts identified + conditions specified + financial side-effects simulated + emergency shutdown exists.

## DELIVERABLE 5 - ROLLBACK PLAN

- Code: every change is a PR; deploy has auto-rollback (zoe-autodeploy verify-on-fresh-checkout + boot-health + rollback-on-error). Flags default OFF = merging changes nothing until flipped; rollback = unset the flag.
- Economic: emergency pause (build) halts all agent txns; `$0` default means the floor is safe-by-default; testnet-only until reviewed.
- Public: operator pause on the Farcaster agents; receipts + memory make every action auditable + reversible-in-record.

## DELIVERABLE 6 - COST ESTIMATE (order-of-magnitude, to validate later)

- Stage 0 closeout: ~$0 (deploy + flag flips + a curation pass; existing infra).
- Stage 1 pilot: ~$0 (a harness + one tool; local/OpenRouter for eval).
- Stage 2 sim/testnet: ~$0 real value (testnet gas is free/faucet); CDP/AgentKit may have platform costs - verify before committing.
- Stage 3 observation: minimal (snapshot writes to Supabase).
- Stage 4 guardrails: ~$0 (code).
- **Real money only enters at Stage 2 "limited guarded production" - Zaal's explicit, separate decision, not covered here.**

## DELIVERABLE 7 - ACCEPTANCE CRITERIA (per stage, measurable)

- **Stage 0 PASS =** receipts from >=3 loops in the last 24h (not 1); the digest ran + wrote a memory record; `ZOE_REPO_IMPROVER_LEASES=true` in prod + a logged lease acquire/skip; a retrieval test answers a prior decision without re-prompting; an emergency-pause + owner registry exist.
- **Stage 1 PASS =** one competency claim exists with test-trace + evidence + verification + expiry; identity resolution verified (or explicitly "not issued").
- **Stage 2 PASS =** a testnet txn simulated -> verified -> submitted -> reconciled, with the pre-dispatch approval gate blocking an over-threshold action; `$0` mainnet.
- **Stage 3 PASS =** N weekly Sparkz snapshots with a working state-diff + replay; zero automated money movement.
- **Stage 4 PASS =** the mass-reply guard + per-channel cap + pre-approval gate live; zero impersonation; receipts on meaningful actions.

---

## ARCHITECT'S PROGRESS REPORT

**Readiness gates passed:** Stage 0 **partially** (proprioceptive code merged: receipts, envelope, afferent digest, Heart package). **Not passed:** leases-govern-real-execution (flags OFF), retrieve-without-reprompting (memory 88% orphaned), emergency-pause + economic owner (do not exist).

**Safe to activate now:** the Stage-0 closeout (deploy + flip the Heart flag + curation - low risk, reversible), and the Stage-4 guardrails (mass-reply guard etc. - pure hardening of what's already live). Nothing else.

**Design-only (must NOT activate):** all economic/on-chain (Stage 2), certification issuance (Stage 1), WarpKeeper keeper-actions (Stage 3), any new public-autonomy without the guardrails.

**Evidence produced:** the grounded current-state map (25% prod / 50% flags-off / 25% no-code), the per-stage scores, the anti-fabrication trace (all EXISTS -> file:line).

**New failure modes discovered:** (1) approval gates are POST-facto audit, not PRE-dispatch - a real gap before any spend. (2) The already-live Farcaster agents have NO mass-reply/impersonation guard - a live risk independent of the sovereign vision. (3) The Heart is 100% tested / 0% live - fencing exists but governs nothing, so split-brain is currently only prevented by the one-instance convention, not the lease layer.

**Single highest-leverage next milestone:** **CLOSE STAGE 0** - flip `ZOE_REPO_IMPROVER_LEASES=true`, deploy + verify receipts flow + the digest runs, do the memory curation pass. It converts the whole 3-week build into live capability and unblocks everything after it, at ~$0 and low risk.

**Three ranked alternatives (if not Stage 0 first):**
1. Stage-4 guardrails (mass-reply/pre-approval) - hardens a LIVE public surface; high safety ROI, low effort. (Do this alongside Stage 0.)
2. Stage-1 ToolGym pilot (one tool) - proves the certification loop cheaply; but premature before Stage 0 records reliably.
3. Stage-2 sim scaffolding - highest future value but highest risk-of-drift; do NOT start before Stage 0 + the pre-dispatch gate.

**1-3 iteration roadmap:** (1) Close Stage 0 + Stage-4 guardrails. (2) Stage-1 pilot + verify identity resolution. (3) Stage-2 sim/testnet scaffolding with the pre-dispatch gate. Re-run the readiness gate between each.

**Self-critique:** This assessment is a snapshot; "merged" != "running" - the Stage-0 "7/10" assumes the merged code deploys cleanly, which is unverified until the VPS runs it. The scores are judgment, not a metric. The cost estimate is order-of-magnitude. The audit read code, not runtime - a merged file can still fail at boot (the esbuild lesson).

**Next logical progression (without waiting for a prompt):** Close Stage 0 - and it is deploy-and-verify work, all in-lane and reversible, not a new build. The economic and public-autonomy stages stay design-only and human-gated until Stage 0 passes its acceptance criteria. This doc activates nothing.
