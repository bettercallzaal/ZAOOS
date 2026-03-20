import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

/**
 * GET /api/notifications/status
 *
 * Returns whether the current user has push notifications enabled.
 */
export async function GET() {
  try {
    const session = await getSessionData();
    if (!session?.fid) {
      return NextResponse.json({ enabled: false });
    }

    const { data } = await supabaseAdmin
      .from('notification_tokens')
      .select('enabled')
      .eq('fid', session.fid)
      .maybeSingle();

    return NextResponse.json({ enabled: data?.enabled ?? false });
  } catch {
    return NextResponse.json({ enabled: false });
  }
}
