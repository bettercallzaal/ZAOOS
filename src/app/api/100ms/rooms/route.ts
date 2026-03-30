import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { createMSRoom } from '@/lib/social/msRoomsDb';
import { logger } from '@/lib/logger';

const CreateSchema = z.object({
  title: z.string().min(1).max(100),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const room = await createMSRoom({
      title: parsed.data.title,
      hostFid: session.fid,
      hostName: session.displayName,
    });

    return NextResponse.json({ room });
  } catch (error) {
    logger.error('Create 100ms room error:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}
