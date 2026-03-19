# OWASP Top 10 Coverage — ZAO OS Audit

| ID | Category | Tested | Findings | Status |
|----|----------|--------|----------|--------|
| A01 | Broken Access Control | ✓ | 1 (Low) | ✅ Mostly clean — session-scoped queries, admin checks consistent |
| A02 | Cryptographic Failures | ✓ | 0 | ✅ Clean — iron-session encryption, no plaintext secrets, HMAC on webhooks |
| A03 | Injection | ✓ | 2 (Medium) | ⚠️ Two routes lack Zod validation (follow, song DELETE) |
| A04 | Insecure Design | ✓ | 3 (Medium, Low) | ⚠️ Rate limiting design, vote weight design, IP spoofing |
| A05 | Security Misconfiguration | ✓ | 2 (High, Low) | ⚠️ CSP unsafe-eval/inline, misleading webhook comment |
| A06 | Vulnerable Components | ✓ | 1 (baseline) | ⚠️ npm audit: 5 vulnerabilities (next CSRF, socket.io-parser, file-type) |
| A07 | Auth & Identification Failures | ✓ | 2 (Medium) | ⚠️ Mini app webhook unverified, nonce stores not shared |
| A08 | Software & Data Integrity Failures | ✓ | 0 | ✅ Clean — Neynar webhook HMAC verified, no deserialization |
| A09 | Security Logging & Monitoring | ✓ | 1 (Medium) | ⚠️ No structured audit logging |
| A10 | Server-Side Request Forgery | ✓ | 1 (High) | ⚠️ next/image allows any HTTPS hostname |

## Detailed Checks

### A01 — Broken Access Control
- [x] IDOR on parameterized routes — All user routes scope by session FID; `/api/users/[fid]` is read-only and requires auth
- [x] Missing authorization middleware — All protected routes check session
- [x] Horizontal privilege escalation — Notification, schedule, profile routes scoped by session FID
- [x] Vertical privilege escalation — Admin routes use `requireAdmin()` consistently
- [x] CORS misconfiguration — No custom CORS; Next.js defaults are safe
- [x] Function-level access control — Consistent pattern across all 56 routes

### A02 — Cryptographic Failures
- [x] No plaintext passwords — App uses signature-based auth (SIWF/SIWE)
- [x] No hardcoded secrets in source — All secrets via env vars
- [x] iron-session uses 32-byte encryption — Configured correctly
- [x] Nonces use crypto.randomBytes (SIWF) and crypto.randomUUID (SIWE) — Cryptographically secure

### A03 — Injection
- [x] No raw SQL — All DB via Supabase SDK (parameterized)
- [x] No shell execution — No exec/spawn calls in src/
- [x] No dangerouslySetInnerHTML — Grep confirms zero usage
- [x] Zod validation on most routes — Two exceptions found (findings #3, #8)
- [x] ilike search escapes metacharacters — Admin search strips `%_,()` characters

### A04 — Insecure Design
- [x] Rate limiting exists on all API routes — But in-memory only
- [x] Nonce replay protection — One-time use, but in-memory
- [x] No account lockout — Auth is wallet-signature-based, no passwords to brute force
- [x] No CSRF tokens needed — All state changes are POST with JSON body + cookie auth

### A05 — Security Misconfiguration
- [x] CSP configured — But with unsafe-eval and unsafe-inline
- [x] Security headers — X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy, Permissions-Policy all set
- [x] Debug mode — No debug endpoints found
- [x] Error messages — Generic errors returned to client

### A06 — Vulnerable Components
- [x] npm audit run — 5 vulnerabilities found (4 moderate, 1 high)
- [x] next@16.1.6 — Multiple moderate CVEs, fix available in 16.2.0
- [x] socket.io-parser — High severity (unbounded binary attachments)

### A07 — Auth & Identification Failures
- [x] Session management — iron-session with proper cookie flags
- [x] JWT verification — Mini app uses QuickAuth JWT verification
- [x] Signer ownership — Verified against Neynar before saving
- [x] Webhook verification — Neynar uses HMAC-SHA512; mini app webhook unverified

### A08 — Software & Data Integrity Failures
- [x] Webhook integrity — Neynar HMAC verified with timing-safe comparison
- [x] No deserialization of untrusted data
- [x] No unsigned code execution

### A09 — Security Logging & Monitoring
- [ ] Missing structured audit log for admin actions
- [ ] No alerting on suspicious activity
- [x] Error logging present (console.error)

### A10 — Server-Side Request Forgery
- [x] next/image remote patterns — Allows any HTTPS hostname (finding #2)
- [x] No unvalidated URLs in server-side fetch — External calls use hardcoded Neynar/Optimism URLs
- [x] Neynar webhook callback URLs — Validated by HMAC signature
