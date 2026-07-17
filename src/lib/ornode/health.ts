// src/lib/ornode/health.ts
// Lightweight health-check for the ornode2.frapps.xyz ORDAO backend.
//
// ornode has been down 6+ weeks (doc 1068). The proposals API already falls
// back to direct on-chain reads via src/lib/ordao/client.ts. This module lets
// callers and UI surfaces know the outage is ongoing without a 5s timeout
// blocking every request: we check once per TTL and cache the result.

const ORNODE_BASE = 'https://ornode2.frapps.xyz';
const HEALTH_TTL_MS = 2 * 60 * 1000; // re-check every 2 minutes
const CHECK_TIMEOUT_MS = 3_000;

interface CacheEntry {
  healthy: boolean;
  checkedAt: number;
}

let _cache: CacheEntry | null = null;

/**
 * Returns true if ornode is reachable and responding, false otherwise.
 * Uses a 2-minute in-process cache so this doesn't add latency to every request.
 *
 * Checks GET /proposals?limit=1 — if ornode serves any response (even 404)
 * it counts as up; only connection failure or timeout counts as down.
 */
export async function checkOrnodeHealth(): Promise<boolean> {
  if (_cache && Date.now() - _cache.checkedAt < HEALTH_TTL_MS) {
    return _cache.healthy;
  }

  let healthy = false;
  try {
    const res = await fetch(`${ORNODE_BASE}/proposals?limit=1`, {
      method: 'GET',
      signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
      next: { revalidate: 0 },
    });
    // Any HTTP response (incl. 4xx/5xx) = server is up
    healthy = res.status < 600;
  } catch {
    healthy = false;
  }

  _cache = { healthy, checkedAt: Date.now() };
  return healthy;
}

/**
 * Reset the health cache — useful in tests or after a known ornode restart.
 */
export function resetOrnodeHealthCache(): void {
  _cache = null;
}
