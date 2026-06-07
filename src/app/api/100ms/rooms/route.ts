import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { createMSRoom, getActiveMSRooms } from '@/lib/social/msRoomsDb';
import { logger } from '@/lib/logger';

// Mirrors the Stream room create schema so a token gate set in HostRoomModal is
// actually persisted (previously the 100ms route accepted only `title` and
// silently dropped gate_config — gated 100ms rooms were not gated).
const GateConfigSchema = z
  .object({
    type: z.enum(['erc20', 'erc721', 'erc1155']),
    contractAddress: z.string().min(1),
    chainId: z.number().int(),
    minBalance: z.string().optional(),
    tokenId: z.string().optional(),
  })
  .optional()
  .nullable();

const CreateSchema = z.object({
  title: z.string().min(1).max(100),
  gate_config: GateConfigSchema,
  // 'stage' = host speaks, listeners raise hand; anything else = open video room.
  room_type: z.enum(['stage', 'voice_channel']).optional(),
});

// Public list of active 100ms rooms — powers the "Live on 100ms" section on
// /spaces so created rooms are discoverable, not just reachable by shared URL.
export async function GET() {
  try {
    const rooms = await getActiveMSRooms();
    return NextResponse.json({ rooms });
  } catch (error) {
    logger.error('List 100ms rooms error:', error);
    return NextResponse.json({ error: 'Failed to list rooms' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const room = await createMSRoom({
      title: parsed.data.title,
      hostFid: session.fid,
      hostName: session.displayName,
      gateConfig: parsed.data.gate_config ?? undefined,
      roomType: parsed.data.room_type === 'stage' ? 'stage' : 'video',
    });

    return NextResponse.json({ room });
  } catch (error) {
    logger.error('Create 100ms room error:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}
