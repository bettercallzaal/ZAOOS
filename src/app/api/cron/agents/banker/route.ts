import { NextRequest, NextResponse } from 'next/server';
import { runBanker } from '@/lib/agents/banker';

/**
 * GET /api/cron/agents/banker
 *
 * Vercel cron -- runs BANKER agent daily at 2 PM UTC.
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

  const result = await runBanker();

  return NextResponse.json({
    agent: 'BANKER',
    ...result,
    timestamp: new Date().toISOString(),
  });
}
