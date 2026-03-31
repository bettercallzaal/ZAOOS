import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRoomById, endRoom, updateRoom, updateRecording } from '@/lib/spaces/roomsDb';
import { getSessionData } from '@/lib/auth/session';
import { getValidTwitchToken, updateTwitchChannel } from '@/lib/twitch/client';
import { communityConfig } from '../../../../../../community.config';
import { logger } from '@/lib/logger';

export async function GET(
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
    return NextResponse.json({ room });
  } catch (error) {
    logger.error('Get room error:', error);
    return NextResponse.json({ error: 'Failed to get room' }, { status: 500 });
  }
}

const UpdateSchema = z.object({
  action: z.enum(['end', 'update']).optional().default('end'),
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  theme: z.string().max(50).optional(),
  thumbnail_url: z.string().url().max(500).optional(),
  recording_url: z.string().url().max(500).optional(),
});

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

    const isHost = room.host_fid === session.fid;
    const isAdmin = (communityConfig.adminFids as readonly number[]).includes(session.fid);
    if (!isHost && !isAdmin) {
      return NextResponse.json({ error: 'Only the host or an admin can modify the room' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    if (parsed.data.action === 'end') {
      await endRoom(id);
      // Store recording URL if provided
      if (parsed.data.recording_url) {
        await updateRecording(id, parsed.data.recording_url);
      }
      return NextResponse.json({ success: true });
    }

    // Update room details
    const updated = await updateRoom(id, {
      title: parsed.data.title,
      description: parsed.data.description,
      theme: parsed.data.theme,
      thumbnail_url: parsed.data.thumbnail_url,
    });

    // Sync title to connected streaming platforms (fire-and-forget)
    if (parsed.data.title) {
      syncStreamTitle(session.fid, parsed.data.title).catch(err =>
        logger.error('[room-update] Platform sync failed:', err)
      );
    }

    return NextResponse.json({ room: updated });
  } catch (error) {
    logger.error('Room update error:', error);
    return NextResponse.json({ error: 'Failed to update room' }, { status: 500 });
  }
}

/** Sync room title to connected streaming platforms (Twitch, YouTube, etc.) */
async function syncStreamTitle(fid: number, title: string) {
  const token = await getValidTwitchToken(fid);
  if (token) {
    const ok = await updateTwitchChannel(token.accessToken, token.userId, { title });
    if (ok) {
      console.info('[twitch-sync] Title updated to:', title);
    }
  }
  // YouTube title sync could go here in the future
}
