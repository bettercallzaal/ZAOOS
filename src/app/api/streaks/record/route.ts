import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

const RecordActivitySchema = z.object({
  activity_type: z.enum(['cast', 'vote', 'comment', 'reaction', 'submission', 'fractal', 'login']),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = RecordActivitySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { activity_type, metadata } = parsed.data;
    const fid = session.fid;

    // 1. Upsert activity log (unique per fid + type + date, so duplicates are safe)
    const { error: activityError } = await supabaseAdmin
      .from('activity_log')
      .upsert(
        {
          fid,
          activity_type,
          metadata: metadata || {},
        },
        { onConflict: 'fid,activity_type,activity_date' }
      );

    if (activityError) {
      logger.error('Activity log upsert error:', activityError);
      return NextResponse.json({ error: 'Failed to record activity' }, { status: 500 });
    }

    // 2. Fetch current streak record
    const { data: existing } = await supabaseAdmin
      .from('user_streaks')
      .select('*')
      .eq('fid', fid)
      .maybeSingle();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (!existing) {
      // First ever activity — create streak record
      const { data: newStreak, error: insertError } = await supabaseAdmin
        .from('user_streaks')
        .insert({
          fid,
          current_streak: 1,
          longest_streak: 1,
          last_activity_date: todayStr,
          total_active_days: 1,
        })
        .select('current_streak, longest_streak, last_activity_date, total_active_days, streak_freezes_available')
        .single();

      if (insertError) {
        logger.error('Streak insert error:', insertError);
        return NextResponse.json({ error: 'Failed to create streak' }, { status: 500 });
      }

      return NextResponse.json({
        streak: {
          currentStreak: newStreak.current_streak,
          longestStreak: newStreak.longest_streak,
          lastActivityDate: newStreak.last_activity_date,
          totalActiveDays: newStreak.total_active_days,
          streakFreezesAvailable: newStreak.streak_freezes_available,
          isActiveToday: true,
          isAtRisk: false,
        },
        recorded: true,
      });
    }

    // Already active today — no streak change needed
    if (existing.last_activity_date === todayStr) {
      return NextResponse.json({
        streak: {
          currentStreak: existing.current_streak,
          longestStreak: existing.longest_streak,
          lastActivityDate: existing.last_activity_date,
          totalActiveDays: existing.total_active_days,
          streakFreezesAvailable: existing.streak_freezes_available,
          isActiveToday: true,
          isAtRisk: false,
        },
        recorded: true,
      });
    }

    // Calculate new streak values
    let newCurrentStreak: number;

    if (existing.last_activity_date === yesterdayStr) {
      // Consecutive day — extend streak
      newCurrentStreak = existing.current_streak + 1;
    } else {
      // Gap in activity — streak resets to 1
      newCurrentStreak = 1;
    }

    const newLongestStreak = Math.max(existing.longest_streak, newCurrentStreak);
    const newTotalActiveDays = existing.total_active_days + 1;

    // 3. Update streak record
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('user_streaks')
      .update({
        current_streak: newCurrentStreak,
        longest_streak: newLongestStreak,
        last_activity_date: todayStr,
        total_active_days: newTotalActiveDays,
        updated_at: new Date().toISOString(),
      })
      .eq('fid', fid)
      .select('current_streak, longest_streak, last_activity_date, total_active_days, streak_freezes_available')
      .single();

    if (updateError) {
      logger.error('Streak update error:', updateError);
      return NextResponse.json({ error: 'Failed to update streak' }, { status: 500 });
    }

    return NextResponse.json({
      streak: {
        currentStreak: updated.current_streak,
        longestStreak: updated.longest_streak,
        lastActivityDate: updated.last_activity_date,
        totalActiveDays: updated.total_active_days,
        streakFreezesAvailable: updated.streak_freezes_available,
        isActiveToday: true,
        isAtRisk: false,
      },
      recorded: true,
    });
  } catch (err) {
    logger.error('Streak record error:', err);
    return NextResponse.json({ error: 'Failed to record activity' }, { status: 500 });
  }
}
