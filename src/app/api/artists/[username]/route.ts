import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { ENV } from '@/lib/env';
import { logger } from '@/lib/logger';

const paramsSchema = z.object({
  username: z.string().min(1).max(100),
});

/**
 * GET /api/artists/[username] — Rich artist profile for spotlight
 * Session-authenticated. Returns combined profile, songs, respect, social data.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const raw = await params;
  const parsed = paramsSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid username' }, { status: 400 });
  }

  const lookup = decodeURIComponent(parsed.data.username).toLowerCase();

  try {
    // Find user by username
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('fid, username, display_name, pfp_url, bio, primary_wallet, farcaster_banner_url, community_profile_id, respect_member_id')
      .ilike('username', lookup)
      .eq('is_active', true)
      .maybeSingle();

    if (!user) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    }

    // Parallel fetches: community profile, songs, respect, Neynar
    const [profileResult, songsResult, respectResult, neynarResult] = await Promise.allSettled([
      // Community profile
      user.community_profile_id
        ? supabaseAdmin.from('community_profiles').select('category, cover_image_url, thumbnail_url, biography, is_featured, slug').eq('id', user.community_profile_id).single()
        : user.fid
          ? supabaseAdmin.from('community_profiles').select('category, cover_image_url, thumbnail_url, biography, is_featured, slug').eq('fid', user.fid).maybeSingle()
          : Promise.resolve({ data: null, error: null }),

      // Songs by this artist (by FID)
      user.fid
        ? supabaseAdmin.from('songs').select('id, url, title, artist, artwork_url, stream_url, platform, play_count, duration').eq('submitted_by_fid', user.fid).order('play_count', { ascending: false }).limit(20)
        : Promise.resolve({ data: [], error: null }),

      // Respect score
      user.respect_member_id
        ? supabaseAdmin.from('respect_members').select('total_respect, fractal_count').eq('id', user.respect_member_id).single()
        : user.fid
          ? supabaseAdmin.from('respect_members').select('total_respect, fractal_count').eq('fid', user.fid).maybeSingle()
          : Promise.resolve({ data: null, error: null }),

      // Neynar follower count
      user.fid
        ? fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${user.fid}`, {
            headers: { 'x-api-key': ENV.NEYNAR_API_KEY },
            signal: AbortSignal.timeout(5000),
          }).then(r => r.ok ? r.json() : null)
        : Promise.resolve(null),
    ]);

    // Extract community profile
    const cp = profileResult.status === 'fulfilled' ? profileResult.value?.data : null;

    // Extract songs
    const songs = songsResult.status === 'fulfilled' ? (songsResult.value?.data || []) : [];
    const trackCount = songs.length;
    const totalPlays = songs.reduce((sum: number, s: { play_count: number | null }) => sum + (s.play_count || 0), 0);

    // Extract respect
    const respect = respectResult.status === 'fulfilled' ? respectResult.value?.data : null;

    // Extract Neynar data
    let followerCount = 0;
    if (neynarResult.status === 'fulfilled' && neynarResult.value) {
      const fcUser = neynarResult.value.users?.[0];
      followerCount = fcUser?.follower_count || 0;
    }

    // Top tracks (limit 5 for spotlight)
    const topTracks = songs.slice(0, 5).map((s: {
      id: string; url: string; title: string; artist: string;
      artwork_url: string | null; stream_url: string | null;
      platform: string; play_count: number | null; duration: number | null;
    }) => ({
      id: s.id,
      url: s.url,
      title: s.title,
      artist: s.artist,
      artworkUrl: s.artwork_url,
      streamUrl: s.stream_url,
      platform: s.platform,
      playCount: s.play_count || 0,
      duration: s.duration,
    }));

    const artist = {
      fid: user.fid,
      username: user.username,
      displayName: user.display_name,
      pfpUrl: user.pfp_url,
      bio: user.bio,
      coverImageUrl: cp?.cover_image_url || user.farcaster_banner_url || null,
      thumbnailUrl: cp?.thumbnail_url || null,
      category: cp?.category || null,
      biography: cp?.biography || null,
      isFeatured: cp?.is_featured || false,
      slug: cp?.slug || null,
      totalRespect: respect ? Number(respect.total_respect) : 0,
      fractalCount: respect?.fractal_count || 0,
      followerCount,
      trackCount,
      totalPlays,
      topTracks,
    };

    return NextResponse.json(artist, {
      headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=60' },
    });
  } catch (err) {
    logger.error('[artists/username] error:', err);
    return NextResponse.json({ error: 'Failed to load artist profile' }, { status: 500 });
  }
}
