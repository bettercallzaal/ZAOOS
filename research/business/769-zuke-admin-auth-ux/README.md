---
topic: business
type: decision
status: research-complete
last-validated: 2026-05-28
related-docs: 591, 591a, 695, 710, 765
original-query: "better admin auth UX for Zuke than typing document.cookie in DevTools - explore admin login page, Farcaster SIWF admin allowlist, magic link, headless CLI, bookmarklet, admin dashboard. Current state: Zuke at zuke.thezao.com uses a shared admin password stored in ZUKE_ADMIN_PASSWORD env, gated routes check zuke_admin cookie. To create/end spaces, admin pastes JS into DevTools to set the cookie. Zaal wants a real login flow. Tier: STANDARD. Output: research/business/767-zuke-admin-auth-ux/README.md with 2-3 recommended patterns + tradeoffs + which to ship for Zuke MVP this week."
tier: STANDARD
---

# 769 - Zuke Admin Auth UX (kill the DevTools cookie hack)

> **Goal:** Replace the "paste `document.cookie = ...` in DevTools" admin pattern with a real login flow before the first public Zuke space.

## Key Decisions

| Decision | Pick | Why |
|---|---|---|
| **MVP this week** | OPTION D (login page + current password) | 30min ship, kills DevTools UX immediately, no new deps. Bridge to OPTION A. |
| **Permanent (within 2 weeks)** | OPTION A (SIWF + FID allowlist + iron-session) | Same stack ZAOOS already runs in prod. Lift `src/components/gate/LoginButton.tsx` + `src/lib/auth/session.ts`. Identity-tied (admin = `@bettercallzaal` FID 19640), no shared password. |
| **Skip** | OPTION C (magic link) | Adds Resend dep + email round-trip for solo admin. Overkill. |
| **Skip** | OPTION B-pure (quick-auth only) | Optimized for FC miniapp context; Zuke admin uses web. Use auth-kit for web, quick-auth fallback if Zuke ever ships as a miniapp. |
| **Code to delete on cutover** | `ZUKE_ADMIN_PASSWORD` env + `zuke_admin` cookie check in `src/lib/auth/session.ts` | No shared passwords post-MVP. |

## Findings

### Ground truth - what Zuke does today

`/tmp/zuke-init/src/lib/auth/session.ts`:

```ts
export async function getSessionData(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get('zuke_admin');
  if (adminCookie?.value === ENV.ZUKE_ADMIN_PASSWORD && ENV.ZUKE_ADMIN_PASSWORD) {
    return { isAdmin: true };
  }
  return null;
}
```

Zuke `package.json`: **zero Farcaster auth deps**. No `@farcaster/auth-kit`, no `iron-session`, no `next-auth`. Greenfield.

Five admin routes today, all behind `getSessionData()`:
- `POST /api/juke/admin/register-webhook`
- `POST /api/juke/admin/delete-webhook`
- `POST /api/juke/admin/end-space`
- `POST /api/juke/admin/mark-ended`
- `POST /api/juke/admin/agent-join`

Plus `POST /api/juke/space` for create-space - currently allows anyone with the cookie. Post-auth: gate to admin FIDs only, OR allow any SIWF-logged-in ZAO holder (188 wallets - see future work below).

### Ground truth - what ZAOOS already does (the lift)

ZAOOS has a battle-tested SIWF + iron-session pattern. Files to study/lift:

- `src/components/providers/AuthKitWrapper.tsx` - wraps app in `AuthKitProvider` (relay, RPC, domain config)
- `src/components/gate/LoginButton.tsx` - renders `<SignInButton nonce={serverNonce} onSuccess={handleSuccess} />`
- `src/lib/auth/session.ts` - iron-session config + `getSession()` helper

ZAOOS deps already proven in prod:
- `@farcaster/auth-kit@^0.8.2` - browser SIWF flow (button + nonce dance)
- `@farcaster/auth-client@^0.7.1` - server-side signature verify
- `@farcaster/quick-auth@^0.0.8` - lighter JWT path (for miniapp context)
- `iron-session@^8.0.4` - encrypted session cookies (no DB needed for sessions)

This is THE canonical FC auth stack as of 2026-05-28. Pattern works for any Next.js 16 + App Router project.

### Option comparison

| Option | UX | Ship time | Identity-tied? | New deps | Security |
|---|---|---|---|---|---|
| **A. SIWF + FID allowlist + iron-session** (RECOMMENDED long-term) | Click "Sign in with Farcaster", tap on phone, done | 3-4hr (lift from ZAOOS) | Yes - FID 19640 | 4 (auth-kit/-client/quick-auth/iron-session) | Strong - signed challenge per session, cookie encrypted |
| **B. Quick-auth JWT only** | Same SIWF flow but JWT cookie not iron-session | 2-3hr | Yes | 2 (quick-auth + jose) | Strong - JWT signed by FC relay |
| **C. Magic link via Resend** | Enter email -> click link in inbox -> session cookie set | 4-5hr + Resend acct | No (email != identity) | 2 (resend + react-email) | Medium - email account compromise = admin |
| **D. Login page with current password** (RECOMMENDED MVP) | Visit `/admin/login`, paste password, redirected to admin dashboard | 30min | No | 0 | Same as current (shared password) but no DevTools |
| **E. Headless CLI** (`zuke admin create-space`) | Run from terminal, hits API w/ admin secret in env | 2hr | No | 0 (just a script) | Worse - secret in shell history |
| **F. Bookmarklet** | Click bookmarklet in browser bar -> sets cookie | 15min | No | 0 | Same as current |

### Why A wins long-term

1. **Identity, not shared secret.** When Zaal (FID 19640) logs in, the session ties to his FC identity. Adding/removing admins = edit `ZUKE_ADMIN_FIDS=19640,1689,...` env var. No password rotation, no DevTools.
2. **Already in prod elsewhere.** ZAOOS proves this works at 188-member scale. Zero invention.
3. **Scales to "ZAO holders can create spaces" gate.** Same SIWF flow + different allowlist check (chain query for ZAO token balance or membership list). One day's incremental work post-MVP.
4. **CVE-2025-29927 aware** (WorkOS 2026 guide): auth verified at the Data Access Layer (`getSessionData()`), not just middleware. Already how `session.ts` is structured.

### Why D first

Zuke needs to test with Nicky + 2-3 ZAO regulars THIS WEEK (task #58). The DevTools cookie pattern is a blocker - cannot share admin access with Iman, cannot run a space from phone, cannot recover if cookie expires mid-space. A 30-minute login page using the existing password gets Zuke to "shareable today" without committing to the bigger lift. Then OPTION A this weekend.

### What "Option D" looks like

New file: `src/app/admin/login/page.tsx` - simple form, POST to `/api/admin/login`.

New route: `src/app/api/admin/login/route.ts`:

```ts
export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (password !== ENV.ZUKE_ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'invalid' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set('zuke_admin', ENV.ZUKE_ADMIN_PASSWORD, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
```

Add `/admin` dashboard page that uses `getSessionData()` to gate, surfaces buttons for: Register webhook, Create space, End space, View juke-status. No more DevTools.

### What "Option A" looks like (cutover plan)

1. `npm i @farcaster/auth-kit @farcaster/auth-client iron-session` in Zuke.
2. Copy `AuthKitWrapper.tsx` from ZAOOS, swap relay domain to `zuke.thezao.com`.
3. Rewrite `getSessionData()` to read iron-session cookie, return `{ isAdmin: ZUKE_ADMIN_FIDS.includes(session.fid) }`.
4. Add `/api/auth/nonce` (issue server nonce) + `/api/auth/verify` (verify SIWF message signature via auth-client, set iron-session).
5. Add `/admin/login` page with `<SignInButton>` from auth-kit.
6. Replace the Option D login form with the SIWF button.
7. Delete `ZUKE_ADMIN_PASSWORD` env (and the cookie check in `session.ts`).
8. Add `ZUKE_ADMIN_FIDS=19640` env (Zaal's FID, extend later).

Reference impl: ZAOOS files cited above + `dylsteck/siwf-next-app-router` GitHub repo (NextAuth flavor) + `builders-garden/better-auth-siwf` (Oct 2025, Better Auth flavor with FC miniapp support).

### Open questions

- Should "create space" be admin-only or any-ZAO-holder? MVP = admin-only. Post-A = consider opening it.
- Multi-admin needs Iman's FID + ThyRev's FID added to env. Trivial - same allowlist.
- Mobile UX: SIWF on iOS requires Warpcast app installed. ZAOOS proves this works for 188 members; not a regression.

## Also See

- [Doc 591 - Miniapp Production Audit](../../farcaster/591-miniapp-production-audit/) - ZAOOS SIWF in production
- [Doc 591a - Auth gate audit](../../farcaster/591a-zaoos-gate-audit/) - the gated FC chat pattern
- [Doc 695 - Juke integration ZAO ecosystem map](../../music/695-juke-integration-zao/) - Zuke positioning
- [Doc 710 - Juke Path B architecture](../../music/710-juke-path-b-architecture/) - the white-label decision
- [Doc 765 - Strategic synthesis](../../business/765-strategic-synthesis-may26/) - this week's strategy frame

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Ship OPTION D: `/admin/login` page + `/api/admin/login` route + `/admin` dashboard with buttons | Zaal+Claude | PR to Zuke repo | Today 2026-05-28 |
| Update Block B/C/D test plans to use `/admin/login` instead of DevTools cookie paste | Claude | Clipboard refresh | After D ships |
| Cutover to OPTION A: lift ZAOOS auth-kit + iron-session, swap password cookie for FID allowlist | Zaal+Claude | PR to Zuke repo | 2026-05-31 (this weekend) |
| Delete `ZUKE_ADMIN_PASSWORD` env + cookie check post-A | Zaal | Vercel + PR | After A merges |
| Add Iman + ThyRev FIDs to `ZUKE_ADMIN_FIDS` for multi-admin | Zaal | env var update | When they need access |
| Future: open create-space to ZAO holders (not just admins) | Zaal | new research doc | Post-MVP, after Block D green |
| Decommission task #71 (rotate admin password) after A merges - no password to rotate | Claude | TaskUpdate | After A merges |

## Sources

- [FULL] [builders-garden/better-auth-siwf](https://github.com/builders-garden/better-auth-siwf) - Oct 2025, Better Auth plugin for SIWF using `@farcaster/quick-auth` JWT, miniapp + web support. The most current canonical pattern.
- [FULL] [dylsteck/siwf-next-app-router](https://github.com/dylsteck/siwf-next-app-router) - NextAuth.js flavor, last push Dec 2025, working demo at siwf-next-app-router.vercel.app
- [FULL] [WorkOS - Building authentication in Next.js App Router: 2026 guide](https://workos.com/blog/nextjs-app-router-authentication-guide-2026) - Feb 2026, covers CVE-2025-29927 middleware bypass + Data Access Layer pattern. Confirms iron-session + DAL approach is correct.
- [FULL] [Next.js Authentication Guide (official)](https://nextjs.org/docs/app/guides/authentication) - canonical reference, recommends auth library over custom for prod
- [FULL] [neynarxyz/farcaster-examples wownar-react-sdk](https://github.com/neynarxyz/farcaster-examples) - Neynar's reference for SIWN (Sign In With Neynar) + secure backend pattern. Complement to SIWF if Zuke ever uses Neynar relay.
- [FULL] ZAOOS codebase - `src/components/gate/LoginButton.tsx`, `src/components/providers/AuthKitWrapper.tsx`, `src/lib/auth/session.ts` (the lift target)
- [FULL] Zuke codebase - `/tmp/zuke-init/src/lib/auth/session.ts`, `/tmp/zuke-init/src/lib/env.ts`, `/tmp/zuke-init/package.json` (the rewrite target)
