import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getSessionData } from '@/lib/auth/session';
import { castRoomCreated } from '@/lib/fishbowlz/castRoom';

const CreateRoomSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  hostFid: z.number().int().positive(),
  hostName: z.string().min(1),
  hostUsername: z.string().min(1),
  hostPfp: z.string().url().optional(),
  hotSeatCount: z.number().int().min(2).max(20).default(5),
  rotationEnabled: z.boolean().default(true),
  rotationIntervalMs: z.number().int().min(60000).max(3600000).optional(),
  audioSourceType: z.enum(['farcaster', 'external_url', 'native']).optional(),
  audioSourceUrl: z.string().url().optional(),
  gatingEnabled: z.boolean().default(false),
  minQualityScore: z.number().int().min(0).default(0),
  scheduledAt: z.string().datetime().optional(),
  tokenGateAddress: z.string().startsWith('0x').optional(),
  tokenGateMinBalance: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session?.fid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const data = CreateRoomSchema.parse(body);

    // Verify the creator is acting as themselves
    if (data.hostFid !== session.fid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Generate slug from title
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50);

    const isScheduled = data.scheduledAt && new Date(data.scheduledAt) > new Date();

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
        rotation_interval_ms: data.rotationIntervalMs || null,
        audio_source_type: data.audioSourceType,
        audio_source_url: data.audioSourceUrl,
        slug,
        state: isScheduled ? 'scheduled' : 'active',
        scheduled_at: data.scheduledAt || null,
        current_speakers: isScheduled ? [] : [{ fid: data.hostFid, username: data.hostUsername, joinedAt: new Date().toISOString() }],
        current_listeners: [],
        token_gate_address: data.tokenGateAddress || null,
        token_gate_min_balance: data.tokenGateMinBalance || '0',
        token_gate_chain_id: 8453,
        token_gate_type: data.tokenGateAddress ? 'erc20' : null,
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

    // Cast to Farcaster (fire-and-forget)
    castRoomCreated({
      title: data.title,
      slug,
      host_username: data.hostUsername,
      hot_seat_count: data.hotSeatCount,
    }).catch(() => {});

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
  const state = searchParams.get('state');
  const limit = parseInt(searchParams.get('limit') ?? '50', 10);

  let query = supabaseAdmin
    .from('fishbowl_rooms')
    .select('*')
    .order('last_active_at', { ascending: false })
    .limit(limit);

  if (state) {
    // Filter by specific state if provided
    query = query.eq('state', state);
  } else {
    // Default: return scheduled, active, and ended rooms (active first via last_active_at ordering)
    query = query.in('state', ['scheduled', 'active', 'ended']);
  }

  const { data: rooms, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rooms });
}
