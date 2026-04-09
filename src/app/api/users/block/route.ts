import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { blockUser, unblockUser } from '@/lib/farcaster/neynar';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const blockSchema = z.object({
  targetFid: z.number().int().positive(),
});

export async function POST(request: NextRequest) {
  const session = await getSessionData();
  if (!session?.signerUuid) {
    return NextResponse.json({ error: 'Signer required' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = blockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
  }

  try {
    await blockUser(session.signerUuid, parsed.data.targetFid);
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('Block user error:', err);
    return NextResponse.json({ error: 'Failed to block user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSessionData();
  if (!session?.signerUuid) {
    return NextResponse.json({ error: 'Signer required' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = blockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
  }

  try {
    await unblockUser(session.signerUuid, parsed.data.targetFid);
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('Unblock user error:', err);
    return NextResponse.json({ error: 'Failed to unblock user' }, { status: 500 });
  }
}
