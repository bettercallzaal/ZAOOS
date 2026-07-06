import jwt from 'jsonwebtoken';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getClientIp, logAuditEvent } from '@/lib/db/audit-log';
import { getUserByFid } from '@/lib/farcaster/neynar';
import { logger } from '@/lib/logger';
import {
  getMSRoomById,
  getRoomSpeakerFids,
  isStageRoom,
  setMSRoom100msId,
} from '@/lib/social/msRoomsDb';
import { checkTokenGate, type TokenGateConfig } from '@/lib/spaces/tokenGate';

/**
 * Collect every on-chain address we can attribute to a FID — the session's
 * connected wallet plus the user's Farcaster-verified eth addresses and custody
 * address — so a token gate is satisfied if ANY of them holds the asset.
 * Best-effort: a Neynar failure falls back to the session wallet alone.
 */
async function resolveUserWallets(fid: number, sessionWallet: string | null): Promise<string[]> {
  const set = new Set<string>();
  if (sessionWallet) set.add(sessionWallet.toLowerCase());
  try {
    const user = await getUserByFid(fid);
    const verified: unknown = user?.verified_addresses?.eth_addresses;
    if (Array.isArray(verified)) {
      for (const a of verified) if (typeof a === 'string') set.add(a.toLowerCase());
    }
    if (typeof user?.custody_address === 'string') set.add(user.custody_address.toLowerCase());
  } catch (err) {
    logger.error('[100ms-token] wallet resolve failed', err);
  }
  return [...set];
}

const TokenSchema = z.object({
  userId: z.string().min(1),
  role: z.string().min(1),
  roomId: z.string().optional(),
  roomName: z.string().max(100).optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Auth guard — prevent unauthenticated token minting
    const { getSessionData } = await import('@/lib/auth/session');
    const session = await getSessionData();
    if (!session?.fid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessKey = process.env.NEXT_PUBLIC_100MS_ACCESS_KEY;
    const appSecret = process.env.HMS_APP_SECRET;
    const templateId = process.env.NEXT_PUBLIC_100MS_TEMPLATE_ID || '';

    if (!accessKey || !appSecret) {
      logger.error('100ms keys missing');
      return NextResponse.json({ error: '100ms configuration missing' }, { status: 500 });
    }

    const body = await req.json();
    const parsed = TokenSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { userId, role, roomId, roomName } = parsed.data;

    // Verify requested userId matches session user's FID
    if (userId !== String(session.fid)) {
      return NextResponse.json(
        { error: 'Forbidden: cannot generate token for another user' },
        { status: 403 },
      );
    }

    // Resolve the managed room once (roomName carries the ms_rooms UUID; the
    // shared default uses 'zao-live-room' and has no row). Reused below for
    // role checks, stage-speaker auth, and token-gate enforcement.
    const msRoom = roomName && roomName !== 'zao-live-room' ? await getMSRoomById(roomName) : null;
    const isRoomHost = !!msRoom && session.fid === msRoom.host_fid;

    // Role validation — host/moderator (100ms moderation powers) is limited to
    // global admins and the room's own host.
    if ((role === 'host' || role === 'moderator') && !session.isAdmin && !isRoomHost) {
      return NextResponse.json(
        { error: 'Forbidden: only admins can request moderator role' },
        { status: 403 },
      );
    }

    // Stage rooms (100ms): only the host or an approved speaker may publish.
    // Without this check any signed-in listener could mint a speaker token directly.
    if (role === 'speaker' && msRoom && isStageRoom(msRoom)) {
      const authorized =
        session.fid === msRoom.host_fid || getRoomSpeakerFids(msRoom).includes(session.fid);
      if (!authorized) {
        return NextResponse.json({ error: 'Not approved to speak in this room' }, { status: 403 });
      }
    }

    // Token gate: a gated room (settings.gate_config) only mints a token — of any
    // role — to the host, a global admin, or a user who holds the required asset
    // in one of their wallets. Enforced here so the client-side gate at
    // /spaces/hms/[id] cannot be bypassed by calling this route directly.
    const gate = (msRoom?.settings?.gate_config ?? null) as TokenGateConfig | null;
    if (gate && !session.isAdmin && !isRoomHost) {
      const wallets = await resolveUserWallets(session.fid, session.walletAddress);
      if (wallets.length === 0) {
        return NextResponse.json(
          { error: 'Token-gated room — connect or verify a wallet to join' },
          { status: 403 },
        );
      }
      const checks = await Promise.allSettled(wallets.map((w) => checkTokenGate(w, gate)));
      const allowed = checks.some((c) => c.status === 'fulfilled' && c.value.allowed);
      if (!allowed) {
        return NextResponse.json(
          { error: 'Token-gated room — required token not held' },
          { status: 403 },
        );
      }
    }

    // Generate management token
    const managementToken = jwt.sign(
      {
        access_key: accessKey,
        type: 'management',
        version: 2,
        iat: Math.floor(Date.now() / 1000),
        nbf: Math.floor(Date.now() / 1000),
      },
      appSecret,
      { algorithm: 'HS256', expiresIn: '24h', jwtid: crypto.randomUUID() },
    );

    // Find or create room — use roomName for per-room IDs, fallback to default
    let hmsRoomId = roomId;
    const targetRoomName = roomName || 'zao-live-room';

    if (!hmsRoomId) {
      const listRes = await fetch('https://api.100ms.live/v2/rooms', {
        headers: { Authorization: `Bearer ${managementToken}` },
      });
      const rooms = await listRes.json();
      const existing = rooms?.data?.find((r: { name: string }) => r.name === targetRoomName);

      if (existing) {
        hmsRoomId = existing.id;
      } else {
        const createRes = await fetch('https://api.100ms.live/v2/rooms', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${managementToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: targetRoomName,
            description: msRoom ? `ZAO OS: ${msRoom.title}` : 'ZAO OS Live Audio Room',
            template_id: templateId,
            region: 'us',
          }),
        });
        const created = await createRes.json();
        hmsRoomId = created.id;
      }

      // Persist the resolved 100ms room id back onto its ms_rooms row so future
      // joins skip this list/create round-trip. Best-effort, non-blocking.
      if (hmsRoomId && msRoom) {
        setMSRoom100msId(msRoom.id, hmsRoomId).catch((e) =>
          logger.error('persist room_id_100ms failed', e),
        );
      }
    }

    // Generate app token for user
    const appToken = jwt.sign(
      {
        access_key: accessKey,
        room_id: hmsRoomId,
        user_id: userId,
        role,
        type: 'app',
        version: 2,
        iat: Math.floor(Date.now() / 1000),
        nbf: Math.floor(Date.now() / 1000),
      },
      appSecret,
      { algorithm: 'HS256', expiresIn: '24h', jwtid: crypto.randomUUID() },
    );

    // Audit log token generation
    logAuditEvent({
      actorFid: session.fid,
      action: '100ms.token.generate',
      targetType: 'user',
      targetId: userId,
      details: { userId, role, roomId: hmsRoomId },
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ token: appToken, roomId: hmsRoomId });
  } catch (error) {
    logger.error('100ms token error:', error);
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
}
