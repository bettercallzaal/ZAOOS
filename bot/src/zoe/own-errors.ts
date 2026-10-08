/**
 * own-errors.ts - feed ZOE's own code failures into app_errors.
 *
 * The remediation rail (error-remediation.ts) reads `app_errors` rows with
 * status 'new' and routes each to a Hermes fix PR. Until this file, nothing in
 * bot/ wrote to that table, so ZOE could fix the apps' errors and never its
 * own. Zaal, 2026-10-07: ZOE should "auto get better over night".
 *
 * TABLE: `app_errors` in the cowork tracker Supabase project
 * (etwvzrmlxeobinrlytza), the one `db()` points at. Its live columns were read
 * 2026-10-08 through PostgREST and match scripts/2031-app-errors-remediation-rail.sql.
 *
 * WHAT GOES IN: code bugs only. A budget stop, a 429, a timeout, a refused
 * connection or a logged-out CLI is an operational state, and a fix PR cannot
 * change it; feeding those in would send Hermes to "fix" a spending cap. They
 * are skipped (isOpsFailure).
 *
 * WHAT NEVER GOES IN: secrets or personal data. Message and stack pass through
 * redactForErrorRow (tokens, keys, JWTs, emails, long numbers, long hex, home
 * paths) and are length-capped. The row carries no chat text and no user ids.
 *
 * DEDUPE: by stack_hash, using the rail's own stackHash so the app side and
 * this side agree. A repeat bumps count and last_seen instead of adding a row.
 * The bump is read-then-write, not atomic; two reports in the same instant can
 * lose one increment. That is a count, not a correctness signal, and the
 * unique index still prevents a duplicate row (a conflict becomes a bump).
 *
 * BOUNDED: at most 10 reports per process per hour, so a crash loop cannot
 * flood the table. Never throws.
 *
 * Off unless ZOE_OWN_ERRORS_FEED=1.
 */

import { db } from '../supabase';
import { stackHash } from './error-remediation';

export function ownErrorsFeedEnabled(): boolean {
  return process.env.ZOE_OWN_ERRORS_FEED === '1';
}

const OPS_RE =
  /\bbudget\b|error_max_budget|usage.?limit|rate.?limit|\b429\b|\b50[0-4]\b|timed? ?out|timeout|ETIMEDOUT|ECONNRESET|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|socket hang up|fetch failed|\b40[13]\b|unauthori[sz]ed|not logged in|\/login\b/i;

/** True for failures a code change cannot fix: limits, network, auth. */
export function isOpsFailure(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return OPS_RE.test(msg);
}

/** Strip anything that could be a secret or personal data. */
export function redactForErrorRow(text: string): string {
  return text
    .replace(/\/(?:home|Users)\/[^/\s)]+\//g, '~/') // home directory, names the user; first, so paths stay readable
    .replace(/\b(Bearer|Basic|Token)\s+[A-Za-z0-9._~+/=-]+/gi, '$1 [REDACTED]') // auth header value, any length
    .replace(/([?&](?:token|access_token|api_?key|apikey|key|secret|signature|sig|auth)=)[^&\s#]+/gi, '$1[REDACTED]') // secret query params
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '[REDACTED]') // UUID-format keys (Neynar and others)
    .replace(/\b\d{6,}:[A-Za-z0-9_-]{30,}\b/g, '[REDACTED]') // Telegram bot token
    .replace(/\bsk-[A-Za-z0-9_-]{16,}/g, '[REDACTED]') // Anthropic / OpenAI style keys
    .replace(/\bgh[pousr]_[A-Za-z0-9]{20,}/g, '[REDACTED]') // GitHub tokens
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[REDACTED]') // JWT
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[REDACTED]') // email
    .replace(/\b[0-9a-f]{32,}\b/gi, '[REDACTED]') // long hex
    .replace(/[A-Za-z0-9+_-]{40,}={0,2}/g, '[REDACTED]') // long base64-ish; no '/', so file paths survive
    .replace(/-?\b\d{7,}\b/g, 'N'); // chat ids, phone-like numbers
}

export interface OwnErrorRow {
  repo: 'zaoos';
  route: string;
  message: string;
  stack: string | null;
  stack_hash: string;
  status: 'new';
}

export function buildOwnErrorRow(err: unknown, source: string): OwnErrorRow {
  const raw = err instanceof Error ? err.message : String(err);
  const message = redactForErrorRow(raw || 'unknown error').slice(0, 500);
  const stackRaw = err instanceof Error && err.stack ? err.stack : null;
  const stack = stackRaw ? redactForErrorRow(stackRaw).slice(0, 4000) : null;
  return {
    repo: 'zaoos',
    route: `bot/zoe:${source}`.slice(0, 120),
    message,
    stack,
    // No stack: hash the source and message, so the same failure still dedupes.
    stack_hash: stackHash(stack ?? `${source}\n${message}`),
    status: 'new',
  };
}

export interface OwnErrorStore {
  find(hash: string): Promise<{ id: string; count: number } | null>;
  insert(row: OwnErrorRow): Promise<{ conflict: boolean }>;
  bump(id: string, count: number): Promise<void>;
}

function supabaseStore(): OwnErrorStore {
  return {
    async find(hash) {
      const { data, error } = await db().from('app_errors').select('id, count').eq('stack_hash', hash).limit(1);
      if (error) throw new Error(error.message);
      return data && data.length ? (data[0] as { id: string; count: number }) : null;
    },
    async insert(row) {
      const { error } = await db().from('app_errors').insert(row);
      if (!error) return { conflict: false };
      if (error.code === '23505') return { conflict: true };
      throw new Error(error.message);
    },
    async bump(id, count) {
      const now = new Date().toISOString();
      const { error } = await db().from('app_errors').update({ count, last_seen: now, updated_at: now }).eq('id', id);
      if (error) throw new Error(error.message);
    },
  };
}

const CAP_PER_HOUR = 10;
let window: { start: number; n: number } = { start: 0, n: 0 };
/** For tests. */
export function resetOwnErrorCap(): void {
  window = { start: 0, n: 0 };
}

export type OwnErrorOutcome = 'off' | 'skipped-ops' | 'capped' | 'inserted' | 'bumped' | 'failed';

export async function reportOwnError(
  err: unknown,
  source: string,
  deps: { store?: OwnErrorStore; now?: number } = {},
): Promise<OwnErrorOutcome> {
  if (!ownErrorsFeedEnabled()) return 'off';
  // Everything that reads `err` sits inside the try: String() on a
  // null-prototype object throws, and this must never throw (review of #3802).
  try {
    if (isOpsFailure(err)) return 'skipped-ops';
    const now = deps.now ?? Date.now();
    if (now - window.start >= 3_600_000) window = { start: now, n: 0 };
    if (window.n >= CAP_PER_HOUR) return 'capped';
    window.n++;
    const store = deps.store ?? supabaseStore();
    const row = buildOwnErrorRow(err, source);
    const found = await store.find(row.stack_hash);
    if (found) {
      await store.bump(found.id, found.count + 1);
      return 'bumped';
    }
    const ins = await store.insert(row);
    if (!ins.conflict) {
      console.log(`[zoe/own-errors] recorded ${source}: ${row.message.slice(0, 80)}`);
      return 'inserted';
    }
    const again = await store.find(row.stack_hash);
    if (!again) return 'failed';
    await store.bump(again.id, again.count + 1);
    return 'bumped';
  } catch (error: unknown) {
    console.error('[zoe/own-errors] could not record the error:', (error as Error)?.message);
    return 'failed';
  }
}
