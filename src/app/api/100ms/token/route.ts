import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { logAuditEvent, getClientIp } from '@/lib/db/audit-log';
import { logger } from '@/lib/logger';

const TokenSchema = z.object({
  userId: z.string().min(1),
  role: z.string().min(1),
  roomId: z.string().optional(),
  roomName: z.string().max(100).optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Auth guard — prevent unauthenticated token minting
    const { getSessionData } = await import('@/lib/auth/session');
    const session = await getSessionData();
    if (!session?.fid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessKey = process.env.NEXT_PUBLIC_100MS_ACCESS_KEY;
    const appSecret = process.env.HMS_APP_SECRET;
    const templateId = process.env.NEXT_PUBLIC_100MS_TEMPLATE_ID || '';

    if (!accessKey || !appSecret) {
      logger.error('100ms keys missing');
      return NextResponse.json({ error: '100ms configuration missing' }, { status: 500 });
    }

    const body = await req.json();
    const parsed = TokenSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { userId, role, roomId, roomName } = parsed.data;

    // Verify requested userId matches session user's FID
    if (userId !== String(session.fid)) {
      return NextResponse.json({ error: 'Forbidden: cannot generate token for another user' }, { status: 403 });
    }

    // Role validation — non-admins cannot request host role unless they're a fishbowl host
    // Fishbowl hosts pass roomName starting with 'fishbowl-' and their role is validated upstream
    const isFishbowlHost = roomName?.startsWith('fishbowl-');
    if (role === 'host' && !session.isAdmin && !isFishbowlHost) {
      return NextResponse.json({ error: 'Forbidden: only admins can request host role' }, { status: 403 });
    }

    // Generate management token
    const managementToken = jwt.sign(
      {
        access_key: accessKey,
        type: 'management',
        version: 2,
        iat: Math.floor(Date.now() / 1000),
        nbf: Math.floor(Date.now() / 1000),
      },
      appSecret,
      { algorithm: 'HS256', expiresIn: '24h', jwtid: crypto.randomUUID() }
    );

    // Find or create room — use roomName for per-fishbowl rooms, fallback to default
    let hmsRoomId = roomId;
    const targetRoomName = roomName || 'zao-live-room';

    if (!hmsRoomId) {
      const listRes = await fetch('https://api.100ms.live/v2/rooms', {
        headers: { Authorization: `Bearer ${managementToken}` },
      });
      const rooms = await listRes.json();
      const existing = rooms?.data?.find((r: { name: string }) => r.name === targetRoomName);

      if (existing) {
        hmsRoomId = existing.id;
      } else {
        const createRes = await fetch('https://api.100ms.live/v2/rooms', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${managementToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: targetRoomName,
            description: roomName ? `FISHBOWLZ: ${targetRoomName}` : 'ZAO OS Live Audio Room',
            template_id: templateId,
            region: 'us',
          }),
        });
        const created = await createRes.json();
        hmsRoomId = created.id;
      }
    }

    // Generate app token for user
    const appToken = jwt.sign(
      {
        access_key: accessKey,
        room_id: hmsRoomId,
        user_id: userId,
        role,
        type: 'app',
        version: 2,
        iat: Math.floor(Date.now() / 1000),
        nbf: Math.floor(Date.now() / 1000),
      },
      appSecret,
      { algorithm: 'HS256', expiresIn: '24h', jwtid: crypto.randomUUID() }
    );

    // Audit log token generation
    logAuditEvent({
      actorFid: session.fid,
      action: '100ms.token.generate',
      targetType: 'user',
      targetId: userId,
      details: { userId, role, roomId: hmsRoomId },
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ token: appToken, roomId: hmsRoomId });
  } catch (error) {
    logger.error('100ms token error:', error);
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
}
