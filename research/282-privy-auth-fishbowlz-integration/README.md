# 282 — Privy Auth Integration for FISHBOWLZ

> **Status:** Research complete
> **Date:** 2026-04-04
> **Goal:** Evaluate Privy as the auth layer for FISHBOWLZ — replacing or augmenting iron-session with Privy's multi-method login (wallet, Farcaster, email, social), determine exact FID access, server-side verification pattern, and whether free tier covers a hackathon

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Use Privy?** | USE Privy for FISHBOWLZ if you need standalone auth (no ZAO OS iron-session). Privy's free tier (0–499 MAU) is free, adequate for a hackathon or early launch |
| **npm package** | USE `@privy-io/react-auth` v3.18.0 (client) + `@privy-io/node` (server verification). Do NOT use the legacy `@privy-io/server-auth` |
| **Farcaster login** | USE Farcaster as primary login method — Privy returns `user.farcaster.fid` directly, no Neynar needed for basic identity |
| **Server-side auth** | USE `@privy-io/node` `PrivyClient.verifyAccessToken()` in API routes — exact replacement for ZAO OS's `getSessionData()` pattern |
| **FID availability** | FID is in `user.farcaster.fid` (nullable number) — available immediately after login, no extra API call |
| **Write access** | Privy Farcaster login gives READ-ONLY access. For FISHBOWLZ write features (casting), you still need Neynar signerUuid or separate signer key. Privy is building write support but it is NOT available as of April 2026 |
| **Pricing for hackathon** | 0–499 MAU is fully free. FISHBOWLZ hackathon will not hit 499 MAU. Safe to ship without a paid plan |
| **Stripe acquisition** | Privy was acquired by Stripe in June 2025 — docs, SDK, and pricing are unchanged. No breaking changes, but long-term roadmap is Stripe-aligned (stablecoin payments) |

## Comparison of Options

| Auth Option | Farcaster FID | Free Tier | Server Verification | Next.js App Router | ZAO OS Compatibility |
|-------------|--------------|-----------|--------------------|--------------------|---------------------|
| **Privy** (`@privy-io/react-auth`) | Yes — `user.farcaster.fid` | 0–499 MAU free, then $299/mo | `PrivyClient.verifyAccessToken()` in route handlers | Full support, `'use client'` wrapper pattern | Additive — can coexist with iron-session or replace it |
| **iron-session** (current ZAO OS) | Yes via Neynar sign-in flow | Free (self-hosted) | `getSessionData()` in `src/lib/auth/session.ts` | Full support | Already in ZAO OS — used by all API routes today |
| **Farcaster AuthKit** (`@farcaster/auth-kit`) | Yes — native SIWF | Free | Manual JWT verify | Full support | Used in ZAO OS sign-in page |
| **NextAuth.js v5** | Via custom Farcaster provider | Free | `getServerSession()` | Full support | Not in ZAO OS, would require new setup |
| **Dynamic.xyz** | Yes via Farcaster social | Free up to 1,000 MAU | `getAuthToken()` + verify | Full support | Not in ZAO OS |

**Winner for FISHBOWLZ standalone:** Privy — the only option that bundles Farcaster + wallet + email + social into a single SDK with a free tier sufficient for hackathon scale, returning FID natively.

## npm Package Details

```bash
# Client SDK (React)
npm install @privy-io/react-auth
# Latest: 3.18.0 (as of April 2026, published ~15 days ago)

# Server SDK (API routes)
npm install @privy-io/node
```

**Peer dependencies:** React 18+, Next.js 13+ (App Router supported from 14+)
**Note:** `@privy-io/react-auth` v2.0 shipped January 2025 with improved web3 library interoperability. v3.x is the current major version.

## PrivyProvider Setup (Next.js App Router)

### Step 1: `app/providers.tsx`

```tsx
'use client';

import { PrivyProvider } from '@privy-io/react-auth';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        appearance: {
          loginMethods: ['farcaster', 'wallet', 'email', 'google', 'apple'],
          theme: 'dark',
          accentColor: '#f5a623', // ZAO gold
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
```

### Step 2: `app/layout.tsx`

```tsx
import Providers from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### Step 3: Dashboard Setup

1. Create app at `dashboard.privy.io`
2. Go to **User management > Authentication > Socials** → enable Farcaster
3. Copy `NEXT_PUBLIC_PRIVY_APP_ID` and `PRIVY_APP_SECRET` to `.env.local`

## User Identity After Login

### Client-side (`usePrivy` hook)

```tsx
import { usePrivy } from '@privy-io/react-auth';

function FishbowlRoom() {
  const { ready, authenticated, user, login, logout, getAccessToken } = usePrivy();

  // user.farcaster shape (all nullable):
  // {
  //   fid: number | null,           ← Farcaster ID, use this as primary identity
  //   username: string | null,
  //   displayName: string | null,
  //   bio: string | null,
  //   pfp: string | null,           ← profile picture URL
  //   url: string | null,
  //   ownerAddress: string | null,  ← ETH address that owns the FID
  //   signerPublicKey: string | null
  // }

  const fid = user?.farcaster?.fid;
  const username = user?.farcaster?.username;
  const pfp = user?.farcaster?.pfp;

  if (!ready) return <div>Loading...</div>;
  if (!authenticated) return <button onClick={login}>Sign In</button>;

  return <div>Welcome @{username} (FID: {fid})</div>;
}
```

### Top-level `user` object fields

```typescript
user = {
  id: string,           // Privy DID (e.g. "did:privy:abc123") — use as Privy userId
  createdAt: Date,
  linkedAccounts: LinkedAccount[],  // array of all linked accounts
  farcaster?: FarcasterAccount,     // shortcut for linked Farcaster account
  wallet?: WalletAccount,           // shortcut for linked wallet
  email?: EmailAccount,
  isGuest: boolean,
  hasAcceptedTerms: boolean,
}
```

**Important:** `user.farcaster.fid` is the native Farcaster ID. This is the field to use as `hostFid` in FISHBOWLZ room creation. It maps directly to the existing `host_fid` column in the `fishbowl_rooms` table.

### Refreshing Farcaster Profile Cache

Privy caches Farcaster profile at login time. To force-refresh (limited to once per 24 hours):

```typescript
// Server-side (e.g. in an API route)
await fetch('https://auth.privy.io/api/v1/users/farcaster/refresh', {
  method: 'POST',
  body: JSON.stringify({ fid: userFid }),
  headers: {
    Authorization: `Basic ${btoa(`${privyAppId}:${privyAppSecret}`)}`,
    'privy-app-id': privyAppId,
    'content-type': 'application/json',
  },
});
```

## Server-Side API Route Protection

This is the direct replacement for ZAO OS's `getSessionData()` in `src/lib/auth/session.ts`.

### Step 1: Create `src/lib/auth/privy.ts`

```typescript
import { PrivyClient } from '@privy-io/node';

export const privyClient = new PrivyClient({
  appId: process.env.PRIVY_APP_ID!,
  appSecret: process.env.PRIVY_APP_SECRET!,
  // Optional: copy JWT verification key from dashboard to avoid API round-trips
  jwtVerificationKey: process.env.PRIVY_VERIFICATION_KEY,
});
```

### Step 2: Verify Token in API Routes

```typescript
// src/app/api/fishbowlz/rooms/route.ts
import { headers } from 'next/headers';
import { privyClient } from '@/lib/auth/privy';

export async function POST(req: NextRequest) {
  try {
    // 1. Extract token from Authorization header
    const headersList = await headers();
    const accessToken = headersList.get('authorization')?.replace('Bearer ', '');
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Verify token — returns AuthTokenClaims
    const claims = await privyClient.utils().auth().verifyAccessToken({
      access_token: accessToken,
    });
    // claims = { userId, appId, issuer, issuedAt, expiration, sessionId }

    // 3. Get full user + FID from Privy
    const privyUser = await privyClient.getUser(claims.userId);
    const fid = privyUser.farcaster?.fid;
    if (!fid) {
      return NextResponse.json({ error: 'Farcaster account required' }, { status: 403 });
    }

    // ... rest of route logic using fid as the identity
  } catch (err) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
```

### Step 3: Send Token from Client

```tsx
// In any component or hook that calls FISHBOWLZ API routes:
const { getAccessToken } = usePrivy();

const createRoom = async (payload: RoomPayload) => {
  const accessToken = await getAccessToken(); // auto-refreshes if near expiry

  const res = await fetch('/api/fishbowlz/rooms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
};
```

### AuthTokenClaims Shape

```typescript
interface AuthTokenClaims {
  userId: string;       // Privy DID — use to look up user
  appId: string;        // Your Privy app ID
  issuer: string;       // Always 'privy.io'
  issuedAt: number;     // Unix timestamp
  expiration: number;   // Unix timestamp
  sessionId: string;    // Unique session ID
}
// NOTE: FID is NOT in AuthTokenClaims — call privyClient.getUser(claims.userId) to get FID
```

## Pricing — Is Free Tier Enough for FISHBOWLZ Hackathon?

| Tier | MAU Range | Monthly Cost | What's Included |
|------|-----------|--------------|----------------|
| **Developer (Free)** | 0–499 | $0 | All features: embedded wallets, all login methods, Farcaster, email, SMS, socials |
| Starter | 500–2,499 | $299/mo | Same features, more MAU |
| Growth | 2,500–9,999 | $499/mo | Same features, more MAU |
| Enterprise | 10,000+ | Custom | Dedicated support, key quorum, advanced SSO |

**Free tier also includes:**
- 50,000 signatures/month free
- $1M transaction volume/month free
- Embedded wallets across all chains (EVM + Solana)
- All SDKs (Web, Mobile, Gaming)
- Analytics dashboard

**FISHBOWLZ hackathon verdict:** A hackathon or beta launch will not reach 499 MAU. Free tier is adequate. No credit card required to start.

**Stripe acquisition note:** Privy was acquired by Stripe in June 2025. Pricing and SDK are unchanged. The acquisition integrates Privy's wallet infrastructure with Stripe's Bridge stablecoin product — no impact on FISHBOWLZ use case.

## ZAO OS Integration

### How Privy Connects to FISHBOWLZ Files

FISHBOWLZ currently uses `useAuth()` from `src/hooks/useAuth.ts`, which polls `/api/auth/session` (ZAO OS iron-session). There are 3 integration approaches:

**Option A — Full Privy replacement (recommended for FISHBOWLZ standalone)**
- Replace `useAuth()` with `usePrivy()` in `src/app/fishbowlz/page.tsx` and `src/app/fishbowlz/[id]/page.tsx`
- Replace `getSessionData()` in all `src/app/api/fishbowlz/*/route.ts` files with `privyClient.verifyAccessToken()`
- Add `PrivyProvider` wrapper in FISHBOWLZ layout

**Option B — Privy as additional auth method (keeps iron-session)**
- Add Privy login alongside existing ZAO auth
- After Privy login, create iron-session from Privy user data
- Minimal disruption to existing API routes
- Files to modify: `src/app/api/auth/login/route.ts`, `src/providers/`

**Option C — Skip Privy, add Farcaster-only via AuthKit (minimal change)**
- ZAO OS already has `@farcaster/auth-kit` in its stack
- Just extend existing auth to work on FISHBOWLZ standalone deployment
- No new dependency

**Recommended for hackathon speed:** Option A — Privy gives the cleanest standalone auth with the least code.

### Key Files to Touch

| File | Change Needed |
|------|--------------|
| `src/app/fishbowlz/page.tsx` | Replace `useAuth()` with `usePrivy()`, use `user.farcaster.fid` |
| `src/app/fishbowlz/[id]/page.tsx` | Same replacement |
| `src/app/api/fishbowlz/rooms/route.ts` | Replace `getSessionData()` with Privy token verification |
| `src/app/api/fishbowlz/transcripts/route.ts` | Same |
| `src/app/api/fishbowlz/sessions/route.ts` | Same |
| `src/app/api/100ms/token/route.ts` | Add Privy auth check |
| `src/lib/auth/privy.ts` | NEW — PrivyClient singleton (server) |
| `app/providers.tsx` (FISHBOWLZ) | NEW — PrivyProvider wrapper |

### ENV Vars to Add

```bash
# .env.local
NEXT_PUBLIC_PRIVY_APP_ID=your_app_id       # from dashboard.privy.io
PRIVY_APP_SECRET=your_app_secret            # server-only
PRIVY_VERIFICATION_KEY=your_jwt_key         # optional, avoids API calls on verify
```

## Reference Implementations

| Project | Stars | License | Status | Key Takeaway |
|---------|-------|---------|--------|-------------|
| `privy-io/farcaster-demo` | Official | Not specified | Archived Jan 2026 | Farcaster login + write (signer key needed for writes) |
| `privy-io/privy-frames-v2-demo` | Official | Not specified | Archived Sep 2025 | Frames V2 + Privy auto-login pattern |
| `justsoantsy/slaycaster` | Community | Not specified | Active | Real Farcaster + Privy app, login + cast |
| `privy-io/smart-wallets-starter` | Official | Not specified | Active | Smart wallets with Privy + Next.js |

**Note:** The canonical current examples are at `github.com/privy-io/examples` (referenced in archived repos' READMEs).

### Pattern from Supercast (Production Farcaster App Using Privy)

Supercast (2nd largest Farcaster app after Warpcast) uses Privy for:
- New user onboarding via email (no Warpcast required)
- Embedded wallet creation on signup
- Farcaster username + PFP selection at registration
- Signer generation for write access (Privy sponsors signer creation cost)

Key insight from Supercast: **Privy sponsors the signer creation cost for Farcaster write access** — this means generating a signer to post to Farcaster via Privy is free to you and your users.

## Known Limitations

1. **No FID in AuthTokenClaims** — the JWT verification returns `userId` (Privy DID), not FID directly. You must call `privyClient.getUser(userId)` to get `fid`. Add caching to avoid N+1 calls.
2. **Write access not available** — Privy Farcaster login is read-only as of April 2026. FISHBOWLZ rooms casting to Farcaster still requires a separate Neynar signer (already in ZAO OS via `src/lib/fishbowlz/castRoom.ts`).
3. **Farcaster profile cache** — Privy caches Farcaster data at login time. Profile changes require a manual refresh API call, limited to 1x per 24 hours per user.
4. **Vercel deployment** — `@privy-io/node` requires Node.js runtime (not Edge runtime). Set `export const runtime = 'nodejs'` in any API route using Privy server verification.

## Sources

- [Privy React SDK Docs — Setup](https://docs.privy.io/basics/react/setup)
- [Privy Farcaster Login Guide](https://docs.privy.io/guide/guides/farcaster-login)
- [Privy Farcaster Login Recipe](https://docs.privy.io/recipes/farcaster/login)
- [Privy User Object Reference](https://docs.privy.io/guide/react/users/object)
- [Privy Server-Side Token Verification](https://docs.privy.io/guide/server/authorization/verification)
- [Privy Access Tokens](https://docs.privy.io/authentication/user-authentication/access-tokens)
- [Privy Pricing](https://www.privy.io/pricing)
- [Privy Farcaster Demo (archived)](https://github.com/privy-io/farcaster-demo)
- [Privy Frames V2 Demo (archived)](https://github.com/privy-io/privy-frames-v2-demo)
- [Supercast Case Study](https://privy.io/blog/supercast-case-study)
- [@privy-io/react-auth on npm](https://www.npmjs.com/package/@privy-io/react-auth)
