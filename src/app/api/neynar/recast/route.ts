import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { recastCast } from '@/lib/farcaster/neynar';
import { logger } from '@/lib/logger';

const RecastSchema = z.object({
  castHash: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session?.signerUuid) {
      return NextResponse.json({ error: 'Unauthorized — no signer' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = RecastSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const result = await recastCast(session.signerUuid, parsed.data.castHash);
    return NextResponse.json({ success: true, result });
  } catch (error: unknown) {
    logger.error('Recast route error:', error);
    return NextResponse.json({ error: 'Failed to recast' }, { status: 500 });
  }
}
