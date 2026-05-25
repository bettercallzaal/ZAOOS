import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { ENV } from '@/lib/env';
import { logger } from '@/lib/logger';
import { deleteJukeWebhook, getJukeWebhookDetail } from '@/lib/spaces/juke-api-reads';

/**
 * POST /api/juke/admin/delete-webhook
 *
 * Admin-only cleanup for orphan webhook subscriptions on Juke's side. Created
 * to clear the leftover 61b1400b-3df2-4d19-a761-a13d39b36e8f subscription
 * from the secret-rotation incident on 2026-05-24 (we never used that
 * webhook after re-registering, but it stayed on Juke). Per Nicky 2026-05-25
 * the DELETE /v1/developer/webhooks/{id} endpoint already exists; this route
 * wraps it so we don't need a one-off DevTools fetch.
 *
 * Body: { webhookId }
 * Returns 200 { ok: true, deleted } on success, 4xx on Juke rejection.
 *
 * Safety: we GET the webhook first so we can log the URL + events that are
 * about to be deleted - a small breadcrumb in case someone deletes the
 * wrong one. The actual DELETE is fire-and-go.
 */

const BodySchema = z.object({
  webhookId: z
    .string()
    .min(8)
    .max(128)
    .regex(/^[A-Za-z0-9_-]+$/, 'Invalid webhook id'),
});

export async function POST(request: NextRequest) {
  const session = await getSessionData();
  if (!session?.isAdmin) {
    return NextResponse.json({ ok: false, error: 'Admin only' }, { status: 401 });
  }

  const apiKey = ENV.JUKE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: 'JUKE_API_KEY not configured' },
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
  const { webhookId } = parsed.data;

  // Best-effort introspection first so the audit log shows what was deleted.
  const detail = await getJukeWebhookDetail(webhookId, apiKey);
  if (detail.ok && detail.data) {
    logger.info('[juke/admin/delete-webhook] deleting subscription', {
      webhookId,
      url: detail.data.url,
      events: detail.data.events,
      last_status: detail.data.last_status,
      consecutive_failures: detail.data.consecutive_failures,
    });
  } else {
    logger.info('[juke/admin/delete-webhook] introspection failed (proceeding)', {
      webhookId,
      status: detail.status,
    });
  }

  const result = await deleteJukeWebhook(webhookId, apiKey);
  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: result.error ?? `Juke returned ${result.status}`,
        juke_status: result.status,
        rate_limit: result.rateLimit,
      },
      { status: result.status >= 500 || result.status === 0 ? 502 : result.status },
    );
  }

  return NextResponse.json({
    ok: true,
    deleted: webhookId,
    juke_status: result.status,
    rate_limit: result.rateLimit,
  });
}

export const GET = () =>
  NextResponse.json(
    { ok: false, error: 'POST only - send { webhookId } as JSON' },
    { status: 405 },
  );
