# 66 — Backend Testing Strategy for ZAO OS

> **Status:** Research complete
> **Date:** March 18, 2026
> **Goal:** Establish a backend testbench for verifying AI-written API routes

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Test runner** | Vitest 3.x — native ESM/TS, 30-70% faster than Jest, Next.js officially supported |
| **Route testing** | `next-test-api-route-handler` 4.x (NTARH) — purpose-built for App Router |
| **API mocking** | MSW 2.x — network-level interception for Neynar, Optimism RPC, Airtable |
| **RLS auditing** | `supashield` CLI — zero-config Supabase RLS scanner |
| **Session mocking** | Mock `getSessionData` at module level — no browser needed |
| **Priority** | Test boundaries, not happy paths. AI gets happy paths right 90% of the time. |

## Codebase Audit Summary (5 parallel agents)

### API Routes: 47 total

| Category | Count | Auth | Notes |
|----------|-------|------|-------|
| Auth | 8 | Mixed (public + session) | All secure, nonces consumed after use |
| Chat | 7 | Session + signer | Complex fire-and-forget chains |
| Users | 7 | Session | Follow route lacks Zod |
| Admin | 9 | Admin-only | `/admin/users` lacks Zod for PATCH/POST |
| Governance | 3 | Session/Admin | All validated |
| Respect | 5 | Session/Admin | Sync uses Promise.allSettled |
| Music | 4 | Session | Metadata fetches 8 external platforms |
| Social | 2 | Session | Bulk Neynar calls |
| Other | 5 | Mixed | Webhooks, notifications, members |

### Security: Zero Critical Vulnerabilities

- All 44 authenticated routes consistently check `getSessionData()`
- All 14 admin routes use `isAdmin` guard
- iron-session: 7-day TTL, httpOnly, secure in prod, sameSite lax
- Webhook routes use HMAC-SHA512 or FID verification

### Validation: Grade B+

- 18 routes use Zod for JSON bodies
- 4 routes use manual validation instead of Zod
- 10 inline schemas could be centralized to `schemas.ts`
- 9 routes accept query params without Zod

### Error Handling: Grade 7.5/10

**Issues found:**
1. `/admin/respect-import` — leaks raw error messages to client (info leakage)
2. 5 routes missing try/catch (`auth/session`, `auth/logout`, `users/wallet`, `members`)
3. `chat/react` fire-and-forget has zero logging
4. `members` route silently swallows Neynar fetch failures

## What Breaks Most in AI-Written Code

1. **Edge case blindness** — empty arrays to Supabase `.in()`, null chaining on optional fields
2. **Inconsistent error handling** — try/catch in some routes, missing in others
3. **Silent fire-and-forget failures** — Promise chains that swallow errors
4. **Copy-paste drift** — duplicated logic diverges when one copy is fixed
5. **Type casting as `unknown`** — compiles but crashes at runtime

## Recommended Test Stack

```bash
npm install -D vitest @vitejs/plugin-react next-test-api-route-handler msw
npm install -g supashield  # RLS auditing
```

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.ts'],
    coverage: {
      include: ['src/app/api/**'],
      reporter: ['text', 'json-summary'],
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
});
```

### Session Mocking Pattern

```typescript
vi.mock('@/lib/auth/session', () => ({
  getSessionData: vi.fn(),
}));
// Then: vi.mocked(getSessionData).mockResolvedValue({ fid: 19640, isAdmin: true, ... })
```

## Phased Rollout

| Phase | Scope | Effort |
|-------|-------|--------|
| **1. Critical path** | 5 routes x 3-4 tests = 15-20 tests | 2 days |
| **2. RLS audit** | supashield + pgTAP for sensitive tables | 1 day |
| **3. MSW mocking** | Neynar, Optimism RPC handlers | 1 day |
| **4. Regression** | One test per production bug, ongoing | Ongoing |

### Phase 1 Priority Routes

1. `/api/auth/verify` — auth verification, allowlist gating
2. `/api/chat/send` — most complex route (Zod, Neynar, DB, notifications)
3. `/api/admin/allowlist` — gatekeeping logic
4. `/api/proposals/vote` — state-changing governance with on-chain reads
5. `/api/respect/sync` — admin bulk operation with Promise.allSettled

## Sources

- [Next.js Vitest Testing Guide](https://nextjs.org/docs/app/guides/testing/vitest)
- [next-test-api-route-handler](https://github.com/Xunnamius/next-test-api-route-handler)
- [MSW in Next.js](https://github.com/laststance/next-msw-integration)
- [supashield](https://github.com/Rodrigotari1/supashield)
- [Testing Supabase RLS with pgTAP](https://usebasejump.com/blog/testing-on-supabase-with-pgtap)
