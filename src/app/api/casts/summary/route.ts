import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { getCastConversationSummary } from '@/lib/farcaster/neynar';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const summarySchema = z.object({
  castHash: z.string().startsWith('0x'),
});

export async function POST(request: NextRequest) {
  const session = await getSessionData();
  if (!session?.fid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = summarySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
  }

  try {
    const data = await getCastConversationSummary(parsed.data.castHash);
    return NextResponse.json(data);
  } catch (err) {
    logger.error('Cast summary error:', err);
    return NextResponse.json({ error: 'Failed to get cast summary' }, { status: 500 });
  }
}
