/**
 * Time checks on a Sign In With Farcaster message.
 *
 * `@farcaster/auth-client` runs viem's `validateSiweMessage`, which rejects a
 * passed `expirationTime` or a future `notBefore` only when the message carries
 * them. A message without them would otherwise never age out, so this also
 * requires `issuedAt` to be recent.
 */

import { parseSiweMessage } from 'viem/siwe';
import { NONCE_TTL_MS } from '@/lib/nonces';

const CLOCK_SKEW_MS = 60 * 1000;

export type SiwfTimeCheck = { ok: true } | { ok: false; reason: string };

export function checkSiwfTimes(message: string, now: Date = new Date()): SiwfTimeCheck {
  const parsed = parseSiweMessage(message);
  const t = now.getTime();

  if (!parsed.issuedAt || Number.isNaN(parsed.issuedAt.getTime())) {
    return { ok: false, reason: 'missing issuedAt' };
  }
  const issued = parsed.issuedAt.getTime();
  if (issued > t + CLOCK_SKEW_MS) return { ok: false, reason: 'issuedAt in the future' };
  if (t - issued > NONCE_TTL_MS) return { ok: false, reason: 'message too old' };

  if (parsed.expirationTime && t >= parsed.expirationTime.getTime()) {
    return { ok: false, reason: 'message expired' };
  }
  if (parsed.notBefore && t < parsed.notBefore.getTime() - CLOCK_SKEW_MS) {
    return { ok: false, reason: 'message not yet valid' };
  }
  return { ok: true };
}
