---
topic: farcaster
type: guide
status: research-complete
last-validated: 2026-05-21
related-docs: [002-farcaster-hub-api, 017-neynar-onboarding]
original-query: "How do we distribute ZAO OS as a Farcaster Mini App so users can access it directly from Warpcast without a separate login? (reconstructed)"
tier: STANDARD
---

# 173 - Farcaster Mini Apps Integration

> **Goal:** Package ZAO OS as a Mini App (distributed web app inside Farcaster clients) with Quick Auth for instant login and cast composition from within the app.

## Key Decisions (DO THIS)

| # | Decision | Why |
|---|----------|-----|
| 1 | Implement **Quick Auth** (JWT-based auto-login) as primary auth path for Mini App | Eliminates manual login; user is already authenticated in Farcaster. JWT validates server-side. |
| 2 | Serve manifest at `/.well-known/farcaster.json` with domain signature | Farcaster clients query this to discover + trust the app. One-time setup via domain signer. |
| 3 | Use `sdk.actions.composeCast()` for sharing from chat/governance, NOT native compose | Pre-fills cast text + embeds, user approves in Warpcast, ZAO OS stays open. No app suspension. |
| 4 | Mini App is **optional distribution**, not required for MVP | Wallet-only auth + Farcaster web client remain supported. Mini App is nice-to-have for Warpcast users. |
| 5 | Require Node.js 22.11.0+ for SDK (official minimum) | SDK uses ESM + modern WASM; older versions fail silently. |

## Findings

### Mini App Architecture (2026 Current)

Mini Apps are web applications (HTML/CSS/JS) rendered in a modal webview inside Farcaster clients (Warpcast web, Warpcast iOS, Warpcast Android). They receive:

- **Auto-authentication:** Quick Auth JWT with user's FID
- **User context:** FID, username, display name, PFP URL, bio
- **Wallet access:** EIP-1193 Ethereum provider for onchain transactions
- **Cast composition:** Open Warpcast composer with pre-filled text/embeds
- **Push notifications:** Webhook + storage of per-user tokens
- **Context awareness:** Know if opened from cast embed, notification, channel, or launcher

### 1. Manifest File (`/.well-known/farcaster.json`)

This is the **required first step**. Farcaster clients query this file to authenticate and register the app:

```json
{
  "accountAssociation": {
    "header": "<base64-encoded header>",
    "payload": "<base64-encoded payload>",
    "signature": "<base64-encoded signature>"
  },
  "frame": {
    "version": "1",
    "name": "THE ZAO",
    "homeUrl": "https://zaoos.xyz",
    "iconUrl": "https://zaoos.xyz/icon-1024.png",
    "splashImageUrl": "https://zaoos.xyz/splash-200.png",
    "splashBackgroundColor": "#0a1628",
    "webhookUrl": "https://zaoos.xyz/api/miniapp/webhook",
    "subtitle": "Impact Network on Farcaster",
    "description": "Gated community for music & web3",
    "primaryCategory": "social",
    "tags": ["music", "community", "web3", "farcaster"]
  }
}
```

**In Next.js:** Serve via `app/.well-known/farcaster.json/route.ts` (not `public/`; must be dynamic for signature rotation if needed).

**Domain signature:** Signed by the app's domain owner (zaoos.xyz). Use Farcaster's `@farcaster/core` to generate. Does NOT use the app signer wallet; this is a domain-level assertion.

### 2. SDK Initialization

**Installation:**
```bash
npm install @farcaster/miniapp-sdk @farcaster/quick-auth
```

**Client-side (in root layout or provider):**
```typescript
import { sdk } from '@farcaster/miniapp-sdk';

export default function RootLayout({ children }) {
  useEffect(() => {
    (async () => {
      // MUST call this after hydration to dismiss splash screen
      await sdk.actions.ready();
      
      // Access user context
      const { user, client, location } = sdk.context;
      console.log(`FID: ${user.fid}, Username: ${user.username}`);
    })();
  }, []);

  return <>{children}</>;
}
```

**Performance:** Add preconnect link to auth server:
```html
<link rel="preconnect" href="https://auth.farcaster.xyz" />
```

### 3. Quick Auth (Auto-Login)

**Option A: Auto-authenticated fetch (recommended)**
```typescript
import { sdk } from '@farcaster/miniapp-sdk';

useEffect(() => {
  (async () => {
    // Token is cached in memory, auto-refreshed if expired
    const res = await sdk.quickAuth.fetch('/api/user/me');
    if (res.ok) {
      const user = await res.json();
      setUser(user);  // now logged in
    }
  })();
}, []);
```

**Option B: Get JWT token directly**
```typescript
const { token } = await sdk.quickAuth.getToken();
// Use Bearer token in Authorization header for all requests
const res = await fetch('/api/user/me', {
  headers: { Authorization: `Bearer ${token}` },
});
```

**Server-side verification (Node.js):**
```typescript
import { createClient } from '@farcaster/quick-auth';

const qac = createClient();
const payload = await qac.verifyJwt({
  token: bearerToken,
  domain: 'zaoos.xyz',
});

// payload.sub = user's FID
const fid = payload.sub;
```

**Integration with existing session:** After JWT verification, call existing `saveSession(fid)` to create iron-session cookie. All downstream auth checks work unchanged.

### 4. Cast Composition

Use `sdk.actions.composeCast()` to open Warpcast's cast composer with suggested text:

```typescript
const result = await sdk.actions.composeCast({
  text: 'Joined ZAO! Music + community + web3',
  embeds: ['https://zaoos.xyz'],
  channelKey: 'zao',  // optional, posts to /zao channel
  close: false,  // keep app open after user posts
});

if (result?.cast) {
  console.log(`Cast published: ${result.cast.hash}`);
  console.log(`Posted to channel: ${result.cast.channelKey}`);
}
```

**User flow:** Composer opens with pre-filled text. User can edit, add images, or cancel. If posted, `composeCast` returns the cast hash. If cancelled, returns `null`.

### 5. Push Notifications (Optional Phase 2)

**Webhook endpoint:** Create `app/api/miniapp/webhook/route.ts` to receive:
```
POST /api/miniapp/webhook
Body: {
  type: "miniapp_added" | "miniapp_removed",
  fid: 12345,
  notificationDetails: {
    token: "notification-token-xyz",
    url: "https://zaoos.xyz/notifications"
  }
}
```

**Send notifications:**
```typescript
// POST to Farcaster notification service with webhook token
// Limit: 1 per 30 seconds per user, 100 per day per user
const notificationRes = await fetch('https://api.farcaster.xyz/v1/notification', {
  method: 'POST',
  headers: { Authorization: `Bearer ${webhookToken}` },
  body: JSON.stringify({
    fid,
    title: 'New message in ZAO',
    body: '@zaal replied to you',
    targetUrl: 'https://zaoos.xyz/chat/123',
  }),
});
```

### 6. Context-Aware Routing

Mini Apps can detect where they were opened from:

```typescript
const { location } = sdk.context;

if (location.type === 'cast_embed') {
  // Opened from embedded cast, route to relevant content
  navigate(`/cast/${location.cast.hash}`);
} else if (location.type === 'notification') {
  // Opened from notification
  navigate(location.notification.targetUrl);
} else if (location.type === 'channel') {
  // Opened from channel, join that channel
  navigate(`/channel/${location.channel.key}`);
} else {
  // Opened from launcher or home
  navigate('/chat');
}
```

### 7. Wallet Access (Optional)

For onchain Respect token interactions:

```typescript
const provider = await sdk.wallet.getEthereumProvider();
if (!provider) {
  console.log('User has not connected wallet');
  return;
}

// provider is EIP-1193 compatible
const accounts = await provider.request({ method: 'eth_accounts' });
const chainId = await provider.request({ method: 'eth_chainId' });

// Use with ethers.js or viem
import { BrowserProvider } from 'ethers';
const ethersProvider = new BrowserProvider(provider);
```

### SDK Context Object Reference

```typescript
interface MiniAppContext {
  user: {
    fid: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
    bio?: string;
  };
  client: {
    platformType: 'web' | 'mobile';
    clientFid: number;  // Warpcast's FID
    added: boolean;  // user has favorited the app
  };
  location:
    | { type: 'cast_embed'; cast: CastContext }
    | { type: 'notification' }
    | { type: 'launcher' }
    | { type: 'channel'; channel: { key: string } }
    | { type: 'open_miniapp' };
}
```

## ZAO Application Plan

### Phase 1: Quick Auth + Manifest (2 weeks, Low effort)

1. Create `app/.well-known/farcaster.json/route.ts` with domain-signed manifest
2. Add SDK initialization to root layout
3. Implement Quick Auth JWT verification in `POST /api/miniapp/auth`
4. Test in Warpcast with allowlist users (dev mode)

### Phase 2: Cast Composition & Context Routing (1 week, Low effort)

1. Add `sdk.actions.composeCast()` to chat message sharing
2. Detect `location.type` and route accordingly
3. Add `channelKey: 'zao'` to cast defaults

### Phase 3: Push Notifications (2 weeks, Medium effort)

1. Create webhook endpoint to store notification tokens
2. Implement notification payload builder
3. Send notifications for: new DMs, governance votes, member joins

### Phase 4: Wallet Integration (1 week, Medium effort)

1. Integrate EIP-1193 provider with Respect token interactions
2. Test token sends/swaps within Mini App
3. No external wallet switch needed

### Compatibility Notes

- **Session cookies:** Mini App webview shares same origin (zaoos.xyz), so iron-session httpOnly cookies work fine.
- **Fallback auth:** Users without Warpcast or with Mini Apps disabled can still use wallet-only auth.
- **XMTP:** Encrypted messaging should work inside Mini App (localStorage is available). May require WASM module testing.
- **Viewport:** 424x695px on web, full device height on mobile. ZAO OS is mobile-first, so layout adapts well.
- **User context untrusted:** Always verify FID server-side via Quick Auth JWT. Never trust `sdk.context.user` for auth decisions.

## Sources

- [Farcaster Mini Apps: Quick Auth](https://miniapps.farcaster.xyz/docs/sdk/quick-auth) [FULL] - Complete JWT verification example, token caching, preconnect optimization
- [Farcaster Mini Apps: composeCast](https://miniapps.farcaster.xyz/docs/sdk/actions/compose-cast) [FULL] - Parameters, return values, channel posting, embed support
- [Farcaster Mini Apps: Getting Started](https://miniapps.farcaster.xyz/docs/getting-started) [FULL] - SDK installation, manifest requirement, Node.js 22.11.0+ minimum, developer mode setup
- [Farcaster Mini Apps: Context](https://miniapps.farcaster.xyz/docs/sdk/context) [PARTIAL - context object shape, not all location types detailed]
- [OnChainSite Blog: Mini Apps Guide](https://www.onchainsite.xyz/blog/what-are-farcaster-miniapps) [PARTIAL - high-level overview]

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Create manifest route + domain signature | Dev | Code | 2026-05-27 |
| Implement Quick Auth JWT verification | Dev | Code | 2026-05-30 |
| Test Mini App in Warpcast (dev mode, 5 users) | QA | Testing | 2026-06-03 |
| Add composeCast to /chat message sharing | Dev | Code | 2026-06-05 |
| Production push: submit to Mini Apps directory | Product | Launch | 2026-06-30 |
