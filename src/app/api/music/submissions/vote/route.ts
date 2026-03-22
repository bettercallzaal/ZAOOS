import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { z } from 'zod';

const voteSchema = z.object({
  submissionId: z.string().uuid(),
});

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

    const { submissionId } = parsed.data;
    const voterFid = session.fid;

    // Check if vote already exists
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('song_votes')
      .select('id')
      .eq('submission_id', submissionId)
      .eq('voter_fid', voterFid)
      .maybeSingle();

    if (checkError) throw checkError;

    let voted: boolean;

    if (existing) {
      // Remove vote (toggle off)
      const { error: deleteError } = await supabaseAdmin
        .from('song_votes')
        .delete()
        .eq('id', existing.id);

      if (deleteError) throw deleteError;
      voted = false;
    } else {
      // Add vote (toggle on)
      const { error: insertError } = await supabaseAdmin
        .from('song_votes')
        .insert({
          submission_id: submissionId,
          voter_fid: voterFid,
        });

      if (insertError) throw insertError;
      voted = true;
    }

    // Get updated vote count
    const { count, error: countError } = await supabaseAdmin
      .from('song_votes')
      .select('*', { count: 'exact', head: true })
      .eq('submission_id', submissionId);

    if (countError) throw countError;

    return NextResponse.json({ voted, voteCount: count ?? 0 });
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json({ error: 'Failed to process vote' }, { status: 500 });
  }
}
