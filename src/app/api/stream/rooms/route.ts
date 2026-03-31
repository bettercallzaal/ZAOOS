import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { createRoom } from '@/lib/spaces/roomsDb';
import {
  getValidTwitchToken,
  updateTwitchChannel,
  TWITCH_CATEGORY_MUSIC,
  TWITCH_CATEGORY_DJS,
} from '@/lib/twitch/client';
import { autoCastToZao } from '@/lib/publish/auto-cast';
import { logger } from '@/lib/logger';

const GateConfigSchema = z.object({
  type: z.enum(['erc20', 'erc721', 'erc1155']),
  contractAddress: z.string().min(1),
  chainId: z.number().int(),
  minBalance: z.string().optional(),
  tokenId: z.string().optional(),
}).optional().nullable();

const CreateRoomSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional().default(''),
  streamCallId: z.string().min(1),
  gate_config: GateConfigSchema.optional(),
  theme: z.string().max(50).optional().default('default'),
  room_type: z.enum(['voice_channel', 'stage']).optional().default('stage'),
  /** Audio provider: 'stream' (default) or '100ms' */
  provider: z.enum(['stream', '100ms']).optional().default('stream'),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CreateRoomSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const room = await createRoom({
      title: parsed.data.title,
      description: parsed.data.description,
      hostFid: session.fid,
      hostName: session.displayName,
      hostUsername: session.username,
      hostPfp: session.pfpUrl,
      streamCallId: parsed.data.streamCallId,
      gateConfig: parsed.data.gate_config || undefined,
      theme: parsed.data.theme,
      roomType: parsed.data.room_type,
      provider: parsed.data.provider,
    });

    // Fire-and-forget: set Twitch channel title + category
    syncTwitchOnCreate(session.fid, parsed.data.title).catch(err =>
      logger.error('[room-create] Twitch sync failed:', err)
    );

    // Fire-and-forget: auto-cast go-live announcement to /zao channel
    castGoLive(parsed.data.title, room.id).catch(err =>
      logger.error('[room-create] Go-live cast failed:', err)
    );

    return NextResponse.json({ room });
  } catch (error) {
    logger.error('Create room error:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}

/** Auto-set Twitch channel title and DJ/Music category when a room is created */
async function syncTwitchOnCreate(fid: number, title: string) {
  const token = await getValidTwitchToken(fid);
  if (!token) return;

  // Default to "Music" category; use "DJs" if the title hints at DJ content
  const djKeywords = /\b(dj|mix|turntable|vinyl|beatmatch|set)\b/i;
  const gameId = djKeywords.test(title) ? TWITCH_CATEGORY_DJS : TWITCH_CATEGORY_MUSIC;

  const ok = await updateTwitchChannel(token.accessToken, token.userId, {
    title,
    gameId,
  });

  if (ok) {
    console.info(`[room-create] Twitch channel set — title: "${title}", category: ${gameId}`);
  }
}

/** Auto-post a go-live cast to the /zao Farcaster channel */
async function castGoLive(title: string, roomId: string) {
  await autoCastToZao(
    `${title} is now live on ZAO OS! \u{1F399}\uFE0F Join: https://zaoos.com/spaces/${roomId}`,
    `https://zaoos.com/spaces/${roomId}`,
  );
}
