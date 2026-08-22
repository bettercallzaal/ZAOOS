---
topic: farcaster
type: decision
status: research-complete
last-validated: 2026-08-22
superseded-by:
related-docs: 591, 595, 2251, 2374
original-query: "DEEP research for Sparkz (bettercallzaal/sparkz): the right way to build owner-by-FID auth in 2026, before we build it. Compare the three Farcaster auth primitives - Quick Auth (JWT, what ZAODEVZ/zabalgames api/lib/auth.mjs verifies), SIWF via @farcaster/auth-kit + server-side verifySignInMessage (what Sparkz's client already uses), and SIWN/Neynar managed signers (what zaalcaster uses) - for a Next.js App Router + Supabase app that needs: (a) web sign-in on trysparkz.com, (b) mini-app sign-in inside Farcaster clients, (c) a server session that gates per-Hearth owner actions (requireHearthOwner), (d) eventually cast publishing for receipts. Which primitive(s) to use where, what's current/deprecated in 2026 (auth-kit vs @farcaster/quick-auth vs miniapp-sdk), session strategy (JWT vs httpOnly cookie + HMAC), and how zabalgames' JWKS verifier fits. Also cover the secondary question: receipts measurement patterns - the right Neynar surface for measuring a cast's reach/engagement post-publish."
tier: DEEP
---

# 2313 - Farcaster auth primitives for Sparkz owner-by-FID (2026 decision)

> **Goal:** Pick the auth primitives and session architecture for Sparkz's owner-by-FID
> auth (requireHearthOwner) BEFORE building it, verified against the August 2026 state
> of the Farcaster auth stack.

## Key Decisions

| # | Decision | Call | Why |
|---|----------|------|-----|
| 1 | Mini-app auth (inside Farcaster clients) | **USE Quick Auth JWT** - `sdk.quickAuth.getToken()` client-side; verify server-side against the Farcaster JWKS. **LIFT the zabalgames verifier** (`ZAODEVZ/zabalgames lib/auth.mjs`, 107 lines, read in full) with the domain parameterized to Sparkz. | Cryptographically signed by auth.farcaster.xyz (verified live: JWKS at `/.well-known/jwks.json` serves RSA keys, curl 2026-08-17). Zero-dependency Web Crypto, strict claims (exp 60s skew, aud, iss, sub). `@farcaster/quick-auth` 0.0.8 published 2025-09-14, not deprecated (npm registry raw). |
| 2 | Web auth (trysparkz.com in a normal browser) | **USE @farcaster/auth-kit (already in Sparkz) + add server-side `verifySignInMessage`** via `@farcaster/auth-client`. | auth-kit 0.8.2 published 2026-02-05, NOT deprecated (npm registry raw). Sparkz's client config already exists (`src/app/_components/Providers.tsx`); the missing half is server verification - today the server never verifies (`src/app/api/capsules/create-spark/route.ts:56-66` stores a client-asserted `owner_fid`). |
| 3 | Do NOT use context-FID as the primary auth for writes | Doc 591 (ZAO OS mini-app) locked context-FID silent sign-in as primary - right for an allowlisted read-heavy surface, WRONG for Sparkz owner-gated writes: `sdk.context` is host-provided, not cryptographically signed. Sparkz gates mutations, so the JWT path is the bar. Context-FID is fine for silent UX personalization only. |
| 4 | SIWN | **SKIP for auth - deprecated.** Neynar's own docs page is titled "Sign In With Neynar is deprecated" (raw HTML fetch 2026-08-17; deprecation effective 2026-08-14). For future cast publishing use **Neynar managed/sponsored signers**, which are a WRITE primitive, not auth. | zaalcaster's `api/send.js` SIWN pattern must not be copied for new connections. |
| 5 | Session strategy | **httpOnly cookie carrying an HMAC-signed session** (extend Sparkz's existing cookie pattern in `src/lib/auth.ts`), `SameSite=None; Secure`. Session payload: `{fid, exp}`; HMAC key = server env. Do NOT forward the 1-hour Quick Auth JWT as the session itself. | Doc 591's hard-won lesson (PR #445): `SameSite=Lax` cookies die in the Farcaster iframe; `None; Secure` survives. A server-minted session outlives the ~1h Quick Auth token and works identically for web + mini-app entry paths. |
| 6 | Authorization helper | **ADD `requireHearthOwner(req, hearthId)`**: allow if session FID == `hearths.owner_fid` OR the operator token passes (existing `requireAdmin`). Swap the gates on `/api/capsules/visibility`, `/c/[slug]/settings`, `/api/empire/deploy` from admin-only to owner-or-admin. | The audited gap list (this session, 2026-08-17): visibility/settings/empire-deploy are admin-gated with "owner auth is the follow-up" comments in code. |
| 7 | Fix create-spark's unverified FID with the same session | A Hearth created by a signed-in user gets `owner_fid` from the VERIFIED session, not the request body. Unverified legacy rows keep working; add a claim flow later. | Closes the P0 from the Arca audit (anyone can claim any FID today). |
| 8 | Receipts measurement | **USE Neynar `GET /v2/farcaster/cast` by hash** - reactions (likes[], recasts[]) + replies.count come bundled; 1 compute unit per lookup; free tier 200K CU/month covers early volume. No separate analytics endpoint exists. | Fills `reach`/`referrals` on Meme Receipts (currently hardcoded 0 - `src/app/api/signals/approve/route.ts`). |

## The comparison (the three primitives, August 2026)

| | Quick Auth (JWT) | SIWF via auth-kit + server verify | SIWN (Neynar) |
|---|---|---|---|
| What it is | auth.farcaster.xyz mints a domain-bound JWT (`aud`=your domain, `sub`=FID, ~1h) | Client relay flow (QR/deep-link), server verifies the signed message against the key registry | Neynar-managed signer onboarding; auth was a side effect |
| Status (verified raw, 2026-08-17) | `@farcaster/quick-auth` 0.0.8, 2025-09-14, active; JWKS endpoint live | `@farcaster/auth-kit` 0.8.2, 2026-02-05, active | **DEPRECATED 2026-08-14** - no new connections |
| Where it shines | Inside Farcaster clients (`sdk.quickAuth.getToken()` - silent, no prompt) | Open web, normal browsers | (was) write access without gas |
| Server verify cost | JWKS fetch (cacheable 1h) + Web Crypto - no chain RPC | RPC to the key registry (heavier) | n/a |
| Sparkz fit | Mini-app entry path; verifier already exists in-family (zabalgames) | Web entry path; client half already integrated | Skip for auth; managed signers later for casting |

**The architecture in one paragraph:** two doors, one session. A visitor inside a
Farcaster client gets a Quick Auth JWT (silent); a visitor on the open web signs in
with auth-kit (existing UI) and the server verifies the SIWF message. Both doors end
at the same place - a server-verified FID - which mints one HMAC-signed httpOnly
session cookie (`SameSite=None; Secure`). Every owner-gated route then asks one
question: does the session FID own this Hearth (or is it the operator)?

## What gets lifted vs built

| Piece | Source | Status |
|-------|--------|--------|
| Quick Auth JWKS verifier | `ZAODEVZ/zabalgames lib/auth.mjs` (read in full - 107 lines; admin FIDs 19640/1057869 already allowlisted there) | LIFT - parameterize `DOMAIN` to Sparkz's `CANONICAL_HOST` |
| SIWF client | Sparkz `src/app/_components/Providers.tsx` + `src/app/profile/providers.tsx` | EXISTS |
| SIWF server verify | `@farcaster/auth-client` `verifySignInMessage` | BUILD (small - new `/api/auth/siwf` route) |
| Session cookie + HMAC | Sparkz `src/lib/auth.ts` (operator cookie pattern) | EXTEND (add fid session beside operator session) |
| `requireHearthOwner` | new in `src/lib/auth.ts` | BUILD (~30 lines) |
| Iframe cookie flags | Doc 591 PR #445 lesson | APPLY (`SameSite=None; Secure`) |
| Cast engagement reads | Neynar `GET /v2/farcaster/cast` | BUILD later with receipts publishing (needs `NEYNAR_API_KEY`) |

## Numbers that matter

- `@farcaster/auth-kit` latest **0.8.2** (published **2026-02-05**); `@farcaster/quick-auth` latest **0.0.8** (published **2025-09-14**) - both `deprecated: false` on the npm registry (raw JSON, 2026-08-17).
- Quick Auth tokens live **~1 hour**; JWKS cacheable (zabalgames caches **3600000 ms**).
- SIWN deprecated **2026-08-14** (Neynar docs, raw HTML).
- Neynar pricing: free tier **200K compute units/month**; cast lookup costs **1 CU**; paid **$9/month for 1M CU** (via research agent - WebFetch triage, re-verify at purchase time).
- Zaal's FID: **19640** (from the zabalgames allowlist source).

## Contradictions + honesty notes

- The research agent's auth-kit publish date ("~July 2026") disagreed with the npm registry raw JSON (**2026-02-05**); the registry wins and is what this doc states.
- Neynar per-endpoint rate limits were not verifiable beyond the CU pool model - re-check when wiring receipts measurement.
- Quick Auth "usable outside mini-apps" is true protocol-wise (domain-bound `aud`), but the practical open-web issuance UX still routes through a Farcaster client approval - which is why the web door stays auth-kit.

## Also See

- [Doc 591 - Mini App Production Audit](../591-miniapp-production-audit/) - the context-FID vs QuickAuth tradeoff + the SameSite=None cookie lesson
- [Doc 595 - FIP Live Activity Deeper](../595-fip-live-activity-deeper/) - lift-ready JFS Ed25519 reference impl if signature needs grow beyond JWTs
- [Doc 2251 - Sparkz rebrand + wheel-and-spokes architecture](../../business/2251-sparkz-rebrand-and-modular-architecture/) - the Hearth/spoke architecture this auth unblocks

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Ship Sparkz owner-auth PR: lift zabalgames verifier as `src/lib/farcaster-auth.ts`, add `/api/auth/siwf` (server verifySignInMessage) + `/api/auth/quick` (JWT verify), mint HMAC fid-session cookie (`SameSite=None; Secure`), add `requireHearthOwner`; PR merged + CI green | @Zaal | PR | 2026-08-22 |
| Swap gates to owner-or-admin on visibility/settings/empire-deploy + create-spark takes owner_fid from the verified session; PR merged | @Zaal | PR | 2026-08-24 |
| Live test: Zaal signs in with FID 19640 and toggles ZABAL GAMEZ integration visibility WITHOUT the operator token; works on trysparkz.com | @Zaal | test | 2026-08-24 |
| Receipts measurement spike: wire Neynar `GET /v2/farcaster/cast` into a receipts-update job when cast publishing lands; PR merged | @Zaal | PR | 2026-09-05 |

## 2026-08-22 Review Addendum: Neynar operator uncertainty

**Context:** On 2026-08-17 Farcaster announced it is seeking a 3rd operator in 8 months. Neynar is the affected infrastructure layer (doc 2374 covers this in full). Revenue collapsed ~99% Q1→Q3 2026. The handoff/continuity plan is open at the time of this review.

**Impact on this doc's decisions:**

| Decision affected | Impact |
|---|---|
| D1 – Quick Auth JWT | **UNAFFECTED.** Quick Auth is issued by `auth.farcaster.xyz`, which is controlled by the Farcaster protocol (not Neynar). JWKS endpoint at `auth.farcaster.xyz/.well-known/jwks.json` is protocol infrastructure. The zabalgames verifier lift remains the correct call. |
| D2 – SIWF via auth-kit | **UNAFFECTED.** `@farcaster/auth-kit` is an open-source library; the server-verify call hits the key registry (protocol layer). Not Neynar. |
| D4 – SIWN deprecated | **MORE CONFIRMED.** SIWN was already deprecated 2026-08-14; the operator change makes the managed-signer future even more uncertain. Skip with higher confidence. |
| D8 – Receipts via `GET /v2/farcaster/cast` | **ELEVATED RISK.** This endpoint is Neynar-served. During a handoff/transition period, the Neynar API may change pricing, availability, or become unavailable. For early Sparkz volumes the 200K CU free tier is likely stable, but `NEYNAR_API_KEY` and the CU cost model should be re-verified at the time of receipts build (doc 2374 recommends an alt-API audit before any new Neynar dependencies). **Mitigation: design the receipts updater with a `CAST_DATA_PROVIDER` env var so a fallback endpoint can be swapped in.** |

**The two-door, one-session architecture is operator-agnostic.** The auth path (Quick Auth JWT + auth-kit SIWF → HMAC session cookie) runs on protocol infrastructure and does not route through Neynar. Ship the owner-auth PR without modification to this design.

**Owner-auth PR status:** was due 2026-08-22. Status unknown as of this review.

## Sources

- ZAODEVZ/zabalgames `lib/auth.mjs` - `gh api` raw fetch, read all 107 lines - **[FULL - raw]**
- Sparkz codebase: `src/lib/auth.ts`, `src/app/_components/Providers.tsx`, `src/app/api/capsules/create-spark/route.ts` (this session's audit, file:line cited) - **[FULL - local]**
- [auth.farcaster.xyz JWKS](https://auth.farcaster.xyz/.well-known/jwks.json) - live curl 2026-08-17, RSA keys returned - **[FULL - raw curl]**
- [npm registry: @farcaster/quick-auth](https://registry.npmjs.org/@farcaster/quick-auth) - raw JSON API - **[FULL - raw]**
- [npm registry: @farcaster/auth-kit](https://registry.npmjs.org/@farcaster/auth-kit) - raw JSON API - **[FULL - raw]**
- [Neynar SIWN docs (deprecation)](https://docs.neynar.com/docs/how-to-let-users-connect-farcaster-accounts-with-write-access-for-free-using-sign-in-with-neynar-siwn) - raw curl + HTML strip; page title literally "Sign In With Neynar is deprecated" - **[FULL - raw]**
- [Quick Auth docs](https://miniapps.farcaster.xyz/docs/sdk/quick-auth) - research agent - **[PARTIAL - WebFetch triage; claims cross-checked against the raw JWKS + npm fetches above]**
- [Mini app auth guide](https://miniapps.farcaster.xyz/docs/guides/auth) - research agent - **[PARTIAL - WebFetch triage]**
- [Neynar signer comparison](https://docs.neynar.com/docs/which-signer-should-you-use-and-why) - research agent - **[PARTIAL - WebFetch triage]**
- [Neynar cast lookup](https://docs.neynar.com/docs/how-to-get-cast-information-for-farcaster-casts) - research agent - **[PARTIAL - WebFetch triage; endpoint path load-bearing claims to re-verify at build time]**
- [Neynar compute units](https://docs.neynar.com/reference/compute-units) - research agent - **[PARTIAL - WebFetch triage]**
- [farcasterxyz/auth-monorepo](https://github.com/farcasterxyz/auth-monorepo) - research agent - **[PARTIAL - WebFetch triage; maintenance corroborated by raw npm publish dates]**
- [FIP-231 Quick Auth discussion](https://github.com/farcasterxyz/protocol/discussions/231) - research agent - **[PARTIAL - WebFetch triage]**
- Local docs 591 + 595 (ZAO research library) - read directly - **[FULL - local]**
- npm package pages (npmjs.com) - **[FAILED - 403; replaced by the raw registry.npmjs.org API above]**
- Reddit - **[FAILED - not attempted; reddit fully walled from this machine per doc 2282, and GitHub/HN/official docs covered the community angle]**
