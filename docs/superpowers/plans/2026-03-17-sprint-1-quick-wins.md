# Sprint 1: Quick Wins Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship three quick wins that improve visibility, analytics, and user identity — all achievable in 1-2 days with minimal risk.

**Architecture:** Three independent tasks. Task 1 adds PostHog analytics (~10 lines). Task 2 surfaces ZID badges in the ProfileDrawer (chat user popup). Task 3 adds notification trigger points that are currently missing (proposals, votes, comments trigger notifications but several user actions don't).

**Tech Stack:** PostHog (free tier, 1M events/mo), existing Supabase notifications table, existing ProfileDrawer component.

**Note:** The notification UI (bell + dropdown + mark read + realtime subscription) is already fully built and deployed on every page. No notification UI work is needed. The gap is that some user actions don't create notifications.

---

## Task 1: Add PostHog Analytics

**Files:**
- Create: `src/lib/analytics.ts`
- Modify: `src/app/layout.tsx`
- Modify: `.env.example`

- [ ] **Step 1: Install PostHog**

```bash
npm install posthog-js
```

- [ ] **Step 2: Create the analytics module**

Create `src/lib/analytics.ts`:

```typescript
import posthog from 'posthog-js';

export function initAnalytics() {
  if (typeof window === 'undefined') return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
  });
}

export { posthog };
```

- [ ] **Step 3: Add PostHog initialization to root layout**

Modify `src/app/layout.tsx` — add the analytics init inside the root layout body. Import and call `initAnalytics()` in a `useEffect` within a small client component wrapper, or use PostHog's `PostHogProvider` pattern.

Add a `PostHogInit` client component at the top of the body:

```typescript
'use client';
import { useEffect } from 'react';
import { initAnalytics } from '@/lib/analytics';

export function PostHogInit() {
  useEffect(() => { initAnalytics(); }, []);
  return null;
}
```

Then render `<PostHogInit />` inside the root layout body.

- [ ] **Step 4: Add env var to .env.example**

Add to `.env.example`:

```
# PostHog Analytics (optional — get key from posthog.com)
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

- [ ] **Step 5: Verify build passes**

```bash
npm run build
```

Expected: Build succeeds. PostHog only initializes if `NEXT_PUBLIC_POSTHOG_KEY` is set.

- [ ] **Step 6: Commit**

```bash
git add src/lib/analytics.ts src/app/layout.tsx .env.example package.json package-lock.json
git commit -m "feat: add PostHog analytics integration"
```

---

## Task 2: Show ZID Badge in ProfileDrawer

**Files:**
- Modify: `src/components/chat/ProfileDrawer.tsx`
- Modify: `src/app/api/users/[fid]/route.ts`

The ProfileCard (tools page) already shows ZID badges. The ProfileDrawer (popup when clicking a user in chat) does not. This task adds the ZID badge to the ProfileDrawer.

- [ ] **Step 1: Check if the user API already returns ZID**

Read `src/app/api/users/[fid]/route.ts` and verify whether the response includes `zid`. If the API fetches from the `users` table, `zid` should already be in the row. If not, add it to the select query.

- [ ] **Step 2: Add zid to the ProfileData interface**

In `src/components/chat/ProfileDrawer.tsx`, add `zid` to the `ProfileData` interface:

```typescript
interface ProfileData {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  bio: string | null;
  followerCount: number;
  followingCount: number;
  powerBadge: boolean;
  verifiedAddresses: string[];
  viewerContext: { following: boolean; followed_by: boolean } | null;
  isZaoMember: boolean;
  zaoName: string | null;
  zid: number | null;  // <-- add this
  activity: {
    casts: number;
    likes: number;
    recasts: number;
    replies: number;
  };
}
```

- [ ] **Step 3: Display ZID badge next to display name**

Find the display name rendering in the ProfileDrawer JSX. Add the ZID badge after the name, using the same style as ProfileCard:

```tsx
{profile.zid && (
  <span className="text-xs font-bold text-[#f5a623] bg-[#f5a623]/10 px-2 py-0.5 rounded-full">
    ZID #{profile.zid}
  </span>
)}
```

- [ ] **Step 4: Set zid from API response**

In the `fetchProfile` function inside ProfileDrawer, make sure `zid` is mapped from the API response into the ProfileData state. Check where `setProfile()` is called and ensure `zid` is included.

- [ ] **Step 5: Verify in dev**

```bash
npm run dev
```

Open the app, click a user in chat, verify the ProfileDrawer shows their ZID badge (if they have one).

- [ ] **Step 6: Commit**

```bash
git add src/components/chat/ProfileDrawer.tsx src/app/api/users/*/route.ts
git commit -m "feat: show ZID badge in chat profile drawer"
```

---

## Task 3: Add Missing Notification Triggers

**Files:**
- Modify: `src/app/api/chat/send/route.ts` (verify existing notification trigger)
- Modify: `src/app/api/proposals/route.ts` (verify existing notification trigger)
- Modify: `src/app/api/proposals/vote/route.ts` (add notification if missing)
- Modify: `src/app/api/proposals/comment/route.ts` (add notification if missing)

The notification infrastructure is complete (bell, dropdown, realtime, mark read). But not all user actions create notifications. This task audits and fills the gaps.

- [ ] **Step 1: Audit which API routes call createInAppNotification**

```bash
# Search for all notification trigger points
grep -r "createInAppNotification" src/app/api/ --include="*.ts" -l
```

Document which routes trigger notifications and which don't.

- [ ] **Step 2: Add notification for proposal votes (if missing)**

In `src/app/api/proposals/vote/route.ts`, after a successful vote, notify the proposal author:

```typescript
import { createInAppNotification } from '@/lib/notifications';

// After successful vote insert:
await createInAppNotification({
  recipientFids: [proposalAuthorFid],
  type: 'vote',
  title: `${session.displayName} voted on your proposal`,
  body: proposal.title,
  href: `/governance`,
  actorFid: session.fid,
  actorDisplayName: session.displayName,
  actorPfpUrl: session.pfpUrl,
});
```

- [ ] **Step 3: Add notification for proposal comments (if missing)**

In `src/app/api/proposals/comment/route.ts`, after a successful comment, notify the proposal author:

```typescript
await createInAppNotification({
  recipientFids: [proposalAuthorFid],
  type: 'comment',
  title: `${session.displayName} commented on your proposal`,
  body: commentBody.slice(0, 100),
  href: `/governance`,
  actorFid: session.fid,
  actorDisplayName: session.displayName,
  actorPfpUrl: session.pfpUrl,
});
```

- [ ] **Step 4: Add notification for new member joins (if missing)**

In the auth registration flow (likely `src/app/api/auth/register/route.ts` or similar), after a new user is added to the allowlist and logs in for the first time, notify admins:

```typescript
import { communityConfig } from '@/../community.config';

await createInAppNotification({
  recipientFids: communityConfig.adminFids,
  type: 'member',
  title: `${displayName} joined the community`,
  body: `@${username}`,
  href: `/social`,
  actorFid: fid,
  actorDisplayName: displayName,
  actorPfpUrl: pfpUrl,
});
```

- [ ] **Step 5: Verify notifications appear in dev**

```bash
npm run dev
```

Create a proposal, vote on it, comment on it. Check the notification bell shows the corresponding notifications.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/proposals/vote/route.ts src/app/api/proposals/comment/route.ts
git commit -m "feat: add notification triggers for votes, comments, and member joins"
```

---

## Sprint 1 Complete Checklist

- [ ] PostHog analytics integrated (captures pageviews automatically)
- [ ] ZID badge visible in ProfileDrawer (chat user popup)
- [ ] Proposal votes trigger notifications to proposal author
- [ ] Proposal comments trigger notifications to proposal author
- [ ] New member joins trigger notifications to admins
- [ ] All changes committed and pushed

---

## Future Sprints (Reference)

This plan covers Sprint 1 only. The following sprints are documented in the master priority sequence and will be planned separately:

### Sprint 2 — Respect Activation (the keystone)
- Off-chain Respect ledger (PostgreSQL sync from on-chain)
- Respect-weighted governance (connect balances to vote weight)
- Tier system (Newcomer → Member → Curator → Elder → Legend)

### Sprint 3 — Engagement & Retention
- Engagement streaks (daily activity, flame icon, bonus Respect)
- OG Badge (permanent badge for founding 40)
- Track of the Day (community-curated highlight, curator + artist earn Respect)

### Sprint 4 — Moderation & Search
- Basic moderation (Neynar score filtering + community report + mod queue)
- Supabase full-text search (tsvector/tsquery + GIN index)
- Music approval queue (pending/approved status on submissions)

### Sprint 5 — Hats & Treasury (Q3 2026)
- Hats Protocol deployment via Anchor App on Optimism
- Safe multisig (3-of-5)
- Hats Signer Gate v2 (role-controlled treasury signing)

### Sprint 6 — AI Agent (Q4 2026)
- ElizaOS agent in separate repo
- Welcome DMs, FAQ, music recommendations

### Sprint 7 — Distribution (2027)
- Cross-platform publishing (Lens, Bluesky, Nostr)
- Sync licensing collective
