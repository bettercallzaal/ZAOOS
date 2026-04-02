# Sprint 4: WaveWarZ Native Leaderboard + Battle Log

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the WaveWarZ Intelligence iframe with a native leaderboard component + battle log, using data already in Supabase

**Architecture:** Data already synced to `wavewarz_artists` + `wavewarz_battle_log` tables via existing cron. Just need frontend components that fetch from `/api/wavewarz/artists` and a new battle log endpoint.

**Tech Stack:** React 19, existing Supabase data, existing API routes

---

## Task 1: Battle Log API Route

**Files:**
- Create: `src/app/api/wavewarz/battles/route.ts`

Fetch recent battles from `wavewarz_battle_log` table.

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') || '30'), 100);
    const artist = req.nextUrl.searchParams.get('artist');

    let query = supabaseAdmin
      .from('wavewarz_battle_log')
      .select('*')
      .order('settled_at', { ascending: false })
      .limit(limit);

    if (artist) {
      query = query.or(`artist_a.ilike.%${artist}%,artist_b.ilike.%${artist}%`);
    }

    const { data: battles, error } = await query;

    if (error) {
      console.error('[wavewarz/battles] Error:', error);
      return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }

    return NextResponse.json({ battles: battles || [] }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' },
    });
  } catch (error) {
    console.error('[wavewarz/battles] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
```

---

## Task 2: WaveWarZ Leaderboard Component

**Files:**
- Create: `src/components/wavewarz/Leaderboard.tsx`

Native leaderboard replacing the Intelligence iframe. Features:
- Fetches from `/api/wavewarz/artists`
- Sortable table: rank, name, wins, losses, win%, volume (SOL), earnings (SOL), tier badge
- Spotlight tier badges: Rising Star (green), Battle Veteran (blue), Battle Legend (gold)
- Sort toggle: by wins (default) or by volume
- Linked ZAO members get a profile link
- Mobile-responsive: card layout on small screens, table on desktop

---

## Task 3: Battle Log Component

**Files:**
- Create: `src/components/wavewarz/BattleLog.tsx`

Recent battle results. Features:
- Fetches from `/api/wavewarz/battles`
- Each battle shows: Artist A vs Artist B, winner highlighted, volume (SOL), date
- Winner gets a green highlight, loser gets gray
- Filter by artist name (search input)
- Loading skeletons

---

## Task 4: Rewrite WaveWarZ Page with Native Components

**Files:**
- Modify: `src/app/(auth)/wavewarz/page.tsx`

Replace the 3 iframes with native tabs:
1. **Leaderboard** (default) — Leaderboard component
2. **Battles** — BattleLog component
3. **Arena** — Keep the main wavewarz.com iframe for actual battling
4. Keep the "Generate WaveWarZ Post" button

---

## Summary

| Task | Feature | Files | Est. |
|------|---------|-------|------|
| 1 | Battles API | 1 new route | 5 min |
| 2 | Leaderboard UI | 1 new component | 15 min |
| 3 | BattleLog UI | 1 new component | 10 min |
| 4 | Rewrite page | 1 edit | 10 min |

**Total: 3 new files, 1 edit, ~40 minutes**
