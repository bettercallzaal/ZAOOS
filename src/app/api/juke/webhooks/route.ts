import { NextRequest, NextResponse } from 'next/server';
import { ENV } from '@/lib/env';
import { logger } from '@/lib/logger';
import {
  markWebhookProcessed,
  recordWebhookEvent,
} from '@/lib/spaces/jukeSpacesDb';
import { applyWebhookEvent, parseWebhookEvent } from '@/lib/spaces/jukeWebhookHandlers';
import { verifyJukeWebhook } from '@/lib/spaces/jukeWebhookVerify';

/**
 * POST /api/juke/webhooks — inbound deliveries from Juke's outbound webhook
 * dispatcher (Juke PR 2026-05-23).
 *
 * Contract:
 *   X-Juke-Signature: t={unix-ts-seconds},v1={hex-hmac-sha256}
 *   payload signed:   f"{ts}.{body}"
 *   secret:           JUKE_WEBHOOK_SECRET (registered at POST /v1/developer/webhooks)
 *   retries:          t=0/+10s/+60s/+300s, then stop
 *
 * Behaviour:
 *   1. 401 if JUKE_WEBHOOK_SECRET is unset (refuse all inbound until paired).
 *   2. 401 on signature mismatch or timestamp outside the 5-min replay window.
 *   3. 200 + early ack on duplicate signature (idempotent replay).
 *   4. 200 after handler runs; failures are logged + persisted but NOT
 *      reflected as a 5xx (Juke would retry forever on a handler bug).
 *
 * We always return 200 once the signature passes, except for setup
 * misconfiguration (no secret) and signature failures.
 */
export async function POST(request: NextRequest) {
  const secret = ENV.JUKE_WEBHOOK_SECRET;
  if (!secret) {
    logger.warn('[juke/webhooks] inbound delivery but JUKE_WEBHOOK_SECRET is unset');
    return NextResponse.json({ ok: false, error: 'Webhook not configured' }, { status: 401 });
  }

  const rawBody = await request.text();
  const signatureHeader = request.headers.get('x-juke-signature');

  const verification = verifyJukeWebhook(rawBody, signatureHeader, secret);
  if (!verification.ok) {
    logger.warn('[juke/webhooks] signature failed:', verification.reason);
    return NextResponse.json({ ok: false, error: verification.reason }, { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const { eventType, spaceId, eventId } = parseWebhookEvent(body);

  let fresh: boolean;
  try {
    fresh = await recordWebhookEvent({
      eventType,
      jukeEventId: eventId,
      signatureHash: verification.signatureHash,
      spaceId,
      body,
    });
  } catch (err: unknown) {
    logger.error('[juke/webhooks] recordWebhookEvent threw:', err);
    return NextResponse.json({ ok: false, error: 'Could not record event' }, { status: 500 });
  }

  if (!fresh) {
    // Duplicate — already processed.
    return NextResponse.json({ ok: true, duplicate: true });
  }

  try {
    await applyWebhookEvent(eventType, spaceId, body);
    await markWebhookProcessed(verification.signatureHash);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'handler failed';
    logger.error('[juke/webhooks] handler error:', err);
    await markWebhookProcessed(verification.signatureHash, message).catch(() => {});
    // Still 200 — bug in handler should not trigger a Juke retry storm.
    return NextResponse.json({ ok: true, handler_error: message });
  }

  return NextResponse.json({ ok: true });
}

export const GET = () =>
  NextResponse.json(
    { ok: false, error: 'POST only — Juke webhooks are signed POST deliveries' },
    { status: 405 },
  );
