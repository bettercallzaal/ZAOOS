import { NextRequest, NextResponse } from 'next/server';
import { StreamClient } from '@stream-io/node-sdk';
import { z } from 'zod';
import { logAuditEvent, getClientIp } from '@/lib/db/audit-log';
import { logger } from '@/lib/logger';

const TokenSchema = z.object({
  userId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    // Auth guard — prevent unauthenticated token minting
    const { getSessionData } = await import('@/lib/auth/session');
    const session = await getSessionData();
    if (!session?.fid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    const apiSecret = process.env.STREAM_API_SECRET;

    if (!apiKey || !apiSecret) {
      logger.error('Stream.io keys missing');
      return NextResponse.json({ error: 'Stream configuration missing' }, { status: 500 });
    }

    const body = await req.json();
    const parsed = TokenSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Verify requested userId matches session user's FID
    if (parsed.data.userId !== String(session.fid)) {
      return NextResponse.json({ error: 'Forbidden: cannot generate token for another user' }, { status: 403 });
    }

    const client = new StreamClient(apiKey, apiSecret);
    const token = client.generateUserToken({ user_id: parsed.data.userId });

    // Audit log token generation
    logAuditEvent({
      actorFid: session.fid,
      action: 'stream.token.generate',
      targetType: 'user',
      targetId: parsed.data.userId,
      details: { userId: parsed.data.userId },
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ token });
  } catch (error) {
    logger.error('Stream token error:', error);
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
}
