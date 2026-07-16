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

import { DELETE, GET, POST } from '../route';

// ── Test fixtures ────────────────────────────────────────────────────────────

const SAMPLE_COMMENT = {
  id: 'comment-123',
  username: 'testuser',
  comment: 'Great track!',
  timestamp_ms: 5000,
  created_at: '2026-07-15T10:00:00Z',
};

const SAMPLE_COMMENT_2 = {
  id: 'comment-456',
  username: 'anotheruser',
  comment: 'Love this part',
  timestamp_ms: 15000,
  created_at: '2026-07-15T10:05:00Z',
};

const VALID_MUSIC_URL = 'https://spotify.com/track/abc123';
const INVALID_URL = 'not-a-url';
const NON_MUSIC_URL = 'https://example.com/random-page';

describe('GET /api/music/comments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
  });

  describe('request validation', () => {
    it('returns 400 when url parameter is missing', async () => {
      const res = await GET(makeGetRequest('/api/music/comments'));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Missing url parameter');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 400 when url parameter is empty string', async () => {
      const res = await GET(makeGetRequest('/api/music/comments', { url: '' }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Missing url parameter');
    });
  });

  describe('success paths', () => {
    it('returns 200 with empty array when song does not exist', async () => {
      const mock = chainMock({
        data: null,
      });
      mockFrom.mockImplementation(mock.handler);

      const res = await GET(makeGetRequest('/api/music/comments', { url: VALID_MUSIC_URL }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.comments).toEqual([]);
      expect(mockFrom).toHaveBeenCalledWith('songs');
    });

    it('returns 200 with comments list when song exists', async () => {
      const songsChainMock = chainMock({
        data: { id: 'song-123' },
      });
      const commentsChainMock = chainMock({
        data: [SAMPLE_COMMENT, SAMPLE_COMMENT_2],
      });

      mockFrom.mockImplementation((table) => {
        if (table === 'songs') return songsChainMock.handler();
        return commentsChainMock.handler();
      });

      const res = await GET(makeGetRequest('/api/music/comments', { url: VALID_MUSIC_URL }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.comments).toHaveLength(2);
      expect(body.comments[0]).toMatchObject({
        id: SAMPLE_COMMENT.id,
        username: SAMPLE_COMMENT.username,
        comment: SAMPLE_COMMENT.comment,
        timestampMs: SAMPLE_COMMENT.timestamp_ms,
        createdAt: SAMPLE_COMMENT.created_at,
      });
    });

    it('orders comments by timestamp ascending', async () => {
      const songsChainMock = chainMock({
        data: { id: 'song-123' },
      });
      const commentsChainMock = chainMock({
        data: [SAMPLE_COMMENT, SAMPLE_COMMENT_2],
      });

      mockFrom.mockImplementation((table) => {
        if (table === 'songs') return songsChainMock.handler();
        return commentsChainMock.handler();
      });

      await GET(makeGetRequest('/api/music/comments', { url: VALID_MUSIC_URL }));

      const orderCalls = commentsChainMock.chain.order.mock.calls;
      expect(orderCalls).toContainEqual(['timestamp_ms', { ascending: true }]);
    });

    it('queries songs table with correct url filter', async () => {
      const songsChainMock = chainMock({
        data: null,
      });
      mockFrom.mockImplementation(songsChainMock.handler);

      await GET(makeGetRequest('/api/music/comments', { url: VALID_MUSIC_URL }));

      const eqCalls = songsChainMock.chain.eq.mock.calls;
      expect(eqCalls).toContainEqual(['url', VALID_MUSIC_URL]);
    });

    it('uses maybeSingle when fetching song', async () => {
      const songsChainMock = chainMock({
        data: null,
      });
      mockFrom.mockImplementation(songsChainMock.handler);

      await GET(makeGetRequest('/api/music/comments', { url: VALID_MUSIC_URL }));

      const maybeSingleCalls = songsChainMock.chain.maybeSingle.mock.calls;
      expect(maybeSingleCalls.length).toBeGreaterThan(0);
    });

    it('handles null comments gracefully', async () => {
      const songsChainMock = chainMock({
        data: { id: 'song-123' },
      });
      const commentsChainMock = chainMock({
        data: null,
      });

      mockFrom.mockImplementation((table) => {
        if (table === 'songs') return songsChainMock.handler();
        return commentsChainMock.handler();
      });

      const res = await GET(makeGetRequest('/api/music/comments', { url: VALID_MUSIC_URL }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.comments).toEqual([]);
    });

    it('transforms snake_case to camelCase in response', async () => {
      const songsChainMock = chainMock({
        data: { id: 'song-123' },
      });
      const commentsChainMock = chainMock({
        data: [
          {
            id: 'c1',
            username: 'user1',
            comment: 'test',
            timestamp_ms: 1000,
            created_at: '2026-07-15T10:00:00Z',
          },
        ],
      });

      mockFrom.mockImplementation((table) => {
        if (table === 'songs') return songsChainMock.handler();
        return commentsChainMock.handler();
      });

      const res = await GET(makeGetRequest('/api/music/comments', { url: VALID_MUSIC_URL }));
      const body = await res.json();

      expect(body.comments[0]).toHaveProperty('timestampMs');
      expect(body.comments[0]).toHaveProperty('createdAt');
      expect(body.comments[0]).not.toHaveProperty('timestamp_ms');
      expect(body.comments[0]).not.toHaveProperty('created_at');
    });
  });

  describe('error handling', () => {
    it('returns 500 when supabase comments query fails', async () => {
      const songsChainMock = chainMock({
        data: { id: 'song-123' },
      });
      const commentsChainMock = chainMock({
        error: { message: 'Database error' },
        data: null,
      });

      mockFrom.mockImplementation((table) => {
        if (table === 'songs') return songsChainMock.handler();
        return commentsChainMock.handler();
      });

      const res = await GET(makeGetRequest('/api/music/comments', { url: VALID_MUSIC_URL }));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to fetch comments');
    });

    it('logs error when comments query fails', async () => {
      const { logger } = await import('@/lib/logger');
      const songsChainMock = chainMock({
        data: { id: 'song-123' },
      });
      const commentsChainMock = chainMock({
        error: { message: 'DB error' },
        data: null,
      });

      mockFrom.mockImplementation((table) => {
        if (table === 'songs') return songsChainMock.handler();
        return commentsChainMock.handler();
      });

      await GET(makeGetRequest('/api/music/comments', { url: VALID_MUSIC_URL }));

      expect(logger.error).toHaveBeenCalledWith(
        '[comments] GET failed:',
        expect.objectContaining({ message: 'DB error' }),
      );
    });
  });
});

describe('POST /api/music/comments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
  });

  describe('authentication', () => {
    it('returns 401 when no session is present', async () => {
      mockGetSessionData.mockResolvedValue(null);

      const res = await POST(
        makePostRequest('/api/music/comments', {
          url: VALID_MUSIC_URL,
          comment: 'Great track!',
          timestampMs: 5000,
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
        makePostRequest('/api/music/comments', {
          url: VALID_MUSIC_URL,
          comment: 'Great',
          timestampMs: 0,
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
        makePostRequest('/api/music/comments', {
          url: INVALID_URL,
          comment: 'Great track!',
          timestampMs: 5000,
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
        makePostRequest('/api/music/comments', {
          url: longUrl,
          comment: 'Great track!',
          timestampMs: 5000,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when comment is empty string', async () => {
      const res = await POST(
        makePostRequest('/api/music/comments', {
          url: VALID_MUSIC_URL,
          comment: '',
          timestampMs: 5000,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when comment exceeds 280 characters', async () => {
      const longComment = 'a'.repeat(281);
      const res = await POST(
        makePostRequest('/api/music/comments', {
          url: VALID_MUSIC_URL,
          comment: longComment,
          timestampMs: 5000,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('allows comment with exactly 280 characters', async () => {
      const exactComment = 'a'.repeat(280);
      const mock = chainMock({
        data: { id: 'song-123' },
      });
      mockFrom.mockImplementation(mock.handler);
      mockIsMusicUrl.mockReturnValue('spotify');
      mockUpsertSong.mockResolvedValue({ id: 'song-123' });

      const res = await POST(
        makePostRequest('/api/music/comments', {
          url: VALID_MUSIC_URL,
          comment: exactComment,
          timestampMs: 5000,
        }),
      );

      expect(res.status).toBe(200);
    });

    it('returns 400 when timestampMs is negative', async () => {
      const res = await POST(
        makePostRequest('/api/music/comments', {
          url: VALID_MUSIC_URL,
          comment: 'Great track!',
          timestampMs: -1,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when timestampMs is not an integer', async () => {
      const res = await POST(
        makePostRequest('/api/music/comments', {
          url: VALID_MUSIC_URL,
          comment: 'Great track!',
          timestampMs: 5000.5,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('allows timestampMs of 0', async () => {
      const mock = chainMock({
        data: { id: 'song-123' },
      });
      mockFrom.mockImplementation(mock.handler);
      mockIsMusicUrl.mockReturnValue('spotify');
      mockUpsertSong.mockResolvedValue({ id: 'song-123' });

      const res = await POST(
        makePostRequest('/api/music/comments', {
          url: VALID_MUSIC_URL,
          comment: 'Comment',
          timestampMs: 0,
        }),
      );

      expect(res.status).toBe(200);
    });

    it('returns 400 when url is missing', async () => {
      const res = await POST(
        makePostRequest('/api/music/comments', {
          comment: 'Great track!',
          timestampMs: 5000,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when comment is missing', async () => {
      const res = await POST(
        makePostRequest('/api/music/comments', {
          url: VALID_MUSIC_URL,
          timestampMs: 5000,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when timestampMs is missing', async () => {
      const res = await POST(
        makePostRequest('/api/music/comments', {
          url: VALID_MUSIC_URL,
          comment: 'Great track!',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });
  });

  describe('isMusicUrl integration', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ fid: 123, username: 'testuser' }),
      );
    });

    it('calls isMusicUrl with the provided url', async () => {
      const usersChainMock = chainMock({ data: null });
      const commentsChainMock = chainMock({
        data: SAMPLE_COMMENT,
      });

      mockFrom.mockImplementation((table) => {
        if (table === 'users') return usersChainMock.handler();
        return commentsChainMock.handler();
      });

      mockIsMusicUrl.mockReturnValue('spotify');
      mockUpsertSong.mockResolvedValue({ id: 'song-123' });

      await POST(
        makePostRequest('/api/music/comments', {
          url: VALID_MUSIC_URL,
          comment: 'Great!',
          timestampMs: 5000,
        }),
      );

      expect(mockIsMusicUrl).toHaveBeenCalledWith(VALID_MUSIC_URL);
    });

    it('uses isMusicUrl result as platform for upsertSong', async () => {
      const usersChainMock = chainMock({ data: null });
      const commentsChainMock = chainMock({
        data: SAMPLE_COMMENT,
      });

      mockFrom.mockImplementation((table) => {
        if (table === 'users') return usersChainMock.handler();
        return commentsChainMock.handler();
      });

      mockIsMusicUrl.mockReturnValue('youtube');
      mockUpsertSong.mockResolvedValue({ id: 'song-123' });

      await POST(
        makePostRequest('/api/music/comments', {
          url: VALID_MUSIC_URL,
          comment: 'Great!',
          timestampMs: 5000,
        }),
      );

      expect(mockUpsertSong).toHaveBeenCalledWith(
        expect.objectContaining({
          platform: 'youtube',
        }),
      );
    });

    it('falls back to audio platform when isMusicUrl returns null', async () => {
      const usersChainMock = chainMock({ data: null });
      const commentsChainMock = chainMock({
        data: SAMPLE_COMMENT,
      });

      mockFrom.mockImplementation((table) => {
        if (table === 'users') return usersChainMock.handler();
        return commentsChainMock.handler();
      });

      mockIsMusicUrl.mockReturnValue(null);
      mockUpsertSong.mockResolvedValue({ id: 'song-123' });

      await POST(
        makePostRequest('/api/music/comments', {
          url: NON_MUSIC_URL,
          comment: 'Nice!',
          timestampMs: 5000,
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
      const usersChainMock = chainMock({ data: null });
      const commentsChainMock = chainMock({
        data: SAMPLE_COMMENT,
      });

      mockFrom.mockImplementation((table) => {
        if (table === 'users') return usersChainMock.handler();
        return commentsChainMock.handler();
      });

      mockIsMusicUrl.mockReturnValue('spotify');
      mockUpsertSong.mockResolvedValue({ id: 'song-123' });

      await POST(
        makePostRequest('/api/music/comments', {
          url: VALID_MUSIC_URL,
          comment: 'Great!',
          timestampMs: 5000,
        }),
      );

      expect(mockUpsertSong).toHaveBeenCalledWith({
        url: VALID_MUSIC_URL,
        platform: 'spotify',
        submittedByFid: 123,
        source: 'manual',
      });
    });

    it('uses songId from upsertSong for comment insertion', async () => {
      const usersChainMock = chainMock({ data: null });
      const commentsChainMock = chainMock({
        data: SAMPLE_COMMENT,
      });

      mockFrom.mockImplementation((table) => {
        if (table === 'users') return usersChainMock.handler();
        return commentsChainMock.handler();
      });

      mockIsMusicUrl.mockReturnValue('spotify');
      mockUpsertSong.mockResolvedValue({ id: 'returned-song-id-456' });

      await POST(
        makePostRequest('/api/music/comments', {
          url: VALID_MUSIC_URL,
          comment: 'Awesome!',
          timestampMs: 5000,
        }),
      );

      const insertCalls = commentsChainMock.chain.insert.mock.calls;
      expect(insertCalls[0][0]).toMatchObject({
        song_id: 'returned-song-id-456',
      });
    });
  });

  describe('username resolution', () => {
    it('uses session username if available', async () => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ fid: 123, username: 'sessionuser' }),
      );

      const usersChainMock = chainMock({ data: null });
      const commentsChainMock = chainMock({
        data: SAMPLE_COMMENT,
      });

      mockFrom.mockImplementation((table) => {
        if (table === 'users') return usersChainMock.handler();
        return commentsChainMock.handler();
      });

      mockIsMusicUrl.mockReturnValue('spotify');
      mockUpsertSong.mockResolvedValue({ id: 'song-123' });

      await POST(
        makePostRequest('/api/music/comments', {
          url: VALID_MUSIC_URL,
          comment: 'Great!',
          timestampMs: 5000,
        }),
      );

      const insertCalls = commentsChainMock.chain.insert.mock.calls;
      expect(insertCalls[0][0].username).toBe('sessionuser');
    });

    it('fetches username from users table when not in session', async () => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ fid: 123, username: undefined }),
      );

      const usersChainMock = chainMock({
        data: { username: 'db-username' },
      });
      const commentsChainMock = chainMock({
        data: SAMPLE_COMMENT,
      });

      mockFrom.mockImplementation((table) => {
        if (table === 'users') return usersChainMock.handler();
        return commentsChainMock.handler();
      });

      mockIsMusicUrl.mockReturnValue('spotify');
      mockUpsertSong.mockResolvedValue({ id: 'song-123' });

      await POST(
        makePostRequest('/api/music/comments', {
          url: VALID_MUSIC_URL,
          comment: 'Great!',
          timestampMs: 5000,
        }),
      );

      const insertCalls = commentsChainMock.chain.insert.mock.calls;
      expect(insertCalls[0][0].username).toBe('db-username');
    });

    it('falls back to fid string when username not found', async () => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ fid: 789, username: undefined }),
      );

      const usersChainMock = chainMock({ data: null });
      const commentsChainMock = chainMock({
        data: SAMPLE_COMMENT,
      });

      mockFrom.mockImplementation((table) => {
        if (table === 'users') return usersChainMock.handler();
        return commentsChainMock.handler();
      });

      mockIsMusicUrl.mockReturnValue('spotify');
      mockUpsertSong.mockResolvedValue({ id: 'song-123' });

      await POST(
        makePostRequest('/api/music/comments', {
          url: VALID_MUSIC_URL,
          comment: 'Great!',
          timestampMs: 5000,
        }),
      );

      const insertCalls = commentsChainMock.chain.insert.mock.calls;
      expect(insertCalls[0][0].username).toBe('fid:789');
    });

    it('queries users table with correct fid filter', async () => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ fid: 999, username: undefined }),
      );

      const usersChainMock = chainMock({ data: null });
      const commentsChainMock = chainMock({
        data: SAMPLE_COMMENT,
      });

      mockFrom.mockImplementation((table) => {
        if (table === 'users') return usersChainMock.handler();
        return commentsChainMock.handler();
      });

      mockIsMusicUrl.mockReturnValue('spotify');
      mockUpsertSong.mockResolvedValue({ id: 'song-123' });

      await POST(
        makePostRequest('/api/music/comments', {
          url: VALID_MUSIC_URL,
          comment: 'Great!',
          timestampMs: 5000,
        }),
      );

      const eqCalls = usersChainMock.chain.eq.mock.calls;
      expect(eqCalls).toContainEqual(['fid', 999]);
    });
  });

  describe('success paths', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ fid: 123, username: 'testuser' }),
      );
    });

    it('returns 200 with inserted comment on success', async () => {
      const usersChainMock = chainMock({ data: null });
      const commentsChainMock = chainMock({
        data: SAMPLE_COMMENT,
      });

      mockFrom.mockImplementation((table) => {
        if (table === 'users') return usersChainMock.handler();
        return commentsChainMock.handler();
      });

      mockIsMusicUrl.mockReturnValue('spotify');
      mockUpsertSong.mockResolvedValue({ id: 'song-123' });

      const res = await POST(
        makePostRequest('/api/music/comments', {
          url: VALID_MUSIC_URL,
          comment: 'Great track!',
          timestampMs: 5000,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.comment).toBeDefined();
      expect(body.comment.id).toBe(SAMPLE_COMMENT.id);
    });

    it('transforms response from snake_case to camelCase', async () => {
      const usersChainMock = chainMock({ data: null });
      const commentsChainMock = chainMock({
        data: {
          id: 'c1',
          username: 'user',
          comment: 'test',
          timestamp_ms: 1000,
          created_at: '2026-07-15T10:00:00Z',
        },
      });

      mockFrom.mockImplementation((table) => {
        if (table === 'users') return usersChainMock.handler();
        return commentsChainMock.handler();
      });

      mockIsMusicUrl.mockReturnValue('spotify');
      mockUpsertSong.mockResolvedValue({ id: 'song-123' });

      const res = await POST(
        makePostRequest('/api/music/comments', {
          url: VALID_MUSIC_URL,
          comment: 'Great!',
          timestampMs: 5000,
        }),
      );
      const body = await res.json();

      expect(body.comment).toHaveProperty('timestampMs');
      expect(body.comment).toHaveProperty('createdAt');
      expect(body.comment).not.toHaveProperty('timestamp_ms');
      expect(body.comment).not.toHaveProperty('created_at');
    });

    it('inserts comment with correct fields', async () => {
      const usersChainMock = chainMock({ data: null });
      const commentsChainMock = chainMock({
        data: SAMPLE_COMMENT,
      });

      mockFrom.mockImplementation((table) => {
        if (table === 'users') return usersChainMock.handler();
        return commentsChainMock.handler();
      });

      mockIsMusicUrl.mockReturnValue('spotify');
      mockUpsertSong.mockResolvedValue({ id: 'song-123' });

      await POST(
        makePostRequest('/api/music/comments', {
          url: VALID_MUSIC_URL,
          comment: 'Perfect song!',
          timestampMs: 12345,
        }),
      );

      const insertCalls = commentsChainMock.chain.insert.mock.calls;
      expect(insertCalls[0][0]).toMatchObject({
        song_id: 'song-123',
        user_fid: 123,
        username: 'testuser',
        comment: 'Perfect song!',
        timestamp_ms: 12345,
      });
    });

    it('calls select and single on insert', async () => {
      const usersChainMock = chainMock({ data: null });
      const commentsChainMock = chainMock({
        data: SAMPLE_COMMENT,
      });

      mockFrom.mockImplementation((table) => {
        if (table === 'users') return usersChainMock.handler();
        return commentsChainMock.handler();
      });

      mockIsMusicUrl.mockReturnValue('spotify');
      mockUpsertSong.mockResolvedValue({ id: 'song-123' });

      await POST(
        makePostRequest('/api/music/comments', {
          url: VALID_MUSIC_URL,
          comment: 'Awesome!',
          timestampMs: 5000,
        }),
      );

      const selectCalls = commentsChainMock.chain.select.mock.calls;
      const singleCalls = commentsChainMock.chain.single.mock.calls;

      expect(selectCalls).toBeDefined();
      expect(selectCalls.length).toBeGreaterThan(0);
      expect(singleCalls).toBeDefined();
      expect(singleCalls.length).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ fid: 123, username: 'testuser' }),
      );
    });

    it('returns 500 when upsertSong throws', async () => {
      const usersChainMock = chainMock({ data: null });
      const commentsChainMock = chainMock({
        data: SAMPLE_COMMENT,
      });

      mockFrom.mockImplementation((table) => {
        if (table === 'users') return usersChainMock.handler();
        return commentsChainMock.handler();
      });

      mockIsMusicUrl.mockReturnValue('spotify');
      mockUpsertSong.mockRejectedValue(new Error('Database error'));

      const res = await POST(
        makePostRequest('/api/music/comments', {
          url: VALID_MUSIC_URL,
          comment: 'Great!',
          timestampMs: 5000,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to add comment');
    });

    it('returns 500 when comment insert fails', async () => {
      const usersChainMock = chainMock({ data: null });
      const commentsChainMock = chainMock({
        error: { message: 'Insert constraint failed' },
        data: null,
      });

      mockFrom.mockImplementation((table) => {
        if (table === 'users') return usersChainMock.handler();
        return commentsChainMock.handler();
      });

      mockIsMusicUrl.mockReturnValue('spotify');
      mockUpsertSong.mockResolvedValue({ id: 'song-123' });

      const res = await POST(
        makePostRequest('/api/music/comments', {
          url: VALID_MUSIC_URL,
          comment: 'Great!',
          timestampMs: 5000,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to add comment');
    });

    it('logs error when insert fails', async () => {
      const { logger } = await import('@/lib/logger');
      const dbError = { message: 'Insert failed' };
      const usersChainMock = chainMock({ data: null });
      const commentsChainMock = chainMock({
        error: dbError,
        data: null,
      });

      mockFrom.mockImplementation((table) => {
        if (table === 'users') return usersChainMock.handler();
        return commentsChainMock.handler();
      });

      mockIsMusicUrl.mockReturnValue('spotify');
      mockUpsertSong.mockResolvedValue({ id: 'song-123' });

      await POST(
        makePostRequest('/api/music/comments', {
          url: VALID_MUSIC_URL,
          comment: 'Great!',
          timestampMs: 5000,
        }),
      );

      expect(logger.error).toHaveBeenCalledWith('[comments] POST failed:', expect.any(Object));
    });

    it('logs error when upsertSong throws', async () => {
      const { logger } = await import('@/lib/logger');
      const error = new Error('Song upsert failed');
      mockIsMusicUrl.mockReturnValue('spotify');
      mockUpsertSong.mockRejectedValue(error);

      await POST(
        makePostRequest('/api/music/comments', {
          url: VALID_MUSIC_URL,
          comment: 'Great!',
          timestampMs: 5000,
        }),
      );

      expect(logger.error).toHaveBeenCalledWith('[comments] POST failed:', expect.any(Object));
    });
  });
});

describe('DELETE /api/music/comments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
  });

  describe('authentication', () => {
    it('returns 401 when no session is present', async () => {
      mockGetSessionData.mockResolvedValue(null);

      const res = await DELETE(makeGetRequest('/api/music/comments', { id: 'comment-123' }));
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('request validation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('returns 400 when id parameter is missing', async () => {
      const res = await DELETE(makeGetRequest('/api/music/comments'));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Missing id parameter');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 400 when id parameter is empty string', async () => {
      const res = await DELETE(makeGetRequest('/api/music/comments', { id: '' }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Missing id parameter');
    });
  });

  describe('authorization', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123, isAdmin: false }));
    });

    it('returns 404 when comment does not exist', async () => {
      const mock = chainMock({
        data: null,
      });
      mockFrom.mockImplementation(mock.handler);

      const res = await DELETE(makeGetRequest('/api/music/comments', { id: 'nonexistent' }));
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error).toBe('Comment not found');
    });

    it('returns 403 when user does not own the comment and is not admin', async () => {
      const selectMock = chainMock({
        data: { id: 'comment-123', user_fid: 456 },
      });
      mockFrom.mockImplementation(selectMock.handler);

      const res = await DELETE(makeGetRequest('/api/music/comments', { id: 'comment-123' }));
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toBe('Forbidden');
    });

    it('allows deletion when user owns the comment', async () => {
      const selectMock = chainMock({
        data: { id: 'comment-123', user_fid: 123 },
      });
      const deleteMock = chainMock({
        data: null,
      });

      mockFrom.mockImplementation((table) => {
        if (table === 'song_comments' && selectMock.chain.delete) {
          return selectMock.handler();
        }
        return deleteMock.handler();
      });

      // More precise mock to handle multiple calls
      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return selectMock.handler();
        return deleteMock.handler();
      });

      const res = await DELETE(makeGetRequest('/api/music/comments', { id: 'comment-123' }));

      expect(res.status).toBe(200);
    });

    it('allows deletion when user is admin', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123, isAdmin: true }));

      const selectMock = chainMock({
        data: { id: 'comment-123', user_fid: 999 },
      });
      const deleteMock = chainMock({
        data: null,
      });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return selectMock.handler();
        return deleteMock.handler();
      });

      const res = await DELETE(makeGetRequest('/api/music/comments', { id: 'comment-123' }));

      expect(res.status).toBe(200);
    });
  });

  describe('success paths', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('returns 200 with deleted true on successful deletion', async () => {
      const selectMock = chainMock({
        data: { id: 'comment-123', user_fid: 123 },
      });
      const deleteMock = chainMock({
        data: null,
      });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return selectMock.handler();
        return deleteMock.handler();
      });

      const res = await DELETE(makeGetRequest('/api/music/comments', { id: 'comment-123' }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.deleted).toBe(true);
    });

    it('queries with correct comment id on delete', async () => {
      const selectMock = chainMock({
        data: { id: 'comment-123', user_fid: 123 },
      });
      const deleteMock = chainMock({
        data: null,
      });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return selectMock.handler();
        return deleteMock.handler();
      });

      await DELETE(makeGetRequest('/api/music/comments', { id: 'comment-123' }));

      const eqCalls = selectMock.chain.eq.mock.calls;
      expect(eqCalls).toContainEqual(['id', 'comment-123']);
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('returns 500 when delete query fails', async () => {
      const selectMock = chainMock({
        data: { id: 'comment-123', user_fid: 123 },
      });
      const deleteMock = chainMock({
        error: { message: 'Delete constraint failed' },
        data: null,
      });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return selectMock.handler();
        return deleteMock.handler();
      });

      const res = await DELETE(makeGetRequest('/api/music/comments', { id: 'comment-123' }));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to delete comment');
    });

    it('logs error when delete query fails', async () => {
      const { logger } = await import('@/lib/logger');
      const selectMock = chainMock({
        data: { id: 'comment-123', user_fid: 123 },
      });
      const deleteMock = chainMock({
        error: { message: 'Delete failed' },
        data: null,
      });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return selectMock.handler();
        return deleteMock.handler();
      });

      await DELETE(makeGetRequest('/api/music/comments', { id: 'comment-123' }));

      expect(logger.error).toHaveBeenCalledWith('[comments] DELETE failed:', expect.any(Object));
    });
  });
});
