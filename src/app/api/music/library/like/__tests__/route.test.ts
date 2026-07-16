import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chainMock,
  makeGetRequest,
  makePostRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
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
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/music/isMusicUrl', () => ({
  isMusicUrl: mockIsMusicUrl,
}));

vi.mock('@/lib/music/library', () => ({
  upsertSong: mockUpsertSong,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

import { GET, POST } from '../route';

// ── Test fixtures ────────────────────────────────────────────────────────────

const VALID_MUSIC_URL = 'https://spotify.com/track/abc123';
const NON_MUSIC_URL = 'https://example.com/random-page';
const INVALID_URL = 'not-a-url';

describe('GET /api/music/library/like', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
  });

  describe('authentication', () => {
    it('returns 401 when no session is present', async () => {
      mockGetSessionData.mockResolvedValue(null);

      const res = await GET(makeGetRequest('/api/music/library/like', { url: VALID_MUSIC_URL }));
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 401 when session returns null', async () => {
      mockGetSessionData.mockResolvedValue(null);

      const res = await GET(makeGetRequest('/api/music/library/like', { url: VALID_MUSIC_URL }));

      expect(res.status).toBe(401);
    });
  });

  describe('request validation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('returns 400 when url parameter is missing', async () => {
      const res = await GET(makeGetRequest('/api/music/library/like'));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Missing url parameter');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 400 when url parameter is empty string', async () => {
      const res = await GET(makeGetRequest('/api/music/library/like', { url: '' }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Missing url parameter');
    });
  });

  describe('song not found path', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('returns 200 with liked=false and empty likers when song does not exist', async () => {
      const mock = chainMock({
        data: null,
      });
      mockFrom.mockImplementation(mock.handler);

      const res = await GET(makeGetRequest('/api/music/library/like', { url: VALID_MUSIC_URL }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.liked).toBe(false);
      expect(body.likeCount).toBe(0);
      expect(body.likers).toEqual([]);
      expect(mockFrom).toHaveBeenCalledWith('songs');
    });

    it('queries songs table with correct url filter when song not found', async () => {
      const mock = chainMock({
        data: null,
      });
      mockFrom.mockImplementation(mock.handler);

      await GET(makeGetRequest('/api/music/library/like', { url: VALID_MUSIC_URL }));

      const eqCalls = mock.chain.eq.mock.calls;
      expect(eqCalls).toContainEqual(['url', VALID_MUSIC_URL]);
    });

    it('uses maybeSingle when fetching song', async () => {
      const mock = chainMock({
        data: null,
      });
      mockFrom.mockImplementation(mock.handler);

      await GET(makeGetRequest('/api/music/library/like', { url: VALID_MUSIC_URL }));

      const maybeSingleCalls = mock.chain.maybeSingle.mock.calls;
      expect(maybeSingleCalls.length).toBeGreaterThan(0);
    });
  });

  describe('song exists - liked path', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('returns 200 with liked=true when user has liked the song', async () => {
      const songsChainMock = chainMock({
        data: { id: 'song-123' },
      });

      const likeCheckChainMock = chainMock({
        data: { id: 'like-123' },
      });

      const countChainMock = chainMock({
        count: 5,
      });

      const likersChainMock = chainMock({
        data: [],
      });

      let callCount = 0;
      mockFrom.mockImplementation((table) => {
        if (table === 'songs') return songsChainMock.handler();
        if (table === 'user_song_likes') {
          callCount++;
          if (callCount === 1) return likeCheckChainMock.handler();
          if (callCount === 2) return countChainMock.handler();
          return likersChainMock.handler();
        }
        return chainMock({}).handler();
      });

      const res = await GET(makeGetRequest('/api/music/library/like', { url: VALID_MUSIC_URL }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.liked).toBe(true);
      expect(body.likeCount).toBe(5);
    });

    it('returns 200 with liked=false when user has not liked the song', async () => {
      const songsChainMock = chainMock({
        data: { id: 'song-123' },
      });

      const likeCheckChainMock = chainMock({
        data: null,
      });

      const countChainMock = chainMock({
        count: 3,
      });

      const likersChainMock = chainMock({
        data: [],
      });

      let callCount = 0;
      mockFrom.mockImplementation((table) => {
        if (table === 'songs') return songsChainMock.handler();
        if (table === 'user_song_likes') {
          callCount++;
          if (callCount === 1) return likeCheckChainMock.handler();
          if (callCount === 2) return countChainMock.handler();
          return likersChainMock.handler();
        }
        return chainMock({}).handler();
      });

      const res = await GET(makeGetRequest('/api/music/library/like', { url: VALID_MUSIC_URL }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.liked).toBe(false);
      expect(body.likeCount).toBe(3);
    });

    it('returns correct likeCount when fetched via parallel query', async () => {
      const songsChainMock = chainMock({
        data: { id: 'song-123' },
      });

      const likeCheckChainMock = chainMock({
        data: null,
      });

      const countChainMock = chainMock({
        count: 42,
      });

      const likersChainMock = chainMock({
        data: [],
      });

      let callCount = 0;
      mockFrom.mockImplementation((table) => {
        if (table === 'songs') return songsChainMock.handler();
        if (table === 'user_song_likes') {
          callCount++;
          if (callCount === 1) return likeCheckChainMock.handler();
          if (callCount === 2) return countChainMock.handler();
          return likersChainMock.handler();
        }
        return chainMock({}).handler();
      });

      const res = await GET(makeGetRequest('/api/music/library/like', { url: VALID_MUSIC_URL }));
      const body = await res.json();

      expect(body.likeCount).toBe(42);
    });
  });

  describe('likers resolution', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('returns empty likers array when no likers exist', async () => {
      const songsChainMock = chainMock({
        data: { id: 'song-123' },
      });

      const likeCheckChainMock = chainMock({
        data: null,
      });

      const countChainMock = chainMock({
        count: 0,
      });

      const likersChainMock = chainMock({
        data: [],
      });

      let callCount = 0;
      mockFrom.mockImplementation((table) => {
        if (table === 'songs') return songsChainMock.handler();
        if (table === 'user_song_likes') {
          callCount++;
          if (callCount === 1) return likeCheckChainMock.handler();
          if (callCount === 2) return countChainMock.handler();
          return likersChainMock.handler();
        }
        return chainMock({}).handler();
      });

      const res = await GET(makeGetRequest('/api/music/library/like', { url: VALID_MUSIC_URL }));
      const body = await res.json();

      expect(body.likers).toEqual([]);
    });

    it('fetches user details for likers from users table', async () => {
      const songsChainMock = chainMock({
        data: { id: 'song-123' },
      });

      const likeCheckChainMock = chainMock({
        data: null,
      });

      const countChainMock = chainMock({
        count: 2,
      });

      const likersChainMock = chainMock({
        data: [{ user_fid: 456 }, { user_fid: 789 }],
      });

      const usersChainMock = chainMock({
        data: [
          { fid: 456, username: 'user1', display_name: 'User One' },
          { fid: 789, username: 'user2', display_name: 'User Two' },
        ],
      });

      let callCount = 0;
      mockFrom.mockImplementation((table) => {
        if (table === 'songs') return songsChainMock.handler();
        if (table === 'user_song_likes') {
          callCount++;
          if (callCount === 1) return likeCheckChainMock.handler();
          if (callCount === 2) return countChainMock.handler();
          return likersChainMock.handler();
        }
        if (table === 'users') return usersChainMock.handler();
        return chainMock({}).handler();
      });

      const res = await GET(makeGetRequest('/api/music/library/like', { url: VALID_MUSIC_URL }));
      const body = await res.json();

      expect(body.likers).toHaveLength(2);
      expect(body.likers[0]).toMatchObject({
        fid: 456,
        username: 'user1',
        displayName: 'User One',
      });
      expect(body.likers[1]).toMatchObject({
        fid: 789,
        username: 'user2',
        displayName: 'User Two',
      });
    });

    it('filters out likers without username', async () => {
      const songsChainMock = chainMock({
        data: { id: 'song-123' },
      });

      const likeCheckChainMock = chainMock({
        data: null,
      });

      const countChainMock = chainMock({
        count: 2,
      });

      const likersChainMock = chainMock({
        data: [{ user_fid: 456 }, { user_fid: 789 }],
      });

      const usersChainMock = chainMock({
        data: [
          { fid: 456, username: 'user1', display_name: 'User One' },
          { fid: 789, username: '', display_name: null },
        ],
      });

      let callCount = 0;
      mockFrom.mockImplementation((table) => {
        if (table === 'songs') return songsChainMock.handler();
        if (table === 'user_song_likes') {
          callCount++;
          if (callCount === 1) return likeCheckChainMock.handler();
          if (callCount === 2) return countChainMock.handler();
          return likersChainMock.handler();
        }
        if (table === 'users') return usersChainMock.handler();
        return chainMock({}).handler();
      });

      const res = await GET(makeGetRequest('/api/music/library/like', { url: VALID_MUSIC_URL }));
      const body = await res.json();

      expect(body.likers).toHaveLength(1);
      expect(body.likers[0].fid).toBe(456);
    });

    it('orders likers by most recent first', async () => {
      const songsChainMock = chainMock({
        data: { id: 'song-123' },
      });

      const likeCheckChainMock = chainMock({
        data: null,
      });

      const countChainMock = chainMock({
        count: 2,
      });

      const likersChainMock = chainMock({
        data: [{ user_fid: 789 }, { user_fid: 456 }],
      });

      const usersChainMock = chainMock({
        data: [
          { fid: 456, username: 'user1', display_name: 'User One' },
          { fid: 789, username: 'user2', display_name: 'User Two' },
        ],
      });

      let callCount = 0;
      mockFrom.mockImplementation((table) => {
        if (table === 'songs') return songsChainMock.handler();
        if (table === 'user_song_likes') {
          callCount++;
          if (callCount === 1) return likeCheckChainMock.handler();
          if (callCount === 2) return countChainMock.handler();
          return likersChainMock.handler();
        }
        if (table === 'users') return usersChainMock.handler();
        return chainMock({}).handler();
      });

      const res = await GET(makeGetRequest('/api/music/library/like', { url: VALID_MUSIC_URL }));
      const body = await res.json();

      // Order should be preserved from likersChainMock (789, 456)
      expect(body.likers[0].fid).toBe(789);
      expect(body.likers[1].fid).toBe(456);
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('returns 500 when initial song lookup throws', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const res = await GET(makeGetRequest('/api/music/library/like', { url: VALID_MUSIC_URL }));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to check like status');
    });

    it('logs error when initial song lookup throws', async () => {
      const { logger } = await import('@/lib/logger');
      mockFrom.mockImplementation(() => {
        throw new Error('DB error');
      });

      await GET(makeGetRequest('/api/music/library/like', { url: VALID_MUSIC_URL }));

      expect(logger.error).toHaveBeenCalledWith('[like] GET failed:', expect.any(Object));
    });

    it('recovers when parallel queries fail gracefully with allSettled', async () => {
      const songsChainMock = chainMock({
        data: { id: 'song-123' },
      });

      const likeCheckChainMock = chainMock({
        data: null,
      });

      const failingMock = chainMock({
        error: { message: 'Query failed' },
        data: null,
      });

      let callCount = 0;
      mockFrom.mockImplementation((table) => {
        if (table === 'songs') return songsChainMock.handler();
        if (table === 'user_song_likes') {
          callCount++;
          if (callCount === 1) return likeCheckChainMock.handler();
          // Subsequent queries fail but allSettled handles it
          return failingMock.handler();
        }
        return chainMock({}).handler();
      });

      const res = await GET(makeGetRequest('/api/music/library/like', { url: VALID_MUSIC_URL }));
      const body = await res.json();

      // Should still return valid response with defaults for failed queries
      expect(res.status).toBe(200);
      expect(body.liked).toBe(false);
      expect(body.likeCount).toBe(0);
    });
  });
});

describe('POST /api/music/library/like', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
  });

  describe('authentication', () => {
    it('returns 401 when no session is present', async () => {
      mockGetSessionData.mockResolvedValue(null);

      const res = await POST(
        makePostRequest('/api/music/library/like', {
          url: VALID_MUSIC_URL,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 401 when session returns null', async () => {
      mockGetSessionData.mockResolvedValue(null);

      const res = await POST(
        makePostRequest('/api/music/library/like', {
          url: VALID_MUSIC_URL,
        }),
      );

      expect(res.status).toBe(401);
    });
  });

  describe('Zod validation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('returns 400 when url is not a valid URL', async () => {
      const res = await POST(
        makePostRequest('/api/music/library/like', {
          url: INVALID_URL,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
      expect(mockUpsertSong).not.toHaveBeenCalled();
    });

    it('returns 400 when url exceeds 500 characters', async () => {
      const longUrl = `https://spotify.com/track/${'a'.repeat(500)}`;
      const res = await POST(
        makePostRequest('/api/music/library/like', {
          url: longUrl,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when url is missing', async () => {
      const res = await POST(makePostRequest('/api/music/library/like', {}));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('allows url with exactly 500 characters', async () => {
      const longUrl = `https://spotify.com/track/${'a'.repeat(470)}`;
      const mock = chainMock({
        data: null,
      });
      mockFrom.mockImplementation(mock.handler);
      mockIsMusicUrl.mockReturnValue('spotify');
      mockUpsertSong.mockResolvedValue({ id: 'song-123', isNew: true });

      const res = await POST(
        makePostRequest('/api/music/library/like', {
          url: longUrl,
        }),
      );

      expect(res.status).toBe(200);
    });
  });

  describe('isMusicUrl integration', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ fid: 123, username: 'testuser' }),
      );
    });

    it('calls isMusicUrl with the provided url', async () => {
      const existingMock = chainMock({
        data: null,
      });
      const countMock = chainMock({
        count: 0,
      });

      let callCount = 0;
      mockFrom.mockImplementation((table) => {
        if (table === 'user_song_likes') {
          callCount++;
          if (callCount === 1) return existingMock.handler();
          return countMock.handler();
        }
        return chainMock({}).handler();
      });

      mockIsMusicUrl.mockReturnValue('spotify');
      mockUpsertSong.mockResolvedValue({ id: 'song-123', isNew: true });

      await POST(
        makePostRequest('/api/music/library/like', {
          url: VALID_MUSIC_URL,
        }),
      );

      expect(mockIsMusicUrl).toHaveBeenCalledWith(VALID_MUSIC_URL);
    });

    it('uses isMusicUrl result as platform for upsertSong', async () => {
      const existingMock = chainMock({
        data: null,
      });
      const countMock = chainMock({
        count: 0,
      });

      let callCount = 0;
      mockFrom.mockImplementation((table) => {
        if (table === 'user_song_likes') {
          callCount++;
          if (callCount === 1) return existingMock.handler();
          return countMock.handler();
        }
        return chainMock({}).handler();
      });

      mockIsMusicUrl.mockReturnValue('youtube');
      mockUpsertSong.mockResolvedValue({ id: 'song-123', isNew: true });

      await POST(
        makePostRequest('/api/music/library/like', {
          url: VALID_MUSIC_URL,
        }),
      );

      expect(mockUpsertSong).toHaveBeenCalledWith(
        expect.objectContaining({
          platform: 'youtube',
        }),
      );
    });

    it('falls back to audio platform when isMusicUrl returns null', async () => {
      const existingMock = chainMock({
        data: null,
      });
      const countMock = chainMock({
        count: 0,
      });

      let callCount = 0;
      mockFrom.mockImplementation((table) => {
        if (table === 'user_song_likes') {
          callCount++;
          if (callCount === 1) return existingMock.handler();
          return countMock.handler();
        }
        return chainMock({}).handler();
      });

      mockIsMusicUrl.mockReturnValue(null);
      mockUpsertSong.mockResolvedValue({ id: 'song-123', isNew: true });

      await POST(
        makePostRequest('/api/music/library/like', {
          url: NON_MUSIC_URL,
        }),
      );

      expect(mockUpsertSong).toHaveBeenCalledWith(
        expect.objectContaining({
          platform: 'audio',
        }),
      );
    });
  });

  describe('upsertSong integration', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ fid: 123, username: 'testuser' }),
      );
    });

    it('calls upsertSong with url, platform, fid, and source', async () => {
      const existingMock = chainMock({
        data: null,
      });
      const countMock = chainMock({
        count: 0,
      });

      let callCount = 0;
      mockFrom.mockImplementation((table) => {
        if (table === 'user_song_likes') {
          callCount++;
          if (callCount === 1) return existingMock.handler();
          return countMock.handler();
        }
        return chainMock({}).handler();
      });

      mockIsMusicUrl.mockReturnValue('spotify');
      mockUpsertSong.mockResolvedValue({ id: 'song-123', isNew: true });

      await POST(
        makePostRequest('/api/music/library/like', {
          url: VALID_MUSIC_URL,
        }),
      );

      expect(mockUpsertSong).toHaveBeenCalledWith({
        url: VALID_MUSIC_URL,
        platform: 'spotify',
        submittedByFid: 123,
        source: 'manual',
      });
    });

    it('uses songId from upsertSong for like toggle', async () => {
      const existingMock = chainMock({
        data: null,
      });
      const countMock = chainMock({
        count: 0,
      });

      let callCount = 0;
      mockFrom.mockImplementation((table) => {
        if (table === 'user_song_likes') {
          callCount++;
          if (callCount === 1) return existingMock.handler();
          return countMock.handler();
        }
        return chainMock({}).handler();
      });

      mockIsMusicUrl.mockReturnValue('spotify');
      mockUpsertSong.mockResolvedValue({ id: 'returned-song-id-456', isNew: true });

      await POST(
        makePostRequest('/api/music/library/like', {
          url: VALID_MUSIC_URL,
        }),
      );

      const insertCalls = (mockFrom as unknown as { mock: { calls: unknown[][] } }).mock.calls;
      expect(insertCalls.some((call) => call[0] === 'user_song_likes')).toBe(true);
    });
  });

  describe('like toggle - new like', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ fid: 123, username: 'testuser' }),
      );
    });

    it('inserts new like when user has not liked before', async () => {
      const existingMock = chainMock({
        data: null,
      });
      const countMock = chainMock({
        count: 1,
      });

      let callCount = 0;
      mockFrom.mockImplementation((table) => {
        if (table === 'user_song_likes') {
          callCount++;
          if (callCount === 1) return existingMock.handler();
          return countMock.handler();
        }
        return chainMock({}).handler();
      });

      mockIsMusicUrl.mockReturnValue('spotify');
      mockUpsertSong.mockResolvedValue({ id: 'song-123', isNew: true });

      const res = await POST(
        makePostRequest('/api/music/library/like', {
          url: VALID_MUSIC_URL,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.liked).toBe(true);
    });

    it('returns updated like count after insert', async () => {
      const existingMock = chainMock({
        data: null,
      });
      const countMock = chainMock({
        count: 5,
      });

      let callCount = 0;
      mockFrom.mockImplementation((table) => {
        if (table === 'user_song_likes') {
          callCount++;
          if (callCount === 1) return existingMock.handler();
          return countMock.handler();
        }
        return chainMock({}).handler();
      });

      mockIsMusicUrl.mockReturnValue('spotify');
      mockUpsertSong.mockResolvedValue({ id: 'song-123', isNew: true });

      const res = await POST(
        makePostRequest('/api/music/library/like', {
          url: VALID_MUSIC_URL,
        }),
      );
      const body = await res.json();

      expect(body.likeCount).toBe(5);
    });
  });

  describe('like toggle - existing like (unlike)', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ fid: 123, username: 'testuser' }),
      );
    });

    it('deletes existing like when user has already liked', async () => {
      const existingMock = chainMock({
        data: { id: 'like-456' },
      });
      const countMock = chainMock({
        count: 2,
      });

      let callCount = 0;
      mockFrom.mockImplementation((table) => {
        if (table === 'user_song_likes') {
          callCount++;
          if (callCount === 1) return existingMock.handler();
          return countMock.handler();
        }
        return chainMock({}).handler();
      });

      mockIsMusicUrl.mockReturnValue('spotify');
      mockUpsertSong.mockResolvedValue({ id: 'song-123', isNew: false });

      const res = await POST(
        makePostRequest('/api/music/library/like', {
          url: VALID_MUSIC_URL,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.liked).toBe(false);
    });

    it('returns updated like count after delete', async () => {
      const existingMock = chainMock({
        data: { id: 'like-456' },
      });
      const countMock = chainMock({
        count: 2,
      });

      let callCount = 0;
      mockFrom.mockImplementation((table) => {
        if (table === 'user_song_likes') {
          callCount++;
          if (callCount === 1) return existingMock.handler();
          return countMock.handler();
        }
        return chainMock({}).handler();
      });

      mockIsMusicUrl.mockReturnValue('spotify');
      mockUpsertSong.mockResolvedValue({ id: 'song-123', isNew: false });

      const res = await POST(
        makePostRequest('/api/music/library/like', {
          url: VALID_MUSIC_URL,
        }),
      );
      const body = await res.json();

      expect(body.likeCount).toBe(2);
    });
  });

  describe('success paths', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ fid: 123, username: 'testuser' }),
      );
    });

    it('returns 200 with like state and count on success', async () => {
      const existingMock = chainMock({
        data: null,
      });
      const countMock = chainMock({
        count: 1,
      });

      let callCount = 0;
      mockFrom.mockImplementation((table) => {
        if (table === 'user_song_likes') {
          callCount++;
          if (callCount === 1) return existingMock.handler();
          return countMock.handler();
        }
        return chainMock({}).handler();
      });

      mockIsMusicUrl.mockReturnValue('spotify');
      mockUpsertSong.mockResolvedValue({ id: 'song-123', isNew: true });

      const res = await POST(
        makePostRequest('/api/music/library/like', {
          url: VALID_MUSIC_URL,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toHaveProperty('liked');
      expect(body).toHaveProperty('likeCount');
      expect(typeof body.liked).toBe('boolean');
      expect(typeof body.likeCount).toBe('number');
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ fid: 123, username: 'testuser' }),
      );
    });

    it('returns 500 when upsertSong throws', async () => {
      mockIsMusicUrl.mockReturnValue('spotify');
      mockUpsertSong.mockRejectedValue(new Error('Database error'));

      const res = await POST(
        makePostRequest('/api/music/library/like', {
          url: VALID_MUSIC_URL,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to toggle like');
    });

    it('returns 500 when toggle operation throws', async () => {
      mockIsMusicUrl.mockReturnValue('spotify');
      mockUpsertSong.mockResolvedValue({ id: 'song-123', isNew: true });

      mockFrom.mockImplementation(() => {
        throw new Error('Insert failed');
      });

      const res = await POST(
        makePostRequest('/api/music/library/like', {
          url: VALID_MUSIC_URL,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to toggle like');
    });

    it('logs error when upsertSong throws', async () => {
      const { logger } = await import('@/lib/logger');
      const error = new Error('Song upsert failed');
      mockIsMusicUrl.mockReturnValue('spotify');
      mockUpsertSong.mockRejectedValue(error);

      await POST(
        makePostRequest('/api/music/library/like', {
          url: VALID_MUSIC_URL,
        }),
      );

      expect(logger.error).toHaveBeenCalledWith('[like] POST failed:', expect.any(Object));
    });

    it('logs error when toggle operation throws', async () => {
      const { logger } = await import('@/lib/logger');
      mockIsMusicUrl.mockReturnValue('spotify');
      mockUpsertSong.mockResolvedValue({ id: 'song-123', isNew: true });

      mockFrom.mockImplementation(() => {
        throw new Error('Insert failed');
      });

      await POST(
        makePostRequest('/api/music/library/like', {
          url: VALID_MUSIC_URL,
        }),
      );

      expect(logger.error).toHaveBeenCalledWith('[like] POST failed:', expect.any(Object));
    });
  });
});
