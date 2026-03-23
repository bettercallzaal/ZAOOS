import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { getChannelFeed } from '@/lib/farcaster/neynar';
import { supabaseAdmin } from '@/lib/db/supabase';
import { Cast } from '@/types';
import { communityConfig } from '@/../community.config';

const ALLOWED_CHANNELS: readonly string[] = communityConfig.farcaster.channels;
const FEED_LIMIT = 20;

// Server-side TTL: first request in each window refreshes from Neynar,
// subsequent requests within the window read from DB (which now has fresh data).
// This keeps reaction counts up-to-date while sharing the Neynar cost across all users.
const REFRESH_TTL = 15_000; // 15 seconds
const lastRefresh: Record<string, number> = {};

// Map a channel_casts DB row → Cast type expected by the client
function rowToCast(row: Record<string, unknown>): Cast {
  const reactions = (row.reactions ?? {}) as {
    likes_count?: number;
    recasts_count?: number;
    likes?: { fid: number }[];
    recasts?: { fid: number }[];
  };
  return {
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
    reactions: {
      likes_count: reactions.likes_count ?? 0,
      recasts_count: reactions.recasts_count ?? 0,
      likes: reactions.likes ?? [],
      recasts: reactions.recasts ?? [],
    },
    parent_hash: (row.parent_hash as string) || null,
    embeds: (row.embeds as Cast['embeds']) || [],
  };
}

// Fetch from Neynar and upsert into DB (updates reaction counts + new casts)
async function refreshFromNeynar(channel: string): Promise<Cast[]> {
  const feed = await getChannelFeed(channel, undefined, FEED_LIMIT);
  const casts: Cast[] = feed.casts || [];

  if (casts.length > 0) {
    const rows = casts.map((c) => ({
      hash: c.hash,
      channel_id: channel,
      fid: c.author.fid,
      author_username: c.author.username,
      author_display: c.author.display_name,
      author_pfp: c.author.pfp_url,
      text: c.text,
      timestamp: c.timestamp,
      embeds: c.embeds ?? [],
      reactions: c.reactions ?? {
        likes_count: 0, recasts_count: 0, likes: [], recasts: [],
      },
      replies_count: c.replies?.count ?? 0,
      parent_hash: c.parent_hash ?? null,
    }));

    // Await the DB write so data is consistent for subsequent reads
    const { error: upsertErr } = await supabaseAdmin
      .from('channel_casts')
      .upsert(rows, { onConflict: 'hash' });
    if (upsertErr) console.error('[messages] upsert error:', upsertErr);
  }

  return casts;
}

export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const channel = req.nextUrl.searchParams.get('channel') || 'zao';
  if (!ALLOWED_CHANNELS.includes(channel)) {
    return NextResponse.json({ error: 'Invalid channel' }, { status: 400 });
  }

  const cursor = req.nextUrl.searchParams.get('cursor'); // ISO timestamp
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '20', 10), 50);

  try {
    const now = Date.now();
    const needsRefresh = !cursor && (now - (lastRefresh[channel] || 0)) > REFRESH_TTL;

    let casts: Cast[];
    let hasMore = false;

    if (cursor) {
      // ── Cursor-based pagination: always read from DB ──────────────────────
      let query = supabaseAdmin
        .from('channel_casts')
        .select('*')
        .eq('channel_id', channel)
        .order('timestamp', { ascending: false })
        .limit(limit + 1); // Fetch one extra to detect hasMore

      query = query.lt('timestamp', cursor);

      const { data: dbRows } = await query;
      hasMore = (dbRows?.length || 0) > limit;
      casts = (dbRows || []).slice(0, limit).map(rowToCast);
    } else if (needsRefresh) {
      // ── Refresh window: fetch fresh from Neynar (gets real reaction counts) ──
      try {
        casts = await refreshFromNeynar(channel);
        lastRefresh[channel] = now;
      } catch (neynarErr) {
        console.error('[messages] Neynar refresh failed, falling back to DB:', neynarErr);
        // Fall back to DB on Neynar error
        const { data: dbRows } = await supabaseAdmin
          .from('channel_casts')
          .select('*')
          .eq('channel_id', channel)
          .order('timestamp', { ascending: false })
          .limit(limit);
        casts = (dbRows || []).map(rowToCast);
      }
      // Check if there are older messages beyond this page
      if (casts.length >= limit) {
        const oldestTs = casts[casts.length - 1]?.timestamp;
        if (oldestTs) {
          const { count } = await supabaseAdmin
            .from('channel_casts')
            .select('*', { count: 'exact', head: true })
            .eq('channel_id', channel)
            .lt('timestamp', oldestTs);
          hasMore = (count || 0) > 0;
        }
      }
    } else {
      // ── Within TTL: read from DB (which was recently refreshed) ──────────────
      const { data: dbRows, error: dbError } = await supabaseAdmin
        .from('channel_casts')
        .select('*')
        .eq('channel_id', channel)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (dbError || !dbRows || dbRows.length === 0) {
        // DB empty or error — force a Neynar fetch
        casts = await refreshFromNeynar(channel);
        lastRefresh[channel] = now;
      } else {
        casts = dbRows.map(rowToCast);
      }
      // Check if there are older messages beyond this page
      if (casts.length >= limit) {
        const oldestTs = casts[casts.length - 1]?.timestamp;
        if (oldestTs) {
          const { count } = await supabaseAdmin
            .from('channel_casts')
            .select('*', { count: 'exact', head: true })
            .eq('channel_id', channel)
            .lt('timestamp', oldestTs);
          hasMore = (count || 0) > 0;
        }
      }
    }

    // ── Filter out admin-hidden messages ─────────────────────────────────────
    const castHashes = casts.map((c) => c.hash);
    const { data: hiddenData } = await supabaseAdmin
      .from('hidden_messages')
      .select('cast_hash')
      .in('cast_hash', castHashes.length > 0 ? castHashes : ['none']);

    const hiddenHashes = new Set(
      (hiddenData || []).map((h: { cast_hash: string }) => h.cast_hash)
    );

    const visibleCasts = casts.filter((c) => !hiddenHashes.has(c.hash));

    // ── Enrich authors with ZID (for OG badge) ───────────────────────────────
    const authorFids = [...new Set(visibleCasts.map((c) => c.author.fid))];
    let zidMap = new Map<number, number>();
    if (authorFids.length > 0) {
      const { data: zidRows } = await supabaseAdmin
        .from('users')
        .select('fid, zid')
        .in('fid', authorFids)
        .not('zid', 'is', null);
      if (zidRows) {
        zidMap = new Map(zidRows.map((r: { fid: number; zid: number }) => [r.fid, r.zid]));
      }
    }
    const enrichedCasts = visibleCasts.map((c) => ({
      ...c,
      author: { ...c.author, zid: zidMap.get(c.author.fid) ?? null },
    }));

    return NextResponse.json({ casts: enrichedCasts, hasMore });
  } catch (error) {
    console.error('[messages] error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}
