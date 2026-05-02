---
topic: farcaster
type: guide
status: research-complete
tier: STANDARD
last-validated: 2026-05-02
related-docs: 173, 250, 308, 591a, 591c
---

# Farcaster Miniapp Production Audit: HTTP Headers + Cookie Attributes for iframe Security

**Sub-Agent B for Doc 591.** Covers the concrete HTTP headers + cookie attributes that decide whether a Farcaster miniapp actually renders and holds a session in an iframe context.

---

## Executive Summary: Production-Ready Recommendation

For a Farcaster miniapp in production, this header + cookie matrix **is required** to both render inside Farcaster clients AND maintain authentication across iframe boundaries:

| Component | Production Value | Reason |
|-----------|------------------|--------|
| **X-Frame-Options** | DO NOT SET (omit entirely) | Modern browsers prefer CSP; XFO would block miniapp embedding |
| **CSP frame-ancestors** | `'*'` or specific origins | Farcaster embeds from Warpcast web, Mac iframe origin, Base App webview, Coinbase Wallet webview; `*` is simplest for cross-client support |
| **Session Cookie SameSite** | `SameSite=None; Secure` | Required for cookies to survive cross-site iframe context (browser default is Lax, which drops them) |
| **Session Cookie HttpOnly** | `HttpOnly` (enabled) | Protects against XSS; does not block iframe cookie transmission |
| **Session Cookie Partitioned** | `Partitioned` (optional, Chrome 114+) | Limits cookie scope to top-level site if you want privacy-preserving third-party cookies; not required for basic miniapp auth but recommended long-term |
| **COOP/COEP** | COOP: `same-origin` (optional), COEP: omit unless using SharedArrayBuffer | Affects cross-origin isolation; irrelevant for typical miniapps |
| **Permissions-Policy** | Camera/mic as needed | Lock down unless miniapp uses them |

**ZAO OS Current State:** Correctly configured as of 2026-05-02. See [action bridge](#action-bridge-to-zao-os-code) below.

---

## Part 1: X-Frame-Options vs CSP frame-ancestors

### X-Frame-Options: The Legacy Header

`X-Frame-Options` is an HTTP response header that tells the browser whether a page may be rendered inside a frame, iframe, embed, or object tag.

**Semantics:**

- **DENY:** Document cannot be loaded in any frame, regardless of origin. Blocks both same-origin and cross-origin embedding.
- **SAMEORIGIN:** Document can only be embedded if the parent frame has the same origin (scheme + domain + port).
- **ALLOW-FROM origin:** (Obsolete, deprecated 2017, removed from spec 2019) Modern browsers ignore this directive entirely.

**For Farcaster miniapps, DENY is a fatal error.** It blocks the miniapp from rendering in Warpcast, the Base App, Coinbase Wallet, and any other Farcaster client iframe. SAMEORIGIN also fails because Farcaster clients embed your domain as a cross-origin iframe (e.g., Warpcast at warpcast.com embeds zaoos.com inside an iframe).

**Why omit it entirely?** If you set any X-Frame-Options value (including SAMEORIGIN), most modern browsers give it precedence over CSP frame-ancestors. The CSP approach is more flexible and browser-universal.

| Browser | X-Frame-Options Support | CSP frame-ancestors Support |
|---------|------------------------|-----------------------------|
| Chrome 114+ (May 2023 stable) | Yes, but CSP takes precedence | Yes, preferred |
| Firefox 90+ (June 2021) | Yes, but CSP takes precedence | Yes, preferred |
| Safari 14+ (Oct 2020) | Yes, but CSP takes precedence | Yes, preferred |
| Mobile Safari iOS 14+ | Yes, but CSP takes precedence | Yes, preferred |
| Chromium-based (Edge 114+) | Yes, but CSP takes precedence | Yes, preferred |

**Recommendation:** Omit X-Frame-Options entirely. Use CSP frame-ancestors instead.

---

## Part 2: CSP frame-ancestors Directive

### What It Does

`Content-Security-Policy: frame-ancestors` specifies which origins may embed the current page using iframe, frame, embed, or object tags. It is a **navigation directive** (applies at frame load time) and does NOT fall back to `default-src`.

### Syntax & Values

```
Content-Security-Policy: frame-ancestors 'none';                    /* Deny all embedding */
Content-Security-Policy: frame-ancestors 'self';                    /* Allow same-origin only */
Content-Security-Policy: frame-ancestors 'self' https://example.com; /* Allow self + explicit domain */
Content-Security-Policy: frame-ancestors *;                          /* Allow any origin (wildcard) */
```

**Directives:**

- **'none':** Page cannot be embedded in any frame. Equivalent to `X-Frame-Options: DENY`. Use only if your miniapp must not be embeddable.
- **'self':** Page can be embedded only by frames from the same origin (scheme, domain, port match exactly). Useful for internal tools but blocks cross-origin Farcaster embedding.
- **<source-expression-list>:** Specific origins (e.g., `https://warpcast.com`, `https://base.org`). Can mix with `'self'`.
- **\*:** Page can be embedded by any origin. Simplest for miniapps that must work across all Farcaster clients.

### Farcaster Embedding Contexts

Farcaster clients embed miniapps from multiple origins:

1. **Warpcast web:** `https://warpcast.com` (embeds as an iframe)
2. **Warpcast Mac client:** Native webkit webview; origin appears as the miniapp domain itself in some contexts, or an internal `warpcast://` scheme in others
3. **The Base App (TBA):** `https://base.app` or `https://base.org` (embeds as iframe)
4. **Coinbase Wallet:** `https://coinbase.com` or internal webview (embeds miniapp iframe)
5. **Third-party Farcaster clients:** (Herocast, Nook, etc.) May use their own domain as iframe parent

Enumerating every client is untenable. The easiest solution is **`frame-ancestors *`**, which trusts that Farcaster clients handle origin verification at their layer.

### Browser Support Matrix (CSP frame-ancestors)

| Browser/Version | Support | Notes |
|-----------------|---------|-------|
| Chrome 40+ (2014) | Yes | Full support |
| Firefox 31+ (2014) | Yes | Full support |
| Safari 9.1+ (2016) | Yes | Full support |
| IE 11 | No | CSP Level 1 only; falls back to X-Frame-Options |
| Edge 15+ (2017) | Yes | Full support |
| Mobile Safari iOS 9.3+ (2016) | Yes | Full support |
| Chrome Android 40+ | Yes | Full support |

**Implication:** For IE 11 and legacy browsers, X-Frame-Options acts as a fallback. Since ZAO OS targets modern browsers/mobile clients and Farcaster clients are always modern (web, iOS, Android), CSP frame-ancestors is safe.

### ZAO OS Implementation

```typescript
// src/middleware.ts, line 104
'frame-ancestors *',
```

This allows the miniapp to be embedded by any origin. Correct for production.

---

## Part 3: Cookies in Iframe Contexts

### The Core Problem: SameSite=Lax Doesn't Work in Iframes

By default (since 2020), browsers set `SameSite=Lax` on cookies that don't specify a SameSite attribute. **Lax cookies are dropped in cross-site iframe contexts.**

Example:
- User visits `warpcast.com`, which embeds an iframe: `<iframe src="https://zaoos.com/miniapp"></iframe>`
- Your server (zaoos.com) sets a session cookie: `Set-Cookie: zaoos_session=abc; HttpOnly` (no SameSite specified, defaults to Lax)
- The miniapp iframe makes an API call to your server: `fetch('/api/miniapp/auth-context')`
- **Browser behavior:** The browser sees this as a cross-site request (warpcast.com is the top-level site, zaoos.com is the frame). Lax cookies are NOT sent in iframe fetch/XMLHttpRequest calls unless they were set no more than ~2 minutes ago via top-level navigation.
- **Result:** Your server receives a request with no session cookie, sees no authenticated user, redirects to login.

### SameSite Semantics: Strict, Lax, None

| Value | Sent in iframe subresource requests? | Sent in top-level cross-site navigation? | Sent in same-site context? | Use Case |
|-------|--------------------------------------|----------------------------------------|---------------------------|----------|
| **Strict** | No | No | Yes | Strongest CSRF protection; breaks all cross-site usage |
| **Lax** (default) | No (unless <2 min old + via top-nav) | Yes | Yes | Moderate CSRF protection; standard for login cookies in non-embedded contexts |
| **None** | Yes | Yes | Yes | Third-party cookies, cross-site embeds; must use Secure=true |

**For Farcaster miniapps: SameSite=None is the only viable option.**

### The Secure Requirement

`SameSite=None` **requires** `Secure=true`. This means:
- Cookie is only sent over HTTPS.
- localhost HTTP development is blocked unless you explicitly override secure to false.

```typescript
// src/lib/auth/session.ts, lines 28-38
const isProd = process.env.NODE_ENV === 'production';
const sessionOptions = {
  password: ENV.SESSION_SECRET,
  cookieName: 'zaoos_session',
  cookieOptions: {
    secure: isProd,                                   // true in prod, false in dev
    httpOnly: true,
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax', // 'none' in prod, 'lax' in dev
    maxAge: 7 * 24 * 60 * 60,                         // 7 days
  },
};
```

**ZAO OS correctly handles this:** Production uses `SameSite=None; Secure=true`, development uses `SameSite=Lax; Secure=false` for localhost.

### Safari ITP and WKWebView Complications

**Safari Intelligent Tracking Prevention (ITP):** Safari 14+ partitions cookies for third-party frames by default, even if SameSite=None is set. This means a third-party cookie set in an iframe is scoped to the top-level domain and not accessible elsewhere. For miniapps, this is fine (you want iframe-scoped auth), but if you're trying to track users across sites, it won't work.

**iOS WKWebView (Farcaster mobile clients):** WKWebView isolates cookies by default. If a Farcaster mobile client embeds your miniapp in a WKWebView, cookies may be isolated per app instance. The miniapp must set cookies with `SameSite=None; Secure` to override this and allow the mobile client to manage cookies.

**Recommendation:** Always use `SameSite=None; Secure` for miniapp session cookies. Modern mobile Farcaster clients (iOS, Android) expect this.

---

## Part 4: The Partitioned Attribute (CHIPS)

### What CHIPS Does

**CHIPS** (Cookies Having Independent Partitioned State) is a new cookie attribute (`Partitioned`) that allows third-party cookies to be **partitioned by top-level site**. Instead of one shared cookie jar across all sites, a partitioned cookie is double-keyed: by the origin that sets it AND the top-level site where it's embedded.

Example:
- zaoos.com sets a cookie with `Partitioned` while embedded in warpcast.com.
- The cookie is stored with a partition key: `{("https://zaoos.com"), ("https://warpcast.com")}`.
- When zaoos.com is embedded in base.app, the same cookie is NOT accessible (different partition key).
- When zaoos.com is visited as a top-level site (not in an iframe), it gets its own partition.

### Syntax

```
Set-Cookie: __Host-example=34d8g; SameSite=None; Secure; Path=/; Partitioned;
```

**Requirements:**
- Must include `Secure=true`.
- Recommended to use `__Host-` prefix to bind the cookie to hostname (not registrable domain).
- `SameSite=None` is typical (allows cross-site access within the partition).

### Browser Support Timeline

| Browser | Version | Date | Status |
|---------|---------|------|--------|
| Chrome | 110 (via Finch) | Jan 2023 | Enabled via feature flag |
| Chrome | 114+ | May 2023 | Enabled by default |
| Firefox | Not yet (as of May 2026) | - | Under development; not shipped |
| Safari | Not yet | - | No public timeline |
| Edge | 114+ | May 2023 | Enabled by default (Chromium-based) |

### When to Use Partitioned

**Use if:**
- Your miniapp must maintain session state across multiple Farcaster clients (warpcast.com, base.app, etc.) but you want to limit cookie leakage to other third-party contexts.
- You want privacy-preserving third-party cookies that don't enable cross-site tracking.

**Skip if:**
- Your miniapp only cares about one embedding context (e.g., Warpcast only).
- SameSite=None session cookies already work (they do for ZAO OS).

**ZAO OS Status:** Not using Partitioned. Not required for basic miniapp auth. The current `SameSite=None; Secure; HttpOnly` setup is production-ready.

### iron-session and Partitioned

As of May 2026, the iron-session library (v8.0+) does not expose a `partitioned` option in its `CookieSerializeOptions`. To set Partitioned cookies with iron-session, you would need to manually construct the Set-Cookie header after calling `session.save()`:

```typescript
// Workaround: manually set Partitioned (not recommended unless necessary)
const originalSetHeader = response.setHeader.bind(response);
response.setHeader = function(name: string, value: string | string[]) {
  if (name === 'Set-Cookie' && typeof value === 'string' && value.includes('zaoos_session')) {
    value = value + '; Partitioned';
  }
  return originalSetHeader(name, value);
};
```

This is invasive and not recommended. **For ZAO OS, skip Partitioned for now.** Revisit when iron-session updates or when Firefox ships Partitioned support.

---

## Part 5: COOP and COEP Headers

### What They Do

**COOP (Cross-Origin-Opener-Policy):** Controls whether a window can be opened by, or can open, cross-origin windows. Used to prevent Spectre-like attacks where a malicious cross-origin window accesses memory of the opener.

**COEP (Cross-Origin-Embedder-Policy):** Controls whether a page can load cross-origin resources without explicit CORS headers. Used to enable cross-origin isolation so the page can use SharedArrayBuffer (required for true multithreading with Web Workers).

### For Miniapps

**Typical values:**
- `COOP: same-origin` - Prevent cross-origin window opening.
- `COEP: require-corp` - Require all cross-origin resources to explicitly opt in via CORS.

**ZAO OS usage:**
```typescript
// src/middleware.ts, lines 146-149
if (pathname.startsWith('/messages')) {
  response.headers.set('Cross-Origin-Embedder-Policy', 'credentialless');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
}
```

This is set only on `/messages` routes (for XMTP or messaging features that may use SharedArrayBuffer). Correct.

**Recommendation:** Unless your miniapp uses SharedArrayBuffer or needs cross-origin isolation, omit COOP/COEP. They add complexity without benefit for typical miniapps.

---

## Part 6: Permissions-Policy (Formerly Feature-Policy)

### What It Does

Controls which features (camera, microphone, geolocation, payment request, etc.) are allowed on the page and in embedded iframes.

### ZAO OS Usage

```typescript
// src/middleware.ts, line 120
"Permissions-Policy", 'camera=(self "https://www.songjam.space"), microphone=(self "https://www.songjam.space"), geolocation=()'
```

This allows:
- Camera access only for self (zaoos.com) and SongJam.space.
- Microphone access only for self and SongJam.space.
- Geolocation disabled (empty list).

### For Miniapps

If your miniapp doesn't use camera/mic, simplify to:
```
Permissions-Policy: geolocation=(), payment=(), usb=()
```

If it does use them, enumerate trusted sources. ZAO OS is correct.

---

## Part 7: Production-Ready Header Set (Copy-Paste Template)

### Recommended Middleware Implementation

```typescript
// src/middleware.ts
export function addSecurityHeaders(response: NextResponse, nonce?: string): NextResponse {
  // Frame embedding: use CSP frame-ancestors, NOT X-Frame-Options
  // Omit X-Frame-Options entirely (modern browsers honor CSP instead)
  
  // CSP with frame-ancestors
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "frame-ancestors *",  // Allow embedding by any Farcaster client
    // ... other directives
  ];
  response.headers.set('Content-Security-Policy', directives.join('; '));
  
  // Clickjacking protection (redundant with CSP but good defense-in-depth)
  // Only set if you want to completely block embedding; for miniapps, omit.
  // response.headers.set('X-Frame-Options', 'SAMEORIGIN'); // DO NOT USE
  
  // Other security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('Permissions-Policy', 'geolocation=()');
  
  return response;
}
```

### Recommended Session Cookie Configuration (iron-session)

```typescript
// src/lib/auth/session.ts
const isProd = process.env.NODE_ENV === 'production';

const sessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'zaoos_session',
  cookieOptions: {
    secure: isProd,      // HTTPS only in production; localhost HTTP in dev
    httpOnly: true,      // Protect against XSS; doesn't block iframe cookies
    sameSite: isProd ? 'none' as const : 'lax' as const, // REQUIRED: 'none' for iframe context
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  },
};
```

### Test with curl

```bash
# Test frame-ancestors CSP
curl -i https://zaoos.com/
# Look for: Content-Security-Policy: ... frame-ancestors *

# Verify no X-Frame-Options (should NOT appear)
curl -i https://zaoos.com/ | grep -i "X-Frame-Options"
# Expected: (no output, not set)

# Test session cookie on cross-site iframe fetch
# 1. Open DevTools Network tab
# 2. Visit a Farcaster client that embeds zaoos.com
# 3. Check the /api/miniapp/auth-context request headers
# 4. Verify cookie appears: Cookie: zaoos_session=...
# 5. Verify Set-Cookie response has: SameSite=None; Secure; HttpOnly

# Manual header inspection
curl -i https://zaoos.com/api/miniapp/auth-context \
  -H "Origin: https://warpcast.com"
# Look for: Set-Cookie: zaoos_session=...; SameSite=None; Secure; HttpOnly
```

---

## Action Bridge to ZAO OS Code

### Current State (Verified 2026-05-02)

1. **src/middleware.ts (lines 100-104):**
   - CSP `frame-ancestors *` is set. CORRECT.
   - X-Frame-Options is NOT set (omitted intentionally). CORRECT.
   - Comments explain the decision. GOOD.

2. **src/lib/auth/session.ts (lines 22-38):**
   - Production: `SameSite=None; Secure=true; HttpOnly=true`. CORRECT.
   - Development: `SameSite=Lax; Secure=false` (for localhost). CORRECT.
   - Max age 7 days. REASONABLE.
   - Comments explain the iframe context. GOOD.

### If You Need to Customize

**To add Partitioned cookies (when iron-session supports it or as a manual override):**
```typescript
// src/lib/auth/session.ts
cookieOptions: {
  secure: isProd,
  httpOnly: true,
  sameSite: isProd ? 'none' as const : 'lax' as const,
  partitioned: isProd, // Opt-in for production (requires iron-session v8.1+ or manual Set-Cookie)
  maxAge: 7 * 24 * 60 * 60,
  path: '/',
}
```

**To restrict frame-ancestors to specific origins:**
```typescript
// src/middleware.ts, line 104
// Instead of: 'frame-ancestors *',
// Use:
`frame-ancestors 'self' https://warpcast.com https://base.app https://coinbase.com`,
```
This is more restrictive but requires maintaining a list of all Farcaster clients.

**To verify CSP in production:**
```bash
# On deployed site
curl -s -H "Origin: https://warpcast.com" https://zaoos.com/home | \
  grep -i "Content-Security-Policy"
```

---

## Test Plan: One-Liners to Verify Each Header

### 1. Frame-Ancestors CSP

```bash
# Check CSP is set and contains frame-ancestors *
curl -s https://zaoos.com/ | \
  grep -oP 'Content-Security-Policy: \K[^<]*' | \
  grep -q 'frame-ancestors \*' && echo "PASS: frame-ancestors * is set" || echo "FAIL"
```

### 2. X-Frame-Options NOT Set

```bash
# Verify X-Frame-Options is NOT present (should return no output)
curl -s -i https://zaoos.com/ | \
  grep -i "^X-Frame-Options:" && echo "FAIL: X-Frame-Options should not be set" || echo "PASS: X-Frame-Options is omitted"
```

### 3. Session Cookie SameSite=None

```bash
# Make a request that sets a session cookie, verify SameSite=None; Secure
curl -s -i https://zaoos.com/api/miniapp/auth-context \
  -H "Origin: https://warpcast.com" | \
  grep -i "^Set-Cookie:" | \
  grep -q "SameSite=None.*Secure" && echo "PASS: SameSite=None; Secure" || echo "FAIL"
```

### 4. Session Cookie HttpOnly

```bash
# Verify HttpOnly is set (prevents JavaScript access)
curl -s -i https://zaoos.com/api/miniapp/auth-context | \
  grep -i "^Set-Cookie:" | \
  grep -q "HttpOnly" && echo "PASS: HttpOnly is set" || echo "FAIL"
```

### 5. COOP/COEP on /messages Only

```bash
# /messages should have COOP and COEP
curl -s -i https://zaoos.com/messages | \
  grep -q "Cross-Origin-Opener-Policy" && echo "PASS: COOP is set on /messages" || echo "FAIL"

# /home should NOT have COOP/COEP (unless needed)
curl -s -i https://zaoos.com/home | \
  grep -i "Cross-Origin-" | wc -l
# Expected: 0 (no COOP/COEP on non-/messages routes)
```

### 6. Permissions-Policy Geolocation Disabled

```bash
# Verify geolocation is disabled
curl -s -i https://zaoos.com/ | \
  grep -i "Permissions-Policy" | \
  grep -q "geolocation=()" && echo "PASS: geolocation disabled" || echo "FAIL"
```

### 7. Full Cookie Persistence Test (Integration)

```bash
# Simulate cross-site iframe context
# 1. Start from warpcast.com (top-level)
# 2. Fetch zaoos.com API endpoint (cross-site iframe context)
# 3. Verify session cookie is set
# 4. Make follow-up request and verify cookie is sent

curl -s -i -c /tmp/cookies.txt \
  -b /tmp/cookies.txt \
  -H "Origin: https://warpcast.com" \
  https://zaoos.com/api/miniapp/auth-context

# Check if cookie was set
grep -q "zaoos_session" /tmp/cookies.txt && echo "PASS: Session cookie persists" || echo "FAIL"

# Verify next request includes the cookie
curl -s -i -b /tmp/cookies.txt \
  -H "Origin: https://warpcast.com" \
  https://zaoos.com/api/miniapp/verify | \
  grep -q "zaoos_session" && echo "PASS: Cookie sent on follow-up request" || echo "FAIL"
```

---

## Summary: Decision Table for Your Miniapp

| Scenario | Recommendation | Why |
|----------|----------------|-----|
| Must render in Farcaster clients (Warpcast, Base, Coinbase Wallet) | Use `frame-ancestors *` in CSP, omit X-Frame-Options | Farcaster clients embed from multiple origins; CSP is modern standard |
| Need session auth across iframe boundary | Use `SameSite=None; Secure; HttpOnly` | Browser default (Lax) drops iframe cookies; None is required |
| Want privacy-preserving third-party cookies | Add `Partitioned` attribute (Chrome 114+) | Limits cookie scope to top-level site; good for future-proofing |
| Using camera/mic in miniapp | Set `Permissions-Policy` with specific origins | Lock down features to trusted domains |
| Need cross-origin isolation (SharedArrayBuffer) | Set `COOP: same-origin` and `COEP: require-corp` | Only if using Web Workers with shared memory; otherwise skip |
| Supporting old browsers (IE 11) | Add `X-Frame-Options: SAMEORIGIN` as fallback | Modern miniapps skip this; Farcaster clients are modern browsers |

---

## References

### HTTP Headers

- **MDN X-Frame-Options:** https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options
- **MDN CSP frame-ancestors:** https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/frame-ancestors
- **MDN Set-Cookie SameSite:** https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite

### CHIPS & Cookies

- **Chrome CHIPS announcement (May 2023):** https://developer.chrome.com/blog/new-in-chrome-114
- **Chrome CHIPS intent to ship:** https://groups.google.com/a/chromium.org/g/blink-dev/c/JNOQvsTxecI
- **MDN Partitioned Cookies:** https://developer.mozilla.org/en-US/docs/Web/Privacy/Partitioned_cookies
- **Privacy Sandbox CHIPS docs:** https://developer.chrome.com/docs/privacy-sandbox/chips/

### Farcaster Miniapp Auth

- **Farcaster Miniapp Auth Guide:** https://miniapps.farcaster.xyz/docs/guides/auth
- **Farcaster Quick Auth:** https://miniapps.farcaster.xyz/docs/sdk/quick-auth
- **Privy Farcaster Mini Apps Docs:** https://docs.privy.io/recipes/farcaster/mini-apps

### iron-session

- **iron-session GitHub:** https://github.com/vvo/iron-session
- **iron-session README (cookie config):** https://github.com/vvo/iron-session/blob/main/README.md

### Real-World Issues (Community)

- **StackOverflow: HTTPOnly cookies in iframes:** https://stackoverflow.com/questions/76739397/
- **StackOverflow: SameSite cookies across sites:** https://stackoverflow.com/questions/79025390
- **StackOverflow: Cookies in iframes not sent:** https://stackoverflow.com/questions/68788202
- **Farcaster Miniapps PR: acceptAuth flag:** https://github.com/farcasterxyz/miniapps/pull/287

---

**Document validated:** 2026-05-02 against ZAO OS production deployment.  
**Next review:** When iron-session adds Partitioned cookie support, or when Firefox ships CHIPS support.
