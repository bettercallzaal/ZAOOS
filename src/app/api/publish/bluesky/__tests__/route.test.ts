import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makePostRequest,
  mockAdminSession,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

const { mockGetSessionData, mockNormalizeForBluesky, mockPublishToBluesky, mockFrom } = vi.hoisted(
  () => ({
    mockGetSessionData: vi.fn(),
    mockNormalizeForBluesky: vi.fn(),
    mockPublishToBluesky: vi.fn(),
    mockFrom: vi.fn(),
  }),
);

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/publish/normalize', () => ({
  normalizeForBluesky: (_input: unknown) => mockNormalizeForBluesky(_input),
}));

vi.mock('@/lib/publish/bluesky', () => ({
  isBlueskyConfigured: () => !!(process.env.BLUESKY_HANDLE && process.env.BLUESKY_APP_PASSWORD),
  publishToBluesky: (_input: unknown) => mockPublishToBluesky(_input),
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
  (chain as unknown as { then: unknown }).then = (resolve: (_v: unknown) => void) =>
    resolve(result);
  return chain;
}

describe('POST /api/publish/bluesky', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.BLUESKY_HANDLE = 'test-handle.bsky.social';
    process.env.BLUESKY_APP_PASSWORD = 'test-app-password';
  });

  describe('Authentication & Authorization', () => {
    it('returns 401 when unauthenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
      const res = await import('../route').then((_m) =>
        _m.POST(
          makePostRequest('/api/publish/bluesky', {
            castHash: 'abc123',
            text: 'hello world',
          }),
        ),
      );
      expect(res.status).toBe(401);
      expect((await res.json()).error).toBe('Unauthorized');
    });

    it('returns 403 when user is not admin', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ isAdmin: false }));
      const res = await import('../route').then((_m) =>
        _m.POST(
          makePostRequest('/api/publish/bluesky', {
            castHash: 'abc123',
            text: 'hello world',
          }),
        ),
      );
      expect(res.status).toBe(403);
      expect((await res.json()).error).toBe('Admin access required');
    });

    it('returns 401 when session is null', async () => {
      mockGetSessionData.mockResolvedValue(null);
      const res = await import('../route').then((_m) =>
        _m.POST(
          makePostRequest('/api/publish/bluesky', {
            castHash: 'abc123',
            text: 'hello world',
          }),
        ),
      );
      expect(res.status).toBe(401);
    });
  });

  describe('Bluesky Configuration', () => {
    it('returns 503 when BLUESKY_HANDLE is not configured', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      delete process.env.BLUESKY_HANDLE;
      const res = await import('../route').then((_m) =>
        _m.POST(
          makePostRequest('/api/publish/bluesky', {
            castHash: 'abc123',
            text: 'hello world',
          }),
        ),
      );
      expect(res.status).toBe(503);
      expect((await res.json()).error).toBe('Bluesky not configured');
    });

    it('returns 503 when BLUESKY_APP_PASSWORD is not configured', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      delete process.env.BLUESKY_APP_PASSWORD;
      const res = await import('../route').then((_m) =>
        _m.POST(
          makePostRequest('/api/publish/bluesky', {
            castHash: 'abc123',
            text: 'hello world',
          }),
        ),
      );
      expect(res.status).toBe(503);
      expect((await res.json()).error).toBe('Bluesky not configured');
    });

    it('returns 503 when both BLUESKY credentials are missing', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      delete process.env.BLUESKY_HANDLE;
      delete process.env.BLUESKY_APP_PASSWORD;
      const res = await import('../route').then((_m) =>
        _m.POST(
          makePostRequest('/api/publish/bluesky', {
            castHash: 'abc123',
            text: 'hello world',
          }),
        ),
      );
      expect(res.status).toBe(503);
    });
  });

  describe('JSON Parsing', () => {
    it('returns 400 when request body is invalid JSON', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      const req = new Request(new URL('/api/publish/bluesky', 'http://localhost:3000'), {
        method: 'POST',
        body: '{invalid json}',
      });
      const res = await import('../route').then((_m) => _m.POST(req as never));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toBe('Invalid JSON');
    });

    it('returns 400 when body is empty', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      const req = new Request(new URL('/api/publish/bluesky', 'http://localhost:3000'), {
        method: 'POST',
        body: '',
      });
      const res = await import('../route').then((_m) => _m.POST(req as never));
      expect(res.status).toBe(400);
    });
  });

  describe('Zod Validation: castHash', () => {
    it('returns 400 when castHash is missing', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      const res = await import('../route').then((_m) =>
        _m.POST(makePostRequest('/api/publish/bluesky', { text: 'hello world' })),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when castHash is empty string', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      const res = await import('../route').then((_m) =>
        _m.POST(
          makePostRequest('/api/publish/bluesky', {
            castHash: '',
            text: 'hello world',
          }),
        ),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
    });

    it('accepts castHash with min length 1', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      mockNormalizeForBluesky.mockReturnValue({
        text: 'normalized',
        castHash: 'x',
      });
      mockPublishToBluesky.mockResolvedValue({
        uri: 'at://did:...',
        cid: 'cid123',
        postUrl: 'https://bsky.app/profile/test-handle.bsky.social/post/abc',
      });
      mockFrom.mockReturnValue(makeInsertChain({ error: null }));

      const res = await import('../route').then((_m) =>
        _m.POST(
          makePostRequest('/api/publish/bluesky', {
            castHash: 'x',
            text: 'hello',
          }),
        ),
      );

      expect(res.status).toBe(200);
    });
  });

  describe('Zod Validation: text', () => {
    it('returns 400 when text is missing', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      const res = await import('../route').then((_m) =>
        _m.POST(
          makePostRequest('/api/publish/bluesky', {
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
      const res = await import('../route').then((_m) =>
        _m.POST(
          makePostRequest('/api/publish/bluesky', {
            castHash: 'abc123',
            text: '',
          }),
        ),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
    });

    it('accepts text with min length 1', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      mockNormalizeForBluesky.mockReturnValue({
        text: 'x',
        castHash: 'abc123',
      });
      mockPublishToBluesky.mockResolvedValue({
        uri: 'at://did:...',
        cid: 'cid123',
        postUrl: 'https://bsky.app/profile/test-handle.bsky.social/post/abc',
      });
      mockFrom.mockReturnValue(makeInsertChain({ error: null }));

      const res = await import('../route').then((_m) =>
        _m.POST(
          makePostRequest('/api/publish/bluesky', {
            castHash: 'abc123',
            text: 'x',
          }),
        ),
      );

      expect(res.status).toBe(200);
    });

    it('returns 400 when text exceeds 1024 characters', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      const longText = 'a'.repeat(1025);
      const res = await import('../route').then((_m) =>
        _m.POST(
          makePostRequest('/api/publish/bluesky', {
            castHash: 'abc123',
            text: longText,
          }),
        ),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
    });

    it('accepts text at max length 1024', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      const maxText = 'a'.repeat(1024);
      mockNormalizeForBluesky.mockReturnValue({
        text: maxText,
        castHash: 'abc123',
      });
      mockPublishToBluesky.mockResolvedValue({
        uri: 'at://did:...',
        cid: 'cid123',
        postUrl: 'https://bsky.app/profile/test-handle.bsky.social/post/abc',
      });
      mockFrom.mockReturnValue(makeInsertChain({ error: null }));

      const res = await import('../route').then((_m) =>
        _m.POST(
          makePostRequest('/api/publish/bluesky', {
            castHash: 'abc123',
            text: maxText,
          }),
        ),
      );

      expect(res.status).toBe(200);
    });
  });

  describe('Zod Validation: embedUrls & imageUrls', () => {
    it('returns 400 when embedUrls contains invalid URL', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      const res = await import('../route').then((_m) =>
        _m.POST(
          makePostRequest('/api/publish/bluesky', {
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
      const res = await import('../route').then((_m) =>
        _m.POST(
          makePostRequest('/api/publish/bluesky', {
            castHash: 'abc123',
            text: 'hello',
            imageUrls: ['not a valid url'],
          }),
        ),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
    });

    it('accepts valid HTTP URLs in embedUrls', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      mockNormalizeForBluesky.mockReturnValue({
        text: 'normalized',
        castHash: 'abc123',
      });
      mockPublishToBluesky.mockResolvedValue({
        uri: 'at://did:...',
        cid: 'cid123',
        postUrl: 'https://bsky.app/profile/test-handle.bsky.social/post/abc',
      });
      mockFrom.mockReturnValue(makeInsertChain({ error: null }));

      const res = await import('../route').then((_m) =>
        _m.POST(
          makePostRequest('/api/publish/bluesky', {
            castHash: 'abc123',
            text: 'check this',
            embedUrls: ['https://example.com/article'],
          }),
        ),
      );

      expect(res.status).toBe(200);
      expect(mockNormalizeForBluesky).toHaveBeenCalledWith({
        text: 'check this',
        castHash: 'abc123',
        embedUrls: ['https://example.com/article'],
        imageUrls: undefined,
        channel: undefined,
      });
    });

    it('accepts valid HTTPS URLs in imageUrls', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      mockNormalizeForBluesky.mockReturnValue({
        text: 'normalized',
        castHash: 'abc123',
      });
      mockPublishToBluesky.mockResolvedValue({
        uri: 'at://did:...',
        cid: 'cid123',
        postUrl: 'https://bsky.app/profile/test-handle.bsky.social/post/abc',
      });
      mockFrom.mockReturnValue(makeInsertChain({ error: null }));

      const res = await import('../route').then((_m) =>
        _m.POST(
          makePostRequest('/api/publish/bluesky', {
            castHash: 'abc123',
            text: 'photo',
            imageUrls: ['https://example.com/image.jpg', 'https://example.com/image2.png'],
          }),
        ),
      );

      expect(res.status).toBe(200);
      expect(mockNormalizeForBluesky).toHaveBeenCalledWith({
        text: 'photo',
        castHash: 'abc123',
        embedUrls: undefined,
        imageUrls: ['https://example.com/image.jpg', 'https://example.com/image2.png'],
        channel: undefined,
      });
    });

    it('accepts empty embedUrls and imageUrls arrays', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      mockNormalizeForBluesky.mockReturnValue({
        text: 'normalized',
        castHash: 'abc123',
      });
      mockPublishToBluesky.mockResolvedValue({
        uri: 'at://did:...',
        cid: 'cid123',
        postUrl: 'https://bsky.app/profile/test-handle.bsky.social/post/abc',
      });
      mockFrom.mockReturnValue(makeInsertChain({ error: null }));

      const res = await import('../route').then((_m) =>
        _m.POST(
          makePostRequest('/api/publish/bluesky', {
            castHash: 'abc123',
            text: 'text only',
            embedUrls: [],
            imageUrls: [],
          }),
        ),
      );

      expect(res.status).toBe(200);
    });
  });

  describe('Zod Validation: channel', () => {
    it('accepts optional channel field', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      mockNormalizeForBluesky.mockReturnValue({
        text: 'normalized',
        castHash: 'abc123',
      });
      mockPublishToBluesky.mockResolvedValue({
        uri: 'at://did:...',
        cid: 'cid123',
        postUrl: 'https://bsky.app/profile/test-handle.bsky.social/post/abc',
      });
      mockFrom.mockReturnValue(makeInsertChain({ error: null }));

      const res = await import('../route').then((_m) =>
        _m.POST(
          makePostRequest('/api/publish/bluesky', {
            castHash: 'abc123',
            text: 'hello',
            channel: 'zao',
          }),
        ),
      );

      expect(res.status).toBe(200);
      expect(mockNormalizeForBluesky).toHaveBeenCalledWith({
        text: 'hello',
        castHash: 'abc123',
        embedUrls: undefined,
        imageUrls: undefined,
        channel: 'zao',
      });
    });

    it('works without channel field', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      mockNormalizeForBluesky.mockReturnValue({
        text: 'normalized',
        castHash: 'abc123',
      });
      mockPublishToBluesky.mockResolvedValue({
        uri: 'at://did:...',
        cid: 'cid123',
        postUrl: 'https://bsky.app/profile/test-handle.bsky.social/post/abc',
      });
      mockFrom.mockReturnValue(makeInsertChain({ error: null }));

      const res = await import('../route').then((_m) =>
        _m.POST(
          makePostRequest('/api/publish/bluesky', {
            castHash: 'abc123',
            text: 'hello',
          }),
        ),
      );

      expect(res.status).toBe(200);
    });
  });

  describe('Happy Path: Normalization & Publishing', () => {
    it('calls normalizeForBluesky with parsed input', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      mockNormalizeForBluesky.mockReturnValue({
        text: 'normalized text\n\nvia ZAO OS',
        castHash: 'abc123',
      });
      mockPublishToBluesky.mockResolvedValue({
        uri: 'at://did:plc:abc/app.bsky.feed.post/123',
        cid: 'bafy123',
        postUrl: 'https://bsky.app/profile/test-handle.bsky.social/post/abc456',
      });
      mockFrom.mockReturnValue(makeInsertChain({ error: null }));

      const res = await import('../route').then((_m) =>
        _m.POST(
          makePostRequest('/api/publish/bluesky', {
            castHash: 'abc123',
            text: 'original text',
            embedUrls: ['https://example.com/link'],
            imageUrls: ['https://example.com/image.jpg'],
            channel: 'base',
          }),
        ),
      );

      expect(res.status).toBe(200);
      expect(mockNormalizeForBluesky).toHaveBeenCalledWith({
        text: 'original text',
        castHash: 'abc123',
        embedUrls: ['https://example.com/link'],
        imageUrls: ['https://example.com/image.jpg'],
        channel: 'base',
      });
    });

    it('calls publishToBluesky with normalized content', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      const normalized = {
        text: 'normalized text\n\nvia ZAO OS',
        castHash: 'abc123',
        images: ['https://example.com/image.jpg'],
        embeds: ['https://example.com/link'],
        attribution: 'via ZAO OS',
        castUrl: 'https://warpcast.com/~/conversations/abc123',
      };
      mockNormalizeForBluesky.mockReturnValue(normalized);
      mockPublishToBluesky.mockResolvedValue({
        uri: 'at://did:plc:abc/app.bsky.feed.post/123',
        cid: 'bafy123',
        postUrl: 'https://bsky.app/profile/test-handle.bsky.social/post/abc456',
      });
      mockFrom.mockReturnValue(makeInsertChain({ error: null }));

      await import('../route').then((_m) =>
        _m.POST(
          makePostRequest('/api/publish/bluesky', {
            castHash: 'abc123',
            text: 'original text',
          }),
        ),
      );

      expect(mockPublishToBluesky).toHaveBeenCalledWith(normalized);
    });

    it('returns 200 with success=true and platformUrl on successful publish', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      mockNormalizeForBluesky.mockReturnValue({
        text: 'normalized',
        castHash: 'abc123',
      });
      mockPublishToBluesky.mockResolvedValue({
        uri: 'at://did:plc:abc/app.bsky.feed.post/xyz',
        cid: 'bafy789',
        postUrl: 'https://bsky.app/profile/test-handle.bsky.social/post/xyz789',
      });
      mockFrom.mockReturnValue(makeInsertChain({ error: null }));

      const res = await import('../route').then((_m) =>
        _m.POST(
          makePostRequest('/api/publish/bluesky', {
            castHash: 'abc123',
            text: 'hello world',
          }),
        ),
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.platformUrl).toBe('https://bsky.app/profile/test-handle.bsky.social/post/xyz789');
    });

    it('records publish in supabase publish_log table', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 456 }));
      const normalizedText = 'normalized text\n\nvia ZAO OS';
      mockNormalizeForBluesky.mockReturnValue({
        text: normalizedText,
        castHash: 'abc123',
      });
      mockPublishToBluesky.mockResolvedValue({
        uri: 'at://did:plc:abc/app.bsky.feed.post/456',
        cid: 'bafy456',
        postUrl: 'https://bsky.app/profile/test-handle.bsky.social/post/abc456',
      });
      const chain = makeInsertChain({ error: null });
      mockFrom.mockReturnValue(chain);

      await import('../route').then((_m) =>
        _m.POST(
          makePostRequest('/api/publish/bluesky', {
            castHash: 'abc123',
            text: 'test message',
          }),
        ),
      );

      expect(mockFrom).toHaveBeenCalledWith('publish_log');
      expect(chain.insert).toHaveBeenCalledWith({
        platform: 'bluesky',
        cast_hash: 'abc123',
        platform_post_id: 'at://did:plc:abc/app.bsky.feed.post/456',
        platform_url: 'https://bsky.app/profile/test-handle.bsky.social/post/abc456',
        published_by_fid: 456,
        text: normalizedText,
        status: 'published',
      });
    });

    it('records fid from session in publish_log', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 999 }));
      mockNormalizeForBluesky.mockReturnValue({
        text: 'normalized',
        castHash: 'hash',
      });
      mockPublishToBluesky.mockResolvedValue({
        uri: 'at://uri',
        cid: 'cid',
        postUrl: 'https://bsky.app/profile/test/post/xyz',
      });
      const chain = makeInsertChain({ error: null });
      mockFrom.mockReturnValue(chain);

      await import('../route').then((_m) =>
        _m.POST(
          makePostRequest('/api/publish/bluesky', {
            castHash: 'hash',
            text: 'msg',
          }),
        ),
      );

      expect(chain.insert).toHaveBeenCalledWith(expect.objectContaining({ published_by_fid: 999 }));
    });

    it('includes normalized text in publish_log record', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      const normalizedText = 'this is the normalized version';
      mockNormalizeForBluesky.mockReturnValue({
        text: normalizedText,
        castHash: 'abc123',
      });
      mockPublishToBluesky.mockResolvedValue({
        uri: 'at://uri',
        cid: 'cid',
        postUrl: 'https://bsky.app/profile/test/post/abc',
      });
      const chain = makeInsertChain({ error: null });
      mockFrom.mockReturnValue(chain);

      await import('../route').then((_m) =>
        _m.POST(
          makePostRequest('/api/publish/bluesky', {
            castHash: 'abc123',
            text: 'original',
          }),
        ),
      );

      expect(chain.insert).toHaveBeenCalledWith(expect.objectContaining({ text: normalizedText }));
    });

    it('uses result.uri as platform_post_id and result.postUrl as platform_url', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      mockNormalizeForBluesky.mockReturnValue({
        text: 'normalized',
        castHash: 'abc123',
      });
      const expectedUri = 'at://did:plc:xyz/app.bsky.feed.post/999';
      const expectedPostUrl = 'https://bsky.app/profile/test-handle.bsky.social/post/post999';
      mockPublishToBluesky.mockResolvedValue({
        uri: expectedUri,
        cid: 'cidABC',
        postUrl: expectedPostUrl,
      });
      const chain = makeInsertChain({ error: null });
      mockFrom.mockReturnValue(chain);

      await import('../route').then((_m) =>
        _m.POST(
          makePostRequest('/api/publish/bluesky', {
            castHash: 'abc123',
            text: 'msg',
          }),
        ),
      );

      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          platform_post_id: expectedUri,
          platform_url: expectedPostUrl,
        }),
      );
    });
  });

  describe('Error Handling: publishToBluesky Failures', () => {
    it('returns 500 when publishToBluesky throws Error', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      mockNormalizeForBluesky.mockReturnValue({
        text: 'normalized',
        castHash: 'abc123',
      });
      mockPublishToBluesky.mockRejectedValue(new Error('Bluesky API connection timeout'));

      const res = await import('../route').then((_m) =>
        _m.POST(
          makePostRequest('/api/publish/bluesky', {
            castHash: 'abc123',
            text: 'hello',
          }),
        ),
      );

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('Bluesky API connection timeout');
    });

    it('returns 500 with generic message when publishToBluesky throws non-Error', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      mockNormalizeForBluesky.mockReturnValue({
        text: 'normalized',
        castHash: 'abc123',
      });
      mockPublishToBluesky.mockRejectedValue('string error');

      const res = await import('../route').then((_m) =>
        _m.POST(
          makePostRequest('/api/publish/bluesky', {
            castHash: 'abc123',
            text: 'hello',
          }),
        ),
      );

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('Failed to publish to Bluesky');
    });

    it('returns 500 when publishToBluesky throws object without message', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      mockNormalizeForBluesky.mockReturnValue({
        text: 'normalized',
        castHash: 'abc123',
      });
      mockPublishToBluesky.mockRejectedValue({ code: 'ERR_SOMETHING' });

      const res = await import('../route').then((_m) =>
        _m.POST(
          makePostRequest('/api/publish/bluesky', {
            castHash: 'abc123',
            text: 'hello',
          }),
        ),
      );

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Failed to publish to Bluesky');
    });

    it('does not call supabaseAdmin.from when publishToBluesky fails', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      mockNormalizeForBluesky.mockReturnValue({
        text: 'normalized',
        castHash: 'abc123',
      });
      mockPublishToBluesky.mockRejectedValue(new Error('publish failed'));

      await import('../route').then((_m) =>
        _m.POST(
          makePostRequest('/api/publish/bluesky', {
            castHash: 'abc123',
            text: 'hello',
          }),
        ),
      );

      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling: normalizeForBluesky Failures', () => {
    it('returns 500 when normalizeForBluesky throws', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      mockNormalizeForBluesky.mockImplementation(() => {
        throw new Error('Normalization failed');
      });

      const res = await import('../route').then((_m) =>
        _m.POST(
          makePostRequest('/api/publish/bluesky', {
            castHash: 'abc123',
            text: 'hello',
          }),
        ),
      );

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('Normalization failed');
    });
  });

  describe('Error Handling: Supabase Insert Failures', () => {
    it('still returns 200 even if supabase insert fails (best-effort logging)', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      mockNormalizeForBluesky.mockReturnValue({
        text: 'normalized',
        castHash: 'abc123',
      });
      mockPublishToBluesky.mockResolvedValue({
        uri: 'at://uri',
        cid: 'cid',
        postUrl: 'https://bsky.app/profile/test/post/abc',
      });
      const chain = makeInsertChain({ error: 'Database error' });
      mockFrom.mockReturnValue(chain);

      const res = await import('../route').then((_m) =>
        _m.POST(
          makePostRequest('/api/publish/bluesky', {
            castHash: 'abc123',
            text: 'hello',
          }),
        ),
      );

      // Even if supabase fails, the publish itself succeeded
      // Note: The route currently doesn't check supabase errors, so this passes through
      expect(res.status).toBe(200);
    });
  });

  describe('Full Integration: All Fields', () => {
    it('handles complete payload with all optional fields', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 111 }));
      mockNormalizeForBluesky.mockReturnValue({
        text: 'full normalized',
        castHash: 'fullhash',
      });
      mockPublishToBluesky.mockResolvedValue({
        uri: 'at://full/uri',
        cid: 'fullcid',
        postUrl: 'https://bsky.app/profile/test-handle.bsky.social/post/fullpost',
      });
      const chain = makeInsertChain({ error: null });
      mockFrom.mockReturnValue(chain);

      const res = await import('../route').then((_m) =>
        _m.POST(
          makePostRequest('/api/publish/bluesky', {
            castHash: 'fullhash',
            text: 'full message text',
            embedUrls: ['https://example.com/link1', 'https://example.com/link2'],
            imageUrls: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
            channel: 'governance',
          }),
        ),
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.platformUrl).toBe(
        'https://bsky.app/profile/test-handle.bsky.social/post/fullpost',
      );

      expect(mockNormalizeForBluesky).toHaveBeenCalledWith({
        castHash: 'fullhash',
        text: 'full message text',
        embedUrls: ['https://example.com/link1', 'https://example.com/link2'],
        imageUrls: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
        channel: 'governance',
      });

      expect(chain.insert).toHaveBeenCalledWith({
        platform: 'bluesky',
        cast_hash: 'fullhash',
        platform_post_id: 'at://full/uri',
        platform_url: 'https://bsky.app/profile/test-handle.bsky.social/post/fullpost',
        published_by_fid: 111,
        text: 'full normalized',
        status: 'published',
      });
    });
  });

  describe('Response Shape', () => {
    it('returns { success: true, platformUrl: string } on success', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      mockNormalizeForBluesky.mockReturnValue({
        text: 'normalized',
        castHash: 'abc123',
      });
      mockPublishToBluesky.mockResolvedValue({
        uri: 'at://uri',
        cid: 'cid',
        postUrl: 'https://bsky.app/profile/test/post/final',
      });
      mockFrom.mockReturnValue(makeInsertChain({ error: null }));

      const res = await import('../route').then((_m) =>
        _m.POST(
          makePostRequest('/api/publish/bluesky', {
            castHash: 'abc123',
            text: 'test',
          }),
        ),
      );

      const body = await res.json();
      expect(body).toEqual({
        success: true,
        platformUrl: 'https://bsky.app/profile/test/post/final',
      });
    });

    it('returns { success: false, error: string } on error', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      mockNormalizeForBluesky.mockReturnValue({
        text: 'normalized',
        castHash: 'abc123',
      });
      mockPublishToBluesky.mockRejectedValue(new Error('API error'));

      const res = await import('../route').then((_m) =>
        _m.POST(
          makePostRequest('/api/publish/bluesky', {
            castHash: 'abc123',
            text: 'test',
          }),
        ),
      );

      const body = await res.json();
      expect(body).toEqual({
        success: false,
        error: 'API error',
      });
    });

    it('returns { error, details } shape for validation errors', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());

      const res = await import('../route').then((_m) =>
        _m.POST(
          makePostRequest('/api/publish/bluesky', {
            castHash: 'abc123',
            // text missing
          }),
        ),
      );

      const body = await res.json();
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });
  });
});
