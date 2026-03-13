import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

const ALLOWED_CHANNELS = ['zao', 'zabal', 'cocconcertz'];
const SEARCH_LIMIT = 20;

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
    // Search using ilike for simple text matching
    const { data, error } = await supabaseAdmin
      .from('channel_casts')
      .select('*')
      .eq('channel_id', channel)
      .ilike('text', `%${query}%`)
      .order('timestamp', { ascending: false })
      .limit(SEARCH_LIMIT);

    if (error) {
      console.error('[search] DB error:', error);
      return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }

    // Filter out hidden messages
    const hashes = (data || []).map((r) => r.hash as string);
    const { data: hiddenData } = await supabaseAdmin
      .from('hidden_messages')
      .select('cast_hash')
      .in('cast_hash', hashes.length > 0 ? hashes : ['none']);

    const hidden = new Set((hiddenData || []).map((h: { cast_hash: string }) => h.cast_hash));

    const results = (data || [])
      .filter((r) => !hidden.has(r.hash as string))
      .map((row) => ({
        hash: row.hash,
        author: {
          fid: row.fid,
          username: row.author_username || '',
          display_name: row.author_display || '',
          pfp_url: row.author_pfp || '',
        },
        text: row.text || '',
        timestamp: row.timestamp || '',
        replies: { count: row.replies_count || 0 },
      }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error('[search] error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
