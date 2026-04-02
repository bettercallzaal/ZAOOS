# Sprint 3C: Collect Button + Permaweb Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users collect (buy) Arweave music tracks in-app, and browse all ZAO-minted music in a Permaweb Library view

**Architecture:** CollectButton records collections in Supabase (actual $U purchases happen on BazAR — we track intent + link out). Permaweb Library fetches from `arweave_assets` table. Artist assets page shows what a member has minted.

**Tech Stack:** React 19, Supabase, existing arweave_assets table, next/dynamic

---

## Task 1: Collect API Route

**Files:**
- Create: `src/app/api/music/collect/route.ts`

Records that a user collected/bookmarked an Arweave asset. For MVP, this tracks intent in Supabase and increments the collected_count. Actual purchase happens on BazAR (external).

```typescript
// src/app/api/music/collect/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

const CollectSchema = z.object({
  assetTxId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session?.fid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CollectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { assetTxId } = parsed.data;

    // Check asset exists
    const { data: asset } = await supabaseAdmin
      .from('arweave_assets')
      .select('id, collected_count')
      .eq('arweave_tx_id', assetTxId)
      .single();

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Check if already collected
    const { data: existing } = await supabaseAdmin
      .from('arweave_collections')
      .select('id')
      .eq('asset_id', asset.id)
      .eq('collector_fid', session.fid)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Already collected' }, { status: 409 });
    }

    // Record collection
    await supabaseAdmin
      .from('arweave_collections')
      .insert({
        asset_id: asset.id,
        collector_fid: session.fid,
        collector_address: '',
      });

    // Increment count
    await supabaseAdmin
      .from('arweave_assets')
      .update({ collected_count: (asset.collected_count || 0) + 1 })
      .eq('id', asset.id);

    return NextResponse.json({
      success: true,
      collectedCount: (asset.collected_count || 0) + 1,
    });
  } catch (error) {
    console.error('[music/collect] Error:', error);
    return NextResponse.json({ error: 'Collection failed' }, { status: 500 });
  }
}
```

---

## Task 2: CollectButton Component

**Files:**
- Create: `src/components/music/CollectButton.tsx`

A button that records collection in Supabase and links to BazAR for actual purchase.

```typescript
// src/components/music/CollectButton.tsx
'use client';

import { useState } from 'react';

interface CollectButtonProps {
  assetTxId: string;
  collectedCount: number;
  bazarUrl: string;
  compact?: boolean;
}

export default function CollectButton({ assetTxId, collectedCount, bazarUrl, compact }: CollectButtonProps) {
  const [collected, setCollected] = useState(false);
  const [count, setCount] = useState(collectedCount);
  const [collecting, setCollecting] = useState(false);

  const handleCollect = async () => {
    setCollecting(true);
    try {
      const res = await fetch('/api/music/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetTxId }),
      });
      if (res.ok) {
        const data = await res.json();
        setCollected(true);
        setCount(data.collectedCount);
      }
    } finally {
      setCollecting(false);
    }
  };

  if (collected) {
    return (
      <a
        href={bazarUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1 rounded-lg border border-green-500/30 bg-green-500/10 text-green-400 transition-colors hover:bg-green-500/20 ${
          compact ? 'px-2 py-1 text-[10px]' : 'px-3 py-1.5 text-xs'
        }`}
      >
        <span>Collected</span>
        <span className="opacity-60">{count}</span>
      </a>
    );
  }

  return (
    <button
      onClick={handleCollect}
      disabled={collecting}
      className={`inline-flex items-center gap-1 rounded-lg border border-[#f5a623]/30 bg-[#f5a623]/10 text-[#f5a623] transition-colors hover:bg-[#f5a623]/20 disabled:opacity-50 ${
        compact ? 'px-2 py-1 text-[10px]' : 'px-3 py-1.5 text-xs'
      }`}
    >
      <span>{collecting ? '...' : 'Collect'}</span>
      {count > 0 && <span className="opacity-60">{count}</span>}
    </button>
  );
}
```

---

## Task 3: Permaweb Library API Route

**Files:**
- Create: `src/app/api/music/permaweb/route.ts`

Fetches all Arweave assets minted by ZAO members from the database.

```typescript
// src/app/api/music/permaweb/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const artist = req.nextUrl.searchParams.get('artist');
    const fid = req.nextUrl.searchParams.get('fid');
    const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') || '50'), 100);
    const offset = Number(req.nextUrl.searchParams.get('offset') || '0');

    let query = supabaseAdmin
      .from('arweave_assets')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (artist) query = query.ilike('artist', `%${artist}%`);
    if (fid) query = query.eq('fid', Number(fid));

    const { data: assets, error } = await query;

    if (error) {
      console.error('[music/permaweb] Error:', error);
      return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }

    // Check which assets the current user has collected
    const assetIds = (assets || []).map(a => a.id);
    const { data: collections } = await supabaseAdmin
      .from('arweave_collections')
      .select('asset_id')
      .eq('collector_fid', session.fid)
      .in('asset_id', assetIds.length > 0 ? assetIds : ['none']);

    const collectedIds = new Set((collections || []).map(c => c.asset_id));

    const enriched = (assets || []).map(a => ({
      ...a,
      coverUrl: a.cover_tx_id ? `https://arweave.net/${a.cover_tx_id}` : null,
      audioUrl: `https://arweave.net/${a.arweave_tx_id}`,
      bazarUrl: `https://bazar.arweave.net/#/asset/${a.arweave_tx_id}`,
      collected: collectedIds.has(a.id),
    }));

    return NextResponse.json({ assets: enriched, total: enriched.length }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' },
    });
  } catch (error) {
    console.error('[music/permaweb] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
```

---

## Task 4: Permaweb Library Page Component

**Files:**
- Create: `src/components/music/PermawebLibrary.tsx`

Grid of Arweave-minted tracks with cover art, play button, collect button, and BazAR link.

The component should:
1. Fetch from `/api/music/permaweb`
2. Display as a grid of cards (2 cols mobile, 3 tablet, 4 desktop)
3. Each card: cover art, title, artist, genre badge, collected count, CollectButton, play button (using existing usePlayer hook)
4. Filter by artist name (search input)
5. Loading skeletons
6. Empty state: "No tracks minted yet. Be the first!"
7. "Permanent" badge on each card (Arweave permanence indicator)

---

## Task 5: Add Permaweb Library Tab to Music Page

**Files:**
- Modify: `src/components/music/MusicPage.tsx` or music page

Add a "Permaweb" tab alongside existing music tabs that renders the PermawebLibrary component.

---

## Summary

| Task | Feature | Files | Est. |
|------|---------|-------|------|
| 1 | Collect API | 1 new route | 5 min |
| 2 | CollectButton | 1 new component | 5 min |
| 3 | Permaweb API | 1 new route | 10 min |
| 4 | Permaweb Library UI | 1 new component | 15 min |
| 5 | Wire into music page | 1 edit | 10 min |

**Total: 4 new files, 1 edit, ~45 minutes**
