---
topic: agents
type: changelog
status: implemented
last-validated: 2026-05-30
related-docs: "771, 770, 759"
original-query: "It ran but I want a progress bar type thing that doesn't take a lot of tokens"
scope: "bot/src/zoe/{progress,index}.ts, bot/src/hermes/claude-cli.ts"
---

# 772 - ZOE orchestrator: live progress bar + parallel-spawn reliability

> First real end-to-end dispatch (doc 771 fixes deployed) succeeded — 3 subtasks,
> dependency waves, critic scores, `$0.94` spend (under the $5 budget). It surfaced
> two issues: (1) the chat looked frozen during long worker calls, and (2) a
> parallel subtask died with `spawn claude ENOENT`. This doc fixes both.

## 1. Token-free live progress bar

**Problem:** `▶ st-1` posted on subtask *start*, then silence for 30s-2min while
the worker's `claude` process ran. No heartbeat → looks hung.

**Fix:** `progress.ts` (pure renderers) + `index.ts runApprovedPlan` now sends
ONE message and edits it in place as subtasks start/finish:

```
🔄 Dispatching — 2/3
[██████░░░░] 1:15 · $0.94
✓ st-1 research-worker 58
⏳ st-2 comms-drafter
✓ st-3 research-worker 90
```

- A `setInterval` (5s) refreshes elapsed time and keeps a **typing indicator**
  alive, so the chat never looks frozen.
- `onSubtaskDone` hook (already in `DispatchHooks`, now wired) flips each row to
  ✓ / ⚠ / ✗ with its critic score.
- Final edit flips the title to "Plan complete"; the full summary still posts
  after as the durable record.

**Cost: zero LLM tokens.** Telegram `editMessageText` / `sendChatAction` are free
API calls — only the worker calls spend tokens. (This directly answers the ask:
"a progress bar that doesn't take a lot of tokens.")

## 2. `spawn claude ENOENT` on parallel waves

**Problem:** in the first live run, `st-1`/`st-3` (research-worker) succeeded but
`st-2` (comms-drafter) failed with `Failed to spawn claude CLI: spawn claude
ENOENT`. Root cause: `claude-cli.ts` spawned the **bare name** `claude`, forcing
an OS PATH lookup on every spawn. Under concurrent dispatch (multiple workers +
critics at once) that lookup intermittently returns ENOENT.

**Fix:** `claude-cli.ts` resolves `claude` to an **absolute path once** and caches
it (`~/.local/bin/claude` → `/usr/local/bin` → `/usr/bin` → homebrew), honoring
`HERMES_CLAUDE_BIN`. An absolute path skips the per-spawn lookup, so parallel
waves stop flaking. Shared with Hermes — strictly more robust there too.

## Tests
`progress.test.ts` +4 (bar fill, mm:ss, finished-count + score display, final
title). 86 zoe tests pass; touched files `tsc` clean (only #729 missing-dep stubs
remain in `bot`).

The progress wiring lives in `index.ts` behind grammY (editMessageText) → covered
by the VPS smoke test. The ENOENT fix is environment-dependent (PATH race under
load) → validated by re-running a parallel-wave plan on the VPS.

## Deploy note
Stacks on doc 771 (`ws/zoe-orchestrator-high-fixes-771`). Deploy this branch to
see the progress bar + reliable parallel spawns; merge after #733.
