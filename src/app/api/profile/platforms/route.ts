import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

/**
 * GET — Fetch the current user's connected platform statuses.
 *
 * Returns which cross-posting platforms are linked (handle/profile only,
 * never tokens or keys).
 */
export async function GET() {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('bluesky_handle, lens_profile_id, hive_username, x_handle')
      .eq('fid', session.fid)
      .single();

    if (error) {
      console.error('[profile/platforms] DB error:', error);
      return NextResponse.json({ error: 'Failed to fetch platform status' }, { status: 500 });
    }

    return NextResponse.json({
      bluesky_handle: user?.bluesky_handle ?? null,
      lens_profile_id: user?.lens_profile_id ?? null,
      hive_username: user?.hive_username ?? null,
      x_handle: user?.x_handle ?? null,
    });
  } catch (err) {
    console.error('[profile/platforms] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
