import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

const TokenSchema = z.object({
  userId: z.string().min(1),
  role: z.string().min(1),
  roomId: z.string().optional(),
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
      console.error('100ms keys missing');
      return NextResponse.json({ error: '100ms configuration missing' }, { status: 500 });
    }

    const body = await req.json();
    const parsed = TokenSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { userId, role, roomId } = parsed.data;

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

    // Find or create room
    let hmsRoomId = roomId;

    if (!hmsRoomId) {
      const listRes = await fetch('https://api.100ms.live/v2/rooms', {
        headers: { Authorization: `Bearer ${managementToken}` },
      });
      const rooms = await listRes.json();
      const existing = rooms?.data?.find((r: { name: string }) => r.name === 'zao-live-room');

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
            name: 'zao-live-room',
            description: 'ZAO OS Live Audio Room',
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

    return NextResponse.json({ token: appToken, roomId: hmsRoomId });
  } catch (error) {
    console.error('100ms token error:', error);
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
}
