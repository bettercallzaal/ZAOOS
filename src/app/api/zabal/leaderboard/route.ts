import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

/**
 * GET /api/zabal/leaderboard?limit=100
 *
 * Returns top voters with rank, score, streak.
 * Public read. No auth.
 */
export async function GET(req: NextRequest) {
  const rawLimit = req.nextUrl.searchParams.get('limit');
  const limit = Math.min(Math.max(Number(rawLimit) || 100, 1), 500);

  const { data, error } = await supabaseAdmin.rpc('get_zabal_leaderboard', {
    p_limit: limit,
  });

  if (error) {
    logger.error?.('[zabal] get_zabal_leaderboard error', { err: error.message });
    return NextResponse.json({ error: 'Leaderboard read failed' }, { status: 500 });
  }

  return NextResponse.json({ entries: data ?? [] });
}
