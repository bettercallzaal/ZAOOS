# Pre-Merge Gate: security-review the route + run the FULL suite

mechanism: bin/zao-merge-only-guard, bin/zao-merge, .github/workflows/ci.yml (partial: the route read for a 401 guard is human review)

Typecheck-clean is not auth-clean, and touched-file-green is not suite-green. Incidents (#2829 anonymous board leak, #2830 red main): `research/dev-workflows/2649-rules-history/archive/pre-merge-security-and-suite.md`.

**Both checks pass BEFORE any merge** (a merge gate, not a build gate):

1. **Security-review every route the PR adds or changes** (`src/app/api/**/route.ts` and any handler that reads/writes data), by READING the handler:
   - `getSession()` runs and returns 401 with no session BEFORE any data access. Assume a route leaks until you have read its guard.
   - A service-role / RLS-bypassing key (`SUPABASE_SERVICE_ROLE_KEY`, `COWORK_TRACKER_KEY`, ...) is gated by session + admin/owner check where relevant.
   - Zod on input, sanitized errors, no server secrets in the response.
   - Applies hardest to subagent-built code: "typecheck clean / renders" says nothing about authorization. When in doubt, run `/security-review`.
2. **Run the FULL test suite** (`npm run test` / the bot's `vitest run`), not only touched files.
3. **A repo behind the merge gate has CI that can run** (ZAOOS#4058). Before a repo is gated, show its CI start and finish on one PR. A gate whose CI cannot start says why, naming the missing runner ("no runner registered for <repo>"); it never says "CI on the HEAD has not finished" for a run that will never begin. On 2026-10-20 wavewarz-protocol had 0 runners and every PR read as pending. The suites job carries a timeout. Tests on a shared runner wait on events, not wall-clock thresholds: four unrelated timing tests went red under load the same day, and one PR failed three times on three of them.

4. **Every path that can merge is a gate path** (ZAOOS#4059). An agent merges through `zao-merge` only. A merge by raw `gh api`, graphql, `curl` or the web button skips every check above, so an agent never uses one. An auto-merge workflow is a merge path too, and waits for the same evaluator verdict on the current head; until it checks one itself, docs and research PRs carry the `hold` label from open until that verdict exists. Instances: the 2026-10-20 evaluator read of the widened merge rules, which found the raw-API, env-quoting and verdict-author holes (#4059); docs-automerge merging a research PR with no verdict, which published a private path (#4086, 2026-10-21).

A genuinely public endpoint says so explicitly in the PR; silence is a fail.
