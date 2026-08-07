---
topic: business
type: decision
status: research-complete
last-validated: 2026-08-06
related-docs: 2231, 2232, 1534, 631
original-query: "leftclaw-services x402 -> POIDH adopt-spec: how POIDH adopts the x402->USDC->CLAWD-swap->on-chain-job plumbing + escrow"
tier: STANDARD
---

# 2234 - leftclaw x402 -> POIDH: adopt the agent-payable funding layer, NOT the escrow

> **Goal:** Spec what POIDH should adopt from clawd's leftclaw-services. The grounding
> flips the framing: POIDH ALREADY has canonical on-chain escrow - so the adopt is narrow.

## The framing correction (confirm-before-claiming-absence)

The queued task said "adopt leftclaw's x402->escrow for POIDH." Grounding the ZAO side
FIRST changed the answer: **POIDH already IS the on-chain escrow.**
- POIDH ICM box: "an on-chain bounty platform on Base."
- Doc 1534: "POIDH (poidh.xyz/base) - On-chain escrow, ZAO has 4 rounds of track record...
  POIDH is the canonical escrow."
- Doc 631: "POIDH platform on-chain bounties... winners get ETH on-chain."

So do NOT rebuild escrow - POIDH has it, with a real track record. The adopt is only the
layer leftclaw adds ON TOP of an escrow: agent-payable funding + reward-token swap.

## What leftclaw actually is (grounded, real gh api)

`clawdbotatg/leftclaw-services` (MIT, Austin Griffith). Read real:
- `packages/foundry/contracts/LeftClawServicesV2.sol` - "Hire clawdbots - dynamic service
  types, escrow in CLAWD, no disputes, no fees." Structs `ServiceType`/`Job`/`WorkLog`;
  events `JobPosted`/`JobAccepted`/`JobCompleted(jobId, worker, resultCID)` (:97-99). This
  is leftclaw's OWN escrow - the part POIDH already has an equivalent of.
- `packages/nextjs/lib/postJobFor.ts` - the genuinely-new part: `getContractPriceUsd` from
  an **x402** module (:7), `ensureApproval` (approve max if allowance < 10k USDC, :39-54),
  then `postJobFor(client, serviceTypeId, description, minClawdOut)` (:17) - and a Uniswap-V3
  `exactInput` swap **USDC -> CLAWD** with `minClawdOut` slippage. So: an HTTP **x402 USDC
  payment** funds a job, auto-swapped into the reward token, escrowed on-chain.

## The two things POIDH should adopt (narrow, honest)

### 1. x402 agent-payable bounty funding. THE real adopt.
leftclaw lets a bounty be funded by an **HTTP 402 payment** - meaning an AGENT (ZOE, a
script, another service) can fund/pay a bounty programmatically, no human wallet-click.
POIDH today is human-UI-funded (poidh.xyz). Adding an x402 funding endpoint would let
**ZOE fund/settle POIDH bounties programmatically** - e.g. auto-fund a bounty pot from a
budget, or pay a winner on verification. This composes with the clipper thread (docs
2232/2233): an incentivized-clip bounty that an agent can top up on-chain.

### 2. USDC -> reward-token auto-swap at funding.
leftclaw funds in USDC but escrows in its token (CLAWD) via Uniswap at funding time. For
ZAO: a funder pays **USDC**, the bounty escrows/pays in **ZABAL** (or ETH), auto-swapped -
so funders needn't hold the reward token. Optional, but it removes a real funding-friction.

## Check twice (feedback_check_alternatives_oss_first)
- **x402** is not leftclaw's - it's **coinbase/x402 (Apache-2.0, 137 stars)**, the canonical
  HTTP-402 payments standard. Adopt x402 the STANDARD directly (Apache-2.0, cleanly reusable);
  leftclaw is just a working reference for wiring it to an on-chain job. Do not copy leftclaw's
  code (MIT is fine to reuse, but the standard + POIDH's own contract is the better base).
- **On-chain bounty escrow alternatives** (do NOT adopt - POIDH already wins here): generic
  escrow libs / Dework / Gitcoin patterns exist, but POIDH is already ZAO's canonical, track-
  recorded Base escrow. Reuse > rebuild (code-restraint). The escrow question is closed.
- Net: the only new dependency is the **x402 standard (Apache-2.0)** on top of POIDH.

## Recommendation (money/on-chain = GATED, Zaal's)
Adopt **x402 agent-payable funding as a thin layer over POIDH's existing escrow** - an
endpoint that accepts an x402 USDC payment and funds/settles a POIDH bounty (optionally
USDC->ZABAL swap). Do NOT port leftclaw's contract; POIDH's escrow stands. This makes ZOE
able to fund/pay bounties programmatically, which is the piece the clipper-incentive thread
needs. Deploying/funding anything on-chain is Zaal's gated call; this is the design.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| DECISION: add an x402 (Apache-2.0) agent-payable funding endpoint over POIDH's existing escrow? | @Zaal | Decision (gated) | 2026-08-11 |
| If green: spec the x402 funding endpoint + optional USDC->ZABAL swap (design over POIDH, not a new contract) | @Zaal (Claude) | Research/PR | after decision |
| Do NOT rebuild POIDH escrow - confirmed canonical (doc 1534) | - | Closed | done |
| Review in the morning browse pile | @Zaal | Review | 2026-08-07 |

## Sources

- **clawdbotatg/leftclaw-services (MIT, Austin Griffith)** - gh api 2026-08-06:
  `LeftClawServicesV2.sol` (structs/events :97-99), `postJobFor.ts` (x402 :7, ensureApproval
  :39-54, postJobFor :17, USDC->CLAWD swap). [FULL]
- **coinbase/x402 (Apache-2.0, 137 stars)** - the payments standard leftclaw uses. [FULL, gh api]
- ZAO POIDH (FULL, in-repo): `research/identity/icm-boxes/poidh.llm.txt`, doc 1534
  (POIDH = canonical escrow, 4 rounds), doc 631 (on-chain bounties, ETH payout).

## Also See

- [Doc 2231](../../agents/2231-clawd-repo-sweep-workflow-triage/) - the sweep that queued this.
- [Doc 2232](../2232-whop-clippers-incentives-oss-alternatives/), [Doc 2233](../2233-unlock-whop-crypto-access-bridge/) - the clipper/incentive/access thread this funds.
