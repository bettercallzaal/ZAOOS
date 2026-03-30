import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { upsertSong } from '@/lib/music/library';
import { isMusicUrl } from '@/lib/music/isMusicUrl';
import { logger } from '@/lib/logger';

const ALLOWED_EMOJIS = ['\uD83D\uDD25', '\u2764\uFE0F', '\uD83C\uDFB5', '\uD83D\uDC8E', '\uD83D\uDC4F', '\uD83E\uDD2F'] as const;

const reactSchema = z.object({
  url: z.string().url().max(500),
  emoji: z.string().refine((e) => (ALLOWED_EMOJIS as readonly string[]).includes(e), {
    message: 'Invalid emoji',
  }),
});

/**
 * Helper to get emoji->count map for a song
 */
async function getReactionCounts(songId: string): Promise<Record<string, number>> {
  const { data } = await supabaseAdmin
    .from('song_reactions')
    .select('emoji')
    .eq('song_id', songId);

  const counts: Record<string, number> = {};
  for (const row of data || []) {
    counts[row.emoji] = (counts[row.emoji] || 0) + 1;
  }
  return counts;
}

/**
 * GET /api/music/library/react?url=... — get reactions for a song
 */
export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
      return NextResponse.json({ reactions: {}, userReactions: [] });
    }

    // Get all reaction counts and user's reactions in parallel
    const [reactions, userResult] = await Promise.allSettled([
      getReactionCounts(song.id),
      supabaseAdmin
        .from('song_reactions')
        .select('emoji')
        .eq('song_id', song.id)
        .eq('user_fid', session.fid),
    ]);

    const reactionCounts = reactions.status === 'fulfilled' ? reactions.value : {};
    const userReactions = userResult.status === 'fulfilled'
      ? (userResult.value.data || []).map((r: { emoji: string }) => r.emoji)
      : [];

    return NextResponse.json({ reactions: reactionCounts, userReactions });
  } catch (err) {
    logger.error('[react] GET failed:', err);
    return NextResponse.json({ error: 'Failed to get reactions' }, { status: 500 });
  }
}

/**
 * POST /api/music/library/react — toggle a reaction on a song
 */
export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = reactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { url, emoji } = parsed.data;

    // Upsert the song to the library first
    const platform = isMusicUrl(url) || 'audio';
    const { id: songId } = await upsertSong({
      url,
      platform,
      submittedByFid: session.fid,
      source: 'manual',
    });

    // Check if this reaction already exists
    const { data: existing } = await supabaseAdmin
      .from('song_reactions')
      .select('id')
      .eq('user_fid', session.fid)
      .eq('song_id', songId)
      .eq('emoji', emoji)
      .maybeSingle();

    let reacted: boolean;

    if (existing) {
      // Remove reaction (toggle off)
      await supabaseAdmin
        .from('song_reactions')
        .delete()
        .eq('id', existing.id);
      reacted = false;
    } else {
      // Add reaction (toggle on)
      await supabaseAdmin
        .from('song_reactions')
        .insert({ user_fid: session.fid, song_id: songId, emoji });
      reacted = true;
    }

    // Get updated reaction counts
    const reactions = await getReactionCounts(songId);

    return NextResponse.json({ reacted, reactions });
  } catch (err) {
    logger.error('[react] POST failed:', err);
    return NextResponse.json({ error: 'Failed to toggle reaction' }, { status: 500 });
  }
}
