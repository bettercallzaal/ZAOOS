import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getSessionData } from '@/lib/auth/session';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const session = await getSessionData();
    if (!session?.fid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: sessions, error } = await supabaseAdmin
      .from('space_sessions')
      .select('room_name, duration_seconds, joined_at')
      .eq('fid', session.fid)
      .not('duration_seconds', 'is', null);

    if (error) {
      throw new Error(`Failed to fetch sessions: ${error.message}`);
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({
        totalMinutes: 0,
        totalSessions: 0,
        favoriteRoom: null,
        thisWeek: 0,
        lastWeek: 0,
        currentStreak: 0,
      });
    }

    // Total minutes and session count
    const totalSeconds = sessions.reduce(
      (sum, s) => sum + (s.duration_seconds || 0),
      0
    );
    const totalMinutes = Math.round(totalSeconds / 60);
    const totalSessions = sessions.length;

    // Favorite room (most sessions)
    const roomCounts = new Map<string, number>();
    for (const s of sessions) {
      roomCounts.set(s.room_name, (roomCounts.get(s.room_name) || 0) + 1);
    }
    let favoriteRoom = '';
    let maxCount = 0;
    for (const [room, count] of roomCounts) {
      if (count > maxCount) {
        maxCount = count;
        favoriteRoom = room;
      }
    }

    // This week and last week minutes
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000;

    let thisWeekSeconds = 0;
    let lastWeekSeconds = 0;

    for (const s of sessions) {
      const joinedAt = new Date(s.joined_at).getTime();
      if (joinedAt >= sevenDaysAgo) {
        thisWeekSeconds += s.duration_seconds || 0;
      } else if (joinedAt >= fourteenDaysAgo) {
        lastWeekSeconds += s.duration_seconds || 0;
      }
    }

    // Current streak: consecutive days from today backward with at least one session
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sessionDays = new Set<string>();
    for (const s of sessions) {
      const d = new Date(s.joined_at);
      d.setHours(0, 0, 0, 0);
      sessionDays.add(d.toISOString());
    }

    let currentStreak = 0;
    const checkDate = new Date(today);
    while (true) {
      if (sessionDays.has(checkDate.toISOString())) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return NextResponse.json({
      totalMinutes,
      totalSessions,
      favoriteRoom,
      thisWeek: Math.round(thisWeekSeconds / 60),
      lastWeek: Math.round(lastWeekSeconds / 60),
      currentStreak,
    });
  } catch (error) {
    logger.error('[spaces/stats] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
