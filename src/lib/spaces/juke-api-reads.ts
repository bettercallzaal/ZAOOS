/**
 * Juke developer-API READ endpoints. SERVER ONLY.
 *
 * Shipped by Juke in PR #175 (2026-05-25) - the same payload Nicky sketched
 * out when we asked for reconcile + observability primitives:
 *
 *   GET /v1/developer/spaces/{id}    -> RoomDetailResponse (status, participants,
 *                                        started_at, ended_at, recording state,
 *                                        same shape as public GET /v1/rooms/{id})
 *   GET /v1/developer/webhooks/{id}  -> WebhookDetailResponse (url, events,
 *                                        last_delivery_at, last_status,
 *                                        last_error, disabled_at,
 *                                        consecutive_failures)
 *   DELETE /v1/developer/webhooks/{id} -> 204 (already existed; surfaces here
 *                                          for the orphan-cleanup admin script)
 *
 * Read budget: 120/min per key (security hardening from PR #175 so a leaked
 * key cannot be used for unbounded participant polling).
 *
 * Rate-limit observability: every key-authed response now carries
 *   X-Juke-Rate-Limit-Limit / Remaining / Reset
 * We surface these on every call so callers can back off proactively. Daily
 * cap still only signals via 429 + Retry-After.
 */
import { logger } from '@/lib/logger';

export const JUKE_API_ORIGIN = 'https://api.juke.audio';
const TIMEOUT_MS = 10_000;

export interface JukeRateLimit {
  limit: number | null;
  remaining: number | null;
  resetAtSeconds: number | null;
}

export interface JukeReadResult<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
  rateLimit: JukeRateLimit;
}

/** Defensive shape - Nicky's sketch (RoomDetailResponse) has these fields, but
 * we treat the body as best-effort and only consume what we recognise. */
export interface JukeRoomDetail {
  id: string;
  status: 'active' | 'scheduled' | 'ended' | string;
  title?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  scheduled_at?: string | null;
  participants?: Array<{
    fid: number;
    display_name?: string | null;
    role?: string | null;
    joined_at?: string | null;
  }>;
  participant_count?: number;
  recording_url?: string | null;
  recording_status?: string | null;
  raw?: unknown;
}

export interface JukeWebhookDetail {
  id: string;
  url: string;
  events: string[];
  last_delivery_at?: string | null;
  last_status?: number | null;
  last_error?: string | null;
  disabled_at?: string | null;
  consecutive_failures?: number;
  raw?: unknown;
}

function readRateLimit(headers: Headers): JukeRateLimit {
  const limit = Number(headers.get('X-Juke-Rate-Limit-Limit'));
  const remaining = Number(headers.get('X-Juke-Rate-Limit-Remaining'));
  const reset = Number(headers.get('X-Juke-Rate-Limit-Reset'));
  return {
    limit: Number.isFinite(limit) ? limit : null,
    remaining: Number.isFinite(remaining) ? remaining : null,
    resetAtSeconds: Number.isFinite(reset) ? reset : null,
  };
}

function logRateLimit(label: string, rl: JukeRateLimit, status: number) {
  if (rl.remaining !== null && rl.limit !== null) {
    const ratio = rl.remaining / rl.limit;
    if (ratio < 0.2) {
      logger.warn(
        `[juke-api] ${label} rate-limit low: ${rl.remaining}/${rl.limit} remaining, resets at ${rl.resetAtSeconds}`,
        { status },
      );
    } else {
      logger.info(`[juke-api] ${label} ${rl.remaining}/${rl.limit} remaining`, { status });
    }
  }
}

async function jukeGet<T>(
  endpoint: string,
  apiKey: string,
  label: string,
): Promise<JukeReadResult<T>> {
  let res: Response;
  try {
    res = await fetch(`${JUKE_API_ORIGIN}${endpoint}`, {
      method: 'GET',
      headers: { 'X-Juke-Api-Key': apiKey, Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err: unknown) {
    logger.error(`[juke-api] ${label} fetch failed`, err);
    return {
      ok: false,
      status: 0,
      error: 'Juke API unreachable',
      rateLimit: { limit: null, remaining: null, resetAtSeconds: null },
    };
  }
  const rateLimit = readRateLimit(res.headers);
  logRateLimit(label, rateLimit, res.status);
  const text = await res.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    body = text;
  }
  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      error: typeof body === 'string' ? body : `Juke returned ${res.status}`,
      data: body as T | undefined,
      rateLimit,
    };
  }
  return { ok: true, status: res.status, data: body as T, rateLimit };
}

/**
 * Read the authoritative state of a Juke space we own. Use this to reconcile
 * after a suspected missed webhook (e.g. stale-room cron) or to power a
 * "live participants right now" badge without waiting for webhook lag.
 *
 * 404 = either the space does not exist on Juke, OR it was created by
 * another developer app (cross-app + iOS-native rooms return 404 with the
 * same shape; no enumeration oracle). Callers should treat 404 as a hint
 * that our local row is the authoritative state.
 */
export async function getJukeRoomDetail(
  spaceId: string,
  apiKey: string,
): Promise<JukeReadResult<JukeRoomDetail>> {
  return jukeGet<JukeRoomDetail>(
    `/v1/developer/spaces/${encodeURIComponent(spaceId)}`,
    apiKey,
    `GET space ${spaceId.slice(0, 8)}`,
  );
}

/**
 * Read one webhook subscription's current state - lets us verify the URL,
 * events, and recent delivery health without paging the full list. Use this
 * alongside our orphan-cleanup admin script.
 */
export async function getJukeWebhookDetail(
  webhookId: string,
  apiKey: string,
): Promise<JukeReadResult<JukeWebhookDetail>> {
  return jukeGet<JukeWebhookDetail>(
    `/v1/developer/webhooks/${encodeURIComponent(webhookId)}`,
    apiKey,
    `GET webhook ${webhookId.slice(0, 8)}`,
  );
}

/**
 * Delete one webhook subscription. Already existed in the original webhooks
 * PR per Nicky 2026-05-25. Returns 204 on success, 404 if the id is unknown.
 */
export async function deleteJukeWebhook(
  webhookId: string,
  apiKey: string,
): Promise<JukeReadResult<undefined>> {
  let res: Response;
  try {
    res = await fetch(`${JUKE_API_ORIGIN}/v1/developer/webhooks/${encodeURIComponent(webhookId)}`, {
      method: 'DELETE',
      headers: { 'X-Juke-Api-Key': apiKey },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err: unknown) {
    logger.error('[juke-api] DELETE webhook fetch failed', err);
    return {
      ok: false,
      status: 0,
      error: 'Juke API unreachable',
      rateLimit: { limit: null, remaining: null, resetAtSeconds: null },
    };
  }
  const rateLimit = readRateLimit(res.headers);
  logRateLimit(`DELETE webhook ${webhookId.slice(0, 8)}`, rateLimit, res.status);
  if (!res.ok) {
    const text = await res.text();
    return {
      ok: false,
      status: res.status,
      error: text || `Juke returned ${res.status}`,
      rateLimit,
    };
  }
  return { ok: true, status: res.status, rateLimit };
}
