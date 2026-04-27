---
topic: agents
type: audit
status: research-complete
last-validated: 2026-04-27
related-docs: 461, 506, 507, 523, 524, 527, 529
tier: DISPATCH
---

# 531 - Hermes Honest Audit - Pivot or Persist

> **Goal:** Tell Zaal honestly whether to keep building the Hermes pair or pivot. 24 hours, 8+ patches, 9 production runs. Only 1 successful (and it was the simplest task /version, before pre-flight existed). Stop building reactively + decide architecturally.

3-agent dispatch on 2026-04-27.

## The Honest Numbers

| Metric | Value |
|--------|-------|
| Hermes total code | **1,599 lines / 11 files** |
| PRs merged patching mechanical bugs | **8 in 24 hours** |
| Production runs total | **9** |
| Successful runs (ready, PR opened) | **1 (11%)** - PR #322 /version, Apr 26 03:40 UTC |
| Failed or escalated runs | **8 (89%)** |
| Bug surface rate | **1 new mechanical bug per 8.4 min of agent runtime** |
| Trajectory | **Diverging, not converging** |

**The 1 successful run shipped BEFORE pre-flight gate existed.** Every test since pre-flight (#325 Apr 26 17:40 UTC) has either failed or escalated. Hermes worked better without the safety net we added to make it safer.

## Mechanical Bugs Surfaced In Order

1. `--json-schema` killed tool-use (Coder couldn't Read/Edit/Write)
2. `gh pr create` missing `--head` (gh upstream detection flaky)
3. systemd strips PATH (gh + claude not found)
4. tsc not found (no `node_modules` in fresh clone)
5. tsc OOM on full codebase (2GB heap)
6. Coder prose-wraps JSON (parser strict, runner crashed)
7. Bot/ deps missing (root npm ci doesn't reach bot/)
8. Biome ignores bot/ (root config excludes it)

Each fix added complexity. Each test exposed a new layer. Pre-flight gate logic now has **9 separate logic branches** (forbidden paths / typecheck root / typecheck bot / lint scope detection / lint dirs / tests / heap augmentation / scope detection / docs-only skip).

## Key Decisions

| Decision | Verdict | Why |
|----------|---------|-----|
| **Abandon Hermes for claude-code-action** | **NO** | Migration = 8-12hrs glue + lose Telegram-native. ZAO Devz UX is "@bot fix this" in chat - GitHub Actions can't deliver that without a bridge nobody's built yet. Sunk cost is real but not decisive; the fit is. |
| **Switch to Aider** | **NO** | CLI-only, no Telegram, async-unfriendly. Solo founder pattern doesn't fit. |
| **Switch to OpenHands** | **NO** | Best benchmarks (53% SWE-bench) but Docker + infra setup = 4-6hrs + still no Telegram. Overkill for fixed-scope solo founder. |
| **Switch to Devin** | **NO** | Closed platform, no Supabase/wallet code execution mid-fix, $50-200/mo bills per user reports. |
| **Drop biome from pre-flight** | **YES, ship today** | Style != correctness. CI catches lint in 30s. Pre-flight has been the source of 3 of last 4 escalations (heap, biome scope, biome ignores bot/). Removing it eliminates that whole failure class. |
| **Simplify pre-flight to typecheck-only** | **YES** | tsc catches real bugs (missing types, broken imports). Lint catches style downstream. Tests run only if Coder touches test files. |
| **Add Docker isolation** | **DEFER** | Right answer eventually but +6hrs work. Ship the simplification first, prove flow works, then containerize. |
| **Stop "hardening"** | **YES, hard rule** | Per agent 3: each "hardening" PR landed with hidden requirements that only surface under production load. PR #325 (pre-flight gate) was supposed to PREVENT failures; instead it created 4 new failure modes. We over-corrected after PR #321. |
| **Accept that style errors will sometimes ship** | **YES** | If Coder writes ugly-but-correct code, CI catches it 30s after PR opens. Critic-on-CI-failure (already partly built via pr-watcher.ts) loops back. This is how every other autonomous-PR system works (Aider, OpenHands, claude-code-action). |

## Why The Trajectory Diverges

Per agent 1: **Hermes is reimplementing GitHub Actions on a 2GB-heap VPS without sandboxing.**

Each subprocess in the chain (clone → npm ci × 2 → tsc → biome → claude → git push → gh pr create) is a failure point. Unlike GitHub Actions:
- Variable PATH (systemd strips it)
- No retry, no isolation
- Heap contention (tsc 4GB + bot tsc + biome + claude all in one process tree)
- Subprocess exit-code interpretation has bugs (biome returning 0 for "no files matched" gets treated as success)

Pre-flight gate is correct in PRINCIPLE (machine-verifiable completion, Ralph Loop pattern). But IN PRACTICE, our implementation has 8 known failure modes already, each requiring debugging in fresh /tmp clone (can't iterate locally).

## The One Path

**Simplify aggressively. Ship today. Defer Docker.**

```
preflight.ts BEFORE: forbidden-paths + typecheck (root or bot or both) + biome scope detection + biome lint + heap augmentation + 4-mode scope routing + tests
preflight.ts AFTER:  forbidden-paths + typecheck (scoped to bot if bot-only) + tests (if touched)
```

Removed:
- Biome lint entirely (CI catches; ~30s downstream)
- Heap augmentation (only needed for biome on full repo)
- Multi-mode scope routing for lint
- Special "lint scope" detection

Kept:
- Forbidden paths (security; no overhead)
- Typecheck (real bug catcher; ~5-8s on bot only)
- Tests (only if touched; usually skipped)

**Expected runtime:** 5-8s pre-flight when Coder touches bot/ only (most common case).

**Expected bug surface rate after simplification:** 1 new mechanical bug per 25+ min (per agent 1's MEDIUM-confidence forecast). Most remaining stress points are auth-expiry / parallel-races / tsc OOM-resurgence — all rarer than the lint-config issues we're hitting now.

## What We're NOT Building Tonight

- Docker isolation per /fix (right answer for Phase 2; 6hr lift; needs concentration)
- Pre-flight retry-with-fix-suggestions
- CI-failure-feeds-Critic loop (partly via pr-watcher.ts; full version needs more)
- Coder context object / event log (Anthropic Managed Agents pattern)
- Per-bot cost tracking in Supabase
- Phoenix observability

Defer all. Ship the simplification, prove 3 clean /fix runs back-to-back, then revisit.

## Sources

- 3-agent dispatch this session
- Agent 1 architecture audit: pre-flight as fragility source, drop biome, add Docker
- Agent 2 alternatives comparison: stick with custom Hermes, migration not worth it
- Agent 3 production timeline: 1 success / 8 failure rate, 8.4 min between bugs, diverging trajectory
- arxiv.org/abs/2604.03551 - AgenticFlict dataset, 27.67% conflict rate baseline
- decodingai.com/p/ralph-loops - Boris Cherny Claude Code creator: verification signal 2-3x quality
- github.com/Aider-AI/aider - 43K stars, 6yr mature
- github.com/All-Hands-AI/OpenHands - 70K stars, $18.8M Series A, 53% SWE-bench
- github.com/anthropics/claude-code-action - official, would need Telegram bridge
- Doc 521-529 prior Hermes design

## Staleness + Verification

- Numbers verified via gh PR list + Supabase hermes_runs table query 2026-04-27
- Re-validate by 2026-05-27 with 30 days of post-simplification data

## Next Actions

| # | Action | Owner | Type | By |
|---|--------|-------|------|-----|
| 1 | Ship simplification PR: remove biome from preflight.ts, simplify scope routing | Claude | Code | Today |
| 2 | Pull on VPS + restart zao-devz-stack | Claude | SSH | Today |
| 3 | Test 3 /fix runs back-to-back, all task types | Zaal | Manual | After step 2 |
| 4 | If 3/3 succeed: declare foundation locked, move to next features | Zaal+Claude | Decision | After step 3 |
| 5 | If <3/3 succeed: STOP, root-cause the new bug, do NOT add complexity | Zaal+Claude | Discipline | After step 3 |
| 6 | Sprint 2: Docker isolation per /fix (Dockerfile, refactor cloneAndBranch) | Claude | Code | Sprint 2 |
| 7 | Sprint 3: full CI-failure-Critic loop via pr-watcher | Claude | Code | Sprint 3 |
| 8 | Re-validate this audit 2026-05-27 with 30-day production data | Claude | Audit | 2026-05-27 |

## Also See

- Doc 523 + 527 + 529 (Hermes architecture + multi-bot coordination + pre-flight design)
- Doc 528 (pi.dev coding agent - alternative considered)
- bot/src/hermes/preflight.ts - the file getting simplified in step 1
- PR #322 - the only successful Hermes run (proof Coder + Critic CAN work without pre-flight)
- PR #321 - the original sin (Coder PR sat DIRTY 13hrs because no gate)
