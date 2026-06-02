import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { likeCast } from '@/lib/farcaster/neynar';
import { logger } from '@/lib/logger';

const LikeSchema = z.object({
  castHash: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session?.signerUuid) {
      return NextResponse.json({ error: 'Unauthorized — no signer' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = LikeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const result = await likeCast(session.signerUuid, parsed.data.castHash);
    return NextResponse.json({ success: true, result });
  } catch (error: unknown) {
    logger.error('Like route error:', error);
    return NextResponse.json({ error: 'Failed to like cast' }, { status: 500 });
  }
}
