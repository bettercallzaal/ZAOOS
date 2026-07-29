# Silent-Failure Guard

A system reports SUCCESS while accomplishing NOTHING. The dangerous kind: a
green check, a 200, an exit 0 - masking a broken state, a dropped write, or a
disabled security control. This rule exists because three of these shipped in
the ZAO system and stayed invisible for weeks.

## The three that motivated this (2026-07-27, all confirmed)

1. **Admin bypass, live in prod.** cocconcertz.com accepted the literal cookie
   value `admin` as full admin. It 200'd normally. One curl header = delete
   events, message all users, change roles.
2. **Cron green for 7 weeks while doing nothing.** An auto-close job 503'd every
   run (its key was in GitHub but never in Vercel), yet the CI step piped
   `curl | tee`, so bash reported `tee`'s exit 0 - green for ~7 weeks.
3. **Test suite that never ran.** `vitest.config.ts` failed to load under Node
   20 (ERR_REQUIRE_ESM); the job passed anyway. Renaming to `.mts` turned 0
   real tests into 149.

Sibling case: a Cloudinary `api.ping()` that returns `{status:"ok"}` regardless
of whether the key actually has read/create scope - it masked a 24-day
permission outage.

## The rules (behavior-changing)

1. **Verify the real EFFECT, not the wrapper's exit code.** A pipeline's exit
   is the LAST command's. `curl | tee` reports `tee`. Never gate on a piped
   command without `set -o pipefail`, and prefer asserting the actual result
   (the HTTP status, the row count, the file's existence) over any exit code.
2. **A 200 / exit 0 is not proof of success.** For an endpoint, assert the
   status explicitly (`curl -fsS` or check `-w '%{http_code}'`). For a job,
   assert the thing it was supposed to produce exists and is non-empty.
3. **A missing tool is a FAIL, not a pass.** If the verifier (esbuild, the test
   runner, a scanner) can't load or isn't installed, the step must exit
   non-zero and BLOCK - never fall through green. (Extends agent-loops.md rule
   30, vacuous-verify.)
4. **`|| true` never goes on a GATE or a SECURITY check.** It is fine on a grep
   whose no-match is expected, or an optional platform-specific install. It is
   banned on anything whose failure should stop the line - secret scans, doc
   guards, migrations, deploy verifies. If in doubt, do not mask.
5. **Security scans fail closed.** A secret/PII scan that errors must ABORT, not
   pass. `DIFF=$(git diff ... || true)` that yields empty-on-failure trivially
   passes the scan - use `set -o pipefail` and check the scanner ran.
6. **A "soft-fail" must be LOUD, not silent.** Returning `{ok:true}` when a DB
   write failed is acceptable UX only if the failure is logged at error level
   AND surfaced (alert / metric) - otherwise it is silent data loss. Prefer a
   distinct status the caller can see, or at minimum a monitored error log.
7. **Health/ping checks assert their dependencies.** A health endpoint that
   returns 200 without checking the DB / the key's real scope / the queue is
   theater. Check the actual capability the check claims to prove.

## Before marking any check "done"

- Did I assert the real effect, or just an exit code / status?
- Would this still go green if the underlying thing were completely broken?
- Is any `| tee`/`| cat`/`|| true` hiding an inner failure on a gate?
- If the verifier were missing, does it fail closed?

## Source

Established 2026-07-27 from the three confirmed incidents above (ZAOcowork admin
bypass, auto-close cron, never-run tests) + the Cloudinary ping. Companion to
`agent-loops.md` rules 1 (ground truth) and 30 (vacuous verify). Sweep findings:
`research/security/2093-silent-failure-sweep/`.
