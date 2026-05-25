import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { ENV } from '@/lib/env';
import { logger } from '@/lib/logger';
import { isValidJukeSpaceId } from '@/lib/spaces/juke';
import { getJukeSpace, updateJukeSpace } from '@/lib/spaces/jukeSpacesDb';

/**
 * POST /api/juke/admin/end-space
 *
 * Calls Juke's developer end-space endpoint to terminate a room the host or
 * an admin owns. Confirmed shape by Nicky 2026-05-24:
 *
 *   POST https://api.juke.audio/v1/developer/spaces/{room_id}/end
 *   X-Juke-Api-Key: <JUKE_API_KEY>
 *   -> 200 {"status": "ended"}
 *
 * Ownership: must be a room we (ZAO) created via POST /v1/developer/spaces.
 * Cross-app + iOS-native rooms 404 with the same shape (no enumeration
 * oracle). Idempotent on already-ended rooms. Fires `room.finished` to our
 * webhook handler immediately with `ended_via: "api"` - no 5min LiveKit
 * empty-timeout wait. We do NOT proactively flip our DB status here; the
 * inbound webhook handler is the source of truth for the lifecycle update,
 * which keeps the dispatch path identical to natural ends.
 *
 * Auth: signed-in user must be the original host (created_by_fid === fid) OR
 * an admin. If you want a manual override that updates our DB without
 * touching Juke (e.g. ghost rooms where Juke is unreachable), use
 * /api/juke/admin/mark-ended instead.
 *
 * Body: { spaceId }
 * Returns:
 *   200 { ok: true, spaceId, juke: { status: 'ended' } }
 *   202 { ok: true, spaceId, fallback: 'mark-ended' } when Juke 404s the
 *       endpoint (i.e. they have not shipped PR #174 yet) - in that case the
 *       caller should follow up with mark-ended for an interim manual flip.
 *   503 { ok: false, error: 'JUKE_API_KEY not configured' }
 */

const BodySchema = z.object({
  spaceId: z.string().refine(isValidJukeSpaceId, { message: 'Invalid Juke space id' }),
});

export async function POST(request: NextRequest) {
  const session = await getSessionData();
  if (!session?.fid) {
    return NextResponse.json({ ok: false, error: 'Sign in required' }, { status: 401 });
  }

  const apiKey = ENV.JUKE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: 'JUKE_API_KEY not configured on the server' },
      { status: 503 },
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Body must be JSON' }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Invalid body', details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { spaceId } = parsed.data;

  const row = await getJukeSpace(spaceId);
  if (!row) {
    return NextResponse.json({ ok: false, error: 'Space not found' }, { status: 404 });
  }

  const isAdmin = Boolean(session.isAdmin);
  const isHost = row.created_by_fid === session.fid;
  if (!isAdmin && !isHost) {
    return NextResponse.json(
      { ok: false, error: 'Only the host or an admin can end this space' },
      { status: 403 },
    );
  }

  if (row.status === 'ended') {
    return NextResponse.json({ ok: true, spaceId, alreadyEnded: true });
  }

  const endpoint = `https://api.juke.audio/v1/developer/spaces/${encodeURIComponent(spaceId)}/end`;
  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'X-Juke-Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err: unknown) {
    logger.error('[juke/admin/end-space] fetch failed', err);
    return NextResponse.json(
      { ok: false, error: 'Juke end-space API unreachable' },
      { status: 502 },
    );
  }

  const text = await res.text();
  let jukeBody: unknown;
  try {
    jukeBody = JSON.parse(text);
  } catch {
    jukeBody = text;
  }

  // 404 = Juke has not shipped PR #174 yet, OR cross-app / iOS-native room.
  // Same shape from Juke's side - no enumeration oracle. We flip our DB to
  // ended as a graceful fallback so /spaces stops showing the row as Live;
  // when room.finished eventually arrives from a later natural end, the
  // handler is idempotent + a no-op.
  if (res.status === 404) {
    logger.warn(
      '[juke/admin/end-space] Juke 404 - end-space endpoint not yet shipped or cross-app room',
      { spaceId },
    );
    try {
      await updateJukeSpace(spaceId, {
        status: 'ended',
        ended_at: new Date().toISOString(),
      });
    } catch (err: unknown) {
      logger.error('[juke/admin/end-space] fallback mark-ended DB update failed', err);
      return NextResponse.json(
        { ok: false, error: 'Juke end-space 404 + local fallback failed' },
        { status: 502 },
      );
    }
    return NextResponse.json(
      {
        ok: true,
        spaceId,
        fallback: 'mark-ended',
        note: 'Juke end-space endpoint not yet available; flipped local status to ended. A real room.finished may still arrive later.',
      },
      { status: 202 },
    );
  }

  if (!res.ok) {
    logger.warn('[juke/admin/end-space] Juke rejected', res.status, jukeBody);
    return NextResponse.json(
      { ok: false, error: `Juke returned ${res.status}`, juke: jukeBody },
      { status: res.status >= 500 ? 502 : res.status },
    );
  }

  // Success path: Juke accepted. We do NOT flip our DB here - the inbound
  // room.finished webhook will arrive almost immediately (Nicky confirmed
  // synchronous dispatch in same PR #174) and the handler will update the row
  // with the canonical ended_at + ended_via payload. Keeping all lifecycle
  // updates in the webhook handler means natural ends and API ends share the
  // same code path, fewer divergence bugs.
  return NextResponse.json({ ok: true, spaceId, juke: jukeBody });
}

export const GET = () =>
  NextResponse.json(
    { ok: false, error: 'POST only - send { spaceId } as JSON' },
    { status: 405 },
  );
