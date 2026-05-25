import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

/**
 * GET /api/cron/juke-stale-rooms
 *
 * Sweeps any juke_spaces row still marked `active` that has not seen a
 * webhook event in the last 2 hours and flips it to `ended`. Auto-cleanup
 * for ghost rooms - cases where the host walked away without the iframe or
 * iOS app triggering an end, and Juke's empty-room timeout webhook either
 * didn't fire or got dropped during a downtime window.
 *
 * Conservative thresholds:
 *  - room.started must be > 2h ago (long enough that a real long-form space
 *    like a 3-hour fractal call isn't terminated mid-session)
 *  - last associated webhook on this room must also be > 2h old (means
 *    participant events stopped flowing, room is dead)
 *
 * Idempotent: a real room.finished webhook arriving later for the same
 * spaceId is a no-op since the row is already ended.
 *
 * Auth: Bearer CRON_SECRET (Vercel cron header). Manual GETs from the
 * outside without the bearer get 401.
 *
 * Runs every 30 minutes via vercel.json cron config.
 */

const STALE_THRESHOLD_MINUTES = 120;

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { ok: false, error: 'CRON_SECRET not configured' },
      { status: 500 },
    );
  }
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const thresholdIso = new Date(
    Date.now() - STALE_THRESHOLD_MINUTES * 60 * 1000,
  ).toISOString();

  let candidates: Array<{ id: string; title: string | null; started_at: string | null }>;
  try {
    const { data, error } = await supabaseAdmin
      .from('juke_spaces')
      .select('id, title, started_at')
      .eq('status', 'active')
      .lt('started_at', thresholdIso)
      .order('started_at', { ascending: true })
      .limit(50);
    if (error) throw error;
    candidates = data ?? [];
  } catch (err: unknown) {
    logger.error('[cron/juke-stale-rooms] candidate query failed', err);
    return NextResponse.json(
      { ok: false, error: 'Candidate query failed' },
      { status: 500 },
    );
  }

  if (candidates.length === 0) {
    return NextResponse.json({ ok: true, checked: 0, ended: 0, skipped: 0 });
  }

  // Cross-check: only end rows whose latest associated webhook is ALSO older
  // than the threshold. A row started 3h ago with a participant.joined event
  // 10min ago is still genuinely active (long-form space). One query per
  // candidate is cheap given the limit of 50 and the index on space_id.
  const ids = candidates.map((c) => c.id);
  let lastEventByRoom = new Map<string, string>();
  try {
    const { data, error } = await supabaseAdmin
      .from('juke_webhook_events')
      .select('space_id, received_at')
      .in('space_id', ids)
      .order('received_at', { ascending: false });
    if (error) throw error;
    for (const row of data ?? []) {
      if (row.space_id && !lastEventByRoom.has(row.space_id)) {
        lastEventByRoom.set(row.space_id, row.received_at);
      }
    }
  } catch (err: unknown) {
    logger.error('[cron/juke-stale-rooms] webhook event lookup failed', err);
    // Continue with empty map - we'll just use started_at as the only signal.
  }

  const nowIso = new Date().toISOString();
  let endedCount = 0;
  let skipped = 0;
  const endedIds: string[] = [];

  for (const c of candidates) {
    const lastEvent = lastEventByRoom.get(c.id);
    if (lastEvent && lastEvent > thresholdIso) {
      // Recent activity on this room - probably a long-form session, not a
      // ghost. Skip.
      skipped += 1;
      continue;
    }
    try {
      const { error } = await supabaseAdmin
        .from('juke_spaces')
        .update({ status: 'ended', ended_at: nowIso })
        .eq('id', c.id)
        .eq('status', 'active'); // optimistic: skip if another path already ended it
      if (error) {
        logger.warn('[cron/juke-stale-rooms] update failed for ' + c.id, error);
        continue;
      }
      endedCount += 1;
      endedIds.push(c.id);
    } catch (err: unknown) {
      logger.warn('[cron/juke-stale-rooms] update threw for ' + c.id, err);
    }
  }

  logger.info(
    `[cron/juke-stale-rooms] checked=${candidates.length} ended=${endedCount} skipped=${skipped}`,
    { endedIds },
  );

  return NextResponse.json({
    ok: true,
    checked: candidates.length,
    ended: endedCount,
    skipped,
    threshold_minutes: STALE_THRESHOLD_MINUTES,
    ended_ids: endedIds,
  });
}
