import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { ENV } from '@/lib/env';
import { logger } from '@/lib/logger';

/**
 * POST /api/juke/admin/register-webhook
 *
 * Server-side wrapper around `POST https://api.juke.audio/v1/developer/webhooks`
 * so the registration runs in an environment where JUKE_API_KEY + JUKE_WEBHOOK_SECRET
 * already live (Vercel encrypted env). Avoids the Vercel-CLI-pull-redacts-sensitive
 * dance for the local register-juke-webhook.ts script.
 *
 * Admin-only. Idempotent in practice: Juke caps webhook subs at max 5 per app +
 * uniques by (app_id, url), so re-running with the same URL returns the existing
 * subscription rather than duplicating.
 *
 * Body (optional):
 *   { url?: string }   defaults to https://zaoos.com/api/juke/webhooks
 *
 * Response:
 *   201 + { ok: true, juke: <whatever Juke returned> }
 *   401 if not admin
 *   503 if JUKE_API_KEY or JUKE_WEBHOOK_SECRET is unset
 *   502 if Juke rejects
 */

const BodySchema = z.object({
  url: z.string().url().optional(),
});

const DEFAULT_URL = 'https://zaoos.com/api/juke/webhooks';
const EVENTS = [
  'room.started',
  'room.finished',
  'participant.joined',
  'participant.left',
  'recording.ready',
];

export async function POST(request: NextRequest) {
  const session = await getSessionData();
  if (!session?.isAdmin) {
    return NextResponse.json({ ok: false, error: 'Admin only' }, { status: 401 });
  }

  const apiKey = ENV.JUKE_API_KEY;
  const secret = ENV.JUKE_WEBHOOK_SECRET;
  if (!apiKey || !secret) {
    const missing = [!apiKey ? 'JUKE_API_KEY' : null, !secret ? 'JUKE_WEBHOOK_SECRET' : null]
      .filter(Boolean)
      .join(' and ');
    return NextResponse.json(
      { ok: false, error: `Missing ${missing} on the server.` },
      { status: 503 },
    );
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    /* empty body is fine */
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Invalid body', details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const url = parsed.data.url ?? DEFAULT_URL;

  try {
    const res = await fetch('https://api.juke.audio/v1/developer/webhooks', {
      method: 'POST',
      headers: {
        'X-Juke-Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, secret, events: EVENTS }),
    });
    const text = await res.text();
    let jukeBody: unknown;
    try {
      jukeBody = JSON.parse(text);
    } catch {
      jukeBody = text;
    }
    if (!res.ok) {
      logger.error('[juke/admin/register-webhook] Juke rejected', res.status, jukeBody);
      return NextResponse.json(
        { ok: false, error: `Juke returned ${res.status}`, juke: jukeBody },
        { status: 502 },
      );
    }
    return NextResponse.json(
      { ok: true, url, events: EVENTS, juke: jukeBody },
      { status: 201 },
    );
  } catch (err: unknown) {
    logger.error('[juke/admin/register-webhook] unexpected', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

export const GET = () =>
  NextResponse.json(
    { ok: false, error: 'POST only - this is a one-shot admin registration endpoint.' },
    { status: 405 },
  );
