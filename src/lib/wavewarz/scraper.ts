import { logger } from '@/lib/logger';
import { parseWaveWarzArtistPage } from '@/lib/scrape/wavewarz';
import { INTELLIGENCE_BASE } from './constants';

export interface ArtistStats {
  name: string;
  wallet: string;
  wins: number;
  losses: number;
  battlesCount: number;
  totalVolumeSol: number;
  careerEarningsSol: number;
  lastBattleId: string | null;
}

/**
 * Fetch and parse an artist's stats from WaveWarZ Intelligence.
 *
 * The Intelligence site is an App-Router (RSC) Next.js app with no public JSON
 * API; stats live in the React flight payload. Parsing is delegated to
 * src/lib/scrape/wavewarz.ts, which extracts the values from the flight tree and
 * validates them with Zod. Unlike the previous regex (which silently returned 0
 * for every artist), a parse failure is logged with a reason and returns null so
 * the caller can count it as failed rather than store bad zeros.
 */
export async function scrapeArtistStats(wallet: string): Promise<ArtistStats | null> {
  try {
    const res = await fetch(`${INTELLIGENCE_BASE}/artist/${wallet}`, {
      headers: { 'User-Agent': 'ZAO-OS-Sync/1.0' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      logger.warn(`[wavewarz-scraper] ${wallet} returned HTTP ${res.status}`);
      return null;
    }

    const html = await res.text();
    const result = parseWaveWarzArtistPage(html, wallet);
    if (!result.ok) {
      logger.warn(`[wavewarz-scraper] ${wallet} parse failed: ${result.reason}`);
      return null;
    }

    const { name, wins, losses, battlesCount, totalVolumeSol, careerEarningsSol } = result.data;
    return {
      name,
      wallet,
      wins,
      losses,
      battlesCount,
      totalVolumeSol,
      careerEarningsSol,
      lastBattleId: null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown error';
    logger.error(`[wavewarz-scraper] Failed to scrape ${wallet}: ${message}`);
    return null;
  }
}
