import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

export async function GET() {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: streak, error } = await supabaseAdmin
      .from('user_streaks')
      .select('current_streak, longest_streak, last_activity_date, total_active_days, streak_freezes_available')
      .eq('fid', session.fid)
      .maybeSingle();

    if (error) {
      logger.error('Streak fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch streak data' }, { status: 500 });
    }

    // No streak record yet — return defaults
    if (!streak) {
      return NextResponse.json({
        streak: {
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: null,
          totalActiveDays: 0,
          streakFreezesAvailable: 0,
          isActiveToday: false,
          isAtRisk: false,
        },
      });
    }

    // Determine streak status relative to today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const lastActivity = streak.last_activity_date
      ? new Date(streak.last_activity_date + 'T00:00:00')
      : null;

    const isActiveToday = lastActivity
      ? lastActivity.getTime() === today.getTime()
      : false;

    const isAtRisk = lastActivity
      ? lastActivity.getTime() === yesterday.getTime()
      : false;

    // Calculate effective current streak (may have lapsed since last visit)
    let currentStreak = streak.current_streak;
    if (lastActivity && !isActiveToday && !isAtRisk) {
      // Streak has broken since last activity
      currentStreak = 0;
    }

    return NextResponse.json({
      streak: {
        currentStreak,
        longestStreak: streak.longest_streak,
        lastActivityDate: streak.last_activity_date,
        totalActiveDays: streak.total_active_days,
        streakFreezesAvailable: streak.streak_freezes_available,
        isActiveToday,
        isAtRisk,
      },
    });
  } catch (err) {
    logger.error('Streak GET error:', err);
    return NextResponse.json({ error: 'Failed to load streak data' }, { status: 500 });
  }
}
