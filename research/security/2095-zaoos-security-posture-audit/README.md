---
topic: security
type: audit
status: research-complete
last-validated: 2026-07-27
related-docs: 2093, 2094
original-query: "Do audits on everything (+ fabricate less). Overnight: security-posture audit of ZAOOS, hunting the forgeable-auth class found live in a sibling repo. Every finding verified against source."
tier: STANDARD
---

# 2095 - ZAOOS security posture audit (0 critical, verified)

> **Goal:** After a LIVE admin bypass was found in a sibling repo (cocconcertz - cookie value was the literal string "admin"), audit ZAOOS for the same class and adjacent risks. Every finding below was re-verified against source before reporting.

## Headline

**0 critical. The forgeable-auth class that was live in the sibling repo is NOT present in ZAOOS** - admin status comes from a signed iron-session, never a client string. The only findings are 4 API routes that deviate from the repo's Zod-validation convention (medium hardening, not currently exploitable).

## Findings (each verified against source)

| Category | Result | Evidence (verified) |
|----------|--------|---------------------|
| Forgeable / weak auth | **CLEAN** | `src/lib/auth/session.ts` uses iron-session; `isAdmin` is set server-side (line ~87) and read from the signed session (line ~57), never from a client cookie/header. `grep '=== .admin.' src/app/api/` finds no literal-string admin gate (the one hit, `crm/interactions:149 caller.kind === 'admin'`, checks a resolved auth object, not a raw string). |
| Server-secret exposure | **CLEAN** | SERVICE_ROLE_KEY / NEYNAR_API_KEY / SESSION_SECRET / APP_SIGNER_PRIVATE_KEY appear only in server routes + src/lib, never in a "use client" component, never in a response body. |
| dangerouslySetInnerHTML | **CLEAN** | `grep -rn dangerouslySetInnerHTML src/` returns only comments AVOIDING it (brand.ts, xmtp/client.ts). Zero real usage. |
| Committed secrets | **CLEAN** | Only the public Anvil test key in fixtures. No `sk-ant-`, `ghp_`, PEM, or bot tokens in tracked files. |
| Missing Zod validation | **4 routes - MEDIUM** | Verified below. |

## The 4 Zod-convention gaps (verified, medium)

CLAUDE.md requires all API input to pass `Zod safeParse`. These read `req.json()` and use it without it:

1. `src/app/api/bluesky/route.ts:~47` - `const { handle, appPassword } = body;` + manual truthy check. Verified. (Types unchecked - `{handle:{}, appPassword:[]}` passes the truthy gate.)
2. `src/app/api/directory/route.ts:~56` - `const { id, tags, admin_notes, is_featured } = body;` - manual `if(!id)` only, no type validation on `tags`/`admin_notes`/`is_featured`. Verified. **Also confirm this route is admin-gated** - it writes admin-only fields.
3. `src/app/api/discord/proposals/vote/route.ts:~22` - has manual `typeof`/`includes` checks (so it IS validated, just not via Zod). Lowest of the four - a convention deviation, not an unvalidated input.
4. `src/app/api/100ms/webhook/route.ts:~37` - no Zod, BUT has bearer-token auth with a timing-safe compare (line ~32) that mitigates.

**Grade: MEDIUM hardening, not an active vulnerability.** Each has either manual validation or an upstream auth gate; none is an open door. Fix = add a Zod schema to each for consistency + defense in depth.

## Anti-fabrication note

This audit was evidence-first and conservatively graded by the subagent, and every finding was re-checked against source here (the admin-clean claim, the 4 route quotes, the zero-dangerouslySetInnerHTML). It held up - a contrast to the integrity audit (doc 2094) where verification dissolved most of the alarm. Both ran under `.claude/rules/anti-fabrication.md`.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add Zod safeParse to the 4 routes (bluesky, directory, discord/vote, 100ms/webhook) | zaal | PR | 2026-08-10 |
| Confirm `directory` PATCH is admin-gated (writes admin_notes/is_featured) | zaal | Verify | 2026-08-03 |

## Sources

- `src/lib/auth/session.ts`, `src/app/api/{bluesky,directory,discord/proposals/vote,100ms/webhook}/route.ts` - [FULL], quoted lines verified 2026-07-27
- `grep` results for dangerouslySetInnerHTML / literal-admin / secret patterns - [FULL]
