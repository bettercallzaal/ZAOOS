import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/db/supabase';

const postSchema = z.object({
  roomId: z.string().uuid(),
  action: z.enum(['raise', 'lower', 'invite', 'dismiss']),
  targetFid: z.number().optional(),
});

/** GET — list raised hands for a room */
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const roomId = req.nextUrl.searchParams.get('roomId');
    if (!roomId) {
      return NextResponse.json({ error: 'roomId required' }, { status: 400 });
    }

    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from('room_hand_raises')
      .select('*')
      .eq('room_id', roomId)
      .in('status', ['raised', 'invited'])
      .order('created_at', { ascending: true });

    if (error) {
      console.error('GET hand-raise error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ raises: data });
  } catch (err) {
    console.error('GET /api/spaces/hand-raise error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** POST — raise, lower, invite, or dismiss */
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { roomId, action, targetFid } = parsed.data;
    const db = getSupabaseAdmin();

    if (action === 'raise') {
      const { error } = await db.from('room_hand_raises').upsert(
        {
          room_id: roomId,
          fid: session.fid,
          username: session.username,
          pfp_url: session.pfpUrl,
          status: 'raised',
        },
        { onConflict: 'room_id,fid' },
      );
      if (error) {
        console.error('raise error:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }
    } else if (action === 'lower') {
      await db
        .from('room_hand_raises')
        .update({ status: 'lowered' })
        .eq('room_id', roomId)
        .eq('fid', session.fid);
    } else if (action === 'invite' || action === 'dismiss') {
      if (!targetFid) {
        return NextResponse.json({ error: 'targetFid required' }, { status: 400 });
      }
      await db
        .from('room_hand_raises')
        .update({ status: action === 'invite' ? 'invited' : 'dismissed' })
        .eq('room_id', roomId)
        .eq('fid', targetFid);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('POST /api/spaces/hand-raise error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
