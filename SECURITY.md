# Security Policy

## Reporting Vulnerabilities

If you discover a security vulnerability in ZAO OS, please report it responsibly:

1. **Do NOT** open a public GitHub issue for security vulnerabilities
2. Email security concerns to the project maintainer
3. Include a description of the vulnerability, steps to reproduce, and potential impact
4. Allow reasonable time for a fix before any public disclosure

---

## Security Principles

### We Never Touch Personal Wallet Keys

ZAO OS **never asks for, stores, or accesses any user's personal wallet private keys.** This is a core principle.

- **Farcaster Auth:** Uses Sign In With Farcaster (SIWF) — signature-based authentication. The user signs a message in their wallet app; we verify the signature. We never see the private key.
- **App Signer:** The `APP_SIGNER_PRIVATE_KEY` is an auto-generated wallet created at project setup (via `scripts/generate-wallet.ts`). It is used only to register Neynar managed signers for the app's Farcaster account. It is not any user's personal key.
- **XMTP Messaging:** ZAO OS generates a dedicated, app-specific burner key for each user's XMTP messaging. This key is stored in the user's browser localStorage and is used only for XMTP message signing — never for on-chain transactions. The derived address holds no funds.

### Authentication & Sessions

- Sessions use `iron-session` with encrypted, httpOnly, secure cookies
- Cookie settings: `httpOnly: true`, `sameSite: 'lax'`, `secure: true` (production)
- Session TTL: 7 days
- Admin access is restricted to hardcoded FIDs

### API Security

- All API routes check authentication via session before processing
- Intentionally public routes (webhooks, registration, metadata) are documented
- All user input is validated with Zod schemas before use
- Neynar webhooks are verified via HMAC-SHA512 signatures
- Rate limiting is applied to prevent abuse

### Environment Variables

| Variable | Exposure | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public (browser) | Supabase project URL (safe to expose) |
| `NEXT_PUBLIC_SIWF_DOMAIN` | Public (browser) | Domain for SIWF verification |
| `NEXT_PUBLIC_NEYNAR_CLIENT_ID` | Public (browser) | Neynar OAuth client ID |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Bypasses RLS — never in browser |
| `NEYNAR_API_KEY` | Server only | Neynar API access |
| `SESSION_SECRET` | Server only | iron-session encryption |
| `APP_SIGNER_PRIVATE_KEY` | Server only | App wallet for signer registration |
| `NEYNAR_WEBHOOK_SECRET` | Server only | Webhook HMAC verification |

### Data Storage

- **Supabase (PostgreSQL):** Row Level Security (RLS) enabled on all tables. Service role key used only server-side in API routes.
- **XMTP:** Messages are end-to-end encrypted via MLS protocol. ZAO OS servers never see plaintext message content.
- **Farcaster:** Casts are stored on the Farcaster Snapchain network. ZAO OS caches them in Supabase for performance.
- **localStorage:** XMTP signing keys and DB encryption keys are stored in the browser. These are app-specific keys, not personal wallet keys.

### What We Don't Do

- We don't store personal wallet private keys or seed phrases
- We don't ask users to paste or enter private keys
- We don't make on-chain transactions with user funds
- We don't store unencrypted passwords
- We don't use `dangerouslySetInnerHTML`
- We don't commit secrets to the repository
- We don't expose server-side API keys to the browser

---

## Dependencies

Run `npm audit` to check for known vulnerabilities in dependencies. See `research/40-codebase-audit-guide/` for the full audit methodology.

---

## Audit History

| Date | Scope | Findings | Report |
|------|-------|----------|--------|
| 2026-03-14 | Full codebase | 1 critical (dep), 2 high, 4 medium, 4 low | `research/40-codebase-audit-guide/AUDIT-RESULTS.md` |
