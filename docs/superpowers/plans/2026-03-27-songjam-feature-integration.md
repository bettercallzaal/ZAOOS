# Songjam Feature Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port 4 Songjam features into ZAO OS as standalone primitives: Neynar cast actions, mindshare leaderboard, Stream.io audio rooms, and 100ms live audio.

**Architecture:** Each feature is self-contained and shippable independently. All use ZAO's existing Farcaster auth (iron-session with `SessionData`) and Supabase. Firebase is fully replaced. Two new audio SDKs added.

**Tech Stack:** Next.js 16, React 19, Supabase (Realtime), Stream.io SDK, 100ms SDK, Neynar API v2, Tailwind v4

**Spec:** `docs/superpowers/specs/2026-03-27-songjam-feature-integration-design.md`

---

## File Structure

### New Files
```
src/app/api/neynar/cast/route.ts          # Publish cast to Farcaster
src/app/api/neynar/like/route.ts           # Like a cast
src/app/api/neynar/recast/route.ts         # Recast
src/app/api/neynar/follow/route.ts         # Follow a user
src/lib/farcaster/neynarActions.ts         # Client-side wrapper for neynar API routes
src/app/api/stream/token/route.ts          # Stream.io user token generation
src/lib/spaces/streamHelpers.ts            # Stream SDK utility functions
src/lib/spaces/roomsDb.ts                  # Supabase CRUD for Stream rooms
src/components/spaces/RoomList.tsx          # Real-time live room list
src/components/spaces/RoomCard.tsx          # Individual room preview card
src/components/spaces/HostRoomModal.tsx     # Create room form modal
src/components/spaces/RoomView.tsx          # Stream audio room container
src/components/spaces/ParticipantsPanel.tsx # Speakers + listeners grid
src/components/spaces/DescriptionPanel.tsx  # Room title, share link, stats
src/components/spaces/MicButton.tsx         # Mute / unmute / request to speak
src/components/spaces/LiveButton.tsx        # Go live / end live
src/components/spaces/ControlsPanel.tsx     # MicButton + LiveButton container
src/components/spaces/PermissionRequests.tsx# Host approves/denies speakers
src/app/(auth)/spaces/[id]/page.tsx        # Individual room page
src/app/api/100ms/token/route.ts           # 100ms token generation
src/lib/social/msRoomsDb.ts               # Supabase CRUD for 100ms rooms
src/components/social/LiveAudioRoom.tsx     # 100ms audio room (ported)
src/components/social/MiniSpaceBanner.tsx   # Compact live room banner
src/components/respect/MindshareLeaderboard.tsx # Treemap + stats + table
src/components/respect/Treemap.tsx          # Squarify layout algorithm
src/components/respect/MobileLeaderboard.tsx# Cascade grid for mobile
src/components/respect/StatsBar.tsx         # Summary stats row
scripts/setup-rooms-tables.sql             # Supabase migration SQL
```

### Modified Files
```
src/app/(auth)/spaces/page.tsx             # Replace iframe with native RoomList
src/app/(auth)/social/page.tsx             # Add LiveAudioRoom section
src/app/(auth)/respect/page.tsx            # Add MindshareLeaderboard toggle
src/middleware.ts                          # Add rate limits for new API routes
package.json                               # Add Stream + 100ms deps
.env.example                               # Add new env vars
```

---

## Task 1: Install Dependencies + Env Setup

**Files:**
- Modify: `package.json`
- Modify: `.env.example`

- [ ] **Step 1: Install Stream.io + 100ms packages**

Run:
```bash
npm install @stream-io/video-react-sdk @stream-io/node-sdk @100mslive/react-sdk @100mslive/hms-video-store
```

Expected: Packages added to `package.json` dependencies, no errors.

- [ ] **Step 2: Add new env vars to .env.example**

Append to `.env.example`:
```env
# Stream.io (Audio Rooms - /spaces)
NEXT_PUBLIC_STREAM_API_KEY=
STREAM_API_SECRET=

# 100ms (Live Audio - /social)
NEXT_PUBLIC_100MS_ACCESS_KEY=
HMS_APP_SECRET=
NEXT_PUBLIC_100MS_TEMPLATE_ID=
```

- [ ] **Step 3: Add rate limits for new routes in middleware**

Add to the rate limit config in `src/middleware.ts`:
```typescript
'/api/neynar': { windowMs: 60_000, max: 15 },
'/api/stream': { windowMs: 60_000, max: 20 },
'/api/100ms': { windowMs: 60_000, max: 20 },
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .env.example src/middleware.ts
git commit -m "feat: add Stream.io + 100ms dependencies and env vars"
```

---

## Task 2: Supabase Schema — Rooms Tables

**Files:**
- Create: `scripts/setup-rooms-tables.sql`

- [ ] **Step 1: Write migration SQL**

Create `scripts/setup-rooms-tables.sql`:
```sql
-- Stream.io audio rooms (for /spaces)
CREATE TABLE IF NOT EXISTS rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  host_fid BIGINT NOT NULL,
  host_name TEXT NOT NULL,
  host_username TEXT NOT NULL,
  host_pfp TEXT,
  stream_call_id TEXT UNIQUE NOT NULL,
  state TEXT NOT NULL DEFAULT 'live' CHECK (state IN ('live', 'ended')),
  created_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  participant_count INTEGER DEFAULT 1
);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rooms_select" ON rooms FOR SELECT USING (true);
CREATE POLICY "rooms_insert" ON rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "rooms_update" ON rooms FOR UPDATE USING (true);

-- Enable Realtime for rooms
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;

-- 100ms live audio rooms (for /social)
CREATE TABLE IF NOT EXISTS ms_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  host_fid BIGINT NOT NULL,
  host_name TEXT NOT NULL,
  room_id_100ms TEXT,
  state TEXT NOT NULL DEFAULT 'active' CHECK (state IN ('active', 'ended')),
  settings JSONB DEFAULT '{}',
  pinned_links JSONB DEFAULT '[]',
  speakers JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  participant_count INTEGER DEFAULT 1
);

ALTER TABLE ms_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ms_rooms_select" ON ms_rooms FOR SELECT USING (true);
CREATE POLICY "ms_rooms_insert" ON ms_rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "ms_rooms_update" ON ms_rooms FOR UPDATE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE ms_rooms;

-- Speaker requests for 100ms rooms
CREATE TABLE IF NOT EXISTS speaker_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES ms_rooms(id) ON DELETE CASCADE,
  requester_fid BIGINT NOT NULL,
  requester_name TEXT NOT NULL,
  peer_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE speaker_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "speaker_requests_select" ON speaker_requests FOR SELECT USING (true);
CREATE POLICY "speaker_requests_insert" ON speaker_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "speaker_requests_update" ON speaker_requests FOR UPDATE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE speaker_requests;

-- Audio room participation points
CREATE TABLE IF NOT EXISTS space_participant_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_fid BIGINT NOT NULL,
  username TEXT NOT NULL,
  room_id UUID NOT NULL,
  room_type TEXT NOT NULL CHECK (room_type IN ('stream', '100ms')),
  points INTEGER DEFAULT 0,
  role TEXT NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL,
  left_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE space_participant_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "points_select" ON space_participant_points FOR SELECT USING (true);
CREATE POLICY "points_insert" ON space_participant_points FOR INSERT WITH CHECK (true);
```

- [ ] **Step 2: Run migration against Supabase**

Run in Supabase SQL Editor or via CLI:
```bash
# If using Supabase CLI:
npx supabase db push
# Or paste the SQL into the Supabase Dashboard SQL Editor
```

- [ ] **Step 3: Commit**

```bash
git add scripts/setup-rooms-tables.sql
git commit -m "feat: add Supabase schema for audio rooms and speaker requests"
```

---

## Task 3: Neynar Cast Actions — API Routes

**Files:**
- Create: `src/app/api/neynar/cast/route.ts`
- Create: `src/app/api/neynar/like/route.ts`
- Create: `src/app/api/neynar/recast/route.ts`
- Create: `src/app/api/neynar/follow/route.ts`
- Create: `src/lib/farcaster/neynarActions.ts`

- [ ] **Step 1: Create cast route**

Create `src/app/api/neynar/cast/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';

const CastSchema = z.object({
  text: z.string().min(1).max(1024),
  embeds: z.array(z.string().url()).optional().default([]),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session?.signerUuid) {
      return NextResponse.json({ error: 'Unauthorized — no signer' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CastSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { text, embeds } = parsed.data;
    const response = await fetch('https://api.neynar.com/v2/farcaster/cast', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.NEYNAR_API_KEY!,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        signer_uuid: session.signerUuid,
        text,
        embeds: embeds.map((url) => ({ url })),
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Neynar cast error:', data);
      return NextResponse.json({ error: 'Failed to publish cast' }, { status: 500 });
    }

    return NextResponse.json({ success: true, cast: data.cast });
  } catch (error) {
    console.error('Cast route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create like route**

Create `src/app/api/neynar/like/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';

const LikeSchema = z.object({
  castHash: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session?.signerUuid) {
      return NextResponse.json({ error: 'Unauthorized — no signer' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = LikeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const response = await fetch('https://api.neynar.com/v2/farcaster/reaction', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.NEYNAR_API_KEY!,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        signer_uuid: session.signerUuid,
        reaction_type: 'like',
        target: parsed.data.castHash,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Neynar like error:', data);
      return NextResponse.json({ error: 'Failed to like cast' }, { status: 500 });
    }

    return NextResponse.json({ success: true, result: data });
  } catch (error) {
    console.error('Like route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Create recast route**

Create `src/app/api/neynar/recast/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';

const RecastSchema = z.object({
  castHash: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session?.signerUuid) {
      return NextResponse.json({ error: 'Unauthorized — no signer' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = RecastSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const response = await fetch('https://api.neynar.com/v2/farcaster/reaction', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.NEYNAR_API_KEY!,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        signer_uuid: session.signerUuid,
        reaction_type: 'recast',
        target: parsed.data.castHash,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Neynar recast error:', data);
      return NextResponse.json({ error: 'Failed to recast' }, { status: 500 });
    }

    return NextResponse.json({ success: true, result: data });
  } catch (error) {
    console.error('Recast route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Create follow route**

Create `src/app/api/neynar/follow/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';

const FollowSchema = z.object({
  targetFid: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session?.signerUuid) {
      return NextResponse.json({ error: 'Unauthorized — no signer' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = FollowSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const response = await fetch('https://api.neynar.com/v2/farcaster/user/follow', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.NEYNAR_API_KEY!,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        signer_uuid: session.signerUuid,
        target_fids: [parsed.data.targetFid],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Neynar follow error:', data);
      return NextResponse.json({ error: 'Failed to follow user' }, { status: 500 });
    }

    return NextResponse.json({ success: true, result: data });
  } catch (error) {
    console.error('Follow route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

- [ ] **Step 5: Create client-side action wrapper**

Create `src/lib/farcaster/neynarActions.ts`:
```typescript
export async function publishCast(text: string, embeds: string[] = []) {
  const res = await fetch('/api/neynar/cast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, embeds }),
  });
  if (!res.ok) throw new Error('Failed to publish cast');
  return res.json();
}

export async function likeCast(castHash: string) {
  const res = await fetch('/api/neynar/like', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ castHash }),
  });
  if (!res.ok) throw new Error('Failed to like cast');
  return res.json();
}

export async function recastCast(castHash: string) {
  const res = await fetch('/api/neynar/recast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ castHash }),
  });
  if (!res.ok) throw new Error('Failed to recast');
  return res.json();
}

export async function followUser(targetFid: number) {
  const res = await fetch('/api/neynar/follow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetFid }),
  });
  if (!res.ok) throw new Error('Failed to follow user');
  return res.json();
}
```

- [ ] **Step 6: Verify build**

Run: `npm run build`
Expected: No type errors on the new files.

- [ ] **Step 7: Commit**

```bash
git add src/app/api/neynar/ src/lib/farcaster/neynarActions.ts
git commit -m "feat: add Neynar cast/like/recast/follow API routes and client wrapper"
```

---

## Task 4: Mindshare Leaderboard — `/respect`

**Files:**
- Create: `src/components/respect/MindshareLeaderboard.tsx`
- Create: `src/components/respect/Treemap.tsx`
- Create: `src/components/respect/MobileLeaderboard.tsx`
- Create: `src/components/respect/StatsBar.tsx`
- Modify: `src/app/(auth)/respect/page.tsx`

- [ ] **Step 1: Create Treemap component (squarify algorithm)**

Create `src/components/respect/Treemap.tsx`:
```typescript
'use client';

interface TreemapItem {
  id: string;
  name: string;
  username: string;
  value: number;
  percentage: number;
  pfpUrl?: string | null;
}

interface TreemapRect {
  item: TreemapItem;
  x: number;
  y: number;
  width: number;
  height: number;
}

function squarify(items: TreemapItem[], x: number, y: number, width: number, height: number): TreemapRect[] {
  if (items.length === 0) return [];
  if (items.length === 1) {
    return [{ item: items[0], x, y, width, height }];
  }

  const total = items.reduce((sum, item) => sum + item.value, 0);
  const isVertical = width >= height;

  const rects: TreemapRect[] = [];
  let remaining = [...items];
  let cx = x, cy = y, cw = width, ch = height;

  while (remaining.length > 0) {
    const isV = cw >= ch;
    const side = isV ? ch : cw;
    let row: TreemapItem[] = [];
    let rowTotal = 0;
    let bestAspect = Infinity;

    for (const item of remaining) {
      const testRow = [...row, item];
      const testTotal = rowTotal + item.value;
      const rowFraction = testTotal / total;
      const rowSize = isV ? cw * rowFraction : ch * rowFraction;

      let worstAspect = 0;
      for (const r of testRow) {
        const itemFraction = r.value / testTotal;
        const itemSize = side * itemFraction;
        const aspect = Math.max(rowSize / itemSize, itemSize / rowSize);
        worstAspect = Math.max(worstAspect, aspect);
      }

      if (worstAspect <= bestAspect || row.length === 0) {
        row = testRow;
        rowTotal = testTotal;
        bestAspect = worstAspect;
      } else {
        break;
      }
    }

    const rowFraction = rowTotal / total;
    const rowSize = isV ? cw * rowFraction : ch * rowFraction;
    let offset = 0;

    for (const item of row) {
      const itemFraction = item.value / rowTotal;
      const itemSize = side * itemFraction;

      if (isV) {
        rects.push({ item, x: cx, y: cy + offset, width: rowSize, height: itemSize });
      } else {
        rects.push({ item, x: cx + offset, y: cy, width: itemSize, height: rowSize });
      }
      offset += itemSize;
    }

    if (isV) {
      cx += rowSize;
      cw -= rowSize;
    } else {
      cy += rowSize;
      ch -= rowSize;
    }

    remaining = remaining.slice(row.length);
    const remainingTotal = remaining.reduce((sum, item) => sum + item.value, 0);
    if (remainingTotal > 0) {
      const scale = (total - rowTotal) / total;
      // Recalculate proportions for remaining items
    }
  }

  return rects;
}

interface TreemapProps {
  items: TreemapItem[];
  width: number;
  height: number;
  onSelect?: (item: TreemapItem) => void;
}

export function Treemap({ items, width, height, onSelect }: TreemapProps) {
  const rects = squarify(items, 0, 0, width, height);

  const colors = [
    'from-amber-500/30 to-amber-600/10',
    'from-purple-500/30 to-purple-600/10',
    'from-blue-500/30 to-blue-600/10',
    'from-emerald-500/30 to-emerald-600/10',
    'from-rose-500/30 to-rose-600/10',
    'from-cyan-500/30 to-cyan-600/10',
    'from-orange-500/30 to-orange-600/10',
    'from-indigo-500/30 to-indigo-600/10',
    'from-teal-500/30 to-teal-600/10',
    'from-pink-500/30 to-pink-600/10',
  ];

  return (
    <div className="relative" style={{ width, height }}>
      {rects.map((rect, i) => (
        <button
          key={rect.item.id}
          onClick={() => onSelect?.(rect.item)}
          className={`absolute bg-gradient-to-br ${colors[i % colors.length]} border border-white/10 rounded-lg hover:border-[#f5a623]/50 hover:scale-[1.02] transition-all duration-200 overflow-hidden flex flex-col items-center justify-center text-center p-2`}
          style={{
            left: rect.x,
            top: rect.y,
            width: rect.width,
            height: rect.height,
          }}
        >
          {rect.width > 80 && rect.height > 60 && (
            <>
              <span className="text-white font-semibold text-sm truncate max-w-full">
                {rect.item.name}
              </span>
              <span className="text-gray-400 text-xs truncate max-w-full">
                @{rect.item.username}
              </span>
              <span className="text-[#f5a623] font-bold text-lg mt-1">
                {rect.item.percentage.toFixed(1)}%
              </span>
            </>
          )}
          {rect.width <= 80 && (
            <span className="text-[#f5a623] font-bold text-sm">
              {rect.item.percentage.toFixed(0)}%
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export type { TreemapItem };
```

- [ ] **Step 2: Create StatsBar component**

Create `src/components/respect/StatsBar.tsx`:
```typescript
'use client';

interface StatsBarProps {
  totalMembers: number;
  totalRespect: number;
  topSharePercent: number;
  leaderName: string;
}

export function StatsBar({ totalMembers, totalRespect, topSharePercent, leaderName }: StatsBarProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <div className="bg-[#0d1b2a] rounded-xl p-4 border border-gray-800">
        <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Contributors</div>
        <div className="text-white text-xl font-bold">{totalMembers}</div>
      </div>
      <div className="bg-[#0d1b2a] rounded-xl p-4 border border-gray-800">
        <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Total Respect</div>
        <div className="text-white text-xl font-bold">{totalRespect.toLocaleString()}</div>
      </div>
      <div className="bg-[#0d1b2a] rounded-xl p-4 border border-gray-800">
        <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Top Share</div>
        <div className="text-[#f5a623] text-xl font-bold">{topSharePercent.toFixed(1)}%</div>
      </div>
      <div className="bg-[#0d1b2a] rounded-xl p-4 border border-gray-800">
        <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Leader</div>
        <div className="text-white text-xl font-bold truncate">{leaderName}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create MobileLeaderboard component**

Create `src/components/respect/MobileLeaderboard.tsx`:
```typescript
'use client';

import type { TreemapItem } from './Treemap';

interface MobileLeaderboardProps {
  items: TreemapItem[];
  onSelect?: (item: TreemapItem) => void;
}

export function MobileLeaderboard({ items, onSelect }: MobileLeaderboardProps) {
  const sizeClasses = [
    'col-span-6 h-48', // #1
    'col-span-3 h-40', // #2
    'col-span-3 h-40', // #3
    'col-span-3 h-32', // #4
    'col-span-3 h-32', // #5
    'col-span-2 h-28', // #6
    'col-span-2 h-28', // #7
    'col-span-2 h-28', // #8
    'col-span-3 h-24', // #9
    'col-span-3 h-24', // #10
  ];

  return (
    <div className="grid grid-cols-6 gap-2">
      {items.slice(0, 10).map((item, i) => (
        <button
          key={item.id}
          onClick={() => onSelect?.(item)}
          className={`${sizeClasses[i] || 'col-span-2 h-24'} bg-gradient-to-br from-[#1a2a3a] to-[#0d1b2a] border border-gray-800 rounded-xl flex flex-col items-center justify-center p-3 hover:border-[#f5a623]/50 transition-colors`}
        >
          <div className="text-[#f5a623] text-xs font-bold mb-1">#{i + 1}</div>
          <div className="text-white font-semibold text-sm truncate max-w-full">{item.name}</div>
          <div className="text-gray-400 text-xs truncate max-w-full">@{item.username}</div>
          <div className="text-[#f5a623] font-bold text-lg mt-1">{item.percentage.toFixed(1)}%</div>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create MindshareLeaderboard main component**

Create `src/components/respect/MindshareLeaderboard.tsx`:
```typescript
'use client';

import { useState, useMemo } from 'react';
import { Treemap, type TreemapItem } from './Treemap';
import { MobileLeaderboard } from './MobileLeaderboard';
import { StatsBar } from './StatsBar';

interface LeaderboardEntry {
  rank: number;
  name: string;
  wallet: string;
  fid: number | null;
  totalRespect: number;
  username?: string;
  pfpUrl?: string | null;
}

interface MindshareLeaderboardProps {
  entries: LeaderboardEntry[];
}

export function MindshareLeaderboard({ entries }: MindshareLeaderboardProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { items, totalRespect } = useMemo(() => {
    const total = entries.reduce((sum, e) => sum + e.totalRespect, 0);
    const mapped: TreemapItem[] = entries.slice(0, 10).map((e) => ({
      id: e.wallet,
      name: e.name,
      username: e.username || e.wallet.slice(0, 8),
      value: e.totalRespect,
      percentage: total > 0 ? (e.totalRespect / total) * 100 : 0,
      pfpUrl: e.pfpUrl,
    }));
    return { items: mapped, totalRespect: total };
  }, [entries]);

  const topEntry = items[0];

  return (
    <div>
      <StatsBar
        totalMembers={entries.length}
        totalRespect={totalRespect}
        topSharePercent={topEntry?.percentage || 0}
        leaderName={topEntry?.name || '—'}
      />

      {/* Desktop treemap */}
      <div className="hidden md:block mb-8">
        <Treemap
          items={items}
          width={800}
          height={450}
          onSelect={(item) => setSelectedId(item.id)}
        />
      </div>

      {/* Mobile cascade */}
      <div className="md:hidden mb-8">
        <MobileLeaderboard
          items={items}
          onSelect={(item) => setSelectedId(item.id)}
        />
      </div>

      {/* Full table */}
      <div className="bg-[#0d1b2a] rounded-xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#0d1b2a] border-b border-gray-800">
              <tr>
                <th className="text-left text-gray-500 text-xs uppercase px-4 py-3">Rank</th>
                <th className="text-left text-gray-500 text-xs uppercase px-4 py-3">Member</th>
                <th className="text-right text-gray-500 text-xs uppercase px-4 py-3">Respect</th>
                <th className="text-right text-gray-500 text-xs uppercase px-4 py-3">Share</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const pct = totalRespect > 0 ? (entry.totalRespect / totalRespect) * 100 : 0;
                return (
                  <tr
                    key={entry.wallet}
                    className={`border-b border-gray-800/50 hover:bg-[#1a2a3a]/50 transition-colors ${
                      selectedId === entry.wallet ? 'bg-[#1a2a3a]' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-gray-400 font-mono">{entry.rank}</td>
                    <td className="px-4 py-3">
                      <div className="text-white font-medium">{entry.name}</div>
                      {entry.username && (
                        <div className="text-gray-500 text-xs">@{entry.username}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-white font-mono">
                      {entry.totalRespect.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-[#f5a623] font-mono">
                      {pct.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Add mindshare view toggle to respect page**

In `src/app/(auth)/respect/page.tsx`, add an import and toggle above the existing `RespectLeaderboard`. The exact modification depends on the current page structure — add a tab/toggle that switches between the existing table view and the new `MindshareLeaderboard` component. Pass the same `leaderboard` data fetched from `/api/respect/leaderboard` to `MindshareLeaderboard` via its `entries` prop.

- [ ] **Step 6: Verify build**

Run: `npm run build`
Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/respect/ src/app/\(auth\)/respect/page.tsx
git commit -m "feat: add mindshare treemap leaderboard to /respect page"
```

---

## Task 5: Stream.io Audio Rooms — Database + Helpers

**Files:**
- Create: `src/lib/spaces/roomsDb.ts`
- Create: `src/lib/spaces/streamHelpers.ts`
- Create: `src/app/api/stream/token/route.ts`

- [ ] **Step 1: Create rooms database service**

Create `src/lib/spaces/roomsDb.ts`:
```typescript
import { supabaseAdmin } from '@/lib/db/supabase';

export interface Room {
  id: string;
  title: string;
  description: string | null;
  host_fid: number;
  host_name: string;
  host_username: string;
  host_pfp: string | null;
  stream_call_id: string;
  state: 'live' | 'ended';
  created_at: string;
  ended_at: string | null;
  participant_count: number;
}

export async function createRoom(data: {
  title: string;
  description?: string;
  hostFid: number;
  hostName: string;
  hostUsername: string;
  hostPfp?: string;
  streamCallId: string;
}): Promise<Room> {
  const { data: room, error } = await supabaseAdmin
    .from('rooms')
    .insert({
      title: data.title,
      description: data.description || null,
      host_fid: data.hostFid,
      host_name: data.hostName,
      host_username: data.hostUsername,
      host_pfp: data.hostPfp || null,
      stream_call_id: data.streamCallId,
      state: 'live',
      participant_count: 1,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create room: ${error.message}`);
  return room;
}

export async function getRoomById(id: string): Promise<Room | null> {
  const { data, error } = await supabaseAdmin
    .from('rooms')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

export async function getLiveRooms(): Promise<Room[]> {
  const { data, error } = await supabaseAdmin
    .from('rooms')
    .select('*')
    .eq('state', 'live')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch rooms: ${error.message}`);
  return data || [];
}

export async function endRoom(id: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('rooms')
    .update({ state: 'ended', ended_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(`Failed to end room: ${error.message}`);
}

export async function incrementParticipants(id: string): Promise<void> {
  const { error } = await supabaseAdmin.rpc('increment_room_participants', { room_id: id });
  // Fallback if RPC not set up:
  if (error) {
    const { data } = await supabaseAdmin.from('rooms').select('participant_count').eq('id', id).single();
    if (data) {
      await supabaseAdmin.from('rooms').update({ participant_count: data.participant_count + 1 }).eq('id', id);
    }
  }
}

export async function decrementParticipants(id: string): Promise<void> {
  const { data } = await supabaseAdmin.from('rooms').select('participant_count').eq('id', id).single();
  if (data && data.participant_count > 0) {
    await supabaseAdmin.from('rooms').update({ participant_count: data.participant_count - 1 }).eq('id', id);
  }
}
```

- [ ] **Step 2: Create Stream SDK helpers**

Create `src/lib/spaces/streamHelpers.ts`:
```typescript
import type { User } from '@stream-io/video-react-sdk';

export function generateCallId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function createStreamUser(session: {
  fid: number;
  displayName: string;
  username: string;
  pfpUrl?: string | null;
}): User {
  return {
    id: String(session.fid),
    name: session.displayName || session.username,
    image: session.pfpUrl || undefined,
  };
}

export function createGuestUser(): User {
  const guestId = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  return {
    id: guestId,
    name: 'Guest Listener',
    type: 'guest',
  };
}
```

- [ ] **Step 3: Create Stream token API route**

Create `src/app/api/stream/token/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { StreamClient } from '@stream-io/node-sdk';
import { z } from 'zod';

const TokenSchema = z.object({
  userId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    const apiSecret = process.env.STREAM_API_SECRET;

    if (!apiKey || !apiSecret) {
      console.error('Stream.io keys missing');
      return NextResponse.json({ error: 'Stream configuration missing' }, { status: 500 });
    }

    const body = await req.json();
    const parsed = TokenSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const client = new StreamClient(apiKey, apiSecret);
    const token = client.generateUserToken({ user_id: parsed.data.userId });

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Stream token error:', error);
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/spaces/ src/app/api/stream/
git commit -m "feat: add Stream.io room database service, helpers, and token route"
```

---

## Task 6: Stream.io Audio Rooms — UI Components

**Files:**
- Create: `src/components/spaces/RoomCard.tsx`
- Create: `src/components/spaces/RoomList.tsx`
- Create: `src/components/spaces/HostRoomModal.tsx`
- Create: `src/components/spaces/DescriptionPanel.tsx`
- Create: `src/components/spaces/MicButton.tsx`
- Create: `src/components/spaces/LiveButton.tsx`
- Create: `src/components/spaces/ControlsPanel.tsx`
- Create: `src/components/spaces/PermissionRequests.tsx`
- Create: `src/components/spaces/ParticipantsPanel.tsx`
- Create: `src/components/spaces/RoomView.tsx`

- [ ] **Step 1: Create RoomCard**

Create `src/components/spaces/RoomCard.tsx`:
```typescript
'use client';

import type { Room } from '@/lib/spaces/roomsDb';

interface RoomCardProps {
  room: Room;
  isOwner: boolean;
  onJoin: (room: Room) => void;
}

export function RoomCard({ room, isOwner, onJoin }: RoomCardProps) {
  return (
    <div className="bg-[#0d1b2a] border border-gray-800 rounded-xl p-5 hover:border-[#f5a623]/30 transition-all duration-200 group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </span>
          <span className="text-green-400 text-xs font-medium">Live</span>
        </div>
        {isOwner && (
          <span className="text-[10px] bg-[#f5a623]/20 text-[#f5a623] px-2 py-0.5 rounded-full">
            Your Room
          </span>
        )}
      </div>

      <h3 className="text-white font-semibold text-lg mb-1 group-hover:text-[#f5a623] transition-colors">
        {room.title}
      </h3>
      {room.description && (
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">{room.description}</p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {room.host_pfp && (
            <img src={room.host_pfp} alt="" className="w-6 h-6 rounded-full" />
          )}
          <div>
            <span className="text-gray-300 text-xs">{room.host_name}</span>
            <span className="text-gray-600 text-xs ml-1">@{room.host_username}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-500 text-xs">{room.participant_count} listening</span>
          <button
            onClick={() => onJoin(room)}
            className="px-4 py-1.5 bg-[#f5a623] hover:bg-[#ffd700] text-[#0a1628] text-sm font-semibold rounded-lg transition-colors"
          >
            Join
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create RoomList with Supabase Realtime**

Create `src/components/spaces/RoomList.tsx`:
```typescript
'use client';

import { useState, useEffect } from 'react';
import { getSupabaseBrowser } from '@/lib/db/supabase';
import type { Room } from '@/lib/spaces/roomsDb';
import { RoomCard } from './RoomCard';

interface RoomListProps {
  currentFid?: number;
  onJoinRoom: (room: Room) => void;
  onHostRoom: () => void;
  isAuthenticated: boolean;
}

export function RoomList({ currentFid, onJoinRoom, onHostRoom, isAuthenticated }: RoomListProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowser();

    // Initial fetch
    supabase
      .from('rooms')
      .select('*')
      .eq('state', 'live')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setRooms(data || []);
        setLoading(false);
      });

    // Real-time subscription
    const channel = supabase
      .channel('live-rooms')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms', filter: 'state=eq.live' },
        () => {
          // Refetch on any change
          supabase
            .from('rooms')
            .select('*')
            .eq('state', 'live')
            .order('created_at', { ascending: false })
            .then(({ data }) => setRooms(data || []));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[#0d1b2a] border border-gray-800 rounded-xl p-5 animate-pulse h-40" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-white text-lg font-semibold">Live Rooms</h2>
          {rooms.length > 0 && (
            <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full font-medium">
              {rooms.length} live
            </span>
          )}
        </div>
        {isAuthenticated && (
          <button
            onClick={onHostRoom}
            className="px-4 py-2 bg-[#f5a623] hover:bg-[#ffd700] text-[#0a1628] text-sm font-semibold rounded-lg transition-colors"
          >
            Host Room
          </button>
        )}
      </div>

      {rooms.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <div className="text-4xl mb-3">🎙️</div>
          <p className="text-lg mb-2">No live rooms yet</p>
          <p className="text-sm">Be the first to host a room</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              isOwner={currentFid === room.host_fid}
              onJoin={onJoinRoom}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create HostRoomModal**

Create `src/components/spaces/HostRoomModal.tsx`:
```typescript
'use client';

import { useState } from 'react';

interface HostRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (title: string, description: string) => Promise<void>;
}

export function HostRoomModal({ isOpen, onClose, onCreateRoom }: HostRoomModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await onCreateRoom(title.trim(), description.trim());
      setTitle('');
      setDescription('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-[#0d1b2a] border border-gray-800 rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-white text-xl font-bold mb-4">Host a Room</h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="text-gray-400 text-sm mb-1 block">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              placeholder="What's this room about?"
              className="w-full bg-[#0a1628] border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:border-[#f5a623] focus:outline-none transition-colors"
              disabled={loading}
            />
            <div className="text-gray-600 text-xs mt-1 text-right">{title.length}/100</div>
          </div>

          <div className="mb-6">
            <label className="text-gray-400 text-sm mb-1 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Optional description..."
              className="w-full bg-[#0a1628] border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:border-[#f5a623] focus:outline-none transition-colors resize-none"
              disabled={loading}
            />
            <div className="text-gray-600 text-xs mt-1 text-right">{description.length}/500</div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || loading}
              className="flex-1 px-4 py-2.5 bg-[#f5a623] text-[#0a1628] rounded-lg text-sm font-semibold hover:bg-[#ffd700] transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create audio room UI components**

Create `src/components/spaces/DescriptionPanel.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { useCallStateHooks } from '@stream-io/video-react-sdk';

export function DescriptionPanel() {
  const { useCallCustomData, useParticipantCount } = useCallStateHooks();
  const custom = useCallCustomData();
  const participantCount = useParticipantCount();
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="px-6 py-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-white text-lg font-bold">{custom?.title || 'Audio Room'}</h2>
          {custom?.description && (
            <p className="text-gray-400 text-sm mt-1">{custom.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-gray-400 text-xs">{participantCount}</span>
          </div>
          <button
            onClick={handleShare}
            className="text-gray-400 hover:text-white text-xs px-3 py-1 border border-gray-700 rounded-lg transition-colors"
          >
            {copied ? 'Copied!' : 'Share'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

Create `src/components/spaces/MicButton.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { useCallStateHooks, useCall, OwnCapability } from '@stream-io/video-react-sdk';

export function MicButton() {
  const call = useCall();
  const { useLocalParticipant, useMicrophoneState, useHasPermissions } = useCallStateHooks();
  const localParticipant = useLocalParticipant();
  const { microphone, isMute } = useMicrophoneState();
  const canSendAudio = useHasPermissions(OwnCapability.SEND_AUDIO);
  const [requesting, setRequesting] = useState(false);

  if (!localParticipant) return null;

  if (!canSendAudio) {
    return (
      <button
        onClick={async () => {
          setRequesting(true);
          try {
            await call?.requestPermissions({ permissions: [OwnCapability.SEND_AUDIO] });
          } catch {
            setRequesting(false);
          }
        }}
        disabled={requesting}
        className="px-6 py-2.5 bg-[#f5a623] hover:bg-[#ffd700] text-[#0a1628] rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
      >
        {requesting ? 'Requesting...' : 'Request to Speak'}
      </button>
    );
  }

  return (
    <button
      onClick={() => microphone.toggle()}
      className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
        isMute
          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          : 'bg-green-600 text-white hover:bg-green-500'
      }`}
    >
      {isMute ? 'Unmute' : 'Mute'}
    </button>
  );
}
```

Create `src/components/spaces/LiveButton.tsx`:
```typescript
'use client';

import { useCall, useCallStateHooks } from '@stream-io/video-react-sdk';

export function LiveButton() {
  const call = useCall();
  const { useIsCallLive } = useCallStateHooks();
  const isLive = useIsCallLive();

  return (
    <button
      onClick={() => (isLive ? call?.stopLive() : call?.goLive())}
      className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 ${
        isLive
          ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30'
          : 'bg-emerald-600 text-white hover:bg-emerald-500'
      }`}
    >
      {isLive && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
      )}
      {isLive ? 'End Live' : 'Go Live'}
    </button>
  );
}
```

Create `src/components/spaces/ControlsPanel.tsx`:
```typescript
'use client';

import { MicButton } from './MicButton';
import { LiveButton } from './LiveButton';

export function ControlsPanel({ isHost }: { isHost: boolean }) {
  return (
    <div className="flex items-center justify-center gap-4 px-6 py-4">
      <MicButton />
      {isHost && <LiveButton />}
    </div>
  );
}
```

Create `src/components/spaces/PermissionRequests.tsx`:
```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCall, type PermissionRequestEvent } from '@stream-io/video-react-sdk';

export function PermissionRequests() {
  const call = useCall();
  const [requests, setRequests] = useState<PermissionRequestEvent[]>([]);

  useEffect(() => {
    if (!call) return;
    const unsub = call.on('call.permission_request', (event: PermissionRequestEvent) => {
      setRequests((prev) => [...prev, event]);
    });
    return unsub;
  }, [call]);

  const handleGrant = useCallback(
    async (request: PermissionRequestEvent) => {
      await call?.grantPermissions(request.user.id, request.permissions);
      setRequests((prev) => prev.filter((r) => r.user.id !== request.user.id));
    },
    [call]
  );

  const handleDeny = useCallback(
    (request: PermissionRequestEvent) => {
      setRequests((prev) => prev.filter((r) => r.user.id !== request.user.id));
    },
    []
  );

  if (requests.length === 0) return null;

  return (
    <div className="px-4 py-2 border-b border-gray-800">
      {requests.map((request) => (
        <div key={request.user.id} className="flex items-center justify-between py-1.5">
          <span className="text-gray-300 text-sm">
            <strong>{request.user.name || request.user.id}</strong> wants to speak
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handleGrant(request)}
              className="text-xs px-3 py-1 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30"
            >
              Allow
            </button>
            <button
              onClick={() => handleDeny(request)}
              className="text-xs px-3 py-1 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30"
            >
              Deny
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

Create `src/components/spaces/ParticipantsPanel.tsx`:
```typescript
'use client';

import { useCallStateHooks, hasAudio, ParticipantsAudio } from '@stream-io/video-react-sdk';

export function ParticipantsPanel() {
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();

  const speakers = participants.filter((p) => hasAudio(p));
  const listeners = participants.filter((p) => !hasAudio(p));

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4">
      <ParticipantsAudio participants={participants} />

      {speakers.length > 0 && (
        <div className="mb-6">
          <h3 className="text-gray-500 text-xs uppercase tracking-wider mb-3">
            Speakers ({speakers.length})
          </h3>
          <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
            {speakers.map((p) => (
              <div key={p.sessionId} className="flex flex-col items-center">
                <div className={`w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold border-2 ${p.isSpeaking ? 'border-green-400 scale-110' : 'border-transparent'} transition-all`}>
                  {p.image ? (
                    <img src={p.image} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span>{(p.name || '?')[0]}</span>
                  )}
                </div>
                <span className="text-white text-xs mt-1 truncate max-w-[60px]">{p.name}</span>
                {p.isSpeaking && (
                  <span className="text-green-400 text-[10px] animate-pulse">speaking</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {listeners.length > 0 && (
        <div>
          <h3 className="text-gray-500 text-xs uppercase tracking-wider mb-3">
            Listeners ({listeners.length})
          </h3>
          <div className="grid grid-cols-5 md:grid-cols-6 gap-3">
            {listeners.map((p) => (
              <div key={p.sessionId} className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 text-sm">
                  {p.image ? (
                    <img src={p.image} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span>{(p.name || '?')[0]}</span>
                  )}
                </div>
                <span className="text-gray-400 text-[10px] mt-1 truncate max-w-[50px]">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {participants.length === 0 && (
        <div className="text-center text-gray-500 py-8">Waiting for participants...</div>
      )}
    </div>
  );
}
```

Create `src/components/spaces/RoomView.tsx`:
```typescript
'use client';

import { DescriptionPanel } from './DescriptionPanel';
import { ParticipantsPanel } from './ParticipantsPanel';
import { ControlsPanel } from './ControlsPanel';
import { PermissionRequests } from './PermissionRequests';

interface RoomViewProps {
  isHost: boolean;
}

export function RoomView({ isHost }: RoomViewProps) {
  return (
    <div className="flex flex-col h-full bg-[#0a1628]">
      <div className="border-b border-gray-800 bg-[#0d1b2a]">
        <DescriptionPanel />
      </div>
      {isHost && <PermissionRequests />}
      <ParticipantsPanel />
      <div className="border-t border-gray-800 bg-[#0d1b2a]">
        <ControlsPanel isHost={isHost} />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: No errors (components are not yet wired to pages, but should compile).

- [ ] **Step 6: Commit**

```bash
git add src/components/spaces/
git commit -m "feat: add Stream.io audio room UI components"
```

---

## Task 7: Stream.io Audio Rooms — Pages

**Files:**
- Modify: `src/app/(auth)/spaces/page.tsx`
- Create: `src/app/(auth)/spaces/[id]/page.tsx`

- [ ] **Step 1: Replace /spaces page with native room list**

Rewrite `src/app/(auth)/spaces/page.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { RoomList } from '@/components/spaces/RoomList';
import { HostRoomModal } from '@/components/spaces/HostRoomModal';
import { createRoom } from '@/lib/spaces/roomsDb';
import { generateCallId } from '@/lib/spaces/streamHelpers';
import { NotificationBell } from '@/components/navigation/NotificationBell';
import type { Room } from '@/lib/spaces/roomsDb';

export default function SpacesPage() {
  const router = useRouter();
  const { session } = useAuth();
  const [showHostModal, setShowHostModal] = useState(false);

  const handleCreateRoom = async (title: string, description: string) => {
    if (!session) throw new Error('Not authenticated');

    const streamCallId = generateCallId();
    const room = await createRoom({
      title,
      description,
      hostFid: session.fid,
      hostName: session.displayName,
      hostUsername: session.username,
      hostPfp: session.pfpUrl,
      streamCallId,
    });

    router.push(`/spaces/${room.id}`);
  };

  const handleJoinRoom = (room: Room) => {
    router.push(`/spaces/${room.id}`);
  };

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white flex flex-col">
      <header className="px-4 py-3 border-b border-gray-800 bg-[#0d1b2a] flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm text-gray-300">Spaces</h2>
          <div className="md:hidden"><NotificationBell /></div>
        </div>
      </header>

      <div className="flex-1 px-4 py-6 max-w-4xl mx-auto w-full">
        <RoomList
          currentFid={session?.fid}
          onJoinRoom={handleJoinRoom}
          onHostRoom={() => setShowHostModal(true)}
          isAuthenticated={!!session}
        />
      </div>

      <HostRoomModal
        isOpen={showHostModal}
        onClose={() => setShowHostModal(false)}
        onCreateRoom={handleCreateRoom}
      />
    </div>
  );
}
```

- [ ] **Step 2: Create /spaces/[id] room page**

Create `src/app/(auth)/spaces/[id]/page.tsx`:
```typescript
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { StreamCall, StreamVideo, StreamVideoClient, type User, type Call } from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import { useAuth } from '@/hooks/useAuth';
import { getRoomById, endRoom } from '@/lib/spaces/roomsDb';
import { createStreamUser, createGuestUser } from '@/lib/spaces/streamHelpers';
import { RoomView } from '@/components/spaces/RoomView';
import type { Room } from '@/lib/spaces/roomsDb';

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY || '';

async function fetchStreamToken(userId: string): Promise<string> {
  const res = await fetch('/api/stream/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error('Failed to generate token');
  const data = await res.json();
  return data.token;
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  const { session } = useAuth();

  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isHost = session?.fid === room?.host_fid;

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const roomData = await getRoomById(roomId);
        if (!roomData) throw new Error('Room not found');
        if (roomData.state === 'ended') throw new Error('This room has ended');
        if (mounted) setRoom(roomData);

        const streamUser: User = session
          ? createStreamUser(session)
          : createGuestUser();

        const token = await fetchStreamToken(streamUser.id);
        const newClient = new StreamVideoClient({ apiKey, user: streamUser, token });
        const newCall = newClient.call('audio_room', roomData.stream_call_id);

        const userIsHost = session?.fid === roomData.host_fid;
        if (userIsHost) {
          await newCall.join({
            create: true,
            data: {
              members: [],
              custom: { title: roomData.title, description: roomData.description || '' },
            },
          });
        } else {
          await newCall.join();
        }

        if (mounted) {
          setClient(newClient);
          setCall(newCall);
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to join room');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [roomId, session]);

  const handleLeave = async () => {
    if (call) await call.leave().catch(console.error);
    if (client) await client.disconnectUser().catch(console.error);
    if (isHost && room) await endRoom(room.id).catch(console.error);
    router.push('/spaces');
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#0a1628] flex items-center justify-center text-gray-400">
        Loading room...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[100dvh] bg-[#0a1628] flex flex-col items-center justify-center gap-4">
        <div className="text-red-400 text-lg">{error}</div>
        <button
          onClick={() => router.push('/spaces')}
          className="px-6 py-2 bg-[#f5a623] text-[#0a1628] rounded-lg font-semibold"
        >
          Back to Spaces
        </button>
      </div>
    );
  }

  if (!client || !call || !room) return null;

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] flex flex-col">
      <header className="px-4 py-3 border-b border-gray-800 bg-[#0d1b2a] flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold">{room.title}</h1>
          {room.description && (
            <p className="text-gray-400 text-xs">{room.description}</p>
          )}
        </div>
        <button
          onClick={handleLeave}
          className="px-4 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors"
        >
          {isHost ? 'End Room' : 'Leave'}
        </button>
      </header>
      <div className="flex-1">
        <StreamVideo client={client}>
          <StreamCall call={call}>
            <RoomView isHost={isHost} />
          </StreamCall>
        </StreamVideo>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Compiles (Stream SDK types may warn if env vars not set — that's OK).

- [ ] **Step 4: Commit**

```bash
git add src/app/\(auth\)/spaces/
git commit -m "feat: replace /spaces iframe with native Stream.io audio rooms"
```

---

## Task 8: 100ms Live Audio — API + Database

**Files:**
- Create: `src/app/api/100ms/token/route.ts`
- Create: `src/lib/social/msRoomsDb.ts`

- [ ] **Step 1: Create 100ms token route**

Create `src/app/api/100ms/token/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

const TokenSchema = z.object({
  userId: z.string().min(1),
  role: z.string().min(1),
  roomId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const accessKey = process.env.NEXT_PUBLIC_100MS_ACCESS_KEY;
    const appSecret = process.env.HMS_APP_SECRET;
    const templateId = process.env.NEXT_PUBLIC_100MS_TEMPLATE_ID || '';

    if (!accessKey || !appSecret) {
      console.error('100ms keys missing');
      return NextResponse.json({ error: '100ms configuration missing' }, { status: 500 });
    }

    const body = await req.json();
    const parsed = TokenSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { userId, role, roomId } = parsed.data;

    // Generate management token to interact with 100ms API
    const managementToken = jwt.sign(
      {
        access_key: accessKey,
        type: 'management',
        version: 2,
        iat: Math.floor(Date.now() / 1000),
        nbf: Math.floor(Date.now() / 1000),
      },
      appSecret,
      { algorithm: 'HS256', expiresIn: '24h', jwtid: crypto.randomUUID() }
    );

    // Find or create room
    let hmsRoomId = roomId;

    if (!hmsRoomId) {
      // List rooms to find existing
      const listRes = await fetch('https://api.100ms.live/v2/rooms', {
        headers: { Authorization: `Bearer ${managementToken}` },
      });
      const rooms = await listRes.json();
      const existing = rooms?.data?.find((r: { name: string }) => r.name === 'zao-live-room');

      if (existing) {
        hmsRoomId = existing.id;
      } else {
        // Create room
        const createRes = await fetch('https://api.100ms.live/v2/rooms', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${managementToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'zao-live-room',
            description: 'ZAO OS Live Audio Room',
            template_id: templateId,
            region: 'us',
          }),
        });
        const created = await createRes.json();
        hmsRoomId = created.id;
      }
    }

    // Generate app token for user
    const appToken = jwt.sign(
      {
        access_key: accessKey,
        room_id: hmsRoomId,
        user_id: userId,
        role,
        type: 'app',
        version: 2,
        iat: Math.floor(Date.now() / 1000),
        nbf: Math.floor(Date.now() / 1000),
      },
      appSecret,
      { algorithm: 'HS256', expiresIn: '24h', jwtid: crypto.randomUUID() }
    );

    return NextResponse.json({ token: appToken, roomId: hmsRoomId });
  } catch (error) {
    console.error('100ms token error:', error);
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create 100ms rooms database service**

Create `src/lib/social/msRoomsDb.ts`:
```typescript
import { supabaseAdmin } from '@/lib/db/supabase';

export interface MSRoom {
  id: string;
  title: string;
  host_fid: number;
  host_name: string;
  room_id_100ms: string | null;
  state: 'active' | 'ended';
  settings: Record<string, unknown>;
  pinned_links: unknown[];
  speakers: unknown[];
  created_at: string;
  ended_at: string | null;
  participant_count: number;
}

export async function createMSRoom(data: {
  title: string;
  hostFid: number;
  hostName: string;
  roomId100ms?: string;
}): Promise<MSRoom> {
  const { data: room, error } = await supabaseAdmin
    .from('ms_rooms')
    .insert({
      title: data.title,
      host_fid: data.hostFid,
      host_name: data.hostName,
      room_id_100ms: data.roomId100ms || null,
      state: 'active',
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create ms_room: ${error.message}`);
  return room;
}

export async function getActiveRoom(): Promise<MSRoom | null> {
  const { data, error } = await supabaseAdmin
    .from('ms_rooms')
    .select('*')
    .eq('state', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) return null;
  return data;
}

export async function endMSRoom(id: string): Promise<void> {
  await supabaseAdmin
    .from('ms_rooms')
    .update({ state: 'ended', ended_at: new Date().toISOString() })
    .eq('id', id);

  // Clean up speaker requests
  await supabaseAdmin
    .from('speaker_requests')
    .delete()
    .eq('room_id', id);
}

export async function addSpeakerRequest(roomId: string, requesterFid: number, requesterName: string): Promise<void> {
  await supabaseAdmin.from('speaker_requests').insert({
    room_id: roomId,
    requester_fid: requesterFid,
    requester_name: requesterName,
    status: 'pending',
  });
}

export async function updateSpeakerRequestStatus(requestId: string, status: 'approved' | 'denied'): Promise<void> {
  await supabaseAdmin
    .from('speaker_requests')
    .update({ status })
    .eq('id', requestId);
}

export async function updateRoomPinnedLinks(roomId: string, pinnedLinks: unknown[]): Promise<void> {
  await supabaseAdmin
    .from('ms_rooms')
    .update({ pinned_links: pinnedLinks })
    .eq('id', roomId);
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: No errors. (`jsonwebtoken` is already a dependency via Songjam — if not, `npm install jsonwebtoken @types/jsonwebtoken`.)

- [ ] **Step 4: Commit**

```bash
git add src/app/api/100ms/ src/lib/social/msRoomsDb.ts
git commit -m "feat: add 100ms token route and ms_rooms database service"
```

---

## Task 9: 100ms Live Audio — UI Components

**Files:**
- Create: `src/components/social/LiveAudioRoom.tsx`
- Create: `src/components/social/MiniSpaceBanner.tsx`

- [ ] **Step 1: Create MiniSpaceBanner**

Create `src/components/social/MiniSpaceBanner.tsx`:
```typescript
'use client';

import { useState, useEffect } from 'react';
import { getSupabaseBrowser } from '@/lib/db/supabase';
import type { MSRoom } from '@/lib/social/msRoomsDb';

interface MiniSpaceBannerProps {
  onJoinRoom: () => void;
}

export function MiniSpaceBanner({ onJoinRoom }: MiniSpaceBannerProps) {
  const [activeRoom, setActiveRoom] = useState<MSRoom | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowser();

    supabase
      .from('ms_rooms')
      .select('*')
      .eq('state', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => setActiveRoom(data));

    const channel = supabase
      .channel('active-ms-room')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ms_rooms' }, () => {
        supabase
          .from('ms_rooms')
          .select('*')
          .eq('state', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
          .then(({ data }) => setActiveRoom(data));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (!activeRoom) return null;

  return (
    <button
      onClick={onJoinRoom}
      className="w-full bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/20 rounded-xl px-4 py-3 flex items-center justify-between hover:border-purple-500/40 transition-colors group"
    >
      <div className="flex items-center gap-3">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
        </span>
        <div className="text-left">
          <div className="text-white text-sm font-medium">{activeRoom.title}</div>
          <div className="text-gray-400 text-xs">{activeRoom.participant_count} listening</div>
        </div>
      </div>
      <span className="text-[#f5a623] text-sm font-semibold group-hover:text-[#ffd700] transition-colors">
        Join
      </span>
    </button>
  );
}
```

- [ ] **Step 2: Create LiveAudioRoom (100ms)**

Create `src/components/social/LiveAudioRoom.tsx`:
```typescript
'use client';

import { useEffect, useState } from 'react';
import {
  HMSRoomProvider,
  useHMSActions,
  useHMSStore,
  selectIsConnectedToRoom,
  selectPeers,
  selectIsPeerAudioEnabled,
  selectLocalPeer,
} from '@100mslive/react-sdk';

function AudioRoomInner({ userName, role }: { userName: string; role: string }) {
  const hmsActions = useHMSActions();
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const peers = useHMSStore(selectPeers);
  const localPeer = useHMSStore(selectLocalPeer);
  const [joining, setJoining] = useState(false);

  const joinRoom = async () => {
    setJoining(true);
    try {
      const res = await fetch('/api/100ms/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userName, role }),
      });
      const { token } = await res.json();
      await hmsActions.join({ userName, authToken: token });
    } catch (err) {
      console.error('Failed to join 100ms room:', err);
    } finally {
      setJoining(false);
    }
  };

  const leaveRoom = async () => {
    await hmsActions.leave();
  };

  const toggleMute = async () => {
    if (localPeer) {
      await hmsActions.setLocalAudioEnabled(!localPeer.audioEnabled);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-[#0d1b2a] border border-gray-800 rounded-xl p-6 text-center">
        <div className="text-4xl mb-3">🎙️</div>
        <p className="text-white font-semibold mb-2">Live Audio Room</p>
        <p className="text-gray-400 text-sm mb-4">Join the conversation</p>
        <button
          onClick={joinRoom}
          disabled={joining}
          className="px-6 py-2.5 bg-[#f5a623] hover:bg-[#ffd700] text-[#0a1628] rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
        >
          {joining ? 'Joining...' : 'Join Room'}
        </button>
      </div>
    );
  }

  const speakers = peers.filter((p) => p.roleName === 'speaker' || p.roleName === 'host');
  const listeners = peers.filter((p) => p.roleName === 'listener');

  return (
    <div className="bg-[#0d1b2a] border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="text-white text-sm font-medium">Live</span>
          <span className="text-gray-500 text-xs">{peers.length} in room</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={toggleMute}
            className={`px-3 py-1 rounded-lg text-xs font-medium ${
              localPeer?.audioEnabled
                ? 'bg-green-600/20 text-green-400'
                : 'bg-gray-700 text-gray-400'
            }`}
          >
            {localPeer?.audioEnabled ? 'Mute' : 'Unmute'}
          </button>
          <button
            onClick={leaveRoom}
            className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-medium"
          >
            Leave
          </button>
        </div>
      </div>

      <div className="p-4">
        {speakers.length > 0 && (
          <div className="mb-4">
            <h4 className="text-gray-500 text-xs uppercase tracking-wider mb-2">Speakers</h4>
            <div className="grid grid-cols-4 gap-3">
              {speakers.map((peer) => (
                <PeerCard key={peer.id} peerId={peer.id} name={peer.name} isLocal={peer.isLocal} />
              ))}
            </div>
          </div>
        )}
        {listeners.length > 0 && (
          <div>
            <h4 className="text-gray-500 text-xs uppercase tracking-wider mb-2">Listeners</h4>
            <div className="grid grid-cols-5 gap-2">
              {listeners.map((peer) => (
                <div key={peer.id} className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 text-xs">
                    {(peer.name || '?')[0]}
                  </div>
                  <span className="text-gray-500 text-[10px] mt-1 truncate max-w-[40px]">
                    {peer.name} {peer.isLocal && '(You)'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PeerCard({ peerId, name, isLocal }: { peerId: string; name: string; isLocal: boolean }) {
  const isAudioEnabled = useHMSStore(selectIsPeerAudioEnabled(peerId));

  return (
    <div className="flex flex-col items-center">
      <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold border-2 ${isAudioEnabled ? 'border-green-400' : 'border-transparent'} transition-all`}>
        {(name || '?')[0]}
      </div>
      <span className="text-white text-xs mt-1 truncate max-w-[60px]">
        {name} {isLocal && '(You)'}
      </span>
    </div>
  );
}

export default function LiveAudioRoom({ userName, role = 'listener' }: { userName: string; role?: string }) {
  return (
    <HMSRoomProvider>
      <AudioRoomInner userName={userName} role={role} />
    </HMSRoomProvider>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/social/LiveAudioRoom.tsx src/components/social/MiniSpaceBanner.tsx
git commit -m "feat: add 100ms LiveAudioRoom and MiniSpaceBanner components"
```

---

## Task 10: Wire /social Page + Final Integration

**Files:**
- Modify: `src/app/(auth)/social/page.tsx`

- [ ] **Step 1: Add LiveAudioRoom and MiniSpaceBanner to social page**

The social page currently renders `<SocialPage />`. Add the `MiniSpaceBanner` at the top of the page and a `LiveAudioRoom` section. The exact integration depends on the current page layout — the LiveAudioRoom should appear above the social tabs when an active room exists.

Import and add to the social page layout:
```typescript
import dynamic from 'next/dynamic';
import { MiniSpaceBanner } from '@/components/social/MiniSpaceBanner';

const LiveAudioRoom = dynamic(() => import('@/components/social/LiveAudioRoom'), { ssr: false });
```

Add `<MiniSpaceBanner>` at the top of the page content, and conditionally render `<LiveAudioRoom>` when the user clicks to join.

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Clean build.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(auth\)/social/
git commit -m "feat: integrate LiveAudioRoom and MiniSpaceBanner into /social page"
```

- [ ] **Step 4: Final verification — run dev server**

Run: `npm run dev`
Expected: All pages load without errors. `/spaces` shows room list. `/social` shows mini banner if active room exists. `/respect` shows mindshare toggle.

- [ ] **Step 5: Final commit with all changes**

Run `git status` and commit any remaining unstaged files.

```bash
git add -A
git commit -m "feat: complete Songjam feature integration — audio rooms, leaderboard, cast actions"
```
