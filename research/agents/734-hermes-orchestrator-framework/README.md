---
topic: agents
type: guide
status: research-complete
last-validated: 2026-05-23
related-docs: "601, 644, 670, 680, 705, 717, 722, 726, 727"
original-query: "Research the bettercallzaal/hermes-orchestrator repo: what's shipped on main, what's in the 4 open stacked PRs, what the framework does today, how it grounds the ZOE-as-builder spec in doc 727, and how to adopt it back into ZAO OS."
tier: STANDARD
---

# 734 - hermes-orchestrator framework

> **Goal:** Snapshot the public hermes-orchestrator MIT package - what it is, what's shipped, what the open stacked PRs add, how it grounds doc 727 (ZOE-as-builder), and how to adopt it back into ZAOOS without breaking the Hermes-canonical lock.

This is the public extraction of the supervisor-pattern brainstormed in doc 727. Repo lives at `github.com/bettercallzaal/hermes-orchestrator`, MIT, by Zaal Panthaki / The ZAO. Local clone at `/tmp/hermes-orchestrator`. Pre-alpha but a clean v0.1.0 is already tagged + merged on main; v0.2.0 / v0.3.0 / v0.4.0 / v0.5.0 sit as stacked PRs awaiting merge.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **Adopt hermes-orchestrator as the supervisor layer for ZOE.** Vendor it from npm (post v1.0) OR pin the GitHub commit short-term. Do NOT re-implement the same pattern inside `bot/src/zoe/`. | Doc 727 already locked the architecture. The repo IS that architecture, cleaned for general use. Skipping it = building it twice. |
| 2 | **Wait for PR2-5 to merge before adopting.** v0.1.0 alone is end-to-end loop; v0.2-0.5 add supervisor / real intervention / learning loop / 3 patterns. The headline `learning-loop.test.ts` (run 2 sees run 1) requires PR4 (FileMemory). | Adopting at v0.1.0 = no supervision, no learning. Adopting at v0.5.0 = router picks across 3 patterns with intervention + learning. |
| 3 | **Use FileMemory adapter in ZAOOS first; BonfireMemory once admin labeling unlocks.** FileMemory ships in PR4 - JSONL append at `$HOME/.hermes-orchestrator/memory.jsonl`. Proven learning loop. BonfireMemory shipped at PR1 but `retrieve()` returns `[]` until Bonfires admin runs labeling on the index. | FileMemory needs zero infra. Bonfire is the eventual graph layer per doc 727 Decision #2 but is dormant. No code change needed when labeling unlocks - swap the adapter. |
| 4 | **PR6 TelegramChannel adapter is the integration seam for ZOE.** Once the `ChannelAdapter` ships, ZOE's existing Telegram surface (`bot/src/zoe/`) wires `status()` to a group chat + `firehose()` to operator DM with no new bot. | Reuses ZOE's existing dual-surface concierge. No new Telegram bot - new bots are banned without doc + Zaal approval (CLAUDE.md primary-surfaces table). |
| 5 | **HermesRunner replaces `bot/src/hermes/runner.ts` once stable.** Same Claude CLI subprocess shape, same Max-plan OAuth, but adds session_id capture + `claude --resume` swap for real mid-run intervention, plus `--output-format stream-json`. | Current `bot/src/hermes/runner.ts` uses blocking JSON output - supervisor can't read turn-by-turn. The new runner is a strict superset. |
| 6 | **Keep the package as MIT public infra, not ZAO-private.** Build in public: every PR is a teachable step per README. | Aligns with `feedback_build_public` (document every step) + `feedback_oss_first_no_platforms`. Bonfire + ZAO bot stack benefit from broader contributions. |

## Repo state (2026-05-23)

### Shipped on main

- **PR0** scaffold - README, LICENSE, design + autonomy + bonfire-adapter docs
- **PR1 v0.1.0** MERGED + TAGGED ([`v0.1.0`](https://github.com/bettercallzaal/hermes-orchestrator/releases/tag/v0.1.0)) - scaffold + `HermesRunner` + `BonfireMemory` + `hermes-bug-fix` pattern + tests + CI matrix (Node 18/20/22)

### Open stacked PRs (merge order 2 -> 3 -> 4 -> 5)

| PR | Version | What it adds | What proves it works |
|----|---------|--------------|----------------------|
| [#2](https://github.com/bettercallzaal/hermes-orchestrator/pull/2) | v0.2.0 | `supervisor.ts` watches the stream. Loop / off-track / cost-cap verdicts. **Cost-cap kill is REAL** (calls `runner.kill`). Intervene verdicts log-only at this stage. | 8 supervisor tests |
| [#3](https://github.com/bettercallzaal/hermes-orchestrator/pull/3) | v0.3.0 | Real intervention: `session_id` capture + `claude --resume` swap on intervene verdict. Stuck-timeout race in drain loop. `maxInterventions` cap escalates the (N+1)th intervene-or-stuck to a kill. | orchestrator tests + intervention cap test |
| [#4](https://github.com/bettercallzaal/hermes-orchestrator/pull/4) | v0.4.0 | `FileMemory` adapter unblocks the learning loop. JSONL append, recency-sorted, joins `classified` + `completed` by `taskId`, filters by pattern. | `learning-loop.test.ts` - run 2 sees run 1 in its `systemPrompt` few-shot block |
| [#5](https://github.com/bettercallzaal/hermes-orchestrator/pull/5) | v0.5.0 | `researchDoc` + `meetingCapture` `PatternAdapters`. Three patterns total. Router picks correctly across all three. | 12 pattern tests + 3 router tests |

### Verification (local clone)

```
typecheck   clean
tests       45 / 45 pass
            (autonomy 7, router 3, supervisor 8, orchestrator 8,
             file-memory 5, learning-loop 2, patterns 12)
build       clean dist/ with .d.ts + source maps
ci          GitHub Actions matrix Node 18 / 20 / 22
LOC         ~1500 across src/ + tests/
```

## What the framework does today (post PR5 merge)

### Public API

```ts
import { orchestrate } from 'hermes-orchestrator'
import { HermesRunner } from 'hermes-orchestrator/adapters/hermes-runner'
import { FileMemory }   from 'hermes-orchestrator/adapters/file-memory'
import { hermesBugFix, researchDoc, meetingCapture } from 'hermes-orchestrator/patterns/...'

const outcome = await orchestrate('fix the type error in src/foo.ts', {
  runner:   new HermesRunner({ workDir: process.cwd() }),
  memory:   new FileMemory(),
  patterns: [hermesBugFix, researchDoc, meetingCapture],
  costCap:  2.0,                  // USD per task
  stuckTimeoutMs: 60_000,         // 60s of silence -> intervene
  maxInterventions: 3,            // 4th becomes a kill
})
```

Flow per call: `classify -> gate -> spawn -> supervise -> learn -> outcome`.

### Components

| Layer | File | What it does |
|-------|------|--------------|
| Router | `src/router.ts` | Classifies task -> picks pattern. Default classifier ships; pluggable via `opts.classifier`. Returns `{ pattern, runner, confidence, reasoning }`. Cost target < $0.01/task. |
| Autonomy | `src/autonomy.ts` | Blast-radius gate: `AUTO` / `CONFIRM` / `REFUSE`. Default policy by tool-prefix. CONFIRM = ask operator (default 4h idle = cancel). REFUSE = hard stop. Unknown actions = fail-safe CONFIRM. |
| Pattern | `src/patterns/*.ts` | Three default `PatternAdapter`s: `hermes-bug-fix`, `research-doc`, `meeting-capture`. Each declares `matches()`, `prepare()`, `costCap`, `interventionRules`. |
| Runner | `src/adapters/hermes-runner.ts` | Wraps `claude` CLI as subprocess with `--output-format stream-json --verbose`. Captures `session_id` from first system/init line. On `intervene()`: SIGTERM old proc, wait for `close`, spawn `claude --resume <session_id> <message>` with same `systemPrompt` + tool whitelist. |
| Supervisor | `src/supervisor.ts` | Per-event verdict generator. Detects: loop (N identical assistant msgs, default 3), off-track (`tool_use` for non-allowed tool), cost-cap (`costSoFar > costCapUsd`). Stuck-timeout handled in orchestrator drain loop via `Promise.race`. |
| Orchestrator | `src/orchestrator.ts` | The drain loop. Races `iter.next()` against `setTimeout(stuckTimeoutMs)`. On `intervene` verdict: calls `runner.intervene()` for real. On `kill` verdict (cost cap exceeded) or `interventions >= maxInterventions`: calls `runner.kill()`, marks `aborted`. |
| Learner | `src/learner.ts` | `retrieve(pattern, taskClass, limit)` injects past `completed` outcomes as few-shot at spawn time. `record(event)` writes every meaningful step. |
| Queue | `src/queue.ts` | Module-level `JobQueue` shared across `orchestrate()` calls. Default `concurrency: 1`. Reset via `_resetQueue()` (test-only). |

### Two MemoryAdapters

- **FileMemory** (default, recommended for ZAO) - JSONL append at `$HOME/.hermes-orchestrator/memory.jsonl`. `retrieve()` parses, groups by `taskId`, returns 5 most-recent completed outcomes for the pattern. No network, no embeddings.
- **BonfireMemory** - POSTs episodes to `https://tnt-v2.api.bonfires.ai/knowledge_graph/episode/create` with deterministic names (`orch:classify:<task-id>`, `orch:spawn:<task-id>:<runner>`, etc.). Local secret-regex scan (9 patterns: `sk-ant-*`, `sk-proj-*`, `ghp_*`, PEM blocks, `0x[hex]{64}`, Telegram tokens, Slack `xox*`, AWS `AKIA*`) blocks any episode body containing matches. **`retrieve()` returns `[]` until Bonfires admin runs labeling on the index** - dormant until unlocked.

### Autonomy tiers (from `docs/autonomy.md`)

| Tier | Examples | Behaviour |
|------|----------|-----------|
| `AUTO` | run Whisper, create `ws/` branch, open a PR, write memory, write to dev-only channel | Just runs. No prompt. |
| `CONFIRM` | merge to protected branch, edit user-facing config, change systemd unit, edit persona file, modify a hook | Operator prompt with summary + diff + Y/n. 4h idle -> cancel. |
| `REFUSE` | send DM/email/cast as operator, post to public channel, on-chain transaction, force-push to main, delete repo, share key | Hard stop. Operator does it themselves. |

Heuristic bumps: `git push origin main` -> CONFIRM/REFUSE. Production URL allowlist hit -> REFUSE. Commit message contains "lock"/"delete"/"publish"/"merge"/"deploy" -> bump one tier. Unknown -> CONFIRM (fail-safe up).

### Three default patterns

1. **`hermes-bug-fix`** - the seed pattern. Used by ZAO's existing Hermes coder+critic loop. Cost cap default $2.
2. **`research-doc`** - mirrors `/zao-research` skill. The router picks this for "research X" / "look up Y" tasks.
3. **`meeting-capture`** - mirrors `/meeting` skill. The router picks this for transcript / recap inputs.

Router test (`tests/router.test.ts`) proves all 3 dispatch correctly. Pattern tests (`tests/patterns.test.ts`, 12 cases) prove each pattern's `matches()` + `prepare()` are correct.

## How this grounds doc 727

Doc 727 ("ZOE as agent builder") locked the architecture; this repo IS that architecture, extracted to a reusable npm package.

| Doc 727 decision | Hermes-orchestrator equivalent |
|------------------|------------------------------|
| Wrap Hermes, don't replace it | `HermesRunner` is one of N possible `RunnerAdapter`s; the existing `bot/src/hermes/runner.ts` is its spiritual ancestor |
| Bonfire is the learning store | `BonfireMemory` adapter ships at PR1 (dormant on `retrieve` until labeling unlocks) |
| Router for ALL tasks + 3 vertical patterns | `src/router.ts` + 3 default `PatternAdapter`s (`hermes-bug-fix`, `research-doc`, `meeting-capture`) |
| Stream-json, not blocking | `HermesRunner` spawns with `--output-format stream-json --verbose` |
| Best-effort everywhere | Memory writes wrapped in `.catch()`; intervene errors logged not thrown; supervisor crashes don't abort orchestrator |

## Roadmap (PR6+)

| PR | What ships | Hook into ZAO |
|----|-----------|---------------|
| PR6 v0.6.0 | `TelegramChannel` adapter - dual-surface concierge | ZOE wires `status()` -> group chat, `firehose()` -> operator DM |
| PR7+ | `postComplete(outcome)` hook on `PatternAdapter` | Patterns own their distribution step (e.g. `research-doc` opens the PR, `meeting-capture` writes recap doc + cowork actions) |
| PR8+ | Adaptive supervisor | Drop `loopThreshold` to 2 when a pattern historically loops |
| PR9+ | npm publish | Pin to `^1.0.0` from ZAOOS once surface is stable |
| (dormant) | `BonfireMemory.retrieve` returns hits | No code change needed - admin labeling unblock flips the switch |

## Adoption plan for ZAOOS

Three steps, in order.

1. **Wait for PR2-5 to merge + tag.** Doc adopts at v0.5.0 minimum.
2. **Add `hermes-orchestrator` as a git dependency** in `bot/package.json` (pin commit SHA until v1.0 npm publish). Wire a thin shim in `bot/src/zoe/orchestrator.ts` that calls `orchestrate(task, opts)` with `FileMemory` + `HermesRunner`.
3. **Switch ZOE's concierge to dispatch to orchestrator** on task-shaped inputs (per doc 727 architecture). Non-task messages still flow through existing 4-block memory + `selectModel()`. Leave `bot/src/hermes/runner.ts` in place until v0.6.0 + ChannelAdapter validates the round-trip.

DO NOT delete `bot/src/hermes/` until the orchestrator path is dogfooded for 7+ days with green metrics.

## Risks + open questions

| Risk | Mitigation |
|------|-----------|
| BonfireMemory retrieval dormant -> learning loop won't fire in prod | Use FileMemory until labeling unlocks. Same interface; swap = 1 line. |
| Pre-alpha; v1.0 surface not locked | Pin to commit SHA, not `^0.x.y`. Re-test on every adapter change. |
| Claude CLI subprocess auth via Max plan OAuth - one terminal at a time | Same constraint as existing Hermes. No new risk. Use stuck-timeout to detect auth-prompt hang. |
| `claude --resume` semantics for `intervene()` not yet stress-tested in prod | PR3 ships unit test only. First production use will be the dogfood signal. |
| 45 tests pass but real Claude CLI integration test is mock-based | Pattern test fixtures use mock streams. Real end-to-end depends on Max-plan auth + live `claude` binary. Plan a manual `dist/examples/` smoke test before adopting. |

## Key files for grounding

| File | What |
|------|------|
| `src/orchestrator.ts` | drain loop with stuck-timeout race + `intervene` (verified 343 lines) |
| `src/supervisor.ts` | per-event verdict generator (110 lines, 3 detection rules) |
| `src/adapters/hermes-runner.ts` | Claude CLI subprocess + `session_id` capture + `--resume` swap (290 lines) |
| `src/adapters/file-memory.ts` | JSONL append + per-task join + recency sort (107 lines) |
| `src/adapters/bonfire-memory.ts` | secret-scan + episode POST to `/knowledge_graph/episode/create` |
| `src/patterns/{hermes-bug-fix,research-doc,meeting-capture}.ts` | three default patterns |
| `tests/learning-loop.test.ts` | the headline test - run 2 sees run 1 |
| `docs/design.md` | architecture diagram + adapter contracts |
| `docs/autonomy.md` | 3-tier gate, heuristic rules, audit trail |
| `docs/bonfire-adapter.md` | wire format, secret regex list, retrieval caveat |

## Also See

- [Doc 727](../727-zoe-as-agent-builder-supervisor/) - prerequisite architecture lock (the brainstorm this repo extracts)
- [Doc 717](../717-bonfire-skill-implementation/) - `/bonfire` skill, the episode-write primitive `BonfireMemory` mirrors
- [Doc 726](../../identity/726-bonfires-teaching-another-bot/) - Bonfires graph layer brief
- [Doc 601](../601-agent-stack-cleanup-decision/) - 2026-05-04 lock: Hermes is THE canonical pattern, no new bots without doc

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Merge PR2 -> tag v0.2.0 | @Zaal | GitHub | Next session |
| Merge PR3 -> tag v0.3.0 | @Zaal | GitHub | Next session |
| Merge PR4 -> tag v0.4.0 (unlocks learning loop) | @Zaal | GitHub | Next session |
| Merge PR5 -> tag v0.5.0 (3 patterns live) | @Zaal | GitHub | Next session |
| Build PR6 `TelegramChannel` adapter | @Zaal | GitHub PR | After PR5 merged |
| Add `hermes-orchestrator` git dep to `bot/package.json` (pin SHA) | @Zaal | ZAOOS PR | After v0.5.0 tagged |
| Thin shim `bot/src/zoe/orchestrator.ts` calling `orchestrate()` | @Zaal | ZAOOS PR | After dep added |
| Switch ZOE concierge to dispatch to orchestrator on task inputs | @Zaal | ZAOOS PR | After shim verified |
| Dogfood 7 days; measure: classify accuracy, intervene rate, kill rate, cost/task | @Zaal | Telemetry | Post-adoption |
| Delete `bot/src/hermes/runner.ts` if dogfood green | @Zaal | ZAOOS PR | After dogfood |
| Flip to `BonfireMemory` once admin labeling unlocks | @Zaal | 1-line config | When unlocked |
| Update [[project_hermes_canonical]] memory to point at orchestrator package | @Claude | Memory | After adoption |

## Sources

- [hermes-orchestrator README](https://github.com/bettercallzaal/hermes-orchestrator/blob/main/README.md) [FULL - read from local clone /tmp/hermes-orchestrator]
- [hermes-orchestrator design.md](https://github.com/bettercallzaal/hermes-orchestrator/blob/main/docs/design.md) [FULL - 161 lines, architecture diagram + adapter contracts read from local clone]
- [hermes-orchestrator autonomy.md](https://github.com/bettercallzaal/hermes-orchestrator/blob/main/docs/autonomy.md) [FULL - 64 lines, tiers + heuristics + audit trail read from local clone]
- [hermes-orchestrator bonfire-adapter.md](https://github.com/bettercallzaal/hermes-orchestrator/blob/main/docs/bonfire-adapter.md) [FULL - 95 lines, wire format + secret regex + retrieval caveat read from local clone]
- [src/orchestrator.ts](https://github.com/bettercallzaal/hermes-orchestrator/blob/main/src/orchestrator.ts) [FULL - 343 lines read]
- [src/supervisor.ts](https://github.com/bettercallzaal/hermes-orchestrator/blob/main/src/supervisor.ts) [FULL - 110 lines read]
- [src/adapters/hermes-runner.ts](https://github.com/bettercallzaal/hermes-orchestrator/blob/main/src/adapters/hermes-runner.ts) [FULL - 290 lines read]
- [src/adapters/file-memory.ts](https://github.com/bettercallzaal/hermes-orchestrator/blob/main/src/adapters/file-memory.ts) [FULL - 107 lines read]
- [package.json](https://github.com/bettercallzaal/hermes-orchestrator/blob/main/package.json) [FULL - confirms version 0.5.0, MIT license, Zaal author, npm export paths]
- [v0.1.0 release](https://github.com/bettercallzaal/hermes-orchestrator/releases/tag/v0.1.0) [PARTIAL - tag exists locally, release notes not fetched; not blocking]
- [PR #2](https://github.com/bettercallzaal/hermes-orchestrator/pull/2), [PR #3](https://github.com/bettercallzaal/hermes-orchestrator/pull/3), [PR #4](https://github.com/bettercallzaal/hermes-orchestrator/pull/4), [PR #5](https://github.com/bettercallzaal/hermes-orchestrator/pull/5) [PARTIAL - PR titles + state inferred from local branches feat/pr2-supervisor / feat/pr3-intervention / feat/pr4-file-memory / feat/pr5-more-patterns + commit messages; PR body diff not fetched]
- ZAO OS `bot/src/hermes/` codebase audit [FULL - confirmed runner.ts, coder.ts, critic.ts, pr.ts, pr-watcher.ts, db.ts, git.ts, claude-cli.ts, commands.ts, preflight.ts present]
- ZAO OS doc 727 [FULL - read frontmatter + Key Decisions + architecture diagram]
