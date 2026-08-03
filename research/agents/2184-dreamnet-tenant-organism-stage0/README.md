---
topic: agents
type: decision
status: research-complete
last-validated: 2026-08-03
related-docs: "2138, 2139, 2030, 2178"
original-query: "Build Zaal/ZAO Stage 0 as DreamNet's first reusable external tenant-organism template (Brandon spec: DreamNet Tenant-Organism Template v1)."
tier: DISPATCH
---

# 2184 - DreamNet Tenant-Organism Template v1 - ZAO Stage 0 (Architect's Report)

> **Goal:** Prove ZAO can be DreamNet's first sovereign external tenant - using selected DreamNet protocols through a governed boundary, without surrendering identity, memory, authority, or survival. Reference implementation + read-only canary, flag-gated OFF, nothing deployed.

## Plain English first

DreamNet wanted a repeatable way for an independently-run "organism" (like ZAO) to plug
into its network - share some memory, submit evidence, receive knowledge, borrow a
capability - **without** becoming an internal DreamNet worker or getting the keys to
DreamNet's private systems. The principle: **shared protocols and selected capabilities;
separate sovereignty and private state.**

This Stage 0 builds the generic **tenant-organism framework** (reusable by any future
organism, not ZAO-specific) plus a **ZAO tenant profile** (the config that makes it ZAO).
It reuses the Spore trust layer and Heart lease layer that already exist, and adds the
missing tenant pieces: a sovereign identity manifest, a boundary matrix, four memory
classes with an export gate, namespace isolation, a capability-lease with a
no-self-approval rule, and one read-only canary that a signed envelope survives
verification. **Nothing here deploys, spends, posts, or touches a wallet.** Everything is
behind flags that default OFF.

The important part for Brandon: ZAO stays sovereign. ZAO owns its identity, keys, memory,
scheduling, execution, recovery, storage, and economic authority. If the DreamNet gateway
disappears, ZAO keeps running. DreamNet is a governed federation boundary, not a
dependency for ZAO's survival.

## What ZAO can and cannot access (the boundary matrix)

This table is authoritative - the code and gateway policy match it (generated from
`src/lib/dreamnet/tenant/boundary-matrix.ts`). `gated` = allowed only through an explicit,
receipted approval. Default is `no` (fail closed).

| Resource | ZAO R | ZAO W | DN R | DN W | Transport | Approval | Retention | Notes |
|---|---|---|---|---|---|---|---|---|
| private ZAO memory | yes | yes | no | no | - | n/a | ZAO-controlled | Never crosses the boundary. Not indexed by DreamNet. |
| partner-shared memory | yes | yes | gated | no | Federation Gateway | object-level export approval | finite TTL | `memory.shared.<tenant>.*`; exact audience + revocation ref. |
| public memory | yes | yes | yes | no | Federation Gateway | publication intent + scans | per license | secret+PII scan required. |
| ephemeral task state | yes | yes | no | no | - | n/a | auto-expiry | Cannot silently become canonical or shared. |
| Proof Drops | yes | yes | yes | no | Federation Gateway | signed envelope | per policy | `proofdrops.<tenant>.*`. |
| receipts | yes | yes | yes | no | Federation Gateway | signed envelope | immutable | terminal receipts never erased. |
| claims | yes | yes | gated | no | Federation Gateway | independent verification | per policy | no self-certification. |
| verification results | yes | no | yes | yes | Federation Gateway | n/a | per policy | DreamNet/independent verifier writes; ZAO consumes. |
| Knowledge Crystals | gated | no | yes | yes | Federation Gateway | explicit selection | per review | Imported UNVERIFIED; local acceptance is sovereign. |
| Living Papers | gated | no | yes | yes | Federation Gateway | explicit selection | per review | not auto-canonical. |
| Warper Keeper Trappers | gated | gated | yes | yes | Federation Gateway | archive + capability inspection | per policy | handler allowlist, sandboxed extraction. |
| University evidence | yes | gated | yes | yes | Federation Gateway | evaluation request | per policy | candidate evidence only. |
| capability leases | yes | no | yes | yes | Federation Gateway | independent approval | until expiry/revoke | no self-approval; bounded. |
| Whale League paper research | yes | gated | yes | no | Federation Gateway | thesis verification | per policy | `simulationOnly=true`, no wallets. |
| wallets | no | no | no | no | - | FORBIDDEN | n/a | Never accessible. No keys, no signing. |
| economic actions | no | no | no | no | - | FORBIDDEN | n/a | No trades/transfers/deploys. Paper only. |
| social actions | no | no | no | no | - | FORBIDDEN | n/a | No public posting in Stage 0. |
| deployment | no | no | no | no | - | FORBIDDEN | n/a | No production deploy authority. |
| telemetry | yes | yes | gated | no | Federation Gateway | tenant-scoped | per policy | tenant-scoped only. |
| raw logs | yes | yes | no | no | - | n/a | ZAO-controlled | never exported raw. |
| prompts | yes | yes | no | no | - | n/a | ZAO-controlled | private prompts never cross. |
| PII | yes | yes | no | no | - | FORBIDDEN | ZAO-controlled | raw PII never exported (scan gate). |
| secrets | no | no | no | no | - | FORBIDDEN | n/a | no keys/tokens ever cross. |

## How sovereignty, shared memory, and revocation work

- **Sovereignty** is a hard schema invariant: the `TenantOrganismManifestV1` requires every
  ownership flag (`ownsIdentity`, `ownsMemory`, `ownsScheduling`, `ownsExecution`,
  `ownsRecovery`, `ownsStorage`, `ownsEconomicAuthority`) to be literally `true`. A manifest
  that surrenders any of them fails to parse. Status may not exceed `CANARY_APPROVED` in
  Stage 0.
- **Shared memory** has four classes: PRIVATE (never crosses), EPHEMERAL (never silently
  durable/shared), PARTNER_SHARED and PUBLIC (may cross, only through the export gate). The
  export gate fails closed: non-exportable class, empty audience/purpose, or a failing
  secret/PII scan all block the export. Imports arrive as `IMPORTED_UNVERIFIED` and never
  auto-become canonical - local acceptance is ZAO's sovereign decision.
- **Revocation** is enforced by the Spore trust layer's `RevocationResolver`: a revoked
  issuer key makes envelope verification fail closed. Operator controls (pause / revoke /
  rollback refs) are declared in the manifest for the gateway to honor.

## What the canary proved (evidence)

The read-only Spore canary reuses the existing `verifyEnvelopeWithTrust` trust layer, so the
adversarial matrix runs through the same code that guards real envelopes. **32/32 tests pass,
0 typecheck errors** (`vitest run src/lib/dreamnet/tenant/`, `tsc --noEmit` clean):

- valid tenant-scoped signed envelope -> ACCEPTED
- wrong audience -> REJECTED
- replay (same nonce twice) -> second not ACCEPTED
- expired envelope -> REJECTED
- revoked key -> REJECTED
- altered payload -> REJECTED
- namespace escapes (wildcard, `..`, `%2e`, cross-tenant, prefix-collision `spore.zaalX`,
  forbidden `dreamnet.internal`/`wallets`/`admin`/`deployments`) -> all REJECTED
- memory export gate: PRIVATE/EPHEMERAL never export; secret + PII content blocked; clean
  PUBLIC allowed
- capability lease: self-approval and self-certification (producer = sole evaluator)
  rejected; independent approver allowed; Stage 0 constraints (read-only / $0 / no public)
  enforced; lifecycle transition graph enforced

The canary is side-effect-free: in-memory resolvers only, no wallet, no network, no DB, no
post, no deploy. It does not run unless `DREAMNET_TENANT_CANARY_ENABLED=true` (default OFF).

## Stage 0 gates passed

ZAO remains independently operable; all federation access is modeled through the gateway; no
forbidden credential/datastore access is granted; all four memory classes enforced; every
shared object carries required policy metadata (schema-enforced); namespace isolation
survives the adversarial tests; the canary completes without side effects; no agent
self-certifies; operator pause/revoke/rollback refs are declared. **Not yet met (by design):**
DreamNet-side quorum approval of the exact commit before any production deployment (spec
section 18) - Stage 0 does not deploy.

## Security findings

- The Spore trust layer's freshness check applies a 5-minute clock skew (`nowSkewMs`
  default). Acceptable for Stage 0; note it when tightening.
- Secret/PII scans here are regex gates mirroring `secret-hygiene.md` / `pii-hygiene.md`;
  they are a floor, not a guarantee - the PII allowlist redaction step runs BEFORE this gate.
- Trapper sandboxed extraction and Whale paper-research are modeled as boundary rows +
  schemas but the executable sandbox is NOT built in Stage 0 (marked below).

## Reusable framework vs ZAO-specific config

- **Reusable (no ZAO dependency):** everything in `src/lib/dreamnet/tenant/` - manifest
  schema, boundary-matrix, memory classes + export/import policy, namespace provisioner,
  capability-lease + guards, canary harness, flags.
- **ZAO-specific:** `tenants/zaal/profile.ts` only (the manifest instance + allowed
  prefixes). A second organism onboards by adding `tenants/<name>/` + its identity - no fork.

## What remains unproven (honest)

- Live DreamNet-side gateway (this is ZAO's side + an in-memory boundary; the real gateway
  is DreamNet's).
- Executable Trapper sandbox + a live Whale paper-research round (schemas + boundary present,
  runtime deferred).
- Durable effect-intents backing (doc 2139 migration pending) for a persistent canary.
- Signed shared-memory export end-to-end through a live gateway (contract present; wiring is
  Stage 1).

## Next milestone + 3 ranked alternatives

1. **(highest leverage) Tenant onboarding kit** - provision a SECOND organism from
   `tenants/<name>/` config alone, proving the framework is truly reusable (spec's stated
   next deliverable). Cheap, high signal for DreamNet.
2. Live gateway round-trip - wire the canary to the real DreamNet Federation Gateway (needs
   DreamNet's endpoint + a quorum-approved commit).
3. Trapper sandbox - the executable handler-allowlisted extraction round trip.

## Can a second tenant onboard now?

Framework-wise, yes - add `tenants/<name>/profile.ts` + identity; no gateway fork. The
missing piece is the live gateway on DreamNet's side.

## Self-critique + simpler alternative

- The four memory classes + shared-memory contract are heavier than Stage 0 strictly needs;
  a simpler v0 could ship PRIVATE/PUBLIC only. Kept all four because the export gate is the
  whole point and EPHEMERAL/PARTNER_SHARED are where leaks happen.
- Regex secret/PII scans are a floor; a real deployment wants entropy + named-entity checks.
- The canary is in-memory; a persistent canary needs the effect-intents migration (2139).

## Next logical progression (no new prompt needed)

Build the tenant onboarding kit (#1) - it is the cheapest proof that this is a *template*,
not a one-off ZAO integration, and it is exactly what makes a second organism possible.

## Also See

- [Doc 2138](../2138-spore-phase3-cross-runtime-conformance/) - Spore Phase 3 (47/47)
- [Doc 2139](../2139-heart-fleet-extraction-canary/) - Heart lease/execution layer
- [Doc 2030](../../*/2030-*/) - DreamNet Public Core organism contract

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Merge PR (Stage 0 framework + canary, flag OFF) | Zaal | PR | after review |
| Send Brandon the Stage 0 status update | Zaal | outbound (gated) | 2026-08-03 |
| Build tenant onboarding kit (second organism from config) | Zaal | Stage 1 | wontfix until Brandon acks |

## Sources

- Brandon spec "DreamNet Tenant-Organism Template v1 / Zaal Stage 0" (pasted 2026-08-03) [FULL]
- Live repo Spore trust layer `src/lib/spore/trust.ts` (`verifyEnvelopeWithTrust`) [FULL]
- Heart lease layer `packages/heart-fleet/src/lease.ts` [FULL]
