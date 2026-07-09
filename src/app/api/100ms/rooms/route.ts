import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { logger } from '@/lib/logger';
import { get100msPeerCount, mintManagementToken } from '@/lib/social/hms100ms';
import {
  createMSRoom,
  getActiveMSRooms,
  roomSlug,
  setMSRoomParticipantCount,
} from '@/lib/social/msRoomsDb';

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
  // Human-readable share slug for /spaces/hms/<slug> (generated server-side if omitted).
  slug: z.string().max(80).optional(),
});

// Public list of active 100ms rooms — powers the "Live on 100ms" section on
// /spaces so created rooms are discoverable, not just reachable by shared URL.
export async function GET() {
  try {
    const rooms = await getActiveMSRooms();

    // Enrich the stored participant_count with the live 100ms peer count so the
    // /spaces listing shows real numbers, not the stale value cached at create.
    // Fault-tolerant: any room whose count can't be resolved keeps its stored
    // value, and the whole thing is skipped when 100ms creds are absent.
    const mgmt = mintManagementToken();
    if (!mgmt) {
      return NextResponse.json({ rooms: rooms.map((r) => ({ ...r, slug: roomSlug(r) })) });
    }

    const settled = await Promise.allSettled(
      rooms.map(async (room) => {
        if (!room.room_id_100ms) return room;
        const count = await get100msPeerCount(room.room_id_100ms, mgmt);
        if (count === null) return room;
        if (count !== room.participant_count) {
          setMSRoomParticipantCount(room.id, count).catch(() => {});
        }
        return { ...room, participant_count: count };
      }),
    );
    const live = settled
      .map((r, i) => (r.status === 'fulfilled' ? r.value : rooms[i]))
      .map((r) => ({ ...r, slug: roomSlug(r) }));
    return NextResponse.json({ rooms: live });
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
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const room = await createMSRoom({
      title: parsed.data.title,
      hostFid: session.fid,
      hostName: session.displayName,
      gateConfig: parsed.data.gate_config ?? undefined,
      roomType: parsed.data.room_type === 'stage' ? 'stage' : 'video',
      slug: parsed.data.slug,
    });

    return NextResponse.json({ room: { ...room, slug: roomSlug(room) } });
  } catch (error) {
    logger.error('Create 100ms room error:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}
