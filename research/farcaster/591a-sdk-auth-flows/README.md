---
topic: farcaster
type: guide
status: research-complete
last-validated: 2026-05-02
related-docs: 173, 250, 295, 308
tier: STANDARD
---

# Farcaster Mini App SDK Auth + Lifecycle Flows

Production audit of Farcaster Mini App SDK authentication and initialization patterns. Covers `sdk.actions.ready()`, `sdk.context`, `sdk.isInMiniApp()`, QuickAuth, and SIWF. Includes failure mode diagnosis and recommended init sequences for gated miniapps.

## Quick Reference: Auth Strategy Decision Matrix

Choose your auth pattern based on trust model, latency, and use case:

| Strategy | When to Use | Trust Model | Latency | First Load Prompt | Code Snippet |
|----------|------------|-------------|---------|-------------------|------|
| **Context FID** | Unsigned, instant UX (leaderboard, stats, profile display) | Untrusted; trust client's `sdk.context.user.fid` only for analytics/display | <5ms | None | `const fid = await sdk.context; const userId = fid.user.fid` |
| **QuickAuth** | Sensitive operations (write, payment, vote) that need user proof | Trusted; JWT signed by Farcaster edge servers, verifiable server-side | 100-300ms (first) / 5ms (cached) | Yes (first only) | `const { token } = await sdk.quickAuth.getToken(); fetch(url, { headers: { Authorization: 'Bearer ' + token } })` |
| **SIWF (Full)** | Fine-grained permissions, custom nonce + verification | Trusted; full SIWF message with user's primary or auth address signature | 200-500ms | Yes | `const { message, signature } = await sdk.actions.signIn({ nonce }); verify on server` |

**Recommended**: Start with Context FID for reads; add QuickAuth for writes. SIWF only if you need custom verification logic.

---

## 1. sdk.actions.ready() - Splash Screen Lifecycle

### What It Does
Signals to the Farcaster client that your miniapp's UI is ready for display. This dismisses the branded splash screen (loading indicator) that appears while your app loads.

### When to Call
**As soon as your app's critical UI is rendered**, not after all data is loaded. Minimize the time users see the splash screen.

```typescript
// CORRECT: React pattern
import { sdk } from '@farcaster/miniapp-sdk'

export function App() {
  const [user, setUser] = useState<{ fid: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      // Fetch critical auth/user data
      const res = await sdk.quickAuth.fetch('/api/me')
      if (res.ok) {
        setUser(await res.json())
      }
      // Dismiss splash once UI state is set, even if secondary data still loading
      await sdk.actions.ready()
      setIsLoading(false)
    }
    init()
  }, [])

  // Show skeleton/placeholder while loading secondary data
  if (!user) {
    return <div className="skeleton" /> // Splash still visible
  }

  return <Dashboard user={user} isLoading={isLoading} />
}
```

### Fire-and-Forget vs Await

- **`await sdk.actions.ready()`** (Recommended): Guarantees splash is dismissed before rendering continues.
- **`sdk.actions.ready()`** without await: Fires in background; app may render before splash dismisses, causing visual jitter.

**Farcaster official guidance**: Dismiss splash as soon as content is ready. Don't wait for all data; use skeletons for secondary content.

### Common Failure: "Stuck Splash"

**Symptom**: Splash screen never dismisses; app renders but splash stays on top.

**Root Causes**:

1. **`ready()` never called** - Most common. Verify it's in your init code.
2. **`ready()` called before UI rendered** - Set state first, then call `ready()`.
3. **Vercel Bot Protection blocking homepage** - If your home route (`/` or custom `homeUrl`) is blocked by WAF, the SDK load fails and `ready()` never fires.
   - **Fix**: Add Vercel WAF bypass rule for `Path equals /` → Bypass (allows Farcaster to scrape the `fc:miniapp` meta tag at launch).
4. **Third-party cookies blocked** - Some clients (especially older Safari on iOS) block third-party cookies needed for the SDK iframe.
   - **Fix**: Use Safari's "Allow All Cookies" or ask user to disable tracking prevention.
5. **Manifest fetch failure** - If `/.well-known/farcaster.json` returns 404 or is blocked, some clients don't initialize the SDK.
   - **Fix**: Verify manifest exists and is publicly readable.

### Documented Performance Anti-Patterns

Don't:
- Wait for all data to load before calling `ready()`.
- Call `ready()` synchronously during render (use `useEffect`).
- Re-call `ready()` multiple times (idempotent, but wasteful).

---

## 2. sdk.context - User & Client Context

### What It Returns

```typescript
// Farcaster SDK v2.x type definition
export type MiniAppContext = {
  user: {
    fid: number                    // Unique Farcaster ID (or -1 on Base if not verified)
    username?: string              // e.g., "zaal"
    displayName?: string           // e.g., "Zaal"
    pfpUrl?: string                // Profile picture URL
    bio?: string                   // User bio
    location?: {
      placeId: string              // Google Places ID
      description: string          // e.g., "Austin, TX, USA"
    }
  }
  location?: MiniAppLocationContext  // Where the miniapp was opened (cast, channel, etc.)
  client: {
    platformType?: 'web' | 'mobile'  // Client runtime (Warpcast app vs web frame)
    clientFid: number              // Self-reported FID of the client (9152 for Warpcast)
    added: boolean                 // Whether user added this miniapp to their client
    safeAreaInsets?: {
      top: number; bottom: number; left: number; right: number
    }
    notificationDetails?: {
      url: string                  // Farcaster notification API endpoint
      token: string                // Notification token for this user
    }
  }
  features?: {
    haptics: boolean               // Client supports haptic feedback
    cameraAndMicrophoneAccess?: boolean
  }
}
```

### When It's Populated

- **Immediately on miniapp load** in Warpcast (iOS, Android, web), Base App, and other clients.
- **Returns `undefined`** if accessed outside a miniapp context (e.g., regular web browser).

### Access Pattern: Promise, Not Sync

```typescript
// CORRECT: await the Promise
const context = await sdk.context
console.log(context.user.fid)

// WRONG: No await; context will be undefined or Promise object
const context = sdk.context
console.log(context.user.fid) // TypeError: Cannot read property 'user' of Promise
```

### Race Conditions & Hangs

**Symptom**: `const context = await sdk.context` hangs indefinitely (often on Mac Warpcast or older beta builds).

**Root Cause**: SDK initialization is delayed or the postMessage bridge between the miniapp iframe and the client is not established.

**Fixes**:
1. Wrap in a timeout:
   ```typescript
   const contextPromise = sdk.context
   const context = await Promise.race([
     contextPromise,
     new Promise(resolve => setTimeout(() => resolve(undefined), 2000))
   ])
   if (!context) {
     console.warn('Context timed out; using fallback')
     // Fall back to context-free mode or QuickAuth
   }
   ```

2. Check if SDK is loaded before awaiting:
   ```typescript
   if (typeof window !== 'undefined' && window.farcasterSDK) {
     const context = await sdk.context
   }
   ```

3. Update client: Older Warpcast versions (pre-2025-Q1) had slower context delivery. Ask users to update the client.

### Untrusted Input Warning

The Farcaster docs explicitly state: **`sdk.context.user` is untrusted**. The client can lie about the FID, username, and pfp. 

**Trust Pattern**:
- Use `context.user.fid` for **display only** (leaderboard, profile card).
- For **writes or payments**, extract the FID from a **QuickAuth JWT** (server-verified) instead.

---

## 3. sdk.isInMiniApp() - Environment Detection

### What It Checks

Returns `true` if the SDK detects that the app is running inside a Farcaster client's miniapp iframe. `false` otherwise.

```typescript
const inMiniApp = await sdk.isInMiniApp()
if (inMiniApp) {
  console.log('Running in Warpcast, Base App, or other Farcaster client')
} else {
  console.log('Running in regular browser or non-Farcaster app')
}
```

### Detection Heuristics

The SDK checks:
1. **postMessage available** - Can the iframe communicate with the parent via `window.postMessage`?
2. **Known client FID** - Does `window.parent` respond with a valid client FID (9152 for Warpcast, etc.)?
3. **Timeout threshold** - If no response within ~1-2 seconds, return `false`.

### False Positives & False Negatives

**False Positive** (returns `true` when actually in a browser):
- Rare. Usually only in highly restricted iframes or VPN'd browsers that accidentally mimic client behavior.

**False Negative** (returns `false` even when in a valid miniapp):
- **Happens on slower networks or older clients** if the postMessage bridge takes >2 seconds to establish.
- **Happens immediately after SDK load** - the SDK hasn't finished handshaking with the parent frame.

### Recommended Pattern: Don't Gate on isInMiniApp

**WRONG**:
```typescript
const inMiniApp = await sdk.isInMiniApp()
if (!inMiniApp) {
  return <AccessDenied /> // Blocks legitimate users on slow networks
}
```

**CORRECT** - Check context.user.fid instead:
```typescript
const context = await sdk.context
if (context && context.user.fid && context.user.fid > 0) {
  // Verified: running in a miniapp with a valid user
  return <AuthorizedContent />
} else {
  // Unknown environment or no user; fall back to anonymous mode or SIWF
  return <AnonymousContent />
}
```

### Known Issue: Base App & Coinbase Wallet

GitHub issue #310 (farcasterxyz/miniapps): `isInMiniApp()` returned `false` in Coinbase Wallet Browser (CBW) due to late postMessage setup.

**Status**: Fixed in Base App beta (landed mid-2025). If you need to support older CBW versions, add a fallback:
```typescript
const inMiniApp = await sdk.isInMiniApp()
const hasContext = !!(await sdk.context)?.user?.fid
const isValid = inMiniApp || hasContext
```

---

## 4. Quick Auth - JWT-Based Authentication

### Overview

Quick Auth is a Farcaster-hosted OAuth-like service that issues signed JWTs for miniapps. It abstracts away SIWF nonce management and makes auth seamless.

### Client Side: Two Methods

#### Method A: `sdk.quickAuth.fetch()` (Recommended for Simple Apps)

Wraps `fetch()` and automatically adds the Authorization header with a valid JWT.

```typescript
import { sdk } from '@farcaster/miniapp-sdk'

// Automatically prompts for auth on first call (first-launch flow)
const res = await sdk.quickAuth.fetch('https://myapp.com/api/me')

if (res.ok) {
  const user = await res.json()
  console.log('User FID:', user.fid) // Verified on server
}
```

**How it works**:
1. Checks if a cached token exists (and hasn't expired).
2. If no cached token, prompts user with "Sign in with Farcaster" dialog.
3. Once user signs, Farcaster edge servers issue a JWT.
4. Token is stored in memory (cleared on page refresh).
5. Adds `Authorization: Bearer <token>` header to your fetch.

**Pros**: Simplest integration. No backend nonce generation needed.

**Cons**: Token is in-memory only; lost on page refresh (requires re-auth if user refreshes).

#### Method B: `sdk.quickAuth.getToken()` (More Control)

Returns just the token so you can manage the fetch yourself.

```typescript
const { token } = await sdk.quickAuth.getToken()

const res = await fetch('https://myapp.com/api/me', {
  headers: { Authorization: `Bearer ${token}` }
})

const user = await res.json()
```

**Same prompting behavior as Method A**. Use this if you need to:
- Add custom headers alongside the JWT.
- Retry logic or custom error handling.
- Batch multiple authenticated requests.

### JWT Lifetime & Caching

- **Lifetime**: ~24 hours (Farcaster signs the JWT with an expiration claim).
- **Cache**: Stored in-memory by the SDK. Cleared on page refresh or tab close.
- **Re-auth**: On first page load or after cache expiration, the SDK re-prompts the user with the SIWF dialog.

**Timeline**:
- **User's first visit to your app**: SIWF prompt → user signs → JWT issued → cached → request sent.
- **User's second visit (same session)**: JWT cache hit → request sent immediately (no prompt).
- **User's next day**: JWT expired → SIWF prompt → new JWT → cached → request sent.

### Server Side: Verify the JWT

Use the `@farcaster/quick-auth` package (v0.6.0+) to verify tokens:

```typescript
import { createClient, Errors } from '@farcaster/quick-auth'

const client = createClient()

// In your API route (e.g., /api/me)
export async function GET(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response('Missing token', { status: 401 })
  }

  const token = authHeader.slice('Bearer '.length)

  try {
    // Verify the JWT signature and extract the payload
    const payload = await client.verifyJwt({
      token,
      domain: 'myapp.com' // Must match the domain the JWT was issued for
    })

    // payload.sub is the user's FID (subject)
    const fid = payload.sub
    console.log('Authenticated user FID:', fid)

    // Now you can trust this FID for database writes, payments, etc.
    return new Response(JSON.stringify({ fid }), { status: 200 })
  } catch (e) {
    if (e instanceof Errors.InvalidTokenError) {
      console.error('Token validation failed:', e.message)
      return new Response('Invalid token', { status: 401 })
    }
    throw e
  }
}
```

**Key Points**:
- **Asymmetric signature**: Farcaster signs with a private key; you verify with the public key (bundled in the SDK).
- **Domain binding**: The JWT is issued for a specific domain (e.g., myapp.com). If your frontend is on `myapp.vercel.app` and you send the token to `api.myapp.com`, verification will fail unless both domains are registered.
- **Replay protection**: The JWT includes a nonce (managed by Farcaster), so it can't be replayed.

### First-Launch Prompt Behavior

**Documented behavior**: 
- First call to `quickAuth.fetch()` or `getToken()` in a session always prompts (even if token might be cached from a previous session).
- This is intentional: ensures the user explicitly consents to your app accessing their identity.
- After user approves, subsequent calls in the same session don't prompt.

**Edge case**: If the user clears all browser storage (localStorage, sessionStorage, cookies), the SDK considers it a fresh session and re-prompts on the next call.

---

## 5. Sign In with Farcaster (SIWF) - Full Flow

Use SIWF directly if you need custom verification logic, multiple signatures, or fine-grained permission control.

### When to Use

- You have a custom backend that needs to verify signatures itself (not using Farcaster's Quick Auth servers).
- You need to bundle multiple operations into one SIWF message.
- You want to support Auth Addresses (additional wallet signatures) — Farcaster added this in 2025.

### Client Side

```typescript
import { sdk } from '@farcaster/miniapp-sdk'
import { randomBytes } from 'crypto' // Or any nonce generator

// Generate a random nonce (at least 8 alphanumeric characters)
const nonce = randomBytes(16).toString('hex')

try {
  const result = await sdk.actions.signIn({
    nonce,
    acceptAuthAddress: true // NEW in 2025: allows signing with custody or auth wallets
  })

  // result = { message: "...", signature: "..." }
  // Send both to your backend for verification
  const res = await fetch('/api/verify-siwf', {
    method: 'POST',
    body: JSON.stringify({
      message: result.message,
      signature: result.signature,
      nonce
    })
  })
} catch (error) {
  if (error.name === 'RejectedByUser') {
    console.log('User rejected sign-in')
  }
}
```

### Server Side: Verify with @farcaster/auth-client

```typescript
import { verifySignInMessage } from '@farcaster/auth-client'

export async function POST(req: Request) {
  const { message, signature, nonce } = await req.json()

  try {
    // Verify the signature and extract the user's FID
    const result = await verifySignInMessage(message, signature, {
      nonce
    })

    const fid = result.success ? result.fid : null
    if (!fid) throw new Error('Invalid signature')

    // Now issue your own session token (JWT, session cookie, etc.)
    const sessionToken = generateSessionToken(fid)
    return new Response(
      JSON.stringify({ fid, sessionToken }),
      { status: 200 }
    )
  } catch (e) {
    console.error('SIWF verification failed:', e)
    return new Response('Invalid signature', { status: 401 })
  }
}
```

**Key Dependency**: `@farcaster/auth-client` must be v0.7.0+ to support Auth Addresses (late 2024 onward).

---

## 6. Common Failure Modes & Diagnostics

| Symptom | Root Cause | Diagnosis | Fix |
|---------|-----------|-----------|-----|
| **Splash never dismisses** | `ready()` not called or blocked | Check browser console for SDK errors; verify `ready()` is in your init code | Ensure `ready()` is called after critical UI renders; disable Vercel Bot Protection on `/` |
| **Sign-in loop (infinite SIWF prompts)** | Token validation fails on server | Server-side verification throws error but frontend retries | Verify domain binding in `client.verifyJwt({ domain })` matches your actual app domain; check token expiration |
| **FID undefined or -1** | User is in Base App (not Farcaster) or on an allowlist gate | Check `context.user.fid === -1` in Base App beta | Switch to wallet-based auth for Base App; use SIWE instead of Farcaster SDK |
| **Third-party cookies blocked** | Browser or OS privacy settings block iframe cookies | Test in Safari with "Block all cookies" enabled | Ask user to enable cookies for your domain; consider cookie-less JWT-in-URL fallback |
| **isInMiniApp() returns false** | PostMessage bridge not established yet | Call with a 2-second timeout; check network waterfall | Don't gate on `isInMiniApp()`; check `context.user.fid > 0` instead |
| **Token claims mismatch** | Domain mismatch (e.g., frontend on `vercel.app`, backend on custom domain) | Check `Authorization` header and `domain` parameter in `verifyJwt()` | Ensure domain in JWT matches domain passed to `verifyJwt()` |
| **Manifest not found (404)** | `/.well-known/farcaster.json` path wrong or not public | Use curl: `curl https://myapp.com/.well-known/farcaster.json` | Verify manifest is at the correct path; check file permissions; enable public access on CDN if used |

---

## 7. Recommended Init Sequence for Gated Miniapp

For a miniapp with an **allowlist gate** (like ZAO OS):

```typescript
'use client'

import { sdk } from '@farcaster/miniapp-sdk'
import { useEffect, useState } from 'react'

export function MiniAppGate() {
  const [status, setStatus] = useState<'loading' | 'authorized' | 'denied'>('loading')
  const [user, setUser] = useState<{ fid: number } | null>(null)

  useEffect(() => {
    const init = async () => {
      try {
        // Step 1: Wait for context with timeout
        const contextPromise = sdk.context
        const context = await Promise.race([
          contextPromise,
          new Promise<undefined>(resolve => setTimeout(() => resolve(undefined), 2000))
        ])

        if (!context?.user?.fid || context.user.fid <= 0) {
          console.warn('No valid context; falling back to QuickAuth')
          // Step 2: Try QuickAuth (prompts user if needed)
          const res = await sdk.quickAuth.fetch('/api/auth-context')
          if (!res.ok) throw new Error('QuickAuth failed')
          const data = (await res.json()) as { fid: number }
          setUser(data)
        } else {
          // Step 3: Use context FID (untrusted for writes, ok for display)
          setUser({ fid: context.user.fid })
        }

        // Step 4: Dismiss splash as soon as we have a user
        await sdk.actions.ready()

        // Step 5: Verify allowlist on server
        const verifyRes = await sdk.quickAuth.fetch('/api/allowlist-check')
        if (verifyRes.ok) {
          setStatus('authorized')
        } else {
          setStatus('denied')
        }
      } catch (error) {
        console.error('Init failed:', error)
        setStatus('denied')
      }
    }

    init()
  }, [])

  if (status === 'loading') {
    return null // Splash still showing
  }

  if (status === 'denied') {
    return <AccessDenied />
  }

  return <AuthorizedContent fid={user?.fid} />
}
```

**Routes needed**:

1. **`/api/auth-context`** (QuickAuth protected):
   ```typescript
   // src/app/api/auth-context/route.ts
   import { createClient } from '@farcaster/quick-auth'
   import { NextRequest } from 'next/server'

   const client = createClient()

   export async function GET(req: NextRequest) {
     const authHeader = req.headers.get('Authorization')
     if (!authHeader?.startsWith('Bearer ')) {
       return new Response('Unauthorized', { status: 401 })
     }

     const token = authHeader.slice('Bearer '.length)
     try {
       const payload = await client.verifyJwt({
         token,
         domain: process.env.MINIAPP_DOMAIN || 'localhost:3000'
       })
       return new Response(JSON.stringify({ fid: payload.sub }), { status: 200 })
     } catch (e) {
       return new Response('Invalid token', { status: 401 })
     }
   }
   ```

2. **`/api/allowlist-check`** (QuickAuth protected):
   ```typescript
   // src/app/api/allowlist-check/route.ts
   import { createClient } from '@farcaster/quick-auth'
   import { ALLOWLIST_FIDS } from '@/lib/constants'
   import { NextRequest } from 'next/server'

   const client = createClient()

   export async function GET(req: NextRequest) {
     const authHeader = req.headers.get('Authorization')
     if (!authHeader?.startsWith('Bearer ')) {
       return new Response('Unauthorized', { status: 401 })
     }

     const token = authHeader.slice('Bearer '.length)
     try {
       const payload = await client.verifyJwt({
         token,
         domain: process.env.MINIAPP_DOMAIN || 'localhost:3000'
       })

       const fid = payload.sub
       if (ALLOWLIST_FIDS.includes(fid)) {
         return new Response(JSON.stringify({ allowed: true }), { status: 200 })
       } else {
         return new Response(JSON.stringify({ allowed: false }), { status: 403 })
       }
     } catch (e) {
       return new Response('Invalid token', { status: 401 })
     }
   }
   ```

---

## 8. SDK Version Numbers & Package References

| Package | Version (as of 2026-05-02) | GitHub Release | Notes |
|---------|---------------------------|----------------|-------|
| `@farcaster/miniapp-sdk` | v2.x (latest: 2.0.8) | [Releases](https://github.com/farcasterxyz/miniapps/releases) | Main SDK; includes `actions`, `context`, `isInMiniApp()` |
| `@farcaster/quick-auth` | v0.6.0+ | [Releases](https://github.com/farcasterxyz/miniapps/releases?q=quick-auth) | Server-side JWT verification; requires v0.7.0+ for Auth Address support |
| `@farcaster/auth-client` | v0.7.0+ | [Releases](https://github.com/farcasterxyz/auth-monorepo) | SIWF verification; supports Auth Addresses as of v0.7.0 |

**Upgrade path**: If you're on `@farcaster/auth-client` <0.7.0 and want to support Auth Addresses, run `npm install @farcaster/auth-client@latest`.

---

## 9. ZAO OS Integration Checklist

For integrating these patterns into ZAO OS miniapps:

- [ ] `src/app/miniapp/page.tsx` — Implements the gated init sequence from Section 7. Calls `ready()` after allowlist check.
- [ ] `src/components/miniapp/MiniAppGate.tsx` — Exports the gate component. Handles loading state, auth fallback, and denied state.
- [ ] `src/app/api/miniapp/auth/route.ts` — QuickAuth verification; extracts FID from JWT and returns user data.
- [ ] `src/app/api/miniapp/auth-context/route.ts` — Same as above; separate route if needed for context-only flows.
- [ ] `src/lib/auth/session.ts` — Reuse existing session utilities; consider adding QuickAuth helpers (`verifyQuickAuthToken`).
- [ ] `.well-known/farcaster.json` — Manifest file with `homeUrl`, `webhookUrl`, icon, and splash images. Signed with account association.
- [ ] Environment: `MINIAPP_DOMAIN` — Must match the domain passed to `client.verifyJwt()`. Defaults to localhost:3000 in dev, deployed domain in prod.
- [ ] Vercel WAF: Bypass rules on `/`, `/.well-known/`, `/api/og` (if used) to allow Farcaster server-side requests.

---

## Sources

- **Official Docs**: https://miniapps.farcaster.xyz/docs/
- **Loading & Ready**: https://miniapps.farcaster.xyz/docs/guides/loading
- **Authentication Guide**: https://miniapps.farcaster.xyz/docs/guides/auth
- **Context API**: https://miniapps.farcaster.xyz/docs/sdk/context
- **Quick Auth**: https://miniapps.farcaster.xyz/docs/sdk/quick-auth
- **Sign In with Farcaster**: https://miniapps.farcaster.xyz/docs/sdk/actions/sign-in
- **GitHub Monorepo**: https://github.com/farcasterxyz/miniapps (198 stars, MIT license, 50+ contributors)
- **FAQ**: https://miniapps.farcaster.xyz/docs/guides/faq (addresses splash screen, auth, manifest issues)
- **Vercel Bot Protection Issue**: https://docs.neynar.com/miniapps/guides/vercel-bot-protection (PR #575 in miniapps repo)
- **Base App Migration**: https://docs.base.org/mini-apps/troubleshooting/common-issues (FID=-1 issue #537; isInMiniApp issue #310)
- **Open-Source Examples**:
  - Frames V2 Demo: https://github.com/farcasterxyz/frames-v2-demo/blob/main/src/app/frames/haptics/page.tsx (uses `await sdk.context`)
  - Onchainkit: https://github.com/coinbase/onchainkit/blob/main/packages/onchainkit/src/minikit/MiniKitProvider.tsx (error handling pattern)
  - Neynar Examples: https://github.com/neynarxyz/farcaster-examples/blob/main/wownar/src/app/providers.tsx
  - Miniapp Next Template: https://github.com/builders-garden/miniapp-next-template/blob/main/components/farcaster-provider.tsx (fallback logic)

