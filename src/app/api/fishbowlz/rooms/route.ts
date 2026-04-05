import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/db/supabase';

const CreateRoomSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  hostFid: z.number().int().positive(),
  hostName: z.string().min(1),
  hostUsername: z.string().min(1),
  hostPfp: z.string().url().optional(),
  hotSeatCount: z.number().int().min(2).max(20).default(5),
  rotationEnabled: z.boolean().default(true),
  audioSourceType: z.enum(['farcaster', 'external_url', 'native']).optional(),
  audioSourceUrl: z.string().url().optional(),
  gatingEnabled: z.boolean().default(false),
  minQualityScore: z.number().int().min(0).default(0),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = CreateRoomSchema.parse(body);

    // Generate slug from title
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50);

    const { data: room, error } = await supabaseAdmin
      .from('fishbowl_rooms')
      .insert({
        title: data.title,
        description: data.description,
        host_fid: data.hostFid,
        host_name: data.hostName,
        host_username: data.hostUsername,
        host_pfp: data.hostPfp,
        hot_seat_count: data.hotSeatCount,
        rotation_enabled: data.rotationEnabled,
        audio_source_type: data.audioSourceType,
        audio_source_url: data.audioSourceUrl,
        slug,
        state: 'active',
        current_speakers: [{ fid: data.hostFid, username: data.hostUsername, joinedAt: new Date().toISOString() }],
        current_listeners: [],
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log room creation
    await supabaseAdmin.rpc('log_fishbowl_event', {
      p_event_type: 'room.created',
      p_event_data: JSON.stringify({ roomId: room.id, title: data.title, slug }),
      p_room_id: room.id,
      p_session_id: null,
      p_actor_fid: data.hostFid,
      p_actor_type: 'human',
    });

    return NextResponse.json(room, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const state = searchParams.get('state') ?? 'active';
  const limit = parseInt(searchParams.get('limit') ?? '20', 10);

  const { data: rooms, error } = await supabaseAdmin
    .from('fishbowl_rooms')
    .select('*')
    .eq('state', state)
    .order('last_active_at', { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rooms });
}
