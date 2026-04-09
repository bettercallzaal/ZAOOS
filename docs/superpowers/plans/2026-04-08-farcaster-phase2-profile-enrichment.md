# Farcaster Phase 2: Profile Enrichment - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enrich ZAO member profiles with 6 new Farcaster protocol features: account verifications, popular casts, best friends, cast metrics, trending topics, and follow suggestions upgrade

**Architecture:** New Neynar API functions in `neynar.ts`, new API routes at `/api/members/` and `/api/social/`, UI additions to the existing 824-line member profile page and DiscoverPanel. All reads use the haatz dual-provider pattern.

**Tech Stack:** Next.js 16, React 19, Neynar v2 API, Tailwind CSS v4, Zod

**Research:** [Doc 306 - Protocol Features Gap Analysis](../../research/farcaster/306-farcaster-protocol-features-gap-analysis/)

---

## File Structure

```
src/lib/farcaster/neynar.ts                    # MODIFY: Add 5 new API functions
src/app/api/members/[username]/popular/route.ts # CREATE: Popular casts for a member
src/app/api/members/[username]/friends/route.ts # CREATE: Best friends by affinity
src/app/api/social/trending-topics/route.ts     # CREATE: Trending discussion topics
src/app/api/social/verifications/route.ts       # CREATE: Account verifications (X/GitHub/Discord)
src/app/api/social/suggestions/route.ts         # MODIFY: Upgrade with Neynar follow suggestions
src/app/members/[username]/page.tsx             # MODIFY: Add verifications, popular casts, best friends sections
src/components/chat/TrendingTopics.tsx           # CREATE: Trending topics sidebar widget
```

---

### Task 1: Add New Neynar API Functions

**Files:**
- Modify: `src/lib/farcaster/neynar.ts`

- [ ] **Step 1: Add 5 new functions after the existing exports**

Append after the last function in the file:

```typescript
export async function getPopularCasts(fid: number) {
  const res = await fetchWithFailover(`/feed/user/popular?fid=${fid}`, {
    headers: readHeaders(),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar popular casts error: ${res.status}`);
  return res.json();
}

export async function getBestFriends(fid: number, limit = 10) {
  const params = new URLSearchParams({ fid: String(fid), limit: String(limit) });
  const res = await fetchWithFailover(`/user/best-friends?${params}`, {
    headers: readHeaders(),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar best friends error: ${res.status}`);
  return res.json();
}

export async function getTrendingTopics(limit = 10) {
  const params = new URLSearchParams({ limit: String(limit) });
  const res = await fetchWithFailover(`/trending/topics?${params}`, {
    headers: readHeaders(),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar trending topics error: ${res.status}`);
  return res.json();
}

export async function getAccountVerifications(fid: number) {
  const res = await fetch(`https://api.farcaster.xyz/fc/account-verifications?fid=${fid}`, {
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Farcaster verifications error: ${res.status}`);
  return res.json();
}

export async function getFollowSuggestions(fid: number, limit = 20) {
  const params = new URLSearchParams({ fid: String(fid), limit: String(limit) });
  const res = await fetchWithFailover(`/user/suggestions?${params}`, {
    headers: readHeaders(),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar follow suggestions error: ${res.status}`);
  return res.json();
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit 2>&1 | grep neynar.ts | grep -v node_modules`
Expected: Only pre-existing errors (env alias, next in RequestInit)

- [ ] **Step 3: Commit**

```bash
git add src/lib/farcaster/neynar.ts
git commit -m "feat(farcaster): add popular casts, best friends, trending topics, verifications, suggestions API functions"
```

---

### Task 2: Popular Casts API Route

**Files:**
- Create: `src/app/api/members/[username]/popular/route.ts`

- [ ] **Step 1: Create the route**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getPopularCasts } from '@/lib/farcaster/neynar';
import { logger } from '@/lib/logger';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;

  try {
    // Resolve username to FID
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('fid')
      .ilike('username', decodeURIComponent(username).toLowerCase())
      .eq('is_active', true)
      .maybeSingle();

    if (!user?.fid) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const data = await getPopularCasts(user.fid);
    return NextResponse.json(data);
  } catch (err) {
    logger.error('[members/popular] GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch popular casts' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/members/[username]/popular/route.ts
git commit -m "feat: add popular casts API route for member profiles"
```

---

### Task 3: Best Friends API Route

**Files:**
- Create: `src/app/api/members/[username]/friends/route.ts`

- [ ] **Step 1: Create the route**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getBestFriends } from '@/lib/farcaster/neynar';
import { logger } from '@/lib/logger';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;

  try {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('fid')
      .ilike('username', decodeURIComponent(username).toLowerCase())
      .eq('is_active', true)
      .maybeSingle();

    if (!user?.fid) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '10', 10), 25);
    const data = await getBestFriends(user.fid, limit);
    return NextResponse.json(data);
  } catch (err) {
    logger.error('[members/friends] GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch best friends' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/members/[username]/friends/route.ts
git commit -m "feat: add best friends API route for member profiles"
```

---

### Task 4: Trending Topics and Account Verifications API Routes

**Files:**
- Create: `src/app/api/social/trending-topics/route.ts`
- Create: `src/app/api/social/verifications/route.ts`

- [ ] **Step 1: Create trending topics route**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { getTrendingTopics } from '@/lib/farcaster/neynar';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '10', 10), 25);
    const data = await getTrendingTopics(limit);
    return NextResponse.json(data);
  } catch (err) {
    logger.error('[trending-topics] GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch trending topics' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create verifications route**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getAccountVerifications } from '@/lib/farcaster/neynar';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const schema = z.object({ fid: z.coerce.number().int().positive() });

export async function GET(req: NextRequest) {
  const parsed = schema.safeParse({ fid: req.nextUrl.searchParams.get('fid') });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid fid' }, { status: 400 });
  }

  try {
    const data = await getAccountVerifications(parsed.data.fid);
    return NextResponse.json(data);
  } catch (err) {
    logger.error('[verifications] GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch verifications' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/social/trending-topics/route.ts src/app/api/social/verifications/route.ts
git commit -m "feat: add trending topics and account verifications API routes"
```

---

### Task 5: Trending Topics Sidebar Widget

**Files:**
- Create: `src/components/chat/TrendingTopics.tsx`

- [ ] **Step 1: Create the component**

A compact sidebar widget showing trending discussion topics from Farcaster. Fetches from `/api/social/trending-topics`. Shows topic name and cast count. Clicking a topic could link to a search or filter.

Design: dark card with navy bg, gold accent on topic names, compact list, mobile-friendly. Match the style of existing sidebar components in `src/components/chat/`.

Read `src/components/chat/FaqPanel.tsx` or `src/components/chat/TutorialPanel.tsx` for style reference before building.

```typescript
'use client';

import { useState, useEffect } from 'react';

interface Topic {
  topic: string;
  cast_count: number;
}

export function TrendingTopics() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/social/trending-topics?limit=8')
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => setTopics(data.topics || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="px-4 py-3">
        <div className="w-4 h-4 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (topics.length === 0) return null;

  return (
    <div className="px-4 py-3">
      <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium mb-2">Trending Topics</p>
      <div className="flex flex-wrap gap-1.5">
        {topics.map((t) => (
          <span
            key={t.topic}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full bg-[#f5a623]/10 text-[#f5a623] hover:bg-[#f5a623]/20 transition-colors cursor-pointer"
          >
            {t.topic}
            <span className="text-[10px] text-gray-500">{t.cast_count}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/chat/TrendingTopics.tsx
git commit -m "feat: add trending topics sidebar widget"
```

---

### Task 6: Add Verifications, Popular Casts, and Best Friends to Member Profile

**Files:**
- Modify: `src/app/members/[username]/page.tsx`

This is the most complex task. The profile page is 824 lines. The goal is to add 3 new sections:

- [ ] **Step 1: Read the full member profile page**

Read `src/app/members/[username]/page.tsx` to understand:
- The `MemberProfile` interface (already has `social`, `reputation`, `platforms`)
- The layout structure (how sections are ordered)
- The existing fetch pattern (single fetch to `/api/members/${username}`)

- [ ] **Step 2: Add Account Verifications section**

Add a section showing X (Twitter), GitHub, and Discord verification badges if the user has them. Fetch from `/api/social/verifications?fid=${profile.fid}` as a separate client-side fetch (don't bloat the main profile API).

Display as small badge pills: "X Verified", "GitHub: username", "Discord: username#1234" with platform icons/colors.

Place this section right after the bio/social links area and before the Respect section.

- [ ] **Step 3: Add Popular Casts section**

Fetch from `/api/members/${username}/popular` on mount. Show top 3-5 casts with text preview, engagement counts (likes, recasts), and timestamp. Collapsible section.

Place after the existing social/followers section.

- [ ] **Step 4: Add Best Friends section**

Fetch from `/api/members/${username}/friends` on mount. Show top 5-8 friends as avatar pills with username and affinity score. Clicking navigates to their profile.

Place near the social connections area.

- [ ] **Step 5: Commit**

```bash
git add src/app/members/[username]/page.tsx
git commit -m "feat: add verifications, popular casts, and best friends to member profile"
```

---

### Task 7: Upgrade Follow Suggestions in DiscoverPanel

**Files:**
- Modify: `src/app/api/social/suggestions/route.ts`

- [ ] **Step 1: Read the current suggestions route**

Read `src/app/api/social/suggestions/route.ts` to understand how it currently builds suggestions.

- [ ] **Step 2: Add Neynar follow suggestions as a fallback/enhancement**

Import `getFollowSuggestions` from neynar.ts. After the existing suggestion logic, if fewer than 10 suggestions were found, supplement with Neynar's `fetchFollowSuggestions`. Deduplicate by FID. Mark Neynar suggestions with a flag so the UI can differentiate.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/social/suggestions/route.ts
git commit -m "feat: upgrade follow suggestions with Neynar algorithm"
```
