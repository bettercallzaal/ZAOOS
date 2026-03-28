# Re-Audit Results (March 17, 2026)

> Post-fix verification + broad scan

## Fix Verification: All 11 Fixes Confirmed

| # | Fix | Status | Correct? |
|---|-----|--------|----------|
| 1 | Register endpoint Zod + wallet normalization | YES | Yes |
| 2 | Auth verify Zod schema | YES | Yes |
| 3 | Auth SIWE Zod schema | YES | Yes |
| 4 | Chat schedule Zod schema | YES | Yes |
| 5 | Search wildcard escaping | YES | Yes |
| 6 | Neynar error leakage | YES | Yes |
| 7 | Music radio auth check | YES | Yes |
| 8 | Music rate limits in middleware | YES | Yes |
| 9 | Governance category enum + ogPct display | YES | Yes |
| 10 | Notifications PATCH Zod | YES | Yes |
| 11 | HMAC timingSafeEqual | YES | Yes |

No new vulnerabilities introduced by any fix.

## New Findings from Broad Scan

### HIGH: Notifications table missing RLS
- `scripts/create-notifications.sql` never calls `ALTER TABLE notifications ENABLE ROW LEVEL SECURITY`
- Any client with the Supabase anon key could read/write/delete notifications
- **Fix:** Add RLS + policies to the table

### MEDIUM: 8+ API routes lack rate limiting
- `/api/respect/*`, `/api/social/*`, `/api/members`, `/api/following/online`, `/api/miniapp/*`
- **Fix:** Add rate limit rules to middleware

### LOW: CLI scripts log secrets to stdout
- `scripts/generate-wallet.ts` logs private keys
- Intentional for local use, risky in CI
- **Fix:** Consider writing to file instead of stdout, or add warnings

## Clean Bill of Health
- No dangerouslySetInnerHTML
- No NEXT_PUBLIC_ secrets leaked
- No eval() or Function()
- No hardcoded keys in source
- No .env files in git
- No `any` types in auth code
- No security TODO/FIXME comments
