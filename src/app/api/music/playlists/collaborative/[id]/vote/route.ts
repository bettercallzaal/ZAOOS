import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { z } from 'zod';
import { logger } from '@/lib/logger';

type RouteContext = { params: Promise<{ id: string }> };

const voteSchema = z.object({
  trackId: z.string().uuid(),
  vote: z.union([z.literal(1), z.literal(-1)]),
});

// POST — vote on a track in a collaborative playlist
export async function POST(req: NextRequest, ctx: RouteContext) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await ctx.params;

  try {
    const body = await req.json();
    const parsed = voteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { trackId, vote } = parsed.data;

    // Verify track belongs to this playlist
    const { data: track } = await supabaseAdmin
      .from('playlist_tracks')
      .select('id, votes')
      .eq('id', trackId)
      .eq('playlist_id', id)
      .single();

    if (!track) {
      return NextResponse.json({ error: 'Track not found in this playlist' }, { status: 404 });
    }

    // Check for existing vote
    const { data: existingVote } = await supabaseAdmin
      .from('playlist_votes')
      .select('id, vote')
      .eq('playlist_track_id', trackId)
      .eq('fid', session.fid)
      .single();

    let voteDelta: number = vote;

    if (existingVote) {
      if (existingVote.vote === vote) {
        // Same vote — remove it (toggle off)
        await supabaseAdmin.from('playlist_votes').delete().eq('id', existingVote.id);
        voteDelta = vote === 1 ? -1 : 1; // Reverse the previous vote
      } else {
        // Different vote — update
        await supabaseAdmin
          .from('playlist_votes')
          .update({ vote })
          .eq('id', existingVote.id);
        voteDelta = vote === 1 ? 2 : -2; // Swing from -1 to +1 or vice versa
      }
    } else {
      // New vote
      await supabaseAdmin.from('playlist_votes').insert({
        playlist_track_id: trackId,
        fid: session.fid,
        vote,
      });
    }

    // Update vote count on track
    const newVotes = (track.votes || 0) + voteDelta;
    await supabaseAdmin
      .from('playlist_tracks')
      .update({ votes: newVotes })
      .eq('id', trackId);

    return NextResponse.json({
      votes: newVotes,
      user_vote: existingVote?.vote === vote ? 0 : vote,
    });
  } catch (err) {
    logger.error('[collaborative-vote] POST error:', err);
    return NextResponse.json({ error: 'Failed to vote' }, { status: 500 });
  }
}
