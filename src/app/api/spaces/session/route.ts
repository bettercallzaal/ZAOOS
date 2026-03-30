import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { startSession, endSessionByFid } from '@/lib/spaces/sessionsDb';
import { updateLastActive } from '@/lib/spaces/roomsDb';
import { logger } from '@/lib/logger';

const joinSchema = z.object({
  roomId: z.string().uuid(),
  roomName: z.string(),
  roomType: z.enum(['voice_channel', 'stage']),
});

const leaveSchema = z.object({
  roomId: z.string().uuid(),
});

/**
 * POST — Join a room (start session tracking)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = joinSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { roomId, roomName, roomType } = parsed.data;

    const [sessionId] = await Promise.allSettled([
      startSession(session.fid, roomId, roomName, roomType),
      updateLastActive(roomId),
    ]);

    if (sessionId.status === 'rejected') {
      logger.error('Failed to start session:', sessionId.reason);
      return NextResponse.json({ error: 'Failed to start session' }, { status: 500 });
    }

    return NextResponse.json({ sessionId: sessionId.value });
  } catch (err) {
    logger.error('POST /api/spaces/session error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH — Leave a room (end session tracking)
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = leaveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { roomId } = parsed.data;

    await Promise.allSettled([
      endSessionByFid(session.fid, roomId),
      updateLastActive(roomId),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error('PATCH /api/spaces/session error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
