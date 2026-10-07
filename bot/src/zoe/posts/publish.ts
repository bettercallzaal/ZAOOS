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

export interface PublishResult {
  ok: boolean;
  /** one line per platform, or one line saying why nothing was sent */
  summary: string;
  outcomes: PublishOutcome[];
  /** set when the request was never made (no bearer, bad url) or failed outright */
  error?: string;
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
    const payload = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      error?: string;
      details?: unknown;
      data?: { results?: PublishOutcome[] };
      results?: PublishOutcome[];
    };
    const outcomes = payload.data?.results ?? payload.results ?? [];
    if (!res.ok) {
      const details = Array.isArray(payload.details)
        ? payload.details.map(String).join('; ')
        : payload.details
          ? JSON.stringify(payload.details)
          : '';
      const error = `${payload.error ?? `HTTP ${res.status}`}${details ? ` - ${details}` : ''}`;
      return { ok: false, summary: `publish failed (${res.status}): ${error}`, outcomes, error };
    }
    const allOk = outcomes.length > 0 && outcomes.every((o) => o.ok);
    return {
      ok: allOk,
      summary: formatOutcomes(outcomes),
      outcomes,
      error: allOk ? undefined : 'one or more platforms failed',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, summary: `publish failed: ${message}`, outcomes: [], error: message };
  } finally {
    clearTimeout(timer);
  }
}
