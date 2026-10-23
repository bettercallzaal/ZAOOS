import { ENV } from '@/lib/env';
import { logger } from '@/lib/logger';

const NEYNAR_BASE = 'https://api.neynar.com/v2/farcaster';
const READ_BASE = ENV.FARCASTER_READ_API_BASE
  ? `${ENV.FARCASTER_READ_API_BASE}/v2/farcaster`
  : NEYNAR_BASE;

function headers() {
  return {
    'Content-Type': 'application/json',
    'x-api-key': ENV.NEYNAR_API_KEY,
  };
}

/** Headers for read requests — omit API key when using free Hypersnap proxy */
function readHeaders() {
  if (ENV.FARCASTER_READ_API_BASE) {
    return { 'Content-Type': 'application/json' };
  }
  return headers();
}

/**
 * Fetch with failover: try READ_BASE first, fall back to NEYNAR_BASE on error.
 * Each failover logs one warn line (path without query, proxy status or error)
 * so a read base that 404s or 503s is visible instead of silently paid for.
 */
async function fetchWithFailover(path: string, init: RequestInit): Promise<Response> {
  if (READ_BASE === NEYNAR_BASE) {
    return fetch(`${NEYNAR_BASE}${path}`, init);
  }
  const route = path.split('?')[0];
  try {
    const res = await fetch(`${READ_BASE}${path}`, init);
    if (res.ok) return res;
    logger.warn(
      `[neynar/failover] ${route} read base returned ${res.status}, falling back to Neynar`,
    );
  } catch (error: unknown) {
    const reason = error instanceof Error ? error.message : String(error);
    logger.warn(`[neynar/failover] ${route} read base threw (${reason}), falling back to Neynar`);
  }
  return fetch(`${NEYNAR_BASE}${path}`, {
    ...init,
    headers: headers(),
  });
}

export async function getTrendingFeed(limit = 25, timeWindow = '24h', cursor?: string) {
  const params = new URLSearchParams({
    limit: String(limit),
    time_window: timeWindow,
  });
  if (cursor) params.set('cursor', cursor);

  const res = await fetchWithFailover(`/feed/trending?${params}`, {
    headers: readHeaders(),
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Neynar trending feed error ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

export async function getChannelFeed(channelId: string, cursor?: string, limit = 20) {
  const params = new URLSearchParams({
    channel_ids: channelId,
    limit: String(limit),
    with_recasts: 'false',
  });
  if (cursor) params.set('cursor', cursor);

  const res = await fetchWithFailover(`/feed/channels?${params}`, {
    headers: readHeaders(),
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Neynar feed error ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  if (Array.isArray(data?.casts)) data.casts = sortCastsNewestFirst(data.casts);
  return data;
}

/**
 * Sort a channel page newest-first, keeping every cast. Hypersnap pages each
 * shard on its own and joins the pages unsorted, up to `limit` casts per shard,
 * with one resume token per shard (doc 2418, UPDATE 2026-10-23). Trimming the
 * page to `limit` would lose casts for good, because the cursor has already
 * moved past them; sorting is safe because the tokens do not depend on order.
 */
export function sortCastsNewestFirst<T extends { timestamp?: string }>(casts: T[]): T[] {
  const time = (c: T): number => Date.parse(c.timestamp ?? '') || 0;
  return [...casts].sort((a, b) => time(b) - time(a));
}

/**
 * Home feed: casts from the accounts `fid` follows, newest first.
 * docs.neynar.com/reference/fetch-user-following-feed (fetched 2026-10-15):
 * `fid` required, `viewer_fid` applies the viewer's mutes and blocks,
 * `limit` 1-100, returns `{ casts, next: { cursor } }`.
 */
export async function getFollowingFeed(fid: number, cursor?: string, limit = 25) {
  const params = new URLSearchParams({
    fid: String(fid),
    viewer_fid: String(fid),
    limit: String(limit),
    with_recasts: 'true',
  });
  if (cursor) params.set('cursor', cursor);

  const res = await fetchWithFailover(`/feed/following?${params}`, {
    headers: readHeaders(),
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Neynar following feed error ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

export async function postCast(
  signerUuid: string,
  text: string,
  channelId: string,
  parentHash?: string,
  embedHash?: string,
  embedUrls?: string[],
  embedFid?: number,
  apiKey?: string,
) {
  const body: Record<string, unknown> = {
    signer_uuid: signerUuid,
    text,
    channel_id: channelId,
  };
  if (parentHash) body.parent = parentHash;

  const embeds: Record<string, unknown>[] = [];
  if (embedHash) {
    // Neynar requires both hash and fid for cast embeds
    if (embedFid) {
      embeds.push({ cast_id: { hash: embedHash, fid: embedFid } });
    } else {
      // Fallback: embed as URL which Farcaster will unfurl
      embeds.push({ url: `https://farcaster.xyz/~/conversations/${embedHash}` });
    }
  }
  if (embedUrls) {
    for (const url of embedUrls) {
      embeds.push({ url });
    }
  }
  if (embeds.length > 0) body.embeds = embeds;

  const res = await fetch(`${NEYNAR_BASE}/cast`, {
    method: 'POST',
    headers: apiKey ? { 'Content-Type': 'application/json', 'x-api-key': apiKey } : headers(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Neynar post error ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

export async function getCastThread(hash: string) {
  const params = new URLSearchParams({
    identifier: hash,
    type: 'hash',
    reply_depth: '1',
    include_chronological_parent_casts: 'false',
  });
  const res = await fetchWithFailover(`/cast/conversation?${params}`, {
    headers: readHeaders(),
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Neynar thread error ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

export async function getUserByFid(fid: number, viewerFid?: number) {
  const params = new URLSearchParams({ fids: String(fid) });
  if (viewerFid) params.set('viewer_fid', String(viewerFid));
  const res = await fetchWithFailover(`/user/bulk?${params}`, {
    headers: readHeaders(),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Neynar user error ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.users?.[0] || null;
}

/**
 * Fetch a FID's Neynar quality score (experimental.neynar_user_score),
 * direct from Neynar — bypassing the haatz read proxy.
 *
 * The haatz proxy returns a 200 for /user/bulk but does NOT populate the
 * `experimental` block (verified 2026-05-20), so it cannot serve this score.
 * fetchWithFailover would never fall through (200 = "success"), so this
 * helper goes straight to Neynar. Returns null when unavailable.
 */
export async function getNeynarUserScore(fid: number): Promise<number | null> {
  try {
    const res = await fetch(`${NEYNAR_BASE}/user/bulk?fids=${fid}`, {
      headers: headers(),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const user = data.users?.[0];
    const score = user?.experimental?.neynar_user_score;
    return typeof score === 'number' ? score : null;
  } catch {
    return null;
  }
}

export async function getUsersByFids(fids: number[]) {
  if (!fids.length) return [];
  const params = new URLSearchParams({ fids: fids.join(',') });
  const res = await fetchWithFailover(`/user/bulk?${params}`, {
    headers: readHeaders(),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Neynar bulk user error ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.users || [];
}

/** Fetch recent casts for a FID. Used by ZABAL vote-power calc (counts /zao channel casts). */
export async function getUserCasts(fid: number, limit = 100) {
  const params = new URLSearchParams({ fid: String(fid), limit: String(limit) });
  const res = await fetchWithFailover(`/feed/user/casts?${params}`, {
    headers: readHeaders(),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Neynar user casts error ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.casts || [];
}

export async function getUserByAddress(address: string) {
  const res = await fetchWithFailover(`/user/bulk-by-address?addresses=${address}`, {
    headers: readHeaders(),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Neynar address lookup error ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  const users = data[address.toLowerCase()];
  return users?.[0] || null;
}

export async function createSigner() {
  const res = await fetch(`${NEYNAR_BASE}/signer`, {
    method: 'POST',
    headers: headers(),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar signer error: ${res.status}`);
  return res.json();
}

export async function registerSignedKey(
  signerUuid: string,
  appFid: number,
  deadline: number,
  signature: string,
) {
  const res = await fetch(`${NEYNAR_BASE}/signer/signed_key`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      signer_uuid: signerUuid,
      app_fid: appFid,
      deadline,
      signature,
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar register key error: ${res.status}`);
  return res.json();
}

export async function getSignerStatus(signerUuid: string) {
  const res = await fetch(`${NEYNAR_BASE}/signer?signer_uuid=${signerUuid}`, {
    headers: headers(),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar signer status error: ${res.status}`);
  return res.json();
}

export async function searchUsers(query: string, limit = 5) {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
  });
  const res = await fetchWithFailover(`/user/search?${params}`, {
    headers: readHeaders(),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar search error: ${res.status}`);
  return res.json();
}

export async function getFollowers(
  fid: number,
  viewerFid?: number,
  sortType: 'desc_chron' | 'algorithmic' = 'desc_chron',
  cursor?: string,
  limit = 100,
) {
  const params = new URLSearchParams({
    fid: String(fid),
    sort_type: sortType,
    limit: String(limit),
  });
  if (viewerFid) params.set('viewer_fid', String(viewerFid));
  if (cursor) params.set('cursor', cursor);

  const res = await fetchWithFailover(`/followers?${params}`, {
    headers: readHeaders(),
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar followers error: ${res.status}`);
  return res.json();
}

export async function getFollowing(
  fid: number,
  viewerFid?: number,
  sortType: 'desc_chron' | 'algorithmic' = 'desc_chron',
  cursor?: string,
  limit = 100,
) {
  const params = new URLSearchParams({
    fid: String(fid),
    sort_type: sortType,
    limit: String(limit),
  });
  if (viewerFid) params.set('viewer_fid', String(viewerFid));
  if (cursor) params.set('cursor', cursor);

  const res = await fetchWithFailover(`/following?${params}`, {
    headers: readHeaders(),
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar following error: ${res.status}`);
  return res.json();
}

export async function getRelevantFollowers(targetFid: number, viewerFid: number) {
  const params = new URLSearchParams({
    target_fid: String(targetFid),
    viewer_fid: String(viewerFid),
  });
  const res = await fetchWithFailover(`/followers/relevant?${params}`, {
    headers: readHeaders(),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar relevant followers error: ${res.status}`);
  return res.json();
}

export async function followUser(signerUuid: string, targetFids: number[]) {
  const res = await fetch(`${NEYNAR_BASE}/user/follow`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      signer_uuid: signerUuid,
      target_fids: targetFids,
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar follow error: ${res.status}`);
  return res.json();
}

export async function unfollowUser(signerUuid: string, targetFids: number[]) {
  const res = await fetch(`${NEYNAR_BASE}/user/follow`, {
    method: 'DELETE',
    headers: headers(),
    body: JSON.stringify({
      signer_uuid: signerUuid,
      target_fids: targetFids,
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar unfollow error: ${res.status}`);
  return res.json();
}

export async function registerUser(
  signature: string,
  custodyAddress: string,
  deadline: number,
  fname?: string,
) {
  const body: Record<string, unknown> = {
    signature,
    custody_address: custodyAddress,
    deadline,
  };
  if (fname) body.fname = fname;

  const res = await fetch(`${NEYNAR_BASE}/user`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar register error: ${res.status}`);
  return res.json();
}

export async function getNotifications(fid: number, cursor?: string, limit = 25) {
  const params = new URLSearchParams({
    fid: String(fid),
    limit: String(limit),
  });
  if (cursor) params.set('cursor', cursor);
  const res = await fetchWithFailover(`/notifications?${params}`, {
    headers: readHeaders(),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Neynar notifications error ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

export async function markNotificationsSeen(signerUuid: string) {
  const res = await fetch(`${NEYNAR_BASE}/notifications/seen`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ signer_uuid: signerUuid }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar mark notifications seen error: ${res.status}`);
  return res.json();
}

export async function muteUser(signerUuid: string, targetFid: number) {
  const res = await fetch(`${NEYNAR_BASE}/mute`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ signer_uuid: signerUuid, target_fid: targetFid }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar mute error: ${res.status}`);
  return res.json();
}

export async function unmuteUser(signerUuid: string, targetFid: number) {
  const res = await fetch(`${NEYNAR_BASE}/mute`, {
    method: 'DELETE',
    headers: headers(),
    body: JSON.stringify({ signer_uuid: signerUuid, target_fid: targetFid }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar unmute error: ${res.status}`);
  return res.json();
}

export async function blockUser(signerUuid: string, targetFid: number) {
  const res = await fetch(`${NEYNAR_BASE}/block`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ signer_uuid: signerUuid, target_fid: targetFid }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar block error: ${res.status}`);
  return res.json();
}

export async function unblockUser(signerUuid: string, targetFid: number) {
  const res = await fetch(`${NEYNAR_BASE}/block`, {
    method: 'DELETE',
    headers: headers(),
    body: JSON.stringify({ signer_uuid: signerUuid, target_fid: targetFid }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar unblock error: ${res.status}`);
  return res.json();
}

export async function getMuteList(fid: number, limit = 100, cursor?: string) {
  const params = new URLSearchParams({
    fid: String(fid),
    limit: String(limit),
  });
  if (cursor) params.set('cursor', cursor);
  const res = await fetch(`${NEYNAR_BASE}/mute/list?${params}`, {
    headers: headers(),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Neynar mute list error ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

export async function getStorageUsage(fid: number) {
  const params = new URLSearchParams({ fid: String(fid) });
  const res = await fetchWithFailover(`/storage/usage?${params}`, {
    headers: readHeaders(),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Neynar storage usage error ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

export async function deleteCast(signerUuid: string, castHash: string) {
  const res = await fetch(`${NEYNAR_BASE}/cast`, {
    method: 'DELETE',
    headers: headers(),
    body: JSON.stringify({ signer_uuid: signerUuid, target_hash: castHash }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar delete cast error: ${res.status}`);
  return res.json();
}

/**
 * Conversation summary goes straight to Neynar. Hypersnap answers this path
 * with HTTP 200 and a placeholder ("Conversation summaries require LLM
 * integration which is not available on this node."), so fetchWithFailover
 * would return the placeholder as the summary (doc 2418 D3).
 */
export async function getCastConversationSummary(castHash: string) {
  const params = new URLSearchParams({ identifier: castHash, type: 'hash' });
  const res = await fetch(`${NEYNAR_BASE}/cast/conversation/summary?${params}`, {
    headers: headers(),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Neynar cast conversation summary error ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

export async function getPopularCasts(fid: number) {
  const res = await fetchWithFailover(`/feed/user/popular?fid=${fid}`, {
    headers: readHeaders(),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar popular casts error: ${res.status}`);
  return res.json();
}

export async function getBestFriends(fid: number, limit = 10) {
  const params = new URLSearchParams({ fid: String(fid), limit: String(limit) });
  const res = await fetchWithFailover(`/user/best_friends?${params}`, {
    headers: readHeaders(),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar best friends error: ${res.status}`);
  return res.json();
}

export async function getTrendingTopics(limit = 10) {
  const params = new URLSearchParams({ limit: String(limit) });
  const res = await fetchWithFailover(`/topic/trending?${params}`, {
    headers: readHeaders(),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar trending topics error: ${res.status}`);
  return res.json();
}

export async function getAccountVerifications(fid: number) {
  const res = await fetch(`https://api.farcaster.xyz/fc/account-verifications?fid=${fid}`, {
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Farcaster verifications error: ${res.status}`);
  return res.json();
}

export async function getFollowSuggestions(fid: number, limit = 20) {
  const params = new URLSearchParams({ fid: String(fid), limit: String(limit) });
  const res = await fetchWithFailover(`/following/suggested?${params}`, {
    headers: readHeaders(),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar follow suggestions error: ${res.status}`);
  return res.json();
}

export async function getFrameCatalog(limit = 20, cursor?: string) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set('cursor', cursor);
  const res = await fetchWithFailover(`/frame/catalog?${params}`, {
    headers: readHeaders(),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar frame catalog error: ${res.status}`);
  return res.json();
}

export async function searchFrames(query: string, limit = 20) {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  const res = await fetchWithFailover(`/frame/search?${params}`, {
    headers: readHeaders(),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar frame search error: ${res.status}`);
  return res.json();
}

export async function getRelevantFrames(fid: number, limit = 20) {
  const params = new URLSearchParams({ fid: String(fid), limit: String(limit) });
  const res = await fetchWithFailover(`/frame/relevant?${params}`, {
    headers: readHeaders(),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar relevant frames error: ${res.status}`);
  return res.json();
}

/**
 * Read through the seam from a route: READ_BASE first, Neynar on failover.
 * Only for calls whose fields the read base serves. Hypersnap omits
 * `viewer_context`, `power_badge` and a cast's `root_parent_url`, and returns
 * followers/following as flat users, so check the fields a caller reads first
 * (doc 2418 D6 PR 3).
 */
export function neynarRead(path: string, init: RequestInit = {}): Promise<Response> {
  return fetchWithFailover(path, { ...init, headers: readHeaders() });
}
