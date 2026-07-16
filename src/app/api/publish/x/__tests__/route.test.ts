import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makePostRequest,
  mockAdminSession,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

const {
  mockGetSessionData,
  mockFrom,
  mockNormalizeForX,
  mockGetXClient,
  mockPublishToX,
  mockPublishThreadToX,
  mockLogger,
} = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
  mockNormalizeForX: vi.fn(),
  mockGetXClient: vi.fn(),
  mockPublishToX: vi.fn(),
  mockPublishThreadToX: vi.fn(),
  mockLogger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/publish/normalize', () => ({
  normalizeForX: (input: unknown) => mockNormalizeForX(input),
}));

vi.mock('@/lib/publish/x', () => ({
  getXClient: () => mockGetXClient(),
  publishToX: (content: unknown, options?: unknown) => mockPublishToX(content, options),
  publishThreadToX: (content: unknown, options?: unknown) => mockPublishThreadToX(content, options),
}));

vi.mock('@/lib/logger', () => ({
  logger: mockLogger,
}));

import { POST } from '../route';

/**
 * Chain whose chainable methods are inspectable spies. Terminal methods
 * (insert, eq, await) resolve to `result`.
 */
function makeChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of ['insert', 'eq']) {
    chain[m] = vi.fn(() => chain);
  }
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) => resolve(result);
  return chain;
}

describe('POST /api/publish/x', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    mockGetXClient.mockReturnValue({ v2: {} }); // Minimal client mock
    mockNormalizeForX.mockReturnValue({
      text: 'Normalized text https://warpcast.com/~/conversations/abc123',
      images: [],
      embeds: [],
      attribution: 'https://warpcast.com/~/conversations/abc123',
      castHash: 'abc123',
      castUrl: 'https://warpcast.com/~/conversations/abc123',
    });
    mockPublishToX.mockResolvedValue({
      tweetId: '123456789',
      tweetUrl: 'https://x.com/thezao/status/123456789',
    });
    mockPublishThreadToX.mockResolvedValue({
      tweetIds: ['123456789', '234567890'],
      tweetUrls: ['https://x.com/thezao/status/123456789', 'https://x.com/thezao/status/234567890'],
      headTweetId: '123456789',
      headTweetUrl: 'https://x.com/thezao/status/123456789',
    });
  });

  // --- Auth Guards ---

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await POST(
      makePostRequest('/api/publish/x', {
        castHash: 'abc123',
        text: 'Hello world',
      }),
    );
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Unauthorized');
  });

  it('returns 403 when user is not admin', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ isAdmin: false }));
    const res = await POST(
      makePostRequest('/api/publish/x', {
        castHash: 'abc123',
        text: 'Hello world',
      }),
    );
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe('Admin access required');
  });

  // --- X Client Configuration ---

  it('returns 503 when X is not configured', async () => {
    mockGetXClient.mockReturnValue(null);
    const res = await POST(
      makePostRequest('/api/publish/x', {
        castHash: 'abc123',
        text: 'Hello world',
      }),
    );
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe('X not configured');
  });

  // --- JSON Parsing ---

  it('returns 400 when body is invalid JSON', async () => {
    // Override body to be invalid JSON
    const invalidReq = new (await import('next/server')).NextRequest(
      new URL('http://localhost:3000/api/publish/x'),
      {
        method: 'POST',
        body: 'not json {]',
      },
    );
    const res = await POST(invalidReq);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid JSON');
  });

  // --- Zod Validation ---

  it('returns 400 when castHash is missing', async () => {
    const res = await POST(
      makePostRequest('/api/publish/x', {
        text: 'Hello world',
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
    expect(body.details).toBeDefined();
  });

  it('returns 400 when castHash is empty string', async () => {
    const res = await POST(
      makePostRequest('/api/publish/x', {
        castHash: '',
        text: 'Hello world',
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid input');
  });

  it('returns 400 when text is missing', async () => {
    const res = await POST(
      makePostRequest('/api/publish/x', {
        castHash: 'abc123',
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid input');
  });

  it('returns 400 when text is empty string', async () => {
    const res = await POST(
      makePostRequest('/api/publish/x', {
        castHash: 'abc123',
        text: '',
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid input');
  });

  it('returns 400 when text exceeds 4096 characters', async () => {
    const longText = 'a'.repeat(4097);
    const res = await POST(
      makePostRequest('/api/publish/x', {
        castHash: 'abc123',
        text: longText,
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid input');
  });

  it('returns 400 when embedUrls contains an invalid URL', async () => {
    const res = await POST(
      makePostRequest('/api/publish/x', {
        castHash: 'abc123',
        text: 'Hello world',
        embedUrls: ['not-a-url'],
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid input');
  });

  it('returns 400 when imageUrls contains an invalid URL', async () => {
    const res = await POST(
      makePostRequest('/api/publish/x', {
        castHash: 'abc123',
        text: 'Hello world',
        imageUrls: ['definitely not a url'],
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid input');
  });

  it('returns 400 when scheduledAt is not a valid ISO 8601 datetime', async () => {
    const res = await POST(
      makePostRequest('/api/publish/x', {
        castHash: 'abc123',
        text: 'Hello world',
        scheduledAt: 'not-a-datetime',
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid input');
  });

  it('accepts a valid ISO 8601 datetime for scheduledAt', async () => {
    const chain = makeChain({ error: null });
    mockFrom.mockReturnValue(chain);
    const res = await POST(
      makePostRequest('/api/publish/x', {
        castHash: 'abc123',
        text: 'Hello world',
        scheduledAt: '2026-07-20T15:30:00Z',
      }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });

  // --- Normalization ---

  it('calls normalizeForX with the parsed input', async () => {
    const chain = makeChain({ error: null });
    mockFrom.mockReturnValue(chain);
    await POST(
      makePostRequest('/api/publish/x', {
        castHash: 'abc123',
        text: 'Hello world',
        embedUrls: ['https://example.com'],
        imageUrls: ['https://example.com/image.jpg'],
        channel: 'general',
      }),
    );
    expect(mockNormalizeForX).toHaveBeenCalledWith({
      text: 'Hello world',
      castHash: 'abc123',
      embedUrls: ['https://example.com'],
      imageUrls: ['https://example.com/image.jpg'],
      channel: 'general',
    });
  });

  // --- Single Tweet (non-thread) Mode ---

  it('publishes a single tweet on success', async () => {
    const chain = makeChain({ error: null });
    mockFrom.mockReturnValue(chain);
    const res = await POST(
      makePostRequest('/api/publish/x', {
        castHash: 'abc123',
        text: 'Hello world',
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.platformUrl).toBe('https://x.com/thezao/status/123456789');
    expect(body.thread).toBeUndefined();
  });

  it('logs the published tweet to publish_log table', async () => {
    const chain = makeChain({ error: null });
    mockFrom.mockReturnValue(chain);
    await POST(
      makePostRequest('/api/publish/x', {
        castHash: 'abc123',
        text: 'Hello world',
      }),
    );
    expect(mockFrom).toHaveBeenCalledWith('publish_log');
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        platform: 'x',
        cast_hash: 'abc123',
        platform_post_id: '123456789',
        platform_url: 'https://x.com/thezao/status/123456789',
        published_by_fid: 123,
        text: expect.stringContaining('Normalized text'),
        status: 'published',
      }),
    );
  });

  it('sets status to "scheduled" when scheduledAt is provided', async () => {
    const chain = makeChain({ error: null });
    mockFrom.mockReturnValue(chain);
    await POST(
      makePostRequest('/api/publish/x', {
        castHash: 'abc123',
        text: 'Hello world',
        scheduledAt: '2026-07-20T15:30:00Z',
      }),
    );
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'scheduled',
      }),
    );
  });

  it('includes scheduledAt in response when provided', async () => {
    const chain = makeChain({ error: null });
    mockFrom.mockReturnValue(chain);
    const res = await POST(
      makePostRequest('/api/publish/x', {
        castHash: 'abc123',
        text: 'Hello world',
        scheduledAt: '2026-07-20T15:30:00Z',
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.scheduledAt).toBe('2026-07-20T15:30:00Z');
  });

  it('calls publishToX with normalized content and options', async () => {
    const chain = makeChain({ error: null });
    mockFrom.mockReturnValue(chain);
    const normalized = {
      text: 'Normalized text https://warpcast.com/~/conversations/abc123',
      images: [],
      embeds: [],
      attribution: 'https://warpcast.com/~/conversations/abc123',
      castHash: 'abc123',
      castUrl: 'https://warpcast.com/~/conversations/abc123',
    };
    mockNormalizeForX.mockReturnValue(normalized);
    await POST(
      makePostRequest('/api/publish/x', {
        castHash: 'abc123',
        text: 'Hello world',
        scheduledAt: '2026-07-20T15:30:00Z',
      }),
    );
    expect(mockPublishToX).toHaveBeenCalledWith(normalized, {
      scheduledAt: '2026-07-20T15:30:00Z',
    });
  });

  // --- Thread Mode ---

  it('publishes a thread when thread: true', async () => {
    const chain = makeChain({ error: null });
    mockFrom.mockReturnValue(chain);
    const res = await POST(
      makePostRequest('/api/publish/x', {
        castHash: 'abc123',
        text: 'Hello world',
        thread: true,
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.platformUrl).toBe('https://x.com/thezao/status/123456789');
    expect(body.thread).toBeDefined();
    expect(body.thread.tweetCount).toBe(2);
    expect(body.thread.tweetUrls).toEqual([
      'https://x.com/thezao/status/123456789',
      'https://x.com/thezao/status/234567890',
    ]);
  });

  it('calls publishThreadToX when thread: true', async () => {
    const chain = makeChain({ error: null });
    mockFrom.mockReturnValue(chain);
    const normalized = {
      text: 'Long text that needs a thread',
      images: [],
      embeds: [],
      attribution: 'url',
      castHash: 'abc123',
      castUrl: 'https://warpcast.com/~/conversations/abc123',
    };
    mockNormalizeForX.mockReturnValue(normalized);
    await POST(
      makePostRequest('/api/publish/x', {
        castHash: 'abc123',
        text: 'Long text that needs a thread',
        thread: true,
      }),
    );
    expect(mockPublishThreadToX).toHaveBeenCalledWith(normalized, { scheduledAt: undefined });
    expect(mockPublishToX).not.toHaveBeenCalled();
  });

  it('logs the head tweet to publish_log in thread mode', async () => {
    const chain = makeChain({ error: null });
    mockFrom.mockReturnValue(chain);
    await POST(
      makePostRequest('/api/publish/x', {
        castHash: 'abc123',
        text: 'Hello world',
        thread: true,
      }),
    );
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        platform: 'x',
        cast_hash: 'abc123',
        platform_post_id: '123456789',
        platform_url: 'https://x.com/thezao/status/123456789',
        published_by_fid: 123,
      }),
    );
  });

  // --- Publish Errors ---

  it('returns 500 when publishToX throws', async () => {
    mockPublishToX.mockRejectedValue(new Error('X API error'));
    const res = await POST(
      makePostRequest('/api/publish/x', {
        castHash: 'abc123',
        text: 'Hello world',
      }),
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('X API error');
  });

  it('returns 500 when publishThreadToX throws', async () => {
    mockPublishThreadToX.mockRejectedValue(new Error('Thread publish failed'));
    const res = await POST(
      makePostRequest('/api/publish/x', {
        castHash: 'abc123',
        text: 'Hello world',
        thread: true,
      }),
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('Thread publish failed');
  });

  it('logs the error when an exception occurs', async () => {
    mockPublishToX.mockRejectedValue(new Error('X API error'));
    await POST(
      makePostRequest('/api/publish/x', {
        castHash: 'abc123',
        text: 'Hello world',
      }),
    );
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('returns a generic error message for non-Error exceptions', async () => {
    mockPublishToX.mockRejectedValue('string error');
    const res = await POST(
      makePostRequest('/api/publish/x', {
        castHash: 'abc123',
        text: 'Hello world',
      }),
    );
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('Failed to publish to X');
  });

  // --- Database Logging Errors ---

  it('returns 200 even if logging to publish_log has an error in the result', async () => {
    // The route awaits the insert chain but does not check for errors in the result,
    // so the response is still 200 even if the chain has an error property.
    const chain = makeChain({ error: new Error('db error') });
    mockFrom.mockReturnValue(chain);
    const res = await POST(
      makePostRequest('/api/publish/x', {
        castHash: 'abc123',
        text: 'Hello world',
      }),
    );
    // Since the insert doesn't throw, the response is still 200
    expect(res.status).toBe(200);
  });

  // --- Optional Fields ---

  it('accepts optional embedUrls, imageUrls, and channel', async () => {
    const chain = makeChain({ error: null });
    mockFrom.mockReturnValue(chain);
    const res = await POST(
      makePostRequest('/api/publish/x', {
        castHash: 'abc123',
        text: 'Hello world',
        embedUrls: ['https://example.com'],
        imageUrls: ['https://example.com/image.jpg'],
        channel: 'announcements',
      }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });

  it('treats missing optional fields as undefined', async () => {
    const chain = makeChain({ error: null });
    mockFrom.mockReturnValue(chain);
    await POST(
      makePostRequest('/api/publish/x', {
        castHash: 'abc123',
        text: 'Hello world',
      }),
    );
    expect(mockNormalizeForX).toHaveBeenCalledWith(
      expect.objectContaining({
        embedUrls: undefined,
        imageUrls: undefined,
        channel: undefined,
      }),
    );
  });

  // --- Thread Field ---

  it('ignores thread: false and publishes normally', async () => {
    const chain = makeChain({ error: null });
    mockFrom.mockReturnValue(chain);
    const res = await POST(
      makePostRequest('/api/publish/x', {
        castHash: 'abc123',
        text: 'Hello world',
        thread: false,
      }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).thread).toBeUndefined();
    expect(mockPublishToX).toHaveBeenCalled();
    expect(mockPublishThreadToX).not.toHaveBeenCalled();
  });
});
