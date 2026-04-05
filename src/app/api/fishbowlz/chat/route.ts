import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getSessionData } from '@/lib/auth/session';

const SendMessageSchema = z.object({
  roomId: z.string().uuid(),
  text: z.string().min(1).max(500),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session?.fid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const data = SendMessageSchema.safeParse(body);
    if (!data.success) {
      return NextResponse.json({ error: data.error.issues }, { status: 400 });
    }

    const { data: message, error } = await supabaseAdmin
      .from('fishbowl_chat_messages')
      .insert({
        room_id: data.data.roomId,
        sender_fid: session.fid,
        sender_username: session.username || 'anon',
        text: data.data.text,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(message, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get('roomId');
  const after = searchParams.get('after'); // ISO timestamp for incremental fetch
  const limit = parseInt(searchParams.get('limit') ?? '50', 10);

  if (!roomId) {
    return NextResponse.json({ error: 'roomId is required' }, { status: 400 });
  }

  let query = supabaseAdmin
    .from('fishbowl_chat_messages')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (after) {
    query = query.gt('created_at', after);
  }

  const { data: messages, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ messages });
}
