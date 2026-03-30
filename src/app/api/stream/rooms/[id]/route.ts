import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRoomById, endRoom, updateRoom } from '@/lib/spaces/roomsDb';
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

const UpdateSchema = z.object({
  action: z.enum(['end', 'update']).optional().default('end'),
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  theme: z.string().max(50).optional(),
  thumbnail_url: z.string().url().max(500).optional(),
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

    if (room.host_fid !== session.fid) {
      return NextResponse.json({ error: 'Only the host can modify the room' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    if (parsed.data.action === 'end') {
      await endRoom(id);
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
        console.error('[room-update] Platform sync failed:', err)
      );
    }

    return NextResponse.json({ room: updated });
  } catch (error) {
    console.error('Room update error:', error);
    return NextResponse.json({ error: 'Failed to update room' }, { status: 500 });
  }
}

/** Sync room title to connected streaming platforms (Twitch, YouTube, etc.) */
async function syncStreamTitle(fid: number, title: string) {
  const { supabaseAdmin } = await import('@/lib/db/supabase');

  // Get connected platforms
  const { data: platforms } = await supabaseAdmin
    .from('connected_platforms')
    .select('platform, access_token, platform_user_id')
    .eq('user_fid', fid);

  if (!platforms?.length) return;

  const results = await Promise.allSettled(
    platforms.map(async (p) => {
      if (p.platform === 'twitch' && p.access_token && p.platform_user_id) {
        const clientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID;
        if (!clientId) return;
        const res = await fetch('https://api.twitch.tv/helix/channels', {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${p.access_token}`,
            'Client-Id': clientId,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            broadcaster_id: p.platform_user_id,
            title,
          }),
        });
        if (!res.ok) {
          const err = await res.text();
          console.error('[twitch-sync] Title update failed:', res.status, err);
        } else {
          console.info('[twitch-sync] Title updated to:', title);
        }
      }
      // YouTube title sync could go here in the future
    })
  );

  const failed = results.filter(r => r.status === 'rejected');
  if (failed.length) console.warn(`[room-update] ${failed.length} platform sync(s) failed`);
}
