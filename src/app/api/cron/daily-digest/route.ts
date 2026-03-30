import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { autoCastToZao } from '@/lib/publish/auto-cast';

/**
 * GET /api/cron/daily-digest
 *
 * Vercel cron — posts a daily summary cast to /zao channel.
 * "ZAO Daily: X active members, Y tracks played, Z rooms hosted today"
 *
 * Runs at 9 PM EST (02:00 UTC next day) via Vercel cron.
 * Auth: Bearer CRON_SECRET
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
    }
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().slice(0, 10);
    const todayStart = `${today}T00:00:00.000Z`;
    const todayEnd = `${today}T23:59:59.999Z`;

    // Query stats in parallel
    const [activeUsersResult, playCountResult, roomsResult] = await Promise.allSettled([
      // Active members: users who logged in today
      supabaseAdmin
        .from('users')
        .select('fid', { count: 'exact', head: true })
        .gte('last_login_at', todayStart)
        .lte('last_login_at', todayEnd),

      // Tracks played today (play_history or track_plays table)
      supabaseAdmin
        .from('play_history')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd),

      // Rooms hosted today
      supabaseAdmin
        .from('rooms')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd),
    ]);

    const activeMembers =
      activeUsersResult.status === 'fulfilled'
        ? (activeUsersResult.value.count ?? 0)
        : 0;

    const tracksPlayed =
      playCountResult.status === 'fulfilled'
        ? (playCountResult.value.count ?? 0)
        : 0;

    const roomsHosted =
      roomsResult.status === 'fulfilled'
        ? (roomsResult.value.count ?? 0)
        : 0;

    // Only post if there was some activity
    if (activeMembers === 0 && tracksPlayed === 0 && roomsHosted === 0) {
      return NextResponse.json({
        posted: false,
        reason: 'No activity today',
        stats: { activeMembers, tracksPlayed, roomsHosted },
      });
    }

    const text = `\u{1F4CA} ZAO Daily: ${activeMembers} active members, ${tracksPlayed} tracks played, ${roomsHosted} rooms hosted today`;

    const castHash = await autoCastToZao(text, 'https://zaoos.com');

    return NextResponse.json({
      posted: !!castHash,
      castHash,
      stats: { activeMembers, tracksPlayed, roomsHosted },
    });
  } catch (err) {
    console.error('Daily digest cron error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
