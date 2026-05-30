---
topic: agents
type: changelog
status: implemented
last-validated: 2026-05-29
related-docs: "770, 759, 728"
original-query: "do the pr and then fix high items in 771"
scope: "bot/src/zoe/{index,dispatch,workers,scheduler}.ts"
---

# 771 - ZOE orchestrator HIGH-severity fixes (doc 770 follow-up)

> **Goal:** Fix the 5 HIGH findings from the doc 770 audit so the orchestrator is safe to trust with autonomous, cost-incurring runs. Each fix lands with a regression test where the logic is pure.

Branch: `ws/zoe-orchestrator-high-fixes-771`. Builds on doc 770.

## What changed

### H1 — command prefixes bypass the pending-approval interception
`index.ts` — new `isCommandPrefixed()` predicate; `handlePrivateMessage` now guards the whole pending block with `if (pending && !isCommandPrefixed(text))`. A `plan:` / `note:` / nudge DM always reaches its handler even while an `await-reflection` (14h TTL) or a reflexion voice-note request is armed. The pending stays in place, so a later free-form DM still resolves it.
**Result:** the nightly window where `plan:` got swallowed is closed.

### H2 — no more silent clobber of a live pending
- `index.ts` `handlePlanCommand`: if a new plan replaces an unresolved `plan-gate`/`reflexion`/`learn`, it now appends a "Heads up: this replaced a pending X" note instead of silently overwriting.
- `scheduler.ts`: the nightly `await-reflection` arming and the weekly `learn` cron now check `getPending('private')` first and **skip** (log + defer) rather than stomping a live user approval.
**Caveat:** full multi-kind coexistence (keying pending by `(scope, kind)`) is deferred — this is the proportionate fix; the dangerous *silent background clobber* is gone.

### H3 — real cost/safety guard in the dispatch loop
`dispatch.ts`:
- **Subtask ceiling** — `MAX_SUBTASKS` (default 12, `ZOE_MAX_SUBTASKS`). A larger plan returns `too-large` before anything runs.
- **Budget pre-flight** — before each wave, sum the wave's worst-case authorized spend (`estimateSubtaskCost` = the worker's `maxBudgetUsd`; Hermes/inline = 0) and stop with `budget-exceeded` *before* spawning if it would exceed the remaining budget. The old check ran only AFTER a wide wave had already spent.
- **Bounded concurrency** — `runWithConcurrency` caps simultaneous `claude` subprocesses at `MAX_WAVE_CONCURRENCY` (default 3, `ZOE_MAX_WAVE_CONCURRENCY`), replacing the unbounded `Promise.allSettled(runnable.map(...))`.
- New `too-large` status + summary line; header comment corrected (it no longer claims an unconditional hard budget, and notes Hermes self-accounts).

### H4 — hardened the worker tool denylist (partial; needs CLI verification)
`workers.ts` `READ_ONLY_DISALLOW` extended with `mv`, `dd`, `truncate`, `tee`, `chmod`, `chown`, `sh`/`bash`/`zsh`, `eval`, `node`, `npx`, `python`, `git clean`, `NotebookEdit`.
**Open (carried to follow-up):** a Bash denylist cannot catch shell redirection (`cmd > file`) or here-docs. The real guarantee is each worker's explicit `allowedTools` allowlist + the CLI denying everything else. **Verify `permissionMode: 'auto'` is deny-by-default before granting any worker write/real-spend**; if it is not, switch workers to `bypassPermissions` + allowlist. Tracked as the remaining H4 work.

### H5 — approval path can no longer crash a turn silently
`index.ts` `runApprovedPlan` is now fully wrapped in try/catch that replies `(dispatch error - …)` on failure. Previously a throw in `ctx.reply`/`setPending` propagated to grammY, the user saw nothing, and the plan was lost (pending already cleared).

### Bonus — unbreak the bot typecheck
`index.ts:1031` — the `subscribeToCasts` callback from #729 returned a non-void promise and failed `tsc`. Wrapped as fire-and-forget (`void runCasterPipeline(...)`). The remaining `bot` tsc errors are #729's missing-dep stubs (`viem`/`tweetnacl`/`@farcaster/hub-nodejs`), resolved by `npm install` on the operator box.

## Tests
`dispatch.test.ts` +2 (H3): oversized plan → `too-large` (0 dispatched); $0.50 budget vs a $1.00 research-worker → `budget-exceeded` with **no CLI call** (pre-flight short-circuits). Full suite: 82 zoe tests pass; orchestrator files `tsc` clean.

H1/H2/H5 live in `index.ts`/`scheduler.ts` behind grammY side effects and are covered by the VPS smoke test (not unit-testable without mocking the Bot).

## Deploy note
Deploy this branch (or main after merge) **once** — it supersedes the H1-swallow version. After restart, `plan: test routing` must reply `"Decomposing into a routed plan — one moment."` (not the concierge ACK).
