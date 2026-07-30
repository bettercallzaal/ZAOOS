---
topic: agents
type: decision
status: research-complete
last-validated: 2026-07-30
related-docs: 2124, 2138, 2030, 2064
original-query: "Extract the Heart lease-manager into a shared fleet package (fencing, retry ceilings, receipts, metrics, irreversible-side-effect protection), canary rollout, prove the 5 safety properties"
tier: DEEP
---

# 2139 - Heart fleet extraction: packages/heart-fleet + canary + 5 safety properties PROVEN

> **Goal:** One lease implementation for the whole fleet instead of per-surface copies, rolled out canary-first, with the safety properties proven as executable tests, plus the idempotent side-effect protocol design.

## What shipped

**`packages/heart-fleet/`** - dependency-free TypeScript (no zod, no supabase import), consumable from BOTH builds by direct TS import (the bot has no `@/lib` alias; the package needs no alias):

| Module | What |
|--------|------|
| `types.ts` | Run/row/status types, `FencingToken`, `HeartReceipt`, `HeartMetrics`, the `LeaseStore` contract |
| `lease.ts` | `HeartFleet`: acquire / renew / release / reclaimExpired - all conditional-update based, fenced, receipted, metered; retry ceiling -> `quarantined` |
| `execute.ts` | `executeWithLease` (acquire -> heartbeat -> work(fence) -> release) + `guardIrreversible` (fence verify + at-most-once effect ledger) |
| `memory-store.ts` | Deterministic in-memory store (injectable clock) - property proofs + dry runs |
| `supabase-store.ts` | Adapter over an INJECTED supabase client (agent_runs); conditions map to one atomic SQL UPDATE |
| `canonical.ts` | The DreamNet-conformant canonicalize + `deterministicResourceId(kind, key)` |

**Canary (`bot/src/zoe/heart-canary.ts`):** flag `ZOE_HEART_FLEET_CANARY` (default OFF - merging changes nothing). When enabled: ensures ONE canary row in agent_runs (deterministic idempotency key, race-safe find-or-create), runs a lease-guarded no-op through the real table, logs receipts + metrics. Two instances racing = one `lease-held` skip logged, which is exactly the property being canaried. Not yet wired into any tick - the call site lands when Zaal flips the flag (one line).

## The 5 safety properties - PROVEN (bot/src/zoe/__tests__/heart-fleet-properties.test.ts, 24 tests green)

1. **Mutual exclusion** - concurrent acquires: exactly 1 win, 1 collision; second `executeWithLease` skips `lease-held`.
2. **Killed-worker recovery** - expired lease reclaimed to `ready` (retries+1), re-acquirable; a RENEWED lease is never reclaimed; retry ceiling quarantines a bouncing run (quarantined is not acquirable).
3. **Stale worker cannot commit** - after reclaim + re-acquire, the old fence fails `verifyFence`/`renew`/`release`; `guardIrreversible` never fires the effect on a stale fence; an expired-but-unreclaimed fence is ALSO rejected (no zombie window - `verifyFence` checks expiry, not just ownership).
4. **Retries do not duplicate external actions** - effect committed under attempt 1, worker crashes, retry on another worker dedupes on the same effectKey: effect fired exactly once.
5. **Receipt/final-state reconciliation** - lifecycle receipts match final row (completed = 1 acquired + 1 released; crash-recovery = acquired -> reclaimed -> acquired -> released, retries=1); every receipt digest recomputes (tamper-evident, same `sha256:dreamnet-sorted-json:v0` family as the Spore layer - doc 2138).

Proofs run on `MemoryLeaseStore`; race safety reduces to the `LeaseStore.conditionalUpdate` contract, which the Supabase adapter implements as single atomic SQL UPDATEs (same semantics the app-side Heart already relies on in prod).

## Rollout ladder (canary, not fleet-wide)

1. **Now (merged, inert):** package + tests + canary module, flag OFF.
2. **Canary live:** Zaal sets `ZOE_HEART_FLEET_CANARY=true` on the VPS + adds the one-line beat call; watch receipts/metrics in logs for a few days; second-instance collision logs are SUCCESS evidence.
3. **First real consumer:** repo-improver scout or error-remediation rail wraps its tick in `executeWithLease` (closes the standing "nothing acquires leases" gap - doc 2124 - on the bot side).
4. **App migration:** `src/lib/heart/` delegates to the package - DEFERRED until the app vitest is fixed (rolldown binding), because the 14-scenario recovery suite must be runnable to verify that refactor. Not done tonight on purpose (silent-failure guard: no refactor without a runnable gate).

## The idempotent side-effect protocol (design - task 3 of Brandon's directive)

`guardIrreversible` v1 ships the shape; production hardening needs four pieces:

1. **Durable intents** - `effect_intents` table: `(run_id, effect_key) PRIMARY KEY, fence_owner, fence_expires_at, state intent|committed|reconciled|abandoned, evidence jsonb, created_at, committed_at`. `recordOnce` = `INSERT ... ON CONFLICT DO NOTHING` (the atomic claim); the MemoryEffectLedger interface is already exactly this.
2. **Deterministic idempotency keys** - `effectKey = kind + canonical(business identity)` (e.g. `send:tg:<chatId>:<contentDigest>`, `spend:invoice:<id>`), NEVER timestamps/UUIDs - a retry must compute the SAME key. `deterministicResourceId` is the helper.
3. **External reconciliation** - the intent row's crash window (intent recorded, effect result unknown) is closed by a reconciler that queries the EXTERNAL system (was the TG message sent? the tx mined?) and marks `committed` or `abandoned`. Reconciler runs on the recovery cron cadence.
4. **Transactional completion evidence** - committing writes the external evidence (message id, tx hash) into the intent row in the SAME statement that flips state to `committed`; the receipt (`effect_committed`) digest covers the effect key, so evidence + receipt + row reconcile three-way.

Ordering guarantee: fence verify -> intent claim -> effect -> evidence+commit. A crash at any point either leaves a reclaimable intent (reconciler resolves) or a committed row (retry dedupes). No path fires the effect twice; no path loses evidence of a fired effect.

## Friction / honest notes

- Third `canonicalize` copy (package). Accepted deliberately: zero cross-tree imports keeps both builds happy; ALL copies are pinned byte-identical to the DreamNet fixtures by their suites - drift fails CI, not silently.
- Bot tsc has 46 PRE-EXISTING errors (discord.js types etc.) - verified identical count on the untouched clone; zero errors in package/canary files.
- `SupabaseLikeClient` is structural, not `@supabase/supabase-js` typed - the package stays dependency-free; the adapter's query-builder typing is the one place with a local cast.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Flip `ZOE_HEART_FLEET_CANARY=true` + add the one-line beat call (gated: bot deploy) | @Zaal | Ops | when reviewing |
| effect_intents migration + DurableEffectLedger (Supabase impl of EffectLedger) | @Zaal (ZOE) | Build (migration = ask-first) | next iteration |
| First real consumer: lease-wrap the repo-improver tick | @Zaal (ZOE) | Build | after canary |
| App-side src/lib/heart delegation to the package | @Zaal (ZOE) | Build | after app vitest fixed |

## Sources

- First-party: `src/lib/heart/` (lease-manager, execute-with-lease, liveness, 14-scenario suite) - read in full before extraction (rule 3)
- Doc 2124 (the standing "nothing acquires leases" gap), doc 2138 (canonical conformance the receipts reuse)
- Property proofs: this PR's `heart-fleet-properties.test.ts`, 24/24 green (run output in PR)
