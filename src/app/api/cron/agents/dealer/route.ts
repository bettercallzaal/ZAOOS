import { NextRequest, NextResponse } from 'next/server';
import { runDealer } from '@/lib/agents/dealer';

/**
 * GET /api/cron/agents/dealer
 *
 * Vercel cron -- runs DEALER agent daily at 10 PM UTC.
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

  const result = await runDealer();

  return NextResponse.json({
    agent: 'DEALER',
    ...result,
    timestamp: new Date().toISOString(),
  });
}
