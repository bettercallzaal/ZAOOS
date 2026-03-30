import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

const digestSchema = z.object({
  period: z.enum(['week', 'month']).default('week'),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = Object.fromEntries(req.nextUrl.searchParams);
    const parsed = digestSchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { period } = parsed.data;
    const days = period === 'week' ? 7 : 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const supabase = getSupabaseAdmin();

    // Run all queries in parallel — fault-tolerant
    const [topTracksRes, newSubsRes, totdRes] = await Promise.allSettled([
      // Top 10 most played tracks in the period
      supabase
        .from('songs')
        .select('id, title, artist, artwork_url, url, platform, play_count, last_played_at')
        .gte('last_played_at', since)
        .order('play_count', { ascending: false })
        .limit(10),

      // New submissions this period
      supabase
        .from('song_submissions')
        .select('id, url, title, artist, track_type, submitted_by_fid, submitted_by_username, created_at')
        .eq('status', 'approved')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(20),

      // Track of the Day winners this period
      supabase
        .from('track_of_the_day')
        .select('id, track_url, track_title, track_artist, artwork_url, selected_date, nominated_by_username, votes_count')
        .not('selected_date', 'is', null)
        .gte('selected_date', since.slice(0, 10))
        .order('selected_date', { ascending: false })
        .limit(days),
    ]);

    const topTracks =
      topTracksRes.status === 'fulfilled' && !topTracksRes.value.error
        ? (topTracksRes.value.data ?? [])
        : [];

    const newSubmissions =
      newSubsRes.status === 'fulfilled' && !newSubsRes.value.error
        ? (newSubsRes.value.data ?? [])
        : [];

    const trackOfDayWinners =
      totdRes.status === 'fulfilled' && !totdRes.value.error
        ? (totdRes.value.data ?? [])
        : [];

    // Derive most active contributors from submission counts in the period
    const listenerMap = new Map<number, { fid: number; username: string; plays: number }>();
    const { data: activeSubmitters } = await supabase
      .from('song_submissions')
      .select('submitted_by_fid, submitted_by_username')
      .eq('status', 'approved')
      .gte('created_at', since);

    if (activeSubmitters) {
      const countMap = new Map<number, { username: string; count: number }>();
      for (const sub of activeSubmitters) {
        const existing = countMap.get(sub.submitted_by_fid);
        if (existing) {
          existing.count += 1;
        } else {
          countMap.set(sub.submitted_by_fid, {
            username: sub.submitted_by_username || `FID ${sub.submitted_by_fid}`,
            count: 1,
          });
        }
      }
      for (const [fid, info] of countMap) {
        listenerMap.set(fid, { fid, username: info.username, plays: info.count });
      }
    }

    const topListeners = Array.from(listenerMap.values())
      .sort((a, b) => b.plays - a.plays)
      .slice(0, 10);

    return NextResponse.json(
      {
        topTracks,
        newSubmissions,
        topListeners,
        trackOfDayWinners,
        period,
      },
      { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=60' } },
    );
  } catch (error) {
    logger.error('Music digest error:', error);
    return NextResponse.json({ error: 'Failed to generate digest' }, { status: 500 });
  }
}
