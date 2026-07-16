import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makePostRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

const { mockGetSessionData, mockNormalizeForLens, mockPublishToLens, mockFrom, mockLogger } =
  vi.hoisted(() => ({
    mockGetSessionData: vi.fn(),
    mockNormalizeForLens: vi.fn(),
    mockPublishToLens: vi.fn(),
    mockFrom: vi.fn(),
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

vi.mock('@/lib/publish/normalize', () => ({
  normalizeForLens: (_input: unknown) => mockNormalizeForLens(_input),
}));

vi.mock('@/lib/publish/lens', () => ({
  publishToLens: (_token: unknown, _refresh: unknown, _content: unknown) =>
    mockPublishToLens(_token, _refresh, _content),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/logger', () => ({
  logger: mockLogger,
}));

// Test fixture: supabase chain mock for user select + publish_log insert
function makeChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};

  // Chainable methods
  const chainableMethods = ['select', 'eq', 'insert', 'update', 'delete', 'order', 'limit'];
  for (const method of chainableMethods) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }

  // Terminal method — resolves the query
  chain.single = vi.fn().mockResolvedValue(result);

  // Allow the chain to be awaited directly
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (_resolve: (v: unknown) => void) =>
    _resolve(result);

  return chain;
}

describe('POST /api/publish/lens', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // Authentication Tests
  // ============================================================================

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

    const res = await import('../route').then((_m) =>
      _m.POST(makePostRequest('/api/publish/lens', { castHash: 'hash1', text: 'hello' })),
    );

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  // ============================================================================
  // JSON Parsing Tests
  // ============================================================================

  it('returns 400 when request body is invalid JSON', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const req = new Request(new URL('/api/publish/lens', 'http://localhost:3000'), {
      method: 'POST',
      body: '{invalid json}',
    });

    const res = await import('../route').then((_m) => _m.POST(req as never));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid JSON');
  });

  // ============================================================================
  // Zod Validation Tests
  // ============================================================================

  it('returns 400 when castHash is missing', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const res = await import('../route').then((_m) =>
      _m.POST(makePostRequest('/api/publish/lens', { text: 'hello' })),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
    expect(body.details).toBeDefined();
  });

  it('returns 400 when castHash is empty string', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const res = await import('../route').then((_m) =>
      _m.POST(makePostRequest('/api/publish/lens', { castHash: '', text: 'hello' })),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 when text is missing', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const res = await import('../route').then((_m) =>
      _m.POST(makePostRequest('/api/publish/lens', { castHash: 'hash1' })),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
    expect(body.details).toBeDefined();
  });

  it('returns 400 when text is empty string', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const res = await import('../route').then((_m) =>
      _m.POST(makePostRequest('/api/publish/lens', { castHash: 'hash1', text: '' })),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('accepts optional embedUrls, imageUrls, and channel fields', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    const userChain = makeChain({
      data: { lens_profile_id: 'profile1', lens_access_token: 'token1' },
    });
    mockFrom.mockReturnValue(userChain);
    mockNormalizeForLens.mockReturnValue({ text: 'normalized' });
    mockPublishToLens.mockResolvedValue({ postId: 'post1', postUrl: 'https://...' });
    const logChain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValueOnce(userChain).mockReturnValueOnce(logChain);

    const res = await import('../route').then((_m) =>
      _m.POST(
        makePostRequest('/api/publish/lens', {
          castHash: 'hash1',
          text: 'hello',
          embedUrls: ['https://example.com'],
          imageUrls: ['https://example.com/img.jpg'],
          channel: 'base',
        }),
      ),
    );

    expect(res.status).toBe(200);
    expect(mockNormalizeForLens).toHaveBeenCalledWith({
      text: 'hello',
      castHash: 'hash1',
      embedUrls: ['https://example.com'],
      imageUrls: ['https://example.com/img.jpg'],
      channel: 'base',
    });
  });

  // ============================================================================
  // Lens Configuration Tests (user record lookup)
  // ============================================================================

  it('returns 400 when user has no lens_profile_id', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    const userChain = makeChain({
      data: { lens_access_token: 'token1' }, // missing lens_profile_id
    });
    mockFrom.mockReturnValue(userChain);

    const res = await import('../route').then((_m) =>
      _m.POST(makePostRequest('/api/publish/lens', { castHash: 'hash1', text: 'hello' })),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Lens not connected — connect in Settings');
  });

  it('returns 400 when user has no lens_access_token', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    const userChain = makeChain({
      data: { lens_profile_id: 'profile1' }, // missing lens_access_token
    });
    mockFrom.mockReturnValue(userChain);

    const res = await import('../route').then((_m) =>
      _m.POST(makePostRequest('/api/publish/lens', { castHash: 'hash1', text: 'hello' })),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Lens auth tokens missing — reconnect with wallet in Settings');
  });

  // ============================================================================
  // Success Path Tests
  // ============================================================================

  it('publishes successfully with castHash and text', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    const userChain = makeChain({
      data: {
        lens_profile_id: 'profile1',
        lens_access_token: 'token1',
        lens_refresh_token: 'refresh1',
      },
    });
    mockNormalizeForLens.mockReturnValue({
      text: 'normalized text\n\nPosted via ZAO OS',
    });
    mockPublishToLens.mockResolvedValue({
      postId: 'post-abc',
      postUrl: 'https://hey.xyz/posts/post-abc',
    });
    const logChain = makeChain({ data: null, error: null });

    // Setup mockFrom to return userChain on first call (users select), logChain on second (publish_log insert)
    mockFrom.mockReturnValueOnce(userChain).mockReturnValueOnce(logChain);

    const res = await import('../route').then((_m) =>
      _m.POST(makePostRequest('/api/publish/lens', { castHash: 'hash1', text: 'hello' })),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.postId).toBe('post-abc');
    expect(body.postUrl).toBe('https://hey.xyz/posts/post-abc');
  });

  it('normalizes content before publishing', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    const userChain = makeChain({
      data: {
        lens_profile_id: 'profile1',
        lens_access_token: 'token1',
        lens_refresh_token: 'refresh1',
      },
    });
    mockNormalizeForLens.mockReturnValue({
      text: 'normalized',
      castHash: 'hash1',
      castUrl: 'https://warpcast.com/~/conversations/hash1',
      images: [],
      embeds: [],
      attribution: 'Posted via ZAO OS',
    });
    mockPublishToLens.mockResolvedValue({
      postId: 'post1',
      postUrl: 'https://hey.xyz/posts/post1',
    });
    const logChain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValueOnce(userChain).mockReturnValueOnce(logChain);

    const res = await import('../route').then((_m) =>
      _m.POST(
        makePostRequest('/api/publish/lens', {
          castHash: 'hash1',
          text: 'original text',
          embedUrls: ['https://example.com'],
        }),
      ),
    );

    expect(res.status).toBe(200);
    expect(mockNormalizeForLens).toHaveBeenCalledWith({
      text: 'original text',
      castHash: 'hash1',
      embedUrls: ['https://example.com'],
      imageUrls: undefined,
      channel: undefined,
    });
  });

  it('calls publishToLens with access token, refresh token, and normalized content', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    const userChain = makeChain({
      data: {
        lens_profile_id: 'profile1',
        lens_access_token: 'access-xyz',
        lens_refresh_token: 'refresh-xyz',
      },
    });
    const normalizedContent = {
      text: 'normalized text',
      castHash: 'hash1',
      castUrl: 'https://warpcast.com/~/conversations/hash1',
      images: [],
      embeds: [],
      attribution: 'Posted via ZAO OS',
    };
    mockNormalizeForLens.mockReturnValue(normalizedContent);
    mockPublishToLens.mockResolvedValue({
      postId: 'post1',
      postUrl: 'https://hey.xyz/posts/post1',
    });
    const logChain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValueOnce(userChain).mockReturnValueOnce(logChain);

    const res = await import('../route').then((_m) =>
      _m.POST(makePostRequest('/api/publish/lens', { castHash: 'hash1', text: 'hello' })),
    );

    expect(res.status).toBe(200);
    expect(mockPublishToLens).toHaveBeenCalledWith('access-xyz', 'refresh-xyz', normalizedContent);
  });

  it('handles missing lens_refresh_token by passing empty string', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    const userChain = makeChain({
      data: {
        lens_profile_id: 'profile1',
        lens_access_token: 'token1',
        lens_refresh_token: null, // missing
      },
    });
    mockNormalizeForLens.mockReturnValue({ text: 'normalized' });
    mockPublishToLens.mockResolvedValue({
      postId: 'post1',
      postUrl: 'https://hey.xyz/posts/post1',
    });
    const logChain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValueOnce(userChain).mockReturnValueOnce(logChain);

    const res = await import('../route').then((_m) =>
      _m.POST(makePostRequest('/api/publish/lens', { castHash: 'hash1', text: 'hello' })),
    );

    expect(res.status).toBe(200);
    expect(mockPublishToLens).toHaveBeenCalledWith('token1', '', expect.any(Object));
  });

  // ============================================================================
  // Supabase Logging Tests
  // ============================================================================

  it('logs successful publish to publish_log', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456 }));
    const userChain = makeChain({
      data: {
        lens_profile_id: 'profile1',
        lens_access_token: 'token1',
        lens_refresh_token: 'refresh1',
      },
    });
    mockNormalizeForLens.mockReturnValue({ text: 'normalized' });
    mockPublishToLens.mockResolvedValue({
      postId: 'post-xyz',
      postUrl: 'https://hey.xyz/posts/post-xyz',
    });
    const logChain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValueOnce(userChain).mockReturnValueOnce(logChain);

    const res = await import('../route').then((_m) =>
      _m.POST(makePostRequest('/api/publish/lens', { castHash: 'hash1', text: 'hello' })),
    );

    expect(res.status).toBe(200);
    expect(mockFrom).toHaveBeenNthCalledWith(2, 'publish_log');
    expect(logChain.insert).toHaveBeenCalledWith({
      cast_hash: 'hash1',
      fid: 456,
      platform: 'lens',
      status: 'success',
      platform_post_id: 'post-xyz',
      platform_url: 'https://hey.xyz/posts/post-xyz',
    });
  });

  it('logs failed publish with error_message', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456 }));
    const userChain = makeChain({
      data: {
        lens_profile_id: 'profile1',
        lens_access_token: 'token1',
        lens_refresh_token: 'refresh1',
      },
    });
    mockNormalizeForLens.mockReturnValue({ text: 'normalized' });
    mockPublishToLens.mockRejectedValue(new Error('Lens API error'));
    const logChain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValueOnce(userChain).mockReturnValueOnce(logChain);

    const res = await import('../route').then((_m) =>
      _m.POST(makePostRequest('/api/publish/lens', { castHash: 'hash1', text: 'hello' })),
    );

    expect(res.status).toBe(500);
    expect(mockFrom).toHaveBeenNthCalledWith(2, 'publish_log');
    expect(logChain.insert).toHaveBeenCalledWith({
      cast_hash: 'hash1',
      fid: 456,
      platform: 'lens',
      status: 'failed',
      error_message: 'Lens API error',
    });
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  it('returns 500 when publishToLens throws an Error', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    const userChain = makeChain({
      data: {
        lens_profile_id: 'profile1',
        lens_access_token: 'token1',
        lens_refresh_token: 'refresh1',
      },
    });
    mockNormalizeForLens.mockReturnValue({ text: 'normalized' });
    mockPublishToLens.mockRejectedValue(new Error('Network timeout'));
    const logChain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValueOnce(userChain).mockReturnValueOnce(logChain);

    const res = await import('../route').then((_m) =>
      _m.POST(makePostRequest('/api/publish/lens', { castHash: 'hash1', text: 'hello' })),
    );

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Network timeout');
  });

  it('returns 500 with generic message for non-Error exceptions', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    const userChain = makeChain({
      data: {
        lens_profile_id: 'profile1',
        lens_access_token: 'token1',
        lens_refresh_token: 'refresh1',
      },
    });
    mockNormalizeForLens.mockReturnValue({ text: 'normalized' });
    mockPublishToLens.mockRejectedValue('string error');
    const logChain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValueOnce(userChain).mockReturnValueOnce(logChain);

    const res = await import('../route').then((_m) =>
      _m.POST(makePostRequest('/api/publish/lens', { castHash: 'hash1', text: 'hello' })),
    );

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Lens publish failed');
  });

  it('logs errors with logger.error', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    const userChain = makeChain({
      data: {
        lens_profile_id: 'profile1',
        lens_access_token: 'token1',
        lens_refresh_token: 'refresh1',
      },
    });
    mockNormalizeForLens.mockReturnValue({ text: 'normalized' });
    const testError = new Error('Test publish failure');
    mockPublishToLens.mockRejectedValue(testError);
    const logChain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValueOnce(userChain).mockReturnValueOnce(logChain);

    const res = await import('../route').then((_m) =>
      _m.POST(makePostRequest('/api/publish/lens', { castHash: 'hash1', text: 'hello' })),
    );

    expect(res.status).toBe(500);
    expect(mockLogger.error).toHaveBeenCalledWith('[publish/lens] Error:', 'Test publish failure');
  });

  // ============================================================================
  // Response Shape Tests
  // ============================================================================

  it('returns correct response shape on success', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    const userChain = makeChain({
      data: {
        lens_profile_id: 'profile1',
        lens_access_token: 'token1',
        lens_refresh_token: 'refresh1',
      },
    });
    mockNormalizeForLens.mockReturnValue({ text: 'normalized' });
    mockPublishToLens.mockResolvedValue({
      postId: 'post-final',
      postUrl: 'https://hey.xyz/posts/post-final',
    });
    const logChain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValueOnce(userChain).mockReturnValueOnce(logChain);

    const res = await import('../route').then((_m) =>
      _m.POST(makePostRequest('/api/publish/lens', { castHash: 'hash1', text: 'test' })),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      success: true,
      postId: 'post-final',
      postUrl: 'https://hey.xyz/posts/post-final',
    });
  });

  it('returns correct response shape on error', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    const userChain = makeChain({
      data: {
        lens_profile_id: 'profile1',
        lens_access_token: 'token1',
        lens_refresh_token: 'refresh1',
      },
    });
    mockNormalizeForLens.mockReturnValue({ text: 'normalized' });
    mockPublishToLens.mockRejectedValue(new Error('API down'));
    const logChain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValueOnce(userChain).mockReturnValueOnce(logChain);

    const res = await import('../route').then((_m) =>
      _m.POST(makePostRequest('/api/publish/lens', { castHash: 'hash1', text: 'test' })),
    );

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: 'API down' });
  });

  // ============================================================================
  // Integration/Edge Case Tests
  // ============================================================================

  it('queries users table with correct fid from session', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 789 }));
    const userChain = makeChain({
      data: {
        lens_profile_id: 'profile1',
        lens_access_token: 'token1',
        lens_refresh_token: 'refresh1',
      },
    });
    mockNormalizeForLens.mockReturnValue({ text: 'normalized' });
    mockPublishToLens.mockResolvedValue({
      postId: 'post1',
      postUrl: 'https://hey.xyz/posts/post1',
    });
    const logChain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValueOnce(userChain).mockReturnValueOnce(logChain);

    const res = await import('../route').then((_m) =>
      _m.POST(makePostRequest('/api/publish/lens', { castHash: 'hash1', text: 'hello' })),
    );

    expect(res.status).toBe(200);
    expect(mockFrom).toHaveBeenNthCalledWith(1, 'users');
    // Verify .select() and .eq() were called in the chain
    expect(userChain.select).toHaveBeenCalledWith(
      'lens_profile_id, lens_access_token, lens_refresh_token',
    );
    expect(userChain.eq).toHaveBeenCalledWith('fid', 789);
  });

  it('handles all schema fields correctly', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    const userChain = makeChain({
      data: {
        lens_profile_id: 'profile1',
        lens_access_token: 'token1',
        lens_refresh_token: 'refresh1',
      },
    });
    mockNormalizeForLens.mockReturnValue({ text: 'normalized' });
    mockPublishToLens.mockResolvedValue({
      postId: 'post1',
      postUrl: 'https://hey.xyz/posts/post1',
    });
    const logChain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValueOnce(userChain).mockReturnValueOnce(logChain);

    const res = await import('../route').then((_m) =>
      _m.POST(
        makePostRequest('/api/publish/lens', {
          castHash: 'hash-value',
          text: 'content text',
          embedUrls: ['https://a.com', 'https://b.com'],
          imageUrls: ['https://img1.jpg', 'https://img2.jpg'],
          channel: 'farcaster',
        }),
      ),
    );

    expect(res.status).toBe(200);
    expect(mockNormalizeForLens).toHaveBeenCalledWith({
      text: 'content text',
      castHash: 'hash-value',
      embedUrls: ['https://a.com', 'https://b.com'],
      imageUrls: ['https://img1.jpg', 'https://img2.jpg'],
      channel: 'farcaster',
    });
  });
});
