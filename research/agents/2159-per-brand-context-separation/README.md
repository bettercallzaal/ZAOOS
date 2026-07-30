# 2159 - Per-Brand Context Separation (spec for the fleet's memory layer)

**Date:** 2026-07-30
**Status:** SPEC (design only - not built). Flagged as the blocker before the fleet ingest (`ingestAllIdentities`, doc 2155 / PR #2751) can run automatically. The code change touches live ZOE memory code, so it is teed up here for SUPERVISED implementation - not built in the autonomous loop (per the unsupervised-loop rule: no auto-edits to live routes).
**Owner:** Zaal
**Siblings:** doc 2155 (per-brand Identity Kit), `bot/src/zoe/fleet.ts` (the driver), `bot/src/zoe/inbox-ingest.ts`, `bot/src/zoe/memory.ts`, `bot/src/zoe/inbox-triage.ts`.

---

## The problem

`ingestAllIdentities()` (PR #2751) can iterate the fleet and ingest each brand's mailbox - but `ingestInbox` appends every summary to ONE shared log via `appendInboxContext()` (`inbox_context.jsonl`) and dedups against ONE `readIngestedSourceIds()`. So if the fleet ingested WaveWarZ's and Sparkz's inboxes, all their mail would land in ZOE's single context, and `buildMemoryBlocks()` would inject a mix of every brand into every ZOE turn. That is why the driver is NOT wired to the scheduler yet. Each brand needs its own context log + dedup set.

## The change (backward-compatible, additive)

Add an optional `namespace` (brand slug) to the three inbox-context memory functions in `memory.ts`, defaulting to the current shared path so ZOE's behavior is unchanged when no namespace is passed:

- `appendInboxContext(record, namespace?)` -> writes `inbox_context.jsonl` (default) or `inbox_context.<namespace>.jsonl`.
- `readInboxContext(limit, namespace?)` -> reads the namespaced log.
- `readIngestedSourceIds(namespace?)` -> dedups within the namespace.
- Same for the triage pair (`appendTriageContext`, and any triage reader).

Then thread the namespace through `ingestInbox(fetchImpl, source, namespace?)` and have `ingestAllIdentities` pass a slug of each identity's `brand` (e.g. `wavewarz`). ZOE's own scheduler call passes NO namespace -> unchanged.

`buildMemoryBlocks()` stays ZOE-only (reads the default log). A per-brand agent, when built, reads its own namespaced log for its `<inbox_context>` block.

## Why additive matters

`memory.ts` is a live route - ZOE's actual inbox pipeline reads/writes it every scheduler tick. The optional-param-defaulting-to-current-path shape means: no namespace passed = byte-identical behavior. That is the only safe way to touch it. Verify with the existing `inbox-ingest.test.ts` + a new namespaced test proving two namespaces do not cross-contaminate.

## Acceptance

1. `appendInboxContext(rec)` (no namespace) writes the same `inbox_context.jsonl` as today - existing tests unchanged.
2. `appendInboxContext(rec, 'wavewarz')` writes `inbox_context.wavewarz.jsonl`; `readInboxContext(6, 'wavewarz')` reads only those; dedup is per-namespace.
3. `ingestAllIdentities` with two keyed brands produces two separate logs, zero cross-contamination (new test).
4. ZOE scheduler tick: identical to today (regression check).

## Not in scope

- Wiring the scheduler to run the fleet ingest (a separate decision once brands are provisioned + this lands).
- Per-brand persona injection into a per-brand agent's turn (the persona files exist; the agent runtime is later).

## Source

Follows doc 2155 + PR #2751 (fleet driver). Written in the autonomous build loop 2026-07-30 as a supervised-work spec, since the change edits live ZOE memory code.
