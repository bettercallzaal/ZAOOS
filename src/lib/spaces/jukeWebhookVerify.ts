/**
 * HMAC verifier for Juke's outbound webhook deliveries (see Juke 2026-05-23
 * PR: outbound developer webhooks).
 *
 * Juke signs each delivery with:
 *
 *     X-Juke-Signature: t={unix-ts-seconds},v1={hex-hmac-sha256}
 *
 * The signed payload is `f"{ts}.{body}"`, where `body` is the raw request body
 * exactly as sent (do not re-serialize - whitespace differences will break the
 * verification). The HMAC key is the secret shared at registration time via
 * `POST /v1/developer/webhooks` and stored locally as `JUKE_WEBHOOK_SECRET`.
 *
 * Replay defense: we reject deliveries whose `t` is more than 5 minutes off
 * from now. Juke retries at +10s/+60s/+300s so a 5-minute window covers the
 * full retry ladder without admitting hour-old replays.
 */
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

const REPLAY_WINDOW_SECONDS = 5 * 60;

export interface ParsedSignature {
  ts: number;
  v1: string;
}

export type VerifyResult =
  | { ok: true; ts: number; signatureHash: string }
  | { ok: false; reason: string };

/** Parse `t={ts},v1={hex}` (order-insensitive, ignores unknown keys). */
export function parseJukeSignature(header: string | null | undefined): ParsedSignature | null {
  if (!header) return null;
  const parts = header.split(',').map((p) => p.trim());
  let ts: number | null = null;
  let v1: string | null = null;
  for (const part of parts) {
    const eq = part.indexOf('=');
    if (eq <= 0) continue;
    const key = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (key === 't') {
      const n = Number(value);
      if (Number.isFinite(n)) ts = n;
    } else if (key === 'v1') {
      v1 = value;
    }
  }
  if (ts === null || !v1) return null;
  return { ts, v1 };
}

/**
 * Verify a webhook delivery. Caller passes the RAW body string (not parsed
 * JSON) so the HMAC matches the bytes Juke signed.
 *
 * Returns either `{ ok: true, signatureHash }` (sha256 of the v1 hex - the
 * idempotency key persisted in `juke_webhook_events`) or `{ ok: false, reason }`.
 */
export function verifyJukeWebhook(
  rawBody: string,
  signatureHeader: string | null | undefined,
  secret: string,
  now: number = Math.floor(Date.now() / 1000),
): VerifyResult {
  if (!secret) return { ok: false, reason: 'JUKE_WEBHOOK_SECRET not configured' };

  const parsed = parseJukeSignature(signatureHeader);
  if (!parsed) return { ok: false, reason: 'Missing or malformed X-Juke-Signature header' };

  if (Math.abs(now - parsed.ts) > REPLAY_WINDOW_SECONDS) {
    return { ok: false, reason: 'Signature timestamp outside replay window' };
  }

  const expected = createHmac('sha256', secret).update(`${parsed.ts}.${rawBody}`).digest('hex');

  // timingSafeEqual requires equal-length buffers and throws otherwise.
  if (expected.length !== parsed.v1.length) {
    return { ok: false, reason: 'Signature length mismatch' };
  }
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(parsed.v1, 'utf8');
  if (!timingSafeEqual(a, b)) {
    return { ok: false, reason: 'Signature mismatch' };
  }

  const signatureHash = createHash('sha256').update(parsed.v1).digest('hex');
  return { ok: true, ts: parsed.ts, signatureHash };
}
