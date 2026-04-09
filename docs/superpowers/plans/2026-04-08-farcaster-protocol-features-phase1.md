# Farcaster Protocol Features Phase 1 - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 8 missing Farcaster protocol features to ZAO OS to close the gap with Warpcast/Herocast as a community client

**Architecture:** All new Neynar API calls go through `src/lib/farcaster/neynar.ts` using the existing dual-provider pattern (haatz reads, Neynar writes). New API routes follow ZAO conventions: Zod validation, session check, try/catch, NextResponse.json. New UI follows dark theme (navy #0a1628, gold #f5a623), mobile-first.

**Tech Stack:** Next.js 16, React 19, Neynar v2 API, Supabase, Tailwind CSS v4, Zod

**Research:** Docs [304](../../research/farcaster/304-quilibrium-hypersnap-free-neynar-api/), [305](../../research/farcaster/305-channel-moderation-community-management/), [306](../../research/farcaster/306-farcaster-protocol-features-gap-analysis/)

---

## File Structure

```
src/lib/farcaster/neynar.ts              # MODIFY: Add 8 new Neynar API functions
src/app/api/notifications/farcaster/route.ts  # CREATE: Farcaster notification feed
src/app/api/users/mute/route.ts          # CREATE: Mute/unmute users
src/app/api/users/block/route.ts         # CREATE: Block/unblock users
src/app/api/users/storage/route.ts       # CREATE: Storage usage lookup
src/app/api/casts/delete/route.ts        # CREATE: Delete own cast
src/app/api/casts/summary/route.ts       # CREATE: AI thread summary
src/components/social/FollowerCard.tsx    # MODIFY: Add DC intent link + mute/block menu
src/app/(auth)/settings/SettingsClient.tsx # MODIFY: Add storage info section
```

---

### Task 1: Add Neynar API Functions to neynar.ts

**Files:**
- Modify: `src/lib/farcaster/neynar.ts`

- [ ] **Step 1: Add notification functions**

Add after the `getRelevantFollowers` function:

```typescript
export async function getNotifications(fid: number, cursor?: string, limit = 25) {
  const params = new URLSearchParams({
    fid: String(fid),
    limit: String(limit),
  });
  if (cursor) params.set('cursor', cursor);

  const res = await fetchWithFailover(`/notifications?${params}`, {
    headers: readHeaders(),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar notifications error: ${res.status}`);
  return res.json();
}

export async function markNotificationsSeen(signerUuid: string) {
  const res = await fetch(`${NEYNAR_BASE}/notifications/seen`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ signer_uuid: signerUuid }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar mark-seen error: ${res.status}`);
  return res.json();
}
```

- [ ] **Step 2: Add mute/block functions**

```typescript
export async function muteUser(signerUuid: string, targetFid: number) {
  const res = await fetch(`${NEYNAR_BASE}/mute`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ signer_uuid: signerUuid, target_fid: targetFid }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar mute error: ${res.status}`);
  return res.json();
}

export async function unmuteUser(signerUuid: string, targetFid: number) {
  const res = await fetch(`${NEYNAR_BASE}/mute`, {
    method: 'DELETE',
    headers: headers(),
    body: JSON.stringify({ signer_uuid: signerUuid, target_fid: targetFid }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar unmute error: ${res.status}`);
  return res.json();
}

export async function blockUser(signerUuid: string, targetFid: number) {
  const res = await fetch(`${NEYNAR_BASE}/block`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ signer_uuid: signerUuid, target_fid: targetFid }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar block error: ${res.status}`);
  return res.json();
}

export async function unblockUser(signerUuid: string, targetFid: number) {
  const res = await fetch(`${NEYNAR_BASE}/block`, {
    method: 'DELETE',
    headers: headers(),
    body: JSON.stringify({ signer_uuid: signerUuid, target_fid: targetFid }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar unblock error: ${res.status}`);
  return res.json();
}

export async function getMuteList(fid: number, limit = 100, cursor?: string) {
  const params = new URLSearchParams({ fid: String(fid), limit: String(limit) });
  if (cursor) params.set('cursor', cursor);
  const res = await fetch(`${NEYNAR_BASE}/mute/list?${params}`, {
    headers: headers(),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar mute list error: ${res.status}`);
  return res.json();
}
```

- [ ] **Step 3: Add storage, cast delete, and AI summary functions**

```typescript
export async function getStorageUsage(fid: number) {
  const res = await fetchWithFailover(`/storage/usage?fid=${fid}`, {
    headers: readHeaders(),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar storage error: ${res.status}`);
  return res.json();
}

export async function deleteCast(signerUuid: string, castHash: string) {
  const res = await fetch(`${NEYNAR_BASE}/cast`, {
    method: 'DELETE',
    headers: headers(),
    body: JSON.stringify({ signer_uuid: signerUuid, target_hash: castHash }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar delete cast error: ${res.status}`);
  return res.json();
}

export async function getCastConversationSummary(castHash: string) {
  const params = new URLSearchParams({
    identifier: castHash,
    type: 'hash',
  });
  const res = await fetchWithFailover(`/cast/conversation/summary?${params}`, {
    headers: readHeaders(),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar summary error: ${res.status}`);
  return res.json();
}
```

- [ ] **Step 4: Verify types compile**

Run: `npx tsc --noEmit 2>&1 | grep neynar.ts`
Expected: No new errors from our file

- [ ] **Step 5: Commit**

```bash
git add src/lib/farcaster/neynar.ts
git commit -m "feat(farcaster): add notification, mute/block, storage, delete, summary API functions"
```

---

### Task 2: Farcaster Notifications API Route

**Files:**
- Create: `src/app/api/notifications/farcaster/route.ts`

- [ ] **Step 1: Create the route**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { getNotifications, markNotificationsSeen } from '@/lib/farcaster/neynar';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const cursor = req.nextUrl.searchParams.get('cursor') || undefined;
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '25', 10), 50);

    const data = await getNotifications(session.fid, cursor, limit);
    return NextResponse.json(data);
  } catch (err) {
    logger.error('[notifications/farcaster] GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function POST() {
  const session = await getSessionData();
  if (!session?.signerUuid) {
    return NextResponse.json({ error: 'Signer required' }, { status: 401 });
  }

  try {
    await markNotificationsSeen(session.signerUuid);
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('[notifications/farcaster] POST error:', err);
    return NextResponse.json({ error: 'Failed to mark seen' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/notifications/farcaster/route.ts
git commit -m "feat: add Farcaster notifications API route (read + mark seen)"
```

---

### Task 3: Mute and Block API Routes

**Files:**
- Create: `src/app/api/users/mute/route.ts`
- Create: `src/app/api/users/block/route.ts`

- [ ] **Step 1: Create mute route**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { muteUser, unmuteUser } from '@/lib/farcaster/neynar';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const schema = z.object({ targetFid: z.number().int().positive() });

export async function POST(request: NextRequest) {
  const session = await getSessionData();
  if (!session?.signerUuid) {
    return NextResponse.json({ error: 'Signer required' }, { status: 401 });
  }
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
  }
  try {
    await muteUser(session.signerUuid, parsed.data.targetFid);
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('Mute error:', err);
    return NextResponse.json({ error: 'Failed to mute' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSessionData();
  if (!session?.signerUuid) {
    return NextResponse.json({ error: 'Signer required' }, { status: 401 });
  }
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
  }
  try {
    await unmuteUser(session.signerUuid, parsed.data.targetFid);
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('Unmute error:', err);
    return NextResponse.json({ error: 'Failed to unmute' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create block route** (same pattern as mute, using blockUser/unblockUser)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { blockUser, unblockUser } from '@/lib/farcaster/neynar';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const schema = z.object({ targetFid: z.number().int().positive() });

export async function POST(request: NextRequest) {
  const session = await getSessionData();
  if (!session?.signerUuid) {
    return NextResponse.json({ error: 'Signer required' }, { status: 401 });
  }
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
  }
  try {
    await blockUser(session.signerUuid, parsed.data.targetFid);
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('Block error:', err);
    return NextResponse.json({ error: 'Failed to block' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSessionData();
  if (!session?.signerUuid) {
    return NextResponse.json({ error: 'Signer required' }, { status: 401 });
  }
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
  }
  try {
    await unblockUser(session.signerUuid, parsed.data.targetFid);
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('Unblock error:', err);
    return NextResponse.json({ error: 'Failed to unblock' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/users/mute/route.ts src/app/api/users/block/route.ts
git commit -m "feat: add mute/block API routes for user safety controls"
```

---

### Task 4: Cast Delete and AI Summary API Routes

**Files:**
- Create: `src/app/api/casts/delete/route.ts`
- Create: `src/app/api/casts/summary/route.ts`

- [ ] **Step 1: Create cast delete route**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { deleteCast } from '@/lib/farcaster/neynar';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const schema = z.object({ castHash: z.string().startsWith('0x') });

export async function POST(request: NextRequest) {
  const session = await getSessionData();
  if (!session?.signerUuid) {
    return NextResponse.json({ error: 'Signer required' }, { status: 401 });
  }
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
  }
  try {
    await deleteCast(session.signerUuid, parsed.data.castHash);
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('Delete cast error:', err);
    return NextResponse.json({ error: 'Failed to delete cast' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create AI thread summary route**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { getCastConversationSummary } from '@/lib/farcaster/neynar';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const schema = z.object({ castHash: z.string().startsWith('0x') });

export async function POST(request: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
  }
  try {
    const data = await getCastConversationSummary(parsed.data.castHash);
    return NextResponse.json(data);
  } catch (err) {
    logger.error('Summary error:', err);
    return NextResponse.json({ error: 'Failed to get summary' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/casts/delete/route.ts src/app/api/casts/summary/route.ts
git commit -m "feat: add cast delete and AI thread summary API routes"
```

---

### Task 5: Storage Usage API Route

**Files:**
- Create: `src/app/api/users/storage/route.ts`

- [ ] **Step 1: Create storage route**

```typescript
import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { getStorageUsage } from '@/lib/farcaster/neynar';
import { logger } from '@/lib/logger';

export async function GET() {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const data = await getStorageUsage(session.fid);
    return NextResponse.json(data);
  } catch (err) {
    logger.error('Storage error:', err);
    return NextResponse.json({ error: 'Failed to get storage' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/users/storage/route.ts
git commit -m "feat: add storage usage API route"
```

---

### Task 6: Add DC Intent Link and Mute/Block Menu to FollowerCard

**Files:**
- Modify: `src/components/social/FollowerCard.tsx`

- [ ] **Step 1: Read the current FollowerCard component**

Read `src/components/social/FollowerCard.tsx` fully to understand props and layout.

- [ ] **Step 2: Add DC intent link**

Add a "Message" button/link to each follower card that opens `https://farcaster.xyz/~/inbox/create/${user.fid}` in a new tab. Place next to the follow button.

- [ ] **Step 3: Add three-dot menu with mute/block**

Add a `...` dropdown menu with "Mute" and "Block" options. On click, call `/api/users/mute` or `/api/users/block` POST.

- [ ] **Step 4: Commit**

```bash
git add src/components/social/FollowerCard.tsx
git commit -m "feat: add DC intent link and mute/block menu to FollowerCard"
```

---

### Task 7: Add Storage Section to Settings Page

**Files:**
- Modify: `src/app/(auth)/settings/SettingsClient.tsx`

- [ ] **Step 1: Read SettingsClient.tsx** to find where to add the storage section

- [ ] **Step 2: Add storage usage display**

Add a "Farcaster Storage" section that fetches from `/api/users/storage` and displays:
- Total units allocated
- Units used (casts, reactions, follows, etc.)
- Usage bar with percentage
- Warning when > 80% full

Style: same pattern as other settings sections (navy card, gold accent for bars).

- [ ] **Step 3: Commit**

```bash
git add src/app/(auth)/settings/SettingsClient.tsx
git commit -m "feat: add Farcaster storage usage section to settings"
```

---

### Task 8: Add neynarActions.ts Client Functions

**Files:**
- Modify: `src/lib/farcaster/neynarActions.ts`

- [ ] **Step 1: Add client-side action functions**

```typescript
export async function muteUserAction(targetFid: number) {
  const res = await fetch('/api/users/mute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetFid }),
  });
  if (!res.ok) throw new Error('Failed to mute user');
  return res.json();
}

export async function unmuteUserAction(targetFid: number) {
  const res = await fetch('/api/users/mute', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetFid }),
  });
  if (!res.ok) throw new Error('Failed to unmute user');
  return res.json();
}

export async function blockUserAction(targetFid: number) {
  const res = await fetch('/api/users/block', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetFid }),
  });
  if (!res.ok) throw new Error('Failed to block user');
  return res.json();
}

export async function unblockUserAction(targetFid: number) {
  const res = await fetch('/api/users/block', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetFid }),
  });
  if (!res.ok) throw new Error('Failed to unblock user');
  return res.json();
}

export async function deleteCastAction(castHash: string) {
  const res = await fetch('/api/casts/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ castHash }),
  });
  if (!res.ok) throw new Error('Failed to delete cast');
  return res.json();
}

export async function getCastSummary(castHash: string) {
  const res = await fetch('/api/casts/summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ castHash }),
  });
  if (!res.ok) throw new Error('Failed to get summary');
  return res.json();
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/farcaster/neynarActions.ts
git commit -m "feat: add client-side mute/block/delete/summary action functions"
```
