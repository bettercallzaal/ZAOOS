import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const tag = searchParams.get('tag') || '';
    const sort = searchParams.get('sort') || 'newest';
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

    let query = supabaseAdmin
      .from('research_entries')
      .select('*');

    if (search) {
      query = query.or(
        `topic.ilike.%${search}%,ai_summary.ilike.%${search}%,note.ilike.%${search}%`
      );
    }

    if (tag) {
      query = query.contains('tags', [tag]);
    }

    if (sort === 'upvoted') {
      query = query.order('upvote_count', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data: entries, error } = await query;
    if (error) throw error;

    const entryIds = (entries || []).map((e: { id: string }) => e.id);
    let userVotes: string[] = [];
    if (entryIds.length > 0 && session.fid) {
      const { data: votes } = await supabaseAdmin
        .from('research_entry_votes')
        .select('entry_id')
        .eq('fid', session.fid)
        .in('entry_id', entryIds);
      userVotes = (votes || []).map((v: { entry_id: string }) => v.entry_id);
    }

    return NextResponse.json({
      entries: entries || [],
      userVotes,
    });
  } catch (error) {
    console.error('[library/entries] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
  }
}
