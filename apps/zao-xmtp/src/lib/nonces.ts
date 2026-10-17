/**
 * Single-use SIWF nonces, stored server-side (same pattern as ZAOOS
 * `src/app/api/auth/verify/route.ts`: insert on issue, atomic delete-returning
 * on use). A nonce kept only in the cookie could be replayed with an old copy
 * of the cookie; a deleted row cannot be used twice.
 */

import crypto from 'node:crypto';
import { db } from '@/lib/db';

export const NONCE_TTL_MS = 10 * 60 * 1000;

export async function issueNonce(now: Date = new Date()): Promise<string> {
  const nonce = crypto.randomBytes(16).toString('hex');
  const expiresAt = new Date(now.getTime() + NONCE_TTL_MS).toISOString();
  const { error } = await db().from('auth_nonces').insert({ nonce, expires_at: expiresAt });
  if (error) throw new Error(`auth_nonces insert failed: ${error.message}`);

  // Prune expired rows. Failure here is harmless, but logged rather than swallowed.
  db()
    .from('auth_nonces')
    .delete()
    .lt('expires_at', now.toISOString())
    .then(({ error: pruneError }) => {
      if (pruneError) console.error('[nonces] prune failed:', pruneError.message);
    });
  return nonce;
}

/**
 * Consume a nonce. True only if it existed, was unexpired, and this call deleted it.
 * Throws on a database error so the caller can answer 503, not "invalid".
 */
export async function consumeNonce(nonce: string, now: Date = new Date()): Promise<boolean> {
  const { data, error } = await db()
    .from('auth_nonces')
    .delete()
    .eq('nonce', nonce)
    .gt('expires_at', now.toISOString())
    .select('nonce')
    .maybeSingle();
  if (error) throw new Error(`auth_nonces consume failed: ${error.message}`);
  return data !== null;
}
