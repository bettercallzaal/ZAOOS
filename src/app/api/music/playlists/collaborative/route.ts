import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { z } from 'zod';
import { autoCastToZao } from '@/lib/publish/auto-cast';
import { logger } from '@/lib/logger';

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  is_collaborative: z.boolean().default(true),
});

// GET — list all public collaborative playlists with counts
export async function GET() {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: playlists, error } = await supabaseAdmin
      .from('playlists')
      .select('*')
      .eq('is_collaborative', true)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!playlists || playlists.length === 0) {
      return NextResponse.json({ playlists: [] });
    }

    const playlistIds = playlists.map((p: { id: string }) => p.id);

    // Fetch track counts and member counts in parallel
    const [trackCounts, memberCounts] = await Promise.allSettled([
      supabaseAdmin
        .from('playlist_tracks')
        .select('playlist_id')
        .in('playlist_id', playlistIds),
      supabaseAdmin
        .from('playlist_members')
        .select('playlist_id, fid')
        .in('playlist_id', playlistIds),
    ]);

    const trackCountMap: Record<string, number> = {};
    const memberCountMap: Record<string, number> = {};
    const memberFidsMap: Record<string, number[]> = {};

    if (trackCounts.status === 'fulfilled' && trackCounts.value.data) {
      for (const t of trackCounts.value.data) {
        trackCountMap[t.playlist_id] = (trackCountMap[t.playlist_id] || 0) + 1;
      }
    }

    if (memberCounts.status === 'fulfilled' && memberCounts.value.data) {
      for (const m of memberCounts.value.data) {
        memberCountMap[m.playlist_id] = (memberCountMap[m.playlist_id] || 0) + 1;
        if (!memberFidsMap[m.playlist_id]) memberFidsMap[m.playlist_id] = [];
        memberFidsMap[m.playlist_id].push(m.fid);
      }
    }

    const enriched = playlists.map((p: { id: string }) => ({
      ...p,
      track_count: trackCountMap[p.id] || 0,
      member_count: memberCountMap[p.id] || 0,
      member_fids: memberFidsMap[p.id] || [],
    }));

    return NextResponse.json({ playlists: enriched });
  } catch (err) {
    logger.error('[collaborative-playlists] GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch playlists' }, { status: 500 });
  }
}

// POST — create a new collaborative playlist
export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { name, description, is_collaborative } = parsed.data;

    const { data: playlist, error } = await supabaseAdmin
      .from('playlists')
      .insert({
        name,
        description: description || null,
        is_collaborative,
        is_public: true,
        created_by_fid: session.fid,
      })
      .select()
      .single();

    if (error) throw error;

    // Add creator as owner member
    await supabaseAdmin.from('playlist_members').insert({
      playlist_id: playlist.id,
      fid: session.fid,
      role: 'owner',
    });

    // Fire-and-forget: auto-cast new playlist announcement
    autoCastToZao(
      `\u{1F4DD} New playlist: ${name} \u2014 Join and add tracks: zaoos.com/music`,
      'https://zaoos.com/music',
    ).catch((err) => logger.error('[playlist-cast]', err));

    return NextResponse.json({ playlist }, { status: 201 });
  } catch (err) {
    logger.error('[collaborative-playlists] POST error:', err);
    return NextResponse.json({ error: 'Failed to create playlist' }, { status: 500 });
  }
}
