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
  | { ok: true; ts: number; signatureHash: string; matchedVariant?: string }
  | { ok: false; reason: string; debug?: VerifyDebug };

export interface VerifyDebug {
  secretLen: number;
  secretFp: string;
  bodyLen: number;
  headerRaw: string;
  expectedRawPrefix: string;
  receivedV1Prefix: string;
  variantsTried: string[];
}

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

  // Juke's secret arrives as `whsec_<app-prefix>_<key>`. Different webhook
  // libraries differ on what bytes get used as the HMAC key — some sign with
  // the literal string, some strip the `whsec_` prefix, some base64-decode the
  // key tail. Try every plausible canonicalization so we don't fail loudly
  // because of a 5-character prefix convention.
  const variants = buildSecretVariants(secret);
  const message = `${parsed.ts}.${rawBody}`;
  let firstExpected = '';
  for (const variant of variants) {
    const expected = createHmac('sha256', variant.key).update(message).digest('hex');
    if (!firstExpected) firstExpected = expected;
    if (expected.length !== parsed.v1.length) continue;
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(parsed.v1, 'utf8');
    if (timingSafeEqual(a, b)) {
      const signatureHash = createHash('sha256').update(parsed.v1).digest('hex');
      return { ok: true, ts: parsed.ts, signatureHash, matchedVariant: variant.name };
    }
  }

  const debug: VerifyDebug = {
    secretLen: secret.length,
    secretFp: createHash('sha256').update(secret).digest('hex').slice(0, 12),
    bodyLen: rawBody.length,
    headerRaw: signatureHeader ?? '',
    expectedRawPrefix: firstExpected.slice(0, 16),
    receivedV1Prefix: parsed.v1.slice(0, 16),
    variantsTried: variants.map((v) => `${v.name}:${v.key.length}b`),
  };
  return { ok: false, reason: 'Signature mismatch', debug };
}

interface SecretVariant {
  name: string;
  key: Buffer | string;
}

function buildSecretVariants(secret: string): SecretVariant[] {
  const variants: SecretVariant[] = [];
  variants.push({ name: 'raw', key: secret });

  // Strip `whsec_` (Stripe/Svix convention).
  if (secret.startsWith('whsec_')) {
    const stripped = secret.slice('whsec_'.length);
    variants.push({ name: 'no-whsec', key: stripped });

    // Strip `whsec_<app>_` (Juke convention: whsec_awt4_<key>).
    const nextUnderscore = stripped.indexOf('_');
    if (nextUnderscore > 0 && nextUnderscore < stripped.length - 1) {
      const innerKey = stripped.slice(nextUnderscore + 1);
      variants.push({ name: 'no-whsec-noapp', key: innerKey });
      // Try base64-decoded key tail (common in webhook libs).
      try {
        const decoded = Buffer.from(innerKey, 'base64');
        if (decoded.length > 0) {
          variants.push({ name: 'no-whsec-noapp-b64', key: decoded });
        }
      } catch {
        // ignore, base64 decode failed
      }
    }

    // Base64 decode of the whole post-whsec tail.
    try {
      const decoded = Buffer.from(stripped, 'base64');
      if (decoded.length > 0) {
        variants.push({ name: 'no-whsec-b64', key: decoded });
      }
    } catch {
      // ignore
    }
  }

  return variants;
}
