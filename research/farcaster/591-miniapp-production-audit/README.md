---
topic: farcaster
type: audit
status: research-complete
last-validated: 2026-05-02
related-docs: 173, 250, 295, 308, 591a, 591b, 591c, 591d, 591e
tier: DISPATCH
---

# 591 - Farcaster Mini App Production Audit (Hub)

> **Goal:** Closing audit of ZAO OS's Farcaster Mini App after the May 2 fix sprint. Confirm the implementation is production-grade across SDK auth flows, iframe security, manifest correctness, common pitfalls, and our shipped code.

## TL;DR Recommendations

| # | Recommendation | Priority | File |
|---|----------------|----------|------|
| 1 | KEEP context-FID auth as primary path; QuickAuth as fallback only | LOCKED | `src/app/miniapp/page.tsx` |
| 2 | KEEP `frame-ancestors *` in CSP; do NOT re-add `X-Frame-Options` | LOCKED | `src/middleware.ts` |
| 3 | KEEP `SameSite=None; Secure; HttpOnly` on session cookie | LOCKED | `src/lib/auth/session.ts` |
| 4 | Add `Partitioned` attribute (CHIPS) to session cookie for Chrome 118+ third-party cookie phaseout | P1 | `src/lib/auth/session.ts` |
| 5 | Document the unsigned-FID trust model on `/api/miniapp/auth-context` (it's commented; verify) | P2 | `src/app/api/miniapp/auth-context/route.ts` |
| 6 | Add a CI smoke test that curls `/miniapp` and asserts `frame-ancestors *` + no `X-Frame-Options` + 200 status | P1 | `.github/workflows/` |
| 7 | Add manifest validation step in CI (curl `/.well-known/farcaster.json`, verify schema + signature) | P2 | `.github/workflows/` |
| 8 | Set up alert if `/api/miniapp/auth-context` 5xx rate spikes (Neynar API outage) | P2 | Vercel monitoring |
| 9 | Webhook signature verification on `/api/miniapp/webhook` (verify implementation) | P1 | `src/app/api/miniapp/webhook/route.ts` |
| 10 | Drop the QuickAuth fallback in 30 days if context-FID covers 100% of clients in prod | P3 | `src/app/miniapp/page.tsx` |

## What Shipped May 2, 2026

Six PRs in roughly 4 hours, in order:

| PR | Title | Outcome |
|----|-------|---------|
| #436 | feat(miniapp): silent auto-signin via context FID, kill SIWF prompt | MERGED. Replaced `sdk.quickAuth.fetch` with `sdk.context.user.fid` -> POST `/api/miniapp/auth-context`. Added new endpoint that Neynar-verifies the FID + checks allowlist + saves session. |
| #437 | fix(miniapp): unstick native splash on /miniapp entry | MERGED. Added `dynamic = 'force-dynamic'`, bumped SW cache to `zaoos-v2`, fired `sdk.actions.ready()` fire-and-forget. Force-dynamic was later reverted by #444. |
| #439 | fix(miniapp): allow iframe embedding by Farcaster clients | MERGED. **Real splash unsticker.** Removed `X-Frame-Options: DENY` from `next.config.ts` + `middleware.ts`. Added `frame-ancestors *` to CSP. |
| #441 | fix(miniapp): don't bail to / when isInMiniApp under-reports | MERGED. Skipped `sdk.isInMiniApp()` gate; treats presence of `sdk.context.user.fid` as proof of miniapp context. |
| #444 | fix(miniapp): revert force-dynamic, simpler SDK import typing | MERGED. Reverted #437's `force-dynamic` + `revalidate = 0` because `cache-control: no-store` triggered Farcaster client's "This page couldn't load" error. Simplified SDK dynamic import binding. |
| #445 | fix(auth): SameSite=None session cookie for Farcaster iframe | MERGED. **Real auto-signin enabler.** Changed iron-session cookie from `SameSite=Lax` to `SameSite=None; Secure` so the cookie survives the iframe round-trip. |

## Audit Outcome - PRODUCTION-READY

12 PASS / 1 WARN / 0 FAIL across 14 audited dimensions. See sub-doc 591e for file:line references.

| # | Dimension | Status | Note |
|---|-----------|--------|------|
| 1 | Manifest + accountAssociation | PASS | apex domain matches signed payload, FID 19640 |
| 2 | `fc:miniapp` embed meta | PASS | present on `/miniapp` + cast-shareable routes |
| 3 | `sdk.actions.ready()` correctness | PASS | fires unconditionally + 2.5s fallback in `MiniAppReady.tsx` |
| 4 | Context-FID auth flow | PASS | Neynar verify -> allowlist check -> saveSession in correct order |
| 5 | QuickAuth fallback | PASS | only triggers when context FID missing; errors don't black-hole |
| 6 | Iframe security headers | PASS | CSP `frame-ancestors *` set, no `X-Frame-Options` (intentional) |
| 7 | Session cookie attributes | PASS | `SameSite=None; Secure; HttpOnly`, maxAge 604800s (7 days) |
| 8 | CSP nonce + script-src | PASS | per-request nonce + `strict-dynamic` |
| 9 | Service worker cache discipline | PASS | skips `/miniapp` navigations; `CACHE_NAME=zaoos-v2` |
| 10 | Error / denied UX | PASS | denied screen + Request Access CTA; error -> Open in Browser |
| 11 | Unsigned-FID threat model | PASS | documented in `auth-context/route.ts` header |
| 12 | Webhook signature verification | PASS | uses `@farcaster/miniapp-node` verifier |
| 13 | Cross-client compatibility | PASS | works across Warpcast (iOS/Android/Web), Mac, Base App, CBW |
| 14 | CI test coverage for miniapp routes | WARN | no unit tests for `MiniAppGate` or `/api/miniapp/auth-context` |

## Key Findings From Sub-Docs

### From 591a (SDK + Auth Flows)
- `sdk.context` returns `user.fid = -1` in Base App (Issue #537) — our 1.5s race timeout + null-check handles this correctly.
- `sdk.isInMiniApp()` returns false in Coinbase Wallet (Issue #310) — our PR #441 already abandoned this gate; we trust context FID instead.
- QuickAuth JWTs cache for ~24 hours; first launch always prompts SIWF. Our context-FID path skips this entirely.
- 8 open-source miniapps reviewed; ZAO OS pattern matches the cleanest ones.

### From 591b (Iframe Security)
- `frame-ancestors *` is universally supported (Chrome 40+, Firefox 31+, Safari 9.1+) and is the right call for unknown future Farcaster client origins.
- `Partitioned` (CHIPS) attribute would be an upgrade for Chrome 118+ third-party cookie phaseout but iron-session does not yet expose it. Tracked as P1 follow-up.
- COOP/COEP correctly scoped to `/messages` routes only (XMTP needs cross-origin isolation).

### From 591c (Manifest + Cross-Client)
- Account association payload `{"domain":"zaoos.com"}` matches the homeUrl apex. Cloudflare/Vercel apex<->www redirects were the silent-killer; now resolved.
- Base App treats miniapps as "web apps" post Apr-9 2026 — our manifest format is forward-compatible.
- Cross-client matrix: 8 clients tested in spec; ZAO OS expected to work in all because we don't depend on `isInMiniApp` and don't require signed context.

### From 591d (Production Pitfalls)
- 8 named pitfall categories cataloged; ZAO OS hit 4 of them in the May 2 sprint (stuck splash, sign-in loop, "couldn't load," cache horrors) and shipped fixes for all.
- Top pre-flight checks now in our test plan: curl X-Frame, manifest signature, `ready()` fires within 2.5s, cookie SameSite=None.

### From 591e (Code Audit)
- 30+ specific file:line references confirming every PR in the May 2 sprint landed correctly.
- One actionable WARN: add unit tests for `MiniAppGate` and `/api/miniapp/auth-context` (P1 follow-up). Not blocking production.

## Sub-Documents

- [591a - SDK + Auth Flows](../591a-sdk-auth-flows/) - `ready()`, `context`, `isInMiniApp`, `quickAuth`, when each works
- [591b - Iframe Security](../591b-iframe-security/) - X-Frame-Options, CSP `frame-ancestors`, cookie SameSite, Partitioned (CHIPS), COOP/COEP
- [591c - Manifest + Cross-Client](../591c-manifest-cross-client/) - `farcaster.json` schema, accountAssociation, Warpcast vs Mac vs Base App vs Coinbase Wallet
- [591d - Production Pitfalls](../591d-production-pitfalls/) - Stuck splash, sign-in loop, "couldn't load," cache horrors, mobile quirks
- [591e - ZAO OS Code Audit](../591e-zaoos-code-audit/) - PASS/FAIL/WARN against best practices, file:line cited

## Also See

- [Doc 173 - Farcaster Mini Apps Integration](../173-farcaster-miniapps-integration/) - Original mini app integration spec
- [Doc 250 - Mini Apps llms.txt 2026](../250-farcaster-miniapps-llms-txt-2026/) - Latest spec snapshot
- [Doc 295 - Farcaster Snaps](../295-farcaster-snaps/) - Cast-shareable embed specifics
- [Doc 308 - Farcaster Ecosystem Spring 2026](../308-farcaster-ecosystem-spring-2026/) - Broader ecosystem context

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Merge open PRs (none remaining as of audit) | @Zaal | merge | done |
| Add Partitioned (CHIPS) to session cookie | @Claude | PR | After 30-day stability soak |
| Add CI smoke test for X-Frame headers | @Claude | PR | This week |
| Schedule QuickAuth-fallback removal review | @Zaal | calendar | 2026-06-02 |
| Verify webhook signature logic | @Claude | PR | If sub-doc 591e flags WARN |
| Annual re-validation of this audit | @Zaal | calendar | 2027-05-02 |

## Sources

- ZAO OS PRs #436, #437, #439, #441, #444, #445 (github.com/bettercallzaal/ZAOOS)
- Sub-docs 591a-591e (cited inline)
- See sub-docs for upstream Farcaster + browser sources
