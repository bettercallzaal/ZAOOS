import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { libraryVoteSchema } from '@/lib/validation/library-schemas';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!session.fid) {
    return NextResponse.json({ error: 'Farcaster account required to vote' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = libraryVoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { entry_id, vote_type } = parsed.data;
    const fid = session.fid;

    // Check if vote exists
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('research_entry_votes')
      .select('id, vote_type')
      .eq('entry_id', entry_id)
      .eq('fid', fid)
      .maybeSingle();

    if (checkError) throw checkError;

    let action: 'added' | 'removed' | 'changed';

    if (existing) {
      if (existing.vote_type === vote_type) {
        // Same vote type — toggle off (remove)
        const { error: deleteError } = await supabaseAdmin
          .from('research_entry_votes')
          .delete()
          .eq('id', existing.id);
        if (deleteError) throw deleteError;
        action = 'removed';
      } else {
        // Different vote type — switch (e.g., up → down)
        const { error: updateError } = await supabaseAdmin
          .from('research_entry_votes')
          .update({ vote_type })
          .eq('id', existing.id);
        if (updateError) throw updateError;
        action = 'changed';
      }
    } else {
      // No existing vote — add new
      const { error: insertError } = await supabaseAdmin
        .from('research_entry_votes')
        .insert({ entry_id, fid, vote_type });
      if (insertError) throw insertError;
      action = 'added';
    }

    // Get accurate counts
    const { count: upCount } = await supabaseAdmin
      .from('research_entry_votes')
      .select('*', { count: 'exact', head: true })
      .eq('entry_id', entry_id)
      .eq('vote_type', 'up');

    const { count: downCount } = await supabaseAdmin
      .from('research_entry_votes')
      .select('*', { count: 'exact', head: true })
      .eq('entry_id', entry_id)
      .eq('vote_type', 'down');

    // Update denormalized counts
    await supabaseAdmin
      .from('research_entries')
      .update({
        upvote_count: upCount ?? 0,
        downvote_count: downCount ?? 0,
      })
      .eq('id', entry_id);

    return NextResponse.json({
      action,
      vote_type: action === 'removed' ? null : vote_type,
      upvote_count: upCount ?? 0,
      downvote_count: downCount ?? 0,
    });
  } catch (error) {
    logger.error('[library/vote] Error:', error);
    return NextResponse.json({ error: 'Failed to process vote' }, { status: 500 });
  }
}
