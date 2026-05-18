import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

/**
 * GET /api/zabal/spotlight-leaderboard?limit=100
 * Cumulative spotlight winners over time. Public read.
 */
export async function GET(req: NextRequest) {
  const rawLimit = req.nextUrl.searchParams.get('limit');
  const limit = Math.min(Math.max(Number(rawLimit) || 100, 1), 500);

  const { data, error } = await supabaseAdmin.rpc('get_zabal_spotlight_leaderboard', {
    p_limit: limit,
  });
  if (error) {
    logger.error?.('[zabal] get_zabal_spotlight_leaderboard error', { err: error.message });
    return NextResponse.json({ error: 'Read failed' }, { status: 500 });
  }
  return NextResponse.json({ entries: data ?? [] });
}
