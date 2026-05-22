---
topic: farcaster
type: audit
status: research-complete
last-validated: 2026-05-22
related-docs: 591, 591a, 575, 250, 173
tier: STANDARD
---

# 707 — ZABAL Mini App Conformance: applying the Doc 591 standard to /zabal

> **Goal:** A best-practices checklist for Farcaster Mini Apps (2026) and a conformance audit of the new ZABAL voting surface (`src/app/zabal/`) shipped in the ZABAL rollup (PR #556 + #592). Doc 591 already audited `/miniapp` and is the standard; this doc applies it to `/zabal` and lists the gaps + fixes.

> **TL;DR:** The ZABAL pages render and the SDK `ready()` call is covered by the global `<MiniAppReady />` in `layout.tsx`. ONE real gap: every ZABAL route inherits the root `fc:miniapp` embed, which launches `/miniapp` (the gated chat) - so a shared `/zabal` vote link opens the wrong app. Fix = per-route embed metadata. Three smaller polish items below.

## Key Decisions / Recommendations

| # | Decision | Priority | File |
|---|----------|----------|------|
| 1 | ADD per-route `fc:miniapp` + `fc:frame` embed metadata to `/zabal` and `/zabal/spotlight` so shared links launch the ZABAL surface, not `/miniapp` | **P0** | `src/app/zabal/page.tsx`, `src/app/zabal/spotlight/page.tsx` |
| 2 | ADD a dedicated ZABAL OG image (`/og/zabal` or static) for the embed `imageUrl` - the embed card is the entire first impression in-feed | P1 | `src/app/og/` or `public/` |
| 3 | KEEP the global `<MiniAppReady />` as the splash un-sticker; it fires `sdk.actions.ready()` for every route including `/zabal`. Do NOT rely on the per-component `ready()` in `ZabalVoteClient` | LOCKED | `src/app/layout.tsx` |
| 4 | REMOVE the redundant `sdk.actions.ready()` call inside `ZabalVoteClient` + `ZabalSpotlightClient` - the global component already covers it; a second call gated behind `await sdk.context` risks never firing if context hangs | P2 | `src/app/zabal/_components/ZabalVoteClient.tsx`, `.../spotlight/_components/ZabalSpotlightClient.tsx` |
| 5 | KEEP context-FID as the identity source (ZABAL is a public route - no SIWF, no QuickAuth, no session). This is correct and simpler than `/miniapp` | LOCKED | `ZabalVoteClient.tsx` |
| 6 | `farcaster.json` stays single-app ("ZAO OS"). One manifest per domain is the spec; ZABAL is a route, surfaced via per-route embed meta, not a second manifest entry | LOCKED | `public/.well-known/farcaster.json` |
| 7 | ADD a CI smoke check that `/zabal` returns 200 + carries a `fc:miniapp` meta whose action URL is `/zabal` (not `/miniapp`) | P2 | `.github/workflows/` |

## Part 1 — Farcaster Mini App best-practices checklist (2026)

Synthesized from Doc 591 (production audit, 2026-05-02) + 591a/591b/575/250. This is the standard every ZAO miniapp surface should pass:

| Area | Best practice |
|------|---------------|
| **Manifest** | `/.well-known/farcaster.json` at the apex domain. `accountAssociation` payload domain MUST match `homeUrl` apex exactly. Apex<->www redirect mismatch is the #1 silent splash-killer. |
| **Embed meta** | Every cast-shareable route carries `fc:miniapp` (and legacy `fc:frame`) meta - a JSON embed with `imageUrl` + a `button` whose `action.url` points at THAT route. Without it the route inherits the root embed. |
| **`ready()`** | Call `sdk.actions.ready()` unconditionally + early, with a fallback timeout (~2.5s). Never gate it behind an `await` that can hang (context fetch, network) or the splash sticks. |
| **`isInMiniApp()`** | Do NOT gate behavior on `sdk.isInMiniApp()` - it under-reports in Coinbase Wallet (Issue #310). Treat presence of `sdk.context.user.fid` as proof of miniapp context. |
| **Context FID** | `sdk.context.user.fid` can be `-1` in Base App (Issue #537). Null/`-1`-check it; add a short race timeout. |
| **Auth** | Context-FID -> server Neynar-verify is the primary path. QuickAuth/SIWF only as fallback for gated apps. Public routes need no auth at all. |
| **Iframe** | CSP `frame-ancestors *`; never `X-Frame-Options`. Session cookies (if any) `SameSite=None; Secure; HttpOnly`. |
| **Caching** | Do NOT send `cache-control: no-store` on miniapp HTML - Farcaster clients show "This page couldn't load." Service worker must skip miniapp navigations. |
| **Splash** | Manifest `splashImageUrl` + `splashBackgroundColor`; keep the image small + fast. Per Doc 575. |
| **Webhook** | Verify webhook signatures with `@farcaster/miniapp-node`. |
| **Discovery** | `primaryCategory` + `tags` in manifest; accurate `name`/`subtitle`/`description` (subtitle <=30 chars). |

## Part 2 — ZABAL conformance audit

ZABAL surface = `src/app/zabal/page.tsx`, `zabal/spotlight/page.tsx`, `zabal/demo/page.tsx`, client components, `api/zabal/*`.

| # | Dimension | Status | Note |
|---|-----------|--------|------|
| 1 | Manifest exists + domain matches | PASS | `farcaster.json` payload domain `zaoos.com` matches apex; inherited |
| 2 | `sdk.actions.ready()` fires for `/zabal` | PASS | global `<MiniAppReady />` in `layout.tsx` fires it for all routes |
| 3 | `fc:miniapp` embed points at the right route | **FAIL** | `/zabal` inherits root embed -> `action.url = /miniapp`. Shared ZABAL links launch the gated chat, not voting. **Rec 1.** |
| 4 | Dedicated embed image | **FAIL** | inherits root `imageUrl = /og`. No ZABAL-branded card. **Rec 2.** |
| 5 | `isInMiniApp()` not used as a gate | PASS | `ZabalVoteClient` reads `sdk.context.user.fid` directly, no gate |
| 6 | Context FID `-1`/null handled | WARN | `ZabalVoteClient` checks `if (!userFid)` - covers null/undefined; does NOT special-case `-1`. Low risk (Base App), but add `userFid > 0` |
| 7 | Redundant `ready()` in component | WARN | both client components call `sdk.actions.ready()` after `await sdk.context` - harmless today but fragile. **Rec 4.** |
| 8 | Public route, no auth gate | PASS | matches the rollup decision; no SIWF/QuickAuth/session on `/zabal` |
| 9 | No `no-store` on HTML | PASS | `/zabal` uses `revalidate = 30`, `/zabal/spotlight` `revalidate = 60` - cached, not `no-store` |
| 10 | Cast-shareable routes | PARTIAL | `/zabal` + `/zabal/spotlight` are shareable but, per #3, embed-misrouted |

**Score: 6 PASS / 2 WARN / 2 FAIL.** Both FAILs are the same root cause - no per-route embed metadata.

## Part 3 — The fix (Rec 1 + 2)

Add to `src/app/zabal/page.tsx` (and a spotlight variant):

```ts
const zabalEmbed = JSON.stringify({
  version: '1',
  imageUrl: 'https://zaoos.com/og/zabal',     // Rec 2: dedicated card
  button: {
    title: 'Vote on ZAO',
    action: {
      type: 'launch_miniapp',
      url: 'https://zaoos.com/zabal',          // the fix: route-correct
      name: 'ZABAL',
      splashImageUrl: 'https://zaoos.com/splash.png',
      splashBackgroundColor: '#0a0a0a',
    },
  },
});

export const metadata: Metadata = {
  title: 'ZABAL - Vote on ZAO Direction',
  description: 'Weekly community vote: Music, Governance, Events, Build.',
  openGraph: { /* existing */ },
  other: {
    'fc:miniapp': zabalEmbed,
    'fc:frame': zabalEmbed,
  },
};
```

Spotlight: same shape, `url: 'https://zaoos.com/zabal/spotlight'`, `title: 'Member Spotlight'`.

Next.js merges `metadata` per-route - declaring `other` on the ZABAL page overrides the root `other`, so this is a clean, local change. No layout edit needed.

## Specific Numbers

| Metric | Value |
|--------|-------|
| Doc 591 audit score (/miniapp) | 12 PASS / 1 WARN / 0 FAIL (14 dimensions) |
| ZABAL audit score (/zabal) | 6 PASS / 2 WARN / 2 FAIL (10 dimensions) |
| ZABAL FAILs | 2, both same root cause (no per-route embed) |
| `ready()` fallback timeout (591 standard) | 2.5s |
| Manifest subtitle limit | 30 chars |
| Context FID bad value (Base App) | -1 (Issue #537) |
| ZABAL routes needing embed meta | 2 (`/zabal`, `/zabal/spotlight`) |
| Files to change for the P0 fix | 2 page.tsx files |

## Sources

- [Doc 591 - Farcaster Mini App Production Audit](../591-miniapp-production-audit/) - the standard, 2026-05-02
- [Doc 591a - SDK + Auth Flows](../591a-sdk-auth-flows/) - context FID, isInMiniApp, QuickAuth
- [Doc 575 - Mini App Splash Best Practices](../575-miniapp-splash-best-practices/)
- [Doc 250 - Farcaster Mini Apps llms.txt 2026](../250-farcaster-miniapps-llms-txt-2026/)
- [Doc 173 - Farcaster Mini Apps Integration](../173-farcaster-miniapps-integration/)
- Code audited 2026-05-22: `src/app/layout.tsx` (lines 19-54), `src/app/zabal/page.tsx`, `src/app/zabal/_components/ZabalVoteClient.tsx`, `public/.well-known/farcaster.json`
- [Farcaster Mini Apps docs](https://miniapps.farcaster.xyz/) - embed + manifest spec

## Also See

- [Doc 591 - Mini App Production Audit](../591-miniapp-production-audit/) - parent standard
- ZABAL rollup: spec `docs/superpowers/specs/2026-05-17-zabal-zaoos-rollup-design.md`, research Doc 665

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add per-route `fc:miniapp`/`fc:frame` embed to `/zabal` + `/zabal/spotlight` (Rec 1) | @Zaal / Claude | Code PR | This week |
| Create a ZABAL OG embed image at `/og/zabal` (Rec 2) | @Zaal / Claude | Code PR | Same PR |
| Remove redundant `sdk.actions.ready()` from ZABAL client components (Rec 4) | @Zaal / Claude | Code PR | Same PR |
| Add `userFid > 0` guard for Base App `-1` case (audit #6) | @Zaal / Claude | Code | Same PR |
| Add CI smoke check: `/zabal` 200 + embed action URL is `/zabal` (Rec 7) | @Zaal | CI | Next sprint |
| Re-validate vs Doc 591 in 30 days | @Zaal | Doc update | 2026-06-22 |
