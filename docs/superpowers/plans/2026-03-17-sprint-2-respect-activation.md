# Sprint 2: Governance & Respect Fixes

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the actual gaps in the governance and respect systems. The respect ledger, on-chain sync, leaderboard, fractal recording, and admin tools are already built and working. This sprint fixes the remaining issues.

**Architecture:** Targeted fixes to existing code. No new tables needed — the `respect_members`, `fractal_sessions`, `fractal_scores`, and `respect_events` tables already exist with RLS.

**What's already built (DO NOT rebuild):**
- `respect_members` table with fractal/event/hosting/bonus/on-chain columns
- `/api/respect/leaderboard` — leaderboard from DB
- `/api/respect/fractal` — admin fractal session recording (1x and 2x scoring)
- `/api/respect/event` — admin event recording (introduction, camera, article, etc.)
- `/api/respect/member` — member detail with fractal history
- `/api/respect/sync` — on-chain OG+ZOR balance sync from Optimism
- `/api/admin/respect-import` — Airtable import
- `RespectLeaderboard` component with expandable member details
- `RespectPanel` in chat
- `RespectOverview` admin component with search, stats, import/sync buttons
- Governance proposals, voting (on-chain weighted), comments
- Notifications for proposals, votes, comments

---

## Task 1: Fix Category Mismatch (Functional Bug)

**Files:**
- Modify: `scripts/create-proposals.sql`
- Modify: `src/lib/validation/schemas.ts`

The DB constraint allows `music`/`tech`. The Zod schema allows `technical`/`community`. The UI sends `technical`/`community`. These need to align.

- [ ] **Step 1: Decide on canonical categories**

Recommended: align everything to the Zod schema values since that's what the UI sends:
`general`, `technical`, `community`, `governance`, `treasury`

- [ ] **Step 2: Update the DB constraint**

Run in Supabase SQL editor:
```sql
ALTER TABLE proposals DROP CONSTRAINT IF EXISTS proposals_category_check;
ALTER TABLE proposals ADD CONSTRAINT proposals_category_check
  CHECK (category IN ('general', 'technical', 'community', 'governance', 'treasury'));

-- Update any existing rows with old values
UPDATE proposals SET category = 'technical' WHERE category = 'tech';
UPDATE proposals SET category = 'community' WHERE category = 'music';
```

- [ ] **Step 3: Verify Zod schema matches**

In `src/lib/validation/schemas.ts`, confirm `proposalCategorySchema` has:
`['general', 'treasury', 'governance', 'technical', 'community']`

- [ ] **Step 4: Verify UI dropdown matches**

In `src/app/(auth)/governance/page.tsx`, confirm the `<select>` options are:
`general`, `technical`, `community`, `governance`, `treasury`

- [ ] **Step 5: Test — create a proposal with each category**

- [ ] **Step 6: Commit**
```bash
git add scripts/create-proposals.sql src/lib/validation/schemas.ts
git commit -m "fix: align proposal category enum across DB, Zod, and UI"
```

---

## Task 2: Add Proposal Status Transitions

**Files:**
- Modify: `src/app/api/proposals/route.ts`
- Modify: `src/app/(auth)/governance/page.tsx`

Currently proposals can only be `open`. No API exists to close, approve, reject, or complete them.

- [ ] **Step 1: Add PATCH handler to proposals route**

```typescript
// PATCH — Update proposal status (admin only)
export async function PATCH(req: NextRequest) {
  const session = await getSessionData();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const schema = z.object({
    id: z.string().uuid(),
    status: z.enum(['open', 'approved', 'rejected', 'completed']),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('proposals')
    .update({ status: parsed.data.status })
    .eq('id', parsed.data.id);

  if (error) {
    return NextResponse.json({ error: 'Failed to update proposal' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Add status change buttons to governance UI (admin only)**

For admin users, show a dropdown or buttons on each proposal to change status:
- Open → Approved / Rejected
- Approved → Completed
- Any → Open (reopen)

- [ ] **Step 3: Block voting on non-open proposals in UI**

Hide vote buttons when `proposal.status !== 'open'`. The API already blocks this.

- [ ] **Step 4: Test — change proposal status as admin, verify votes are blocked**

- [ ] **Step 5: Commit**
```bash
git add src/app/api/proposals/route.ts src/app/(auth)/governance/page.tsx
git commit -m "feat: add proposal status transitions (admin-only PATCH endpoint)"
```

---

## Task 3: Add Proposal Auto-Close on Deadline

**Files:**
- Modify: `src/app/(auth)/governance/page.tsx`
- Modify: `src/app/api/proposals/vote/route.ts`

Proposals with `closes_at` don't auto-transition. The vote API rejects late votes, but the UI still shows vote buttons.

- [ ] **Step 1: Add client-side deadline check in governance UI**

In the proposal card rendering, check if `closes_at` has passed:
```typescript
const isExpired = proposal.closes_at && new Date(proposal.closes_at) < new Date();
const canVote = proposal.status === 'open' && !isExpired;
```

Only show vote buttons when `canVote` is true. Show "Voting closed" text when expired.

- [ ] **Step 2: Add deadline countdown display**

For proposals with `closes_at` in the future, show time remaining:
```typescript
const timeLeft = new Date(proposal.closes_at).getTime() - Date.now();
const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
const daysLeft = Math.floor(hoursLeft / 24);
```

Display as "2d 5h remaining" or "Closed" badge.

- [ ] **Step 3: Test — create proposal with 1-minute deadline, verify votes blocked after expiry**

- [ ] **Step 4: Commit**
```bash
git add src/app/(auth)/governance/page.tsx
git commit -m "feat: deadline countdown display and auto-block voting on expired proposals"
```

---

## Task 4: Handle Zero-Weight Votes

**Files:**
- Modify: `src/app/api/proposals/vote/route.ts`
- Modify: `src/app/(auth)/governance/page.tsx`

Users with 0 Respect can currently vote. The vote is recorded with weight=0, inflating voter count without affecting outcome.

- [ ] **Step 1: Decide on behavior**

Options:
a) **Block zero-weight votes** — return 400 with "You need Respect tokens to vote"
b) **Allow but label** — let them vote but show "(0 weight)" in the tally
c) **Keep current behavior** — silent zero-weight votes

Recommended: Option (b) — allow participation but make weight visible.

- [ ] **Step 2: If blocking, add check in vote route**

```typescript
if (respectWeight === 0) {
  return NextResponse.json({
    error: 'You need Respect tokens to vote. Earn Respect through fractal participation.'
  }, { status: 403 });
}
```

- [ ] **Step 3: If allowing, update UI to show weight next to vote**

In the vote tally, show individual vote weight so zero-weight votes are transparent.

- [ ] **Step 4: Commit**
```bash
git add src/app/api/proposals/vote/route.ts src/app/(auth)/governance/page.tsx
git commit -m "feat: handle zero-weight votes in governance (block/label based on decision)"
```

---

## Task 5: Add Notifications RLS (Security Fix)

**Files:**
- Create: `scripts/add-notifications-rls.sql`

The `notifications` table has no RLS enabled (found in security audit).

- [ ] **Step 1: Write the RLS migration**

```sql
-- Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: users can only read their own notifications
CREATE POLICY "Users read own notifications" ON notifications
  FOR SELECT USING (recipient_fid = current_setting('app.current_fid', true)::bigint);

-- Policy: service role can insert (for server-side notification creation)
-- RLS is bypassed by service_role key, so no explicit insert policy needed
```

Note: Since all notification queries go through `supabaseAdmin` (service role), RLS primarily protects against direct Supabase client access with the anon key.

- [ ] **Step 2: Run in Supabase SQL editor**

- [ ] **Step 3: Verify notifications still load in the app**

- [ ] **Step 4: Commit**
```bash
git add scripts/add-notifications-rls.sql
git commit -m "fix(security): enable RLS on notifications table"
```

---

## Task 6: Add Missing Rate Limits

**Files:**
- Modify: `src/middleware.ts`

8+ API route families have no rate limiting.

- [ ] **Step 1: Add rate limit rules for uncovered routes**

Add to the rate limit config in middleware:
```typescript
'/api/respect': { limit: 20, window: 60 },
'/api/social': { limit: 20, window: 60 },
'/api/members': { limit: 10, window: 60 },
'/api/following': { limit: 20, window: 60 },
'/api/miniapp': { limit: 10, window: 60 },
```

- [ ] **Step 2: Verify existing rate limits still work**

- [ ] **Step 3: Commit**
```bash
git add src/middleware.ts
git commit -m "fix(security): add rate limits for respect, social, members, miniapp routes"
```

---

## Sprint 2 Complete Checklist

- [ ] Proposal categories aligned across DB, Zod schema, and UI
- [ ] Admin can change proposal status (open → approved/rejected/completed)
- [ ] Expired proposals show "Voting closed" and hide vote buttons
- [ ] Deadline countdown displayed on proposals with closes_at
- [ ] Zero-weight vote behavior decided and implemented
- [ ] Notifications table has RLS enabled
- [ ] Missing rate limits added to middleware
- [ ] All changes committed and pushed

---

## What This Unlocks

With these fixes, the governance system is production-ready:
- Proposals can go through a full lifecycle (create → vote → close → complete)
- Categories work correctly
- Deadlines are enforced in both API and UI
- Security gaps (RLS, rate limits) are closed
- The respect system (already built) properly informs vote weight

## NOT in This Sprint (Already Built)

These were in the original Sprint 2 plan but are **already working**:
- ~~Off-chain respect ledger~~ → `respect_members` table exists
- ~~On-chain sync~~ → `/api/respect/sync` exists
- ~~Leaderboard API~~ → `/api/respect/leaderboard` exists
- ~~Fractal session recording~~ → `/api/respect/fractal` exists
- ~~Event recording~~ → `/api/respect/event` exists
- ~~Admin overview~~ → `RespectOverview` component exists
- ~~Airtable import~~ → API + CLI script exist
- ~~Vote weight connection~~ → on-chain multicall at vote time exists
