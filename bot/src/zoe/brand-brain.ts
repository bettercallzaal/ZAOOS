/**
 * brand-brain.ts - ICM box fetching and caching for brand-specific ZOE personas.
 *
 * When Zaal posts a message in a brand topic (e.g. WaveWarZ, ZABAL Games), ZOE
 * responds in-character by loading the brand's context from useicm.com and
 * injecting it into the turn's system prompt.
 *
 * This is "one engine, many masks" (doc 1021): a single ZOE instance with
 * swappable brand personas, not a separate bot per brand.
 */

/**
 * Registry mapping topic names to ICM box IDs. Each brand has a useicm.com
 * box containing its AI-readable context (voice, values, operations, etc).
 *
 * To add a brand: useicm.com/api/objects?type=box&q=<brandName>, create a box,
 * capture the returned box_id (icm_...), add an entry here.
 */
const BRAND_BRAINS: Record<string, string> = {
  'ZABAL Games': 'icm_PiCDHNNZ3WZpNoF59OA8Dw',
  // 'WaveWarZ': 'icm_...' (TODO: confirm ICM box id),
};

/**
 * In-memory cache for fetched ICM brain text. Keyed by box ID.
 * Each entry: { text: string, fetchedAt: number }
 * TTL: 10 minutes.
 */
const brainCache: Map<string, { text: string; fetchedAt: number }> = new Map();
const BRAIN_CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * Get the ICM box ID for a topic, if registered. Returns undefined for
 * unknown or unregistered topics (they fall back to default behavior).
 */
export function brandBoxFor(topicName?: string): string | undefined {
  if (!topicName) return undefined;
  return BRAND_BRAINS[topicName];
}

/**
 * Fetch the ICM brain text for a given box ID. Uses in-memory cache
 * (10 min TTL) to avoid repeated API calls. Best-effort: returns null
 * on any network error, timeout, or invalid response.
 */
export async function fetchIcmBrain(boxId: string): Promise<string | null> {
  // Check cache.
  const cached = brainCache.get(boxId);
  if (cached && Date.now() - cached.fetchedAt < BRAIN_CACHE_TTL_MS) {
    return cached.text;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(`https://useicm.com/api/objects/${boxId}/llm.txt`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ZOE/1.0)',
        Origin: 'https://thezao.xyz',
        Referer: 'https://thezao.xyz/',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[zoe/brand-brain] ICM fetch failed: ${boxId} ${response.status}`);
      return null;
    }

    const text = await response.text();
    if (!text || text.length === 0) {
      console.warn(`[zoe/brand-brain] ICM box empty: ${boxId}`);
      return null;
    }

    // Cache the result.
    brainCache.set(boxId, { text, fetchedAt: Date.now() });
    return text;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('Abort')) {
      console.warn(`[zoe/brand-brain] ICM fetch timeout: ${boxId}`);
    } else {
      console.warn(`[zoe/brand-brain] ICM fetch failed: ${boxId} - ${msg}`);
    }
    return null;
  }
}

/**
 * Build a system preamble that instructs ZOE to respond as a brand.
 * Wraps the brand's ICM context (brain text) with instructions to stay
 * in character and use only that context as ground truth.
 */
export function brandSystemPreamble(brandText: string, topicName: string): string {
  return (
    `<brand_context>` +
    `\nYou are answering as ${topicName} for The ZAO. Speak in this brand's voice and use ONLY the following brand context as ground truth:` +
    `\n\n${brandText}` +
    `\n\nStay in character. If asked about something outside this brand's scope, say so briefly and offer to route it elsewhere.` +
    `\n</brand_context>`
  );
}

/**
 * Reset the in-memory brain cache. Used in tests to ensure fresh fetches
 * between test cases. Not called in production.
 */
export function _resetBrainCache(): void {
  brainCache.clear();
}
