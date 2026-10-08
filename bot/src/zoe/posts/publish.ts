// POST button -> the real publish path (doc 2239 section 5, fix 1; doc 2244).
//
// Until this module, POST on a draft card marked the draft approved and resent
// the bare text as a copy-target for Firefly. The orchestrator route
// POST /api/publish/compose (ZAOOS, #2946) already fans one text out to
// Farcaster first, then X and Bluesky, then the chat broadcasts; nothing in ZOE
// called it. This module is that call, behind a flag that defaults OFF so the
// deployed behaviour is unchanged until Zaal sets it.
//
//   ZOE_POST_PUBLISH=1          turn the wiring on (default OFF: resend as before)
//   ZOE_PUBLISH_BEARER          shared secret, must match PUBLISH_BOT_TOKEN on the app
//   ZOE_PUBLISH_URL             default https://zaoos.com/api/publish/compose
//   ZOE_PUBLISH_PLATFORMS       comma list, default "farcaster,x" (feedback_firefly_only:
//                               90 percent of Zaal's posting is Farcaster + X)
//
// Publishing is irreversible. The route defaults dryRun to TRUE, so this module
// sends dryRun:false explicitly and ONLY when the flag is on. A missing bearer
// refuses locally rather than sending an unauthenticated request that would
// 401 anyway. Every failure returns an outcome; nothing here throws into the
// button handler, because a thrown publish would strand the draft.

const DEFAULT_URL = 'https://zaoos.com/api/publish/compose';
const KNOWN_PLATFORMS = ['farcaster', 'x', 'bluesky', 'telegram', 'discord'] as const;
type Platform = (typeof KNOWN_PLATFORMS)[number];
const DEFAULT_PLATFORMS: Platform[] = ['farcaster', 'x'];
const TIMEOUT_MS = 30_000;

export interface PublishOutcome {
  platform: string;
  ok: boolean;
  detail: string;
  simulated?: boolean;
}

/**
 * What the button may do next depends on this, not on `ok`:
 *   published  every platform ok
 *   partial    some ok - something IS live, never resend the text
 *   failed     nothing can be live (no bearer, pre-connect failure, 4xx, or a
 *              2xx that reports every platform failed) - resending the text to
 *              paste by hand is safe
 *   unknown    the request went out and no trustworthy answer came back (30 s
 *              abort, 5xx, unreadable body). The route casts to Farcaster FIRST,
 *              so a live cast plus a slow X call looks exactly like this. Never
 *              resend; tell Zaal to check before reposting. (zaoos-35 review of
 *              #3782, 2026-10-07: the earlier code resent on this path and
 *              invited a duplicate public post.)
 */
export type PublishState = 'published' | 'partial' | 'failed' | 'unknown';

export interface PublishResult {
  ok: boolean;
  state: PublishState;
  /** one line per platform, or one line saying why nothing was sent */
  summary: string;
  outcomes: PublishOutcome[];
  /** set when the request was never made (no bearer, bad url) or failed outright */
  error?: string;
}

/** Errors thrown BEFORE a connection existed - nothing can have been published. */
const PRE_CONNECT = /ECONNREFUSED|ENOTFOUND|EAI_AGAIN/;

function describeThrown(err: unknown): { pre: boolean; aborted: boolean; message: string } {
  const e = err as { name?: string; message?: string; cause?: { code?: string; message?: string } };
  const code = e?.cause?.code ?? '';
  const message = [e?.message, code || e?.cause?.message].filter(Boolean).join(' - ') || String(err);
  return { pre: PRE_CONNECT.test(message), aborted: e?.name === 'AbortError', message };
}

export interface PublishArgs {
  text: string;
  /** injected for tests; defaults to global fetch */
  fetchImpl?: typeof fetch;
}

export function isPostPublishEnabled(): boolean {
  return process.env.ZOE_POST_PUBLISH === '1';
}

export function publishPlatforms(): Platform[] {
  const raw = process.env.ZOE_PUBLISH_PLATFORMS;
  if (!raw || !raw.trim()) return [...DEFAULT_PLATFORMS];
  const picked = raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is Platform => (KNOWN_PLATFORMS as readonly string[]).includes(s));
  return picked.length > 0 ? picked : [...DEFAULT_PLATFORMS];
}

function formatOutcomes(outcomes: PublishOutcome[]): string {
  if (outcomes.length === 0) return '(no platform outcomes returned)';
  return outcomes
    .map((o) => `${o.platform}: ${o.ok ? '' : 'FAILED '}${o.detail}${o.simulated ? ' (dry run)' : ''}`)
    .join('\n');
}

/**
 * Call the compose route for real. Returns an outcome in every case.
 */
export async function publishApprovedDraft(args: PublishArgs): Promise<PublishResult> {
  const bearer = process.env.ZOE_PUBLISH_BEARER?.trim();
  if (!bearer) {
    return {
      ok: false,
      state: 'failed',
      summary: 'not published: ZOE_PUBLISH_BEARER is unset on this host',
      outcomes: [],
      error: 'ZOE_PUBLISH_BEARER unset',
    };
  }
  const url = (process.env.ZOE_PUBLISH_URL?.trim() || DEFAULT_URL).replace(/\/+$/, '');
  const platforms = publishPlatforms();
  const fetchImpl = args.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bearer}` },
      body: JSON.stringify({ text: args.text, platforms, dryRun: false }),
      signal: controller.signal,
    });
    if (res.status >= 500) {
      // The route may have cast before it died. Nothing here proves otherwise.
      const error = `HTTP ${res.status} from the publish route`;
      return { ok: false, state: 'unknown', summary: `no trustworthy answer: ${error}`, outcomes: [], error };
    }
    let payload: {
      success?: boolean;
      error?: string;
      details?: unknown;
      data?: { results?: PublishOutcome[] };
      results?: PublishOutcome[];
    };
    try {
      payload = (await res.json()) as typeof payload;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (!res.ok) {
        // A 4xx with no body still refused the request; nothing was published.
        return { ok: false, state: 'failed', summary: `publish failed (${res.status})`, outcomes: [], error: `HTTP ${res.status}` };
      }
      return {
        ok: false,
        state: 'unknown',
        summary: `no trustworthy answer: the response body could not be read (${message})`,
        outcomes: [],
        error: message,
      };
    }
    const outcomes = payload.data?.results ?? payload.results ?? [];
    if (!res.ok) {
      const details = Array.isArray(payload.details)
        ? payload.details.map(String).join('; ')
        : payload.details
          ? JSON.stringify(payload.details)
          : '';
      const error = `${payload.error ?? `HTTP ${res.status}`}${details ? ` - ${details}` : ''}`;
      return { ok: false, state: 'failed', summary: `publish failed (${res.status}): ${error}`, outcomes, error };
    }
    if (outcomes.length === 0) {
      return {
        ok: false,
        state: 'unknown',
        summary: 'no trustworthy answer: the route returned 200 with no platform outcomes',
        outcomes,
        error: 'no outcomes',
      };
    }
    const okCount = outcomes.filter((o) => o.ok && !o.simulated).length;
    const state: PublishState = okCount === outcomes.length ? 'published' : okCount > 0 ? 'partial' : 'failed';
    return {
      ok: state === 'published',
      state,
      summary: formatOutcomes(outcomes),
      outcomes,
      error: state === 'published' ? undefined : 'one or more platforms failed',
    };
  } catch (err: unknown) {
    const { pre, aborted, message } = describeThrown(err);
    if (pre) {
      return { ok: false, state: 'failed', summary: `publish failed before connecting: ${message}`, outcomes: [], error: message };
    }
    const why = aborted ? `no answer within ${TIMEOUT_MS / 1000} s` : message;
    return { ok: false, state: 'unknown', summary: `no trustworthy answer: ${why}`, outcomes: [], error: message };
  } finally {
    clearTimeout(timer);
  }
}
