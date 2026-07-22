/**
 * Battle Grid - the third of ZAO's domain grids (Brandon's "Brains" layer).
 *
 * Instead of generic AI memory, a grid is a domain-scoped, queryable view over
 * data ZAO already holds. This one answers "what is this artist's battle
 * intelligence?" - best rivals, win-loss record, total volume, form, and
 * arena performance signals for WaveWarZ matchups.
 *
 * v1 sources the SOLID part: battle record (wins/losses/win-rate computed from
 * real rows), head-to-head rivals (matched pairs from wavewarz_battle_log),
 * and total trading volume from wavewarz_artists. Declares the not-yet-sourced
 * signals (genre, audience overlap, streaming growth, venue success, promotion
 * effectiveness) as typed PendingSource fields wired next. Every profile is
 * honest about what is sourced vs pending, so nothing is fabricated.
 *
 * This follows the Reputation + Event Grid pattern: a typed profile + one
 * assembly function over existing data + a query seam.
 */

import { getSupabaseAdmin } from '@/lib/db/supabase';

// ============================================================================
// Types
// ============================================================================

export interface BattleIdentity {
  name: string;
  solanaWallet: string | null;
  zaoFid: number | null;
}

/**
 * Battle record: wins, losses, win rate, all computed from actual battle_log rows.
 * Head-to-head rivals extracted from opponent pairing history.
 */
export interface BattleRecord {
  wins: number;
  losses: number;
  /** 0-100 percentage, or null if no battles yet. */
  winRate: number | null;
  battlesCount: number;
  totalVolumeSol: number;
  careerEarningsSol: number;
}

/**
 * A rival in head-to-head history: their name, how many times they've faced,
 * and the win-loss record in that specific pairing.
 */
export interface HeadToHeadRival {
  rivalName: string;
  encounters: number;
  winsVsRival: number;
  lossesVsRival: number;
  /** 0-100 win rate in this specific pairing, or null if 0 battles. */
  headToHeadWinRate: number | null;
}

export interface BattleRivals {
  /** All head-to-head rivals, sorted by encounter count (most frequent first). */
  rivals: HeadToHeadRival[];
  /** The rival with the most encounters, or null if no battles. */
  primaryRival: HeadToHeadRival | null;
}

/** A field that is part of the Battle intelligence but not yet sourced from a table. */
export interface PendingSource {
  sourced: false;
  /** Where this will come from once wired. */
  plannedSource: string;
}

export interface BattleProfile {
  identity: BattleIdentity;
  record: BattleRecord;
  rivals: BattleRivals;
  /** Genre classification. Wired to music metadata / streaming platforms next. */
  genre: PendingSource;
  /** Audience overlap with other artists. Wired next. */
  audienceOverlap: PendingSource;
  /** Streaming growth rate. Wired to Audius / Spotify API next. */
  streamingGrowth: PendingSource;
  /** Venue/platform success rate. Wired next. */
  venueSuccess: PendingSource;
  /** Promotion effectiveness signals. Wired next. */
  promotionEffectiveness: PendingSource;
  /** Whether we resolved a real artist for the query, or returned an empty shell. */
  found: boolean;
}

// ============================================================================
// Data Assembly
// ============================================================================

const PENDING = (plannedSource: string): PendingSource => ({ sourced: false, plannedSource });

interface ArtistRow {
  name: string;
  solana_wallet: string | null;
  zao_fid: number | null;
  wins: number;
  losses: number;
  battles_count: number;
  total_volume_sol: number;
  career_earnings_sol: number;
}

interface BattleLogRow {
  artist_a: string;
  artist_b: string;
  winner: string | null;
}

/**
 * Compute head-to-head record between a primary artist and a rival across all battles.
 * Returns { winsVsRival, lossesVsRival } only for battles where the outcome is known.
 */
function computeHeadToHeadRecord(
  artist: string,
  rival: string,
  battles: BattleLogRow[],
): { winsVsRival: number; lossesVsRival: number } {
  let winsVsRival = 0;
  let lossesVsRival = 0;

  for (const b of battles) {
    // Only count settled battles (winner is not null)
    if (!b.winner) continue;

    // Check if this battle involves both the artist and rival
    const isArtistA = b.artist_a === artist;
    const isArtistB = b.artist_b === artist;
    const isRivalA = b.artist_a === rival;
    const isRivalB = b.artist_b === rival;

    if ((isArtistA || isArtistB) && (isRivalA || isRivalB)) {
      // This is a head-to-head battle
      if (b.winner === artist) {
        winsVsRival++;
      } else if (b.winner === rival) {
        lossesVsRival++;
      }
    }
  }

  return { winsVsRival, lossesVsRival };
}

/**
 * Assemble an artist's Battle Grid profile.
 *
 * @param artistName - the artist name to look up
 * @returns the profile; `found: false` with zero record if unresolved.
 */
export async function getBattleProfile(artistName: string): Promise<BattleProfile> {
  const supabase = getSupabaseAdmin();
  const trimmedName = artistName.trim();

  if (!trimmedName) {
    return {
      identity: { name: artistName, solanaWallet: null, zaoFid: null },
      record: { wins: 0, losses: 0, winRate: null, battlesCount: 0, totalVolumeSol: 0, careerEarningsSol: 0 },
      rivals: { rivals: [], primaryRival: null },
      genre: PENDING('music metadata / streaming platforms'),
      audienceOverlap: PENDING('cross-artist audience data'),
      streamingGrowth: PENDING('Audius / Spotify API'),
      venueSuccess: PENDING('venue performance metrics'),
      promotionEffectiveness: PENDING('promotion analytics'),
      found: false,
    };
  }

  // Query the artist from wavewarz_artists
  const { data: artist, error: artistError } = await supabase
    .from('wavewarz_artists')
    .select('*')
    .ilike('name', trimmedName)
    .maybeSingle();

  if (artistError || !artist) {
    return {
      identity: { name: trimmedName, solanaWallet: null, zaoFid: null },
      record: { wins: 0, losses: 0, winRate: null, battlesCount: 0, totalVolumeSol: 0, careerEarningsSol: 0 },
      rivals: { rivals: [], primaryRival: null },
      genre: PENDING('music metadata / streaming platforms'),
      audienceOverlap: PENDING('cross-artist audience data'),
      streamingGrowth: PENDING('Audius / Spotify API'),
      venueSuccess: PENDING('venue performance metrics'),
      promotionEffectiveness: PENDING('promotion analytics'),
      found: false,
    };
  }

  const artistRecord = artist as ArtistRow;

  // Compute win rate
  const battlesCount = artistRecord.battles_count ?? 0;
  let winRate: number | null = null;
  if (battlesCount > 0) {
    winRate = Math.round((artistRecord.wins / battlesCount) * 100);
  }

  // Fetch all battles involving this artist to compute head-to-head records
  const { data: allBattles, error: battlesError } = await supabase
    .from('wavewarz_battle_log')
    .select('artist_a, artist_b, winner')
    .or(`artist_a.ilike.${trimmedName},artist_b.ilike.${trimmedName}`);

  const battleRows = (battlesError ? [] : allBattles ?? []) as BattleLogRow[];

  // Extract all unique rivals from the battles
  const rivalSet = new Set<string>();
  for (const b of battleRows) {
    if (b.artist_a === artistRecord.name) {
      rivalSet.add(b.artist_b);
    } else if (b.artist_b === artistRecord.name) {
      rivalSet.add(b.artist_a);
    }
  }

  // Build head-to-head records for each rival
  const rivalsList: HeadToHeadRival[] = [];

  for (const rivalName of rivalSet) {
    const encounters = battleRows.filter(
      (b) =>
        (b.artist_a === artistRecord.name && b.artist_b === rivalName) ||
        (b.artist_b === artistRecord.name && b.artist_a === rivalName),
    ).length;

    if (encounters === 0) continue;

    const { winsVsRival, lossesVsRival } = computeHeadToHeadRecord(
      artistRecord.name,
      rivalName,
      battleRows,
    );

    let headToHeadWinRate: number | null = null;
    const headToHeadTotal = winsVsRival + lossesVsRival;
    if (headToHeadTotal > 0) {
      headToHeadWinRate = Math.round((winsVsRival / headToHeadTotal) * 100);
    }

    rivalsList.push({
      rivalName,
      encounters,
      winsVsRival,
      lossesVsRival,
      headToHeadWinRate,
    });
  }

  // Sort by encounter count (most frequent first)
  rivalsList.sort((a, b) => b.encounters - a.encounters);

  const primaryRival = rivalsList.length > 0 ? rivalsList[0] : null;

  return {
    identity: {
      name: artistRecord.name,
      solanaWallet: artistRecord.solana_wallet,
      zaoFid: artistRecord.zao_fid,
    },
    record: {
      wins: artistRecord.wins,
      losses: artistRecord.losses,
      winRate,
      battlesCount,
      totalVolumeSol: Number(artistRecord.total_volume_sol) || 0,
      careerEarningsSol: Number(artistRecord.career_earnings_sol) || 0,
    },
    rivals: {
      rivals: rivalsList,
      primaryRival,
    },
    genre: PENDING('music metadata / streaming platforms'),
    audienceOverlap: PENDING('cross-artist audience data'),
    streamingGrowth: PENDING('Audius / Spotify API'),
    venueSuccess: PENDING('venue performance metrics'),
    promotionEffectiveness: PENDING('promotion analytics'),
    found: true,
  };
}
