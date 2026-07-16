import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makePostRequest,
  mockAdminSession,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

const {
  mockGetSessionData,
  mockIsThreadsConfigured,
  mockNormalizeForThreads,
  mockPublishToThreads,
  mockFrom,
} = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockIsThreadsConfigured: vi.fn(),
  mockNormalizeForThreads: vi.fn(),
  mockPublishToThreads: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/publish/normalize', () => ({
  normalizeForThreads: (input: unknown) => mockNormalizeForThreads(input),
}));

vi.mock('@/lib/publish/threads', () => ({
  isThreadsConfigured: () => mockIsThreadsConfigured(),
  publishToThreads: (input: unknown) => mockPublishToThreads(input),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

// Test fixture: supabase chain mock for publish_log insert
function makeInsertChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.insert = vi.fn().mockReturnValue(chain);
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) => resolve(result);
  return chain;
}

describe('POST /api/publish/threads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsThreadsConfigured.mockReturnValue(true);
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await import('../route').then((m) =>
      m.POST(
        makePostRequest('/api/publish/threads', {
          castHash: 'abc123',
          text: 'hello',
        }),
      ),
    );
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Unauthorized');
  });

  it('returns 403 when user is not admin', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ isAdmin: false }));
    const res = await import('../route').then((m) =>
      m.POST(
        makePostRequest('/api/publish/threads', {
          castHash: 'abc123',
          text: 'hello',
        }),
      ),
    );
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe('Admin access required');
  });

  it('returns 503 when Threads is not configured', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    mockIsThreadsConfigured.mockReturnValue(false);
    const res = await import('../route').then((m) =>
      m.POST(
        makePostRequest('/api/publish/threads', {
          castHash: 'abc123',
          text: 'hello',
        }),
      ),
    );
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe('Threads not configured');
  });

  it('returns 400 when request body is invalid JSON', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    // Create a request with malformed JSON body
    const req = new Request(new URL('/api/publish/threads', 'http://localhost:3000'), {
      method: 'POST',
      body: '{invalid json}',
    });
    const res = await import('../route').then((m) => m.POST(req as never));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid JSON');
  });

  it('returns 400 when castHash is missing', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const res = await import('../route').then((m) =>
      m.POST(
        makePostRequest('/api/publish/threads', {
          text: 'hello',
        }),
      ),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
    expect(body.details).toBeDefined();
  });

  it('returns 400 when castHash is empty string', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const res = await import('../route').then((m) =>
      m.POST(
        makePostRequest('/api/publish/threads', {
          castHash: '',
          text: 'hello',
        }),
      ),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 when text is missing', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const res = await import('../route').then((m) =>
      m.POST(
        makePostRequest('/api/publish/threads', {
          castHash: 'abc123',
        }),
      ),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 when text is empty string', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const res = await import('../route').then((m) =>
      m.POST(
        makePostRequest('/api/publish/threads', {
          castHash: 'abc123',
          text: '',
        }),
      ),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 when text exceeds 1024 character limit', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const longText = 'a'.repeat(1025);
    const res = await import('../route').then((m) =>
      m.POST(
        makePostRequest('/api/publish/threads', {
          castHash: 'abc123',
          text: longText,
        }),
      ),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 when embedUrls contains invalid URL', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const res = await import('../route').then((m) =>
      m.POST(
        makePostRequest('/api/publish/threads', {
          castHash: 'abc123',
          text: 'hello',
          embedUrls: ['not-a-url'],
        }),
      ),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 when imageUrls contains invalid URL', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const res = await import('../route').then((m) =>
      m.POST(
        makePostRequest('/api/publish/threads', {
          castHash: 'abc123',
          text: 'hello',
          imageUrls: ['not-a-url'],
        }),
      ),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('publishes with minimal input (castHash + text)', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    mockNormalizeForThreads.mockReturnValue({
      text: 'normalized text\n\nvia ZAO OS\nhttps://warpcast.com/~/conversations/abc123',
      images: [],
      embeds: [],
      attribution: 'via ZAO OS',
      castHash: 'abc123',
      castUrl: 'https://warpcast.com/~/conversations/abc123',
    });
    mockPublishToThreads.mockResolvedValue({
      postId: 'thread-post-123',
      postUrl: 'https://www.threads.net/@thezao/post/thread-post-123',
    });
    mockFrom.mockReturnValue(makeInsertChain({ error: null }));

    const res = await import('../route').then((m) =>
      m.POST(
        makePostRequest('/api/publish/threads', {
          castHash: 'abc123',
          text: 'hello world',
        }),
      ),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.platformUrl).toBe('https://www.threads.net/@thezao/post/thread-post-123');
  });

  it('normalizes content with all optional fields', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    mockNormalizeForThreads.mockReturnValue({
      text: 'normalized text',
      images: ['https://example.com/img.jpg'],
      embeds: ['https://example.com/embed'],
      attribution: 'via ZAO OS',
      castHash: 'abc123',
      castUrl: 'https://warpcast.com/~/conversations/abc123',
    });
    mockPublishToThreads.mockResolvedValue({
      postId: 'post-456',
      postUrl: 'https://www.threads.net/@thezao/post/post-456',
    });
    mockFrom.mockReturnValue(makeInsertChain({ error: null }));

    const res = await import('../route').then((m) =>
      m.POST(
        makePostRequest('/api/publish/threads', {
          castHash: 'abc123',
          text: 'original text',
          embedUrls: ['https://example.com/embed'],
          imageUrls: ['https://example.com/img.jpg'],
          channel: 'base',
        }),
      ),
    );

    expect(res.status).toBe(200);
    expect(mockNormalizeForThreads).toHaveBeenCalledWith({
      text: 'original text',
      castHash: 'abc123',
      embedUrls: ['https://example.com/embed'],
      imageUrls: ['https://example.com/img.jpg'],
      channel: 'base',
    });
    expect(mockPublishToThreads).toHaveBeenCalledWith({
      text: 'normalized text',
      images: ['https://example.com/img.jpg'],
      embeds: ['https://example.com/embed'],
      attribution: 'via ZAO OS',
      castHash: 'abc123',
      castUrl: 'https://warpcast.com/~/conversations/abc123',
    });
  });

  it('logs to publish_log table on success with fid from session', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 999 }));
    const normalizedContent = {
      text: 'normalized text\n\nvia ZAO OS\nhttps://...',
      images: [],
      embeds: [],
      attribution: 'via ZAO OS',
      castHash: 'hash456',
      castUrl: 'https://warpcast.com/~/conversations/hash456',
    };
    mockNormalizeForThreads.mockReturnValue(normalizedContent);
    mockPublishToThreads.mockResolvedValue({
      postId: 'post-999',
      postUrl: 'https://www.threads.net/@thezao/post/post-999',
    });
    const chain = makeInsertChain({ error: null });
    mockFrom.mockReturnValue(chain);

    const res = await import('../route').then((m) =>
      m.POST(
        makePostRequest('/api/publish/threads', {
          castHash: 'hash456',
          text: 'test message',
        }),
      ),
    );

    expect(res.status).toBe(200);
    expect(mockFrom).toHaveBeenCalledWith('publish_log');
    expect(chain.insert).toHaveBeenCalledWith({
      platform: 'threads',
      cast_hash: 'hash456',
      platform_post_id: 'post-999',
      platform_url: 'https://www.threads.net/@thezao/post/post-999',
      published_by_fid: 999,
      text: 'normalized text\n\nvia ZAO OS\nhttps://...',
      status: 'published',
    });
  });

  it('returns 500 when publishToThreads throws an error', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    mockNormalizeForThreads.mockReturnValue({
      text: 'normalized',
      images: [],
      embeds: [],
      attribution: 'via ZAO OS',
      castHash: 'abc123',
      castUrl: 'https://warpcast.com/~/conversations/abc123',
    });
    mockPublishToThreads.mockRejectedValue(
      new Error('Threads container creation failed: Rate limit exceeded'),
    );

    const res = await import('../route').then((m) =>
      m.POST(
        makePostRequest('/api/publish/threads', {
          castHash: 'abc123',
          text: 'hello',
        }),
      ),
    );

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('Threads container creation failed: Rate limit exceeded');
  });

  it('returns 500 with generic message for non-Error exceptions', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    mockNormalizeForThreads.mockReturnValue({
      text: 'normalized',
      images: [],
      embeds: [],
      attribution: 'via ZAO OS',
      castHash: 'abc123',
      castUrl: 'https://warpcast.com/~/conversations/abc123',
    });
    mockPublishToThreads.mockRejectedValue('string error');

    const res = await import('../route').then((m) =>
      m.POST(
        makePostRequest('/api/publish/threads', {
          castHash: 'abc123',
          text: 'hello',
        }),
      ),
    );

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to publish to Threads');
  });

  it('returns success=true and platformUrl in response shape', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    mockNormalizeForThreads.mockReturnValue({
      text: 'normalized',
      images: [],
      embeds: [],
      attribution: 'via ZAO OS',
      castHash: 'abc123',
      castUrl: 'https://warpcast.com/~/conversations/abc123',
    });
    mockPublishToThreads.mockResolvedValue({
      postId: 'final-post',
      postUrl: 'https://www.threads.net/@thezao/post/final-post',
    });
    mockFrom.mockReturnValue(makeInsertChain({ error: null }));

    const res = await import('../route').then((m) =>
      m.POST(
        makePostRequest('/api/publish/threads', {
          castHash: 'abc123',
          text: 'final test',
        }),
      ),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      success: true,
      platformUrl: 'https://www.threads.net/@thezao/post/final-post',
    });
  });

  it('handles all Zod schema fields: castHash, text, embedUrls, imageUrls, channel', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    mockNormalizeForThreads.mockReturnValue({
      text: 'normalized',
      images: ['https://example.com/img.jpg'],
      embeds: ['https://example.com/embed'],
      attribution: 'via ZAO OS',
      castHash: 'cast-abc',
      castUrl: 'https://warpcast.com/~/conversations/cast-abc',
    });
    mockPublishToThreads.mockResolvedValue({
      postId: 'multi-field-post',
      postUrl: 'https://www.threads.net/@thezao/post/multi-field-post',
    });
    mockFrom.mockReturnValue(makeInsertChain({ error: null }));

    const res = await import('../route').then((m) =>
      m.POST(
        makePostRequest('/api/publish/threads', {
          castHash: 'cast-abc',
          text: 'full payload test',
          embedUrls: ['https://example.com/embed'],
          imageUrls: ['https://example.com/img.jpg'],
          channel: 'base',
        }),
      ),
    );

    expect(res.status).toBe(200);
    expect(mockNormalizeForThreads).toHaveBeenCalledWith({
      text: 'full payload test',
      castHash: 'cast-abc',
      embedUrls: ['https://example.com/embed'],
      imageUrls: ['https://example.com/img.jpg'],
      channel: 'base',
    });
  });

  it('accepts text at exactly 1024 characters', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const text1024 = 'a'.repeat(1024);
    mockNormalizeForThreads.mockReturnValue({
      text: 'normalized',
      images: [],
      embeds: [],
      attribution: 'via ZAO OS',
      castHash: 'abc123',
      castUrl: 'https://warpcast.com/~/conversations/abc123',
    });
    mockPublishToThreads.mockResolvedValue({
      postId: 'post-exact',
      postUrl: 'https://www.threads.net/@thezao/post/post-exact',
    });
    mockFrom.mockReturnValue(makeInsertChain({ error: null }));

    const res = await import('../route').then((m) =>
      m.POST(
        makePostRequest('/api/publish/threads', {
          castHash: 'abc123',
          text: text1024,
        }),
      ),
    );

    expect(res.status).toBe(200);
    expect(mockNormalizeForThreads).toHaveBeenCalledWith({
      text: text1024,
      castHash: 'abc123',
    });
  });

  it('accepts embedUrls as empty array', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    mockNormalizeForThreads.mockReturnValue({
      text: 'normalized',
      images: [],
      embeds: [],
      attribution: 'via ZAO OS',
      castHash: 'abc123',
      castUrl: 'https://warpcast.com/~/conversations/abc123',
    });
    mockPublishToThreads.mockResolvedValue({
      postId: 'post-empty-embeds',
      postUrl: 'https://www.threads.net/@thezao/post/post-empty-embeds',
    });
    mockFrom.mockReturnValue(makeInsertChain({ error: null }));

    const res = await import('../route').then((m) =>
      m.POST(
        makePostRequest('/api/publish/threads', {
          castHash: 'abc123',
          text: 'hello',
          embedUrls: [],
        }),
      ),
    );

    expect(res.status).toBe(200);
    expect(mockNormalizeForThreads).toHaveBeenCalledWith({
      text: 'hello',
      castHash: 'abc123',
      embedUrls: [],
    });
  });

  it('accepts imageUrls as empty array', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    mockNormalizeForThreads.mockReturnValue({
      text: 'normalized',
      images: [],
      embeds: [],
      attribution: 'via ZAO OS',
      castHash: 'abc123',
      castUrl: 'https://warpcast.com/~/conversations/abc123',
    });
    mockPublishToThreads.mockResolvedValue({
      postId: 'post-empty-images',
      postUrl: 'https://www.threads.net/@thezao/post/post-empty-images',
    });
    mockFrom.mockReturnValue(makeInsertChain({ error: null }));

    const res = await import('../route').then((m) =>
      m.POST(
        makePostRequest('/api/publish/threads', {
          castHash: 'abc123',
          text: 'hello',
          imageUrls: [],
        }),
      ),
    );

    expect(res.status).toBe(200);
    expect(mockNormalizeForThreads).toHaveBeenCalledWith({
      text: 'hello',
      castHash: 'abc123',
      imageUrls: [],
    });
  });

  it('omits optional fields from normalize call when not provided', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    mockNormalizeForThreads.mockReturnValue({
      text: 'normalized',
      images: [],
      embeds: [],
      attribution: 'via ZAO OS',
      castHash: 'abc123',
      castUrl: 'https://warpcast.com/~/conversations/abc123',
    });
    mockPublishToThreads.mockResolvedValue({
      postId: 'post-minimal',
      postUrl: 'https://www.threads.net/@thezao/post/post-minimal',
    });
    mockFrom.mockReturnValue(makeInsertChain({ error: null }));

    const res = await import('../route').then((m) =>
      m.POST(
        makePostRequest('/api/publish/threads', {
          castHash: 'abc123',
          text: 'minimal',
        }),
      ),
    );

    expect(res.status).toBe(200);
    // Verify normalize was called WITHOUT embedUrls, imageUrls, channel
    expect(mockNormalizeForThreads).toHaveBeenCalledWith({
      text: 'minimal',
      castHash: 'abc123',
    });
  });
});
