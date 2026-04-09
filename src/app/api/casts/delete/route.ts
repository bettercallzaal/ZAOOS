import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { deleteCast } from '@/lib/farcaster/neynar';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const deleteCastSchema = z.object({
  castHash: z.string().startsWith('0x'),
});

export async function POST(request: NextRequest) {
  const session = await getSessionData();
  if (!session?.signerUuid) {
    return NextResponse.json({ error: 'Signer required' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = deleteCastSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
  }

  try {
    await deleteCast(session.signerUuid, parsed.data.castHash);
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('Delete cast error:', err);
    return NextResponse.json({ error: 'Failed to delete cast' }, { status: 500 });
  }
}
