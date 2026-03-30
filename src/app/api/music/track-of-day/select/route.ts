import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { autoCastToZao } from '@/lib/publish/auto-cast';

// POST — select today's Track of the Day
// Admin-only manual selection, OR auto-select if past cutoff (6pm EST)
export async function POST() {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const today = new Date().toISOString().slice(0, 10);

    // Check if a track is already selected for today
    const { data: alreadySelected } = await supabaseAdmin
      .from('track_of_the_day')
      .select('id')
      .eq('selected_date', today)
      .maybeSingle();

    if (alreadySelected) {
      return NextResponse.json(
        { error: 'A track has already been selected for today' },
        { status: 409 },
      );
    }

    // Determine if this is admin manual select or auto-select
    const isAdmin = session.isAdmin;
    const cutoffHour = 23; // 6pm EST ~ 23:00 UTC
    const now = new Date();
    const cutoffToday = new Date(`${today}T${String(cutoffHour).padStart(2, '0')}:00:00.000Z`);
    const isPastCutoff = now >= cutoffToday;

    if (!isAdmin && !isPastCutoff) {
      return NextResponse.json(
        { error: 'Only admins can select before the cutoff time (6pm EST)' },
        { status: 403 },
      );
    }

    // Get today's highest-voted nomination
    const { data: topNomination, error: fetchError } = await supabaseAdmin
      .from('track_of_the_day')
      .select('*')
      .is('selected_date', null)
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`)
      .order('votes_count', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!topNomination) {
      return NextResponse.json(
        { error: 'No nominations to select from today' },
        { status: 404 },
      );
    }

    // Set selected_date to today
    const { data: selected, error: updateError } = await supabaseAdmin
      .from('track_of_the_day')
      .update({ selected_date: today })
      .eq('id', topNomination.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Fire-and-forget: auto-cast Track of the Day announcement
    const title = selected.title || 'Unknown Track';
    const artist = selected.artist || 'Unknown Artist';
    autoCastToZao(
      `\u{1F3B5} Track of the Day: ${title} by ${artist} \u2014 Listen on ZAO OS: zaoos.com/music`,
      'https://zaoos.com/music',
    ).catch((err) => console.error('[totd] Auto-cast failed:', err));

    return NextResponse.json({ success: true, selected });
  } catch (error) {
    console.error('Track of the Day select error:', error);
    return NextResponse.json({ error: 'Failed to select track of the day' }, { status: 500 });
  }
}
