import { NextRequest, NextResponse } from 'next/server';
import { getRoomById, endRoom } from '@/lib/spaces/roomsDb';
import { getSessionData } from '@/lib/auth/session';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const room = await getRoomById(id);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    return NextResponse.json({ room });
  } catch (error) {
    console.error('Get room error:', error);
    return NextResponse.json({ error: 'Failed to get room' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const room = await getRoomById(id);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (room.host_fid !== session.fid) {
      return NextResponse.json({ error: 'Only the host can end the room' }, { status: 403 });
    }

    await endRoom(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('End room error:', error);
    return NextResponse.json({ error: 'Failed to end room' }, { status: 500 });
  }
}
