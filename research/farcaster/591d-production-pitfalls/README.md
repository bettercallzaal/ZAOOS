---
topic: farcaster
type: incident-postmortem
status: research-complete
last-validated: 2026-05-02
related-docs: 591, 591a, 591b, 591c, 591e
tier: STANDARD
---

# 591d - Farcaster Mini App Production Pitfalls

## TL;DR Pre-Flight Checklist

| Check | Command / Test | Pass Criteria |
|-------|----------------|---------------|
| Frame headers | `curl -i https://yourapp.com/miniapp \| grep X-Frame-Options` | Should NOT contain `DENY` or `SAMEORIGIN` if embedded |
| Manifest signature | `/api/manifest` returns signed JWT, Farcaster client validates | Client proceeds past splash |
| `ready()` fires | Open DevTools console, wait 2s | `[FARCASTER] Page loaded` appears |
| Cookie SameSite | Check network tab, Set-Cookie header | Must be `SameSite=None; Secure` for iframe |
| Splash dismissal | Load miniapp from Farcaster client | Splash gone, app visible within 2.5s |

---

## 1. Stuck Splash Screen

### SYMPTOM
User taps the miniapp frame card. Loading spinner appears, spins for 10+ seconds, then either blanks or shows "Page failed to load."

### ROOT CAUSE
- `X-Frame-Options: DENY` or `SAMEORIGIN` prevents iframe embedding. Farcaster client cannot display the content.
- `ready()` callback never fires because:
  - CSP blocks inline scripts or required JS resources (missing `script-src 'unsafe-inline'` or `sha-256` nonce).
  - Bundle at CDN returns 404 (stale cache, wrong environment, missing asset hash).
  - Promise in initialization chain hangs (async auth, slow database, unhandled rejection).
- Manifest signature mismatch. Farcaster client expects signed JWT; server returns unsigned JSON or wrong algorithm.
- www/apex redirect loop. User loads `app.com` → redirects to `www.app.com` → Farcaster client reload → redirect again.

### FIX
1. Set `X-Frame-Options: ALLOW-ALL` (or omit header entirely) in `src/middleware.ts`:
   ```typescript
   response.headers.set('X-Frame-Options', 'ALLOW-ALL')
   ```
2. Ensure CSP allows inline scripts (use nonce, not `unsafe-inline`):
   ```typescript
   response.headers.set('Content-Security-Policy', 
     `script-src 'nonce-${nonce}'; frame-ancestors *`)
   ```
3. Verify manifest endpoint returns valid JWT:
   ```bash
   curl https://yourapp.com/api/manifest | jq '.manifest' | base64 -d | jq
   ```
4. Bundle hash consistency: if using content hash in filename, regenerate on every deploy:
   ```bash
   npm run build && grep -r "bundle\." .next/static/chunks/
   ```
5. Disable www redirect during Farcaster frame load:
   ```typescript
   if (req.headers.get('user-agent')?.includes('FarcasterApp')) {
     return NextResponse.next()
   }
   ```
6. Add timeout + error boundary to `ready()` callback:
   ```typescript
   const timeoutId = setTimeout(() => {
     console.error('ready() timeout after 3s')
     window.location.reload()
   }, 3000)
   ```

---

## 2. Sign-In Loop / Redirect-to-Public-Landing

### SYMPTOM
User taps the miniapp. After a brief load, redirects back to the public landing page. Tapping again repeats the loop.

### ROOT CAUSE
- Third-party cookies blocked. Session cookie is set, but iframe cannot read it because Safari ITP or browser privacy mode rejects it.
- `SameSite=Lax` (default) requires top-level navigation or form submission to send cookie in iframe. Fetch requests do not include it.
- Session save is not awaited. Code redirects to dashboard before `await session.save()` completes.
- Redirect happens before HTTP Set-Cookie response is flushed. Browser never receives the cookie.
- Cookie domain mismatch: set on `.app.com` but iframe loaded from `miniapp.app.com` or `frame.app.com`.

### FIX
1. Set `SameSite=None; Secure` on session cookie in `src/lib/auth/session.ts`:
   ```typescript
   const iron = ironSession({
     cookieName: 'session',
     password: process.env.SESSION_SECRET!,
     cookieOptions: {
       secure: true,
       sameSite: 'none',  // Critical for iframe
       httpOnly: true,
       domain: '.app.com'  // Match subdomain
     }
   })
   ```
2. Always await session save before redirecting:
   ```typescript
   await session.save()
   return redirect('/dashboard')
   ```
3. Verify Set-Cookie is sent immediately:
   ```bash
   curl -i -X POST https://yourapp.com/api/auth/login -d '{}' | grep Set-Cookie
   ```
4. Add an explicit session-check endpoint:
   ```typescript
   // /api/auth/check
   const session = await getSession()
   return NextResponse.json({ authenticated: !!session.fid })
   ```
5. In miniapp entry point, poll `/api/auth/check` on mount:
   ```typescript
   const { authenticated } = await fetch('/api/auth/check').then(r => r.json())
   if (!authenticated) redirect('/')
   ```

---

## 3. "This Page Couldn't Load"

### SYMPTOM
Splash dismisses. Content area shows the browser's default error page: "This page couldn't load" or white screen with back button.

### ROOT CAUSE
- `cache-control: no-store` on HTML with streaming SSR. Response starts streaming, then Farcaster client's prefetch/cache tries to re-request while first request is in flight.
- SSR bailout template served after middleware rejection. Page renders but context is undefined.
- Broken bundle hash: `/next/static/chunks/main-abc123.js` requested but file is `main-def456.js`.
- CSP nonce mismatch: nonce in HTML `<script nonce="xyz">` does not match `Content-Security-Policy: script-src 'nonce-abc'`.
- Redirect during initial paint: `useEffect(() => redirect(...))` fires before hydration completes.

### FIX
1. Use `cache-control: public, max-age=3600` for initial load, `no-store` only for signed/personalized responses:
   ```typescript
   if (req.pathname.startsWith('/api/me')) {
     response.headers.set('Cache-Control', 'no-store')
   } else if (req.pathname === '/miniapp') {
     response.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=3600')
   }
   ```
2. Never serve SSR bailout to miniapp context. Return 400 + error JSON instead:
   ```typescript
   const context = getFrameContext()
   if (!context) return NextResponse.json({ error: 'No context' }, { status: 400 })
   ```
3. Force exact hash match in Next.js config:
   ```typescript
   // next.config.js
   const config = {
     output: 'standalone',
     experimental: {
       outputFileTracingExcludes: { '*': ['node_modules/@swc/core-*'] }
     }
   }
   ```
4. Generate nonce consistently per request:
   ```typescript
   const nonce = crypto.randomUUID().replace(/-/g, '')
   response.headers.set('Content-Security-Policy', `script-src 'nonce-${nonce}'`)
   // Pass nonce to RSC via context, inject in Root layout
   ```
5. Defer all redirects until after hydration:
   ```typescript
   useEffect(() => {
     if (!session) redirect('/')
   }, [session])
   ```

---

## 4. Cold-Start Race Conditions

### SYMPTOM
Miniapp loads. For 1-2 seconds, UI is blank or shows wrong state. Then it jumps to correct state.

### ROOT CAUSE
- Context (FID, username, pfp) arrives after authentication check. Auth code runs, finds no FID, redirects.
- `ready()` callback called before page hydration finishes. Next.js hasn't mounted the React tree yet.
- Dynamic imports race. `import('./chart')` is still fetching while page tries to render `<Chart />`.
- Context object is undefined during initial render, throws or falls back to empty state.

### FIX
1. Load context server-side, pass via RSC layout:
   ```typescript
   // app/layout.tsx (RSC, runs on server first)
   const context = getFrameContext() || {}
   return <Provider context={context}><Slot /></Provider>
   ```
2. Call `ready()` after hydration completes:
   ```typescript
   'use client'
   useEffect(() => {
     if (typeof window !== 'undefined' && window.sdkReady) {
       window.sdk.ready()
     }
   }, [])
   ```
3. Use `React.lazy` + Suspense with fallback:
   ```typescript
   const Chart = lazy(() => import('./chart'))
   return <Suspense fallback={<ChartSkeleton />}><Chart /></Suspense>
   ```
4. Add a context boundary that pauses rendering:
   ```typescript
   if (!context?.fid) return <AuthSplash />
   return <Dashboard context={context} />
   ```

---

## 5. Cache Invalidation Horrors

### SYMPTOM
Deploy new version. User loads miniapp. Old UI appears. Hard refresh (Cmd+Shift+R) fixes it.

### ROOT CAUSE
- Service worker serving stale `/miniapp` HTML from `Cache-Storage`. Never makes network request to check for updates.
- Farcaster client caches miniapp bundle at `https://frame.api.farcaster.xyz/cache/<app-id>`. Edge TTL is 1 hour.
- CDN (Cloudflare, Akamai) caches HTML with `cache-control: max-age=86400`. Purge does not propagate to all POPs.
- Vercel ISR (Incremental Static Regeneration) with long revalidate window. Next.js serves cached page even after new deploy.

### FIX
1. Service worker: stale-while-revalidate with short network timeout:
   ```typescript
   // public/sw.js
   self.addEventListener('fetch', (event) => {
     event.respondWith(
       fetch(event.request).catch(() => caches.match(event.request))
     )
   })
   // Unregister old SW on deploy via /api/health endpoint version check
   ```
2. Set manifest version header; Farcaster client re-fetches if changed:
   ```typescript
   response.headers.set('X-Manifest-Version', process.env.BUILD_ID!)
   ```
3. Use `no-cache` for HTML (always revalidate), `immutable` for hash-named assets:
   ```typescript
   if (pathname.endsWith('.js') || pathname.endsWith('.css')) {
     response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
   } else {
     response.headers.set('Cache-Control', 'no-cache, must-revalidate')
   }
   ```
4. Disable Vercel ISR for miniapp routes:
   ```typescript
   // app/miniapp/page.tsx
   export const dynamic = 'force-dynamic'
   ```
5. Purge Farcaster's edge cache on deploy:
   ```bash
   # Notify Farcaster to invalidate /cache/<app-id>
   curl -X POST https://frame.api.farcaster.xyz/invalidate \
     -H "Authorization: Bearer $FARCASTER_API_KEY" \
     -d '{"appId": "YOUR_APP_ID"}'
   ```

---

## 6. Auth Replay / Spoofing

### SYMPTOM
User A taps miniapp. Receives frame context (FID, username). User B inspects network tab, copies the context JWT. User B posts it to their own instance. System treats User B as User A.

### ROOT CAUSE
- Context FID is unsigned. Server accepts any `fid` query param without verification.
- JWT from manifest endpoint is not validated. Client could forge or replay an old token.
- No per-request nonce. Context token can be replayed across multiple sessions.
- Threat model: assume network is hostile. Farcaster client sends context in URL params or headers; attacker intercepts and replays.

### FIX
1. Validate context signature server-side (Farcaster SDK does this, but double-check):
   ```typescript
   import { FrameContext } from '@farcaster/frame-sdk'
   
   const context = FrameContext.parse(req.query)
   // SDK validates signature against app FID public key
   ```
2. Sign JWT with `APP_SIGNER_PRIVATE_KEY`. Client does not have this key:
   ```typescript
   const token = jwt.sign(
     { fid, username, iat: Date.now() },
     process.env.APP_SIGNER_PRIVATE_KEY!,
     { algorithm: 'ES256', expiresIn: '1h' }
   )
   ```
3. Bind token to session:
   ```typescript
   const session = await getSession()
   session.contextToken = token
   await session.save()
   ```
4. On API calls, verify token matches session:
   ```typescript
   const session = await getSession()
   const { fid } = jwt.verify(req.headers.authorization!.split(' ')[1], key)
   if (fid !== session.fid) throw new Error('Token mismatch')
   ```
5. Add request signing to prevent tampering:
   ```typescript
   // Client generates short-lived request ID
   const requestId = crypto.randomUUID()
   const signature = sign(requestId + timestamp + payload, APP_SIGNER_PRIVATE_KEY)
   // Server verifies signature on each request
   ```

---

## 7. Mobile-Specific Pitfalls

### SYMPTOM
Desktop works fine. On iOS or Android, miniapp loads but sign-in fails, cookies don't persist, or redirects go to blank page.

### ROOT CAUSE
- iOS WKWebView (Farcaster uses this) does NOT share cookies with other apps. Session cookie set by miniapp is not visible to client-side JS.
- iOS 14.5+ ITP (Intelligent Tracking Prevention) blocks third-party cookies after 7 days of non-interaction.
- Android Chrome custom tabs in Farcaster client do not persist cookies across navigations.
- Farcaster mobile client iframe quirks: location.href redirect in iframe may navigate parent instead of iframe.
- User-Agent detection: some platforms behave differently. Miniapp code checks `navigator.userAgent` and serves wrong bundle.

### FIX
1. Detect iOS and use localStorage + URL params instead of cookies:
   ```typescript
   const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
   if (isIOS) {
     localStorage.setItem('session', token)
     // Pass token as header on all fetches
   } else {
     // Use cookie
   }
   ```
2. Use `SameSite=None; Secure` for all cookies, even on iOS:
   ```typescript
   response.headers.set('Set-Cookie', 
     'session=xxx; SameSite=None; Secure; HttpOnly; Path=/')
   ```
3. Avoid `location.href` redirects inside iframe. Use postMessage:
   ```typescript
   window.parent.postMessage({ type: 'redirect', url: '/login' }, '*')
   ```
4. Test on actual devices, not just browser emulation:
   ```bash
   # Use iOS Simulator or BrowserStack
   npm run dev -- --host  # Listen on all interfaces
   ```
5. Normalize User-Agent check:
   ```typescript
   const ua = navigator.userAgent.toLowerCase()
   const isFarcasterMobile = ua.includes('warpcast') || ua.includes('farcaster')
   ```

---

## 8. Disable / Uninstall Flow

### SYMPTOM
User removes miniapp from their profile. Notifications still arrive. Stale cache persists.

### ROOT CAUSE
- Webhook notifications fire even after miniapp is disabled. Server has no record of disabled status.
- Cleanup handler not called. Database records (auth tokens, push subscriptions) are never deleted.
- Stale push tokens. APNS/FCM tokens point to old miniapp version; client app cannot handle the payload.
- Service worker cache never cleared. Browser keeps old SW registration.

### FIX
1. Add disable webhook:
   ```typescript
   // POST /api/webhooks/disable
   const { fid } = req.body
   await db.users.update(fid, { disabled: true })
   await db.pushTokens.delete({ fid })
   ```
2. Emit cleanup event:
   ```typescript
   // Client cleanup on uninstall
   window.addEventListener('beforeunload', async () => {
     await fetch('/api/cleanup', {
       method: 'POST',
       body: JSON.stringify({ fid, reason: 'uninstall' })
     })
   })
   ```
3. Validate push token before sending:
   ```typescript
   try {
     await sendPushNotification(token, payload)
   } catch (error) {
     if (error.code === 'InvalidToken') {
       await db.pushTokens.delete({ token })
     }
   }
   ```
4. Unregister service worker:
   ```typescript
   // On app boot, check for new version
   if (newVersionAvailable) {
     navigator.serviceWorker.getRegistrations().then((regs) => {
       regs.forEach(r => r.unregister())
     })
   }
   ```
5. Clear cache on disable:
   ```typescript
   // DELETE /api/user/session
   await session.destroy()
   await caches.delete('miniapp-v1')
   return NextResponse.json({ ok: true })
   ```

---

## Action Bridge: CI Checks to Add

| Check | Implementation | When to Run |
|-------|----------------|-------------|
| Frame headers validation | `curl -i $PREVIEW_URL/miniapp \| grep 'X-Frame-Options\|CSP'` | On every preview deploy |
| Manifest signature | `curl $PREVIEW_URL/api/manifest \| jq '.manifest' \| base64 -d \| jq` | On every prod deploy |
| Ready callback timeout | `npm run test:e2e -- --grep="ready.*timeout"` | On SDK update |
| Cookie SameSite check | `curl -i -X POST $PREVIEW_URL/api/auth \| grep 'SameSite=None'` | On every preview deploy |
| Bundle hash consistency | `npm run build && grep -E "main-[a-f0-9]{8}\\.js" .next/static/chunks/ \| wc -l \| tee /tmp/hash-count.txt` | On every build |
| Service worker stale check | Deploy, wait 5s, curl with old hash, verify 304 or 200 with new content | Weekly on staging |
| XSS injection test | `npm run test:security -- --grep="xss"` | On every PR |
| Mobile detection | `curl -H "User-Agent: iPhone" $PREVIEW_URL/miniapp \| grep -c wkwebview` | On every preview deploy |

---

## Sources

1. **Farcaster Frame SDK Issues** - github.com/farcasterxyz/frames/issues (search "stuck splash" or "X-Frame-Options")
   https://github.com/farcasterxyz/frames/issues

2. **Frame Fails to Load - Farcaster Developer Docs** - https://docs.farcaster.xyz/developers/frames/guides/debugging

3. **SameSite Cookie Behavior in iframes** - web.dev/articles/samesite-cookie-explained
   https://web.dev/articles/samesite-cookie-explained

4. **Next.js ISR and Dynamic Routes** - nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration
   https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration

5. **CSP Nonce Mismatch Debugging** - MDN CSP Content-Security-Policy
   https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy

6. **iOS WKWebView Cookie Isolation** - stackoverflow.com/questions/tagged/wkwebview+cookies
   https://stackoverflow.com/questions/66821248/wkwebview-cookie-persistence-issue
