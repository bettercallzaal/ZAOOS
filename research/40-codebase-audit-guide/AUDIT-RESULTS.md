# ZAO OS Codebase Audit Results

> **Date:** March 14, 2026
> **Auditor:** Claude Code automated scan + manual review
> **Scope:** Full codebase (`src/`, dependencies, environment, database)

---

## Summary

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 1 | Needs review |
| High | 2 | Action needed |
| Medium | 4 | Should fix |
| Low | 4 | Nice to have |
| **Pass** | **8** | **Clean** |

---

## Critical Findings

### C1: `@pigment-css/react` dependency has critical vulnerability (happy-dom)

**What:** `npm audit` found 6 vulnerabilities (3 critical, 3 moderate) all traced to `happy-dom` via `@wyw-in-js/transform` → `@pigment-css/react`. The critical issue (GHSA-37j7-fg3j-429f) allows VM Context Escape leading to Remote Code Execution.

**Impact:** This is a build-time dependency, not runtime — so the RCE risk is during build/development, not in production. However, it's still a supply chain risk.

**Action:** Evaluate if `@pigment-css/react` is still needed. If it can be removed (ZAO OS primarily uses Tailwind CSS), remove it to eliminate all 6 vulnerabilities. If needed, check for an updated version.

```bash
# Check if it's actually used
grep -r "pigment\|@pigment" src/ --include="*.ts" --include="*.tsx"
```

---

## High Findings

### H1: XMTP private key generated and stored in client-side context

**File:** `src/contexts/XMTPContext.tsx:449-450`
```typescript
const privateKey = getOrCreateLocalKey(fid);
const signer = await createLocalSigner(privateKey);
```

**What:** XMTP signing keys are generated client-side and stored in localStorage. This is by design for XMTP (browser SDK requires client-side keys), but the key management approach should be documented and reviewed.

**Risk:** localStorage is accessible to any JavaScript running on the same origin. An XSS vulnerability could extract XMTP keys.

**Action:** Document this as an accepted trade-off (XMTP browser SDK requirement). Consider: encrypt the key at rest in localStorage, clear keys on logout, and ensure no XSS vectors exist (confirmed: no `dangerouslySetInnerHTML` found).

### H2: 64 console.log/warn/error statements in production code

**What:** 64 instances of `console.*` across the codebase. These leak debug information in production and clutter browser DevTools.

**Action:** Audit each one. Remove debug logs, keep intentional error logging but route through a proper logger (or at minimum use `console.error` only for actual errors).

```bash
grep -rn "console\." src/ --include="*.ts" --include="*.tsx"
```

---

## Medium Findings

### M1: 4 API routes without explicit session authentication

| Route | Expected Behavior |
|-------|------------------|
| `src/app/api/music/metadata/route.ts` | Likely intentionally public (fetching track metadata) |
| `src/app/api/auth/register/route.ts` | Intentionally public (registration endpoint) |
| `src/app/api/miniapp/webhook/route.ts` | Intentionally public (Farcaster webhook) — verify HMAC |
| `src/app/api/webhooks/neynar/route.ts` | Intentionally public (Neynar webhook) — verify HMAC |

**Action:** Review each. If intentionally public, add a comment explaining why. Verify webhook routes validate signatures (Neynar webhook already has HMAC-SHA512 — confirm Mini App webhook also verifies).

### M2: Non-null assertions (`!`) on environment variables

**Files:** Multiple (e.g., `process.env.NEYNAR_API_KEY!`, `process.env.NEXT_PUBLIC_SUPABASE_URL!`)

**What:** Using `!` to bypass TypeScript's null check on environment variables. If the env var is missing, this will throw at runtime with an unhelpful error.

**Action:** Already partially addressed — `src/lib/env.ts` validates required env vars. Ensure all `process.env.*!` usages go through the validated `env` object instead.

### M3: No Content Security Policy headers

**What:** No CSP headers found in `next.config` or middleware. CSP is a defense-in-depth layer against XSS.

**Action:** Add CSP headers in `next.config.ts` or `middleware.ts`. Start with a permissive policy and tighten over time.

### M4: Supabase client uses service role key

**File:** `src/lib/db/supabase.ts:8`

**What:** The Supabase client is initialized with the service role key (bypasses RLS). This is used server-side in API routes which is correct, but verify it never leaks to client components.

**Action:** Confirm the Supabase client module is only imported in server-side code (API routes, server components, server actions). Never in `'use client'` files.

---

## Low Findings

### L1: Only 1 `any` type in the codebase

**File:** `src/components/chat/FeedFilters.tsx:66` — comment, not actual `any` usage

**Status:** Excellent. The codebase is well-typed.

### L2: No `@ts-ignore`, `@ts-expect-error`, or `@ts-nocheck` found

**Status:** Excellent. No type checking suppressions.

### L3: No `dangerouslySetInnerHTML` found

**Status:** Excellent. No XSS vectors through innerHTML injection.

### L4: No TODO/FIXME/HACK comments found

**Status:** Clean. No deferred technical debt markers in code.

---

## Passing Checks

| Check | Result |
|-------|--------|
| Environment variable exposure | **PASS** — only `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_NEYNAR_CLIENT_ID`, `NEXT_PUBLIC_SIWF_DOMAIN` are public. All secrets use server-only vars. |
| XSS prevention | **PASS** — no `dangerouslySetInnerHTML`, React auto-escapes JSX |
| Type safety | **PASS** — only 1 `any` in a comment, no type suppressions |
| Private key handling | **PASS** — `APP_SIGNER_PRIVATE_KEY` is server-side only, used in `api/auth/signer/route.ts` |
| Neynar key protection | **PASS** — `NEYNAR_API_KEY` is server-side only (all usages in `api/` routes and `lib/farcaster/`) |
| Webhook verification | **PASS** — Neynar webhook uses HMAC-SHA512 verification |
| .gitignore | **PASS** — `.env*` files are ignored |
| TODO/FIXME | **PASS** — none found |

---

## Recommendations (Priority Order)

| # | Action | Severity | Effort |
|---|--------|----------|--------|
| 1 | Evaluate removing `@pigment-css/react` (critical vuln) | Critical | Small |
| 2 | Audit XMTP key storage, document accepted risk | High | Small |
| 3 | Clean up 64 console.log statements | High | Medium |
| 4 | Verify Mini App webhook has signature verification | Medium | Small |
| 5 | Route all `process.env.*!` through validated `env` module | Medium | Small |
| 6 | Add CSP headers | Medium | Medium |
| 7 | Verify Supabase service role client never imported in `'use client'` files | Medium | Small |
| 8 | Run `npx knip` for dead code detection | Low | Small |
| 9 | Set up Husky + lint-staged pre-commit hooks | Low | Small |
| 10 | Add Vitest for auth flow tests | Low | Medium |

---

## Next Audit

Schedule the next audit in 30 days or after any major feature addition. Use the guide in `research/40-codebase-audit-guide/README.md` to repeat the process.
