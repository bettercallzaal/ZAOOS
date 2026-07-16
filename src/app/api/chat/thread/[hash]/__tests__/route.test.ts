import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeGetRequest } from '@/test-utils/api-helpers';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockGetSessionData } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
}));

const { mockGetCastThread } = vi.hoisted(() => ({
  mockGetCastThread: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: mockGetSessionData,
}));

vi.mock('@/lib/farcaster/neynar', () => ({
  getCastThread: mockGetCastThread,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

import { GET } from '../route';

// ── Test fixtures ────────────────────────────────────────────────────────────

/** Valid cast hash in the required format (0x + hex) */
const VALID_HASH = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';

/** Sample cast data as returned by neynar */
const SAMPLE_CAST = {
  hash: VALID_HASH,
  author: {
    fid: 123,
    username: 'testuser',
    display_name: 'Test User',
    pfp_url: 'https://example.com/pfp.jpg',
  },
  text: 'Hello world',
  timestamp: '2024-01-01T00:00:00Z',
  replies: { count: 2 },
  reactions: {
    likes_count: 5,
    recasts_count: 1,
    likes: [{ fid: 200 }, { fid: 201 }],
    recasts: [{ fid: 300 }],
  },
  parent_hash: null,
  embeds: [],
};

/** Sample reply cast */
const SAMPLE_REPLY_1 = {
  hash: '0x1111111111111111111111111111111111111111111111111111111111111111',
  author: {
    fid: 200,
    username: 'replier1',
    display_name: 'Replier One',
    pfp_url: 'https://example.com/pfp2.jpg',
  },
  text: 'Great post!',
  timestamp: '2024-01-01T01:00:00Z',
  replies: { count: 0 },
  reactions: {
    likes_count: 1,
    recasts_count: 0,
    likes: [],
    recasts: [],
  },
  parent_hash: VALID_HASH,
  embeds: [],
};

/** Sample nested reply */
const SAMPLE_REPLY_2 = {
  hash: '0x2222222222222222222222222222222222222222222222222222222222222222',
  author: {
    fid: 201,
    username: 'replier2',
    display_name: 'Replier Two',
    pfp_url: 'https://example.com/pfp3.jpg',
  },
  text: 'I agree!',
  timestamp: '2024-01-01T02:00:00Z',
  replies: { count: 0 },
  reactions: {
    likes_count: 0,
    recasts_count: 0,
    likes: [],
    recasts: [],
  },
  parent_hash: '0x1111111111111111111111111111111111111111111111111111111111111111',
  embeds: [],
};

describe('GET /api/chat/thread/[hash]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Authentication tests
  // ──────────────────────────────────────────────────────────────────────────

  describe('authentication', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockGetSessionData.mockResolvedValue(null);

      const res = await GET(makeGetRequest('/api/chat/thread/[hash]'), {
        params: Promise.resolve({ hash: VALID_HASH }),
      });
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockGetCastThread).not.toHaveBeenCalled();
    });

    it('proceeds when user is authenticated', async () => {
      mockGetSessionData.mockResolvedValue({ fid: 123, username: 'testuser' });
      mockGetCastThread.mockResolvedValue({
        conversation: { cast: SAMPLE_CAST },
      });

      const res = await GET(makeGetRequest('/api/chat/thread/[hash]'), {
        params: Promise.resolve({ hash: VALID_HASH }),
      });

      expect(res.status).toBe(200);
      expect(mockGetCastThread).toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Input validation tests
  // ──────────────────────────────────────────────────────────────────────────

  describe('input validation (castHashSchema)', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue({ fid: 123 });
    });

    it('returns 400 when hash lacks 0x prefix', async () => {
      const res = await GET(makeGetRequest('/api/chat/thread/[hash]'), {
        params: Promise.resolve({
          hash: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        }),
      });
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid cast hash');
      expect(mockGetCastThread).not.toHaveBeenCalled();
    });

    it('returns 400 when hash is too short (40 chars required minimum)', async () => {
      const res = await GET(makeGetRequest('/api/chat/thread/[hash]'), {
        params: Promise.resolve({ hash: '0xabc' }),
      });
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid cast hash');
      expect(mockGetCastThread).not.toHaveBeenCalled();
    });

    it('returns 400 when hash contains non-hex characters', async () => {
      const res = await GET(makeGetRequest('/api/chat/thread/[hash]'), {
        params: Promise.resolve({ hash: '0xzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz' }),
      });
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid cast hash');
      expect(mockGetCastThread).not.toHaveBeenCalled();
    });

    it('accepts valid 40-char hex hash (0x + 40 chars)', async () => {
      const shortHash = `0x${'a'.repeat(40)}`;
      mockGetCastThread.mockResolvedValue({
        conversation: { cast: SAMPLE_CAST },
      });

      const res = await GET(makeGetRequest('/api/chat/thread/[hash]'), {
        params: Promise.resolve({ hash: shortHash }),
      });

      expect(res.status).toBe(200);
      expect(mockGetCastThread).toHaveBeenCalledWith(shortHash);
    });

    it('accepts valid 64-char hex hash (0x + 64 chars)', async () => {
      mockGetCastThread.mockResolvedValue({
        conversation: { cast: SAMPLE_CAST },
      });

      const res = await GET(makeGetRequest('/api/chat/thread/[hash]'), {
        params: Promise.resolve({ hash: VALID_HASH }),
      });

      expect(res.status).toBe(200);
      expect(mockGetCastThread).toHaveBeenCalledWith(VALID_HASH);
    });

    it('accepts mixed case hex hash', async () => {
      const mixedCaseHash = '0xAbCdEf1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      mockGetCastThread.mockResolvedValue({
        conversation: { cast: SAMPLE_CAST },
      });

      const res = await GET(makeGetRequest('/api/chat/thread/[hash]'), {
        params: Promise.resolve({ hash: mixedCaseHash }),
      });

      expect(res.status).toBe(200);
      expect(mockGetCastThread).toHaveBeenCalledWith(mixedCaseHash);
    });

    it('returns 400 when hash is empty string', async () => {
      const res = await GET(makeGetRequest('/api/chat/thread/[hash]'), {
        params: Promise.resolve({ hash: '' }),
      });
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid cast hash');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // getCastThread call and response mapping
  // ──────────────────────────────────────────────────────────────────────────

  describe('getCastThread call and mapCast transformation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue({ fid: 123 });
    });

    it('calls getCastThread with validated hash', async () => {
      mockGetCastThread.mockResolvedValue({
        conversation: { cast: SAMPLE_CAST },
      });

      await GET(makeGetRequest('/api/chat/thread/[hash]'), {
        params: Promise.resolve({ hash: VALID_HASH }),
      });

      expect(mockGetCastThread).toHaveBeenCalledWith(VALID_HASH);
      expect(mockGetCastThread).toHaveBeenCalledTimes(1);
    });

    it('maps single cast correctly', async () => {
      mockGetCastThread.mockResolvedValue({
        conversation: { cast: SAMPLE_CAST },
      });

      const res = await GET(makeGetRequest('/api/chat/thread/[hash]'), {
        params: Promise.resolve({ hash: VALID_HASH }),
      });
      const body = await res.json();

      expect(body.casts).toHaveLength(1);
      const mappedCast = body.casts[0];
      expect(mappedCast.hash).toBe(SAMPLE_CAST.hash);
      expect(mappedCast.author.fid).toBe(SAMPLE_CAST.author.fid);
      expect(mappedCast.author.username).toBe(SAMPLE_CAST.author.username);
      expect(mappedCast.author.display_name).toBe(SAMPLE_CAST.author.display_name);
      expect(mappedCast.author.pfp_url).toBe(SAMPLE_CAST.author.pfp_url);
      expect(mappedCast.text).toBe(SAMPLE_CAST.text);
      expect(mappedCast.timestamp).toBe(SAMPLE_CAST.timestamp);
    });

    it('maps replies and reactions correctly', async () => {
      mockGetCastThread.mockResolvedValue({
        conversation: { cast: SAMPLE_CAST },
      });

      const res = await GET(makeGetRequest('/api/chat/thread/[hash]'), {
        params: Promise.resolve({ hash: VALID_HASH }),
      });
      const body = await res.json();

      const mappedCast = body.casts[0];
      expect(mappedCast.replies.count).toBe(2);
      expect(mappedCast.reactions.likes_count).toBe(5);
      expect(mappedCast.reactions.recasts_count).toBe(1);
      expect(mappedCast.reactions.likes).toHaveLength(2);
      expect(mappedCast.reactions.recasts).toHaveLength(1);
    });

    it('handles missing author fields with defaults', async () => {
      const castWithMissingFields = {
        hash: VALID_HASH,
        author: { fid: 123 }, // username, display_name, pfp_url missing
      };
      mockGetCastThread.mockResolvedValue({
        conversation: { cast: castWithMissingFields },
      });

      const res = await GET(makeGetRequest('/api/chat/thread/[hash]'), {
        params: Promise.resolve({ hash: VALID_HASH }),
      });
      const body = await res.json();

      const mappedCast = body.casts[0];
      expect(mappedCast.author.username).toBe('');
      expect(mappedCast.author.display_name).toBe('');
      expect(mappedCast.author.pfp_url).toBe('');
    });

    it('handles missing text field with default', async () => {
      const castWithoutText = {
        hash: VALID_HASH,
        author: SAMPLE_CAST.author,
        timestamp: SAMPLE_CAST.timestamp,
      };
      mockGetCastThread.mockResolvedValue({
        conversation: { cast: castWithoutText },
      });

      const res = await GET(makeGetRequest('/api/chat/thread/[hash]'), {
        params: Promise.resolve({ hash: VALID_HASH }),
      });
      const body = await res.json();

      const mappedCast = body.casts[0];
      expect(mappedCast.text).toBe('');
    });

    it('handles missing reactions with defaults', async () => {
      const castWithoutReactions = {
        hash: VALID_HASH,
        author: SAMPLE_CAST.author,
        text: SAMPLE_CAST.text,
        timestamp: SAMPLE_CAST.timestamp,
      };
      mockGetCastThread.mockResolvedValue({
        conversation: { cast: castWithoutReactions },
      });

      const res = await GET(makeGetRequest('/api/chat/thread/[hash]'), {
        params: Promise.resolve({ hash: VALID_HASH }),
      });
      const body = await res.json();

      const mappedCast = body.casts[0];
      expect(mappedCast.reactions.likes_count).toBe(0);
      expect(mappedCast.reactions.recasts_count).toBe(0);
      expect(mappedCast.reactions.likes).toEqual([]);
      expect(mappedCast.reactions.recasts).toEqual([]);
    });

    it('handles parent_hash and embeds correctly', async () => {
      const castWithEmbeds = {
        ...SAMPLE_CAST,
        parent_hash: '0x1234567890abcdef1234567890abcdef1234567890',
        embeds: [{ url: 'https://example.com/image.jpg' }],
      };
      mockGetCastThread.mockResolvedValue({
        conversation: { cast: castWithEmbeds },
      });

      const res = await GET(makeGetRequest('/api/chat/thread/[hash]'), {
        params: Promise.resolve({ hash: VALID_HASH }),
      });
      const body = await res.json();

      const mappedCast = body.casts[0];
      expect(mappedCast.parent_hash).toBe('0x1234567890abcdef1234567890abcdef1234567890');
      expect(mappedCast.embeds).toHaveLength(1);
      expect(mappedCast.embeds[0].url).toBe('https://example.com/image.jpg');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Thread flattening and nested replies
  // ──────────────────────────────────────────────────────────────────────────

  describe('thread flattening with direct_replies', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue({ fid: 123 });
    });

    it('flattens a thread with direct replies', async () => {
      const threadData = {
        ...SAMPLE_CAST,
        direct_replies: [SAMPLE_REPLY_1],
      };
      mockGetCastThread.mockResolvedValue({
        conversation: { cast: threadData },
      });

      const res = await GET(makeGetRequest('/api/chat/thread/[hash]'), {
        params: Promise.resolve({ hash: VALID_HASH }),
      });
      const body = await res.json();

      expect(body.casts).toHaveLength(2);
      expect(body.casts[0].hash).toBe(VALID_HASH);
      expect(body.casts[1].hash).toBe(SAMPLE_REPLY_1.hash);
    });

    it('flattens nested replies recursively', async () => {
      const replyWithNested = {
        ...SAMPLE_REPLY_1,
        direct_replies: [SAMPLE_REPLY_2],
      };
      const threadData = {
        ...SAMPLE_CAST,
        direct_replies: [replyWithNested],
      };
      mockGetCastThread.mockResolvedValue({
        conversation: { cast: threadData },
      });

      const res = await GET(makeGetRequest('/api/chat/thread/[hash]'), {
        params: Promise.resolve({ hash: VALID_HASH }),
      });
      const body = await res.json();

      expect(body.casts).toHaveLength(3);
      expect(body.casts[0].hash).toBe(VALID_HASH);
      expect(body.casts[1].hash).toBe(SAMPLE_REPLY_1.hash);
      expect(body.casts[2].hash).toBe(SAMPLE_REPLY_2.hash);
    });

    it('handles empty direct_replies array', async () => {
      const threadData = {
        ...SAMPLE_CAST,
        direct_replies: [],
      };
      mockGetCastThread.mockResolvedValue({
        conversation: { cast: threadData },
      });

      const res = await GET(makeGetRequest('/api/chat/thread/[hash]'), {
        params: Promise.resolve({ hash: VALID_HASH }),
      });
      const body = await res.json();

      expect(body.casts).toHaveLength(1);
      expect(body.casts[0].hash).toBe(VALID_HASH);
    });

    it('handles missing direct_replies field', async () => {
      const threadData = { ...SAMPLE_CAST }; // no direct_replies
      mockGetCastThread.mockResolvedValue({
        conversation: { cast: threadData },
      });

      const res = await GET(makeGetRequest('/api/chat/thread/[hash]'), {
        params: Promise.resolve({ hash: VALID_HASH }),
      });
      const body = await res.json();

      expect(body.casts).toHaveLength(1);
      expect(body.casts[0].hash).toBe(VALID_HASH);
    });

    it('handles direct_replies as undefined', async () => {
      const threadData = {
        ...SAMPLE_CAST,
        direct_replies: undefined,
      };
      mockGetCastThread.mockResolvedValue({
        conversation: { cast: threadData },
      });

      const res = await GET(makeGetRequest('/api/chat/thread/[hash]'), {
        params: Promise.resolve({ hash: VALID_HASH }),
      });
      const body = await res.json();

      expect(body.casts).toHaveLength(1);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Empty/missing thread data
  // ──────────────────────────────────────────────────────────────────────────

  describe('empty or missing thread data', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue({ fid: 123 });
    });

    it('returns empty casts array when conversation.cast is null', async () => {
      mockGetCastThread.mockResolvedValue({
        conversation: { cast: null },
      });

      const res = await GET(makeGetRequest('/api/chat/thread/[hash]'), {
        params: Promise.resolve({ hash: VALID_HASH }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.casts).toEqual([]);
    });

    it('returns empty casts array when conversation.cast is undefined', async () => {
      mockGetCastThread.mockResolvedValue({
        conversation: { cast: undefined },
      });

      const res = await GET(makeGetRequest('/api/chat/thread/[hash]'), {
        params: Promise.resolve({ hash: VALID_HASH }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.casts).toEqual([]);
    });

    it('returns empty casts array when conversation is missing', async () => {
      mockGetCastThread.mockResolvedValue({});

      const res = await GET(makeGetRequest('/api/chat/thread/[hash]'), {
        params: Promise.resolve({ hash: VALID_HASH }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.casts).toEqual([]);
    });

    it('returns empty casts array when getCastThread returns null', async () => {
      mockGetCastThread.mockResolvedValue(null);

      const res = await GET(makeGetRequest('/api/chat/thread/[hash]'), {
        params: Promise.resolve({ hash: VALID_HASH }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.casts).toEqual([]);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Error handling and 500 path
  // ──────────────────────────────────────────────────────────────────────────

  describe('error handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue({ fid: 123 });
    });

    it('returns 500 when getCastThread throws error', async () => {
      mockGetCastThread.mockRejectedValue(new Error('Neynar API error'));

      const res = await GET(makeGetRequest('/api/chat/thread/[hash]'), {
        params: Promise.resolve({ hash: VALID_HASH }),
      });
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to fetch thread');
    });

    it('returns 500 when getCastThread times out', async () => {
      mockGetCastThread.mockRejectedValue(new Error('Request timeout'));

      const res = await GET(makeGetRequest('/api/chat/thread/[hash]'), {
        params: Promise.resolve({ hash: VALID_HASH }),
      });
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to fetch thread');
    });

    it('logs error when getCastThread throws', async () => {
      const { logger } = await import('@/lib/logger');
      const testError = new Error('Test API failure');
      mockGetCastThread.mockRejectedValue(testError);

      await GET(makeGetRequest('/api/chat/thread/[hash]'), {
        params: Promise.resolve({ hash: VALID_HASH }),
      });

      expect(logger.error).toHaveBeenCalledWith('Thread fetch error:', testError);
    });

    it('returns 500 when params Promise rejects', async () => {
      mockGetCastThread.mockResolvedValue({
        conversation: { cast: SAMPLE_CAST },
      });

      const res = await GET(makeGetRequest('/api/chat/thread/[hash]'), {
        params: Promise.reject(new Error('Params resolution failed')),
      });
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to fetch thread');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Response shape and format
  // ──────────────────────────────────────────────────────────────────────────

  describe('response shape', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue({ fid: 123 });
    });

    it('returns casts array in response body', async () => {
      mockGetCastThread.mockResolvedValue({
        conversation: { cast: SAMPLE_CAST },
      });

      const res = await GET(makeGetRequest('/api/chat/thread/[hash]'), {
        params: Promise.resolve({ hash: VALID_HASH }),
      });
      const body = await res.json();

      expect(body).toHaveProperty('casts');
      expect(Array.isArray(body.casts)).toBe(true);
    });

    it('response is valid JSON', async () => {
      mockGetCastThread.mockResolvedValue({
        conversation: { cast: SAMPLE_CAST },
      });

      const res = await GET(makeGetRequest('/api/chat/thread/[hash]'), {
        params: Promise.resolve({ hash: VALID_HASH }),
      });

      await expect(res.json()).resolves.toBeDefined();
    });

    it('returns correct status code 200 on success', async () => {
      mockGetCastThread.mockResolvedValue({
        conversation: { cast: SAMPLE_CAST },
      });

      const res = await GET(makeGetRequest('/api/chat/thread/[hash]'), {
        params: Promise.resolve({ hash: VALID_HASH }),
      });

      expect(res.status).toBe(200);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Dynamic params handling
  // ──────────────────────────────────────────────────────────────────────────

  describe('dynamic params Promise handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue({ fid: 123 });
    });

    it('correctly awaits params Promise', async () => {
      mockGetCastThread.mockResolvedValue({
        conversation: { cast: SAMPLE_CAST },
      });

      const paramsPromise = Promise.resolve({ hash: VALID_HASH });
      const res = await GET(makeGetRequest('/api/chat/thread/[hash]'), {
        params: paramsPromise,
      });

      expect(res.status).toBe(200);
      expect(mockGetCastThread).toHaveBeenCalled();
    });

    it('extracts hash from params Promise correctly', async () => {
      mockGetCastThread.mockResolvedValue({
        conversation: { cast: SAMPLE_CAST },
      });

      const testHash = '0x1234567890abcdef1234567890abcdef12345678';
      await GET(makeGetRequest('/api/chat/thread/[hash]'), {
        params: Promise.resolve({ hash: testHash }),
      });

      expect(mockGetCastThread).toHaveBeenCalledWith(testHash);
    });
  });
});
