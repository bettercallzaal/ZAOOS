# Farcaster Mini Apps & Frames Research

## Frames v1 (Deprecated)

Frames v1 launched Jan 2024 — Open Graph meta tags turned URLs into interactive cards in the Farcaster feed. Buttons sent POSTs to a Frame server which returned new images/buttons. Limited to image-based rendering, server round-trips, no persistent state. Deprecated in favor of Mini Apps (April 2025).

**Impact:** Drove 400% DAU increase (5K → 24.7K users), cast volume 200K → 2M daily.

---

## Mini Apps (Current — formerly Frames v2)

### Architecture
- Full web apps (HTML/CSS/JS) running in iframe (web) or WebView (mobile)
- Communicate with host via `postMessage` channel through `@farcaster/miniapp-sdk`
- Mobile: device-sized, Web: 424x695px fixed
- Host renders header with app name + author above the iframe

### `.well-known/farcaster.json` Manifest

**Required:**
| Field | Constraints |
|-------|-------------|
| `accountAssociation` | JFS: header, payload, signature (base64url) |
| `miniapp.version` | Must be `"1"` |
| `miniapp.name` | Max 32 chars |
| `miniapp.homeUrl` | Max 1024 chars |
| `miniapp.iconUrl` | 1024x1024px PNG, no transparency |

**Optional (for app store presence):**
| Field | Constraints |
|-------|-------------|
| `splashImageUrl` | 200x200px |
| `splashBackgroundColor` | Hex color |
| `webhookUrl` | Required for notifications |
| `subtitle` | Max 30 chars |
| `description` | Max 170 chars |
| `screenshotUrls` | Up to 3, 1284x2778px portrait |
| `primaryCategory` | One of 13 categories |
| `tags` | Up to 5, max 20 chars each |
| `heroImageUrl` | 1200x630px |
| `tagline` | Max 30 chars |

### SDK API Surface (`@farcaster/miniapp-sdk`)

**Detection:**
- `sdk.isInMiniApp()` — boolean

**Actions (`sdk.actions`):**
| Method | Description |
|--------|-------------|
| `ready()` | **Critical** — hides splash screen, MUST be called |
| `openUrl(url)` | Open external URL |
| `close()` | Close the mini app |
| `composeCast({text, channelKey})` | Open cast composer with prefilled text |
| `viewProfile({fid})` | Open user profile |
| `viewCast({hash})` | Open specific cast |
| `addMiniApp()` | Prompt user to add app (production only) |
| `signIn()` | Prompt SIWF |

**Context (`sdk.context`):**
```typescript
{
  user: { fid, username, displayName, pfpUrl, bio, location },
  client: {
    platformType: 'web' | 'mobile',
    clientFid: number,
    added: boolean,
    safeAreaInsets: { top, bottom, left, right },
    notificationDetails?: { url, token }
  },
  location?: { type: 'cast_embed' | 'notification' | 'launcher' | 'channel' | ... },
  features?: { haptics, cameraAndMicrophoneAccess }
}
```

**Warning:** `sdk.context` data is **untrusted** — always verify identity server-side via QuickAuth.

**Wallet (`sdk.wallet`):**
- `getEthereumProvider()` — EIP-1193 provider
- `getSolanaProvider()` — Solana provider
- Supports EIP-5792 batch transactions
- Use with `@farcaster/miniapp-wagmi-connector`

**QuickAuth (`sdk.quickAuth`):**
- `getToken()` — returns JWT `{ token: string }`
- `fetch(url, options?)` — auto-adds Bearer token

### Lifecycle Webhook Events
| Event | When | Payload |
|-------|------|---------|
| `miniapp_added` | User adds app | Optional `notificationDetails` |
| `miniapp_removed` | User removes app | — |
| `notifications_enabled` | User enables notifs | `notificationDetails` |
| `notifications_disabled` | User disables notifs | — |

### Notification System
- POST to `notificationDetails.url` with `{ notificationId, title (32), body (128), targetUrl, tokens[] }`
- Rate limits: 1 per 30s per token, 100 per day
- Dedup key: `(FID, notificationId)` for 24 hours

### Embed Meta Tags (for sharing in feed)
```html
<meta name="fc:miniapp" content='{"version":"1","imageUrl":"...","button":{"title":"Open","action":{"type":"launch_miniapp","url":"...","name":"ZAO OS"}}}' />
```
Image: 3:2 ratio, 600x400px min, PNG. Cached at cast time.

---

## Best Practices

- Call `ready()` ASAP — failure = infinite loading spinner
- `<link rel="preconnect" href="https://auth.farcaster.xyz" />` for QuickAuth speed
- Use `context.client.safeAreaInsets` + CSS `env(safe-area-inset-*)` for notch/home bar
- QuickAuth for auth (auto sign-in), SIWF for custom flows
- Test with Developer Mode + Farcaster preview tool or cloudflared tunnel
- `addMiniApp()` only works on production domain
- Check capabilities before using optional features: `sdk.getCapabilities()`

---

## Client Support
- **Warpcast** — full support, app store, prominent nav placement
- **Coinbase Wallet 2.0** — native Farcaster + mini app support
- SDK v0.2.1, active development (Solana, haptics, back nav, batch txns)

## Reference Projects
- `farcasterxyz/miniapps` — official monorepo (SDK + docs + examples)
- `npm create @farcaster/mini-app` — official scaffold
- `builders-garden/base-minikit-starter` — Next.js + Base template
- `FTCHD/awesome-farcaster-dev` — curated dev resources
- `miniapps.zone` — community directory

---

## ZAO OS Status & Opportunities

### Already Implemented
- `.well-known/farcaster.json` with account association, webhook, category, tags
- QuickAuth flow (auto-auth in mini app context)
- Webhook handler for all 4 lifecycle events
- Notification token storage + `sendNotification()` utility
- `useMiniApp` hook, `ready()` call
- Allowlist gating within mini app auth
- Safe area CSS + viewport-fit: cover

### Should Add
1. **`sdk.actions.composeCast()`** — replace `openUrl()` for in-app casting (keeps users in app)
2. **Embed meta tags** — shareable pages for viral growth in feed
3. **`sdk.wallet`** — on-chain interactions (token-gate, mint, future Respect on-chain)
4. **Manifest enhancements** — screenshots, hero image, tagline for app store
5. **Webhook verification** — verify JFS signatures with `@farcaster/miniapp-node`
6. **Location-aware behavior** — customize UX based on launch source
7. **Better notification IDs** — stable dedup keys like `msg-{channel}-{hash}`
8. **Hosted manifest** — Farcaster's managed hosting for easier updates

---

*Last updated: 2026-03-13*
