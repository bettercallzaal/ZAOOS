import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { libraryVoteSchema } from '@/lib/validation/library-schemas';

export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    const { entry_id } = parsed.data;
    const fid = session.fid;

    // Check if vote exists
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('research_entry_votes')
      .select('id')
      .eq('entry_id', entry_id)
      .eq('fid', fid)
      .maybeSingle();

    if (checkError) throw checkError;

    let voted: boolean;

    if (existing) {
      const { error: deleteError } = await supabaseAdmin
        .from('research_entry_votes')
        .delete()
        .eq('id', existing.id);
      if (deleteError) throw deleteError;
      voted = false;
    } else {
      const { error: insertError } = await supabaseAdmin
        .from('research_entry_votes')
        .insert({ entry_id, fid });
      if (insertError) throw insertError;
      voted = true;
    }

    // Get accurate count
    const { count, error: countError } = await supabaseAdmin
      .from('research_entry_votes')
      .select('*', { count: 'exact', head: true })
      .eq('entry_id', entry_id);

    if (countError) throw countError;

    // Update denormalized count
    await supabaseAdmin
      .from('research_entries')
      .update({ upvote_count: count ?? 0 })
      .eq('id', entry_id);

    return NextResponse.json({ voted, voteCount: count ?? 0 });
  } catch (error) {
    console.error('[library/vote] Error:', error);
    return NextResponse.json({ error: 'Failed to process vote' }, { status: 500 });
  }
}
