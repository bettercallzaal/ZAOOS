---
topic: farcaster
type: incident-postmortem
status: research-complete
last-validated: 2026-04-30
related-docs: 124, 293, 306, 574
tier: STANDARD
---

# 575 — Mini App Splash Stuck: Postmortem + Best Practices

> **Goal:** Diagnose why the ZAO OS mini app splash never dismissed when launched from a Farcaster cast on 2026-04-30, and codify the fix + the broader best-practice pattern.

## Key Decisions (TL;DR)

| # | Decision | Why |
|---|---|---|
| 1 | **HOIST `sdk.actions.ready()` to a top-of-body component (`<MiniAppReady />`)** | The previous implementation called ready() inside `MiniAppGate`, which is wrapped by `LazyRainbowKit` + `LazyAuthKit` (both `dynamic({ ssr: false })`). On slow networks the splash hung waiting for those chunks before ready() ever fired. |
| 2 | **ADD a 2.5s fallback timer that fires `ready()` regardless** | The Farcaster docs flag "ready() never invoked" as the #1 mini app bug. A timer makes the splash dismissal a hard upper bound. |
| 3 | **ADD a 5s timeout on `quickAuth.fetch('/api/miniapp/auth')`** | Without it, a hanging auth call traps the user in MiniAppGate's `'authing'` state forever. Now it falls through to `'web'` after 5s. |
| 4 | **ALLOWLIST `/sopha` (and any future public marketing routes) inside MiniAppGate** | These pages are not gated content. They should render immediately when opened in mini app context — no allowlist roundtrip. |
| 5 | **REPLACE square `public/og.png` (1200x1200) with a 3:2 ratio image** | The fc:miniapp embed `imageUrl` spec requires 3:2 aspect ratio. Square images may be cropped or rejected by some Farcaster clients. |
| 6 | **DROP `fc:miniapp` from marketing pages that are not launchable apps** | The /sopha page had `launch_miniapp` pointing at /og-sopha.png (which never existed). Replaced with a Next.js `opengraph-image.tsx` for shares; `fc:miniapp` reserved for the actual app entry. |

## What Happened

Zaal opened the ZAO OS mini app from a Farcaster cast on 2026-04-30 around 6:08 AM. The splash showed THE ZAO logo on a navy background and never dismissed. Screenshot confirmed the page never reached the ZAO OS UI.

## Root Cause

**Three compounding issues** in the load chain:

```
<RootLayout>
  <body>
    <Providers>           ← lazy-loads RainbowKit + AuthKit (ssr: false)
      <LazyRainbowKit>    ← dynamic chunk
        <LazyAuthKit>     ← dynamic chunk
          <MiniAppGate>   ← only here does sdk.actions.ready() get called
            {children}
```

1. **`MiniAppGate` was buried under two `dynamic({ ssr: false })` providers.** On the Farcaster client (mobile, sometimes throttled), those chunks may take seconds to hydrate. Until they hydrate, MiniAppGate doesn't mount, so `sdk.actions.ready()` is never called — and the native splash never dismisses.

2. **No fallback timer.** If the SDK import hung (CSP, iframe sandbox, network failure), there was no failsafe.

3. **The QuickAuth fetch had no timeout.** Even if ready() did fire, MiniAppGate switched to state `'authing'` and ran `sdk.quickAuth.fetch('/api/miniapp/auth')`. With no timeout, an unresponsive endpoint kept the user on the auth-loading UI indefinitely.

A separate but adjacent bug: the `/sopha` marketing page had `fc:miniapp` metadata pointing at a non-existent `/og-sopha.png`, so any cast that linked to `/sopha` triggered a launch flow into a route with no ready hook of its own.

## Fix Applied (PR #404)

Three files touched:

- **`src/components/miniapp/MiniAppReady.tsx`** (new) — minimal client component, `useEffect` calls `sdk.actions.ready()` ASAP plus a 2.5s fallback timer. Errors are swallowed and logged so the web context is unaffected.
- **`src/app/layout.tsx`** — mounts `<MiniAppReady />` inside `<body>` BEFORE `<Providers>`, so it runs on first client render regardless of which lazy chunks are still loading.
- **`src/components/miniapp/MiniAppGate.tsx`** — kept the redundant `ready()` call (idempotent), added 5s timeout on QuickAuth fetch via `Promise.race`, allowlisted `/sopha` and `/sopha/*` so marketing routes render immediately.

## Best-Practice Checklist (Apply to Every ZAO Mini App)

| Check | Why | Verified for ZAO OS |
|---|---|---|
| Call `sdk.actions.ready()` from a component that mounts on first client render, NOT behind heavy lazy providers | "ready() never invoked" is the #1 cause of stuck splashes per docs | YES (PR #404) |
| Add a fallback timer (2-3s) that calls ready() unconditionally | Defends against SDK import failures or iframe sandbox issues | YES (PR #404) |
| Add a hard timeout on every authenticated fetch made before content renders | Hanging auth call = stuck spinner | YES (PR #404) |
| Allowlist public marketing routes inside any auth gate | Marketing pages shouldn't run an auth roundtrip | YES (PR #404) |
| `farcaster.json` manifest at `/.well-known/farcaster.json` | Required for app discovery + verification | YES |
| Manifest `iconUrl` is 1024x1024 PNG, no alpha | Spec requirement | YES (`public/icon-1024.png`) |
| Manifest `splashImageUrl` is 200x200 PNG | Spec requirement | YES (`public/splash.png`) |
| `fc:miniapp` embed `imageUrl` is 3:2 aspect ratio | Spec requirement | NO — `public/og.png` is 1200x1200 (square). Replace with 1200x800 |
| `accountAssociation` header/payload/signature signed for the exact production domain | Mismatched domain breaks verification | YES (zaoos.com) |
| Manifest `name` <= 32 chars | Spec hard limit | YES ("ZAO OS") |
| Manifest `homeUrl` is the entry route that calls ready() | Avoids landing on a route that never dismisses | YES (`/miniapp`) |
| Embed action `type` matches SDK version (`launch_miniapp` for SDK 0.2.x) | Older docs say `launch_frame`; new SDK uses `launch_miniapp` | YES |
| Production domain (no ngrok) for the manifest | ngrok subdomains break discovery | YES |
| HTTPS only | Farcaster requirement | YES |

## How to Catch This In CI / Pre-Ship

1. **Lighthouse a fresh build of `/miniapp` in mobile-throttled mode.** If the splash stays past 3s after the page is visible, the fix regressed.
2. **Use the Farcaster Mini App Preview Tool** at `https://farcaster.xyz/~/developers/mini-apps/preview` for any URL pre-launch.
3. **Add a `data-test-miniapp-ready="true"` attribute** to the body once `ready()` succeeds, and have an E2E test assert it shows up within 3s (future Doc 576 follow-up).

## Comparison: Where to Put `ready()`

| Pattern | Pros | Cons | Verdict |
|---|---|---|---|
| Inside the auth gate (old ZAO OS) | One file owns the lifecycle | Buried under lazy providers, splash hangs on slow nets | REJECTED |
| Inside the `/miniapp` page useEffect | Already does this | Only fires for `/miniapp` route — not for any other route accessed inside the mini app shell | INSUFFICIENT |
| Top-of-body dedicated component (NEW) | Runs on first client render, every route, regardless of auth state | One extra component, has to be remembered when refactoring layout | ADOPTED |
| Server-side script tag | No JS framework dependency | Doesn't have access to dynamic SDK import | REJECTED |

## Manifest Audit (Current ZAO OS Production)

```json
{
  "accountAssociation": {
    "header": "eyJmaWQiOjE5NjQwLCJ0eXBlIjoiYXV0aCIsImtleSI6IjB4Yjc5Y2RBYkY2ZjJmQjhGZWE3MEMyZTUxNUFFQzM1RTgyN2JGNzkzMiJ9",
    "payload": "eyJkb21haW4iOiJ6YW9vcy5jb20ifQ",
    "signature": "..."
  },
  "miniapp": {
    "version": "1",
    "name": "ZAO OS",
    "iconUrl": "https://zaoos.com/icon-1024.png",
    "homeUrl": "https://zaoos.com/miniapp",
    "splashImageUrl": "https://zaoos.com/splash.png",
    "splashBackgroundColor": "#0a1628",
    "webhookUrl": "https://zaoos.com/api/miniapp/webhook",
    "subtitle": "Gated Farcaster community",
    "description": "ZAO OS - gated chat for the ZAO music community on Farcaster.",
    "primaryCategory": "social",
    "tags": ["community", "music", "web3", "chat"]
  }
}
```

All manifest fields valid. Account association signed for `zaoos.com` matching production domain. The only outstanding issue is the embed image aspect ratio (Item 8 in checklist).

## Files Touched

- `src/components/miniapp/MiniAppReady.tsx` — new, ~55 lines
- `src/app/layout.tsx` — added one import + one component mount
- `src/components/miniapp/MiniAppGate.tsx` — added 5s auth timeout + `/sopha` allowlist + idempotent ready() retry

## Also See

- [Doc 124](../124-sopha-deep-social-farcaster/) — Sopha mini app pattern reference
- [Doc 293](../293-sopha-api-integration/) — Sopha API integration that powers the Trending tab
- [Doc 306](../306-farcaster-protocol-features-gap-analysis/) — earlier protocol gap analysis
- [Doc 574](../../agents/574-inbox-apr30-agent-commerce-skills-stack/) — same-day inbox batch context
- [Farcaster Mini Apps - ready() docs](https://miniapps.farcaster.xyz/docs/sdk/actions/ready)
- [Farcaster Mini Apps - Loading guide](https://miniapps.farcaster.xyz/docs/guides/loading)
- [Farcaster Mini Apps - Specification](https://miniapps.farcaster.xyz/docs/specification)

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Verify splash dismisses < 2s on Vercel preview of PR #404 from a real Farcaster client | @Zaal | QA | Before merge |
| Replace `public/og.png` with a 1200x800 (3:2) version, OR 1200x630 (1.91:1) for OG | @Zaal | Asset | Next sprint |
| Add an E2E that asserts `<MiniAppReady>` fires within 3s of mount | @Zaal | Test | Doc 576 follow-up |
| Run the Mini App Preview Tool against `zaoos.com/miniapp` and `zaoos.com/sopha` after PR #404 ships | @Zaal | QA | Post-merge |

## Sources

- [Farcaster Mini Apps - ready() action](https://miniapps.farcaster.xyz/docs/sdk/actions/ready)
- [Farcaster Mini Apps - Loading guide](https://miniapps.farcaster.xyz/docs/guides/loading)
- [Farcaster Mini Apps - Specification](https://miniapps.farcaster.xyz/docs/specification)
- [Farcaster Mini Apps - FAQ](https://miniapps.farcaster.xyz/docs/guides/faq)
- [Farcaster Mini Apps - Getting Started](https://miniapps.farcaster.xyz/docs/getting-started)
- [Base docs - Migrate Existing Apps](https://docs.base.org/mini-apps/quickstart/migrate-existing-apps)
- [@farcaster/miniapp-sdk on npm](https://www.npmjs.com/package/@farcaster/miniapp-sdk)
