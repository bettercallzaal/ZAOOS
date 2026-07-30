---
topic: agents
type: design
status: design-not-built
last-validated: 2026-07-30
related-docs: 2139, 2142, 2138, 2064
original-query: "The transactional-outbox: productionize the idempotent side-effect protocol (doc 2142 next focus) - durable intents, deterministic keys, external reconciliation, at-most-once side effects"
tier: DEEP
---

# 2145 - Transactional outbox - the durable idempotent side-effect protocol (DESIGN)

> The next-focus milestone from the Architect's Progress Report (doc 2142). This is a DESIGN, not built - it needs a DB migration (ask-first per CLAUDE.md). It productionizes `guardIrreversible` (doc 2139) from in-process at-most-once into crash-safe, cross-process at-most-once for every real outbound action (Telegram/Farcaster/mail/on-chain).

## The problem, precisely

Today an autonomous action that fires an external side effect can, on a crash between "did it" and "recorded it", either double-fire (retry re-sends) or lose evidence (looks un-done). `guardIrreversible` + `MemoryEffectLedger` (doc 2139) solve this WITHIN one process lifetime; a restart wipes the ledger. The Heart lease layer (doc 2139) gives us fencing + recovery; the receipt emitter (doc 2138/PR #2713) gives us portable evidence. The outbox joins them: **the decision to send and the durable record of intent commit in the SAME transaction, and a separate fenced dispatcher performs the send exactly once.**

## Two tables (the migration - ask-first)

```sql
-- The durable intent ledger: the atomic at-most-once claim.
create table effect_intents (
  run_id          uuid not null,           -- the agent_runs row that owns this
  effect_key      text not null,           -- deterministic business identity (below)
  state           text not null default 'intent'
                    check (state in ('intent','dispatched','committed','abandoned')),
  channel         text not null,           -- 'telegram' | 'farcaster' | 'mail' | 'onchain'
  payload_digest  text not null,           -- sha256(canonical(payload)) - dreamnet-sorted-json:v0
  fence_owner     text,                    -- instance that claimed the dispatch
  fence_expires_at timestamptz,
  external_ref    jsonb,                   -- message_id / cast hash / tx hash (evidence)
  attempts        int not null default 0,
  last_error      text,
  created_at      timestamptz not null default now(),
  committed_at    timestamptz,
  primary key (run_id, effect_key)         -- the idempotency guarantee lives here
);

-- Optional: a pure outbox row per physical send attempt, for audit/replay.
create table outbox_dispatch_log (
  id              uuid primary key default gen_random_uuid(),
  run_id          uuid not null,
  effect_key      text not null,
  attempt         int not null,
  outcome         text not null,           -- 'sent' | 'failed' | 'deduped' | 'reconciled'
  at              timestamptz not null default now(),
  detail          jsonb
);
```

The `effect_intents` PRIMARY KEY `(run_id, effect_key)` IS the idempotency lock: `INSERT ... ON CONFLICT DO NOTHING` is the atomic "claim once" - exactly the `EffectLedger.recordOnce` contract the heart-fleet package already defines (`packages/heart-fleet/src/execute.ts`). So the durable ledger is a drop-in `EffectLedger` implementation; no interface change.

## Deterministic idempotency keys (the load-bearing rule)

`effect_key = channel + ':' + canonical(business-identity)`. NEVER a timestamp or UUID - a retry MUST recompute the same key. Examples:
- Telegram: `telegram:<chatId>:<sha256(canonical(text))>`
- Farcaster cast: `farcaster:cast:<sha256(canonical({text, embeds, channel}))>`
- Mail: `mail:<toHash>:<sha256(canonical({subject, body}))>`
- On-chain: `onchain:<chainId>:<contract>:<method>:<sha256(canonical(args))>`

`deterministicResourceId(kind, key)` (heart-fleet `canonical.ts`, DreamNet-conformant) is the helper. Two attempts of the "same" action collide on the key -> the second is deduped.

## The protocol (ordering is the whole thing)

```
1. DECIDE + CLAIM (one transaction):
   INSERT effect_intents (run_id, effect_key, channel, payload_digest, state='intent')
   ON CONFLICT (run_id, effect_key) DO NOTHING RETURNING *;
   - 0 rows returned  -> already claimed -> DEDUPE, stop (at-most-once).
   - 1 row returned    -> we own this send.

2. FENCE (lease-guard, doc 2139):
   verifyFence(fence) against agent_runs - if we lost the lease, ABORT (do NOT send).
   Claim the dispatch: UPDATE ... SET state='dispatched', fence_owner, fence_expires_at,
     attempts=attempts+1 WHERE (run_id,effect_key) AND state='intent'.

3. SEND (the ONE external call):
   perform the actual Telegram/FC/mail/chain call.

4. COMMIT EVIDENCE (one transaction):
   UPDATE effect_intents SET state='committed', external_ref=<message_id/hash>,
     committed_at=now() WHERE (run_id,effect_key) AND state='dispatched';
   emit a receipt.v1 (doc 2138) whose subject includes the effect_key + external_ref.
```

Crash at any step:
- After 1, before 3: row is `intent`/`dispatched` with no `external_ref` -> the RECONCILER resolves it.
- After 3, before 4: the send happened but state is `dispatched` -> reconciler queries the external system, finds the message, marks `committed`. NO resend.
- A naive retry always hits step 1's conflict and dedupes.

## External reconciliation (closes the crash window)

A lease-guarded reconciler on the recovery-cron cadence (doc 2139) scans `effect_intents WHERE state='dispatched' AND fence_expires_at < now()`:
- Query the external system by a channel-specific probe (Telegram: was a message with this content sent to this chat recently? FC: does the cast hash exist? chain: is the tx mined?).
- Found -> `committed` + backfill `external_ref`.
- Provably not sent + lease long dead -> back to `intent` for one bounded re-dispatch, or `abandoned` past the attempt ceiling (heart-fleet retry-ceiling semantics).

Reconciliation is best-effort but MONOTONIC: an intent only moves intent -> dispatched -> committed | abandoned, never backward once committed. The receipt makes committed states externally auditable.

## Why this composes cleanly with what shipped

- **Heart fleet (PR #2705):** `guardIrreversible` already takes an `EffectLedger`; the durable ledger is the production impl of that exact interface. Fencing + retry ceiling + quarantine come for free.
- **Receipt emitter (PR #2713):** the commit step emits a `dreamnet.receipt.v1` - so every real outbound action becomes portable, Phase-3-verifiable evidence (doc 2138). The outbox is where "receiptable by design" (the WaveWarZ thesis) actually lands for sends.
- **Mouth (project_brandon_mouth_organ):** the governed comms organ's `CommunicationEnvelope` is the natural PAYLOAD of an outbox row; the outbox is Mouth's durable substrate. Design them together.
- **Canonical layer (PR #2704):** payload_digest + effect_key both use `sha256:dreamnet-sorted-json:v0`, so keys reconcile across the fleet and across the federation boundary.

## What stays human-gated (unchanged)

The outbox is a DELIVERY guarantee, not an authorization change. Money/public/on-chain sends still require the existing approval gate BEFORE an intent is ever written. The outbox guarantees an APPROVED action fires exactly once - it never approves anything.

## Rollout (all ask-first / gated)

1. Migration for the two tables (ask-first) + `DurableEffectLedger implements EffectLedger` in `packages/heart-fleet`.
2. Wire ONE low-stakes channel first (internal Telegram status) through the full protocol behind a flag, watch the intents table.
3. The reconciler on the recovery cron.
4. Graduate FC/mail/on-chain one channel at a time, each behind its own flag.

## Open questions for Zaal

1. Approve the two-table migration when he's up (nothing built until then).
2. Channel probe strategy for reconciliation - some externals (Telegram) have no "did I send X" query; the fallback is a short dedup window + accept rare double-sends on that channel only, or store a client-side idempotency token where the API supports one (FC/Stripe do; Telegram does not). Per-channel decision.
3. Build with Mouth, or ship the outbox first and let Mouth adopt it? (Recommend: outbox first, minimal, Mouth governs on top.)

## Architect's note

This is the single highest-leverage safety upgrade for the autonomous fleet: it is what makes "an agent sent the cast" a fact with evidence rather than a hope. It is deliberately unbuilt tonight - it touches the DB and real outbound, both gated. The design is complete enough to build from directly.

## Sources

- Doc 2139 (Heart fleet + guardIrreversible + the protocol sketch this expands), doc 2142 (named this as next focus), doc 2138 (receipts the commit emits), project_brandon_mouth_organ (the comms organ this underpins)
- First-party: `packages/heart-fleet/src/execute.ts` (the EffectLedger interface), read this run [FULL]
