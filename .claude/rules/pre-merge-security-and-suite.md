# Pre-Merge Gate: security-review the route + run the FULL suite

Established 2026-08-05 after two bugs shipped to main in one day and were caught by
a SIBLING loop / CI, not by the author:

1. **Anonymous board leak.** A subagent-built route (`/api/tasks/list`, PR #2829)
   shipped with NO session guard - it used the COWORK_TRACKER service-role key
   (bypasses RLS) and returned the entire cowork task board (titles, owners, due
   dates) to any anonymous internet caller. Merged after the subagent reported
   "typecheck clean + renders." Fixed by #2839.
2. **Red main from a partial test run.** A change to `nextDocNum` (PR #2830) broke a
   research-doc test; main CI was red until #2842. Merged after tsc + the author's
   touched files passed - but not the FULL suite that held the broken test.

The lesson both share: **typecheck-clean is not auth-clean, and touched-file-green
is not suite-green.** This rule makes the two missing checks mandatory before merge.

## The gate (behavior-changing) - both checks pass BEFORE any merge

### 1. Security-review every route the PR adds or changes

For each `src/app/api/**/route.ts` in the diff (and ANY handler that reads/writes
data), confirm - by reading the handler, not trusting a summary:

- **Session guard present.** `getSession()` (or the repo's auth check) runs and the
  handler returns **401 when there is no session**, BEFORE any data access
  (`api-routes.md`). A route with no session check is the default failure - assume
  it leaks until you've read the guard.
- **Service-role key never behind an open door.** If the route uses a
  service-role / RLS-bypassing key (SUPABASE_SERVICE_ROLE_KEY, COWORK_TRACKER_KEY,
  etc.), it MUST be gated by session + (where relevant) an admin/owner check. A
  service-role query behind an unauthenticated GET is a full-table leak.
- **Zod on input, sanitized errors, no server secrets in the response**
  (`api-routes.md`, `secret-hygiene.md`).

This applies HARDEST to **subagent-built code**: a subagent's "typecheck clean /
renders / graceful degradation" is a claim about compilation + happy-path, NOT about
authorization (`anti-fabrication.md` rule 33, `confirm-before-claiming-absence.md`).
The orchestrator READS the route's auth before merging. When in doubt on a
security-sensitive route, run `/security-review` first.

### 2. Run the FULL test suite, not just touched files

Before merge, run the whole relevant suite (`npm run test` / the bot's `vitest run`),
not only the files you edited. A change to a shared helper (`nextDocNum`, a memory
block, a formatter) breaks tests in files you did not open. "My touched files pass"
is not "the suite passes" - and a red main is a broken gate for every other PR
(`silent-failure-guard.md`, `loop-evals.md` gate B: no regression in coverage).

## Why this is not already covered (and now is)

`loop-evals.md` gate E says "safety unchanged - Zod / session / auth intact, never
removed" and gate A says the suite is green - but those were written for the
autonomous loop grading its OWN diff. This rule makes them bite at the **human/merge**
boundary too, and names the specific miss: merging a subagent's route on its word
without reading the auth guard, and merging on a partial test run.

## Guards

- This is a MERGE gate, not a build gate - it does not block opening a PR, it blocks
  merging one. PR-only autonomous work still opens PRs freely; a human (or the
  orchestrator) runs this gate before the merge.
- Not theater: if the route genuinely needs no auth (a truly public endpoint), say so
  explicitly in the PR - the default is that it needs a guard, and silence is a fail.

## Source

Zaal 2026-08-05, from the same-day #2829 anonymous-board leak (fixed #2839) + the
#2830 test regression (fixed #2842). Siblings: `api-routes.md` (the session-guard
rule that was skipped), `loop-evals.md` (gates A/B/E), `silent-failure-guard.md`,
`anti-fabrication.md` (rule 33 verify subagent claims), `confirm-before-claiming-absence.md`,
`secret-hygiene.md`.
