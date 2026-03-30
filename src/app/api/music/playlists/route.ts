import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

/**
 * GET /api/music/playlists — list playlists (community + personal)
 */
export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const type = req.nextUrl.searchParams.get('type'); // personal | community | all

  try {
    let query = supabaseAdmin
      .from('playlists')
      .select('*, playlist_tracks(count)')
      .order('updated_at', { ascending: false });

    if (type === 'personal') {
      query = query.eq('created_by_fid', session.fid).eq('type', 'personal');
    } else if (type === 'community') {
      query = query.in('type', ['community', 'totd_archive', 'auto']);
    } else {
      // All visible: community + auto + own personal
      query = query.or(`type.in.(community,totd_archive,auto),and(type.eq.personal,created_by_fid.eq.${session.fid})`);
    }

    const { data, error } = await query;
    if (error) throw error;

    const playlists = (data || []).map((p) => ({
      ...p,
      trackCount: Array.isArray(p.playlist_tracks) ? p.playlist_tracks[0]?.count ?? 0 : 0,
      playlist_tracks: undefined,
    }));

    return NextResponse.json({ playlists }, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' } });
  } catch (err) {
    logger.error('[playlists] list failed:', err);
    return NextResponse.json({ error: 'Failed to load playlists' }, { status: 500 });
  }
}

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
  collaborative: z.boolean().optional(),
});

/**
 * POST /api/music/playlists — create a personal playlist
 */
export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { data: playlist, error } = await supabaseAdmin
      .from('playlists')
      .insert({
        name: parsed.data.name,
        description: parsed.data.description || null,
        created_by_fid: session.fid,
        type: 'personal',
        is_public: parsed.data.isPublic ?? false,
        collaborative: parsed.data.collaborative ?? false,
      })
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json({ playlist });
  } catch (err) {
    logger.error('[playlists] create failed:', err);
    return NextResponse.json({ error: 'Failed to create playlist' }, { status: 500 });
  }
}
