import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { z } from 'zod';

const nominateSchema = z.object({
  trackUrl: z.string().url().max(500),
  trackTitle: z.string().min(1).max(200).optional(),
  trackArtist: z.string().min(1).max(200).optional(),
  trackType: z.string().max(50).optional(),
  artworkUrl: z.string().url().max(500).optional(),
});

// GET — fetch today's featured track + nominations + optional history
export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const mode = req.nextUrl.searchParams.get('mode') || 'today';
    const today = new Date().toISOString().split('T')[0];

    if (mode === 'history') {
      // Past Track of the Day winners
      const limit = Math.min(
        parseInt(req.nextUrl.searchParams.get('limit') || '14'),
        50,
      );

      const { data, error } = await supabaseAdmin
        .from('track_of_the_day')
        .select('*')
        .not('selected_date', 'is', null)
        .order('selected_date', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return NextResponse.json({ history: data || [] });
    }

    // Default: today's featured track + today's nominations
    const [featuredResult, nominationsResult] = await Promise.allSettled([
      supabaseAdmin
        .from('track_of_the_day')
        .select('*')
        .eq('selected_date', today)
        .maybeSingle(),
      supabaseAdmin
        .from('track_of_the_day')
        .select('*')
        .is('selected_date', null)
        .gte('created_at', `${today}T00:00:00Z`)
        .order('votes_count', { ascending: false })
        .limit(20),
    ]);

    const featured =
      featuredResult.status === 'fulfilled'
        ? featuredResult.value.data
        : null;

    const nominations =
      nominationsResult.status === 'fulfilled'
        ? nominationsResult.value.data || []
        : [];

    // Get current user's votes on today's nominations
    const nominationIds = nominations.map((n: { id: string }) => n.id);
    let userVotedIds: string[] = [];

    if (nominationIds.length > 0) {
      const { data: votes } = await supabaseAdmin
        .from('track_of_day_votes')
        .select('track_id')
        .in('track_id', nominationIds)
        .eq('voter_fid', session.fid);

      userVotedIds = (votes || []).map(
        (v: { track_id: string }) => v.track_id,
      );
    }

    // Check if user already nominated today
    const { data: userNom } = await supabaseAdmin
      .from('track_of_the_day')
      .select('id')
      .eq('nominated_by_fid', session.fid)
      .is('selected_date', null)
      .gte('created_at', `${today}T00:00:00Z`)
      .maybeSingle();

    return NextResponse.json({
      featured,
      nominations: nominations.map(
        (n: { id: string; [key: string]: unknown }) => ({
          ...n,
          user_voted: userVotedIds.includes(n.id),
        }),
      ),
      userNominatedToday: !!userNom,
    });
  } catch (err) {
    console.error('[TOTD GET]', err);
    return NextResponse.json(
      { error: 'Failed to fetch track of the day' },
      { status: 500 },
    );
  }
}

// POST — nominate a track (one per user per day)
export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = nominateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 },
      );
    }

    const today = new Date().toISOString().split('T')[0];

    // Check if user already nominated today
    const { data: existing } = await supabaseAdmin
      .from('track_of_the_day')
      .select('id')
      .eq('nominated_by_fid', session.fid)
      .is('selected_date', null)
      .gte('created_at', `${today}T00:00:00Z`)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'You already nominated a track today' },
        { status: 409 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from('track_of_the_day')
      .insert({
        track_url: parsed.data.trackUrl,
        track_title: parsed.data.trackTitle || null,
        track_artist: parsed.data.trackArtist || null,
        track_type: parsed.data.trackType || null,
        artwork_url: parsed.data.artworkUrl || null,
        nominated_by_fid: session.fid,
        nominated_by_username: session.username || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ nomination: data });
  } catch (err) {
    console.error('[TOTD POST]', err);
    return NextResponse.json(
      { error: 'Failed to nominate track' },
      { status: 500 },
    );
  }
}
