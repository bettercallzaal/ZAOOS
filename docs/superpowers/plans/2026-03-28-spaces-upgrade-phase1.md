# Spaces Upgrade Phase 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform /spaces into Discord-style voice channels + stages with DJ mode fix, screen share permissions, and minutes tracking leaderboard API.

**Architecture:** Extend existing `rooms` table with room_type/persistent columns. Voice channels seeded from `community.config.ts`. New `space_sessions` table tracks join/leave for leaderboard. Two in-room layouts (Content-First / Speakers-First) controlled by room type + host toggle. MusicSidebar reused for in-room DJ browsing.

**Tech Stack:** Next.js 16, Supabase (Postgres + Realtime), Stream.io Video SDK, Tailwind CSS v4, React 19

**Spec:** `docs/superpowers/specs/2026-03-28-spaces-upgrade-phase1-design.md`

---

## Task 1: Database Schema + Seed Script

**Files:**
- Modify: `scripts/setup-rooms-tables.sql`
- Create: `scripts/sql/space-sessions.sql`
- Create: `scripts/seed-voice-channels.ts`
- Modify: `src/lib/spaces/roomsDb.ts`

- [ ] **Step 1: Add columns to rooms table**

Add to `scripts/setup-rooms-tables.sql` after the existing `rooms` CREATE TABLE:

```sql
-- Phase 1: Voice channels + stages
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS room_type TEXT DEFAULT 'stage' CHECK (room_type IN ('voice_channel', 'stage'));
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS persistent BOOLEAN DEFAULT false;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS channel_id TEXT;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'default';
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS layout_preference TEXT DEFAULT 'content-first' CHECK (layout_preference IN ('content-first', 'speakers-first'));
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT now();
```

- [ ] **Step 2: Create space_sessions table**

Write `scripts/sql/space-sessions.sql`:

```sql
CREATE TABLE IF NOT EXISTS space_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fid BIGINT NOT NULL,
  room_id UUID NOT NULL,
  room_name TEXT,
  room_type TEXT CHECK (room_type IN ('voice_channel', 'stage')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_space_sessions_fid ON space_sessions(fid);
CREATE INDEX IF NOT EXISTS idx_space_sessions_room ON space_sessions(room_id);
CREATE INDEX IF NOT EXISTS idx_space_sessions_joined ON space_sessions(joined_at DESC);

ALTER TABLE space_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "space_sessions_select" ON space_sessions FOR SELECT USING (true);
CREATE POLICY "space_sessions_insert" ON space_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "space_sessions_update" ON space_sessions FOR UPDATE USING (true);
```

Note: Using plain `duration_seconds` instead of GENERATED ALWAYS AS because Supabase free tier doesn't support generated columns well. Duration calculated on update: `UPDATE SET left_at = now(), duration_seconds = EXTRACT(EPOCH FROM (now() - joined_at))::INTEGER`.

- [ ] **Step 3: Create voice channel seed script**

Write `scripts/seed-voice-channels.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const VOICE_CHANNELS = [
  { channel_id: 'general-hangout', title: 'General Hangout', description: 'Casual conversation' },
  { channel_id: 'fractal-call', title: 'Fractal Call', description: 'Monday 6pm EST weekly fractal' },
  { channel_id: 'music-lounge', title: 'Music Lounge', description: 'Always-on listening room' },
  { channel_id: 'tech-talk', title: 'Tech Talk', description: 'Technical discussions' },
  { channel_id: 'coworking', title: 'Coworking', description: 'Silent cowork with ambient presence' },
];

async function seed() {
  for (const ch of VOICE_CHANNELS) {
    const { data: existing } = await supabase
      .from('rooms')
      .select('id')
      .eq('channel_id', ch.channel_id)
      .maybeSingle();

    if (existing) {
      console.log(`Channel ${ch.channel_id} already exists, skipping`);
      continue;
    }

    const streamCallId = `voice-${ch.channel_id}-${Date.now()}`;
    const { error } = await supabase.from('rooms').insert({
      title: ch.title,
      description: ch.description,
      host_fid: 19640, // app FID
      host_name: 'ZAO OS',
      host_username: 'zaoos',
      host_pfp: null,
      stream_call_id: streamCallId,
      state: 'live',
      room_type: 'voice_channel',
      persistent: true,
      channel_id: ch.channel_id,
      theme: 'default',
      layout_preference: 'speakers-first',
      participant_count: 0,
    });

    if (error) {
      console.error(`Failed to seed ${ch.channel_id}:`, error.message);
    } else {
      console.log(`Seeded ${ch.channel_id}`);
    }
  }
}

seed().then(() => process.exit(0));
```

- [ ] **Step 4: Update Room interface and createRoom in roomsDb.ts**

Update `src/lib/spaces/roomsDb.ts` — add new fields to the `Room` interface:

```typescript
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
  room_type: 'voice_channel' | 'stage';
  persistent: boolean;
  channel_id: string | null;
  theme: string;
  layout_preference: 'content-first' | 'speakers-first';
  last_active_at: string;
  created_at: string;
  ended_at: string | null;
  participant_count: number;
}
```

Update `createRoom` to accept and pass room_type, theme, layout_preference. Add new functions:

```typescript
export async function getVoiceChannels(): Promise<Room[]> {
  const { data, error } = await supabaseAdmin
    .from('rooms')
    .select('*')
    .eq('persistent', true)
    .eq('room_type', 'voice_channel')
    .order('title');
  if (error) throw new Error(`Failed to fetch voice channels: ${error.message}`);
  return data ?? [];
}

export async function getLiveStages(): Promise<Room[]> {
  const { data, error } = await supabaseAdmin
    .from('rooms')
    .select('*')
    .eq('room_type', 'stage')
    .eq('state', 'live')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`Failed to fetch live stages: ${error.message}`);
  return data ?? [];
}

export async function updateLastActive(roomId: string): Promise<void> {
  await supabaseAdmin
    .from('rooms')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', roomId);
}

export async function updateLayoutPreference(roomId: string, layout: 'content-first' | 'speakers-first'): Promise<void> {
  await supabaseAdmin
    .from('rooms')
    .update({ layout_preference: layout })
    .eq('id', roomId);
}
```

- [ ] **Step 5: Run migrations locally and verify**

Run: `psql` or Supabase SQL editor to execute both SQL files. Then run seed:

```bash
npx tsx scripts/seed-voice-channels.ts
```

Expected: 5 voice channels created in `rooms` table.

- [ ] **Step 6: Commit**

```bash
git add scripts/ src/lib/spaces/roomsDb.ts
git commit -m "feat(spaces): database schema for voice channels + space_sessions tracking"
```

---

## Task 2: community.config.ts + Session Tracking API

**Files:**
- Modify: `community.config.ts`
- Create: `src/app/api/spaces/session/route.ts`
- Create: `src/lib/spaces/sessionsDb.ts`

- [ ] **Step 1: Add voiceChannels to community.config.ts**

Add after the existing `adminWallets` section:

```typescript
// ── Spaces ─────────────────────────────────────────────────────
voiceChannels: [
  { id: 'general-hangout', name: 'General Hangout', emoji: '💬', description: 'Casual conversation' },
  { id: 'fractal-call', name: 'Fractal Call', emoji: '📞', description: 'Monday 6pm EST weekly fractal' },
  { id: 'music-lounge', name: 'Music Lounge', emoji: '🎵', description: 'Always-on listening room' },
  { id: 'tech-talk', name: 'Tech Talk', emoji: '💻', description: 'Technical discussions' },
  { id: 'coworking', name: 'Coworking', emoji: '🏢', description: 'Silent cowork with ambient presence' },
],
```

- [ ] **Step 2: Create sessionsDb.ts**

Write `src/lib/spaces/sessionsDb.ts`:

```typescript
import { supabaseAdmin } from '@/lib/db/supabase';

export async function startSession(fid: number, roomId: string, roomName: string, roomType: 'voice_channel' | 'stage'): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('space_sessions')
    .insert({ fid, room_id: roomId, room_name: roomName, room_type: roomType })
    .select('id')
    .single();
  if (error) throw new Error(`Failed to start session: ${error.message}`);
  return data.id;
}

export async function endSession(sessionId: string): Promise<void> {
  const { data: session } = await supabaseAdmin
    .from('space_sessions')
    .select('joined_at')
    .eq('id', sessionId)
    .single();

  if (!session) return;

  const durationSeconds = Math.floor(
    (Date.now() - new Date(session.joined_at).getTime()) / 1000
  );

  await supabaseAdmin
    .from('space_sessions')
    .update({ left_at: new Date().toISOString(), duration_seconds: durationSeconds })
    .eq('id', sessionId);
}

export async function endSessionByFid(fid: number, roomId: string): Promise<void> {
  const { data: session } = await supabaseAdmin
    .from('space_sessions')
    .select('id, joined_at')
    .eq('fid', fid)
    .eq('room_id', roomId)
    .is('left_at', null)
    .order('joined_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!session) return;

  const durationSeconds = Math.floor(
    (Date.now() - new Date(session.joined_at).getTime()) / 1000
  );

  await supabaseAdmin
    .from('space_sessions')
    .update({ left_at: new Date().toISOString(), duration_seconds: durationSeconds })
    .eq('id', session.id);
}

export interface LeaderboardEntry {
  fid: number;
  username: string;
  totalMinutes: number;
  sessions: number;
  favoriteRoom: string;
}

export async function getLeaderboard(period: 'week' | 'month' | 'all', limit: number = 20): Promise<LeaderboardEntry[]> {
  let since: string | null = null;
  if (period === 'week') {
    since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  } else if (period === 'month') {
    since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  }

  let query = supabaseAdmin
    .from('space_sessions')
    .select('fid, room_name, duration_seconds')
    .not('duration_seconds', 'is', null);

  if (since) {
    query = query.gte('joined_at', since);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Leaderboard query failed: ${error.message}`);
  if (!data || data.length === 0) return [];

  // Aggregate in JS (Supabase free tier lacks GROUP BY in REST API)
  const byFid = new Map<number, { totalSeconds: number; sessions: number; roomCounts: Map<string, number> }>();
  for (const row of data) {
    const entry = byFid.get(row.fid) ?? { totalSeconds: 0, sessions: 0, roomCounts: new Map() };
    entry.totalSeconds += row.duration_seconds ?? 0;
    entry.sessions += 1;
    const roomName = row.room_name ?? 'Unknown';
    entry.roomCounts.set(roomName, (entry.roomCounts.get(roomName) ?? 0) + 1);
    byFid.set(row.fid, entry);
  }

  const entries: LeaderboardEntry[] = [];
  for (const [fid, stats] of byFid) {
    let favoriteRoom = 'Unknown';
    let maxCount = 0;
    for (const [room, count] of stats.roomCounts) {
      if (count > maxCount) { maxCount = count; favoriteRoom = room; }
    }
    entries.push({
      fid,
      username: '', // populated below
      totalMinutes: Math.round(stats.totalSeconds / 60),
      sessions: stats.sessions,
      favoriteRoom,
    });
  }

  entries.sort((a, b) => b.totalMinutes - a.totalMinutes);
  return entries.slice(0, limit);
}
```

- [ ] **Step 3: Create session tracking API route**

Write `src/app/api/spaces/session/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { startSession, endSessionByFid } from '@/lib/spaces/sessionsDb';
import { updateLastActive } from '@/lib/spaces/roomsDb';

const JoinSchema = z.object({
  roomId: z.string().uuid(),
  roomName: z.string(),
  roomType: z.enum(['voice_channel', 'stage']),
});

const LeaveSchema = z.object({
  roomId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session?.fid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = JoinSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const sessionId = await startSession(session.fid, parsed.data.roomId, parsed.data.roomName, parsed.data.roomType);
    await updateLastActive(parsed.data.roomId);

    return NextResponse.json({ sessionId });
  } catch (error) {
    console.error('[spaces/session] Join error:', error);
    return NextResponse.json({ error: 'Failed to record join' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session?.fid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = LeaveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    await endSessionByFid(session.fid, parsed.data.roomId);
    await updateLastActive(parsed.data.roomId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[spaces/session] Leave error:', error);
    return NextResponse.json({ error: 'Failed to record leave' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add community.config.ts src/lib/spaces/sessionsDb.ts src/app/api/spaces/session/
git commit -m "feat(spaces): session tracking API + voice channel config"
```

---

## Task 3: Leaderboard + Stats API Routes

**Files:**
- Create: `src/app/api/spaces/leaderboard/route.ts`
- Create: `src/app/api/spaces/stats/route.ts`

- [ ] **Step 1: Create leaderboard route**

Write `src/app/api/spaces/leaderboard/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/spaces/sessionsDb';

export async function GET(req: NextRequest) {
  try {
    const period = (req.nextUrl.searchParams.get('period') ?? 'week') as 'week' | 'month' | 'all';
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '20'), 100);

    if (!['week', 'month', 'all'].includes(period)) {
      return NextResponse.json({ error: 'Invalid period' }, { status: 400 });
    }

    const leaderboard = await getLeaderboard(period, limit);

    const totalCommunityMinutes = leaderboard.reduce((sum, e) => sum + e.totalMinutes, 0);

    return NextResponse.json({ leaderboard, period, totalCommunityMinutes });
  } catch (error) {
    console.error('[spaces/leaderboard] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create stats route**

Write `src/app/api/spaces/stats/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function GET() {
  try {
    const session = await getSessionData();
    if (!session?.fid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('space_sessions')
      .select('room_name, duration_seconds, joined_at')
      .eq('fid', session.fid)
      .not('duration_seconds', 'is', null);

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        totalMinutes: 0, totalSessions: 0, currentStreak: 0,
        favoriteRoom: null, thisWeek: 0, lastWeek: 0,
      });
    }

    const totalSeconds = data.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0);
    const totalMinutes = Math.round(totalSeconds / 60);

    // Favorite room
    const roomCounts = new Map<string, number>();
    for (const s of data) {
      const name = s.room_name ?? 'Unknown';
      roomCounts.set(name, (roomCounts.get(name) ?? 0) + 1);
    }
    let favoriteRoom = 'Unknown';
    let maxCount = 0;
    for (const [room, count] of roomCounts) {
      if (count > maxCount) { maxCount = count; favoriteRoom = room; }
    }

    // This week / last week
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;
    let thisWeekSeconds = 0;
    let lastWeekSeconds = 0;
    for (const s of data) {
      const joinedAt = new Date(s.joined_at).getTime();
      if (joinedAt >= weekAgo) thisWeekSeconds += s.duration_seconds ?? 0;
      else if (joinedAt >= twoWeeksAgo) lastWeekSeconds += s.duration_seconds ?? 0;
    }

    // Streak: consecutive days with at least one session
    const days = new Set(data.map(s => new Date(s.joined_at).toISOString().slice(0, 10)));
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      if (days.has(key)) streak++;
      else break;
    }

    return NextResponse.json({
      totalMinutes,
      totalSessions: data.length,
      currentStreak: streak,
      favoriteRoom,
      thisWeek: Math.round(thisWeekSeconds / 60),
      lastWeek: Math.round(lastWeekSeconds / 60),
    });
  } catch (error) {
    console.error('[spaces/stats] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/spaces/leaderboard/ src/app/api/spaces/stats/
git commit -m "feat(spaces): leaderboard + personal stats API routes"
```

---

## Task 4: Channel Sidebar + Channel Strip (Spaces Page Components)

**Files:**
- Create: `src/components/spaces/ChannelSidebar.tsx`
- Create: `src/components/spaces/ChannelStrip.tsx`
- Create: `src/components/spaces/ConnectedBanner.tsx`
- Create: `src/components/spaces/StageCard.tsx`

- [ ] **Step 1: Create ChannelSidebar**

Write `src/components/spaces/ChannelSidebar.tsx` (~120 lines):

```typescript
'use client';

import { formatDistanceToNow } from '@/lib/utils/time';
import type { Room } from '@/lib/spaces/roomsDb';
import { communityConfig } from '@/../community.config';
import Image from 'next/image';

interface ChannelSidebarProps {
  channels: Room[];
  connectedRoomId: string | null;
  connectedDuration: number; // seconds
  onJoinChannel: (room: Room) => void;
  onLeaveChannel: () => void;
  onToggleMute: () => void;
  isMuted: boolean;
}

export function ChannelSidebar({
  channels, connectedRoomId, connectedDuration,
  onJoinChannel, onLeaveChannel, onToggleMute, isMuted,
}: ChannelSidebarProps) {
  const configMap = new Map(communityConfig.voiceChannels.map(c => [c.id, c]));

  return (
    <aside className="w-[220px] bg-[#081420] border-r border-gray-800 flex flex-col h-full">
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">
          Voice Channels
        </div>
        <div className="space-y-1.5">
          {channels.map((room) => {
            const config = configMap.get(room.channel_id ?? '');
            const isActive = room.participant_count > 0;
            const isConnected = room.id === connectedRoomId;

            return (
              <button
                key={room.id}
                onClick={() => isConnected ? undefined : onJoinChannel(room)}
                className={`w-full text-left rounded-lg p-2 transition-colors ${
                  isConnected
                    ? 'bg-[#0d2847] border-l-[3px] border-green-400'
                    : isActive
                    ? 'bg-[#0d2847] border-l-[3px] border-green-400 hover:bg-[#112d52]'
                    : 'opacity-50 hover:opacity-75 border-l-[3px] border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isActive ? 'text-white font-medium' : 'text-gray-400'}`}>
                    {config?.emoji ?? '🔊'} {room.title}
                  </span>
                  {isActive && (
                    <span className="bg-green-400 text-black text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                      {room.participant_count}
                    </span>
                  )}
                </div>
                {!isActive && room.last_active_at && (
                  <div className="text-[10px] text-gray-600 mt-0.5">
                    Last active {formatDistanceToNow(new Date(room.last_active_at))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Connected status */}
      {connectedRoomId && (
        <div className="border-t border-gray-800 p-3">
          <div className="bg-[#0f2e1a] rounded-lg p-2 border border-green-500/20">
            <div className="text-green-400 text-xs font-bold">🎧 Connected</div>
            <div className="text-gray-500 text-[10px]">
              {channels.find(c => c.id === connectedRoomId)?.title} • {Math.floor(connectedDuration / 60)}m
            </div>
            <div className="flex gap-3 mt-1.5">
              <button onClick={onToggleMute} className="text-[10px] text-gray-400 hover:text-white">
                {isMuted ? '🔇 Unmute' : '🔊 Mute'}
              </button>
              <button onClick={onLeaveChannel} className="text-[10px] text-red-400 hover:text-red-300">
                📴 Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
```

- [ ] **Step 2: Create ChannelStrip (mobile)**

Write `src/components/spaces/ChannelStrip.tsx` (~60 lines):

```typescript
'use client';

import type { Room } from '@/lib/spaces/roomsDb';
import { communityConfig } from '@/../community.config';

interface ChannelStripProps {
  channels: Room[];
  onJoinChannel: (room: Room) => void;
}

export function ChannelStrip({ channels, onJoinChannel }: ChannelStripProps) {
  const configMap = new Map(communityConfig.voiceChannels.map(c => [c.id, c]));

  return (
    <div className="flex gap-2 px-3 py-2 overflow-x-auto border-b border-gray-800 scrollbar-hide">
      {channels.map((room) => {
        const config = configMap.get(room.channel_id ?? '');
        const isActive = room.participant_count > 0;

        return (
          <button
            key={room.id}
            onClick={() => onJoinChannel(room)}
            className={`flex-shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-colors ${
              isActive
                ? 'bg-[#0d2847] border border-green-400 text-white'
                : 'border border-gray-700 text-gray-500 opacity-40'
            }`}
          >
            {isActive && <span className="text-green-400 text-[8px]">●</span>}
            <span className="whitespace-nowrap">{config?.emoji} {room.title.split(' ')[0]}</span>
            {isActive && (
              <span className="bg-green-400 text-black text-[8px] px-1 rounded-full font-bold">
                {room.participant_count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Create ConnectedBanner (mobile)**

Write `src/components/spaces/ConnectedBanner.tsx` (~40 lines):

```typescript
'use client';

interface ConnectedBannerProps {
  roomName: string;
  duration: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onLeave: () => void;
}

export function ConnectedBanner({ roomName, duration, isMuted, onToggleMute, onLeave }: ConnectedBannerProps) {
  return (
    <div className="bg-[#0f2e1a] px-3 py-2 flex items-center justify-between border-b border-green-500/20">
      <div>
        <span className="text-green-400 text-xs">🎧 {roomName}</span>
        <span className="text-gray-500 text-[10px] ml-1">• {Math.floor(duration / 60)}m</span>
      </div>
      <div className="flex gap-3">
        <button onClick={onToggleMute} className="text-sm text-gray-300">
          {isMuted ? '🔇' : '🔊'}
        </button>
        <button onClick={onLeave} className="text-sm text-red-400">📴</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create StageCard**

Write `src/components/spaces/StageCard.tsx` (~70 lines):

```typescript
'use client';

import type { Room } from '@/lib/spaces/roomsDb';
import Image from 'next/image';

const THEME_BADGES: Record<string, { bg: string; text: string; label: string; emoji: string }> = {
  default: { bg: 'bg-[#f5a62333]', text: 'text-[#f5a623]', label: 'Default', emoji: '🔊' },
  music: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Music', emoji: '🎵' },
  podcast: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Podcast', emoji: '🎙️' },
  ama: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'AMA', emoji: '❓' },
  chill: { bg: 'bg-teal-500/20', text: 'text-teal-400', label: 'Chill', emoji: '😌' },
};

interface StageCardProps {
  room: Room;
  onJoin: (room: Room) => void;
}

export function StageCard({ room, onJoin }: StageCardProps) {
  const badge = THEME_BADGES[room.theme] ?? THEME_BADGES.default;

  return (
    <div className="bg-[#111d2e] rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-bold text-white">{room.title}</span>
          <span className="ml-2 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded animate-pulse">
            ● LIVE
          </span>
        </div>
        <span className={`${badge.bg} ${badge.text} text-[10px] px-2 py-0.5 rounded`}>
          {badge.emoji} {badge.label}
        </span>
      </div>
      <div className="text-gray-500 text-xs mt-1">
        Hosted by {room.host_name} • {room.participant_count} watching
      </div>
      {room.host_pfp && (
        <div className="flex gap-1 mt-2">
          <Image
            src={room.host_pfp}
            alt={room.host_name}
            width={24}
            height={24}
            className="rounded-full"
            unoptimized
          />
        </div>
      )}
      <button
        onClick={() => onJoin(room)}
        className="mt-3 bg-[#f5a62333] text-[#f5a623] text-xs px-4 py-1.5 rounded hover:bg-[#f5a62355] transition-colors"
      >
        Join Stage →
      </button>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/spaces/ChannelSidebar.tsx src/components/spaces/ChannelStrip.tsx src/components/spaces/ConnectedBanner.tsx src/components/spaces/StageCard.tsx
git commit -m "feat(spaces): channel sidebar, mobile strip, connected banner, stage card components"
```

---

## Task 5: Rebuild Spaces Page with Sidebar + Stages Layout

**Files:**
- Modify: `src/app/spaces/page.tsx`
- Modify: `src/app/spaces/SpacesLayoutClient.tsx`
- Modify: `src/components/spaces/RoomList.tsx`

- [ ] **Step 1: Update SpacesLayoutClient to pass channel data**

Rewrite `src/app/spaces/SpacesLayoutClient.tsx` to fetch voice channels + stages and render the new sidebar layout on desktop, strip on mobile. This is the main orchestration component.

Key changes:
- Fetch voice channels and live stages via `useQuery`
- Supabase Realtime subscription for room updates (reuse existing pattern from RoomList)
- Desktop: `<ChannelSidebar>` + main content area with stages
- Mobile: `<ChannelStrip>` + `<ConnectedBanner>` + stage list
- Track connected room state (roomId, duration timer, muted)
- Pass `onJoinChannel` handler that navigates to `/spaces/{id}`

- [ ] **Step 2: Update spaces/page.tsx**

Simplify — the page now just renders StageCard list + "Create Stage" button. Channel display is handled by the layout. Remove the inline room list that currently lives here and replace with:

```typescript
// page.tsx becomes a thin wrapper:
// - Fetches live stages
// - Renders StageCard for each
// - Shows "Create Stage" button that opens HostRoomModal
// - HostRoomModal already exists, just needs room_type passed through
```

- [ ] **Step 3: Update HostRoomModal to remove provider selector**

Modify `src/components/spaces/HostRoomModal.tsx`:
- Remove the provider selector (Stream.io vs 100ms grid)
- Always use Stream.io for new rooms
- Pass `room_type: 'stage'` in the create call
- Keep theme selector, title, description

- [ ] **Step 4: Update RoomList or remove**

`RoomList.tsx` currently fetches both `rooms` and `ms_rooms`. With the new layout:
- Voice channels are fetched separately by the layout
- Stages are shown in the main area
- RoomList may no longer be needed, or can be simplified to only fetch stages

- [ ] **Step 5: Build and verify**

```bash
npm run build
```

Expected: Build passes, /spaces page renders with sidebar on desktop.

- [ ] **Step 6: Commit**

```bash
git add src/app/spaces/ src/components/spaces/
git commit -m "feat(spaces): new page layout with channel sidebar + stage cards"
```

---

## Task 6: In-Room Layouts (Content-First + Speakers-First)

**Files:**
- Create: `src/components/spaces/ContentView.tsx`
- Create: `src/components/spaces/SpeakersGrid.tsx`
- Create: `src/components/spaces/LayoutToggle.tsx`
- Modify: `src/components/spaces/RoomView.tsx`
- Modify: `src/components/spaces/ControlsPanel.tsx`

- [ ] **Step 1: Create ContentView (Layout A)**

Write `src/components/spaces/ContentView.tsx` (~80 lines):

Main content area showing screen share or active speaker video. Includes PiP overlay for host camera and a speaker strip with now-playing mini widget.

Uses `@stream-io/video-react-sdk`: `useCallStateHooks`, `ParticipantView`, `hasScreenShare`.

- [ ] **Step 2: Create SpeakersGrid (Layout B)**

Write `src/components/spaces/SpeakersGrid.tsx` (~70 lines):

Grid of speaker circles with speaking/listening status indicators, host crown badge. Responsive wrap layout.

Uses `useCallStateHooks` to get participants, `hasAudio` for speaking indicator.

- [ ] **Step 3: Create LayoutToggle**

Write `src/components/spaces/LayoutToggle.tsx` (~25 lines):

```typescript
'use client';

interface LayoutToggleProps {
  layout: 'content-first' | 'speakers-first';
  onToggle: () => void;
}

export function LayoutToggle({ layout, onToggle }: LayoutToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
      title={layout === 'content-first' ? 'Switch to speakers view' : 'Switch to content view'}
    >
      {layout === 'content-first' ? '👥' : '🖥️'}
    </button>
  );
}
```

- [ ] **Step 4: Update RoomView to support both layouts**

Modify `src/components/spaces/RoomView.tsx`:

Add state:
```typescript
const [layout, setLayout] = useState<'content-first' | 'speakers-first'>(
  room?.layout_preference ?? (room?.room_type === 'voice_channel' ? 'speakers-first' : 'content-first')
);
const [showMusicSidebar, setShowMusicSidebar] = useState(false);
```

Render either `<ContentView>` or `<SpeakersGrid>` based on `layout` state.

Auto-switch to content-first when screen share becomes active:
```typescript
const { useHasOngoingScreenShare } = useCallStateHooks();
const hasScreenShare = useHasOngoingScreenShare();

useEffect(() => {
  if (hasScreenShare && layout !== 'content-first') {
    setPreviousLayout(layout);
    setLayout('content-first');
  } else if (!hasScreenShare && previousLayout) {
    setLayout(previousLayout);
    setPreviousLayout(null);
  }
}, [hasScreenShare]);
```

- [ ] **Step 5: Update ControlsPanel with new buttons**

Modify `src/components/spaces/ControlsPanel.tsx`:

Add props: `onMusicToggle`, `onLayoutToggle`, `layout`, `roomType`, `isHost`.

Add buttons:
- 🎵 Music button (calls `onMusicToggle`)
- 📐 Layout toggle (host only, stages only — calls `onLayoutToggle`)
- ✋ Raise hand (audience in stages only)

Conditional rendering based on `roomType`:
- Voice channel: show mic, camera, screen share, music, leave
- Stage (host): show mic, camera, screen share, music, layout toggle, broadcast, leave
- Stage (audience): show raise hand, music, leave

- [ ] **Step 6: Commit**

```bash
git add src/components/spaces/
git commit -m "feat(spaces): dual layout system (content-first + speakers-first) with toggle"
```

---

## Task 7: DJ Mode Fix — MusicSidebar Integration

**Files:**
- Modify: `src/components/spaces/RoomView.tsx`
- Modify: `src/components/spaces/RoomMusicPanel.tsx`

- [ ] **Step 1: Add MusicSidebar to RoomView**

In RoomView, dynamically import MusicSidebar:

```typescript
const MusicSidebar = dynamic(
  () => import('@/components/music/MusicSidebar').then(m => ({ default: m.MusicSidebar })),
  { ssr: false },
);
```

Render alongside the room content:

```typescript
<div className="flex h-full">
  <div className={`flex-1 flex flex-col ${showMusicSidebar ? 'md:mr-0' : ''}`}>
    {/* existing room content (ContentView or SpeakersGrid) */}
  </div>
  {showMusicSidebar && (
    <>
      {/* Desktop: side panel */}
      <div className="hidden md:block w-[350px] border-l border-gray-800">
        <MusicSidebar onClose={() => setShowMusicSidebar(false)} />
      </div>
      {/* Mobile: full-screen overlay */}
      <div className="md:hidden fixed inset-0 z-50 bg-[#0a1628]">
        <div className="flex items-center justify-between p-3 border-b border-gray-800">
          <span className="text-white font-medium">Browse Music</span>
          <button onClick={() => setShowMusicSidebar(false)} className="text-gray-400 text-xl">×</button>
        </div>
        <MusicSidebar onClose={() => setShowMusicSidebar(false)} />
      </div>
    </>
  )}
</div>
```

- [ ] **Step 2: Update RoomMusicPanel**

The existing "Play a track from the music tab" message gets replaced with a button that opens the sidebar:

```typescript
// Instead of the placeholder text, show:
<button
  onClick={onOpenMusicBrowser}
  className="w-full py-3 rounded-lg bg-[#f5a62320] text-[#f5a623] text-sm hover:bg-[#f5a62340] transition-colors"
>
  🎵 Browse Music
</button>
```

- [ ] **Step 3: Build and verify**

```bash
npm run build
```

Expected: 🎵 button in controls opens MusicSidebar alongside room on desktop, as overlay on mobile.

- [ ] **Step 4: Commit**

```bash
git add src/components/spaces/RoomView.tsx src/components/spaces/RoomMusicPanel.tsx
git commit -m "feat(spaces): DJ mode fix — MusicSidebar opens inside room"
```

---

## Task 8: Session Tracking Wiring + Permission Model

**Files:**
- Modify: `src/app/spaces/[id]/page.tsx`
- Modify: `src/components/spaces/ScreenShareButton.tsx`

- [ ] **Step 1: Wire session tracking into room join/leave**

Modify `src/app/spaces/[id]/page.tsx`:

On join (after `call.join()`):
```typescript
// Track session
fetch('/api/spaces/session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    roomId: room.id,
    roomName: room.title,
    roomType: room.room_type,
  }),
});
```

On leave (in cleanup / beforeunload):
```typescript
// End session
navigator.sendBeacon('/api/spaces/session', JSON.stringify({
  roomId: room.id,
}));
// Note: sendBeacon for PATCH won't work — use fetch with keepalive instead:
fetch('/api/spaces/session', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ roomId: room.id }),
  keepalive: true,
});
```

Also add `beforeunload` and `visibilitychange` listeners for browser close/tab switch.

- [ ] **Step 2: Update ScreenShareButton permissions**

Modify `src/components/spaces/ScreenShareButton.tsx`:

Add `roomType` prop. If `roomType === 'voice_channel'`, show for all authenticated users. If `stage`, show only for host (already the current behavior via `isHost` + `isAuthenticated` check).

- [ ] **Step 3: Full build + test**

```bash
npm run build
npx vitest run
```

Expected: Build passes, all existing tests pass, no regressions.

- [ ] **Step 4: Commit**

```bash
git add src/app/spaces/[id]/page.tsx src/components/spaces/ScreenShareButton.tsx
git commit -m "feat(spaces): session tracking on join/leave + screen share permissions by room type"
```

- [ ] **Step 5: Push and create PR**

```bash
git push -u origin feat/spaces-upgrade-phase1
gh pr create --title "feat: Spaces Phase 1 — voice channels, stages, DJ mode, minutes tracking" --body "..."
```

---

## Summary: 8 Tasks, ~8 Commits

| Task | What | New Files | Modified Files |
|------|------|-----------|----------------|
| 1 | Database schema + seed | 2 | 2 |
| 2 | Config + session tracking API | 2 | 1 |
| 3 | Leaderboard + stats API | 2 | 0 |
| 4 | Channel sidebar + strip + stage card | 4 | 0 |
| 5 | Rebuild spaces page layout | 0 | 4 |
| 6 | Dual in-room layouts + toggle | 3 | 2 |
| 7 | DJ mode music sidebar | 0 | 2 |
| 8 | Session wiring + permissions | 0 | 2 |
