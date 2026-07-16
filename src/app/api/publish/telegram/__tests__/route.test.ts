import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makePostRequest,
  mockAdminSession,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

const { mockGetSessionData, mockNormalizeForTelegram, mockPublishToTelegram, mockFrom } =
  vi.hoisted(() => ({
    mockGetSessionData: vi.fn(),
    mockNormalizeForTelegram: vi.fn(),
    mockPublishToTelegram: vi.fn(),
    mockFrom: vi.fn(),
  }));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/publish/normalize', () => ({
  normalizeForTelegram: (input: unknown) => mockNormalizeForTelegram(input),
}));

vi.mock('@/lib/publish/telegram', () => ({
  publishToTelegram: (input: unknown) => mockPublishToTelegram(input),
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

describe('POST /api/publish/telegram', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TELEGRAM_BOT_TOKEN = 'test-token-123';
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await import('../route').then((m) =>
      m.POST(makePostRequest('/api/publish/telegram', { text: 'hello' })),
    );
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Unauthorized');
  });

  it('returns 403 when user is not admin', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ isAdmin: false }));
    const res = await import('../route').then((m) =>
      m.POST(makePostRequest('/api/publish/telegram', { text: 'hello' })),
    );
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe('Admin access required');
  });

  it('returns 503 when TELEGRAM_BOT_TOKEN is not configured', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    delete process.env.TELEGRAM_BOT_TOKEN;
    const res = await import('../route').then((m) =>
      m.POST(makePostRequest('/api/publish/telegram', { text: 'hello' })),
    );
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe('Telegram not configured');
  });

  it('returns 400 when request body is invalid JSON', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    // Create a request with malformed JSON body
    const req = new Request(new URL('/api/publish/telegram', 'http://localhost:3000'), {
      method: 'POST',
      body: '{invalid json}',
    });
    const res = await import('../route').then((m) => m.POST(req as never));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid JSON');
  });

  it('returns 400 when text is missing', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const res = await import('../route').then((m) =>
      m.POST(makePostRequest('/api/publish/telegram', { imageUrl: 'https://example.com/img.jpg' })),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
    expect(body.details).toBeDefined();
  });

  it('returns 400 when text is empty string', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const res = await import('../route').then((m) =>
      m.POST(makePostRequest('/api/publish/telegram', { text: '' })),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 when text exceeds max length', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const longText = 'a'.repeat(4097);
    const res = await import('../route').then((m) =>
      m.POST(makePostRequest('/api/publish/telegram', { text: longText })),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 when imageUrl is not a valid URL', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const res = await import('../route').then((m) =>
      m.POST(makePostRequest('/api/publish/telegram', { text: 'hello', imageUrl: 'not-a-url' })),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('publishes text without castHash and does not normalize', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    mockPublishToTelegram.mockResolvedValue({ success: true, messageId: 789 });
    mockFrom.mockReturnValue(makeInsertChain({ error: null }));

    const res = await import('../route').then((m) =>
      m.POST(makePostRequest('/api/publish/telegram', { text: 'hello world' })),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.messageId).toBe(789);
    expect(mockNormalizeForTelegram).not.toHaveBeenCalled();
    expect(mockPublishToTelegram).toHaveBeenCalledWith({
      text: 'hello world',
      imageUrl: undefined,
      chatId: undefined,
    });
  });

  it('normalizes content when castHash is provided', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    mockNormalizeForTelegram.mockReturnValue({
      text: 'normalized text\n\nvia ZAO OS\nhttps://...',
    });
    mockPublishToTelegram.mockResolvedValue({ success: true, messageId: 456 });
    mockFrom.mockReturnValue(makeInsertChain({ error: null }));

    const res = await import('../route').then((m) =>
      m.POST(
        makePostRequest('/api/publish/telegram', {
          text: 'original text',
          castHash: 'abc123',
          channel: 'farcaster',
        }),
      ),
    );

    expect(res.status).toBe(200);
    expect(mockNormalizeForTelegram).toHaveBeenCalledWith({
      text: 'original text',
      castHash: 'abc123',
      channel: 'farcaster',
    });
    expect(mockPublishToTelegram).toHaveBeenCalledWith({
      text: 'normalized text\n\nvia ZAO OS\nhttps://...',
      imageUrl: undefined,
      chatId: undefined,
    });
  });

  it('includes imageUrl and chatId in publish call', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    mockPublishToTelegram.mockResolvedValue({ success: true, messageId: 111 });
    mockFrom.mockReturnValue(makeInsertChain({ error: null }));

    const res = await import('../route').then((m) =>
      m.POST(
        makePostRequest('/api/publish/telegram', {
          text: 'check this',
          imageUrl: 'https://example.com/photo.jpg',
          chatId: '-100123456789',
        }),
      ),
    );

    expect(res.status).toBe(200);
    expect(mockPublishToTelegram).toHaveBeenCalledWith({
      text: 'check this',
      imageUrl: 'https://example.com/photo.jpg',
      chatId: '-100123456789',
    });
  });

  it('returns 502 when publishToTelegram fails', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    mockPublishToTelegram.mockResolvedValue({
      success: false,
      error: 'Telegram API rate limit exceeded',
    });

    const res = await import('../route').then((m) =>
      m.POST(makePostRequest('/api/publish/telegram', { text: 'hello' })),
    );

    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('Telegram API rate limit exceeded');
  });

  it('logs to publish_log table on success with fid from session', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 999 }));
    const normalizedText = 'normalized text\n\nvia ZAO OS\nhttps://...';
    mockNormalizeForTelegram.mockReturnValue({ text: normalizedText });
    mockPublishToTelegram.mockResolvedValue({ success: true, messageId: 333 });
    const chain = makeInsertChain({ error: null });
    mockFrom.mockReturnValue(chain);

    const res = await import('../route').then((m) =>
      m.POST(
        makePostRequest('/api/publish/telegram', {
          text: 'test message',
          castHash: 'hash456',
        }),
      ),
    );

    expect(res.status).toBe(200);
    expect(mockFrom).toHaveBeenCalledWith('publish_log');
    expect(chain.insert).toHaveBeenCalledWith({
      platform: 'telegram',
      cast_hash: 'hash456',
      platform_post_id: '333',
      published_by_fid: 999,
      text: normalizedText,
      status: 'published',
    });
  });

  it('logs with cast_hash=null when castHash is not provided', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 555 }));
    mockPublishToTelegram.mockResolvedValue({ success: true, messageId: 222 });
    const chain = makeInsertChain({ error: null });
    mockFrom.mockReturnValue(chain);

    await import('../route').then((m) =>
      m.POST(makePostRequest('/api/publish/telegram', { text: 'no cast' })),
    );

    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        cast_hash: null,
        platform_post_id: '222',
      }),
    );
  });

  it('logs with platform_post_id=null when messageId is not returned', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    mockPublishToTelegram.mockResolvedValue({ success: true });
    const chain = makeInsertChain({ error: null });
    mockFrom.mockReturnValue(chain);

    await import('../route').then((m) =>
      m.POST(makePostRequest('/api/publish/telegram', { text: 'no message id' })),
    );

    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        platform_post_id: null,
      }),
    );
  });

  it('returns 500 with error message when an unexpected error is thrown', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    mockPublishToTelegram.mockRejectedValue(new Error('Network timeout'));

    const res = await import('../route').then((m) =>
      m.POST(makePostRequest('/api/publish/telegram', { text: 'hello' })),
    );

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('Network timeout');
  });

  it('returns 500 with generic message for non-Error exceptions', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    mockPublishToTelegram.mockRejectedValue('string error');

    const res = await import('../route').then((m) =>
      m.POST(makePostRequest('/api/publish/telegram', { text: 'hello' })),
    );

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to publish to Telegram');
  });

  it('returns success=true and messageId in response shape', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    mockPublishToTelegram.mockResolvedValue({ success: true, messageId: 654 });
    mockFrom.mockReturnValue(makeInsertChain({ error: null }));

    const res = await import('../route').then((m) =>
      m.POST(makePostRequest('/api/publish/telegram', { text: 'final test' })),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      success: true,
      messageId: 654,
    });
  });

  it('handles all Zod schema fields: text, imageUrl, chatId, castHash, channel', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    mockNormalizeForTelegram.mockReturnValue({ text: 'normalized' });
    mockPublishToTelegram.mockResolvedValue({ success: true, messageId: 1 });
    mockFrom.mockReturnValue(makeInsertChain({ error: null }));

    const res = await import('../route').then((m) =>
      m.POST(
        makePostRequest('/api/publish/telegram', {
          text: 'full payload',
          imageUrl: 'https://example.com/img.jpg',
          chatId: '-100123456789',
          castHash: 'cast-abc',
          channel: 'base',
        }),
      ),
    );

    expect(res.status).toBe(200);
    expect(mockNormalizeForTelegram).toHaveBeenCalledWith({
      text: 'full payload',
      castHash: 'cast-abc',
      channel: 'base',
    });
    expect(mockPublishToTelegram).toHaveBeenCalledWith({
      text: 'normalized',
      imageUrl: 'https://example.com/img.jpg',
      chatId: '-100123456789',
    });
  });
});
