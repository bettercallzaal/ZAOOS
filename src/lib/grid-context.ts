/**
 * Grid Context: Domain intelligence helper for ZOE prompts.
 *
 * When ZOE is drafting about a creator, battle, event, or community member,
 * it can pull structured context from the grids (Reputation, Creator, Battle,
 * Event, Sponsor). This helper fetches and summarizes one grid's profile
 * into a compact string suitable for prompt injection.
 *
 * v1 covers: getCreatorProfile (creator grid), getReputationProfile (reputation grid).
 * Future: battle, event, sponsor grids + multi-entity queries.
 *
 * Usage:
 *   const ctx = await getGridContextForEntity('zaal', { type: 'reputation' });
 *   // returns a string like:
 *   // "Zaal (username @zaal, fid 1): Respect 450 (top 2%), held for 400+ days.
 *   //  Collaborations pending, battles pending. Trust 95.0/100."
 *   // Then inject into a prompt to let ZOE leverage this when drafting.
 */

import { getCreatorProfile } from '@/lib/grids/creator';
import { getReputationProfile } from '@/lib/grids/reputation';

export type GridType = 'creator' | 'reputation' | 'battle' | 'event' | 'sponsor';

export interface GridContextOptions {
  /** Which grid to query. */
  type: GridType;
  /** If true and the entity is not found, return empty string instead of a shell. */
  strictFound?: boolean;
}

/**
 * Fetch structured context for an entity from a single grid.
 *
 * @param identifier - Entity name, username, wallet, fid, or zid
 * @param options - Grid type + optional flags
 * @returns Compact string summary (empty if not found and strictFound=true)
 *
 * Examples:
 *   await getGridContextForEntity('zaal', { type: 'reputation' })
 *   await getGridContextForEntity('@zaal', { type: 'creator' })
 *   await getGridContextForEntity('0x...wallet', { type: 'reputation' })
 */
export async function getGridContextForEntity(
  identifier: string,
  options: GridContextOptions,
): Promise<string> {
  const { type, strictFound = false } = options;

  try {
    if (type === 'creator') {
      const profile = await getCreatorProfile(identifier);
      if (!profile.found && strictFound) return '';
      return formatCreatorContext(profile);
    }

    if (type === 'reputation') {
      const profile = await getReputationProfile(identifier);
      if (!profile.found && strictFound) return '';
      return formatReputationContext(profile);
    }

    // Placeholder for future grid types
    if (type === 'battle' || type === 'event' || type === 'sponsor') {
      return `Grid type '${type}' not yet wired (pending source schema).`;
    }

    return '';
  } catch (err) {
    // Graceful degradation: grid fetch failed, return empty.
    console.error(`[zoe/grid-context] ${type} fetch failed:`, (err as Error)?.message || err);
    return '';
  }
}

/**
 * Format a creator profile into a compact, prompt-friendly string.
 */
function formatCreatorContext(profile: Awaited<ReturnType<typeof getCreatorProfile>>): string {
  const { identity, roles, bodyOfWork, found } = profile;

  if (!found) return '';

  const parts: string[] = [];

  // Identity line
  const name = identity.name || 'Unknown';
  const usernamePart = identity.username ? `@${identity.username}` : '';
  const fidPart = identity.fid ? `fid ${identity.fid}` : '';
  const identifiers = [usernamePart, fidPart].filter(Boolean).join(', ');
  parts.push(`${name}${identifiers ? ` (${identifiers})` : ''}`);

  // Roles
  if (roles.roles.length > 0) {
    parts.push(`Roles: ${roles.roles.join(', ')}`);
  }

  // Body of work summary
  const workCount = bodyOfWork.submissions.length + bodyOfWork.battles.length + bodyOfWork.events.length;
  if (workCount > 0) {
    const summaries: string[] = [];
    if (bodyOfWork.submissions.length > 0) summaries.push(`${bodyOfWork.submissions.length} submission(s)`);
    if (bodyOfWork.battles.length > 0) summaries.push(`${bodyOfWork.battles.length} battle(s)`);
    if (bodyOfWork.events.length > 0) summaries.push(`${bodyOfWork.events.length} event(s)`);
    parts.push(`Work: ${summaries.join(', ')}`);
  }

  // Pending sources (information about what's not yet sourced)
  const pending: string[] = [];
  if (!profile.collaborators.sourced) pending.push('collaborations pending');
  if (!profile.labels.sourced) pending.push('labels pending');
  if (!profile.producers.sourced) pending.push('producers pending');
  if (!profile.venues.sourced) pending.push('venues pending');
  if (pending.length > 0) {
    parts.push(`[${pending.join(', ')}]`);
  }

  return parts.join(' | ');
}

/**
 * Format a reputation profile into a compact, prompt-friendly string.
 */
function formatReputationContext(profile: Awaited<ReturnType<typeof getReputationProfile>>): string {
  const { identity, respect, trust, found } = profile;

  if (!found) return '';

  const parts: string[] = [];

  // Identity line
  const name = identity.name || 'Unknown';
  const usernamePart = identity.username ? `@${identity.username}` : '';
  const fidPart = identity.fid ? `fid ${identity.fid}` : '';
  const identifiers = [usernamePart, fidPart].filter(Boolean).join(', ');
  parts.push(`${name}${identifiers ? ` (${identifiers})` : ''}`);

  // Respect on-chain
  const rankPart = respect.rank ? ` (rank #${respect.rank})` : '';
  const percentilePart = respect.percentile ? ` ${respect.percentile.toFixed(0)}th percentile` : '';
  parts.push(`Respect ${respect.total}${rankPart}${percentilePart}`);

  // Longevity signal
  if (respect.firstTokenDate) {
    const ageDays = (Date.now() - new Date(respect.firstTokenDate).getTime()) / 86_400_000;
    if (Number.isFinite(ageDays) && ageDays > 0) {
      parts.push(`Held for ${Math.floor(ageDays)} days`);
    }
  }

  // Trust score
  parts.push(`Trust ${trust.score.toFixed(1)}/100 (${trust.signals.join(', ')})`);

  // Pending sources
  const pending: string[] = [];
  if (!profile.battles.sourced) pending.push('battles pending');
  if (!profile.collaborations.sourced) pending.push('collabs pending');
  if (!profile.receipts.sourced) pending.push('receipts pending');
  if (pending.length > 0) {
    parts.push(`[${pending.join(', ')}]`);
  }

  return parts.join(' | ');
}

/**
 * Quick lookup: get grid context for multiple entities at once.
 * Returns a map of identifier -> context string.
 *
 * Useful for ZOE when crafting a post mentioning several people/artists.
 *
 * @param identifiers - Array of names/usernames/wallets
 * @param options - Grid type
 * @returns Record of identifier -> context (empty string if not found)
 */
export async function getGridContextBatch(
  identifiers: string[],
  options: GridContextOptions,
): Promise<Record<string, string>> {
  if (!identifiers || identifiers.length === 0) return {};

  const results = await Promise.allSettled(
    identifiers.map((id) => getGridContextForEntity(id, options)),
  );

  const out: Record<string, string> = {};
  identifiers.forEach((id, i) => {
    out[id] = results[i]?.status === 'fulfilled' ? results[i].value : '';
  });
  return out;
}
