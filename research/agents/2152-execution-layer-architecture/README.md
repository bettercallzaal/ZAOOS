---
topic: agents
type: reference
status: reference
last-validated: 2026-07-30
related-docs: 2138, 2139, 2145, 2149, 2124, 2142
original-query: "Consolidate the federation + Heart + outbox work into one architecture reference for the organism's execution layer"
tier: DEEP
---

# 2152 - The ZAO execution layer - architecture reference

> One map for the whole execution layer built 2026-07-29/30 (PRs #2704-#2739). Three composing systems - the **federation boundary** (verify others' evidence), the **Heart** (own a resource exactly once), and the **transactional outbox** (act on the outside world exactly once). This is the navigable index; each subsystem's deep doc is linked. For Zaal, Brandon, and future sessions.

## The one-paragraph model

An autonomous ZAO worker **acquires a lease** on a resource (Heart), does its work, and when it must touch the outside world (send a cast, a message, a tx) it goes through the **outbox** which guarantees the action fires **exactly once** even across crashes. Every observation and action emits a **portable receipt** whose bytes are **byte-identical to DreamNet's** (federation), so another organism can **verify** what we did with only the protocol - no shared runtime, no shared secrets. Trust flows from deterministic contracts + receipts + verification, not shared infrastructure.

## The three systems

### 1. Federation boundary - "verify others' evidence, no shared runtime"
- **Canonical layer** (`src/lib/eyes/observation.ts:canonicalize`, `sha256:dreamnet-sorted-json:v0`): byte-identical to DreamNet's `canonicalJsonStringify`, proven by the cross-runtime fixtures. This is the ONE thing every other layer's hashes reduce to.
- **Spore + receipt.v1** (`src/lib/spore/`): an Observation -> Spore -> portable `dreamnet.receipt.v1`. Deterministic digest over content+issuer; immutable; replay-safe.
- **Cross-runtime verify** (`src/lib/spore/interop.ts`): ZAO verifies DreamNet receipts/artifacts and vice-versa; tamper + unsupported-schema fail closed.
- **The wire** (`src/app/api/spore/verify` POST): the externally-reachable boundary - DreamNet hits it to verify us, no secrets.
- **Live emission** (`src/lib/spore/receipt-emitter.ts`): every distributed Observation leaves as a receipt (a Bloodstream subscriber; unplug = no change).
- Deep docs: **2138** (Phase 3 conformance, 47/47), 2124 (the v0.2 spec). Status: **ZAO = first independently-operated conformant Spore node** at the hash + receipt layers.

### 2. The Heart - "own a resource exactly once"
- **Shared package** `packages/heart-fleet/` (dependency-free, consumable from both the Next app and the isolated bot): `HeartFleet` = acquire / renew / release / reclaim, with **fencing tokens** (exact-expiry ownership proof), **retry ceiling -> quarantine**, **execution receipts** (same digest family), and **contention/recovery metrics**.
- **guardIrreversible + verifyFence**: the atomic "am I still the owner right now" check before any irreversible effect.
- **executeWithLease**: acquire -> heartbeat-renew -> work(fence) -> release.
- **LivenessReclaimer**: proactive recovery - a dead-heartbeat instance's leased runs reset at once (vs waiting per-run TTL).
- **App consolidation** (doc 2149): `src/lib/heart` now DELEGATES acquire / reclaimExpired / reclaimDeadInstance to the package - ONE lease impl drives the live recovery cron + agent runner. (renew/release stay app-side pending the Option-B stricter-fencing adoption, behind the canary.)
- **5 safety properties proven** (24 tests): mutual exclusion, killed-worker recovery, stale-fence rejection (incl. the pre-reclaim zombie window), retry-dedup, receipt/state reconciliation.
- Deep docs: **2139** (extraction + properties), **2149** (the migration plan + what stays). Rollout: canary (`ZOE_HEART_FLEET_CANARY`, flag-off).

### 3. The transactional outbox - "act on the outside world exactly once"
- **Durable ledger** `effect_intents` (migration `scripts/2148`): PK `(run_id, effect_key)` IS the at-most-once lock - `INSERT ON CONFLICT DO NOTHING` = atomic claim.
- **Deterministic keys** (`effectKey(channel, businessIdentity)`): NEVER a timestamp - a retry recomputes the same key and dedupes.
- **sendOnce**: claim -> verifyFence -> markDispatched -> the ONE external call -> markCommitted(evidence). Crash-safe at every step.
- **Reconciler** (`reconcileOutbox`): resolves rows stuck in `dispatched` after a crash via a per-channel probe - `sent` -> commit with recovered evidence, `not-sent` -> reopen, `unknown` (e.g. Telegram has no probe) -> **never resend**, abandon past the ceiling (at-most-once wins over maybe-delivered).
- **Live wire**: flag-gated (`ZOE_OUTBOX_DEMO`) demo through the canary proves it on the real table.
- Deep doc: **2145** (design + protocol + crash analysis). The commit emits a receipt.v1 -> outbound actions are federation-verifiable ("receiptable by design").

## How they compose (the whole loop)

```
observe -> receipt (federation-verifiable)
   |
acquire lease (Heart) -> fencing token
   |
do work under the lease (heartbeat-renewed)
   |
touch the outside world -> sendOnce (outbox):
      claim(run,effectKey) -> verifyFence -> dispatch -> SEND -> commit(evidence)+receipt
   |
release lease
   |
[crash anywhere] -> LivenessReclaimer resets the lease + reconcileOutbox resolves the intent
```

Every arrow is receipted; every receipt is byte-identical to what DreamNet would compute; every external action fires at most once. That is the execution layer.

## What's still open (the honest edges)

- **Option B** (Zaal's call): adopt the package's stricter fencing (exact-expiry renew/release) + quarantine on the live recovery cron, behind the canary. Currently the shim preserves the looser app behavior.
- **Outbox go-live**: apply `scripts/2148`, flip `ZOE_HEART_FLEET_CANARY` + `ZOE_OUTBOX_DEMO`, restart the bot.
- **Real channel probes**: only Telegram is wired (no probe -> unknown). Farcaster/mail/on-chain have queryable evidence and deserve real probes when a real outbox consumer lands (not before - no premature adapters).
- **DreamNet ratifies the receipt.v1 interop digest** in the SDK (ours is proposed).
- **Federation Phases 4-5**: the full loop + `claim.v1`.

## The PRs (this session's execution-layer work)

Federation: #2704 (Phase 3), #2713 (live receipts), #2714/#2722 (verify endpoint + tests).
Heart: #2705 (extraction), #2709 (canary), #2730 (Option-A shim), #2731 (liveness port), #2734 (app liveness delegate).
Outbox: #2719 (design), #2727 (build), #2732 (live wire), #2736 (reconciler).

## Sources

- First-party: every file + PR cited, built + verified this session [FULL]
- Deep docs 2138 / 2139 / 2145 / 2149 (the per-subsystem detail this indexes), 2124 (the federation spec), 2142 (the run's progress report)
