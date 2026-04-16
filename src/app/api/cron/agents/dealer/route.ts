import { NextRequest, NextResponse } from 'next/server';
import { runDealer } from '@/lib/agents/dealer';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const result = await runDealer();
    return NextResponse.json({ agent: 'DEALER', ...result, timestamp: new Date().toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`[DEALER cron] Unhandled error: ${message}`);
    return NextResponse.json({ agent: 'DEALER', action: 'buy_zabal', status: 'failed', details: `Unhandled: ${message}`, timestamp: new Date().toISOString() }, { status: 500 });
  }
}
