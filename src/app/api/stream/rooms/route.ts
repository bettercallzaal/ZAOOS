import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { createRoom } from '@/lib/spaces/roomsDb';

const CreateRoomSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional().default(''),
  streamCallId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CreateRoomSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const room = await createRoom({
      title: parsed.data.title,
      description: parsed.data.description,
      hostFid: session.fid,
      hostName: session.displayName,
      hostUsername: session.username,
      hostPfp: session.pfpUrl,
      streamCallId: parsed.data.streamCallId,
    });

    return NextResponse.json({ room });
  } catch (error) {
    console.error('Create room error:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}
