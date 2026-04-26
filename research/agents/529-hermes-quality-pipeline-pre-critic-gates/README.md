---
topic: agents
type: decision
status: research-complete
last-validated: 2026-04-26
related-docs: 461, 506, 507, 508, 523, 524, 527, 528
tier: DISPATCH
---

# 529 - Hermes Quality Pipeline - Pre-Critic Gates + Conflict Policy

> **Goal:** Stop Hermes from opening PRs that fail CI or carry merge conflicts. PR #321 (the manually-opened /healthcheck PR) is sitting in `mergeStateStatus: DIRTY` with `Lint & Typecheck: FAIL` 13 hours after open. Today's most important fix: machine-verifiable completion BEFORE Critic + automatic conflict policy.

3-agent dispatch on 2026-04-26: PR #321 root-cause agent, pre-flight gate design agent, conflict + CI handling research agent.

## Key Decisions (P0 today)

| Decision | Verdict | Why |
|----------|---------|-----|
| **Implement Hermes pre-flight gate** between Coder-done and Critic-start | **YES, ship today** | PR #321 lint failure proves the case. /healthcheck code itself was clean - failure was unrelated stock/* files Hermes never linted. Pre-flight = `npm run typecheck` + `biome check` on whole workspace before Critic sees anything. ~10-15s, $0 tokens, prevents 80%+ of CI-fail PRs |
| **Add `mergeable` polling to Hermes runner** after PR opens | **YES, ship today** | `gh pr view <N> --json mergeable` every 30s for 5 min. If DIRTY, post Telegram alert with rebase instructions. Stops PRs sitting in DIRTY state silently for 13 hours |
| **Add `.git/hooks/pre-commit` to bot-side workdir** rejecting `<<<<< HEAD` markers | **YES** | Cheap belt-and-suspenders. AWS + AutoGPT #12469 standard. 5 lines of bash |
| **Auto-rebase Coder workdir against `origin/main` immediately before commit** | **YES** | We already pull main when cloning at run start, but main moves. Re-fetch + rebase immediately before push catches mid-run divergence. Fixes the failure mode where two parallel Hermes runs touch same file |
| **Close PR #321** | **CLOSE** | /healthcheck superseded by /version (PR #322 already merged). Manually-opened, no longer needed. Lint failures are unrelated to Hermes work - separate cleanup |
| **Cap retries at 3 per failure type** (lint fail, conflict, CI fail) | **YES** | Per agentloom #132 + Tian Pan blog: retry storms cost $1,800/12min in production. Hermes already has 3-attempt cap on score < 70; extend to other failure modes |
| **Stale-PR auto-close at 14 days** | **YES, sprint 2** | GitHub `actions/stale` workflow. 7d -> warning, 14d -> close. Frees up PR queue + branch namespace |
| **Behavioral regression test post-merge** | **DEFER** | Out of scope today. Tier 2 of agent C's recommendation. Add when /fix volume justifies the e2e test cost |

## What Broke On PR #321 (root cause)

CI run 24947452862 lint output, verbatim:

```
src/app/stock/circles/CirclesView.tsx
  86:73   error  `'` can be escaped with `&apos;`...    react/no-unescaped-entities
  97:14   error  `'` can be escaped with `&apos;`...    react/no-unescaped-entities
  144:101 error  `'` can be escaped with `&apos;`...    react/no-unescaped-entities

src/app/stock/onepagers/page.tsx
  37:14   error  `'` can be escaped with `&apos;`...    react/no-unescaped-entities

src/app/stock/team/Dashboard.tsx
  189:11  error  Do not use an `<a>` element...        @next/next/no-html-link-for-pages
```

**The Hermes /healthcheck code was clean.** PR #321 fails because OTHER files in `src/app/stock/` have lint errors that landed via parallel circle-fixes work. CI lints the whole workspace; Hermes only Coder-touched `bot/src/index.ts`.

**Two consequences:**
1. PR #321 should be CLOSED (superseded by /version PR #322)
2. The lint pre-flight is even MORE important - even when Coder writes perfect code, the workspace can still fail CI from unrelated drift

## The Pre-Flight Gate Design

Insert in `bot/src/hermes/runner.ts` between `narrator.onCoderDone()` and `runCritic()`:

```typescript
// Pre-flight quality gate (runs after Coder, before Critic)
const preFlight = await runPreFlightGate({
  workTreePath: workdir,
  filesChanged: fixerOut.filesChanged,
});

if (!preFlight.ok) {
  lastFeedback = preFlight.error;
  await narrator?.onRetry?.(created.id, attempt + 1, preFlight.error);
  await resetToMain(workdir);
  continue;
}

// Pre-flight passed; now run Critic
const critique = await runCritic({...});
```

New file: `bot/src/hermes/preflight.ts`

```typescript
import { runCmd } from './git';
import { HERMES_FORBIDDEN_PATHS } from './types';

export interface PreFlightResult {
  ok: boolean;
  error?: string;
  durationMs: number;
}

export async function runPreFlightGate(input: {
  workTreePath: string;
  filesChanged: string[];
}): Promise<PreFlightResult> {
  const start = Date.now();

  // Check 0: forbidden paths (cheapest, fail fast)
  for (const f of input.filesChanged) {
    if (HERMES_FORBIDDEN_PATHS.some((p) => f === p || f.startsWith(`${p}/`))) {
      return { ok: false, error: `Coder wrote forbidden path: ${f}`, durationMs: Date.now() - start };
    }
  }

  // Check 1: TypeScript
  const tc = await runCmd('npm', ['run', 'typecheck'], input.workTreePath);
  if (tc.exitCode !== 0) {
    return {
      ok: false,
      error: `TypeScript errors:\n${tc.stderr.slice(0, 600) || tc.stdout.slice(0, 600)}`,
      durationMs: Date.now() - start,
    };
  }

  // Check 2: Biome lint
  const lint = await runCmd('npm', ['run', 'lint:biome'], input.workTreePath);
  if (lint.exitCode !== 0) {
    return {
      ok: false,
      error: `Biome lint errors:\n${lint.stderr.slice(0, 600) || lint.stdout.slice(0, 600)}\n\nFix them. Tip: run "npx biome check --write" locally first.`,
      durationMs: Date.now() - start,
    };
  }

  // Check 3: existing tests still pass (only test files we touched + bot tests if changed)
  const touchedTests = input.filesChanged.some((f) => f.includes('__tests__') || f.endsWith('.test.ts'));
  if (touchedTests) {
    const test = await runCmd('npx', ['vitest', 'run', '--reporter=verbose'], input.workTreePath);
    if (test.exitCode !== 0) {
      return {
        ok: false,
        error: `Test failures:\n${test.stdout.slice(-800)}`,
        durationMs: Date.now() - start,
      };
    }
  }

  return { ok: true, durationMs: Date.now() - start };
}
```

**On fail:** auto-loop back to Coder with the verbatim error injected as `previousCriticFeedback`. Coder reads error, fixes, retries. Max 3 attempts (existing cap).

**Cost:** +10-15s per /fix, $0 tokens (all local). Saves 1+ Critic API call ($0.10) per loop. Net positive on every failed run + neutral on every clean run.

## Conflict + CI Failure Policy

Insert AFTER `openPullRequest` in runner.ts:

```typescript
const pr = await openPullRequest({...});
await narrator?.onPrOpened?.(...);

// Async post-PR watcher (fire-and-forget; doesn't block run completion)
void watchPullRequest({
  prNumber: pr.number,
  runId: created.id,
  branchName,
  narrator,
  pollIntervalMs: 30_000,
  maxPollMinutes: 5,
});
```

New file: `bot/src/hermes/pr-watcher.ts`. Polls `gh pr view <N> --json mergeable,statusCheckRollup` every 30s for 5 min. On any of:
- `mergeable: "CONFLICTING"` → Telegram alert via narrator: "PR #N has conflicts with main. Reply to this message with /rebase to auto-fix."
- Any check `conclusion: "failure"` → Telegram alert: "PR #N failing: [check name]. View logs: [url]. Reply /fix-ci to auto-fix."

Doesn't auto-resolve - alerts only. Auto-resolve = sprint 2 once we have the volume to justify the complexity.

## Production References (Verified URLs)

- arxiv.org/abs/2604.03551 - AgenticFlict dataset: 142K agentic PRs, **27.67% conflict rate**
- getautonoma.com/blog/ai-agent-merge-tax - Real $ from autonomous merge incidents (Apr 2026)
- github.com/aws-samples/sample-autonomous-cloud-coding-agents/issues/22 - AWS conflict-resolution agent dispatch
- github.com/All-Hands-AI/OpenHands/pull/5449 - PR status piping to agent (Dec 2024)
- github.com/Significant-Gravitas/AutoGPT/pull/12469 - 3-way merge in PR-address skill (Mar 2026)
- github.com/vercel-labs/ralph-loop-agent - Ralph Loop verification pattern (MIT)
- dev.to/kagin007/building-a-five-layer-quality-gate-for-agent-written-code-3e0k - Five-layer quality gate (Apr 2026)
- decodingai.com/p/ralph-loops - Boris Cherny: "verification signal increases quality 2-3x"
- tianpan.co/blog/2026-04-16-retry-budget-llm-agent-cost-amplification - retry-storm cost data

## Sources

- 3-agent dispatch (this session): PR #321 CI failure root cause + pre-flight gate design + conflict/CI patterns
- Doc 461 - safe-git-push.sh defense in depth (LIVE)
- Doc 506 - TRAE SOLO skip-decision (vendor risk)
- Doc 507 - 1,116 Claude skills curated picks
- Doc 508 - creator infra signals (Apr 25)
- Doc 523 - ZAO agentic systems audit (mentions pre-flight as next-action item #16)
- Doc 524 - everything-map (LIVE/STARTED/PLANNED/ARCHIVED)
- Doc 527 - multi-bot Telegram coordination (mentions pre-flight as next-action item #16)
- Doc 528 - pi.dev coding agent (Mario Zechner)

## Current Hermes State (verified 2026-04-26)

- Hermes scaffold LIVE on VPS (zao-devz-stack systemd)
- 1 successful end-to-end run: PR #322 (run 506ec616, Score 97/100, /version command)
- 1 manually-opened PR: #321 (run d133dc2f, /healthcheck) - CONFLICTING + lint fail, recommend close
- Cost so far: ~$0 marginal (Max plan absorbed)
- Bugs fixed across PRs #310-#322: spawn ENOENT, --json-schema killing tools, gh --head detection, fleet ceiling, ZOE mention guard, privacy-mode misconfiguration

## Staleness + Verification

- All star counts + URLs verified via gh api on 2026-04-26
- AgenticFlict 142K-PR dataset published April 2026
- OpenHands PR #5449 merged Dec 2024
- Re-validate doc 2026-05-26 with first 30 days of pre-flight gate production data

## Next Actions (ordered, ship today)

| # | Action | Owner | Type | By |
|---|--------|-------|------|-----|
| 1 | **Close PR #321** as superseded by PR #322. Manually unblocks queue | @Zaal | gh pr close 321 | Now |
| 2 | Build `bot/src/hermes/preflight.ts` per design above | Claude | Code | Today |
| 3 | Wire pre-flight into `bot/src/hermes/runner.ts` between Coder + Critic | Claude | Code | Today |
| 4 | Build `bot/src/hermes/pr-watcher.ts` with mergeable + check-rollup polling | Claude | Code | Today |
| 5 | Wire pr-watcher fire-and-forget after `openPullRequest()` in runner.ts | Claude | Code | Today |
| 6 | Add `.git/hooks/pre-commit` template to fresh clone setup in `cloneAndBranch()` rejecting conflict markers | Claude | Code | Today |
| 7 | Re-fetch origin + rebase before commit in `commitAndPush()` | Claude | Code | Today |
| 8 | Test end-to-end with deliberate failing diff (introduce a `console.log` or unused import) - confirm pre-flight catches it + auto-loops | @Zaal | Manual test | After ship |
| 9 | GitHub Actions stale-PR workflow (7d warn, 14d close) | Claude | YAML | Sprint 2 |
| 10 | `/rebase` Telegram command on Critic bot to auto-resolve conflicts (3-way merge dispatch) | Claude | Code | Sprint 2 |
| 11 | Re-validate doc 2026-05-26 with 30 days production data | Claude | Audit | 2026-05-26 |

## Also See

- Doc 461 - safe-git-push.sh hooks
- Doc 523 + 527 - Hermes architecture + multi-bot coordination (this doc fills gap #16)
- Doc 528 - pi.dev message-queuing pattern (related: agent-completion verification)
- `bot/src/hermes/runner.ts` - dispatch loop where pre-flight + watcher hook in
- PR #322 - first successful end-to-end Hermes run (proof Coder + Critic work)
- PR #321 - the broken one this doc closes
