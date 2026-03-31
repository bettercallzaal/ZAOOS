import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

/**
 * GET — List all rooms (admin only)
 */
export async function GET() {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!session.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('rooms')
      .select('id, title, host_name, host_username, state, participant_count, provider, theme, created_at, ended_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      logger.error('Admin spaces list error:', error);
      return NextResponse.json({ error: 'Failed to fetch spaces' }, { status: 500 });
    }

    return NextResponse.json({ rooms: data ?? [] });
  } catch (err) {
    logger.error('GET /api/admin/spaces error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
