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

    // Sanitize search for PostgREST filter safety
    if (search) {
      const safeSearch = search.replace(/[,().\\%]/g, '');
      if (safeSearch) {
        query = query.or(
          `topic.ilike.%${safeSearch}%,ai_summary.ilike.%${safeSearch}%,note.ilike.%${safeSearch}%`
        );
      }
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

    // Get current user's vote for each entry
    const userVotes: Record<string, string> = {}; // entry_id -> vote_type
    if (entryIds.length > 0 && session.fid) {
      const { data: votes } = await supabaseAdmin
        .from('research_entry_votes')
        .select('entry_id, vote_type')
        .eq('fid', session.fid)
        .in('entry_id', entryIds);
      for (const v of votes || []) {
        userVotes[v.entry_id] = v.vote_type;
      }
    }

    // Get all voters per entry (FID + vote_type)
    const entryVoters: Record<string, { fid: number; vote_type: string }[]> = {};
    if (entryIds.length > 0) {
      const { data: allVotes } = await supabaseAdmin
        .from('research_entry_votes')
        .select('entry_id, fid, vote_type')
        .in('entry_id', entryIds);
      for (const v of allVotes || []) {
        if (!entryVoters[v.entry_id]) entryVoters[v.entry_id] = [];
        entryVoters[v.entry_id].push({ fid: v.fid, vote_type: v.vote_type });
      }
    }

    return NextResponse.json({
      entries: entries || [],
      userVotes,
      entryVoters,
    });
  } catch (error) {
    console.error('[library/entries] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
  }
}
