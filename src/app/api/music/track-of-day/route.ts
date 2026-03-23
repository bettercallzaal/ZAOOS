import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { isMusicUrl } from '@/lib/music/isMusicUrl';
import { z } from 'zod';

const nominateSchema = z.object({
  url: z.string().url().max(500),
  title: z.string().min(1).max(200),
  artist: z.string().min(1).max(200),
  artworkUrl: z.string().url().max(500).optional(),
});

// GET — return today's Track of the Day + current nominations
export async function GET() {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // Fetch today's selected track + today's nominations in parallel
    const [selectedResult, nominationsResult] = await Promise.allSettled([
      supabaseAdmin
        .from('track_of_the_day')
        .select('*')
        .eq('selected_date', today)
        .maybeSingle(),
      supabaseAdmin
        .from('track_of_the_day')
        .select('*')
        .is('selected_date', null)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`)
        .order('votes_count', { ascending: false }),
    ]);

    const selected =
      selectedResult.status === 'fulfilled' && !selectedResult.value.error
        ? selectedResult.value.data
        : null;

    const nominations =
      nominationsResult.status === 'fulfilled' && !nominationsResult.value.error
        ? nominationsResult.value.data || []
        : [];

    // Get the current user's votes on today's nominations
    const nominationIds = nominations.map((n: { id: string }) => n.id);
    let userVotedSet = new Set<string>();

    if (nominationIds.length > 0) {
      const { data: userVotes } = await supabaseAdmin
        .from('track_of_day_votes')
        .select('track_id')
        .in('track_id', nominationIds)
        .eq('voter_fid', session.fid);

      if (userVotes) {
        userVotedSet = new Set(userVotes.map((v: { track_id: string }) => v.track_id));
      }
    }

    const enrichedNominations = nominations.map((n: { id: string }) => ({
      ...n,
      user_voted: userVotedSet.has(n.id),
    }));

    // Calculate cutoff time (6pm EST = 23:00 UTC during EDT, 22:00 during EST)
    // Use 23:00 UTC as a safe default
    const cutoffHour = 23;
    const now = new Date();
    const cutoffToday = new Date(`${today}T${String(cutoffHour).padStart(2, '0')}:00:00.000Z`);
    const isPastCutoff = now >= cutoffToday;

    return NextResponse.json({
      selected,
      nominations: enrichedNominations,
      isPastCutoff,
      today,
    });
  } catch (error) {
    console.error('Track of the Day GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch track of the day' }, { status: 500 });
  }
}

// POST — nominate a track (max 1 per user per day)
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

    const { url, title, artist, artworkUrl } = parsed.data;

    // Validate it's a music URL
    const trackType = isMusicUrl(url);
    if (!trackType) {
      return NextResponse.json(
        {
          error:
            'Not a recognized music URL. Supported: Spotify, Apple Music, SoundCloud, YouTube, Tidal, Bandcamp, Audius, Sound.xyz, or direct audio files.',
        },
        { status: 400 },
      );
    }

    const today = new Date().toISOString().slice(0, 10);

    // Check if user already nominated today
    const { data: existing } = await supabaseAdmin
      .from('track_of_the_day')
      .select('id')
      .eq('nominated_by_fid', session.fid)
      .is('selected_date', null)
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: 'You have already nominated a track today' },
        { status: 409 },
      );
    }

    // Also check if this URL was already nominated today
    const { data: dupeUrl } = await supabaseAdmin
      .from('track_of_the_day')
      .select('id')
      .eq('track_url', url)
      .is('selected_date', null)
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`)
      .limit(1);

    if (dupeUrl && dupeUrl.length > 0) {
      return NextResponse.json(
        { error: 'This track has already been nominated today' },
        { status: 409 },
      );
    }

    const { data: nomination, error } = await supabaseAdmin
      .from('track_of_the_day')
      .insert({
        track_url: url,
        track_title: title,
        track_artist: artist,
        track_type: trackType,
        artwork_url: artworkUrl || null,
        nominated_by_fid: session.fid,
        nominated_by_username: session.username,
        votes_count: 0,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, nomination });
  } catch (error) {
    console.error('Track of the Day POST error:', error);
    return NextResponse.json({ error: 'Failed to nominate track' }, { status: 500 });
  }
}
