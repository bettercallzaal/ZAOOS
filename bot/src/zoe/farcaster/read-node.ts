/**
 * Hypersnap read client (doc 761, Phase 0/2).
 *
 * The self-hosted Hypersnap node exposes a Neynar v2-compatible HTTP API on :3381 and is
 * READ-ONLY (it cannot post). This client wraps reads with a two-tier failover so a node
 * blip never takes us down (pattern from the HAATZ doc - haatz first, Neynar fallback; here
 * the self-hosted node is tier 1):
 *
 *   tier 1: FARCASTER_READ_API_BASE  (self-hosted Hypersnap node :3381) - free, primary
 *   tier 2: FARCASTER_READ_FALLBACK_BASE (haatz.quilibrium.com or Neynar) - on timeout/error
 *
 * Reads only. Writes go through farcaster/write.ts to a write-enabled endpoint.
 */

const PRIMARY = () => process.env.FARCASTER_READ_API_BASE?.replace(/\/$/, '');
const FALLBACK = () =>
  (process.env.FARCASTER_READ_FALLBACK_BASE ?? 'https://haatz.quilibrium.com').replace(/\/$/, '');
const TIMEOUT_MS = () => Number(process.env.FARCASTER_READ_TIMEOUT_MS ?? 5000);

async function fetchJson(base: string, path: string): Promise<unknown> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS());
  try {
    const headers: Record<string, string> = { accept: 'application/json' };
    // Neynar fallback needs an api key; the self-hosted node + haatz do not.
    if (base.includes('neynar') && process.env.NEYNAR_API_KEY) {
      headers['x-api-key'] = process.env.NEYNAR_API_KEY;
    }
    const res = await fetch(`${base}${path}`, { signal: controller.signal, headers });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

/**
 * GET a Neynar v2-compatible path (e.g. `/v2/farcaster/feed?fid=1`) with failover.
 * Tries the primary (self-hosted node); on any error/timeout falls back to tier 2.
 */
export async function readV2(path: string): Promise<unknown> {
  const primary = PRIMARY();
  if (primary) {
    try {
      return await fetchJson(primary, path);
    } catch (e) {
      console.warn(`[farcaster/read] primary failed (${(e as Error).message}), failing over`);
    }
  }
  return fetchJson(FALLBACK(), path);
}

/** Node /v1/info - used to confirm sync (maxHeight rising, blockDelay < 100). */
export async function nodeInfo(): Promise<{ maxHeight?: number; blockDelay?: number; [k: string]: unknown }> {
  const primary = PRIMARY();
  if (!primary) throw new Error('FARCASTER_READ_API_BASE not set');
  return (await fetchJson(primary, '/v1/info')) as { maxHeight?: number; blockDelay?: number };
}

/** Convenience: recent casts by a FID via the v1 hub API on the node. */
export async function castsByFid(fid: number, pageSize = 10): Promise<unknown> {
  return readV2(`/v1/castsByFid?fid=${fid}&pageSize=${pageSize}&reverse=1`);
}
