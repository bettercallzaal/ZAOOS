import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

/**
 * GET /api/cron/zabal-spotlight-winner
 *
 * Vercel cron: runs Sunday midnight NYC (0 5 * * 1 in UTC, EDT-friendly).
 * Computes spotlight winner for the just-completed voting week and writes
 * to zabal_spotlight_winners (idempotent on PK = week).
 *
 * Auth: Vercel cron auto-injects x-vercel-cron header. Reject other callers.
 */
export async function GET(req: NextRequest) {
  // Vercel cron auth
  const isCron = req.headers.get('x-vercel-cron');
  const cronSecret = process.env.CRON_SECRET;
  const bearer = req.headers.get('authorization');
  const isAuthorized = isCron || (cronSecret && bearer === `Bearer ${cronSecret}`);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Determine target week: the most recently completed voting week (Monday of last week NYC)
  const { data: currentWeek, error: weekErr } = await supabaseAdmin.rpc(
    'get_current_zabal_voting_week',
  );
  if (weekErr || !currentWeek) {
    logger.error?.('[zabal-cron] get_current_zabal_voting_week error', { err: weekErr?.message });
    return NextResponse.json({ error: 'Week resolve failed' }, { status: 500 });
  }

  // Current week is Monday (just started). The week we want to compute = 7 days ago.
  const currentMonday = new Date(`${currentWeek as string}T00:00:00Z`);
  const targetMonday = new Date(currentMonday.getTime() - 7 * 24 * 60 * 60 * 1000);
  const targetWeek = targetMonday.toISOString().slice(0, 10);

  const { data, error } = await supabaseAdmin.rpc('compute_zabal_spotlight_winner', {
    p_week: targetWeek,
  });
  if (error) {
    logger.error?.('[zabal-cron] compute_zabal_spotlight_winner error', {
      week: targetWeek,
      err: error.message,
    });
    return NextResponse.json({ error: 'Compute failed', week: targetWeek }, { status: 500 });
  }

  const winner = Array.isArray(data) && data.length > 0 ? data[0] : null;
  logger.info?.('[zabal-cron] spotlight winner computed', { week: targetWeek, winner });

  return NextResponse.json({ week: targetWeek, winner });
}
