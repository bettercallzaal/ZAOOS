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
 * The page is a Next.js SSR page — stats are in the initial HTML payload.
 */
export async function scrapeArtistStats(wallet: string): Promise<ArtistStats | null> {
  try {
    const res = await fetch(`${INTELLIGENCE_BASE}/artist/${wallet}`, {
      headers: { 'User-Agent': 'ZAO-OS-Sync/1.0' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;

    const html = await res.text();

    // Extract artist name from page title or heading
    const nameMatch = html.match(/<(?:h1|h2|title)[^>]*>([^<]+)/i);
    const name = nameMatch?.[1]?.replace(/ \| WaveWarZ.*/, '').trim() || 'Unknown';

    // Parse stats from Next.js hydration payload or visible text
    const winsMatch = html.match(/(?:Wins|wins)[:\s]*(\d+)/);
    const lossesMatch = html.match(/(?:Losses|losses)[:\s]*(\d+)/);
    const volumeMatch = html.match(/(?:Total Volume|volume)[:\s]*([\d.]+)\s*SOL/i);
    const earningsMatch = html.match(/(?:Career Earnings|earnings)[:\s]*([\d.]+)\s*SOL/i);

    const wins = winsMatch ? parseInt(winsMatch[1], 10) : 0;
    const losses = lossesMatch ? parseInt(lossesMatch[1], 10) : 0;

    return {
      name,
      wallet,
      wins,
      losses,
      battlesCount: wins + losses,
      totalVolumeSol: volumeMatch ? parseFloat(volumeMatch[1]) : 0,
      careerEarningsSol: earningsMatch ? parseFloat(earningsMatch[1]) : 0,
      lastBattleId: null,
    };
  } catch (err) {
    console.error(`[wavewarz-scraper] Failed to scrape ${wallet}:`, err);
    return null;
  }
}
