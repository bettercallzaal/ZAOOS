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
import { postCast } from '@/lib/farcaster/neynar';

const CreateRoomSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional().default(''),
  streamCallId: z.string().min(1),
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
    });

    // Fire-and-forget: set Twitch channel title + category
    syncTwitchOnCreate(session.fid, parsed.data.title).catch(err =>
      console.error('[room-create] Twitch sync failed:', err)
    );

    // Fire-and-forget: auto-cast go-live announcement to /zao channel
    castGoLive(parsed.data.title, room.id).catch(err =>
      console.error('[room-create] Go-live cast failed:', err)
    );

    return NextResponse.json({ room });
  } catch (error) {
    console.error('Create room error:', error);
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
  const signerUuid = process.env.ZAO_OFFICIAL_SIGNER_UUID;
  const neynarApiKey = process.env.ZAO_OFFICIAL_NEYNAR_API_KEY;
  if (!signerUuid || !neynarApiKey) return;

  const text = `${title} is now live on ZAO OS! \u{1F399}\uFE0F Join: https://zaoos.com/spaces/${roomId}`;
  await postCast(signerUuid, text, 'zao', undefined, undefined, undefined, undefined, neynarApiKey);
  console.info(`[room-create] Go-live cast posted for room ${roomId}`);
}
