import { NextRequest, NextResponse } from 'next/server';
import {
  getMSRoomByHmsRoomId,
  endMSRoom,
  setMSRoomParticipantCount,
  setMSRoomRecording,
} from '@/lib/social/msRoomsDb';
import { get100msPeerCount, mintManagementToken } from '@/lib/social/hms100ms';
import { timingSafeEqual } from '@/lib/security/timingSafeEqual';
import { logger } from '@/lib/logger';

/**
 * POST /api/100ms/webhook
 *
 * Ingests 100ms server webhooks (parity with the Stream webhook) so rooms react
 * to real events instead of only the cron sweep + list-fetch enrichment:
 *  - peer.join / peer.leave  → refresh the cached participant_count (authoritative
 *    re-query, so it never drifts)
 *  - session.close.success   → mark the room ended (host walked away / room empty)
 *  - *recording*.success     → store the recording URL on the room
 *
 * Auth: 100ms doesn't sign by default — configure the dashboard webhook to send
 * `Authorization: <HMS_WEBHOOK_SECRET>` (or `Bearer <secret>`). Requests without
 * a matching header are rejected. Unknown rooms / event types are no-ops (200).
 */
export async function POST(req: NextRequest) {
  const secret = process.env.HMS_WEBHOOK_SECRET;
  if (!secret) {
    logger.error('[100ms-webhook] HMS_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  }
  const auth = req.headers.get('authorization') ?? '';
  if (!timingSafeEqual(auth, secret) && !timingSafeEqual(auth, `Bearer ${secret}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let event: { type?: string; data?: Record<string, unknown> };
  try {
    event = await req.json();
  } catch {
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 });
  }

  const type = event.type ?? '';
  const data = event.data ?? {};
  const roomId100ms = typeof data.room_id === 'string' ? data.room_id : undefined;
  if (!roomId100ms) return NextResponse.json({ ok: true, ignored: 'no room_id' });

  try {
    const room = await getMSRoomByHmsRoomId(roomId100ms);
    if (!room) return NextResponse.json({ ok: true, ignored: 'unknown room' });

    if (type.startsWith('peer.join') || type.startsWith('peer.leave')) {
      const count = await get100msPeerCount(roomId100ms, mintManagementToken());
      if (count !== null) await setMSRoomParticipantCount(room.id, count);
    } else if (type.startsWith('session.close')) {
      if (room.state === 'active') await endMSRoom(room.id);
    } else if (type.includes('recording') && type.includes('success')) {
      const url =
        typeof data.recording_path === 'string'
          ? data.recording_path
          : typeof data.recording_presigned_url === 'string'
            ? (data.recording_presigned_url as string)
            : undefined;
      if (url) await setMSRoomRecording(room.id, url);
    }

    return NextResponse.json({ ok: true, type });
  } catch (err) {
    logger.error('[100ms-webhook] handler error', err);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }
}
