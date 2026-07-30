---
topic: security
type: audit
status: research-complete
last-validated: 2026-07-30
related-docs: 2093, 2142
original-query: "Overnight repo audit loop, ZAOOS first: unvalidated routes, silent failures, secret exposure, webhook fail-open, missing auth"
tier: STANDARD
---

# 2143 - ZAOOS API security audit (2026-07-30 overnight) - layer is SOLID, 2 low findings

> **Goal:** Systematic sweep of the 313-route API surface for the classes that have actually bitten (doc 2093 silent-failure sweep lineage): fail-open webhooks, unvalidated mutating input, secret echo, ungated crons, vacuous CI gates. Every claim below was verified against source this run; grades follow anti-fabrication (lowest severity the evidence supports).

## Verdict

The API layer is in good shape. No critical, no high. Two low findings, one hygiene class.

## What was swept + what was found

| Class | Method | Result |
|-------|--------|--------|
| Webhook fail-open (missing secret = accept) | Read all 7 signature-gated webhooks | CLEAN - all 7 fail CLOSED (github 503, neynar 503, alchemy reject-if-no-key, juke 401, stream sig=false, 100ms 500, miniapp uses Farcaster's parseWebhookEvent). Timing-safe compares where applicable |
| Mutating routes without Zod | Scripted scan of every route.ts with POST/PUT/PATCH/DELETE | 36 hits, then guard-classified: 7 sig-gated webhooks, 3 secret-gated crons/syncs, 25 session/admin-gated, 1 no-guard (`auth/logout` - destroys own session, no input, harmless) |
| The 25 session-gated hits, spot-checked | Read upload, directory, platforms/youtube, respect/sync | Most take NO body (Zod inapplicable) or validate manually (upload: type allowlist + 5MB cap + server-generated filename - solid). Residual: admin PATCH routes destructure untyped JSON (see finding 2) |
| Secret echo in responses | Grep response paths for SERVICE_ROLE/SESSION_SECRET/SIGNER_PRIVATE | CLEAN - one hit (`auth/signer`) uses the app signer key server-side to sign, never returns it (documented, by design) |
| Ungated crons | Scan `api/cron/*` for CRON_SECRET/authorization | CLEAN - zero ungated |
| dangerouslySetInnerHTML | Repo-wide grep (src/) | CLEAN - zero occurrences |
| Vacuous CI gates (`|| true`) | Workflow scan | 2 benign optional-installs (ci.yml, allowed class); 1 low finding (below) |
| Pre-commit guards | Read .husky/pre-commit | ACTIVE - doc-collision + secret-scan blocking, index check advisory (intended) |

## Finding 1 (LOW): doc-collision-guard can pass vacuously

`.github/workflows/doc-collision-guard.yml:49,60` - `newdirs=$(git diff ... | grep ... || true)`. The `|| true` is for grep's expected no-match, but it also swallows a failure of the `git diff`/`git ls-tree` itself: an errored diff yields empty `newdirs` -> "Nothing to check" -> exit 0. Same shape as silent-failure-guard rule 5. Fix: `set -o pipefail` + separate the git call's error from grep's no-match.

## Finding 2 (LOW, hygiene class): admin routes with untyped JSON bodies

Pattern (e.g. `src/app/api/directory/route.ts` PATCH): admin-gated, then `const { id, tags, admin_notes, is_featured } = await req.json()` straight into a DB update - no type validation. Exploitation requires an admin session (so LOW), but type-confused values flow into `community_profiles` unchecked. A `z.object` per route is the api-routes.md contract; ~a handful of admin/settings routes share the shape. Fix batch: add schemas to the admin PATCH/PUT family - mechanical, low-risk, one PR when touched next (not urgent enough to churn 20 files overnight).

## Explicitly NOT findings

- `auth/logout` unguarded: no input, only destroys the caller's own session.
- 36 "no-Zod" raw count: after guard classification and body inspection, the real residual is finding 2's small admin family. Reporting 36 as a problem would be fabricated alarm.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| doc-collision-guard: pipefail + separate git-error from grep-no-match | @ZOE | PR | next infra touch |
| Zod schemas on the admin PATCH/PUT family (directory + siblings) | @ZOE | PR | when those routes are next touched |
| Continue the fleet audit (zao-website, sparkz public repo, zabalgamez) | @ZOE (this loop) | Audit | tonight |

## Sources

- First-party: every file cited was read this run; scans executed 2026-07-30 (route scan script, workflow greps) [FULL]
- Doc 2093 (the silent-failure sweep this extends), .claude/rules/silent-failure-guard.md + api-routes.md (the contracts audited against)
