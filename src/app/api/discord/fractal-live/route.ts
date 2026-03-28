import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';

/**
 * GET /api/discord/fractal-live
 * Returns active fractal sessions and recent completed sessions.
 */
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    // Fetch active sessions
    const { data: activeSessions, error: activeError } = await supabase
      .from('fractal_live_sessions')
      .select('*')
      .eq('status', 'active')
      .order('started_at', { ascending: false });

    if (activeError) {
      console.error('[fractal-live] Active sessions error:', activeError);
      return NextResponse.json({ error: 'Failed to fetch active sessions' }, { status: 500 });
    }

    // Fetch recent completed sessions (last 5)
    const { data: recentSessions, error: recentError } = await supabase
      .from('fractal_live_sessions')
      .select('*')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(5);

    if (recentError) {
      console.error('[fractal-live] Recent sessions error:', recentError);
      // Non-fatal — still return active sessions
    }

    // Fetch paused sessions too
    const { data: pausedSessions, error: pausedError } = await supabase
      .from('fractal_live_sessions')
      .select('*')
      .eq('status', 'paused')
      .order('started_at', { ascending: false });

    if (pausedError) {
      console.error('[fractal-live] Paused sessions error:', pausedError);
    }

    return NextResponse.json({
      active: activeSessions || [],
      paused: pausedSessions || [],
      recent: recentSessions || [],
      has_active: (activeSessions || []).length > 0,
    });
  } catch (err) {
    console.error('[fractal-live] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
