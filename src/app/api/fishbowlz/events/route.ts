import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getSessionData } from '@/lib/auth/session';

const EventSchema = z.object({
  eventType: z.string(),
  eventData: z.record(z.string(), z.unknown()),
  roomId: z.string().uuid().optional(),
  sessionId: z.string().uuid().optional(),
  actorFid: z.number().int().positive().optional(),
  actorType: z.enum(['human', 'agent']).optional(),
});

// Append-only event log — strict JSONL for future tokenomics
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session?.fid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const data = EventSchema.parse(body);

    const { data: rpcData, error } = await supabaseAdmin.rpc('log_fishbowl_event', {
      p_event_type: data.eventType,
      p_event_data: JSON.stringify(data.eventData),
      p_room_id: data.roomId,
      p_session_id: data.sessionId,
      p_actor_fid: data.actorFid,
      p_actor_type: data.actorType,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: rpcData }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get('roomId');
  const eventType = searchParams.get('eventType');
  const limit = parseInt(searchParams.get('limit') ?? '100', 10);

  let query = supabaseAdmin
    .from('fishbowl_event_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (roomId) {
    query = query.eq('room_id', roomId);
  }
  if (eventType) {
    query = query.eq('event_type', eventType);
  }

  const { data: events, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ events });
}
