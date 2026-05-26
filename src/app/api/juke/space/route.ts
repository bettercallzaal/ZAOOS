import { createHash, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { ENV } from '@/lib/env';
import { logger } from '@/lib/logger';
import { createJukeSpace } from '@/lib/spaces/juke-api';
import { insertJukeSpace } from '@/lib/spaces/jukeSpacesDb';

/**
 * Constant-time string comparison. Both inputs are SHA-256'd to a fixed
 * 32-byte digest first, so `timingSafeEqual` never throws on a length
 * mismatch and the comparison leaks neither the length nor the content of
 * the configured password.
 */
function constantTimeEqual(a: string, b: string): boolean {
  const ah = createHash('sha256').update(a).digest();
  const bh = createHash('sha256').update(b).digest();
  return timingSafeEqual(ah, bh);
}

/**
 * POST /api/juke/space — create a branded Juke space (Path B of doc 695).
 *
 * Two ways to authorise:
 *  - an admin ZAO OS session, or
 *  - a `password` in the body matching `JUKE_CREATE_PASSWORD` — the path the
 *    `/live/create` page and the ZAOcoworking bot use.
 *
 * ZAO runs recurring audio-worthy events (ZAOstock standups, the weekly
 * fractal call, COC Concertz nights); this route mints a Juke space for one
 * of them on demand and returns the space id to embed at `/live/{id}`.
 *
 * The `JUKE_API_KEY` + `JUKE_USER_TOKEN` secrets stay server-side. Until both
 * are configured (apply at juke.audio/developers), the route reports 503
 * rather than failing opaquely — Path A, the keyless iframe embed, keeps
 * working regardless.
 */

const createSpaceSchema = z.object({
  /** Space title shown in Juke and on the ZAO `/live` surface. */
  title: z.string().trim().min(1).max(200),
  /** ISO-8601 start time; null or omitted opens the space immediately. */
  scheduledAt: z.string().datetime().nullish(),
  /** When true, Juke posts an announcement cast for the space. */
  announceCast: z.boolean().optional(),
  /** When true, AI agents may join the room. */
  allowAgents: z.boolean().optional(),
  /**
   * When true, Juke records the room. recording.ready webhook lands when the
   * file is ready and drives the /live/recordings shelf + "Recording up" cast.
   * ZAO default is true so every space contributes to the archive.
   */
  record: z.boolean().optional(),
  /** Space description shown inside the Juke embed. */
  description: z.string().trim().max(500).optional(),
  /** Shared create-password — an alternative to an admin session. */
  password: z.string().optional(),
});

export async function POST(request: NextRequest) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Request body must be valid JSON' },
      { status: 400 },
    );
  }

  const parsed = createSpaceSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  // Keep the password out of `spaceInput` so it never reaches the Juke API.
  const { password, ...spaceInput } = parsed.data;

  // Authorised by an admin ZAO OS session OR the shared create-password.
  // The password path is disabled unless JUKE_CREATE_PASSWORD is configured.
  const session = await getSessionData();
  const passwordOk =
    !!ENV.JUKE_CREATE_PASSWORD &&
    !!password &&
    constantTimeEqual(password, ENV.JUKE_CREATE_PASSWORD);
  if (!session?.isAdmin && !passwordOk) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }

  // Juke's create-space endpoint is key-only per llms.txt; room owner is the
  // developer app's owner_fid.
  const apiKey = ENV.JUKE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        success: false,
        error:
          'Juke developer API is not configured (missing JUKE_API_KEY). Apply at juke.audio/developers.',
      },
      { status: 503 },
    );
  }

  try {
    const result = await createJukeSpace(spaceInput, { apiKey });
    if (!result.ok) {
      // Upstream Juke failure. Log the real status server-side; report a
      // single 502 to the client — a Juke 401/400 is an integration problem,
      // not a signal the ZAO caller is unauthenticated or sent a bad body.
      logger.error('[juke/space] Juke API failed:', result.status, result.error);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 502 },
      );
    }
    // Persist the room so /live/{id} can render server-side + webhooks can
    // update its lifecycle. Best-effort: if Supabase is down we still
    // return the space id so the caller can proceed.
    try {
      await insertJukeSpace({
        id: result.space.id,
        title: spaceInput.title,
        createdByFid: session?.fid ?? 0,
        scheduledAt: spaceInput.scheduledAt ?? null,
        embedUrl: result.space.embedUrl,
        raw: result.space.raw,
      });
    } catch (dbErr: unknown) {
      logger.error('[juke/space] insertJukeSpace failed (non-fatal):', dbErr);
    }
    return NextResponse.json(
      { success: true, data: result.space },
      { status: 201 },
    );
  } catch (error: unknown) {
    logger.error('[juke/space] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create Juke space' },
      { status: 500 },
    );
  }
}
