import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { followUser, unfollowUser } from '@/lib/farcaster/neynar';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const followSchema = z.object({
  targetFid: z.number().int().positive(),
});

export async function POST(request: NextRequest) {
  const session = await getSessionData();
  if (!session?.signerUuid) {
    return NextResponse.json({ error: 'Signer required' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = followSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
  }

  try {
    await followUser(session.signerUuid, [parsed.data.targetFid]);
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('Follow error:', err);
    return NextResponse.json({ error: 'Failed to follow' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSessionData();
  if (!session?.signerUuid) {
    return NextResponse.json({ error: 'Signer required' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = followSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
  }

  try {
    await unfollowUser(session.signerUuid, [parsed.data.targetFid]);
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('Unfollow error:', err);
    return NextResponse.json({ error: 'Failed to unfollow' }, { status: 500 });
  }
}
