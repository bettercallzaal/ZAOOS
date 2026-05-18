import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

/**
 * GET /api/zabal/week-totals
 * Returns current week's vote totals per mode for the focus vote.
 * Public read. Polled by the ZABAL vote UI after each cast.
 */
export async function GET() {
  const { data, error } = await supabaseAdmin.rpc('get_this_zabal_weeks_votes');
  if (error) {
    logger.error?.('[zabal] week-totals error', { err: error.message });
    return NextResponse.json({ error: 'Read failed' }, { status: 500 });
  }
  return NextResponse.json({ totals: data ?? [] });
}
