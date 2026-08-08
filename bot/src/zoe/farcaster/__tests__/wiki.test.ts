import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import {
  buildWikiEntryId,
  createWikiEntry,
  addLearning,
  parseNeynarUserProfile,
  deepenLearning,
  readWiki,
  writeWiki,
  listWiki,
  deleteWiki,
  WikiEntry,
} from '../wiki';

// Mock the read-node module
vi.mock('../read-node', () => ({
  readV2: vi.fn(),
}));

import * as readNode from '../read-node';

describe('wiki.ts', () => {
  describe('buildWikiEntryId', () => {
    it('builds user FID ID', () => {
      expect(buildWikiEntryId('fid', '3338501')).toBe('fid:3338501');
    });

    it('builds project ID', () => {
      expect(buildWikiEntryId('project', 'wavewarz')).toBe('project:wavewarz');
    });

    it('builds concept ID', () => {
      expect(buildWikiEntryId('concept', 'neynar')).toBe('concept:neynar');
    });
  });

  describe('createWikiEntry', () => {
    it('creates a new user wiki entry', () => {
      const entry = createWikiEntry(
        'fid:3338501',
        'user',
        'ZOL',
        'The ZAO autonomous Farcaster curator',
        'manual',
        { fid: 3338501, username: 'zolbot' },
      );

      expect(entry.id).toBe('fid:3338501');
      expect(entry.type).toBe('user');
      expect(entry.name).toBe('ZOL');
      expect(entry.description).toBe('The ZAO autonomous Farcaster curator');
      expect(entry.source).toBe('manual');
      expect(entry.profile?.username).toBe('zolbot');
      expect(entry.learnings).toEqual([]);
      expect(entry.createdAt).toBeTruthy();
      expect(entry.updatedAt).toBeTruthy();
    });

    it('creates a project entry without profile', () => {
      const entry = createWikiEntry(
        'project:wavewarz',
        'project',
        'WaveWarZ',
        'Music battle protocol on Farcaster',
        'neynar-search',
      );

      expect(entry.type).toBe('project');
      expect(entry.profile).toBeUndefined();
      expect(entry.source).toBe('neynar-search');
    });
  });

  describe('addLearning', () => {
    it('adds a learning to an entry', async () => {
      const entry = createWikiEntry(
        'fid:123',
        'user',
        'Test User',
        'A test user',
        'manual',
      );

      // Small delay to ensure timestamp changes
      await new Promise((resolve) => setTimeout(resolve, 10));
      const updated = addLearning(entry, 'Follower count: 500');

      expect(updated.learnings).toContain('Follower count: 500');
      expect(updated.updatedAt >= entry.updatedAt).toBe(true); // timestamp updated or equal
      expect(entry.learnings).toEqual([]); // original not mutated
    });

    it('preserves existing learnings', () => {
      let entry = createWikiEntry(
        'fid:123',
        'user',
        'Test User',
        'A test user',
        'manual',
      );
      entry = addLearning(entry, 'First learning');
      entry = addLearning(entry, 'Second learning');

      expect(entry.learnings).toEqual(['First learning', 'Second learning']);
    });
  });

  describe('parseNeynarUserProfile', () => {
    it('parses a valid Neynar user response', () => {
      const neynarData = {
        fid: 3338501,
        username: 'zolbot',
        display_name: 'ZOL',
        pfp_url: 'https://example.com/zol.png',
        profile: {
          bio: {
            text: 'The ZAO autonomous curator',
          },
        },
        follower_count: 250,
        following_count: 100,
      };

      const profile = parseNeynarUserProfile(neynarData);

      expect(profile?.fid).toBe(3338501);
      expect(profile?.username).toBe('zolbot');
      expect(profile?.displayName).toBe('ZOL');
      expect(profile?.avatar).toBe('https://example.com/zol.png');
      expect(profile?.bio).toBe('The ZAO autonomous curator');
      expect(profile?.followerCount).toBe(250);
      expect(profile?.followingCount).toBe(100);
    });

    it('handles partial data gracefully', () => {
      const partialData = {
        fid: 123,
        username: 'user',
        // missing other fields
      };

      const profile = parseNeynarUserProfile(partialData);

      expect(profile?.fid).toBe(123);
      expect(profile?.username).toBe('user');
      expect(profile?.bio).toBeUndefined();
      expect(profile?.followerCount).toBeUndefined();
    });

    it('returns undefined for null input', () => {
      expect(parseNeynarUserProfile(null)).toBeUndefined();
      expect(parseNeynarUserProfile(undefined)).toBeUndefined();
      expect(parseNeynarUserProfile('not an object')).toBeUndefined();
    });
  });

  describe('deepenLearning', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('fetches user profile from Neynar for user entries', async () => {
      const mockReadV2 = vi.spyOn(readNode, 'readV2' as any);
      mockReadV2.mockResolvedValue({
        user: {
          fid: 3338501,
          username: 'zolbot',
          display_name: 'ZOL',
          follower_count: 300,
          following_count: 100,
        },
      });

      const entry = createWikiEntry(
        'fid:3338501',
        'user',
        'ZOL',
        'The curator',
        'manual',
        { fid: 3338501 },
      );

      const updated = await deepenLearning(entry);

      expect(mockReadV2).toHaveBeenCalledWith('/v2/farcaster/user/by_fid?fid=3338501');
      expect(updated.profile?.followerCount).toBe(300);
      expect(updated.learnings?.some((l) => l.includes('300 followers'))).toBe(true);
    });

    it('searches Neynar for mentions', async () => {
      const mockReadV2 = vi.spyOn(readNode, 'readV2' as any);
      mockReadV2.mockResolvedValue({
        casts: [
          { hash: 'cast1' },
          { hash: 'cast2' },
          { hash: 'cast3' },
        ],
      });

      const entry = createWikiEntry(
        'project:wavewarz',
        'project',
        'WaveWarZ',
        'Music battle',
        'manual',
      );

      const updated = await deepenLearning(entry);

      expect(mockReadV2).toHaveBeenCalledWith(
        expect.stringContaining('/v2/farcaster/feed/search'),
      );
      expect(updated.relatedCasts).toContain('cast1');
      expect(updated.relatedCasts).toContain('cast2');
      expect(updated.relatedCasts).toContain('cast3');
      expect(updated.learnings?.some((l) => l.includes('3 recent casts'))).toBe(true);
    });

    it('handles Neynar errors gracefully', async () => {
      const mockReadV2 = vi.spyOn(readNode, 'readV2' as any);
      mockReadV2.mockRejectedValue(new Error('Neynar API error'));

      const entry = createWikiEntry(
        'fid:999999',
        'user',
        'Unknown User',
        'No data',
        'manual',
        { fid: 999999 },
      );

      const updated = await deepenLearning(entry);

      // Should return entry with no changes if API fails
      expect(updated.learnings).toEqual([]);
    });
  });

  describe('disk operations', () => {
    const testWikiHome = '/tmp/test-wiki';

    beforeEach(async () => {
      // Set test wiki home
      process.env.ZOL_WIKI_HOME = testWikiHome;
      // Clean up before tests
      try {
        await fs.rm(testWikiHome, { recursive: true, force: true });
      } catch {
        // ignore
      }
    });

    afterEach(async () => {
      // Clean up after tests
      try {
        await fs.rm(testWikiHome, { recursive: true, force: true });
      } catch {
        // ignore
      }
    });

    it('writes and reads a wiki entry', async () => {
      const entry = createWikiEntry(
        'fid:123',
        'user',
        'Test User',
        'A test entry',
        'manual',
      );

      const written = await writeWiki(entry);

      expect(written.id).toBe('fid:123');

      const read = await readWiki('fid:123');

      expect(read).not.toBeNull();
      expect(read?.id).toBe('fid:123');
      expect(read?.name).toBe('Test User');
      expect(read?.description).toBe('A test entry');
    });

    it('returns null when reading non-existent entry', async () => {
      const read = await readWiki('nonexistent:id');
      expect(read).toBeNull();
    });

    it('lists all wiki entries', async () => {
      const entry1 = createWikiEntry('fid:1', 'user', 'User 1', 'First user', 'manual');
      const entry2 = createWikiEntry(
        'project:proj1',
        'project',
        'Project 1',
        'First project',
        'manual',
      );

      await writeWiki(entry1);
      await writeWiki(entry2);

      const listed = await listWiki();

      expect(listed.length).toBe(2);
      expect(listed.map((e) => e.id)).toContain('fid:1');
      expect(listed.map((e) => e.id)).toContain('project:proj1');
    });

    it('deletes a wiki entry', async () => {
      const entry = createWikiEntry('fid:123', 'user', 'Test', 'Test', 'manual');
      await writeWiki(entry);

      let read = await readWiki('fid:123');
      expect(read).not.toBeNull();

      await deleteWiki('fid:123');

      read = await readWiki('fid:123');
      expect(read).toBeNull();
    });

    it('returns empty array when listing non-existent directory', async () => {
      const listed = await listWiki();
      expect(listed).toEqual([]);
    });

    it('persists learnings across writes', async () => {
      let entry = createWikiEntry('fid:123', 'user', 'Test', 'Test', 'manual');
      entry = addLearning(entry, 'First fact');
      await writeWiki(entry);

      let read = await readWiki('fid:123');
      expect(read?.learnings).toContain('First fact');

      // Add another learning and write
      read = addLearning(read!, 'Second fact');
      await writeWiki(read);

      read = await readWiki('fid:123');
      expect(read?.learnings).toEqual(['First fact', 'Second fact']);
    });
  });

  describe('integration: create → deepen → store', () => {
    const testWikiHome = '/tmp/test-wiki-integration';

    beforeEach(async () => {
      process.env.ZOL_WIKI_HOME = testWikiHome;
      try {
        await fs.rm(testWikiHome, { recursive: true, force: true });
      } catch {
        // ignore
      }
    });

    afterEach(async () => {
      try {
        await fs.rm(testWikiHome, { recursive: true, force: true });
      } catch {
        // ignore
      }
    });

    it('creates, deepens, and persists a wiki entry', async () => {
      const mockReadV2 = vi.spyOn(readNode, 'readV2' as any);
      mockReadV2.mockResolvedValue({
        casts: [{ hash: 'abc123' }],
      });

      // Create
      let entry = createWikiEntry(
        'project:wavewarz',
        'project',
        'WaveWarZ',
        'Music battle on Farcaster',
        'manual',
      );

      // Deepen
      entry = await deepenLearning(entry);
      expect(entry.relatedCasts?.length).toBeGreaterThan(0);

      // Persist
      const written = await writeWiki(entry);
      expect(written.id).toBe('project:wavewarz');

      // Retrieve and verify
      const retrieved = await readWiki('project:wavewarz');
      expect(retrieved?.relatedCasts).toBeDefined();
      expect(retrieved?.learnings?.length).toBeGreaterThan(0);
    });
  });
});
