# Loop Evals - a rubric every autonomous loop passes BEFORE it opens a PR

From Karpathy's agent model (march of nines: gate each step; agents bloat) and Anthropic's Default-FAIL harness. Sources, incidents (#3502/#3505): `research/dev-workflows/2649-rules-history/archive/loop-evals.md`.

## The gate - all applicable checks pass before a PR opens

A research/docs loop runs A + F. A code-writing loop runs A-F.

- **A. Ground truth green.** `npm run typecheck` = 0 errors, build/`esbuild` bundles, relevant `vitest` passes, and for bot code a non-entrypoint boot-import succeeds. A missing verifier is a FAIL.
- **B. No regression in coverage.** Test count after >= before.
- **C. Anti-bloat pass.** The PR body answers: did I duplicate a block instead of reusing a component/hook/helper? Is a new function a variant of an existing one - why not extend it? Did I leave dead code, an unused import, a commented-out block? Is the diff size sane (500+ lines for a small fix: justify or shrink)? Run `biome check` on touched paths; a lint regression fails.
- **D. Scope honesty.** Only what the task named; split out drive-bys.
- **E. Safety unchanged.** Zod, session/auth, error handling, RLS intact or stronger. No secret/PII in the diff; the case-insensitive scan is its own step, not `&&`-chained to the commit.
- **F. Evidence in the report.** Each check's result with proof (typecheck output, before/after test count, biome result) - never "all good".

## Per-loop reliability

`reliability = merged / (merged + auto-reverted + human-rejected)` over a trailing window. Targets: research/docs 90%, code 95%, live route or deploy path 99%+. Below target, the loop STOPS opening PRs and flags a human. The number is reported.

## High-stakes gate: default-FAIL, fresh-context evaluator

For high-stakes output (code change to a live route, deploy-path edit, security-relevant finding, anything graded critical), a SEPARATE evaluator - fresh context, NO write/edit tools - reviews against evidence and returns PASS / NEEDS_WORK. Every criterion starts `false` and flips only when the evaluator opens the cited evidence and confirms it; unverifiable = NEEDS_WORK. Low-stakes prose loops do not need one.

## Review the direction the change was FOR, not only the direction you fear

1. **Name both directions before reviewing a gate or filter:** what it must never let through AND what it must never block. Check each.
2. **Test the case in the PR title** with a control that is red without the change - not by reading the diff and agreeing.
3. **Treat an impossibility claim in a comment ("indistinguishable", "cannot be empty", "safe because") as the thing to check.** A coherent, false justification is the most effective thing at stopping a reviewer checking.
4. **When correcting such a comment, name the false claim** rather than quietly replacing it; prefer a signature that cannot express the confusion (`None` for could-not-read vs `[]` for read-empty).
5. **A negative result is reported as a negative result** - "I could not construct a case" is not "the problem is not there".

Twin: `~/zao-vault/AGENTS.md` rule 10 ("state what the count would read if the thing you fear had happened"). **Editing either means checking the other.** This is two extra questions, not a re-review of everything.

## Guards

Passing earns a PR, never an auto-merge or a gated action. The rubric is a floor, not a ceiling: a loop may add checks, never skip an applicable one, and a check that cannot run is a FAIL (fail closed). No theater: a clean result is reported honestly; a failing check BLOCKS. Overnight, even a passing code change is not auto-applied to live routes.
