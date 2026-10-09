# Pre-Merge Gate: security-review the route + run the FULL suite

Typecheck-clean is not auth-clean, and touched-file-green is not suite-green. Incidents (#2829 anonymous board leak, #2830 red main): `research/dev-workflows/2649-rules-history/archive/pre-merge-security-and-suite.md`.

**Both checks pass BEFORE any merge** (a merge gate, not a build gate):

1. **Security-review every route the PR adds or changes** (`src/app/api/**/route.ts` and any handler that reads/writes data), by READING the handler:
   - `getSession()` runs and returns 401 with no session BEFORE any data access. Assume a route leaks until you have read its guard.
   - A service-role / RLS-bypassing key (`SUPABASE_SERVICE_ROLE_KEY`, `COWORK_TRACKER_KEY`, ...) is gated by session + admin/owner check where relevant.
   - Zod on input, sanitized errors, no server secrets in the response.
   - Applies hardest to subagent-built code: "typecheck clean / renders" says nothing about authorization. When in doubt, run `/security-review`.
2. **Run the FULL test suite** (`npm run test` / the bot's `vitest run`), not only touched files.

A genuinely public endpoint says so explicitly in the PR; silence is a fail.
