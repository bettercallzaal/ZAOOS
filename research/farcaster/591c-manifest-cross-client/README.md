---
topic: farcaster
type: guide
status: research-complete
last-validated: 2026-05-02
related-docs: 173, 250, 308, 591a, 591b
tier: STANDARD
---

# Farcaster Miniapp Manifest Production Audit: Cross-Client Compatibility & Domain Binding

**Document 591c** — Manifest correctness audit for production Farcaster miniapps. Covers schema compliance, domain binding pitfalls, cross-client context injection, and validation tooling.

---

## Executive Recommendations

| Issue | Severity | Action | Evidence |
|-------|----------|--------|----------|
| Domain mismatch (apex vs www) | CRITICAL | Domain in accountAssociation payload MUST match hosting FQDN exactly. Redirect chains break signature verification. | `payload: eyJkb21haW4iOiJ5b2luay5wYXJ0eSJ9` decodes to `{"domain":"yoink.party"}` - if hosted at www.yoink.party, clients reject it. |
| Cloudflare/Vercel apex redirects | CRITICAL | Disable auto-redirects. Choose apex OR www, sign manifest for ONE domain, keep consistent. | Vercel/Cloudflare 307 www-redirect + Base App's domain-check = 404 manifest. Use `canonicalDomain` for migration, not fallback. |
| Missing iconUrl validation | HIGH | Icon must be 1024x1024px PNG, no alpha channel. Test with `curl https://domain.com/icon.png \| identify` before deploying. | Missing/wrong-size icon = exclusion from Warpcast search, no app tile in Base App. |
| webhookUrl without signature verification | HIGH | If `webhookUrl` is set, implement signature verification on all webhook events. Use `@farcaster/miniapp-node`'s `parseWebhookEvent` + `verifyAppKeyWithNeynar`. | Unsigned webhooks = notifications from anyone, impersonation risk. |
| Manifest not accessible (404) | CRITICAL | `/.well-known/farcaster.json` must return 200 + valid JSON at both apex and www (if dual-hosting). Clients cache for minutes. | First check: `curl https://yourdomain.com/.well-known/farcaster.json`. If 301/302/404, miniapp fails silently in all clients. |
| Subdomain miniapps (miniapp.domain.com) | MEDIUM | Allowed. Use full subdomain in domain field (`miniapp.example.com`). Each subdomain = separate app/separate account association. | Warpcast/Base App treat subdomain as own app; cross-domain sharing of association breaks verification. |

---

## 1. Manifest Schema Specification (2026)

### 1.1 Root Shape

Every miniapp must publish a manifest at `https://YOUR_DOMAIN.COM/.well-known/farcaster.json`:

```json
{
  "accountAssociation": {
    "header": "base64-encoded JFS header",
    "payload": "base64-encoded payload (JSON: {\"domain\": \"your-domain.com\"})",
    "signature": "base64-encoded signature"
  },
  "miniapp": {
    "version": "1",
    "name": "App Name",
    "iconUrl": "https://your-domain.com/icon.png",
    "homeUrl": "https://your-domain.com",
    
    "splashImageUrl": "https://your-domain.com/splash.png",
    "splashBackgroundColor": "#0a1628",
    "webhookUrl": "https://your-domain.com/api/webhook",
    
    "subtitle": "Short tagline",
    "description": "Up to 170 chars, no emoji",
    "screenshotUrls": ["https://..."],
    "primaryCategory": "music",
    "tags": ["music", "creator", "nft"],
    
    "heroImageUrl": "https://your-domain.com/hero.png",
    "tagline": "Featured tagline (30 chars)",
    "ogTitle": "Social share title",
    "ogDescription": "Social share body (100 chars)",
    "ogImageUrl": "https://your-domain.com/og.png",
    
    "noindex": false,
    "requiredChains": ["eip155:8453", "eip155:1"],
    "requiredCapabilities": ["actions.signIn", "wallet.getEthereumProvider"],
    "canonicalDomain": "new-domain.com"
  }
}
```

### 1.2 accountAssociation (Domain Binding)

The `accountAssociation` object is a JSON Farcaster Signature (JFS) that proves your Farcaster account owns this domain.

**Three components:**

1. **header** (base64-encoded JSON):
   ```
   {"fid": 3621, "type": "custody", "key": "0x2cd85a09..."}
   ```
   - `fid`: Your Farcaster ID (the account that owns the app)
   - `type`: `"custody"` (most common) or `"auth"` (signer key)
   - `key`: Custody signer's Ethereum address (for custody type)

2. **payload** (base64-encoded JSON):
   ```
   {"domain": "yoink.party"}
   ```
   - **CRITICAL:** This `domain` value MUST exactly match the FQDN where the manifest is hosted
   - If manifest is at `https://yoink.party/.well-known/farcaster.json`, domain MUST be `"yoink.party"` (not `www.yoink.party`, not `yoink.party/app`)
   - If at `https://app.yoink.party/.well-known/farcaster.json`, domain MUST be `"app.yoink.party"`
   - No protocol, no path, no trailing slash

3. **signature** (base64-encoded hex string):
   - ECDSA signature of the payload, signed by the custody key in the header
   - Generated via Warpcast/Base Build manifest tool or programmatically with `@farcaster/miniapp-core`

**How it works:**
- Clients fetch `/.well-known/farcaster.json`
- They decode the header, payload, signature
- They verify: signature is valid + signed by fid's custody key
- They check: payload.domain matches hosting domain
- If all 3 pass, domain is verified as belonging to that FID
- If any fail, app is unsigned (red warning in search, no Developer Rewards, limited distribution)

### 1.3 miniapp Config (Discovery & Discovery)

Required fields:

| Field | Type | Max Length | Constraints |
|-------|------|-----------|-------------|
| `version` | string | 1 char | MUST be `"1"` |
| `name` | string | 32 | App display name |
| `iconUrl` | string | 1024 | 1024x1024px PNG, no alpha. Returned on 404 = app hidden in Warpcast. |
| `homeUrl` | string | 1024 | Default launch URL. Must use HTTPS. Must be same domain as manifest (or subdomain). |

Optional fields for discovery:

| Field | Type | Max Length | Constraints |
|-------|------|-----------|-------------|
| `subtitle` | string | 30 | Subtitle under app name in tiles |
| `description` | string | 170 | Promotional copy for app page (no emoji) |
| `splashImageUrl` | string | 1024 | 200x200px PNG. Shown on app launch. |
| `splashBackgroundColor` | string | 7 | Hex color code (`#0a1628`) |
| `screenshotUrls` | array | 3 items | Portrait 1284x2778px PNGs. Max 3. Shown in app store. |
| `primaryCategory` | string | - | One of: `music`, `social`, `finance`, `utility`, `productivity`, `health-fitness`, `news-media`, `gaming`, `shopping`, `education`, `developer-tools`, `entertainment`, `art-creativity` |
| `tags` | array | 5 items, 20 chars each | Lowercase, no spaces, no emoji (`["creator", "rewards"]`) |
| `heroImageUrl` | string | 1024 | 1200x630px PNG (1.91:1 ratio). Promotional hero for landing page. |
| `tagline` | string | 30 | Featured tagline (no emoji) |
| `ogTitle` | string | 60 | OpenGraph title for social share |
| `ogDescription` | string | 100 | OpenGraph description |
| `ogImageUrl` | string | 1024 | 1200x630px (1.91:1) for Twitter/Facebook preview |
| `webhookUrl` | string | 1024 | Endpoint for notification events. HTTPS required. Must be different from `homeUrl`. |
| `canonicalDomain` | string | 1024 | Domain to migrate to. Format: `new-domain.com` (no protocol, port, path) |
| `noindex` | boolean | - | `true` = exclude from Warpcast search (default false) |
| `requiredChains` | array | - | CAIP-2 IDs like `"eip155:8453"` (Base), `"eip155:1"` (Ethereum), `"eip155:137"` (Polygon). Only listed in Farcaster's chainList. |
| `requiredCapabilities` | array | - | SDK methods the app requires, like `"actions.signIn"`, `"wallet.getEthereumProvider"`, `"actions.swapToken"`. Must be in `miniAppHostCapabilityList`. |

**Deprecated fields (still supported for backward compat, skip for new apps):**
- `imageUrl` - use `heroImageUrl` instead
- `buttonTitle` - use `fc:frame` meta tag on cast-shareable pages instead
- `frame` - use `miniapp` key instead

---

## 2. Domain Binding Pitfalls

### 2.1 Apex vs www Mismatch

**Problem:**
Your manifest is at `https://example.com/.well-known/farcaster.json`, but you signed it with domain `"www.example.com"` in the payload. When clients try to verify:
1. They fetch the manifest from `example.com`
2. They decode payload: `{"domain": "www.example.com"}`
3. They compare: does `example.com` === `www.example.com`? NO
4. Signature verification fails. App marked as unsigned.

**Solution:**
Choose ONE domain. Sign for that one. Examples:

```json
// CORRECT: manifest at apex, signed for apex
{
  "accountAssociation": {
    "payload": "eyJkb21haW4iOiAiZXhhbXBsZS5jb20ifQ=="  // domain: example.com
  }
}
// Host at https://example.com/.well-known/farcaster.json

// CORRECT: manifest at www, signed for www
{
  "accountAssociation": {
    "payload": "eyJkb21haW4iOiAid3d3LmV4YW1wbGUuY29tIn0="  // domain: www.example.com
  }
}
// Host at https://www.example.com/.well-known/farcaster.json

// WRONG: mismatch
{
  "accountAssociation": {
    "payload": "eyJkb21haW4iOiAiZXhhbXBsZS5jb20ifQ=="  // claims example.com
  }
}
// But hosted at https://www.example.com/.well-known/farcaster.json
// Verification fails. App unsigned.
```

### 2.2 Cloudflare / Vercel Apex Redirects

**Problem:**
Cloudflare and Vercel often auto-redirect `example.com` to `www.example.com` (307 Temporary Redirect). If you sign for `example.com` but hosting redirects to `www.example.com`:

1. Client requests `https://example.com/.well-known/farcaster.json`
2. Redirect fires: 307 to `https://www.example.com/.well-known/farcaster.json`
3. Client follows redirect, gets manifest with `domain: "example.com"`
4. Client checks: does `www.example.com` === `example.com`? NO
5. Signature fails silently. App breaks.

**Solution:**
Disable the redirect in your hosting provider.

**Cloudflare:**
1. DNS settings: remove auto-redirect rules
2. Page Rules: disable "Always HTTPS" if it forces www
3. Bulk Redirects: check if a rule is redirecting apex to www
4. Or: explicitly set up two DNS records (A and CNAME) so both serve the same content without redirect

**Vercel:**
1. Domains dashboard: remove the www redirect rule for the apex domain
2. Or: in `next.config.js`, explicitly return `permanent: false` for test, then remove after validation
3. Best: use Cloudflare as DNS proxy instead of Vercel DNS

**Command to test:**
```bash
curl -I https://example.com/.well-known/farcaster.json
# If 3xx (redirect), domain binding will fail in production
```

### 2.3 Subdomain Miniapps (miniapp.domain.com)

**Allowed:** Yes. Use full subdomain in manifest.

```json
{
  "accountAssociation": {
    "payload": "eyJkb21haW4iOiAibWluaWFwcC5leGFtcGxlLmNvbSJ9"  // domain: miniapp.example.com
  },
  "miniapp": {
    "homeUrl": "https://miniapp.example.com"
  }
}
// Host at https://miniapp.example.com/.well-known/farcaster.json
```

**Important:**
- Each subdomain is treated as a separate app
- Each gets its own account association
- You can't share one account association across `app.example.com` and `miniapp.example.com`
- Discovery/search treats them as two different apps

---

## 3. Embedding Metadata in HTML

Beyond the manifest, pages that are shareable via cast need `<meta>` tags for rich embeds in the Farcaster feed.

### 3.1 fc:miniapp and fc:frame Tags

Add these to the `<head>` of every page that can be cast:

```html
<head>
  <!-- Farcaster Miniapp Launch -->
  <meta property="fc:frame" content="vNext" />
  <meta property="fc:frame:image" content="https://domain.com/share-image.png" />
  <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
  
  <!-- Launch into your miniapp -->
  <meta property="fc:frame:button:1" content="Launch App" />
  <meta property="fc:frame:button:1:action" content="launch_miniapp" />
  <meta property="fc:frame:button:1:target" content="https://domain.com/miniapp" />
  
  <!-- Optional: splash image and theme -->
  <meta property="fc:frame:button:1:splash_image_url" content="https://domain.com/splash.png" />
  <meta property="fc:frame:button:1:splash_background_color" content="#0a1628" />
</head>
```

**Why:**
- Without `fc:frame:button:1:action="launch_miniapp"`, the button opens a URL (frame action)
- With it, Farcaster clients open your app in a miniapp iframe instead
- `splashImageUrl` and `splashBackgroundColor` override the manifest defaults for this cast

### 3.2 OpenGraph Tags (Social Share)

For non-Farcaster platforms and Warpcast Web:

```html
<meta property="og:title" content="Your App Name" />
<meta property="og:description" content="What your app does" />
<meta property="og:image" content="https://domain.com/og.png" />
<meta property="og:url" content="https://domain.com" />
<meta property="og:type" content="website" />

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Your App Name" />
<meta name="twitter:description" content="What your app does" />
<meta name="twitter:image" content="https://domain.com/og.png" />
```

**Note:** Ensure og:image matches `ogImageUrl` in the manifest (1200x630px, 1.91:1 ratio).

---

## 4. Cross-Client Behavior Matrix

As of May 2026, miniapp context injection and SDK method support varies by client.

| Client | Platform | Context Fields Injected | isInMiniApp | SDK Ready | Notes |
|--------|----------|---------|---------|---------|-------|
| Warpcast | iOS | fid, userFid, url, notificationId | true | Yes | Primary miniapp platform. Best SDK support. |
| Warpcast | Android | fid, userFid, url, notificationId | true | Yes | Parity with iOS (as of Q2 2026). |
| Warpcast | Web | fid, userFid, url | true (in iframe) | Partial | Reduced capabilities (no wallet by default). |
| Farcaster Mac | macOS | fid, userFid, url | FALSE (bug) | Yes | isInMiniApp always false. Check `farcaster.client` header instead. |
| Base App | Mobile | N/A (after Apr 9) | N/A | No | Base App treats miniapps as standard web apps. Uses wagmi/SIWE instead of Farcaster SDK. |
| Coinbase Wallet | Mobile | wallet address (via injected provider) | N/A | No | Native support for wagmi/ethers only. |
| Recaster (third-party) | Web | Partial (fid, url only) | true | Partial | Community client. May not support full SDK. |
| Buoy (third-party) | Mobile | Partial | Varies | Partial | XMTP-first client. Limited miniapp support. |

**Key quirks:**

- **Farcaster Mac:** `isInMiniApp` returns false even when loaded in miniapp iframe. Workaround: check request header `x-app-id` or detect `window.frames.parent` changes.
- **Base App migration (Apr 9):** SDK methods like `signIn()`, `sendToken()`, `swapToken()` no longer work. Must migrate to wagmi/viem + SIWE.
- **Web vs Mobile:** Web clients (Warpcast Web, Recaster) may not inject all mobile-only fields (camera, mic access).
- **Notification context:** `notificationId` only set if user tapped a notification. Differentiate notification opens from direct app adds via `window.farcasterContext.notificationId !== undefined`.

**Best practice:**
```typescript
import { useFarcasterContext } from '@farcaster/miniapp-sdk'

const MyApp = () => {
  const context = useFarcasterContext()
  
  // Test which client we're in
  const isMac = typeof window !== 'undefined' && 
    navigator.userAgent.includes('Macintosh') && 
    !context.isInMiniApp  // isInMiniApp always false on Mac
  
  // Fallback for Web
  const isWeb = context.isInMiniApp && window.self === window.top  // iframe detected
  
  if (isMac) {
    // Use client headers instead of context
  }
  
  if (!context.isInMiniApp) {
    // User opened in browser, not client miniapp
  }
}
```

---

## 5. Webhook Setup (Notifications)

If your manifest includes `webhookUrl`, implement signature verification on all incoming events.

### 5.1 Manifest Setup

```json
{
  "miniapp": {
    "webhookUrl": "https://domain.com/api/farcaster/webhook",
    "version": "1",
    "name": "Your App"
  }
}
```

**Important:**
- `webhookUrl` MUST be different from `homeUrl` (different path or subdomain)
- HTTPS required
- Endpoint must respond 200 within 3 seconds (Farcaster timeout)

### 5.2 Webhook Events

Clients POST the following events to your `webhookUrl`:

**notifications_added:**
```json
{
  "type": "notifications_added",
  "fid": 3621,
  "signer": "0x...",
  "notificationDetails": {
    "token": "UNIQUE_PUSH_TOKEN",
    "url": "https://api.notifs.farcaster.xyz/send"
  }
}
```
- Sent when user enables notifications for your app
- Store `token` and `url` for later

**notifications_disabled:**
```json
{
  "type": "notifications_disabled",
  "fid": 3621,
  "signer": "0x..."
}
```
- Sent when user disables notifications
- Delete stored token/url for this fid

**notifications_removed:**
```json
{
  "type": "notifications_removed",
  "fid": 3621,
  "signer": "0x..."
}
```
- Sent when user removes your app entirely

### 5.3 Signature Verification

Every webhook event is signed with a JSON Farcaster Signature. **You must verify it.**

Use `@farcaster/miniapp-node`:

```typescript
import { parseWebhookEvent, verifyAppKeyWithNeynar } from '@farcaster/miniapp-node'

export async function POST(req: Request) {
  const body = await req.text()
  
  try {
    const event = await parseWebhookEvent(body, verifyAppKeyWithNeynar)
    
    if (event.type === 'notifications_added') {
      // Store event.notificationDetails.token for this event.fid
      db.storeNotificationToken(event.fid, event.notificationDetails.token)
    }
    
    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Webhook verification failed:', error)
    return new Response('Unauthorized', { status: 401 })
  }
}
```

**Requires:**
- `NEYNAR_API_KEY` env var set (Neynar's free tier covers this)
- Payload is base64-encoded JSON FarcasterSignature
- Signature is valid + signed by a key that's valid for the fid

### 5.4 Sending Notifications

Once you have the token and url:

```typescript
async function sendNotification(fid: number, token: string, url: string) {
  const payload = {
    notificationId: `unique-id-${Date.now()}`,  // Max 128 chars, used for idempotency
    title: 'Your App Title',
    body: 'Notification message (max 100 chars)',
    targetUrl: 'https://domain.com/app?ref=notif'
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      notification: payload
    })
  })
  
  if (!response.ok) {
    console.error('Notification send failed:', await response.text())
  }
}
```

---

## 6. Manifest Validation Tools

### 6.1 Neynar Embed Tool

https://neynar.com/embeds

1. Paste your miniapp URL
2. Tool fetches manifest
3. Shows:
   - Manifest accessibility (200 or error)
   - JSON validity
   - Required fields present
   - Icon accessibility + dimensions
   - Account association signature verification

**What it checks:**
- [x] Manifest exists at `/.well-known/farcaster.json`
- [x] JSON is valid
- [x] All required fields present (name, iconUrl, homeUrl, version)
- [x] accountAssociation signature is valid
- [x] Domain in payload matches hosting domain
- [x] Icon URL is accessible + correct size

**What it doesn't check:**
- [ ] Webhook URL accessibility or signature verification
- [ ] Image aspect ratios (except icon 1024x1024)
- [ ] App actually launches (homeUrl content check)

### 6.2 Farcaster Official Manifest Tool

https://farcaster.xyz/~/developers/mini-apps/manifest

1. Log in with Farcaster (Warpcast or Neynar SIWN)
2. Enter your domain
3. Tool fetches + validates manifest
4. Generate account association (you sign message with your wallet)

**What it does:**
- Fetches manifest from your domain
- Validates schema + required fields
- Tests signature with your FID
- Generates new `accountAssociation` if needed
- Shows green checkmark if all pass

**Use this to:**
- Sign a new manifest (register new app)
- Refresh an existing manifest (update without code change)
- Migrate to a new domain (`canonicalDomain` + re-sign)

### 6.3 Client Validators (Warpcast, Base App)

**Warpcast:**
- Open app in Warpcast iOS/Android
- Go Settings > Developer > (scroll down) > Domains
- Enter your domain
- App shows "Manifest valid" or specific error
- Generates `accountAssociation` for signing

**Base App (post Apr 9, 2026):**
- Visit https://base.dev/mini-apps/preview
- Enter app URL
- Shows:
  - Manifest accessibility
  - Account association validity
  - Manifest metadata loads
  - Image previews render

### 6.4 Local Validation Script

```bash
# Check manifest is accessible
curl -I https://yourdomain.com/.well-known/farcaster.json

# Fetch and validate JSON
curl https://yourdomain.com/.well-known/farcaster.json | jq .

# Check icon dimensions (requires imagemagick)
curl https://yourdomain.com/icon.png | identify
# Should output: icon.png PNG 1024x1024 ...

# Validate against schema (requires jq + @farcaster/miniapp-core)
curl https://yourdomain.com/.well-known/farcaster.json | jq -r '.miniapp.version'
# Should output: 1
```

---

## 7. Discovery & App-Tile Placement

### 7.1 How Miniapps Appear in Warpcast

**Prerequisites for search visibility:**
1. Manifest is valid and accessible (200 response)
2. Account association is valid (signature verified)
3. `noindex: false` (default)
4. App has recent usage (opens + adds in last 30 days)
5. Icon is accessible + 1024x1024px
6. All required fields filled (`name`, `description`, `primaryCategory`, `tags`)

**Search ranking factors:**
- Usage (opens, adds, transactions)
- Engagement (repeat users)
- Trending (velocity of adds in last 7 days)
- Verified status (signed account association)
- Metadata completeness

**What breaks search visibility:**
- `noindex: true` - explicitly excluded
- Icon 404 or wrong dimensions
- Missing `description`, `primaryCategory`, or `tags`
- Manifest hosted on dev tunnel (ngrok, replit.dev, etc.)
- Very low usage (< 10 adds/week)

### 7.2 "Verified" Checkmark

Apps with valid account associations show a checkmark in:
- Search results
- App store listings
- Creator info pages

This indicates the app is cryptographically verified to belong to the signing FID. No account hijack = legitimate creator.

### 7.3 Base App Compatibility (Post Apr 9, 2026)

After April 9, 2026, **Base App treats all apps as standard web apps**, not Farcaster miniapps.

- Manifest still required (baseBuilder ownerAddress)
- But SDK methods don't work (no Farcaster context injection)
- Must use wagmi/viem + SIWE instead
- See cross-client matrix for migration path

---

## 8. Real-World Example: Yoink! Party

Reference manifest from production app (Warpcast-sponsored):

```json
{
  "accountAssociation": {
    "header": "eyJmaWQiOjkxNTIsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHgwMmVmNzkwRGQ3OTkzQTM1ZkQ4NDdDMDUzRURkQUU5NDBEMDU1NTk2In0",
    "payload": "eyJkb21haW4iOiJ5b2luay5wYXJ0eSJ9",
    "signature": "MHgxMGQwZGU4ZGYwZDUwZTdmMGIxN2YxMTU2NDI1MjRmZTY0MTUyZGU4ZGU1MWU0MThiYjU4ZjVmZmQxYjRjNDBiNGVlZTRhNDcwNmVmNjhlMzQ0ZGQ5MDBkYmQyMmNlMmVlZGY5ZGQ0N2JlNWRmNzMwYzUxNjE4OWVjZDJjY2Y0MDFj"
  },
  "miniapp": {
    "version": "1",
    "name": "Yoink!",
    "iconUrl": "https://yoink.party/logo.png",
    "homeUrl": "https://yoink.party/framesV2/",
    "splashImageUrl": "https://yoink.party/logo.png",
    "splashBackgroundColor": "#f5f0ec",
    "webhookUrl": "https://yoink.party/api/webhook",
    
    "subtitle": "Steal frames. Earn rewards.",
    "description": "Yoink! is a permissionless frame-stealing game where you steal frames from other players and earn rewards.",
    "primaryCategory": "gaming",
    "tags": ["gaming", "frames", "rewards"],
    
    "heroImageUrl": "https://yoink.party/og.png",
    "tagline": "Steal frames, earn rewards",
    "ogTitle": "Yoink! - Frame Stealing Game",
    "ogDescription": "Compete with other players to steal frames and climb the leaderboard.",
    "ogImageUrl": "https://yoink.party/og.png",
    
    "requiredChains": ["eip155:8453"],
    "requiredCapabilities": ["actions.signIn"]
  }
}
```

**Key observations:**
- Domain is `yoink.party` (apex, no www)
- Payload domain matches: `{"domain":"yoink.party"}`
- All 4 image URLs are accessible (icon, splash, hero, og)
- Icon URL (`logo.png`) must be 1024x1024px PNG
- `splashImageUrl` must be 200x200px (not shown in URL, trust filename convention)
- `requiredChains` specifies Base (8453) only
- `webhookUrl` is different path from `homeUrl`
- No `canonicalDomain` (not migrating)

---

## 9. Implementation Checklist

**Before deploying to production:**

- [ ] Manifest is at `/.well-known/farcaster.json` (accessible via curl, returns 200)
- [ ] Manifest is valid JSON (no syntax errors)
- [ ] Domain in accountAssociation payload matches hosting FQDN exactly
- [ ] Icon URL returns 200 and is 1024x1024px PNG with no alpha channel
- [ ] splashImageUrl is 200x200px (if included)
- [ ] heroImageUrl is 1200x630px (if included)
- [ ] ogImageUrl is 1200x630px (if included)
- [ ] All URLs (homeUrl, iconUrl, splashImageUrl, etc.) use HTTPS
- [ ] homeUrl is on same domain as manifest (or subdomain)
- [ ] Apex domain does NOT redirect to www (or vice versa) - choose one
- [ ] No Cloudflare/Vercel auto-redirects enabled
- [ ] App title is 32 characters or less
- [ ] Subtitle is 30 characters or less (no emoji)
- [ ] Description is 170 characters or less (no emoji)
- [ ] Tags are lowercase, no spaces, 20 chars max each
- [ ] primaryCategory matches allowed list
- [ ] If `webhookUrl` is set: endpoint exists and verifies signatures
- [ ] Test in Warpcast iOS/Android Settings > Developer > Domains
- [ ] Test in Neynar Embed Tool (shows green checkmarks)
- [ ] Test in Farcaster Manifest Tool (accountAssociation valid)
- [ ] Test in Base App Preview (if targeting Base App)
- [ ] No `noindex: true` unless intentionally unlisted
- [ ] If migrating: `canonicalDomain` set correctly on old domain

---

## 10. Bridge to ZAOOS Implementation

**Manifest file location:**
```
/public/.well-known/farcaster.json
```

**Layout metadata file:**
```
/src/app/miniapp/layout.tsx
```

**What's in layout.tsx:**
```typescript
export const metadata = {
  title: 'ZAO Miniapp',
  openGraph: {
    title: 'ZAO Miniapp',
    description: 'ZAO ecosystem app',
    images: [{ url: '/og.png', width: 1200, height: 630 }],
    url: 'https://zaoos.com'
  },
  other: {
    'fc:frame': 'vNext',
    'fc:frame:image': 'https://zaoos.com/og.png',
    'fc:frame:button:1': 'Launch ZAO',
    'fc:frame:button:1:action': 'launch_miniapp',
    'fc:frame:button:1:target': 'https://zaoos.com/miniapp',
  }
}
```

**Domain binding rules:**
1. Choose: `zaoos.com` or `www.zaoos.com` (not both with redirect)
2. Sign for chosen domain ONLY
3. Disable Vercel apex-to-www redirect in next.config.js
4. Use Neynar Embed Tool to validate before deploy
5. Test in Warpcast Settings > Developer > Domains

---

## References

- [Farcaster Miniapps Specification](https://miniapps.farcaster.xyz/docs/specification)
- [Neynar Miniapps Guide](https://docs.neynar.com/miniapps)
- [Base App Migration Guide (Post Apr 9)](https://docs.base.org/mini-apps/technical-guides/sign-manifest)
- [@farcaster/miniapp-node Webhook Verification](https://www.npmjs.com/package/@farcaster/miniapp-node)
- [Dynamic Labs Example Repo](https://github.com/dynamic-labs/mini-app-farcaster)
- [0xEdmundo Base Integration Guide](https://github.com/0xEdmundo/farecho-base-miniapp-guide)

---

**Last Validated:** May 2, 2026  
**Related Research:** 591a (Miniapp SDK patterns), 591b (Frame embed metadata spec)
