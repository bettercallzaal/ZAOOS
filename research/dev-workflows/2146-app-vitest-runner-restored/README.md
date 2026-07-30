---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-07-30
related-docs: 2093, 2143, 2142
original-query: "Overnight: the app vitest has been unrunnable all session (rolldown native binding) - fix the runner, see the real suite state"
tier: STANDARD
---

# 2146 - App vitest runner RESTORED - suite was never running on CI; 8801/8809 pass

> **Goal:** The app test suite has been "broken (rolldown binding)" all session, so app-route changes went unverified and CI's Test job was red for a load error, not a test failure. Root-caused, fixed the runner, and surfaced the REAL state: the suite is healthy (8801/8809), with 8 pre-existing failures the broken runner was hiding.

## Root cause

vite 8 bundles with **rolldown**, not rollup. The npm optional-dependencies bug ([npm/cli#4828](https://github.com/npm/cli/issues/4828)) can skip the platform-specific native binding (`@rolldown/binding-darwin-arm64` locally, `@rolldown/binding-linux-x64-gnu` on CI). Vitest then throws `Error: Cannot find native binding` at STARTUP - the runner never loads, so ZERO tests run. This is silent-failure-guard incident #3 (a test suite that never runs) wearing a new coat: CI's Test job installs `@rollup/rollup-linux-x64-gnu` (the OLD bundler's binding) but not the rolldown one, so `npm test` on CI could not load the runner.

## Fix (this PR)

1. **CI (`.github/workflows/ci.yml`):** install BOTH `@rollup/rollup-linux-x64-gnu` and `@rolldown/binding-linux-x64-gnu` before `npm test`, matching the existing optional-binding pattern - so the runner loads and the 8800+ app tests actually execute on CI.
2. **Local:** `npm i -D @rolldown/binding-darwin-arm64` (or a clean `rm -rf node_modules package-lock.json && npm i`) restores the runner on Apple Silicon. Documented here so the next session doesn't re-diagnose.
3. **One real regression fixed:** `organism.test.ts` expected 2 control-plane organs; the live receipt-emitter wiring (PR #2713) added a 3rd (`receipts`), so the assertion is now `toBe(3)`. This regression shipped only because the runner was down - exactly the class this fix prevents.

## The 8 pre-existing failures the broken runner was HIDING

All predate this session's work; none are caused by it (verified by reading each). Surfaced now so they can be fixed with context. Grouped by root cause:

| Suite | Count | Symptom | Likely cause |
|-------|-------|---------|--------------|
| `api/events/create` | 3 (+5 false-pass) | route returned **400** where the test expected 409/201/500 | **FIXED (PR follows):** NOT schema drift - the test called `makePostRequest(valid)` with ONE arg, but the helper signature is `(path, body)`, so `valid` became the URL and the body was undefined -> `json()` empty -> 400. 5 other tests in the file were FALSE-PASSING (200/403 for the wrong reason). Route proven correct (returns 201) with a proper call. Fix: pass the path arg to all 8 calls. |
| `api/streaks` (GET) | 1 | `isActiveToday`/`isAtRisk` mismatch | date-dependent: computed against the real wall clock, not a frozen one |
| `api/streaks/record` | 2 | "same-day re-record" branch not taken | date-dependent: "today" comparison drifts with the real date |
| `api/music/history` | 1 | "filters last_played_at for today" wrong bound | date-dependent: same "today" window drift |
| `api/livepeer/clip` | 1 | "unique default names on successive calls" | FLAKY: `Date.now()`-based default name collides when two calls land in the same ms (passed on one of two runs) |

events/create is FIXED (helper-signature drift, proven route-correct). The remaining 4 date-dependent suites (streaks x2, streaks/record, music/history) use the helper correctly and are genuine date/timezone issues - they want an injected/frozen clock and a careful read of the route's "today" computation (a blind fix could mask a real TZ off-by-one), so they stay for a focused session. livepeer's "unique default names" is a Date.now() collision in the route, inherently flaky.

## Why this PR does NOT fix those 8

Overnight, PR-only, unsupervised (rule 35): fixing 7 tests across 5 unrelated route suites risks "fixing" a test to pass in a way that MASKS a real route bug (e.g. events/create's 400 might be a genuine schema regression, not a stale fixture). Surfacing them honestly with root-cause hypotheses is the correct anti-fabrication move; the fixes want a focused pass where each can be confirmed against intended behavior. Making CI run the suite is a strict improvement even while red: red-for-8-real-failures beats red-for-cannot-load.

## Impact

- App-route changes are verifiable again (the whole session they were not).
- The app-side Heart migration (doc 2139 deferred item) is unblocked - its 14-scenario recovery suite can now run.
- Every future PR that breaks an app test will be CAUGHT on CI instead of silently passing.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Fix the 4 date-dependent suites with a frozen clock | @ZOE | PR | focused session |
| Re-align events/create fixtures OR confirm the schema regression | @Zaal (ZOE) | PR | focused session |
| Now-unblocked: app-side src/lib/heart -> packages/heart-fleet delegation | @ZOE | Build | after the above |

## Sources

- First-party: local `npx vitest run` (8801/8809 pass) + the startup error trace, 2026-07-30 [FULL]
- npm/cli#4828 (the optional-deps root cause), .claude/rules/silent-failure-guard.md incident #3, doc 2142 (the deferred app-Heart migration this unblocks)
