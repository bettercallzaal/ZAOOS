import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getMSRoomById, endMSRoom, setMSRoomPinnedLinks } from '@/lib/social/msRoomsDb';
import { getSessionData } from '@/lib/auth/session';
import { logger } from '@/lib/logger';

const PinnedLinksSchema = z.object({
  pinnedLinks: z
    .array(
      z.object({
        label: z.string().min(1).max(80),
        // Block non-http(s) schemes (e.g. javascript:) — these render as <a href>.
        url: z.string().url().max(500).refine((u) => /^https?:\/\//i.test(u), 'Must be an http(s) URL'),
      }),
    )
    .max(10),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const room = await getMSRoomById(id);
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    return NextResponse.json({ room });
  } catch (error) {
    logger.error('Get 100ms room error:', error);
    return NextResponse.json({ error: 'Failed to get room' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionData();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const room = await getMSRoomById(id);
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    if (room.host_fid !== session.fid) return NextResponse.json({ error: 'Not host' }, { status: 403 });

    // A body carrying `pinnedLinks` updates the room's pinned links; a bodyless
    // PATCH (the existing "Leave room" host call) ends the room.
    let body: unknown = null;
    try {
      body = await req.json();
    } catch {
      body = null;
    }
    if (body && typeof body === 'object' && 'pinnedLinks' in (body as Record<string, unknown>)) {
      const parsed = PinnedLinksSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
      }
      await setMSRoomPinnedLinks(id, parsed.data.pinnedLinks);
      return NextResponse.json({ success: true, pinned_links: parsed.data.pinnedLinks });
    }

    await endMSRoom(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('End 100ms room error:', error);
    return NextResponse.json({ error: 'Failed to end room' }, { status: 500 });
  }
}
