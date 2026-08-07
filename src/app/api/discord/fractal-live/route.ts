import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

/**
 * GET /api/discord/fractal-live
 * Returns active fractal sessions and recent completed sessions.
 *
 * @public-reviewed 2026-08-07 - the fractal schedule is community-facing and an
 * OBS/Discord surface reads it unauthenticated. Hardened rather than gated: the
 * response is an allowlist, so host_wallet no longer leaves (see below).
 *
 * PUBLIC + SERVICE-ROLE. This handler has no session guard and holds a
 * service-role client, so its queries bypass row-level security - whatever it
 * selects, the whole internet can read. Flagged by the surface-map audit
 * (doc 2245, PR #2950) as the shape of the August anonymous-board leak (#2829).
 *
 * The queries used to `select('*')`, which published `fractal_sessions.host_wallet`
 * - the mapping from a host's name to their wallet address. Worse, `select('*')`
 * means any column ADDED to the table in future is published automatically, by a
 * migration whose author never looked at this file.
 *
 * So the response is now built from an explicit allowlist (`publicSession`)
 * rather than passed through. The allowlist is applied at the RESPONSE boundary
 * rather than in the `.select()` deliberately: it cannot break on a column this
 * file does not know about, and a new column defaults to NOT being published.
 * Opt-in beats opt-out when the audience is everyone.
 */

/** A fractal session row as the public is allowed to see it. Anything not named
 *  here - host_wallet today, whatever is added tomorrow - never leaves. */
function publicSession(row: Record<string, unknown> | null | undefined) {
  if (!row) return null;
  return {
    id: row.id ?? null,
    name: row.name ?? null,
    status: row.status ?? null,
    session_date: row.session_date ?? null,
    host_name: row.host_name ?? null,
    scoring_era: row.scoring_era ?? null,
    participant_count: row.participant_count ?? null,
    // a link target for the session's Discord thread - an identifier for a
    // channel, not for a person. The existing tests assert it is returned, so
    // it was published on purpose; it stays.
    discord_thread_id: row.discord_thread_id ?? null,
    created_at: row.created_at ?? null,
  };
}

const publicSessions = (rows: unknown): ReturnType<typeof publicSession>[] =>
  Array.isArray(rows) ? rows.map((r) => publicSession(r as Record<string, unknown>)) : [];

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    // Fetch active sessions (created by webhook with status = 'active')
    const { data: activeSessions, error: activeError } = await supabase
      .from('fractal_sessions')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (activeError) {
      logger.error('[fractal-live] Active sessions error:', activeError);
      return NextResponse.json({ error: 'Failed to fetch active sessions' }, { status: 500 });
    }

    // Fetch recent completed sessions (last 5)
    const { data: recentSessions, error: recentError } = await supabase
      .from('fractal_sessions')
      .select('*')
      .eq('status', 'completed')
      .not('discord_thread_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentError) {
      logger.error('[fractal-live] Recent sessions error:', recentError);
      // Non-fatal — still return active sessions
    }

    // Fetch paused sessions too
    const { data: pausedSessions, error: pausedError } = await supabase
      .from('fractal_sessions')
      .select('*')
      .eq('status', 'paused')
      .order('created_at', { ascending: false });

    if (pausedError) {
      logger.error('[fractal-live] Paused sessions error:', pausedError);
    }

    return NextResponse.json({
      active: publicSessions(activeSessions),
      paused: publicSessions(pausedSessions),
      recent: publicSessions(recentSessions),
      has_active: (activeSessions || []).length > 0,
    });
  } catch (err) {
    logger.error('[fractal-live] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
