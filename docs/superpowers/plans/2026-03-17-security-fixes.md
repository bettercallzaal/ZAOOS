# Security Fixes Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 1 critical + 4 high + 6 highest-impact medium severity issues found in the March 17, 2026 security audit (research/57).

**Architecture:** Targeted fixes to existing files. No new features — security hardening only.

**Tech Stack:** Zod (already installed), Supabase (for nonce storage), existing middleware.

---

## Task 1: Fix Register Endpoint (CRITICAL + HIGH)

**Files:**
- Modify: `src/app/api/auth/register/route.ts`

**Issues:** C1 (no auth), H3 (no Zod, no session), M12 (wallet not normalized)

- [ ] **Step 1: Add Zod schema for register body**

```typescript
import { z } from 'zod';

const registerSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  signature: z.string().min(1),
  deadline: z.number().int().positive(),
  fname: z.string().min(1).max(32).optional(),
});
```

- [ ] **Step 2: Validate input with Zod at top of handler**

- [ ] **Step 3: Normalize wallet address to lowercase before allowlist check**

```typescript
const normalizedWallet = parsed.data.walletAddress.toLowerCase();
```

- [ ] **Step 4: Add rate limiting comment — verify middleware covers `/api/auth/*` at 10/min**

The middleware already covers `/api/auth` routes at 10/min. This is adequate for register.

- [ ] **Step 5: Test**

POST to `/api/auth/register` with malformed body — should get 400 with validation errors.
POST with valid body but wallet not on allowlist — should get 403.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/auth/register/route.ts
git commit -m "fix(security): add Zod validation + wallet normalization to register endpoint"
```

---

## Task 2: Add Zod to Auth Verify and SIWE (HIGH/MEDIUM)

**Files:**
- Modify: `src/app/api/auth/verify/route.ts`
- Modify: `src/app/api/auth/siwe/route.ts`

**Issues:** M10 (no Zod on verify/siwe bodies)

- [ ] **Step 1: Add Zod schema to verify route**

```typescript
const verifySchema = z.object({
  message: z.string().min(1),
  signature: z.string().min(1),
  nonce: z.string().min(1),
  domain: z.string().min(1),
});
```

Add `safeParse` after `req.json()` and return 400 on failure.

- [ ] **Step 2: Add Zod schema to siwe route**

```typescript
const siweSchema = z.object({
  message: z.string().min(1),
  signature: z.string().min(1),
});
```

- [ ] **Step 3: Test both auth flows still work end-to-end**

- [ ] **Step 4: Commit**

```bash
git add src/app/api/auth/verify/route.ts src/app/api/auth/siwe/route.ts
git commit -m "fix(security): add Zod validation to SIWF verify and SIWE routes"
```

---

## Task 3: Add Zod to Chat Schedule (HIGH)

**Files:**
- Modify: `src/app/api/chat/schedule/route.ts`

**Issue:** H2 (no Zod on POST, raw body destructuring)

- [ ] **Step 1: Add Zod schema for schedule POST**

```typescript
const scheduleSchema = z.object({
  text: z.string().min(1).max(1024),
  channel: z.string().min(1),
  scheduledFor: z.string().datetime(),
  embedHash: z.string().regex(/^0x[a-f0-9]{40}$/).optional(),
  embedUrls: z.array(z.string().url()).max(2).optional(),
  crossPostChannels: z.array(z.string()).optional(),
});
```

- [ ] **Step 2: Replace raw body destructuring with `safeParse`**

- [ ] **Step 3: Validate `channel` and `crossPostChannels` against `ALLOWED_CHANNELS`**

- [ ] **Step 4: Test scheduling a cast — verify it still works**

- [ ] **Step 5: Commit**

```bash
git add src/app/api/chat/schedule/route.ts
git commit -m "fix(security): add Zod validation to chat schedule POST"
```

---

## Task 4: Fix Category Enum Mismatch (MEDIUM — functional bug)

**Files:**
- Modify: `src/app/(auth)/governance/page.tsx`

**Issue:** M7 (frontend sends "music"/"tech", Zod expects "technical"/"community")

- [ ] **Step 1: Check the Zod schema to see what categories are allowed**

Read `src/lib/validation/schemas.ts` (or wherever `proposalCategorySchema` lives) and find the exact enum values.

- [ ] **Step 2: Update the frontend category dropdown to match the Zod enum**

Replace the frontend category options with the exact values from the schema.

- [ ] **Step 3: Test creating a proposal with each category — all should succeed**

- [ ] **Step 4: Commit**

```bash
git add src/app/(auth)/governance/page.tsx
git commit -m "fix: align governance category dropdown with Zod schema enum"
```

---

## Task 5: Fix ogPct/zorPct Undefined Display (MEDIUM — display bug)

**Files:**
- Modify: `src/app/(auth)/governance/page.tsx`

**Issue:** M9 (API strips ogPct/zorPct but UI renders `undefined%`)

- [ ] **Step 1: Check what the leaderboard API actually returns**

Read `/api/respect/leaderboard` response — does it include `ogPct`/`zorPct`?

- [ ] **Step 2: Either include the fields in the API response OR remove them from the UI**

If the governance page calls the leaderboard API and the fields are stripped, add them back to the API response. OR remove the `{myEntry.ogPct}%` rendering from the UI and replace with calculated values.

- [ ] **Step 3: Test — governance page "Your Respect" card shows actual percentages**

- [ ] **Step 4: Commit**

```bash
git add src/app/(auth)/governance/page.tsx src/app/api/respect/leaderboard/route.ts
git commit -m "fix: resolve ogPct/zorPct undefined display in governance page"
```

---

## Task 6: Add Missing Rate Limits + Auth to Music Routes (MEDIUM)

**Files:**
- Modify: `src/middleware.ts`
- Modify: `src/app/api/music/radio/route.ts`

**Issues:** M3 (no rate limit on metadata), M4 (radio has no auth + no rate limit)

- [ ] **Step 1: Add rate limit rules to middleware**

Add to the rate limit config:
```typescript
'/api/music/metadata': { limit: 20, window: 60 },
'/api/music/radio': { limit: 10, window: 60 },
```

- [ ] **Step 2: Add session check to radio route**

At the top of the GET handler:
```typescript
const session = await getSessionData();
if (!session?.fid) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

- [ ] **Step 3: Test — unauthenticated `/api/music/radio` returns 401**

- [ ] **Step 4: Commit**

```bash
git add src/middleware.ts src/app/api/music/radio/route.ts
git commit -m "fix(security): add auth + rate limits to music metadata and radio routes"
```

---

## Task 7: Fix Search Wildcard Injection (MEDIUM)

**Files:**
- Modify: `src/app/api/chat/search/route.ts`

**Issue:** M1 (searching `%` returns all messages)

- [ ] **Step 1: Escape wildcard characters before passing to ilike**

```typescript
function escapeWildcards(str: string): string {
  return str.replace(/[%_\\]/g, '\\$&');
}

// In the search handler:
const escapedQuery = escapeWildcards(query);
// Then use: .ilike('text', `%${escapedQuery}%`)
```

- [ ] **Step 2: Test — searching `%` should return no results (not all messages)**

- [ ] **Step 3: Commit**

```bash
git add src/app/api/chat/search/route.ts
git commit -m "fix(security): escape wildcard characters in chat search"
```

---

## Task 8: Fix Neynar Error Leakage (MEDIUM)

**Files:**
- Modify: `src/app/api/chat/react/route.ts`

**Issue:** M2 (upstream Neynar errors forwarded to client)

- [ ] **Step 1: Replace error message forwarding with generic message**

Change lines ~49 and ~116:
```typescript
// Before:
return NextResponse.json({ error: err.message || 'Reaction failed' }, { status: 500 });

// After:
return NextResponse.json({ error: 'Reaction failed' }, { status: 500 });
```

Keep `console.error` for server-side logging.

- [ ] **Step 2: Commit**

```bash
git add src/app/api/chat/react/route.ts
git commit -m "fix(security): don't proxy Neynar error messages to client"
```

---

## Task 9: Add Zod to Notifications PATCH (MEDIUM)

**Files:**
- Modify: `src/app/api/notifications/route.ts`

**Issue:** M11 (no validation on PATCH body)

- [ ] **Step 1: Add Zod schema**

```typescript
const markReadSchema = z.union([
  z.object({ all: z.literal(true) }),
  z.object({ ids: z.array(z.string().uuid()).min(1).max(100) }),
]);
```

- [ ] **Step 2: Replace raw body usage with validated data**

- [ ] **Step 3: Test — mark individual + mark all read still work**

- [ ] **Step 4: Commit**

```bash
git add src/app/api/notifications/route.ts
git commit -m "fix(security): add Zod validation to notifications PATCH"
```

---

## Task 10: Fix HMAC Timing (LOW but easy)

**Files:**
- Modify: `src/app/api/webhooks/neynar/route.ts`

**Issue:** L5 (string `===` instead of `timingSafeEqual`)

- [ ] **Step 1: Replace string comparison with constant-time comparison**

```typescript
import { timingSafeEqual } from 'crypto';

const sigBuffer = Buffer.from(signature, 'hex');
const expectedBuffer = Buffer.from(expectedSignature, 'hex');

if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/webhooks/neynar/route.ts
git commit -m "fix(security): use timingSafeEqual for webhook HMAC verification"
```

---

## Execution Order

1. **Task 1** — Register endpoint (CRITICAL)
2. **Task 6** — Music rate limits + radio auth (quick fix, high impact)
3. **Task 7** — Search wildcard injection (quick fix)
4. **Task 4** — Category enum mismatch (functional bug)
5. **Task 5** — ogPct/zorPct display bug
6. **Task 2** — Auth Zod validation
7. **Task 3** — Schedule Zod validation
8. **Task 8** — Neynar error leakage
9. **Task 9** — Notifications Zod
10. **Task 10** — HMAC timing

---

## Deferred (Not in This Plan)

- **H1 (nonce stores)** — Requires Redis/KV infrastructure. Plan separately.
- **H4 (centralized auth guard)** — Architectural change. Plan separately.
- **M5 (miniapp webhook spoofing)** — Platform limitation. Can add rate limiting but can't fully fix.
- **M6 (members endpoint exposure)** — Design decision needed on what data to expose.
- **M8 (zero-weight votes)** — Design decision. Not a security bug.
