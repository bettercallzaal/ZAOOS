import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { muteUser, unmuteUser } from '@/lib/farcaster/neynar';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const muteSchema = z.object({
  targetFid: z.number().int().positive(),
});

export async function POST(request: NextRequest) {
  const session = await getSessionData();
  if (!session?.signerUuid) {
    return NextResponse.json({ error: 'Signer required' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = muteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
  }

  try {
    await muteUser(session.signerUuid, parsed.data.targetFid);
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('Mute user error:', err);
    return NextResponse.json({ error: 'Failed to mute user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSessionData();
  if (!session?.signerUuid) {
    return NextResponse.json({ error: 'Signer required' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = muteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
  }

  try {
    await unmuteUser(session.signerUuid, parsed.data.targetFid);
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('Unmute user error:', err);
    return NextResponse.json({ error: 'Failed to unmute user' }, { status: 500 });
  }
}
