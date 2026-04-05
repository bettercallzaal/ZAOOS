# Security Audit — Pre-Build

> Security practices for ZAO OS MVP, documented before writing any application code.

## Critical (Must-Do Before Launch)

### 1. Environment Variable Safety
- Never prefix secrets with `NEXT_PUBLIC_` (leaks to browser)
- Secrets: `SUPABASE_SERVICE_ROLE_KEY`, `NEYNAR_API_KEY`, `SESSION_SECRET`, `APP_SIGNER_PRIVATE_KEY`
- Public: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SIWF_DOMAIN`, `APP_FID`
- Create `.env.example` with placeholder values
- Create `lib/env.ts` that validates all required secrets exist at startup

### 2. Session Security (iron-session)
```typescript
cookieOptions: {
  secure: process.env.NODE_ENV === 'production', // HTTPS only
  httpOnly: true,    // No JS access
  sameSite: 'strict', // CSRF protection
  maxAge: 7 * 24 * 60 * 60, // 7 days
}
```

### 3. Admin Route Protection
- Check admin status on BOTH page components AND API routes
- Hardcoded admin FIDs: `[19640]`
- Never trust client-side admin checks alone

### 4. Input Validation (Zod)
- Validate all user input: chat messages, CSV uploads, admin inputs
- Cast text: min 1, max 1024 chars
- CSV: max 1MB, validate file type, validate each row, max 1000 rows
- Cast hash: regex `/^0x[a-f0-9]{64}$/i`
- Channel ID: regex `/^[a-z0-9-]+$/`

### 5. SIWF Verification
- Verify signature + domain match + nonce (prevent replay)
- Generate nonces server-side, store in DB, expire after 5 minutes
- Mark nonces as used after verification

### 6. Neynar API Key Protection
- All Neynar calls go through server-side API routes (never from client)
- Client calls `/api/chat/messages`, server calls Neynar
- Never log API key in error messages

### 7. Supabase Security
- Use service_role ONLY for admin operations and session management
- Always include WHERE clauses (never `SELECT *` without filter)
- Enable RLS on all tables

### 8. XSS Prevention
- React auto-escapes JSX by default (good)
- Never use `dangerouslySetInnerHTML` without DOMPurify sanitization
- If rendering cast embeds/links, whitelist safe tags only

---

## Important (Add Before Launch)

### 9. Rate Limiting
- Chat send: 10 requests/minute per user
- Admin actions: 5 requests/minute
- Can use in-memory Map for MVP, upgrade to Upstash Redis later

### 10. Admin Audit Log
- Log all allowlist modifications (add/remove/upload)
- Log all message hides
- Store: action, admin FID, timestamp, details

### 11. Centralized Env Validation
```typescript
// lib/env.ts
const required = ['SUPABASE_SERVICE_ROLE_KEY', 'NEYNAR_API_KEY', 'SESSION_SECRET', 'APP_SIGNER_PRIVATE_KEY'];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing: ${key}`);
}
```

---

## Nice to Have (Post-Launch)

- Error monitoring (Sentry)
- Security headers (CSP, X-Frame-Options, X-Content-Type-Options)
- API key rotation schedule (monthly)
- Penetration testing
- DDoS protection (Cloudflare)

---

## Implementation Notes

These security practices should be baked into the code from the start, not bolted on after. Key files:
- `lib/env.ts` — env validation
- `lib/auth/session.ts` — session config with secure cookie options
- `lib/auth/admin.ts` — admin check helper
- `middleware.ts` — route protection
- All API routes — input validation with Zod
