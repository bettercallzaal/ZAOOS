import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chainMock,
  makeGetRequest,
  makePostRequest,
  mockAuthenticatedSession,
  VALID_UUID,
} from '@/test-utils/api-helpers';

const { mockGetSessionData, mockFrom } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
}));

const { mockIsMusicUrl } = vi.hoisted(() => ({
  mockIsMusicUrl: vi.fn(),
}));

const { mockUpsertSong } = vi.hoisted(() => ({
  mockUpsertSong: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: {
    from: mockFrom,
  },
}));

vi.mock('@/lib/music/isMusicUrl', () => ({
  isMusicUrl: (_url: unknown) => mockIsMusicUrl(_url),
}));

vi.mock('@/lib/music/library', () => ({
  upsertSong: (_params: unknown) => mockUpsertSong(_params),
}));

import { GET, POST } from '../route';

describe('/api/music/library/react', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────
  // GET /api/music/library/react?url=...
  // ─────────────────────────────────────────────────────────────

  describe('GET', () => {
    it('returns 401 when no session exists', async () => {
      mockGetSessionData.mockResolvedValue(null);

      const req = makeGetRequest('/api/music/library/react', {
        url: 'https://spotify.com/track/123',
      });
      const res = await GET(req);

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: 'Unauthorized' });
    });

    it('returns 400 when url query param is missing', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

      const req = makeGetRequest('/api/music/library/react');
      const res = await GET(req);

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: 'Missing url parameter' });
    });

    it('returns empty reactions when song does not exist', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

      const songLookup = chainMock({ data: null });
      mockFrom.mockReturnValue(songLookup.chain);

      const req = makeGetRequest('/api/music/library/react', {
        url: 'https://spotify.com/track/nonexistent',
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ reactions: {}, userReactions: [] });
    });

    it('returns reaction counts and user reactions for existing song', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

      const songData = { id: VALID_UUID };

      // Song lookup chain
      const songLookup = chainMock({ data: songData });

      // All reactions chain
      const allReactionsData = [{ emoji: '🔥' }, { emoji: '🔥' }, { emoji: '❤️' }];
      const allReactions = chainMock({ data: allReactionsData });

      // User reactions chain
      const userReactionsData = [{ emoji: '🔥' }];
      const userReactions = chainMock({ data: userReactionsData });

      let callsToFrom = 0;
      mockFrom.mockImplementation((table: string) => {
        if (table === 'songs') {
          return songLookup.chain;
        }
        if (table === 'song_reactions') {
          callsToFrom += 1;
          // First call is for all reactions, second is for user reactions
          if (callsToFrom === 1) return allReactions.chain;
          return userReactions.chain;
        }
        return {};
      });

      const req = makeGetRequest('/api/music/library/react', {
        url: 'https://spotify.com/track/abc123',
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({
        reactions: { '🔥': 2, '❤️': 1 },
        userReactions: ['🔥'],
      });
    });

    it('returns empty user reactions when user has not reacted', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456 }));

      const songData = { id: VALID_UUID };
      const songLookup = chainMock({ data: songData });

      const allReactionsData = [{ emoji: '🔥' }];
      const allReactions = chainMock({ data: allReactionsData });

      const userReactionsData: unknown[] = [];
      const userReactions = chainMock({ data: userReactionsData });

      let callsToFrom = 0;
      mockFrom.mockImplementation((table: string) => {
        if (table === 'songs') {
          return songLookup.chain;
        }
        if (table === 'song_reactions') {
          callsToFrom += 1;
          if (callsToFrom === 1) return allReactions.chain;
          return userReactions.chain;
        }
        return {};
      });

      const req = makeGetRequest('/api/music/library/react', {
        url: 'https://spotify.com/track/xyz',
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({
        reactions: { '🔥': 1 },
        userReactions: [],
      });
    });

    it('returns empty reactions dict when no reactions exist on song', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

      const songData = { id: VALID_UUID };
      const songLookup = chainMock({ data: songData });

      const allReactionsData: unknown[] = [];
      const allReactions = chainMock({ data: allReactionsData });

      const userReactionsData: unknown[] = [];
      const userReactions = chainMock({ data: userReactionsData });

      let callsToFrom = 0;
      mockFrom.mockImplementation((table: string) => {
        if (table === 'songs') {
          return songLookup.chain;
        }
        if (table === 'song_reactions') {
          callsToFrom += 1;
          if (callsToFrom === 1) return allReactions.chain;
          return userReactions.chain;
        }
        return {};
      });

      const req = makeGetRequest('/api/music/library/react', {
        url: 'https://spotify.com/track/abc',
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({
        reactions: {},
        userReactions: [],
      });
    });

    it('returns 500 when song lookup throws', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

      // Make the song lookup throw an error
      const songLookupChain: Record<string, ReturnType<typeof vi.fn>> = {};
      const chainable = [
        'select',
        'insert',
        'update',
        'upsert',
        'delete',
        'eq',
        'neq',
        'in',
        'not',
        'is',
        'gt',
        'gte',
        'lt',
        'lte',
        'like',
        'ilike',
        'order',
        'range',
        'limit',
        'maybeSingle',
      ];
      for (const method of chainable) {
        songLookupChain[method] = vi.fn().mockReturnValue(songLookupChain);
      }
      const lookupError = new Error('DB connection failed');
      // biome-ignore lint/suspicious/noThenProperty: intentionally testing thenable
      songLookupChain.then = vi.fn((_resolve: unknown, reject: (err: unknown) => void) => {
        reject(lookupError);
      });

      mockFrom.mockReturnValue(songLookupChain);

      const req = makeGetRequest('/api/music/library/react', {
        url: 'https://spotify.com/track/fail',
      });
      const res = await GET(req);

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: 'Failed to get reactions' });
    });
  });

  // ─────────────────────────────────────────────────────────────
  // POST /api/music/library/react
  // ─────────────────────────────────────────────────────────────

  describe('POST', () => {
    it('returns 401 when no session exists', async () => {
      mockGetSessionData.mockResolvedValue(null);

      const req = makePostRequest('/api/music/library/react', {
        url: 'https://spotify.com/track/123',
        emoji: '🔥',
      });
      const res = await POST(req);

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: 'Unauthorized' });
    });

    it('returns 400 when body is invalid JSON', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

      const req = makePostRequest('/api/music/library/react', 'not-an-object');
      const res = await POST(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Invalid input');
      expect(json.details).toBeDefined();
    });

    it('returns 400 when url is not a valid URL', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

      const req = makePostRequest('/api/music/library/react', {
        url: 'not-a-url',
        emoji: '🔥',
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Invalid input');
    });

    it('returns 400 when url exceeds max length', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

      const longUrl = `https://example.com/${'a'.repeat(500)}`;

      const req = makePostRequest('/api/music/library/react', {
        url: longUrl,
        emoji: '🔥',
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Invalid input');
    });

    it('returns 400 when emoji is not in ALLOWED_EMOJIS', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

      const req = makePostRequest('/api/music/library/react', {
        url: 'https://spotify.com/track/123',
        emoji: '🚀',
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Invalid input');
      expect(json.details.fieldErrors.emoji).toBeDefined();
    });

    it('returns 400 when url is missing', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

      const req = makePostRequest('/api/music/library/react', {
        emoji: '🔥',
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Invalid input');
    });

    it('returns 400 when emoji is missing', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

      const req = makePostRequest('/api/music/library/react', {
        url: 'https://spotify.com/track/123',
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Invalid input');
    });

    it('accepts fire emoji (🔥)', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
      mockIsMusicUrl.mockReturnValue('spotify');

      const songId = VALID_UUID;
      mockUpsertSong.mockResolvedValue({ id: songId, isNew: true });

      // Existing reaction check
      const existingCheck = chainMock({ data: null });

      // Insert reaction
      const insertReaction = chainMock({ data: { id: 'reaction-1' } });

      // Get reaction counts
      const reactionCount = chainMock({ data: [] });

      let callsToFrom = 0;
      mockFrom.mockImplementation((table: string) => {
        if (table === 'song_reactions') {
          callsToFrom += 1;
          if (callsToFrom === 1) return existingCheck.chain;
          if (callsToFrom === 2) return insertReaction.chain;
          return reactionCount.chain;
        }
        return {};
      });

      const req = makePostRequest('/api/music/library/react', {
        url: 'https://spotify.com/track/123',
        emoji: '🔥',
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({
        reacted: true,
        reactions: {},
      });
    });

    it('accepts heart emoji (❤️)', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
      mockIsMusicUrl.mockReturnValue('spotify');

      const songId = VALID_UUID;
      mockUpsertSong.mockResolvedValue({ id: songId, isNew: true });

      const existingCheck = chainMock({ data: null });
      const insertReaction = chainMock({ data: { id: 'reaction-1' } });
      const reactionCount = chainMock({ data: [] });

      let callsToFrom = 0;
      mockFrom.mockImplementation((table: string) => {
        if (table === 'song_reactions') {
          callsToFrom += 1;
          if (callsToFrom === 1) return existingCheck.chain;
          if (callsToFrom === 2) return insertReaction.chain;
          return reactionCount.chain;
        }
        return {};
      });

      const req = makePostRequest('/api/music/library/react', {
        url: 'https://spotify.com/track/456',
        emoji: '❤️',
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.reacted).toBe(true);
    });

    it('accepts music note emoji (🎵)', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
      mockIsMusicUrl.mockReturnValue('spotify');

      const songId = VALID_UUID;
      mockUpsertSong.mockResolvedValue({ id: songId, isNew: true });

      const existingCheck = chainMock({ data: null });
      const insertReaction = chainMock({ data: { id: 'reaction-1' } });
      const reactionCount = chainMock({ data: [] });

      let callsToFrom = 0;
      mockFrom.mockImplementation((table: string) => {
        if (table === 'song_reactions') {
          callsToFrom += 1;
          if (callsToFrom === 1) return existingCheck.chain;
          if (callsToFrom === 2) return insertReaction.chain;
          return reactionCount.chain;
        }
        return {};
      });

      const req = makePostRequest('/api/music/library/react', {
        url: 'https://spotify.com/track/789',
        emoji: '🎵',
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.reacted).toBe(true);
    });

    it('accepts gem emoji (💎)', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
      mockIsMusicUrl.mockReturnValue('spotify');

      const songId = VALID_UUID;
      mockUpsertSong.mockResolvedValue({ id: songId, isNew: true });

      const existingCheck = chainMock({ data: null });
      const insertReaction = chainMock({ data: { id: 'reaction-1' } });
      const reactionCount = chainMock({ data: [] });

      let callsToFrom = 0;
      mockFrom.mockImplementation((table: string) => {
        if (table === 'song_reactions') {
          callsToFrom += 1;
          if (callsToFrom === 1) return existingCheck.chain;
          if (callsToFrom === 2) return insertReaction.chain;
          return reactionCount.chain;
        }
        return {};
      });

      const req = makePostRequest('/api/music/library/react', {
        url: 'https://spotify.com/track/gem',
        emoji: '💎',
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect((await res.json()).reacted).toBe(true);
    });

    it('accepts hands clapping emoji (👏)', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
      mockIsMusicUrl.mockReturnValue('youtube');

      const songId = VALID_UUID;
      mockUpsertSong.mockResolvedValue({ id: songId, isNew: true });

      const existingCheck = chainMock({ data: null });
      const insertReaction = chainMock({ data: { id: 'reaction-1' } });
      const reactionCount = chainMock({ data: [] });

      let callsToFrom = 0;
      mockFrom.mockImplementation((table: string) => {
        if (table === 'song_reactions') {
          callsToFrom += 1;
          if (callsToFrom === 1) return existingCheck.chain;
          if (callsToFrom === 2) return insertReaction.chain;
          return reactionCount.chain;
        }
        return {};
      });

      const req = makePostRequest('/api/music/library/react', {
        url: 'https://youtube.com/watch?v=abc',
        emoji: '👏',
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect((await res.json()).reacted).toBe(true);
    });

    it('accepts exploding head emoji (🤯)', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
      mockIsMusicUrl.mockReturnValue('soundcloud');

      const songId = VALID_UUID;
      mockUpsertSong.mockResolvedValue({ id: songId, isNew: true });

      const existingCheck = chainMock({ data: null });
      const insertReaction = chainMock({ data: { id: 'reaction-1' } });
      const reactionCount = chainMock({ data: [] });

      let callsToFrom = 0;
      mockFrom.mockImplementation((table: string) => {
        if (table === 'song_reactions') {
          callsToFrom += 1;
          if (callsToFrom === 1) return existingCheck.chain;
          if (callsToFrom === 2) return insertReaction.chain;
          return reactionCount.chain;
        }
        return {};
      });

      const req = makePostRequest('/api/music/library/react', {
        url: 'https://soundcloud.com/artist/track',
        emoji: '🤯',
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect((await res.json()).reacted).toBe(true);
    });

    it('calls upsertSong with correct params', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 789 }));
      mockIsMusicUrl.mockReturnValue('spotify');

      const songId = VALID_UUID;
      mockUpsertSong.mockResolvedValue({ id: songId, isNew: true });

      const existingCheck = chainMock({ data: null });
      const insertReaction = chainMock({ data: { id: 'reaction-1' } });
      const reactionCount = chainMock({ data: [] });

      let callsToFrom = 0;
      mockFrom.mockImplementation((table: string) => {
        if (table === 'song_reactions') {
          callsToFrom += 1;
          if (callsToFrom === 1) return existingCheck.chain;
          if (callsToFrom === 2) return insertReaction.chain;
          return reactionCount.chain;
        }
        return {};
      });

      const url = 'https://spotify.com/track/abc123';
      const req = makePostRequest('/api/music/library/react', {
        url,
        emoji: '🔥',
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(mockUpsertSong).toHaveBeenCalledWith({
        url,
        platform: 'spotify',
        submittedByFid: 789,
        source: 'manual',
      });
      expect(mockUpsertSong).toHaveBeenCalledTimes(1);
    });

    it('toggles reaction off when user already reacted with same emoji', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
      mockIsMusicUrl.mockReturnValue('spotify');

      const songId = VALID_UUID;
      mockUpsertSong.mockResolvedValue({ id: songId, isNew: false });

      // Existing reaction found
      const existingReaction = { id: 'reaction-123' };
      const existingCheck = chainMock({ data: existingReaction });

      const deleteReaction = chainMock({});

      const reactionCount = chainMock({ data: [{ emoji: '❤️' }] });

      let callsToFrom = 0;
      mockFrom.mockImplementation((table: string) => {
        if (table === 'song_reactions') {
          callsToFrom += 1;
          if (callsToFrom === 1) return existingCheck.chain;
          if (callsToFrom === 2) return deleteReaction.chain;
          return reactionCount.chain;
        }
        return {};
      });

      const req = makePostRequest('/api/music/library/react', {
        url: 'https://spotify.com/track/existing',
        emoji: '🔥',
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.reacted).toBe(false);
      expect(json.reactions).toEqual({ '❤️': 1 });
    });

    it('returns reaction counts after adding new reaction', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 555 }));
      mockIsMusicUrl.mockReturnValue('youtube');

      const songId = VALID_UUID;
      mockUpsertSong.mockResolvedValue({ id: songId, isNew: true });

      const existingCheck = chainMock({ data: null });
      const insertReaction = chainMock({ data: { id: 'new-reaction' } });

      const reactionCounts = [{ emoji: '🔥' }, { emoji: '🔥' }, { emoji: '❤️' }, { emoji: '🤯' }];
      const countChain = chainMock({ data: reactionCounts });

      let callsToFrom = 0;
      mockFrom.mockImplementation((table: string) => {
        if (table === 'song_reactions') {
          callsToFrom += 1;
          if (callsToFrom === 1) return existingCheck.chain;
          if (callsToFrom === 2) return insertReaction.chain;
          return countChain.chain;
        }
        return {};
      });

      const req = makePostRequest('/api/music/library/react', {
        url: 'https://youtube.com/watch?v=xyz',
        emoji: '🤯',
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({
        reacted: true,
        reactions: {
          '🔥': 2,
          '❤️': 1,
          '🤯': 1,
        },
      });
    });

    it('uses isMusicUrl to detect platform when not provided', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
      mockIsMusicUrl.mockReturnValue('soundcloud');

      const songId = VALID_UUID;
      mockUpsertSong.mockResolvedValue({ id: songId, isNew: true });

      const existingCheck = chainMock({ data: null });
      const insertReaction = chainMock({ data: { id: 'reaction-1' } });
      const reactionCount = chainMock({ data: [] });

      let callsToFrom = 0;
      mockFrom.mockImplementation((table: string) => {
        if (table === 'song_reactions') {
          callsToFrom += 1;
          if (callsToFrom === 1) return existingCheck.chain;
          if (callsToFrom === 2) return insertReaction.chain;
          return reactionCount.chain;
        }
        return {};
      });

      const url = 'https://soundcloud.com/artist/song';
      const req = makePostRequest('/api/music/library/react', {
        url,
        emoji: '❤️',
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(mockIsMusicUrl).toHaveBeenCalledWith(url);
    });

    it('returns 500 when upsertSong throws', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
      mockIsMusicUrl.mockReturnValue('spotify');

      mockUpsertSong.mockRejectedValue(new Error('Upsert failed'));

      const req = makePostRequest('/api/music/library/react', {
        url: 'https://spotify.com/track/fail',
        emoji: '🔥',
      });
      const res = await POST(req);

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: 'Failed to toggle reaction' });
    });

    it('returns 500 when existing reaction check fails', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
      mockIsMusicUrl.mockReturnValue('spotify');

      const songId = VALID_UUID;
      mockUpsertSong.mockResolvedValue({ id: songId, isNew: true });

      // Create a chain that rejects when awaited
      const failError = new Error('Query failed');
      const existingCheckChain: Record<string, ReturnType<typeof vi.fn>> = {};
      const chainable = [
        'select',
        'insert',
        'update',
        'upsert',
        'delete',
        'eq',
        'neq',
        'in',
        'not',
        'is',
        'gt',
        'gte',
        'lt',
        'lte',
        'like',
        'ilike',
        'order',
        'range',
        'limit',
        'maybeSingle',
      ];
      for (const method of chainable) {
        existingCheckChain[method] = vi.fn().mockReturnValue(existingCheckChain);
      }
      // biome-ignore lint/suspicious/noThenProperty: intentionally testing thenable
      existingCheckChain.then = vi.fn((_resolve: unknown, reject: (err: unknown) => void) => {
        reject(failError);
      });

      mockFrom.mockReturnValue(existingCheckChain);

      const req = makePostRequest('/api/music/library/react', {
        url: 'https://spotify.com/track/fail',
        emoji: '🔥',
      });
      const res = await POST(req);

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: 'Failed to toggle reaction' });
    });

    it('returns 500 when delete reaction fails', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
      mockIsMusicUrl.mockReturnValue('spotify');

      const songId = VALID_UUID;
      mockUpsertSong.mockResolvedValue({ id: songId, isNew: false });

      const existingReaction = { id: 'reaction-123' };
      const existingCheck = chainMock({ data: existingReaction });

      // Create a chain that rejects when awaited
      const failError = new Error('Delete failed');
      const deleteReactionChain: Record<string, ReturnType<typeof vi.fn>> = {};
      const chainable = [
        'select',
        'insert',
        'update',
        'upsert',
        'delete',
        'eq',
        'neq',
        'in',
        'not',
        'is',
        'gt',
        'gte',
        'lt',
        'lte',
        'like',
        'ilike',
        'order',
        'range',
        'limit',
        'maybeSingle',
      ];
      for (const method of chainable) {
        deleteReactionChain[method] = vi.fn().mockReturnValue(deleteReactionChain);
      }
      // biome-ignore lint/suspicious/noThenProperty: intentionally testing thenable
      deleteReactionChain.then = vi.fn((_resolve: unknown, reject: (err: unknown) => void) => {
        reject(failError);
      });

      let callsToFrom = 0;
      mockFrom.mockImplementation((table: string) => {
        if (table === 'song_reactions') {
          callsToFrom += 1;
          if (callsToFrom === 1) return existingCheck.chain;
          return deleteReactionChain;
        }
        return {};
      });

      const req = makePostRequest('/api/music/library/react', {
        url: 'https://spotify.com/track/delete-fail',
        emoji: '🔥',
      });
      const res = await POST(req);

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: 'Failed to toggle reaction' });
    });

    it('returns 500 when insert reaction fails', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
      mockIsMusicUrl.mockReturnValue('spotify');

      const songId = VALID_UUID;
      mockUpsertSong.mockResolvedValue({ id: songId, isNew: true });

      const existingCheck = chainMock({ data: null });

      // Create a chain that rejects when awaited
      const failError = new Error('Insert failed');
      const insertReactionChain: Record<string, ReturnType<typeof vi.fn>> = {};
      const chainable = [
        'select',
        'insert',
        'update',
        'upsert',
        'delete',
        'eq',
        'neq',
        'in',
        'not',
        'is',
        'gt',
        'gte',
        'lt',
        'lte',
        'like',
        'ilike',
        'order',
        'range',
        'limit',
        'maybeSingle',
      ];
      for (const method of chainable) {
        insertReactionChain[method] = vi.fn().mockReturnValue(insertReactionChain);
      }
      // biome-ignore lint/suspicious/noThenProperty: intentionally testing thenable
      insertReactionChain.then = vi.fn((_resolve: unknown, reject: (err: unknown) => void) => {
        reject(failError);
      });

      let callsToFrom = 0;
      mockFrom.mockImplementation((table: string) => {
        if (table === 'song_reactions') {
          callsToFrom += 1;
          if (callsToFrom === 1) return existingCheck.chain;
          return insertReactionChain;
        }
        return {};
      });

      const req = makePostRequest('/api/music/library/react', {
        url: 'https://spotify.com/track/insert-fail',
        emoji: '🔥',
      });
      const res = await POST(req);

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: 'Failed to toggle reaction' });
    });
  });
});
