import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { isMusicUrl } from '@/lib/music/isMusicUrl';
import { z } from 'zod';

const submitSchema = z.object({
  url: z.string().url().max(500),
  title: z.string().min(1).max(200).optional(),
  artist: z.string().min(1).max(200).optional(),
  note: z.string().max(500).optional(),
});

// GET - list song submissions
export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const channel = req.nextUrl.searchParams.get('channel') || 'zao';
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '50'), 100);

  try {
    const { data, error } = await supabaseAdmin
      .from('song_submissions')
      .select('*')
      .eq('channel', channel)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return NextResponse.json({ submissions: data || [] });
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

    const { url, title, artist, note } = parsed.data;
    const channel = body.channel || 'zao';

    // Validate it's a music URL
    const trackType = isMusicUrl(url);
    if (!trackType) {
      return NextResponse.json({
        error: 'Not a recognized music URL. Supported: Spotify, SoundCloud, YouTube, Audius, Sound.xyz, or direct audio files.',
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

    const { data, error } = await supabaseAdmin
      .from('song_submissions')
      .insert({
        url,
        title: title || null,
        artist: artist || null,
        note: note || null,
        track_type: trackType,
        channel,
        submitted_by_fid: session.fid,
        submitted_by_username: session.username,
        submitted_by_display: session.displayName,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, submission: data });
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
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing submission id' }, { status: 400 });
    }

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
