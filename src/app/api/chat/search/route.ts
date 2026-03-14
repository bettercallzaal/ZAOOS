import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { ENV } from '@/lib/env';

const NEYNAR_BASE = 'https://api.neynar.com/v2/farcaster';
const ALLOWED_CHANNELS = ['zao', 'zabal', 'cocconcertz'];
const SEARCH_LIMIT = 20;

// Channel URL format used by Neynar search
const CHANNEL_URLS: Record<string, string> = {
  zao: 'https://farcaster.group/zao',
  zabal: 'https://farcaster.group/zabal',
  cocconcertz: 'https://farcaster.group/cocconcertz',
};

export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const query = req.nextUrl.searchParams.get('q')?.trim();
  const channel = req.nextUrl.searchParams.get('channel') || 'zao';

  if (!query || query.length < 2) {
    return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
  }

  if (!ALLOWED_CHANNELS.includes(channel)) {
    return NextResponse.json({ error: 'Invalid channel' }, { status: 400 });
  }

  try {
    // ── 1. Try Neynar cast search (broader, supports operators) ─────────────
    let neynarResults: {
      hash: string;
      author: { fid: number; username: string; display_name: string; pfp_url: string };
      text: string;
      timestamp: string;
      replies: { count: number };
    }[] = [];

    try {
      const params = new URLSearchParams({
        q: query,
        limit: String(SEARCH_LIMIT),
      });
      // Filter by channel if we have the URL
      if (CHANNEL_URLS[channel]) {
        params.set('channel_id', channel);
      }

      const res = await fetch(`${NEYNAR_BASE}/cast/search?${params}`, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ENV.NEYNAR_API_KEY,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const casts = data.result?.casts || [];
        neynarResults = casts.map((c: Record<string, unknown>) => {
          const author = (c.author ?? {}) as Record<string, unknown>;
          const replies = (c.replies ?? {}) as Record<string, unknown>;
          return {
            hash: c.hash as string,
            author: {
              fid: author.fid as number,
              username: (author.username as string) || '',
              display_name: (author.display_name as string) || '',
              pfp_url: (author.pfp_url as string) || '',
            },
            text: (c.text as string) || '',
            timestamp: (c.timestamp as string) || '',
            replies: { count: (replies.count as number) || 0 },
          };
        });
      }
    } catch (neynarErr) {
      console.error('[search] Neynar search failed, falling back to DB:', neynarErr);
    }

    // ── 2. Also search local DB (catches cached casts Neynar might miss) ────
    const { data: dbData } = await supabaseAdmin
      .from('channel_casts')
      .select('*')
      .eq('channel_id', channel)
      .ilike('text', `%${query}%`)
      .order('timestamp', { ascending: false })
      .limit(SEARCH_LIMIT);

    const dbResults = (dbData || []).map((row) => ({
      hash: row.hash as string,
      author: {
        fid: row.fid as number,
        username: (row.author_username as string) || '',
        display_name: (row.author_display as string) || '',
        pfp_url: (row.author_pfp as string) || '',
      },
      text: (row.text as string) || '',
      timestamp: (row.timestamp as string) || '',
      replies: { count: (row.replies_count as number) || 0 },
    }));

    // ── 3. Merge & deduplicate (Neynar results first, then DB-only) ─────────
    const seen = new Set<string>();
    const merged: typeof neynarResults = [];

    for (const r of neynarResults) {
      if (!seen.has(r.hash)) {
        seen.add(r.hash);
        merged.push(r);
      }
    }
    for (const r of dbResults) {
      if (!seen.has(r.hash)) {
        seen.add(r.hash);
        merged.push(r);
      }
    }

    // ── 4. Filter out hidden messages ───────────────────────────────────────
    const hashes = merged.map((r) => r.hash);
    const { data: hiddenData } = await supabaseAdmin
      .from('hidden_messages')
      .select('cast_hash')
      .in('cast_hash', hashes.length > 0 ? hashes : ['none']);

    const hidden = new Set((hiddenData || []).map((h: { cast_hash: string }) => h.cast_hash));
    const results = merged.filter((r) => !hidden.has(r.hash)).slice(0, SEARCH_LIMIT);

    return NextResponse.json({ results });
  } catch (error) {
    console.error('[search] error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
