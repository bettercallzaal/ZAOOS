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

    // Check if already voted
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('track_of_day_votes')
      .select('id')
      .eq('track_id', trackId)
      .eq('voter_fid', voterFid)
      .maybeSingle();

    if (checkError) throw checkError;

    let voted: boolean;

    if (existing) {
      // Remove vote
      const { error: deleteError } = await supabaseAdmin
        .from('track_of_day_votes')
        .delete()
        .eq('id', existing.id);
      if (deleteError) throw deleteError;

      voted = false;
    } else {
      // Add vote
      const { error: insertError } = await supabaseAdmin
        .from('track_of_day_votes')
        .insert({ track_id: trackId, voter_fid: voterFid });
      if (insertError) throw insertError;

      voted = true;
    }

    // Get updated vote count
    const { count } = await supabaseAdmin
      .from('track_of_day_votes')
      .select('*', { count: 'exact', head: true })
      .eq('track_id', trackId);

    // Update cached count on the track
    await supabaseAdmin
      .from('track_of_the_day')
      .update({ votes_count: count || 0 })
      .eq('id', trackId);

    return NextResponse.json({ voted, voteCount: count || 0 });
  } catch (err) {
    console.error('[TOTD VOTE]', err);
    return NextResponse.json(
      { error: 'Failed to vote' },
      { status: 500 },
    );
  }
}
