import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { publishCast } from '@/lib/farcaster/neynar';
import { logger } from '@/lib/logger';

const CastSchema = z.object({
  text: z.string().min(1).max(1024),
  embeds: z.array(z.string().url()).optional().default([]),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session?.signerUuid) {
      return NextResponse.json({ error: 'Unauthorized — no signer' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CastSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const data = await publishCast(session.signerUuid, parsed.data.text, parsed.data.embeds);
    return NextResponse.json({ success: true, cast: data.cast });
  } catch (error: unknown) {
    logger.error('Cast route error:', error);
    return NextResponse.json({ error: 'Failed to publish cast' }, { status: 500 });
  }
}
