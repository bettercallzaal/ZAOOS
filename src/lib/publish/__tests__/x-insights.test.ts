// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetXClient = vi.hoisted(() => vi.fn());

vi.mock('@/lib/publish/x', () => ({
  getXClient: mockGetXClient,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

import { fetchXInsights } from '@/lib/publish/x-insights';

describe('fetchXInsights', () => {
  const mockSingleTweet = vi.fn();
  const mockClient = { v2: { singleTweet: mockSingleTweet } };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Throws when client is not configured
  it('throws when getXClient() returns null', async () => {
    mockGetXClient.mockReturnValue(null);

    await expect(fetchXInsights('123')).rejects.toThrow('X client not configured');
  });

  // 2. Returns zeroed XMetrics when public_metrics is undefined
  it('returns all-zero XMetrics when public_metrics is undefined on the tweet', async () => {
    mockGetXClient.mockReturnValue(mockClient);
    mockSingleTweet.mockResolvedValue({ data: {} });

    const result = await fetchXInsights('456');

    expect(result).toEqual({
      views: 0,
      likes: 0,
      replies: 0,
      reposts: 0,
      quotes: 0,
      bookmarks: 0,
    });
  });

  // 3. Maps impression_count → views
  it('maps impression_count to views', async () => {
    mockGetXClient.mockReturnValue(mockClient);
    mockSingleTweet.mockResolvedValue({
      data: {
        public_metrics: {
          impression_count: 42,
          like_count: 0,
          reply_count: 0,
          retweet_count: 0,
          quote_count: 0,
          bookmark_count: 0,
        },
      },
    });

    const result = await fetchXInsights('tweet1');
    expect(result.views).toBe(42);
  });

  // 4. Maps like_count → likes
  it('maps like_count to likes', async () => {
    mockGetXClient.mockReturnValue(mockClient);
    mockSingleTweet.mockResolvedValue({
      data: {
        public_metrics: {
          impression_count: 0,
          like_count: 7,
          reply_count: 0,
          retweet_count: 0,
          quote_count: 0,
          bookmark_count: 0,
        },
      },
    });

    const result = await fetchXInsights('tweet2');
    expect(result.likes).toBe(7);
  });

  // 5. Maps reply_count → replies
  it('maps reply_count to replies', async () => {
    mockGetXClient.mockReturnValue(mockClient);
    mockSingleTweet.mockResolvedValue({
      data: {
        public_metrics: {
          impression_count: 0,
          like_count: 0,
          reply_count: 3,
          retweet_count: 0,
          quote_count: 0,
          bookmark_count: 0,
        },
      },
    });

    const result = await fetchXInsights('tweet3');
    expect(result.replies).toBe(3);
  });

  // 6. Maps retweet_count → reposts
  it('maps retweet_count to reposts', async () => {
    mockGetXClient.mockReturnValue(mockClient);
    mockSingleTweet.mockResolvedValue({
      data: {
        public_metrics: {
          impression_count: 0,
          like_count: 0,
          reply_count: 0,
          retweet_count: 5,
          quote_count: 0,
          bookmark_count: 0,
        },
      },
    });

    const result = await fetchXInsights('tweet4');
    expect(result.reposts).toBe(5);
  });

  // 7. Maps quote_count → quotes
  it('maps quote_count to quotes', async () => {
    mockGetXClient.mockReturnValue(mockClient);
    mockSingleTweet.mockResolvedValue({
      data: {
        public_metrics: {
          impression_count: 0,
          like_count: 0,
          reply_count: 0,
          retweet_count: 0,
          quote_count: 2,
          bookmark_count: 0,
        },
      },
    });

    const result = await fetchXInsights('tweet5');
    expect(result.quotes).toBe(2);
  });

  // 8. Maps bookmark_count → bookmarks
  it('maps bookmark_count to bookmarks', async () => {
    mockGetXClient.mockReturnValue(mockClient);
    mockSingleTweet.mockResolvedValue({
      data: {
        public_metrics: {
          impression_count: 0,
          like_count: 0,
          reply_count: 0,
          retweet_count: 0,
          quote_count: 0,
          bookmark_count: 9,
        },
      },
    });

    const result = await fetchXInsights('tweet6');
    expect(result.bookmarks).toBe(9);
  });

  // 9. Full happy-path: all 6 fields populated correctly
  it('returns all 6 fields correctly on a full public_metrics response', async () => {
    mockGetXClient.mockReturnValue(mockClient);
    mockSingleTweet.mockResolvedValue({
      data: {
        public_metrics: {
          impression_count: 1000,
          like_count: 50,
          reply_count: 10,
          retweet_count: 20,
          quote_count: 5,
          bookmark_count: 15,
        },
      },
    });

    const result = await fetchXInsights('tweet-full');

    expect(result).toEqual({
      views: 1000,
      likes: 50,
      replies: 10,
      reposts: 20,
      quotes: 5,
      bookmarks: 15,
    });
  });

  // 10. Returns zeroed metrics when singleTweet throws (API error recovery)
  it('returns zeroed metrics when singleTweet throws an API error', async () => {
    mockGetXClient.mockReturnValue(mockClient);
    mockSingleTweet.mockRejectedValue(new Error('API rate limit exceeded'));

    const result = await fetchXInsights('tweet-err');

    expect(result).toEqual({
      views: 0,
      likes: 0,
      replies: 0,
      reposts: 0,
      quotes: 0,
      bookmarks: 0,
    });
  });

  // Bonus: missing individual fields default to 0 via ?? operator
  it('defaults missing impression_count to views: 0', async () => {
    mockGetXClient.mockReturnValue(mockClient);
    mockSingleTweet.mockResolvedValue({
      data: {
        public_metrics: {
          // impression_count intentionally omitted
          like_count: 1,
          reply_count: 0,
          retweet_count: 0,
          quote_count: 0,
          bookmark_count: 0,
        },
      },
    });

    const result = await fetchXInsights('tweet-no-impressions');
    expect(result.views).toBe(0);
    expect(result.likes).toBe(1);
  });
});
