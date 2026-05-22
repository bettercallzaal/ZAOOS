import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { ENV } from '@/lib/env';
import { logger } from '@/lib/logger';
import { createJukeSpace } from '@/lib/spaces/juke-api';

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
    !!ENV.JUKE_CREATE_PASSWORD && password === ENV.JUKE_CREATE_PASSWORD;
  if (!session?.isAdmin && !passwordOk) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 },
    );
  }

  // Juke's create-space endpoint needs both the app key and a host JWT.
  const apiKey = ENV.JUKE_API_KEY;
  const userToken = ENV.JUKE_USER_TOKEN;
  if (!apiKey || !userToken) {
    const missing = [
      !apiKey ? 'JUKE_API_KEY' : null,
      !userToken ? 'JUKE_USER_TOKEN' : null,
    ]
      .filter(Boolean)
      .join(' and ');
    return NextResponse.json(
      {
        success: false,
        error: `Juke developer API is not configured (missing ${missing}). Apply at juke.audio/developers.`,
      },
      { status: 503 },
    );
  }

  try {
    const result = await createJukeSpace(spaceInput, { apiKey, userToken });
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
