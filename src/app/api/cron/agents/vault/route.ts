import { NextRequest, NextResponse } from 'next/server';
import { runVault } from '@/lib/agents/vault';
import { logger } from '@/lib/logger';

/**
 * GET /api/cron/agents/vault
 *
 * Vercel cron -- runs VAULT agent daily at 6 AM UTC.
 * Auth: Bearer CRON_SECRET
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runVault();

    return NextResponse.json({
      agent: 'VAULT',
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`[VAULT cron] Unhandled error: ${message}`);
    return NextResponse.json({
      agent: 'VAULT',
      action: 'buy_zabal',
      status: 'failed',
      details: `Unhandled: ${message}`,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
