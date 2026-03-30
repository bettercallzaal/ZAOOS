import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { upsertSong } from '@/lib/music/library';
import { isMusicUrl } from '@/lib/music/isMusicUrl';
import { logger } from '@/lib/logger';

const commentSchema = z.object({
  url: z.string().url().max(500),
  comment: z.string().min(1).max(280),
  timestampMs: z.number().int().min(0),
});

/**
 * GET /api/music/comments?url=... — get all comments for a song
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    // Find the song by URL
    const { data: song } = await supabaseAdmin
      .from('songs')
      .select('id')
      .eq('url', url)
      .maybeSingle();

    if (!song) {
      return NextResponse.json({ comments: [] });
    }

    // Get comments ordered by timestamp position
    const { data: comments, error } = await supabaseAdmin
      .from('song_comments')
      .select('id, username, comment, timestamp_ms, created_at')
      .eq('song_id', song.id)
      .order('timestamp_ms', { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      comments: (comments || []).map((c) => ({
        id: c.id,
        username: c.username,
        comment: c.comment,
        timestampMs: c.timestamp_ms,
        createdAt: c.created_at,
      })),
    });
  } catch (err) {
    logger.error('[comments] GET failed:', err);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

/**
 * POST /api/music/comments — add a timestamped comment to a song
 */
export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = commentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { url, comment, timestampMs } = parsed.data;

    // Upsert the song to the library first
    const platform = isMusicUrl(url) || 'audio';
    const { id: songId } = await upsertSong({
      url,
      platform,
      submittedByFid: session.fid,
      source: 'manual',
    });

    // Resolve username: prefer session, fall back to users table
    let username = session.username;
    if (!username) {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('username')
        .eq('fid', session.fid)
        .maybeSingle();
      username = user?.username || `fid:${session.fid}`;
    }

    // Insert the comment
    const { data: inserted, error } = await supabaseAdmin
      .from('song_comments')
      .insert({
        song_id: songId,
        user_fid: session.fid,
        username,
        comment,
        timestamp_ms: timestampMs,
      })
      .select('id, username, comment, timestamp_ms, created_at')
      .single();

    if (error) throw error;

    return NextResponse.json({
      comment: {
        id: inserted.id,
        username: inserted.username,
        comment: inserted.comment,
        timestampMs: inserted.timestamp_ms,
        createdAt: inserted.created_at,
      },
    });
  } catch (err) {
    logger.error('[comments] POST failed:', err);
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
  }
}

/**
 * DELETE /api/music/comments?id=... — delete own comment
 */
export async function DELETE(req: NextRequest) {
  const session = await getSessionData();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
  }

  try {
    // Verify the comment belongs to the user
    const { data: comment } = await supabaseAdmin
      .from('song_comments')
      .select('id, user_fid')
      .eq('id', id)
      .maybeSingle();

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (comment.user_fid !== session.fid && !session.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('song_comments')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ deleted: true });
  } catch (err) {
    logger.error('[comments] DELETE failed:', err);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
