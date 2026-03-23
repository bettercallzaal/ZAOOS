import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { z } from 'zod';

const voteSchema = z.object({
  trackId: z.string().uuid(),
});

// POST — toggle vote on a nomination
export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = voteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { trackId } = parsed.data;
    const voterFid = session.fid;

    // Verify the nomination exists and hasn't been selected yet
    const { data: track, error: trackError } = await supabaseAdmin
      .from('track_of_the_day')
      .select('id, selected_date')
      .eq('id', trackId)
      .maybeSingle();

    if (trackError) throw trackError;

    if (!track) {
      return NextResponse.json({ error: 'Nomination not found' }, { status: 404 });
    }

    if (track.selected_date) {
      return NextResponse.json(
        { error: 'Cannot vote on an already-selected track' },
        { status: 400 },
      );
    }

    // Check if vote already exists
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('track_of_day_votes')
      .select('id')
      .eq('track_id', trackId)
      .eq('voter_fid', voterFid)
      .maybeSingle();

    if (checkError) throw checkError;

    let voted: boolean;

    if (existing) {
      // Remove vote (toggle off)
      const { error: deleteError } = await supabaseAdmin
        .from('track_of_day_votes')
        .delete()
        .eq('id', existing.id);

      if (deleteError) throw deleteError;
      voted = false;
    } else {
      // Add vote (toggle on)
      const { error: insertError } = await supabaseAdmin
        .from('track_of_day_votes')
        .insert({
          track_id: trackId,
          voter_fid: voterFid,
        });

      if (insertError) throw insertError;
      voted = true;
    }

    // Get updated count from votes table (source of truth)
    const { count, error: countError } = await supabaseAdmin
      .from('track_of_day_votes')
      .select('*', { count: 'exact', head: true })
      .eq('track_id', trackId);

    if (countError) throw countError;

    const voteCount = count ?? 0;

    // Sync denormalized votes_count on the nomination row
    await supabaseAdmin
      .from('track_of_the_day')
      .update({ votes_count: voteCount })
      .eq('id', trackId);

    return NextResponse.json({ voted, voteCount });
  } catch (error) {
    console.error('Track of the Day vote error:', error);
    return NextResponse.json({ error: 'Failed to process vote' }, { status: 500 });
  }
}
