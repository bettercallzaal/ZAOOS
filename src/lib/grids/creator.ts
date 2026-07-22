/**
 * Creator Grid - the fourth of ZAO's domain grids (Brandon's "Brains" layer).
 *
 * Instead of generic AI memory, a grid is a domain-scoped, queryable view over
 * data ZAO already holds. This one answers "persistent knowledge about artists,
 * collaborators, labels, producers, venues" - who they are, their roles, their
 * collaborators, their body of work.
 *
 * v1 sources the SOLID part (member identity from users table, artist profile
 * from wavewarz_artists, body of work from song_submissions and battles).
 * Declares the not-yet-sourced fields (collaborators, labels, producers, venues)
 * as typed PendingSource fields wired next. Every profile is honest about what
 * is sourced vs pending, so nothing is fabricated.
 *
 * This follows the Reputation + Event + Battle Grid pattern: a typed profile +
 * one assembly function over existing data + a query seam.
 */

import { getSupabaseAdmin } from '@/lib/db/supabase';

// ============================================================================
// Types
// ============================================================================

export interface CreatorIdentity {
  name: string;
  primaryWallet: string | null;
  solanaBattleWallet: string | null;
  /** Farcaster ID if they're a ZAO member. */
  fid: number | null;
  /** ZAO ID if they're a ZAO member. */
  zid: number | null;
  /** Farcaster username if they're a ZAO member. */
  username: string | null;
}

export type CreatorRole = 'member' | 'artist' | 'producer' | 'curator' | 'organizer';

export interface CreatorRoles {
  /** Roles this creator has in the ZAO ecosystem. */
  roles: CreatorRole[];
}

/**
 * A piece of work or participation: song submission, battle, event appearance.
 */
export interface CreatorWork {
  id: string;
  title: string;
  type: 'submission' | 'battle' | 'event';
  /** When this work happened or was created. */
  occurredAt: string | null;
  /** Link to the work (song URL, battle proof, event page). */
  url: string | null;
}

export interface CreatorBodyOfWork {
  /** Song submissions by this creator. */
  submissions: CreatorWork[];
  /** Battles this artist has participated in (WaveWarZ). */
  battles: CreatorWork[];
  /** Events this creator has participated in or organized. */
  events: CreatorWork[];
}

/** A field that is part of the Creator intelligence but not yet sourced from a table. */
export interface PendingSource {
  sourced: false;
  /** Where this will come from once wired. */
  plannedSource: string;
}

export interface CreatorProfile {
  identity: CreatorIdentity;
  roles: CreatorRoles;
  bodyOfWork: CreatorBodyOfWork;
  /** Collaborators and co-creators. Wired to collaboration graph next. */
  collaborators: PendingSource;
  /** Record labels or releases. Wired to music metadata next. */
  labels: PendingSource;
  /** Producer credits. Wired to song metadata next. */
  producers: PendingSource;
  /** Venue/platform performance history. Wired next. */
  venues: PendingSource;
  /** Whether we resolved a real creator for the query, or returned an empty shell. */
  found: boolean;
}

// ============================================================================
// Data Assembly
// ============================================================================

const PENDING = (plannedSource: string): PendingSource => ({ sourced: false, plannedSource });

interface UserRow {
  id: string;
  display_name: string | null;
  ign: string | null;
  real_name: string | null;
  primary_wallet: string | null;
  fid: number | null;
  username: string | null;
  zid: number | null;
}

interface ArtistRow {
  name: string;
  solana_wallet: string | null;
  zao_fid: number | null;
}

interface SongSubmissionRow {
  id: string;
  title: string;
  artist: string | null;
  submitted_by_username: string | null;
  created_at: string;
  url: string | null;
}

interface BattleLogRow {
  id: string;
  artist_a: string;
  artist_b: string;
  settled_at: string | null;
}

interface EventRow {
  id: string;
  title: string;
  starts_at: string | null;
}

/**
 * Assemble a creator's profile by identifier (name, username, wallet, fid, zid).
 *
 * @param identifier - a name, username, wallet, fid, or zid
 * @returns the profile; `found: false` with empty work if unresolved
 */
export async function getCreatorProfile(identifier: string): Promise<CreatorProfile> {
  const supabase = getSupabaseAdmin();
  const trimmedId = identifier.trim();

  if (!trimmedId) {
    return {
      identity: {
        name: identifier,
        primaryWallet: null,
        solanaBattleWallet: null,
        fid: null,
        zid: null,
        username: null,
      },
      roles: { roles: [] },
      bodyOfWork: { submissions: [], battles: [], events: [] },
      collaborators: PENDING('collaboration graph (members + credits)'),
      labels: PENDING('music metadata / record labels'),
      producers: PENDING('song metadata / producer credits'),
      venues: PENDING('venue / platform performance history'),
      found: false,
    };
  }

  const q = trimmedId.toLowerCase();

  // Try to resolve as a member from users table
  let userMatch: UserRow | null = null;
  try {
    const { data: users } = await supabase
      .from('users')
      .select('id, display_name, ign, real_name, primary_wallet, fid, username, zid')
      .eq('is_active', true);

    if (users && users.length > 0) {
      // Exact match first
      userMatch =
        users.find(
          (u) =>
            u.display_name?.toLowerCase() === q ||
            u.ign?.toLowerCase() === q ||
            u.real_name?.toLowerCase() === q ||
            (u.fid !== null && String(u.fid) === q) ||
            (u.zid !== null && String(u.zid) === q) ||
            (u.username?.toLowerCase() === q) ||
            (u.primary_wallet?.toLowerCase() === q),
        ) ?? null;
    }
  } catch (err) {
    // graceful degradation
  }

  // Try to resolve as an artist from wavewarz_artists table
  let artistMatch: ArtistRow | null = null;
  try {
    const { data: artist } = await supabase
      .from('wavewarz_artists')
      .select('name, solana_wallet, zao_fid')
      .ilike('name', trimmedId)
      .maybeSingle();
    if (artist) {
      artistMatch = artist as ArtistRow;
    }
  } catch (err) {
    // graceful degradation
  }

  // Determine primary identity from whichever source resolved
  const resolvedName = userMatch
    ? userMatch.display_name || userMatch.ign || userMatch.real_name
    : artistMatch?.name;
  const resolvedFid = userMatch?.fid ?? (artistMatch?.zao_fid ?? null);
  const resolvedZid = userMatch?.zid ?? null;
  const resolvedUsername = userMatch?.username ?? null;
  const resolvedPrimaryWallet = userMatch?.primary_wallet ?? null;
  const resolvedSolanaBattleWallet = artistMatch?.solana_wallet ?? null;

  if (!resolvedName) {
    return {
      identity: {
        name: trimmedId,
        primaryWallet: null,
        solanaBattleWallet: null,
        fid: null,
        zid: null,
        username: null,
      },
      roles: { roles: [] },
      bodyOfWork: { submissions: [], battles: [], events: [] },
      collaborators: PENDING('collaboration graph (members + credits)'),
      labels: PENDING('music metadata / record labels'),
      producers: PENDING('song metadata / producer credits'),
      venues: PENDING('venue / platform performance history'),
      found: false,
    };
  }

  // Determine roles
  const roles: CreatorRole[] = [];
  if (userMatch) roles.push('member');
  if (artistMatch) roles.push('artist');
  // curator/producer/organizer roles would be wired when their tables exist

  // Fetch submissions by this creator
  const submissions: CreatorWork[] = [];
  try {
    const { data: subs } = await supabase
      .from('song_submissions')
      .select('id, title, created_at, url')
      .or(`artist.ilike.${resolvedName},submitted_by_username.ilike.${resolvedUsername ?? 'null'}`);

    if (subs && subs.length > 0) {
      subs.forEach((s: any) => {
        submissions.push({
          id: s.id,
          title: s.title,
          type: 'submission',
          occurredAt: s.created_at,
          url: s.url,
        });
      });
    }
  } catch (err) {
    // graceful degradation
  }

  // Fetch battles for this artist (if they're an artist)
  const battles: CreatorWork[] = [];
  if (artistMatch) {
    try {
      const { data: battleLogs } = await supabase
        .from('wavewarz_battle_log')
        .select('id, artist_a, artist_b, settled_at')
        .or(`artist_a.ilike.${resolvedName},artist_b.ilike.${resolvedName}`)
        .not('settled_at', 'is', null);

      if (battleLogs && battleLogs.length > 0) {
        battleLogs.forEach((b: any) => {
          const opponent = b.artist_a === resolvedName ? b.artist_b : b.artist_a;
          battles.push({
            id: b.id,
            title: `${resolvedName} vs ${opponent}`,
            type: 'battle',
            occurredAt: b.settled_at,
            url: null, // battle proof URL would be added when schema includes it
          });
        });
      }
    } catch (err) {
      // graceful degradation
    }
  }

  // Fetch events this creator participated in
  const events: CreatorWork[] = [];
  // This would be wired when event_participants table or similar exists
  // For now, it's empty pending source

  return {
    identity: {
      name: resolvedName,
      primaryWallet: resolvedPrimaryWallet,
      solanaBattleWallet: resolvedSolanaBattleWallet,
      fid: resolvedFid,
      zid: resolvedZid,
      username: resolvedUsername,
    },
    roles: { roles },
    bodyOfWork: { submissions, battles, events },
    collaborators: PENDING('collaboration graph (members + credits)'),
    labels: PENDING('music metadata / record labels'),
    producers: PENDING('song metadata / producer credits'),
    venues: PENDING('venue / platform performance history'),
    found: true,
  };
}
