# 86 — Farcaster Mini Apps Integration for ZAO OS

> **Note:** Folder is named `68-farcaster-miniapps-integration` due to a numbering collision with doc 68 (Alibaba Page Agent). Canonical number is **86**.

**Date:** 2026-03-18
**Status:** Complete
**Category:** Technical / Integration

## Summary

Farcaster Mini Apps (formerly Frames v2) allow web apps to run inside Farcaster clients (Warpcast) with native-like capabilities: auto-login, wallet access, push notifications, and cast composition. ZAO OS can be distributed as a Mini App with minimal changes, giving ZAO members seamless access directly from their Farcaster client.

## What Are Farcaster Mini Apps?

Mini Apps are web apps (HTML/CSS/JS) rendered in a vertical modal inside Farcaster clients. They get:

- **Auto-authentication** via Quick Auth (JWT-based, built on Sign In With Farcaster)
- **User context** (FID, username, display name, PFP, bio) injected via SDK
- **Wallet access** (EIP-1193 Ethereum provider for onchain transactions)
- **Push notifications** (webhook-based, token per user)
- **Cast composition** (prompt user to post from within the app)
- **Location awareness** (know if opened from a cast, notification, channel, or launcher)

## Key Architecture Components

### 1. Manifest File (`/.well-known/farcaster.json`)

Domain-level configuration that registers the app with Farcaster clients:

```json
{
  "accountAssociation": {
    "header": "<base64>",
    "payload": "<base64>",
    "signature": "<base64>"
  },
  "frame": {
    "version": "1",
    "name": "THE ZAO",
    "homeUrl": "https://zaoos.xyz",
    "iconUrl": "https://zaoos.xyz/icon-1024.png",
    "splashImageUrl": "https://zaoos.xyz/splash-200.png",
    "splashBackgroundColor": "#0a1628",
    "webhookUrl": "https://zaoos.xyz/api/miniapp/webhook",
    "subtitle": "Community on Farcaster",
    "description": "Gated music community OS",
    "primaryCategory": "social",
    "tags": ["music", "community", "web3", "farcaster"]
  }
}
```

In Next.js, serve via `app/.well-known/farcaster.json/route.ts`.

### 2. Embed Metadata (per-page)

For shareable pages, add `<meta name="fc:miniapp" content="..." />` with embed JSON. In Next.js use `generateMetadata()`.

### 3. SDK (`@farcaster/miniapp-sdk`)

```bash
npm install @farcaster/miniapp-sdk
```

```typescript
import { sdk } from '@farcaster/miniapp-sdk'

// On app load — MUST call or users see infinite loading
await sdk.actions.ready()

// Access user context
const { user, client, location } = sdk.context
// user.fid, user.username, user.displayName, user.pfpUrl, user.bio
```

### 4. Quick Auth (Auto-Login)

The key feature for ZAO OS. Quick Auth eliminates manual login entirely:

**Client-side:**
```typescript
// Option A: Auto-authenticated fetch
const res = await sdk.quickAuth.fetch(`${BACKEND}/api/me`)

// Option B: Get JWT token directly
const { token } = await sdk.quickAuth.getToken()
// Token is cached in memory, auto-refreshed when expired
```

**Server-side verification:**
```bash
npm install @farcaster/quick-auth
```

```typescript
import { verifyJwt } from '@farcaster/quick-auth'

const payload = await client.verifyJwt({
  token: bearerToken,
  domain: 'zaoos.xyz',
})
// payload.sub = user's FID
```

**Performance hint:**
```html
<link rel="preconnect" href="https://auth.farcaster.xyz" />
```

## Integration Plan for ZAO OS

### Phase 1: Basic Mini App (Low Effort)

1. **Create manifest route** at `app/.well-known/farcaster.json/route.ts`
   - Generate `accountAssociation` signature using app FID 19640
   - Configure with ZAO branding from `community.config.ts`

2. **Add SDK initialization** in root layout or a provider
   - `npm install @farcaster/miniapp-sdk`
   - Call `sdk.actions.ready()` after hydration
   - Only initialize when running inside a Farcaster client (check `window.parent !== window` or SDK detection)

3. **Add embed metadata** to key pages using `generateMetadata()`

### Phase 2: Auto-Login via Quick Auth (Medium Effort)

This is the highest-value integration — users open ZAO OS in Warpcast and are instantly logged in.

1. **Create Quick Auth API route** at `api/miniapp/auth/route.ts`
   - Verify JWT from Quick Auth using `@farcaster/quick-auth`
   - Extract FID from `payload.sub`
   - Look up user in Supabase, create iron-session (reuse existing `saveSession()`)
   - Return session cookie — all existing auth checks work seamlessly

2. **Client-side auto-login flow:**
   ```typescript
   // In a MiniAppProvider or useEffect in root layout
   if (isMiniApp()) {
     const { token } = await sdk.quickAuth.getToken()
     await fetch('/api/miniapp/auth', {
       method: 'POST',
       headers: { Authorization: `Bearer ${token}` },
     })
     // Session cookie set — user is now logged in
     // Redirect to /chat or refresh
   }
   ```

3. **Map Quick Auth to existing session:**
   - Quick Auth gives us the FID
   - Neynar API lookup gives us username, displayName, pfpUrl
   - Call existing `saveSession()` — zero changes to downstream auth checks

### Phase 3: Native Features (Higher Effort)

1. **Push notifications** via webhook
   - Create `api/miniapp/webhook/route.ts` to receive `miniapp_added`/`miniapp_removed` events
   - Store notification tokens in Supabase
   - Send notifications for new messages, governance votes, respect received

2. **Cast composition** from within the app
   - Use `sdk.actions.composeCast()` for sharing from chat/governance
   - Pre-fill cast text with channel tag

3. **Wallet integration**
   - Use `sdk.wallet.getEthereumProvider()` instead of external wallet connectors
   - Seamless Respect token interactions without switching apps

4. **Context-aware routing**
   - If opened from a cast embed, route to relevant content
   - If opened from notification, route to the notification target

## SDK Context Object Reference

```typescript
interface MiniAppContext {
  user: {
    fid: number
    username?: string
    displayName?: string
    pfpUrl?: string
    bio?: string
    location?: { placeId: string; description: string }
  }
  client: {
    platformType: 'web' | 'mobile'
    clientFid: number
    added: boolean
    safeAreaInsets: { top: number; bottom: number; left: number; right: number }
    notificationDetails?: { url: string; token: string }
  }
  location:
    | { type: 'cast_embed'; cast: CastContext }
    | { type: 'notification'; notification: NotificationContext }
    | { type: 'launcher' }
    | { type: 'channel'; channel: ChannelContext }
    | { type: 'cast_share'; cast: CastContext }
    | { type: 'open_miniapp' }
  features?: {
    haptics?: boolean
    cameraAndMicrophoneAccess?: boolean
  }
}
```

## SDK Actions Reference

| Action | Purpose | ZAO OS Use Case |
|--------|---------|-----------------|
| `ready()` | Dismiss splash screen | Required on load |
| `addMiniApp()` | Prompt user to favorite | Onboarding flow |
| `close()` | Close the Mini App | After completing action |
| `composeCast()` | Compose a cast | Share from chat/governance |
| `openUrl()` | Open external URL | Links to external content |
| `viewProfile()` | View Farcaster profile | Member profiles |
| `viewCast()` | View a specific cast | Chat message source |
| `swapToken()` | Token swap prompt | Respect token acquisition |
| `sendToken()` | Token send prompt | Respect token gifting |
| `signin()` | SIWF flow | Fallback auth |

## Compatibility Considerations

1. **ZAO OS currently uses iron-session** with httpOnly cookies — this works fine inside Mini App webviews since they share the same origin.

2. **Wallet-only auth path** (existing SIWE flow) remains for users accessing outside Farcaster clients. Mini App auto-login is an additional, parallel auth path.

3. **XMTP** should work inside the Mini App webview since it uses localStorage for keys. May need testing for WASM module loading in the constrained environment.

4. **Viewport:** Mini Apps render at 424x695px on web, full device on mobile. ZAO OS is already mobile-first, so this aligns well.

5. **User context is untrusted** — always verify server-side via Quick Auth JWT, never rely on `sdk.context.user` alone for auth decisions.

## Notification Limits

- 1 notification per 30 seconds per user
- 100 notifications per day per user
- 24-hour idempotency window

## Key Dependencies

- `@farcaster/miniapp-sdk` — client SDK
- `@farcaster/quick-auth` — server-side JWT verification
- Node.js 22.11.0+ required for SDK

## Sources

- [Mini Apps Getting Started](https://miniapps.farcaster.xyz/docs/getting-started)
- [Mini Apps Specification](https://miniapps.farcaster.xyz/docs/specification)
- [Quick Auth](https://miniapps.farcaster.xyz/docs/sdk/quick-auth)
- [Authentication Guide](https://miniapps.farcaster.xyz/docs/guides/auth)
- [SDK Context](https://miniapps.farcaster.xyz/docs/sdk/context)
- [Manifest vs Embed](https://miniapps.farcaster.xyz/docs/guides/manifest-vs-embed)
- [Publishing Guide](https://miniapps.farcaster.xyz/docs/guides/publishing)
