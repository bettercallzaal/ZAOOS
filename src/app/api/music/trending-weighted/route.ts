import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { curationWeight } from '@/lib/music/curationWeight';

interface LikeRow {
  user_fid: number;
  song_id: string;
  created_at: string;
  songs: {
    id: string;
    url: string;
    title: string;
    artist: string | null;
    artwork_url: string | null;
    platform: string;
  };
}

interface RespectMemberRow {
  fid: number;
  total_respect: number;
  name: string;
}

interface WeightedTrack {
  song: {
    id: string;
    url: string;
    title: string;
    artist: string | null;
    artworkUrl: string | null;
    platform: string;
  };
  weightedScore: number;
  likeCount: number;
  topCurators: string[];
}

/**
 * GET /api/music/trending-weighted
 * Returns tracks ranked by respect-weighted engagement.
 * Members with higher Respect scores have their likes count more.
 */
export async function GET() {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Get all likes from the last 30 days, joined with song metadata
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: likes, error: likesErr } = await supabaseAdmin
      .from('user_song_likes')
      .select(`
        user_fid,
        song_id,
        created_at,
        songs (
          id,
          url,
          title,
          artist,
          artwork_url,
          platform
        )
      `)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (likesErr) {
      console.error('[trending-weighted] likes query error:', likesErr);
      return NextResponse.json({ error: 'Failed to fetch likes' }, { status: 500 });
    }

    if (!likes || likes.length === 0) {
      return NextResponse.json({ tracks: [] });
    }

    // 2. Get all respect members to build FID -> respect lookup
    const { data: respectMembers, error: respectErr } = await supabaseAdmin
      .from('respect_members')
      .select('fid, total_respect, name')
      .not('fid', 'is', null);

    if (respectErr) {
      console.error('[trending-weighted] respect query error:', respectErr);
      // Fall back gracefully — everyone gets weight 1
    }

    // Build FID -> { respect, name } lookup
    const respectByFid = new Map<number, { respect: number; name: string }>();
    if (respectMembers) {
      for (const rm of respectMembers as RespectMemberRow[]) {
        if (rm.fid) {
          respectByFid.set(rm.fid, {
            respect: Number(rm.total_respect) || 0,
            name: rm.name || `FID ${rm.fid}`,
          });
        }
      }
    }

    // 3. Aggregate: for each song, sum weighted scores and collect curators
    const songMap = new Map<string, {
      song: WeightedTrack['song'];
      weightedScore: number;
      likeCount: number;
      curators: { name: string; weight: number }[];
    }>();

    for (const like of likes as unknown as LikeRow[]) {
      const song = like.songs;
      if (!song) continue;

      const respectInfo = respectByFid.get(like.user_fid);
      const respectScore = respectInfo?.respect ?? 0;
      const curatorName = respectInfo?.name ?? `FID ${like.user_fid}`;
      const weight = curationWeight(respectScore);

      const existing = songMap.get(song.id);
      if (existing) {
        existing.weightedScore += weight;
        existing.likeCount += 1;
        existing.curators.push({ name: curatorName, weight });
      } else {
        songMap.set(song.id, {
          song: {
            id: song.id,
            url: song.url,
            title: song.title,
            artist: song.artist,
            artworkUrl: song.artwork_url,
            platform: song.platform,
          },
          weightedScore: weight,
          likeCount: 1,
          curators: [{ name: curatorName, weight }],
        });
      }
    }

    // 4. Sort by weighted score descending, take top 20
    const sorted = Array.from(songMap.values())
      .sort((a, b) => b.weightedScore - a.weightedScore)
      .slice(0, 20);

    // 5. Format response — top curators sorted by weight
    const tracks: WeightedTrack[] = sorted.map((entry) => ({
      song: entry.song,
      weightedScore: Math.round(entry.weightedScore * 10) / 10,
      likeCount: entry.likeCount,
      topCurators: entry.curators
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 3)
        .map((c) => c.name),
    }));

    return NextResponse.json({ tracks });
  } catch (err) {
    console.error('[trending-weighted] unexpected error:', err);
    return NextResponse.json({ error: 'Failed to load trending tracks' }, { status: 500 });
  }
}
