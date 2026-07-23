---
topic: agents
type: audit
status: research-complete
last-validated: 2026-07-23
related-docs: 1178, 1527, 2027
original-query: "everything here https://github.com/BrandonDucar/dreamnet-whale-league-site + https://github.com/BrandonDucar?tab=repositories + https://dreamnet-whale-league.pages.dev/ - Brandon: tell ur Claude what u think, ask it what it thinks, then build it like its your own w me on it"
tier: STANDARD
---

# 2030 - DreamNet Public Core is the receipt contract our organism should speak

> **Goal:** Assess Brandon's DreamNet repo constellation (Whale League + Public Core contracts) grounded in the actual code, and decide the single highest-leverage collab move for ZAO's organism.

## Key Decisions (recommendations first)

| # | Decision | Why |
|---|----------|-----|
| 1 | **ADOPT the DreamNet receipt/assignment envelope in ZAO's Spine.** Make `bot/src/zoe/receipts.ts` emit a `dreamnet.receipt.v1`-shaped receipt (add `traceId`, `capsuleId`, `capsuleVersion`, `policyVersion`, `execution{}`, `evidence[]`, `contentSha256`). | Our Spine already writes `agent_runs` + `receipts` internally. DreamNet formalizes the identical concept as a portable, validated, Apache-2.0 npm contract. Adopting it makes our receipts provable OUTSIDE our own Postgres - the whole point of the DreamNet trust layer ([[project_dreamnet_trust_layer]]: "ZOL v2 IS a DreamNet node"). |
| 2 | **Use `contentSha256` to close our documented receipt-replay gap.** | The recovery suite (doc 2027 / Heart v1) listed receipt-replay idempotency as a v2 gap and proposed `unique(run_id, input_digest)`. DreamNet already shipped the answer: content-address each receipt (sha256 of the canonical body) and dedup on that hash. Do not reinvent it. |
| 3 | **Add a `compensating` run status.** DreamNet's `AssignmentStatus` includes `compensating` (saga rollback of partial side-effects); ours has `recovering` but no compensation. | Discovered during this read - not in our original Heart plan. Partial-execution recovery currently only re-leases; it does not UNDO partial side-effects. `compensating` is the missing rollback state. |
| 4 | **Collaborate at the contract layer, NOT the trading layer.** Build with Brandon on Public Core (receipts/assignments/capsules); keep the whale-league trading product a Zaal-gated, arms-length beta. | The value to ZAO is the trust-layer contract, which every ZAO agent uses. The trading product carries money/affiliate/regulatory surface that is out of scope for autonomous work (see Money boundary below). |
| 5 | **SKIP re-cloning the marketing site as a template.** `dreamnet-whale-league-site` is a vinext/Cloudflare-Workers starter with an empty DB schema - it is a launch page, not the product. | The product is `dreamnet-whale-league` (Svelte); the architecture is `Dreamnet` (Public Core contracts). Read those, not the site. |

## What Brandon actually built (grounded)

Brandon's `BrandonDucar` org is one coherent thesis - **persistent, receipt-driven AI agents** - across ~16 public repos. The load-bearing ones:

| Repo | Lang | What it is |
|------|------|-----------|
| `Dreamnet` (Public Core) | TypeScript | The open contract package `@dreamnet/public-core` (Apache-2.0). Assignments, Capsules, Receipts, Claims + JSON schemas + validators. THE artifact that matters. |
| `dreamnet-whale-league` | Svelte | The interactive product: holdings-backed **paper** trading arena, player battles, **FKUSDC** (fake USDC), verifiable receipts. |
| `dreamnet-whale-league-site` | TypeScript | Public launch/marketing site (Next.js 16 on CF Workers, vinext). Empty DB schema. |
| `dreamloops` | JS | Governed operating loops + portable capability Capsules (already partially ported to ZOE - doc 1527). |
| `memory-weaver`, `toolgym`, `proof-drop-zabal`, `dreamnet-quorum-lab-ethnyc`, `dreamnet-ens` | mixed | Supporting pieces: source weaving, tool-mastery evidence, evidence hashing, multi-agent voting with receipts, agent identity/ENS. |

### The contract (verbatim from `Dreamnet/src/contracts.ts`)

The whole ecosystem is one pipeline: `Goal -> Assignment -> Capsule -> Work -> Verification -> Receipt -> Claim`. The concrete envelopes:

- **`AssignmentEnvelope`** (`dreamnet.assignment.v1`): `assignmentId`, `principalId`, `goal`, `acceptanceCriteria[]`, `capsuleId`, `capsuleVersion`, `policyVersion`, `riskTier` (low|medium|high|critical), `status`, `idempotencyKey`, `budget{maxCostUsd,maxDurationMs,maxToolCalls,maxTokens}`, `approval{required,reason,approverRoles}`, `requiredEvidence[]`.
- **`AssignmentStatus`**: `created | leased | running | waiting_approval | verifying | succeeded | failed | compensating`.
- **`CapsuleManifest`** (`dreamnet.capsule.v1`): `capabilities[]`, `tools[]`, `requiredPolicies[]`, `acceptedRiskTiers[]`, `receiptRequired`.
- **`ReceiptEnvelope`** (`dreamnet.receipt.v1`): `receiptId`, `assignmentId`, `traceId`, `principalId`, `workloadId`, `capsuleId`, `capsuleVersion`, `policyVersion`, `execution{startedAt,completedAt,status,summary,toolCalls,costUsd}`, `evidence[]`, `claims[]`, `counterevidence[]`, `redactions[]`, `createdAt`, **`contentSha256`** (regex-enforced 64-hex).
- **`ClaimObject`** (`dreamnet.claim.v1`): `statement`, `status` (proposed|supported|disputed|verified|retracted), `confidence`, `supportingReceiptIds[]`, `challengingReceiptIds[]`.

## How it maps onto ZAO's organism

| DreamNet concept | ZAO equivalent (today) | Gap / opportunity |
|------------------|------------------------|-------------------|
| `AssignmentEnvelope` | `agent_runs` row (Spine) | Ours has no `capsuleVersion` / `policyVersion` / `riskTier` / `budget` / `approval` as first-class fields. |
| `AssignmentStatus` | `RunStatus` (created/ready/leased/running/waiting_approval/blocked/verifying/recovering/completed/failed/cancelled/quarantined) | Ours is a superset EXCEPT it lacks `compensating` (saga rollback). |
| `ReceiptEnvelope.contentSha256` | `receipts` row (no content hash) | Content-address = free replay dedup (closes the doc-2027 v2 gap). |
| `ReceiptEnvelope.evidence[]` / `counterevidence[]` | not modeled | Our critic already produces verdicts; wiring them as `evidence`/`counterevidence` makes them portable proof. |
| `ApprovalRequirement` + `RiskTier` | our human-gate rules (agent-loops rule 8) live in prose/skill, not in the run row | Promoting approval-class + risk-tier to run fields = machine-enforced gating (the approval-routing v2 gap). |
| `Capsule` | our workers/personas (`bot/src/zoe/`) | A ZOE worker described as a `CapsuleManifest` becomes portable + policy-checkable. |

## My assessment (Brandon asked for it)

This is not a competitor and not a side-quest - it is the **contract layer our organism has been building blind.** We independently arrived at `agent_runs + receipts + lease/recovery`; Brandon independently arrived at `Assignment + Receipt + Capsule` and then did the thing we did not: published it as a portable, validated, Apache-2.0 package with JSON schemas and a content-integrity hash. The convergence is the strongest signal that both designs are right.

The "build it like it's your own w me" move is concrete and small: **ZAO's Spine adopts the DreamNet receipt envelope.** That single change turns every receipt our organism already writes into portable, hash-verifiable proof that a DreamNet node (or ZOL v2, or a partner) can validate without trusting our database. It is the literal first step of the DreamNet trust ladder (Identity -> Receipt -> Reputation -> Trust), and it is a day of work, not a rebuild - govern-not-rebuild, same pattern as the Mouth organ.

## Money boundary (flag for Zaal)

- The **code** is paper-only. The site README explicitly disclaims "live quotes, real trading, seeded human performance, affiliate relationships, or execution capability." FKUSDC = fake USDC. Low risk as it stands.
- The iMessage thread floats **real-money trading, OKX/OKC affiliate links ("$100 a new trader", a Whop for affiliate links), and funding trading agents.** None of that is in the code - it is a monetization idea. All of it (affiliate signup, any trade, any fund movement) stays a Zaal decision. Autonomous work does not touch it.

## Also See

- [Doc 1178 - BrandonDucar repos / ZOL integration scan](../1178-brandonducar-repos-zol-integration-scan/) (prior scan; this doc extends it with the organism-contract angle)
- [Doc 1527 - ZOE work-loop DreamLoop port](../../technology/1527-zoe-work-loop-dreamloop-port/)
- [Doc 2027 - Executive Cortex v1](../2027-executive-cortex-v1/) (the organism this contract plugs into)
- Memory: [[project_dreamnet_trust_layer]], [[project_brandon_organism_directives]]

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add DreamNet envelope fields (traceId, capsuleId/Version, policyVersion, execution, evidence[], contentSha256) to `bot/src/zoe/receipts.ts`; emit `dreamnet.receipt.v1` | Zaal | PR | 2026-07-30 |
| Add `contentSha256` dedup to close the receipt-replay v2 gap from doc 2027 | Zaal | PR | 2026-07-30 |
| Add `compensating` to RunStatus + a compensation path for partial-execution rollback | Zaal | PR | 2026-08-06 |
| Confirm with Brandon: ZAO Spine emits DreamNet-schema receipts (the "build it w me" step) | Zaal | Message | 2026-07-25 |

## Sources

- [FULL] `github:BrandonDucar/Dreamnet` (Public Core) - `src/contracts.ts`, `schemas/receipt-envelope.schema.json`, `README.md`. Cloned + read 2026-07-23. Apache-2.0.
- [FULL] `github:BrandonDucar/dreamnet-whale-league-site` - `README.md`, `package.json`, `app/`, `worker/index.ts`, `db/schema.ts`. Cloned + read 2026-07-23. Apache-2.0.
- [FULL] `gh api users/BrandonDucar/repos` - full public repo list w/ descriptions + languages, 2026-07-23.
- [PARTIAL - descriptions only, app not cloned] `github:BrandonDucar/dreamnet-whale-league` (the Svelte product). Read via repo description + the site's product-boundary section; the Svelte app source was not deep-read this pass.
