import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { logAuditEvent, getClientIp } from '@/lib/db/audit-log';
import { logger } from '@/lib/logger';

const broadcastSchema = z.object({
  text: z.string().min(1).max(1024),
  channel: z.string().default('zao'),
});

export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = broadcastSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { text, channel } = parsed.data;

    const signerUuid = process.env.NEYNAR_SIGNER_UUID;
    if (!signerUuid) {
      return NextResponse.json(
        { error: 'Signer not configured' },
        { status: 500 }
      );
    }

    const res = await fetch('https://api.neynar.com/v2/farcaster/cast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        api_key: process.env.NEYNAR_API_KEY!,
      },
      body: JSON.stringify({
        signer_uuid: signerUuid,
        text,
        channel_id: channel,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      logger.error('[broadcast] Neynar error:', res.status, errorBody);
      return NextResponse.json(
        { error: 'Failed to broadcast cast' },
        { status: 500 }
      );
    }

    const data = await res.json();

    await logAuditEvent({
      actorFid: session.fid,
      action: 'broadcast',
      targetType: 'channel',
      targetId: channel,
      details: { text: text.slice(0, 100), castHash: data.cast?.hash },
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ success: true, hash: data.cast?.hash });
  } catch (error) {
    logger.error('[broadcast] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
