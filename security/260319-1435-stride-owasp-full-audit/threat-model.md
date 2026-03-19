# Threat Model — ZAO OS Full Security Audit

**Date:** 2026-03-19
**Scope:** Entire codebase (src/app/api/**, src/lib/**, src/middleware.ts)

## Assets

| Asset Type | Asset | Priority |
|------------|-------|----------|
| **Data Store** | Supabase PostgreSQL (users, allowlist, channel_casts, proposals, votes, comments, notifications, respect_members, scheduled_casts, hidden_messages) | Critical |
| **Data Store** | Supabase Storage (uploads bucket) | High |
| **Data Store** | In-memory nonce stores (auth/verify, auth/siwe) | High |
| **Data Store** | In-memory rate limit store | Medium |
| **Data Store** | Browser localStorage (XMTP keys) | Medium |
| **Authentication** | iron-session encrypted httpOnly cookies (7-day TTL) | Critical |
| **Authentication** | SIWF (Sign In With Farcaster) via @farcaster/auth-client | Critical |
| **Authentication** | SIWE (Sign In With Ethereum) via viem/siwe | Critical |
| **Authentication** | Farcaster QuickAuth JWT (mini app) | High |
| **Authentication** | Neynar managed signers (EIP-712 signed keys) | High |
| **API Endpoints** | 56 route handlers across /api/** | High |
| **External Service** | Neynar API (Farcaster data, cast posting, signers) | High |
| **External Service** | XMTP network (E2E encrypted messaging) | High |
| **External Service** | Optimism RPC (respect token balances, Hats Protocol) | Medium |
| **External Service** | Airtable API (respect data import) | Medium |
| **External Service** | Ethereum mainnet RPC (ENS resolution, SIWE verification) | Medium |
| **Configuration** | Environment variables (7 server-only secrets) | Critical |
| **Configuration** | community.config.ts (admin FIDs, contracts, channels) | High |
| **User Input** | Forms, API request bodies, URL params, file uploads | High |

## Trust Boundaries

```
Trust Boundaries:
  ├── Browser ←→ Next.js Server (client components vs server/API routes)
  │   └── iron-session cookie crosses this boundary
  ├── Next.js Server ←→ Supabase (API routes use service role key — bypasses RLS)
  │   └── All DB writes use service role — RLS only protects direct browser access
  ├── Next.js Server ←→ Neynar API (server → 3rd party, API key auth)
  ├── Next.js Server ←→ Optimism/Ethereum RPC (read-only blockchain queries)
  ├── Next.js Server ←→ Airtable (server → 3rd party, bearer token)
  ├── Public routes ←→ Authenticated routes (session check)
  ├── Member routes ←→ Admin routes (isAdmin check from session)
  ├── Webhook endpoints ←→ External callers (HMAC verification for Neynar; no verification for mini app)
  └── Middleware ←→ API routes (rate limiting at middleware level)
```

## STRIDE Analysis

### Spoofing

| Threat | Risk | Assets Affected | Notes |
|--------|------|-----------------|-------|
| Session forgery | Low | iron-session | Encrypted with 32-byte secret, httpOnly, secure in prod |
| SIWF replay attack | Low | Auth/verify | Nonce is single-use, 5-min TTL |
| SIWE replay attack | Low | Auth/siwe | Nonce is single-use, 5-min TTL, domain validated |
| Mini app webhook spoofing | **Medium** | miniapp/webhook | No HMAC signature verification — input shape + allowlist check only |
| Admin privilege spoofing | Low | Admin routes | isAdmin derived from hardcoded FIDs at session creation |
| Signer impersonation | Low | Auth/signer | Signer ownership verified against Neynar before saving |
| IP spoofing for rate limits | **Medium** | Rate limiting | Uses x-forwarded-for header, spoofable behind some proxies |

### Tampering

| Threat | Risk | Assets Affected | Notes |
|--------|------|-----------------|-------|
| Input injection via API | Low | All API routes | Zod validation on most routes; some routes lack Zod (follow, wallet) |
| Supabase query manipulation | Low | DB queries | Parameterized queries via Supabase SDK, no raw SQL |
| ilike pattern injection | **Medium** | Admin user search | `%` and `_` in search could manipulate query patterns |
| File upload content manipulation | Low | Upload route | MIME type and size validated, stored in Supabase Storage |

### Repudiation

| Threat | Risk | Assets Affected | Notes |
|--------|------|-----------------|-------|
| Missing audit logs | **Medium** | All operations | No structured audit logging — only console.error on failures |
| Untraceable admin actions | **Medium** | Admin routes | Admin hide/delete/import actions not logged with actor |
| Vote tampering without trail | Low | Proposals | Votes stored with voter_id, change-able without history |

### Information Disclosure

| Threat | Risk | Assets Affected | Notes |
|--------|------|-----------------|-------|
| Error message leaking | Low | API routes | Try/catch returns generic errors; some Zod details exposed |
| Session data exposure | Low | Auth/session GET | Returns fid, wallet, username, isAdmin — intentional |
| Server env leak via client | Low | ENV module | ENV requires server-only vars; would crash at build if imported client-side |
| User enumeration via /api/users/[fid] | Low | User routes | Requires auth; returns 404 for unknown FIDs |

### Denial of Service

| Threat | Risk | Assets Affected | Notes |
|--------|------|-----------------|-------|
| Rate limit bypass | **Medium** | All API routes | In-memory store resets on server restart; per-IP only |
| Nonce store exhaustion | Low | Auth nonce stores | Capped at MAX_NONCES (10k), pruned on TTL |
| Scheduled cast spam | Low | Chat/schedule | Auth required, rate limited at middleware |
| Large file upload | Low | Upload route | Capped at 5MB image, 1MB CSV |

### Elevation of Privilege

| Threat | Risk | Assets Affected | Notes |
|--------|------|-----------------|-------|
| Horizontal access (IDOR) | Low-Medium | User routes | Most routes scope by session FID; /api/users/[fid] is read-only |
| Admin bypass | Low | Admin routes | isAdmin set at session creation from hardcoded list |
| Cross-user scheduled cast manipulation | **Low** | Schedule | DELETE scoped by .eq('fid', session.fid) |
| Proposal status manipulation | Low | Proposals PATCH | Admin-only, session.isAdmin checked |
