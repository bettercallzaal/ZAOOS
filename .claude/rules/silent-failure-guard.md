# Silent-Failure Guard

A system reports SUCCESS while accomplishing NOTHING. Incidents (cocconcertz admin cookie, 7-week green cron, never-run tests, z.thezao.xyz open writes): `research/dev-workflows/2649-rules-history/archive/silent-failure-guard.md`; sweep `research/security/2093-silent-failure-sweep/`. Rule numbers are stable.

1. **Verify the real EFFECT, not the wrapper's exit code.** `curl | tee` reports `tee`. Never gate on a pipe without `set -o pipefail`; prefer asserting the actual result.
2. **A 200 / exit 0 is not proof.** Assert the status explicitly (`curl -fsS` or `-w '%{http_code}'`); for a job, assert its output exists and is non-empty.
3. **A missing tool is a FAIL.** If the verifier cannot load or is not installed, the step exits non-zero and blocks.
4. **`|| true` never goes on a gate or security check** - banned on secret scans, doc guards, migrations, deploy verifies, anything whose failure should stop the line. Fine on an expected-no-match grep or an optional platform install. If in doubt, do not mask.
5. **Security scans fail closed.** `DIFF=$(git diff ... || true)` yielding empty passes trivially - use `set -o pipefail` and check the scanner ran.
6. **A soft-fail must be LOUD:** returning `{ok:true}` on a failed write is acceptable only if logged at error level AND surfaced; prefer a distinct status.
7. **Health checks assert their dependencies** (DB, the key's real scope, the queue).
8. **An escape hatch keyed on ABSENT configuration is dead on the deploy target.** "Secret unset = no auth" must assert it is not on the deploy target (`VERCEL`, `CI`, a hostname) and fail closed there, for reads and writes.
9. **"Fixed and live" is proven by a refused request to the deployed URL, pasted into the doc** - the `curl` and its 401. Code and tests do not prove the deployment.

Before marking any check done: did I assert the real effect? Would it still go green if the thing were completely broken? Is a `| tee`, `| cat` or `|| true` hiding an inner failure? Does it fail closed if the verifier is missing?
