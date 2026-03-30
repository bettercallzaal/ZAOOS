import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

const postSchema = z.object({
  roomId: z.string().uuid(),
  message: z.string().min(1).max(500),
});

/** GET — fetch recent messages for a room */
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const roomId = req.nextUrl.searchParams.get('roomId');
    const roomIdParsed = z.string().uuid().safeParse(roomId);
    if (!roomIdParsed.success) {
      return NextResponse.json({ error: 'Valid roomId (UUID) required' }, { status: 400 });
    }

    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from('room_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      logger.error('GET chat error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ messages: data });
  } catch (err) {
    logger.error('GET /api/spaces/chat error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** POST — send a message */
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

    const { roomId, message } = parsed.data;
    const db = getSupabaseAdmin();

    const { error } = await db.from('room_messages').insert({
      room_id: roomId,
      fid: session.fid,
      username: session.username,
      pfp_url: session.pfpUrl,
      message,
    });

    if (error) {
      logger.error('POST chat insert error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error('POST /api/spaces/chat error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
