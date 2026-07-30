---
topic: agents
type: decision
status: needs-zaal-decision
last-validated: 2026-07-30
related-docs: 2139, 2124, 2142
original-query: "Plan the app-side src/lib/heart migration to the shared packages/heart-fleet - the two impls' exact differences + the safe path"
tier: STANDARD
---

# 2149 - App-Heart migration plan: the two impls, their differences, the safe path

> Zaal held the migration to plan it (it's LIVE code). This is the exact-differences brief so the approach is a deliberate decision, not a surprise.

## The situation

There are TWO lease implementations, and unlike most drift, this one is LIVE:
- `src/lib/heart/` (the app-side original) - wired into `src/app/api/cron/heart-recovery/route.ts` (the recovery cron) and `src/lib/agents/runner.ts` (`executeWithLease` - so agents DO acquire leases; the standing "nothing acquires leases" gap is partially closed here).
- `packages/heart-fleet/` (extracted 2026-07-30, PR #2705) - the newer, stricter, dependency-free shared package. Consumed by the ZOE canary + the outbox (#2727). NOT yet used by the app.

Both are tested (app: 57 tests incl. the 14-scenario recovery-acceptance suite; package: 24 property tests). Neither is wrong. They have DIVERGED in behavior.

## The exact behavior differences

| Concern | app `src/lib/heart` | package `heart-fleet` | Migration impact |
|---------|---------------------|------------------------|------------------|
| Ownership proof | `lease_owner` string only | explicit `FencingToken` (owner + exact expiry) | package rejects a stale holder more precisely; app relies on expiry-window checks |
| Renew/release fencing | owner-eq + status-in | owner-eq + EXACT-expiry-eq | package is stricter - a token whose expiry moved is rejected even by the same owner |
| Reclaim of expired leases | re-ready + `retries+1`, **no ceiling** | re-ready + `retries+1`, **quarantines at maxRetries** | **BEHAVIOR CHANGE on the live recovery cron**: a poisoned run that today bounces forever would start going to `quarantined`. Good, but it's a change. |
| Dead-instance reclaim | `reclaimDeadInstanceRuns` (liveness.ts) - proactive, by stale heartbeat | **NOT in the package** | the package would need this ported before it can fully replace the app cron |
| Receipts / metrics | none | execution receipts (dreamnet digest) + contention metrics | pure addition |
| verifyFence (pre-effect) | none | atomic re-verify right before an irreversible effect | pure addition (the outbox uses it) |
| Storage | direct `getSupabaseAdmin()` calls | injected `LeaseStore` | delegation needs a `SupabaseLeaseStore` wrapping the admin client |

## The one blocker for a clean swap

The package has NO dead-instance reclaim (`reclaimDeadInstanceRuns`). The live recovery cron calls both `reclaimExpiredLeases` AND `reclaimDeadInstanceRuns`. So the package cannot fully replace the app cron until dead-instance reclaim is ported into it. That is a ~1 file port (liveness.ts -> a package `LivenessReclaimer` over the LeaseStore).

## The three options (recompiled from the live-code reality)

### Option A - Behavior-preserving shim (safest)
Make the app's `acquire/renew/release` delegate to the package via a `SupabaseLeaseStore` wrapping `getSupabaseAdmin()`, keeping the app's EXACT signatures and CURRENT behavior. Preserve no-quarantine by constructing `HeartFleet({ maxRetries: Infinity })` for the reclaim path. Port `reclaimDeadInstanceRuns` into the package OR leave it in the app calling the package store. All 57 tests stay green unchanged; zero live-behavior change; one lease core.
- Pro: no live-behavior change, fully test-covered, incremental.
- Con: keeps the app's weaker fencing (no exact-expiry token) until a later step; doesn't gain quarantine yet.

### Option B - Adopt package semantics (better, riskier)
Fully adopt the package: fencing tokens threaded through the agent runner, quarantine live on the recovery cron, receipts emitted. Requires: (1) port dead-instance reclaim into the package, (2) thread `FencingToken` through `runner.ts`, (3) reconcile the recovery-acceptance suite to expect quarantine at the ceiling, (4) verify the cron's new quarantine path against a real poisoned run.
- Pro: strictly safer runtime (no infinite retry, precise fencing, audit receipts).
- Con: changes live recovery behavior; needs careful test reconciliation + a canary before it drives the real cron.

### Option C - Deprecate-in-place
Leave `src/lib/heart` as-is (it works), and mandate the package for all NEW lease work. Delete the app copy only once every caller is migrated. No rewrite now.
- Pro: zero risk today.
- Con: two impls persist (drift risk), the whole point was consolidation.

## Recommendation

**A now, B next.** Ship the behavior-preserving shim first (one lease core, no live change, fully proven), then adopt quarantine + fencing as a deliberate follow-up behind the canary (the canary already exists - PR #2709). This gets consolidation immediately at zero risk and stages the behavior upgrade safely.

## If Option A: the concrete steps
1. Port `reclaimDeadInstanceRuns` into `packages/heart-fleet` as a `LivenessReclaimer` over `LeaseStore` (+ its tests).
2. Wrap `getSupabaseAdmin()` in `SupabaseLeaseStore`; re-implement the app's exported functions as thin delegations preserving signatures + return shapes.
3. Construct the reclaim `HeartFleet` with `maxRetries: Infinity` to preserve no-quarantine.
4. Run the full 57-test app-heart suite + the recovery-acceptance suite - must stay green with zero edits.
5. One PR, behind no flag (behavior-identical), reviewed by Zaal.

## Sources

- First-party: `src/lib/heart/{lease-manager,liveness,execute-with-lease}.ts`, `packages/heart-fleet/src/{lease,execute}.ts`, and the two callers (`heart-recovery/route.ts`, `agents/runner.ts`), all read this run [FULL]
- Doc 2139 (the package's design + safety properties), doc 2124 (the standing lease-wiring gap)
