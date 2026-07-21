/**
 * Reputation Grid - the first of ZAO's domain grids (Brandon's "Brains" layer).
 *
 * Instead of generic AI memory, a grid is a domain-scoped, queryable view over
 * data ZAO already holds. This one answers "who is this person, and how much has
 * the community earned reason to trust them?" - the DreamNet chain
 * Identity -> Respect -> Wins -> Collaborations -> Receipts -> Community trust.
 *
 * v1 sources the SOLID part (on-chain Respect via the existing leaderboard) and
 * declares the rest of the chain as typed fields wired to real tables next
 * (battles: wavewarz_artists, fractal: fractal_scores, receipts: DreamNet
 * receipts once that schema lands). Every profile is honest about what is
 * sourced vs pending, so nothing is fabricated.
 *
 * This is the pattern the other grids (Creator, Event, Sponsor, Battle) copy:
 * a typed profile + one assembly function over existing data + a query seam.
 */

import { fetchLeaderboard, type RespectEntry } from '../respect/leaderboard';

export interface ReputationIdentity {
  name: string;
  wallet: string | null;
  fid: number | null;
  username: string | null;
  zid: number | null;
}

export interface ReputationRespect {
  og: number;
  zor: number;
  total: number;
  /** 1-based rank on the Respect leaderboard, or null if unranked. */
  rank: number | null;
  /** 0-100 percentile among ranked members (100 = top). */
  percentile: number | null;
  /** First on-chain Respect receipt - a longevity signal. */
  firstTokenDate: string | null;
}

/** A field that is part of the Reputation chain but not yet sourced from a table. */
export interface PendingSource {
  sourced: false;
  /** Where this will come from once wired. */
  plannedSource: string;
}

export interface ReputationTrust {
  /** v1 composite heuristic, 0-100. NOT an on-chain or governance figure. */
  score: number;
  /** The signals that fed the score, for transparency. */
  signals: string[];
  basis: string;
}

export interface ReputationProfile {
  identity: ReputationIdentity;
  respect: ReputationRespect;
  /** Battle record (wins/losses/win-rate). Wired to wavewarz_artists next. */
  battles: PendingSource;
  /** Collaboration graph. Wired next. */
  collaborations: PendingSource;
  /** DreamNet receipts (append-only proof chain). Wired when the schema lands. */
  receipts: PendingSource;
  trust: ReputationTrust;
  /** Whether we resolved a real member for the query, or returned an empty shell. */
  found: boolean;
}

/**
 * Compute a v1 trust heuristic from what is actually sourced. Deliberately
 * simple and transparent - it is a starting signal, not a governance verdict.
 * Weighted: respect percentile (community-weighted standing) + a small
 * longevity bonus for holding Respect for a while.
 */
function computeTrust(entry: RespectEntry, percentile: number | null): ReputationTrust {
  const signals: string[] = [];
  let score = 0;

  if (percentile !== null) {
    score += percentile * 0.8;
    signals.push(`respect percentile ${percentile.toFixed(0)}`);
  }
  if (entry.firstTokenDate) {
    const ageDays = (Date.now() - new Date(entry.firstTokenDate).getTime()) / 86_400_000;
    if (Number.isFinite(ageDays) && ageDays > 0) {
      const longevity = Math.min(20, (ageDays / 365) * 20); // up to +20 over a year
      score += longevity;
      signals.push(`held respect ${Math.floor(ageDays)}d`);
    }
  }

  return {
    score: Math.round(Math.min(100, score) * 10) / 10,
    signals: signals.length ? signals : ['no reputation signals yet'],
    basis: 'v1 heuristic: respect percentile (0.8) + longevity (up to +20). Battles/receipts not yet weighted.',
  };
}

const PENDING = (plannedSource: string): PendingSource => ({ sourced: false, plannedSource });

function matchesIdentifier(entry: RespectEntry, id: string): boolean {
  const q = id.trim().toLowerCase();
  if (!q) return false;
  return (
    entry.name.toLowerCase() === q ||
    (entry.username?.toLowerCase() === q) ||
    (entry.wallet.toLowerCase() === q) ||
    (entry.fid !== null && String(entry.fid) === q) ||
    (entry.zid !== null && String(entry.zid) === q) ||
    // loose contains on name so "who is jango" style lookups resolve
    entry.name.toLowerCase().includes(q)
  );
}

/**
 * Assemble a member's Reputation Grid profile.
 *
 * @param identifier - a name, username, wallet, fid, or zid.
 * @returns the profile; `found: false` with an empty respect block if unresolved.
 */
export async function getReputationProfile(identifier: string): Promise<ReputationProfile> {
  const { leaderboard } = await fetchLeaderboard();
  const ranked = leaderboard.length;

  // exact matches first, then a loose contains fallback
  const entry =
    leaderboard.find((e) => matchesIdentifier(e, identifier)) ?? null;

  if (!entry) {
    return {
      identity: { name: identifier, wallet: null, fid: null, username: null, zid: null },
      respect: { og: 0, zor: 0, total: 0, rank: null, percentile: null, firstTokenDate: null },
      battles: PENDING('wavewarz_artists'),
      collaborations: PENDING('collaboration graph (members + credits)'),
      receipts: PENDING('DreamNet receipts (proof chain)'),
      trust: { score: 0, signals: ['member not found on the Respect leaderboard'], basis: 'unresolved' },
      found: false,
    };
  }

  const percentile = ranked > 1 ? Math.round(((ranked - entry.rank) / (ranked - 1)) * 100) : 100;

  return {
    identity: {
      name: entry.name,
      wallet: entry.wallet,
      fid: entry.fid,
      username: entry.username,
      zid: entry.zid,
    },
    respect: {
      og: entry.ogRespect,
      zor: entry.zorRespect,
      total: entry.totalRespect,
      rank: entry.rank,
      percentile,
      firstTokenDate: entry.firstTokenDate,
    },
    battles: PENDING('wavewarz_artists'),
    collaborations: PENDING('collaboration graph (members + credits)'),
    receipts: PENDING('DreamNet receipts (proof chain)'),
    trust: computeTrust(entry, percentile),
    found: true,
  };
}
