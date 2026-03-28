/**
 * OpenRank API client — free, no auth required
 * Docs: https://docs.openrank.com/integrations/farcaster
 *
 * All functions are fault-tolerant: they return empty results on failure
 * so that OpenRank downtime never blocks the page.
 */

const OPENRANK_BASE = 'https://graph.cast.k3l.io';
const TIMEOUT_MS = 5_000;

export interface OpenRankScore {
  fid: number;
  fname: string;
  username: string;
  rank: number;
  score: number;
  percentile: number;
}

/** Fetch with a hard timeout so OpenRank latency never stalls the app. */
async function fetchWithTimeout(
  url: string,
  init?: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Get global engagement scores for a list of FIDs.
 * Returns a Map<fid, score> for easy lookup.
 */
export async function getEngagementScores(
  fids: number[]
): Promise<Map<number, number>> {
  if (fids.length === 0) return new Map();

  try {
    const res = await fetchWithTimeout(`${OPENRANK_BASE}/scores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fids),
    });

    if (!res.ok) {
      console.error(`OpenRank engagement scores failed: ${res.status}`);
      return new Map();
    }

    const data = await res.json();
    const result = data?.result;
    if (!Array.isArray(result)) return new Map();

    const map = new Map<number, number>();
    for (const entry of result) {
      if (typeof entry.fid === 'number' && typeof entry.score === 'number') {
        map.set(entry.fid, entry.score);
      }
    }
    return map;
  } catch (err) {
    console.error('OpenRank engagement scores error:', err);
    return new Map();
  }
}

/**
 * Get personalized rankings relative to a specific user.
 * Returns a Map<fid, score> of personalized engagement scores.
 */
export async function getPersonalizedScores(
  fid: number,
  targetFids: number[]
): Promise<Map<number, number>> {
  if (targetFids.length === 0) return new Map();

  try {
    const res = await fetchWithTimeout(
      `${OPENRANK_BASE}/scores/personalized/${fid}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(targetFids),
      }
    );

    if (!res.ok) {
      console.error(`OpenRank personalized scores failed: ${res.status}`);
      return new Map();
    }

    const data = await res.json();
    const result = data?.result;
    if (!Array.isArray(result)) return new Map();

    const map = new Map<number, number>();
    for (const entry of result) {
      if (typeof entry.fid === 'number' && typeof entry.score === 'number') {
        map.set(entry.fid, entry.score);
      }
    }
    return map;
  } catch (err) {
    console.error('OpenRank personalized scores error:', err);
    return new Map();
  }
}

/**
 * Get top users in a specific Farcaster channel.
 * Returns an array of OpenRankScore objects.
 */
export async function getChannelRankings(
  channelId: string,
  limit: number = 25
): Promise<OpenRankScore[]> {
  try {
    const url = `${OPENRANK_BASE}/channels/rankings/${channelId}?limit=${limit}`;
    const res = await fetchWithTimeout(url);

    if (!res.ok) {
      console.error(`OpenRank channel rankings failed: ${res.status}`);
      return [];
    }

    const data = await res.json();
    const result = data?.result;
    if (!Array.isArray(result)) return [];

    return result.map((entry: Record<string, unknown>) => ({
      fid: Number(entry.fid) || 0,
      fname: String(entry.fname || ''),
      username: String(entry.username || entry.fname || ''),
      rank: Number(entry.rank) || 0,
      score: Number(entry.score) || 0,
      percentile: Number(entry.percentile) || 0,
    }));
  } catch (err) {
    console.error('OpenRank channel rankings error:', err);
    return [];
  }
}
