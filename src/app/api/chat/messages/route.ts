import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { getChannelFeed } from '@/lib/farcaster/neynar';
import { supabaseAdmin } from '@/lib/db/supabase';
import { Cast } from '@/types';

const ALLOWED_CHANNELS = ['zao', 'zabal', 'cocconcertz'];
const FEED_LIMIT = 20;

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

// Backfill: fetch from Neynar and store in DB for future reads
async function backfillFromNeynar(channel: string): Promise<Cast[]> {
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

    // Fire-and-forget — don't block the response
    supabaseAdmin
      .from('channel_casts')
      .upsert(rows, { onConflict: 'hash' })
      .then(({ error }) => {
        if (error) console.error('[messages] backfill upsert error:', error);
      });
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

  try {
    // ── 1. Read from our own DB (no Neynar credits) ──────────────────────────
    const { data: dbRows, error: dbError } = await supabaseAdmin
      .from('channel_casts')
      .select('*')
      .eq('channel_id', channel)
      .order('timestamp', { ascending: false })
      .limit(FEED_LIMIT);

    let casts: Cast[];

    if (dbError) {
      console.error('[messages] DB read error:', dbError);
      // Fall through to Neynar on DB errors
      casts = await backfillFromNeynar(channel);
    } else if (!dbRows || dbRows.length === 0) {
      // ── 2. DB empty → backfill once from Neynar, store for next time ────
      casts = await backfillFromNeynar(channel);
    } else {
      casts = dbRows.map(rowToCast);
    }

    // ── 3. Filter out admin-hidden messages ─────────────────────────────────
    const castHashes = casts.map((c) => c.hash);
    const { data: hiddenData } = await supabaseAdmin
      .from('hidden_messages')
      .select('cast_hash')
      .in('cast_hash', castHashes.length > 0 ? castHashes : ['none']);

    const hiddenHashes = new Set(
      (hiddenData || []).map((h: { cast_hash: string }) => h.cast_hash)
    );

    const visibleCasts = casts.filter((c) => !hiddenHashes.has(c.hash));

    return NextResponse.json({ casts: visibleCasts });
  } catch (error) {
    console.error('[messages] error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}
