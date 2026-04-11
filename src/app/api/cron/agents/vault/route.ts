import { NextRequest, NextResponse } from 'next/server';
import { runVault } from '@/lib/agents/vault';

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

  const result = await runVault();

  return NextResponse.json({
    agent: 'VAULT',
    ...result,
    timestamp: new Date().toISOString(),
  });
}
