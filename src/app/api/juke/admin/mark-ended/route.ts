import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { logger } from '@/lib/logger';
import { isValidJukeSpaceId } from '@/lib/spaces/juke';
import { getJukeSpace, updateJukeSpace } from '@/lib/spaces/jukeSpacesDb';

/**
 * POST /api/juke/admin/mark-ended
 *
 * Manual override that flips a Juke space row to `status: 'ended'` in our DB,
 * decoupled from the Juke `room.finished` webhook. Required today because the
 * Juke iframe Leave button is a pure LiveKit `room.disconnect()` and does not
 * trigger an end on Juke's side; rooms we create via the developer API only
 * really end when (a) Juke's developer end-space endpoint is called (no spec
 * for that yet, blocked on Nicky) or (b) Juke times the room out internally.
 *
 * Without this route, /spaces shows "test4" as Live for hours after the host
 * walked away. This bridges the gap.
 *
 * Admin OR original host (created_by_fid === session.fid) can mark a space
 * ended. The row is updated in-place; if a real `room.finished` webhook
 * arrives later, the handler is idempotent so it's a no-op.
 *
 * Body: { spaceId }
 * Returns: { ok: true, spaceId, status: 'ended' }
 */

const BodySchema = z.object({
  spaceId: z.string().refine(isValidJukeSpaceId, { message: 'Invalid Juke space id' }),
});

export async function POST(request: NextRequest) {
  const session = await getSessionData();
  if (!session?.fid) {
    return NextResponse.json({ ok: false, error: 'Sign in required' }, { status: 401 });
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
    return NextResponse.json({ ok: true, spaceId, status: 'ended', alreadyEnded: true });
  }

  try {
    await updateJukeSpace(spaceId, {
      status: 'ended',
      ended_at: new Date().toISOString(),
    });
  } catch (err: unknown) {
    logger.error('[juke/admin/mark-ended] DB update failed', err);
    return NextResponse.json(
      { ok: false, error: 'Failed to mark space as ended' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, spaceId, status: 'ended' });
}

export const GET = () =>
  NextResponse.json({ ok: false, error: 'POST only - send { spaceId } as JSON' }, { status: 405 });
