---
topic: technology, agents, zoe
type: architecture
status: DO NOW — Phase 1 manifest complete; Phase 2 wires handlers; Phase 3 activates
last-validated: 2026-07-18
related-docs: 1512-zol-dreamloops-activation, 1269-zol-farcaster-music-scout-jul2026, 892-being-an-agent-on-farcaster-2026
board-task: ZOE loop as a DreamLoop — port the VPS work-loop into a bounded DreamLoops state machine (evidence-gated)
action-owner: Zaal (review manifest + approve Phase 2 handler build)
---

# 1527 — ZOE Work-Loop as a DreamLoop: Bounded State Machine Port

> **Goal:** Replace ZOE's imperative `work-loop.ts` (file-lock + flat Node.js) with a DreamLoop-style bounded state machine. Same pipeline (`dispatchPlan → commitResearchDoc → Telegram notify`), but with explicit `checks`, `limits`, `evidence_outputs`, and `blocked_actions` — making ZOE's autonomous work the same auditable, composable pattern as ZOL's DreamLoops.

---

## Current State: ZOE's Imperative Work-Loop

`bot/src/zoe/work-loop.ts` (VPS) runs on the ZOE cron scheduler (`scheduler.ts`). It's called via `runWorkTick(deps)` on each cron tick. What it does:

| Step | Code path | Mechanism |
|------|-----------|-----------|
| 1. Queue check | `readQueue()` → `~/.zao/zoe/work-queue.json` | If empty → return (no-op) |
| 2. Daily cap check | `countToday()` → `~/.zao/zoe/work-loop-count.json` | If `>= DAILY_CAP` (default 6) → return + log |
| 3. Lock | `acquireLock()` → `~/.zao/zoe/work-loop.lock` | If locked (< 30min stale) → skip |
| 4. Item claim | `q[0]` (FIFO pop) | Assigns research topic to `ctx: ZoeContext` |
| 5. Plan construction | Hardcoded `DecompositionPlan` | Forces `research-worker` subtask (bypasses reclassify) |
| 6. Dispatch + commit | `dispatchPlan()` → `commitResearchDoc()` | Opens ZAOOS PR, returns `{ num, prUrl }` |
| 7. Report | `reportFor(item, deps)()` | Sends result to Telegram (reply target > research topic > Zaal DM) |
| 8. Queue update | `writeQueue(q.filter(x => x.id !== item.id))` | Dequeues completed item |
| 9. Bump counter | `bumpToday(date)` | Increments daily count |
| 10. Release lock | `releaseLock()` | Deletes lock file |

**Failure handling:** On error, item is removed from queue (no infinite retry) and error is reported to Telegram.

---

## Why Port to DreamLoop?

| Pain point | Current work-loop | DreamLoop fix |
|------------|------------------|---------------|
| Invisible spend | Cap only enforced by file counter — miscount = runaway | `limits.max_steps` enforced by runner; `budget.read` step makes cap explicit |
| No audit trail | Errors logged to `console.error`, nothing persists | Every run produces a receipt in the state store |
| Opaque blocked actions | Trust is implicit — no formal list of what ZOE cannot do | `blocked_actions` array is visible in the manifest; runner enforces it |
| Not composable | `runWorkTick` is a one-off function, not reusable | DreamLoop manifests compose with other loops (e.g., `project-continuity-resume` can re-queue items) |
| No evidence gate | Loop runs whenever queue is non-empty | Explicit `checks` array = pre-conditions validated before any step runs |
| Promotion path missing | "Production" = just runs on VPS | `draft → rehearsed → active_local → live_guarded` mirrors ZOL's pattern |

---

## Proposed Manifest

```json
{
  "schema": "dreamnet.dreamloop.v1",
  "loop_id": "zoe-work-loop-v1",
  "title": "ZOE Work Loop (Bounded Research Cycle)",
  "version": "1.0.0",
  "status": "draft",
  "owner": "zoe-agent-v1",
  "stewards": ["zaal"],
  "permission_tier": "local_draft_write",
  "trigger": "cron tick (ZOE scheduler, every 2h) or operator enqueue",
  "inputs": [
    "current_date (YYYY-MM-DD)",
    "daily_cap (default: 6, env: ZOE_WORKLOOP_DAILY)"
  ],
  "context_sources": [
    "~/.zao/zoe/work-queue.json",
    "~/.zao/zoe/work-loop-count.json",
    "~/.zao/zoe/work-loop.lock (stale check)"
  ],
  "allowed_actions": [
    "artifact.local.write",
    "memory.read",
    "queue.read",
    "queue.pop",
    "receipt.local.write",
    "research.dispatch",
    "state.local.read",
    "state.local.write"
  ],
  "blocked_actions": [
    "cloud.mutate",
    "deployment.production.write",
    "fund.transfer",
    "notification.send.without_approval",
    "package.install",
    "public.publish.without_approval",
    "queue.enqueue.arbitrary",
    "secret.value.read",
    "self.modify.live",
    "signer.change",
    "wallet.sign"
  ],
  "checks": [
    "queue.length >= 1",
    "daily_count < daily_cap",
    "no_active_lock (or lock_stale > 30min)",
    "item.kind == 'research' (only research allowed)"
  ],
  "evidence_outputs": [
    "item-id",
    "item-input (first 80 chars)",
    "research-pr-url",
    "research-doc-num",
    "daily-count-before",
    "daily-count-after",
    "wall-time-ms",
    "dispatch-status"
  ],
  "receipt_outputs": [
    "zoe-work-loop receipt (per run)"
  ],
  "knowledge_state_outputs": [
    "queue depth after run",
    "daily cap remaining",
    "PR opened (or failed reason)"
  ],
  "execution_trace_outputs": [
    "zoe-work-loop trace"
  ],
  "memory_routes": [
    "episodic: research topics processed (for dedup)",
    "durable: daily work counts (across sessions)"
  ],
  "cooldown": "per-tick (no cooldown — cap enforces rate)",
  "failure_modes": [
    "queue empty → no-op (not a failure)",
    "daily cap hit → no-op (not a failure)",
    "dispatch failed → remove item + report + record failure receipt",
    "commitResearchDoc failed → report error to Telegram + record failure receipt",
    "runner timeout → release lock + record timeout receipt"
  ],
  "promotion_path": "draft -> rehearsed -> active_local -> live_guarded",
  "last_reviewed": "2026-07-18",
  "limits": {
    "max_wall_time_ms": 1800000,
    "max_steps": 6,
    "max_retries_per_step": 1
  },
  "steps": [
    {
      "id": "check-queue-and-cap",
      "handler": "queue.read",
      "permission": "queue.read",
      "with": {
        "queueKey": "zoe-work-queue",
        "capKey": "zoe-daily-counter",
        "requireKind": "research"
      },
      "retry": { "max_attempts": 2 }
    },
    {
      "id": "acquire-lock",
      "handler": "state.local.write",
      "permission": "state.local.write",
      "with": {
        "stateKey": "zoe-work-loop-lock",
        "operation": "lock",
        "staleSec": 1800
      },
      "retry": { "max_attempts": 1 }
    },
    {
      "id": "dispatch-research",
      "handler": "research.dispatch",
      "permission": "artifact.local.write",
      "with": {
        "worker": "research-worker",
        "planMode": "single-pass",
        "commitAsDoc": true
      },
      "retry": { "max_attempts": 1 }
    },
    {
      "id": "pop-and-bump",
      "handler": "queue.pop",
      "permission": "state.local.write",
      "with": {
        "queueKey": "zoe-work-queue",
        "capKey": "zoe-daily-counter"
      },
      "retry": { "max_attempts": 2 }
    },
    {
      "id": "release-lock",
      "handler": "state.local.write",
      "permission": "state.local.write",
      "with": {
        "stateKey": "zoe-work-loop-lock",
        "operation": "unlock"
      },
      "retry": { "max_attempts": 2 }
    },
    {
      "id": "record-run",
      "handler": "receipt.local.write",
      "permission": "receipt.local.write",
      "with": {
        "receiptType": "zoe-work-loop"
      },
      "retry": { "max_attempts": 1 }
    }
  ]
}
```

---

## Handler Inventory

The DreamLoop runner (`vendor/dreamloops/runtime/src/runner.js`) dispatches each step to a handler by name. ZOL's existing `src/handlers/index.js` already provides these:

| Handler | Status in ZOL | Notes |
|---------|--------------|-------|
| `state.local.read` | ✓ exists | Used for lock stale check |
| `state.local.write` | ✓ exists | Used for lock acquire/release + counter |
| `receipt.local.write` | ✓ exists | Used for run evidence |
| `memory.read` | ✓ exists | Available for dedup lookup |

These handlers are NEW — must be built for ZOE's handler registry:

| Handler | What it does | File to create |
|---------|--------------|---------------|
| `queue.read` | Reads `~/.zao/zoe/work-queue.json`, validates against `daily_cap`, returns `{ item, queueDepth, dailyCount, shouldRun }` | `src/zoe/handlers/queue-handler.ts` |
| `research.dispatch` | Wraps `dispatchPlan()` + `commitResearchDoc()` — the existing ZOE pipeline | `src/zoe/handlers/research-dispatch-handler.ts` |
| `queue.pop` | Removes the processed item from queue, increments daily counter | `src/zoe/handlers/queue-handler.ts` (same file as `queue.read`) |

**Key constraint on `research.dispatch`:** This handler wraps ZOE's existing `dispatchPlan()` function. It does NOT need to call Claude or LLM infrastructure directly — it delegates to the same pipeline that already exists. The handler is just a DreamLoop-compatible wrapper with structured inputs/outputs and a receipt.

---

## Where the Manifest Lives

ZOE's DreamLoop manifests are NOT in ZOL (ZOL is music-curator-specific). They go in ZAOOS:

```
bot/src/zoe/loops/
  zoe-work-loop-v1.manifest.json       ← the manifest above
  zoe-morning-brief-v1.manifest.json   ← future
  zoe-evening-review-v1.manifest.json  ← future
```

The `dl-run.js` concept (ZOL's daily runner) becomes ZOE's `zoe-loop-runner.ts` — same pattern, but TypeScript, running in the ZOE scheduler tick instead of a Pi cron.

---

## Port Path: Three Phases

### Phase 1 — Manifest Only (this doc)

Write `bot/src/zoe/loops/zoe-work-loop-v1.manifest.json` and check it into ZAOOS.

**Outcome:** The manifest is version-controlled, reviewed, and specifies what ZOE WILL do, before any code changes.

**Status:** Manifest written above — ZAOOS PR ready.

### Phase 2 — Handler Wiring

1. Add `bot/src/zoe/handlers/queue-handler.ts` — implements `queue.read` + `queue.pop` by reading/writing `~/.zao/zoe/work-queue.json` and `~/.zao/zoe/work-loop-count.json`
2. Add `bot/src/zoe/handlers/research-dispatch-handler.ts` — wraps `dispatchPlan()` + `commitResearchDoc()` with DreamLoop input/output contract
3. Add `bot/src/zoe/zoe-loop-runner.ts` — loads the manifest, instantiates a `DreamLoopRunner` with ZOE's handlers, runs per tick

**ZOE still has the existing `work-loop.ts` at this point.** The DreamLoop runner and the imperative loop run side-by-side until Phase 3 is validated. This is the dual-track safety from agent-loops.md rule #9 (one instance per resource) — enforce via a shared lock so only one runs per tick.

### Phase 3 — Migration

Once Phase 2 passes `dry-run` + `rehearsed` mode:
1. Remove the direct `runWorkTick(deps)` call from `scheduler.ts`
2. Replace with `zoeLoopRunner.tick()` (calls the DreamLoop runner)
3. Delete `work-loop.ts` (or archive it as `work-loop.v0.ts.bak`)
4. Update ZOE's `package.json` scripts to include a `dl-dry-run-work-loop` script (mirrors ZOL's pattern)

**Evidence gate before Phase 3:** 5 successful dry-runs, receipts in state store, no timeout failures.

---

## Why "Evidence-Gated" Matters Here

The existing `work-loop.ts` has an implicit evidence gate (queue non-empty, cap not exceeded) but it's invisible to anything outside the function. The DreamLoop's explicit `checks` array and `evidence_outputs` make this observable:

- Every run produces a receipt → Zaal can query: "how many research items did ZOE process this week?"
- Every failed run produces a failure receipt → pattern detection (which topics fail? which succeed?)
- Over time, the `evidence-gated-self-improvement` DreamLoop (already in ZOL) could read ZOE's receipts and PROPOSE improvements to the daily cap, topic filtering, or dispatch strategy — with operator approval before any change lands

This is the full evidence-gated self-improvement loop:

```
ZOE work-loop (bounded) → receipt store
evidence-gated-self-improvement (weekly) → reads receipts → proposes cap/filter changes
Zaal approves → change lands in next manifest version
```

The two DreamLoops (work-loop + self-improvement) are designed to compose. Neither modifies itself.

---

## Immediate Next Actions

| Phase | Task | Owner | Time |
|-------|------|-------|------|
| Phase 1 | Merge this doc (1527) into ZAOOS | Zaal | 1 min (PR review) |
| Phase 1 | Write `bot/src/zoe/loops/zoe-work-loop-v1.manifest.json` to ZAOOS repo | ZOE/Zaal | 5 min |
| Phase 2 | Build `queue-handler.ts` (read + pop) | Zaal or ZOE | 30 min |
| Phase 2 | Build `research-dispatch-handler.ts` | Zaal or ZOE | 45 min |
| Phase 2 | Build `zoe-loop-runner.ts` (runner wiring) | Zaal or ZOE | 30 min |
| Phase 2 | Dry-run (`node scripts/zoe-dl-dry-run.js`) | Zaal on VPS | 5 min |
| Phase 3 | Replace `runWorkTick` in scheduler.ts | Zaal | 15 min |

Phase 2+3 are gated on Zaal's review of this doc and go-ahead. Phase 1 completes with this PR.

---

## Related Docs

- [Doc 1512 — ZOL DreamLoops activation](../../technology/1512-zol-dreamloops-weekly-curator-artist-spotlight/) — ZOL's parallel activation; pattern to mirror
- [Doc 1269 — ZOL + DreamLoops architecture](../../identity/1269-zol-farcaster-music-scout-jul2026/) — 20 manifests, handler registry, runner pattern
- [Doc 892 — Being an agent on Farcaster 2026](../farcaster/892-being-an-agent-on-farcaster-2026/) — agent-loops.md rule #9 (one instance per resource)

## Sources

- ZAOOS codebase: `bot/src/zoe/work-loop.ts` (Jul 18, 2026 audit — full function traced)
- ZOL repo: `loops/*.manifest.json` (20 manifests reviewed: evidence-gated-self-improvement, research-and-citation, warper-keeper-work-cycle, project-continuity-resume)
- ZOL repo: `src/handlers/index.js` (full handler registry — 16 handlers catalogued)
- ZOL repo: `scripts/dl-run.js` (runner pattern: capsule + scheduledLoops + runner.run())
- ZAOOS: `bot/src/zoe/scheduler.ts` (cron integration points)
- agent-loops.md: rule #9 (one instance per resource), rule #29 (never union-merge code)
