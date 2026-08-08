/**
 * wiki.ts — ZOL Farcaster wiki entry builder and learner.
 *
 * Maintains a structured knowledge base of Farcaster ecosystem entities
 * (users, projects, protocol concepts) sourced from Neynar queries. ZOL and other
 * agents can query this wiki to answer "who is X" / "what is Y" questions and
 * gradually deepen understanding of the ecosystem.
 *
 * Storage: ~/.zao/zol/wiki/ (json files per entity)
 * Neynar API: /v2/farcaster/user/search, /v2/farcaster/user/:fid, etc.
 *
 * Pure logic (wikiEntry builders, deepenLearning aggregators) + thin IO layer
 * (readWiki, writeWiki). Testable.
 */

import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { ZodSchema } from 'zod';
import { z } from 'zod';
import { readV2 } from './read-node';

// Wiki storage directory
const WIKI_HOME = () => process.env.ZOL_WIKI_HOME ?? join(homedir(), '.zao', 'zol', 'wiki');

/**
 * A wiki entry represents accumulated knowledge about a Farcaster entity.
 * Entities can be: users (by FID or username), projects, protocol concepts, etc.
 */
export interface WikiEntry {
  /** Entity ID: "fid:12345" for users, "project:wavewarz" for projects, "concept:neynar" for concepts */
  id: string;

  /** Entity type: "user" | "project" | "concept" | "channel" */
  type: 'user' | 'project' | 'concept' | 'channel';

  /** Human-readable name or username */
  name: string;

  /** Short description (1-2 sentences) */
  description: string;

  /** Links to related Farcaster resources (casts, profiles, etc.) */
  relatedCasts?: string[]; // cast hashes or URLs

  /** Neynar profile data (for users) */
  profile?: {
    fid?: number;
    username?: string;
    displayName?: string;
    avatar?: string;
    bio?: string;
    followerCount?: number;
    followingCount?: number;
  };

  /** Accumulated facts/learnings from Neynar searches */
  learnings?: string[];

  /** Last updated timestamp (ISO 8601) */
  updatedAt: string;

  /** Creation timestamp (ISO 8601) */
  createdAt: string;

  /** Source of this entry: "manual" | "neynar-search" | "neynar-profile" */
  source: string;
}

/** Zod schema for runtime validation */
export const WikiEntrySchema: ZodSchema = z.object({
  id: z.string(),
  type: z.enum(['user', 'project', 'concept', 'channel']),
  name: z.string(),
  description: z.string(),
  relatedCasts: z.array(z.string()).optional(),
  profile: z
    .object({
      fid: z.number().optional(),
      username: z.string().optional(),
      displayName: z.string().optional(),
      avatar: z.string().optional(),
      bio: z.string().optional(),
      followerCount: z.number().optional(),
      followingCount: z.number().optional(),
    })
    .optional(),
  learnings: z.array(z.string()).optional(),
  updatedAt: z.string(),
  createdAt: z.string(),
  source: z.string(),
});

/**
 * Build an ID for a wiki entry. Pure.
 * Examples: "fid:3338501", "project:wavewarz", "concept:neynar"
 */
export function buildWikiEntryId(type: string, identifier: string): string {
  return `${type}:${identifier}`;
}

/**
 * Create a new wiki entry. Pure.
 */
export function createWikiEntry(
  id: string,
  type: 'user' | 'project' | 'concept' | 'channel',
  name: string,
  description: string,
  source: string,
  profile?: WikiEntry['profile'],
): WikiEntry {
  const now = new Date().toISOString();
  return {
    id,
    type,
    name,
    description,
    profile,
    learnings: [],
    updatedAt: now,
    createdAt: now,
    source,
  };
}

/**
 * Add a learning (fact/observation) to a wiki entry. Pure.
 * Returns updated entry without mutating input.
 */
export function addLearning(entry: WikiEntry, learning: string): WikiEntry {
  return {
    ...entry,
    learnings: [...(entry.learnings ?? []), learning],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Parse Neynar user response into a profile object. Pure.
 * Handles partial/null data gracefully.
 */
export function parseNeynarUserProfile(data: unknown): WikiEntry['profile'] | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const obj = data as Record<string, unknown>;
  const profile = obj.profile as Record<string, unknown> | undefined;
  const bio = profile?.bio as Record<string, unknown> | undefined;
  return {
    fid: typeof obj.fid === 'number' ? obj.fid : undefined,
    username: typeof obj.username === 'string' ? obj.username : undefined,
    displayName: typeof obj.display_name === 'string' ? obj.display_name : undefined,
    avatar: typeof obj.pfp_url === 'string' ? obj.pfp_url : undefined,
    bio: typeof bio?.text === 'string' ? (bio.text as string) : undefined,
    followerCount:
      typeof obj.follower_count === 'number' ? obj.follower_count : undefined,
    followingCount:
      typeof obj.following_count === 'number' ? obj.following_count : undefined,
  };
}

/**
 * Fetch and parse a Farcaster user profile from Neynar. Returns None on error.
 *
 * Supports lookup by FID or username:
 *   - FID: /v2/farcaster/user/by_fid?fid=3338501
 *   - Username: /v2/farcaster/user/by_username?username=zolbot
 */
export async function fetchNeynarUserProfile(
  fidOrUsername: number | string,
): Promise<WikiEntry['profile'] | null> {
  try {
    let path: string;
    if (typeof fidOrUsername === 'number') {
      path = `/v2/farcaster/user/by_fid?fid=${fidOrUsername}`;
    } else {
      path = `/v2/farcaster/user/by_username?username=${encodeURIComponent(fidOrUsername)}`;
    }

    const response = await readV2(path);
    if (!response || typeof response !== 'object') return null;

    const obj = response as Record<string, unknown>;
    const user = obj.user;
    return parseNeynarUserProfile(user);
  } catch (e) {
    console.warn(`[wiki] fetchNeynarUserProfile(${fidOrUsername}) failed:`, (e as Error).message);
    return null;
  }
}

/**
 * Search Neynar for casts containing a term, extract recent insights.
 * Returns up to `limit` cast hashes that mention the term.
 *
 * Used by deepenLearning to populate relatedCasts and learnings.
 */
export async function searchNeynarCasts(term: string, limit = 5): Promise<string[]> {
  try {
    // Neynar feed search: /v2/farcaster/feed/search?q=<query>
    const path = `/v2/farcaster/feed/search?q=${encodeURIComponent(term)}&limit=${limit}`;
    const response = await readV2(path);
    if (!response || typeof response !== 'object') return [];

    const obj = response as Record<string, unknown>;
    const casts = obj.casts;
    if (!Array.isArray(casts)) return [];

    return casts
      .filter((c) => c && typeof c === 'object' && typeof (c as Record<string, unknown>).hash === 'string')
      .map((c) => (c as Record<string, unknown>).hash as string)
      .slice(0, limit);
  } catch (e) {
    console.warn(`[wiki] searchNeynarCasts("${term}") failed:`, (e as Error).message);
    return [];
  }
}

/**
 * Deepen learning about a wiki entry by querying Neynar.
 * - For users: fetch profile data
 * - For any entity: search Neynar for recent mentions
 *
 * Returns updated entry without mutating input.
 */
export async function deepenLearning(entry: WikiEntry): Promise<WikiEntry> {
  let updated = { ...entry };

  // For users, fetch/refresh profile from Neynar
  if (entry.type === 'user' && entry.profile?.fid) {
    const profile = await fetchNeynarUserProfile(entry.profile.fid);
    if (profile) {
      updated.profile = profile;
      if (profile.followerCount !== undefined) {
        updated = addLearning(
          updated,
          `Neynar refresh: ${profile.followerCount} followers, ${profile.followingCount ?? 0} following (as of ${new Date().toISOString().slice(0, 10)})`,
        );
      }
    }
  }

  // Search Neynar for recent mentions of this entity
  const searchTerm = entry.name || entry.id.split(':')[1] || '';
  if (searchTerm.length > 0) {
    const casts = await searchNeynarCasts(searchTerm, 5);
    if (casts.length > 0) {
      updated.relatedCasts = [...(updated.relatedCasts ?? []), ...casts];
      updated = addLearning(
        updated,
        `Neynar search: found ${casts.length} recent casts mentioning "${searchTerm}"`,
      );
    }
  }

  return updated;
}

/**
 * Read a wiki entry from disk by ID. Returns null if not found.
 */
export async function readWiki(id: string): Promise<WikiEntry | null> {
  try {
    const dir = WIKI_HOME();
    const path = join(dir, `${id}.json`);
    const data = await fs.readFile(path, 'utf8');
    const parsed = JSON.parse(data);
    const validated = WikiEntrySchema.parse(parsed);
    return validated as WikiEntry;
  } catch {
    return null;
  }
}

/**
 * Write a wiki entry to disk. Creates directory if needed.
 * Returns the written entry.
 */
export async function writeWiki(entry: WikiEntry): Promise<WikiEntry> {
  const validated = WikiEntrySchema.parse(entry) as WikiEntry;
  const dir = WIKI_HOME();
  await fs.mkdir(dir, { recursive: true });
  const path = join(dir, `${entry.id}.json`);
  await fs.writeFile(path, JSON.stringify(validated, null, 2), 'utf8');
  return validated;
}

/**
 * List all wiki entries on disk.
 */
export async function listWiki(): Promise<WikiEntry[]> {
  try {
    const dir = WIKI_HOME();
    const files = await fs.readdir(dir);
    const entries: WikiEntry[] = [];
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      const id = file.slice(0, -5);
      const entry = await readWiki(id);
      if (entry) entries.push(entry);
    }
    return entries;
  } catch {
    return [];
  }
}

/**
 * Delete a wiki entry from disk.
 */
export async function deleteWiki(id: string): Promise<void> {
  const dir = WIKI_HOME();
  const path = join(dir, `${id}.json`);
  await fs.unlink(path);
}
