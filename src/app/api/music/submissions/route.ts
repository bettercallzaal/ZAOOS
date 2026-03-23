import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { isMusicUrl } from '@/lib/music/isMusicUrl';
import { upsertSong } from '@/lib/music/library';
import { z } from 'zod';

const VALID_TAGS = ['Hip-Hop', 'R&B', 'Electronic', 'Lo-Fi', 'Jazz', 'Afrobeats', 'Soul', 'Experimental'] as const;

const submitSchema = z.object({
  url: z.string().url().max(500),
  title: z.string().min(1).max(200).optional(),
  artist: z.string().min(1).max(200).optional(),
  note: z.string().max(500).optional(),
  tags: z.array(z.enum(VALID_TAGS)).max(3).optional(),
});

// GET - list song submissions
export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const channel = req.nextUrl.searchParams.get('channel') || 'zao';
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '50'), 100);
  const statusParam = req.nextUrl.searchParams.get('status'); // 'pending' | 'all' | null

  try {
    let query = supabaseAdmin
      .from('song_submissions')
      .select('*')
      .eq('channel', channel)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Admins can filter by status; regular users only see approved
    if (session.isAdmin && statusParam === 'all') {
      // No status filter — show everything
    } else if (session.isAdmin && statusParam === 'pending') {
      query = query.eq('status', 'pending');
    } else {
      // Default: regular users (and admins without filter) see approved only
      query = query.eq('status', 'approved');
    }

    const { data, error } = await query;

    if (error) throw error;

    const submissions = data || [];

    if (submissions.length === 0) {
      return NextResponse.json({ submissions: [] });
    }

    // Fetch vote counts and user's votes in parallel
    const submissionIds = submissions.map((s: { id: string }) => s.id);

    const [voteCounts, userVotes] = await Promise.allSettled([
      supabaseAdmin
        .from('song_votes')
        .select('submission_id')
        .in('submission_id', submissionIds),
      supabaseAdmin
        .from('song_votes')
        .select('submission_id')
        .in('submission_id', submissionIds)
        .eq('voter_fid', session.fid),
    ]);

    // Build vote count map
    const countMap: Record<string, number> = {};
    if (voteCounts.status === 'fulfilled' && voteCounts.value.data) {
      for (const vote of voteCounts.value.data) {
        countMap[vote.submission_id] = (countMap[vote.submission_id] || 0) + 1;
      }
    }

    // Build user voted set
    const userVotedSet = new Set<string>();
    if (userVotes.status === 'fulfilled' && userVotes.value.data) {
      for (const vote of userVotes.value.data) {
        userVotedSet.add(vote.submission_id);
      }
    }

    // Attach vote data to each submission
    const enriched = submissions.map((sub: { id: string }) => ({
      ...sub,
      vote_count: countMap[sub.id] || 0,
      user_voted: userVotedSet.has(sub.id),
    }));

    return NextResponse.json({ submissions: enriched });
  } catch (error) {
    console.error('Fetch submissions error:', error);
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}

// POST - submit a song
export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }

    const { url, title, artist, note, tags } = parsed.data;
    const { communityConfig } = await import('@/../community.config');
    const ALLOWED = communityConfig.farcaster.channels;
    const channel = ALLOWED.includes(body.channel) ? body.channel : 'zao';

    // Validate it's a music URL
    const trackType = isMusicUrl(url);
    if (!trackType) {
      return NextResponse.json({
        error: 'Not a recognized music URL. Supported: Spotify, Apple Music, SoundCloud, YouTube, Tidal, Bandcamp, Audius, Sound.xyz, or direct audio files.',
      }, { status: 400 });
    }

    // Check for duplicate URL in same channel
    const { data: existing } = await supabaseAdmin
      .from('song_submissions')
      .select('id')
      .eq('url', url)
      .eq('channel', channel)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'This song has already been submitted to this channel' }, { status: 409 });
    }

    // Auto-approve if submitter is admin, otherwise pending
    const submissionStatus = session.isAdmin ? 'approved' : 'pending';

    // Build insert row — include tags only if provided
    const insertRow: Record<string, unknown> = {
      url,
      title: title || null,
      artist: artist || null,
      note: note || null,
      track_type: trackType,
      channel,
      submitted_by_fid: session.fid,
      submitted_by_username: session.username,
      submitted_by_display: session.displayName,
      status: submissionStatus,
      ...(session.isAdmin ? { reviewed_by_fid: session.fid, reviewed_at: new Date().toISOString() } : {}),
    };
    if (tags && tags.length > 0) {
      insertRow.tags = tags;
    }

    // Try insert with tags — if column doesn't exist, retry without
    let result = await supabaseAdmin
      .from('song_submissions')
      .insert(insertRow)
      .select()
      .single();

    if (result.error && result.error.message?.includes('tags')) {
      delete insertRow.tags;
      result = await supabaseAdmin
        .from('song_submissions')
        .insert(insertRow)
        .select()
        .single();
    }

    if (result.error) throw result.error;

    // Save to song library (fire and forget)
    upsertSong({
      url,
      platform: trackType,
      title: title || 'Untitled',
      artist: artist || undefined,
      submittedByFid: session.fid,
      source: 'submission',
      tags: tags as string[] | undefined,
    }).catch(() => {});

    return NextResponse.json({ success: true, submission: result.data });
  } catch (error) {
    console.error('Submit song error:', error);
    return NextResponse.json({ error: 'Failed to submit song' }, { status: 500 });
  }
}

// DELETE - remove a submission (admin or submitter)
export async function DELETE(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const deleteSchema = z.object({
      id: z.string().uuid(),
    });
    const parsed = deleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }
    const { id } = parsed.data;

    // Check ownership or admin
    const { data: submission } = await supabaseAdmin
      .from('song_submissions')
      .select('submitted_by_fid')
      .eq('id', id)
      .single();

    if (!submission) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (submission.submitted_by_fid !== session.fid && !session.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('song_submissions')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete submission error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
