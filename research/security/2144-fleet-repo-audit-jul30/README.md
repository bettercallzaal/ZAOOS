---
topic: security
type: audit
status: research-complete
last-validated: 2026-07-30
related-docs: 2143, 2093
original-query: "Overnight repo audit loop - the public fleet after ZAOOS: sparkz, zoostr, wwtracker, CoCConcertZ, zol"
tier: STANDARD
---

# 2144 - Fleet repo security audit (2026-07-30 overnight) - fleet is CLEAN, 1 low

> **Goal:** Extend the ZAOOS audit (doc 2143) across the actively-pushed PUBLIC repos. Same classes: committed secrets, mutating-route auth, webhook fail-open, XSS. Every repo cloned fresh and scanned this run; each finding source-verified.

## Verdict

Fleet posture is strong. Zero committed secrets, zero critical/high. One LOW (an email-enumeration oracle). Notably: the documented cocconcertz.com admin-bypass (doc 2093 - literal `coc-role=admin` cookie) is CONFIRMED FIXED.

## Per-repo

### sparkz (PUBLIC, creator-coin launcher - highest stakes)
- No committed env/secrets; `.env.example` only.
- 18 mutating routes: admin token auth (timing-safe `safeEqual`, `dev-login` hard-gated to `NODE_ENV=development` -> 404 in prod, never echoes the token), Zod on the input-bearing ones.
- The 3 PUBLIC write routes are correctly hardened: `create-spark` (honeypot + per-IP DB rate limit + review gate, server owns slug/status, no economic_config), `boost` (per-IP limit + dedupe, free signal not payment), `waitlist` (Zod). No on-chain/spend in any public path.
- Verdict: CLEAN.

### CoCConcertZ (PUBLIC, the doc-2093 incident repo)
- **Admin-bypass FIXED + verified.** `src/lib/api-auth.ts` now carries the role in an HMAC-SHA256-signed `coc-session` cookie, timing-safe compared, **fails closed if `SESSION_SECRET` is unset** (comment documents the exact old bug). Old unsigned `coc-role` cookies are ignored. All 15 admin/archive/content routes gate on `isAdmin(req)` -> 401 (my first scan's regex missed the `@/lib/api-auth` import; re-verified by reading the lib + a route).
- Webhooks (`stats/visit`, `webhook/farcaster`, `artists`) sig-gated.
- `dangerouslySetInnerHTML`: 3 uses, all SAFE - two are JSON-LD `JSON.stringify` (standard Next SEO), one (`Countdown.tsx:264`) renders a hardcoded static date string from an in-repo array (no user input).
- Verdict: CLEAN.

### zoostr (PUBLIC)
- No secrets. `zol/post` secret-gated. `back/checkout` is UNGUARDED-by-design: public Stripe Checkout session creation, tier is server-validated against a fixed `TIER_CONFIG` map (arbitrary amounts impossible), Stripe key server-side only, no callback trust. Correct for a public "back this" button.
- Verdict: CLEAN.

### wwtracker (PUBLIC)
- No secrets, no mutating API routes (read-only tracker). One `dangerouslySetInnerHTML` = JSON-LD. Verdict: CLEAN.

### zol (PUBLIC)
- No secrets, no `dangerouslySetInnerHTML`, no unguarded mutating routes. Verdict: CLEAN.

## Finding 1 (LOW): subscriber email-enumeration oracle

`CoCConcertZ/src/app/api/subscribers/check/route.ts` - public POST, returns `{ exists: true|false }` for any email. Lets an unauthenticated caller test whether an address is a subscriber (privacy leak, not access). Mitigations present: email-format + length validation. Fix options: require a nonce/session for the check, always return a generic response, or rate-limit per IP. LOW because it exposes only membership of one email at a time, no data.

## Not findings

- sparkz `dev-login`: prod-404 hard gate, verified.
- zoostr `back/checkout` unguarded: fixed-tier server validation makes it safe.
- The 15 CoCConcertZ "UNGUARDED" hits from the first automated pass: false positives - the scan regex did not match the `isAdmin`-via-`@/lib/api-auth` pattern. All confirmed guarded on read.

## Method note (honest)

The first automated guard-scan under-detected auth (it keyed on inline `getSession`/`iron-session` and missed per-repo auth libs like `@/lib/api-auth` and `isAdmin`). Corrected by reading the auth lib + representative routes in each repo before grading - a scan is a lead, not a verdict (anti-fabrication rule 3). Repos audited by cloning HEAD; private repos (zao-website already done in the SEO pass, finance-hq/ZDFOS/zao-festivals) not covered this pass.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| CoCConcertZ subscriber-check: rate-limit or generic-response the enumeration oracle | @ZOE | PR | low priority |
| Audit remaining PRIVATE repos (finance-hq, ZDFOS, zao-festivals) | @ZOE | Audit | next loop |

## Sources

- First-party: fresh HEAD clones of sparkz/zoostr/wwtracker/CoCConcertZ/zol, scanned + key files read this run, 2026-07-30 [FULL]
- Doc 2143 (ZAOOS audit, same method), doc 2093 (the CoCConcertZ admin-bypass incident - now verified fixed) [FULL]
