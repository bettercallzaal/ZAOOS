import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { logger } from '@/lib/logger';
import {
  addMSRoomSpeaker,
  createSpeakerRequest,
  getApprovedSpeakerNames,
  getMSRoomById,
  getRoomSpeakerFids,
  getSpeakerRequests,
  isStageRoom,
  removeMSRoomSpeaker,
  setSpeakerRequestStatus,
} from '@/lib/social/msRoomsDb';

const ActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('raise_hand') }),
  z.object({ action: z.literal('approve'), fid: z.number().int().positive() }),
  z.object({ action: z.literal('deny'), fid: z.number().int().positive() }),
  z.object({ action: z.literal('demote'), fid: z.number().int().positive() }),
]);

// Current stage state — pending hand-raises + approved speaker FIDs. Used by the
// host approval panel and to recompute a listener's role after promotion.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const room = await getMSRoomById(id);
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    const requests = await getSpeakerRequests(id, 'pending');
    const speakerNames = await getApprovedSpeakerNames(id);
    return NextResponse.json({ requests, speakers: getRoomSpeakerFids(room), speakerNames });
  } catch (error) {
    logger.error('Get 100ms stage state error:', error);
    return NextResponse.json({ error: 'Failed to load stage state' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionData();
    if (!session?.fid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const room = await getMSRoomById(id);
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    if (room.state === 'ended')
      return NextResponse.json({ error: 'Room has ended' }, { status: 409 });
    if (!isStageRoom(room))
      return NextResponse.json({ error: 'Not a stage room' }, { status: 400 });

    const body = await req.json();
    const parsed = ActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const isHost = session.fid === room.host_fid;

    if (parsed.data.action === 'raise_hand') {
      await createSpeakerRequest(id, session.fid, session.displayName || `fid-${session.fid}`);
      return NextResponse.json({ success: true });
    }

    // approve / deny / demote are host-only moderation actions.
    if (!isHost)
      return NextResponse.json({ error: 'Only the host can manage the stage' }, { status: 403 });

    if (parsed.data.action === 'approve') {
      await setSpeakerRequestStatus(id, parsed.data.fid, 'approved');
      await addMSRoomSpeaker(id, parsed.data.fid);
    } else if (parsed.data.action === 'deny') {
      await setSpeakerRequestStatus(id, parsed.data.fid, 'denied');
    } else if (parsed.data.action === 'demote') {
      await removeMSRoomSpeaker(id, parsed.data.fid);
      await setSpeakerRequestStatus(id, parsed.data.fid, 'denied');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('100ms stage action error:', error);
    return NextResponse.json({ error: 'Failed to update stage' }, { status: 500 });
  }
}
