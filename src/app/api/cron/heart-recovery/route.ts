import { type NextRequest, NextResponse } from 'next/server';
import { reclaimExpiredLeases, reclaimDeadInstanceRuns } from '@/lib/heart';
import { logger } from '@/lib/logger';

/**
 * GET /api/cron/heart-recovery
 *
 * The Heart's recovery runtime. Runs on a Vercel cron and performs both
 * recovery passes for the agent-run lease layer:
 *
 *  1. reclaimExpiredLeases  - REACTIVE: any leased/running run whose
 *     lease_expires_at has passed is reset to 'ready' (+retries). The backstop
 *     proven by the recovery acceptance suite (research doc 2027).
 *  2. reclaimDeadInstanceRuns - PROACTIVE: any run leased to an instance whose
 *     heartbeat has gone stale is reclaimed at once, without waiting for its
 *     per-run TTL (research doc / Heart liveness).
 *
 * Both are safe no-ops until the Heart is integrated into the execution path
 * (nothing acquires leases yet), so this route can ship + schedule ahead of
 * that integration and simply activates when leasing lands.
 *
 * Auth: Bearer CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const expired = await reclaimExpiredLeases();
    const dead = await reclaimDeadInstanceRuns();

    const summary = {
      expired_leases_reclaimed: expired.reclaimedCount,
      dead_instance_runs_reclaimed: dead.reclaimedCount,
      dead_instances: dead.deadInstanceIds.length,
      errors: [...expired.errors.map((e) => e.error), ...dead.errors.map((e) => e.error)],
    };

    if (expired.reclaimedCount > 0 || dead.reclaimedCount > 0 || summary.errors.length > 0) {
      logger.info('[cron/heart-recovery]', summary);
    }
    return NextResponse.json({ ok: true, ...summary });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('[cron/heart-recovery] failed', { message });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
