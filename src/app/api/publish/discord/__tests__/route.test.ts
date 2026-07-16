import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makePostRequest,
  mockAdminSession,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

const {
  mockGetSessionData,
  mockNormalizeForDiscord,
  mockBuildZaoEmbed,
  mockPublishToDiscord,
  mockFrom,
} = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockNormalizeForDiscord: vi.fn(),
  mockBuildZaoEmbed: vi.fn(),
  mockPublishToDiscord: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/publish/normalize', () => ({
  normalizeForDiscord: (input) => mockNormalizeForDiscord(input),
}));

vi.mock('@/lib/publish/discord', () => ({
  buildZaoEmbed: (opts) => mockBuildZaoEmbed(opts),
  publishToDiscord: (content) => mockPublishToDiscord(content),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { POST } from '../route';

describe('POST /api/publish/discord', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: authenticated admin, successful publish
    mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 123 }));
    mockPublishToDiscord.mockResolvedValue({ success: true, messageId: 'msg-123' });

    // Mock the supabase insert chain
    const insertChain: Record<string, unknown> = {};
    insertChain.insert = vi.fn(() => insertChain);
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
    (insertChain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) =>
      resolve({ data: null, error: null });
    mockFrom.mockReturnValue(insertChain);
  });

  describe('authentication & authorization', () => {
    it('returns 401 when not authenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
      const res = await POST(makePostRequest('/api/publish/discord', { text: 'hello' }));
      expect(res.status).toBe(401);
      expect((await res.json()).error).toBe('Unauthorized');
    });

    it('returns 403 when authenticated but not admin', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ isAdmin: false }));
      const res = await POST(makePostRequest('/api/publish/discord', { text: 'hello' }));
      expect(res.status).toBe(403);
      expect((await res.json()).error).toBe('Admin access required');
    });
  });

  describe('JSON parsing', () => {
    it('returns 400 when body is invalid JSON', async () => {
      const req = makePostRequest('/api/publish/discord', { text: 'hello' });
      // Manually corrupt the body
      const invalidReq = new (req.constructor as typeof Request)(req.url, {
        method: 'POST',
        body: '{invalid json',
      });
      const res = await POST(invalidReq as typeof req);
      expect(res.status).toBe(400);
      expect((await res.json()).error).toBe('Invalid JSON');
    });
  });

  describe('Zod validation', () => {
    it('returns 400 when text is missing', async () => {
      const res = await POST(makePostRequest('/api/publish/discord', { title: 'test' }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when text is empty string', async () => {
      const res = await POST(makePostRequest('/api/publish/discord', { text: '' }));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toBe('Invalid input');
    });

    it('returns 400 when text exceeds 2000 chars', async () => {
      const longText = 'a'.repeat(2001);
      const res = await POST(makePostRequest('/api/publish/discord', { text: longText }));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toBe('Invalid input');
    });

    it('returns 400 when imageUrl is not a valid URL', async () => {
      const res = await POST(
        makePostRequest('/api/publish/discord', { text: 'hello', imageUrl: 'not-a-url' }),
      );
      expect(res.status).toBe(400);
      expect((await res.json()).error).toBe('Invalid input');
    });

    it('returns 400 when webhookUrl is not a valid URL', async () => {
      const res = await POST(
        makePostRequest('/api/publish/discord', { text: 'hello', webhookUrl: 'not-a-url' }),
      );
      expect(res.status).toBe(400);
      expect((await res.json()).error).toBe('Invalid input');
    });

    it('accepts optional fields within limits', async () => {
      mockNormalizeForDiscord.mockReturnValue({ text: 'normalized text' });
      const res = await POST(
        makePostRequest('/api/publish/discord', {
          text: 'hello',
          title: 'My Title',
          imageUrl: 'https://example.com/image.jpg',
          castHash: 'abc123',
          channel: 'general',
          webhookUrl: 'https://discord.com/api/webhooks/test-webhook',
        }),
      );
      expect(res.status).toBe(200);
    });
  });

  describe('webhook URL resolution', () => {
    it('returns 503 when neither env DISCORD_WEBHOOK_URL nor body webhookUrl is provided', async () => {
      // Temporarily unset the env var (or ensure it's not set in test env)
      const originalEnv = process.env.DISCORD_WEBHOOK_URL;
      delete process.env.DISCORD_WEBHOOK_URL;

      try {
        const res = await POST(makePostRequest('/api/publish/discord', { text: 'hello' }));
        expect(res.status).toBe(503);
        expect((await res.json()).error).toContain('no webhook URL available');
      } finally {
        if (originalEnv) {
          process.env.DISCORD_WEBHOOK_URL = originalEnv;
        }
      }
    });

    it('uses env DISCORD_WEBHOOK_URL if webhookUrl not provided', async () => {
      const originalEnv = process.env.DISCORD_WEBHOOK_URL;
      process.env.DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/env-webhook';

      try {
        const res = await POST(makePostRequest('/api/publish/discord', { text: 'hello' }));
        expect(res.status).toBe(200);
        expect(mockPublishToDiscord).toHaveBeenCalledWith(
          expect.objectContaining({
            text: 'hello',
            webhookUrl: undefined, // body override not provided, so undefined
          }),
        );
      } finally {
        if (originalEnv) {
          process.env.DISCORD_WEBHOOK_URL = originalEnv;
        }
      }
    });

    it('prefers body webhookUrl over env DISCORD_WEBHOOK_URL', async () => {
      const originalEnv = process.env.DISCORD_WEBHOOK_URL;
      process.env.DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/env-webhook';

      try {
        const res = await POST(
          makePostRequest('/api/publish/discord', {
            text: 'hello',
            webhookUrl: 'https://discord.com/api/webhooks/body-webhook',
          }),
        );
        expect(res.status).toBe(200);
        expect(mockPublishToDiscord).toHaveBeenCalledWith(
          expect.objectContaining({
            text: 'hello',
            webhookUrl: 'https://discord.com/api/webhooks/body-webhook',
          }),
        );
      } finally {
        if (originalEnv) {
          process.env.DISCORD_WEBHOOK_URL = originalEnv;
        }
      }
    });
  });

  describe('content normalization', () => {
    it('normalizes text when castHash is provided', async () => {
      mockNormalizeForDiscord.mockReturnValue({ text: 'normalized with attribution' });

      const res = await POST(
        makePostRequest('/api/publish/discord', {
          text: 'hello',
          castHash: 'abc123',
          channel: 'general',
        }),
      );

      expect(res.status).toBe(200);
      expect(mockNormalizeForDiscord).toHaveBeenCalledWith({
        text: 'hello',
        castHash: 'abc123',
        channel: 'general',
      });
      expect(mockPublishToDiscord).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'normalized with attribution',
        }),
      );
    });

    it('skips normalization when castHash is not provided', async () => {
      const res = await POST(makePostRequest('/api/publish/discord', { text: 'hello' }));

      expect(res.status).toBe(200);
      expect(mockNormalizeForDiscord).not.toHaveBeenCalled();
      expect(mockPublishToDiscord).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'hello',
        }),
      );
    });
  });

  describe('embed building', () => {
    it('builds ZAO embed when title is provided', async () => {
      const mockEmbed = {
        title: 'My Title',
        description: 'Description text',
        color: 0xf5a623,
      };
      mockBuildZaoEmbed.mockReturnValue(mockEmbed);

      const res = await POST(
        makePostRequest('/api/publish/discord', {
          text: 'hello',
          title: 'My Title',
          imageUrl: 'https://example.com/image.jpg',
        }),
      );

      expect(res.status).toBe(200);
      expect(mockBuildZaoEmbed).toHaveBeenCalledWith({
        title: 'My Title',
        description: 'hello',
        imageUrl: 'https://example.com/image.jpg',
      });
      expect(mockPublishToDiscord).toHaveBeenCalledWith(
        expect.objectContaining({
          embeds: [mockEmbed],
        }),
      );
    });

    it('skips embed when title is not provided', async () => {
      const res = await POST(
        makePostRequest('/api/publish/discord', {
          text: 'hello',
          imageUrl: 'https://example.com/image.jpg',
        }),
      );

      expect(res.status).toBe(200);
      expect(mockBuildZaoEmbed).not.toHaveBeenCalled();
      expect(mockPublishToDiscord).toHaveBeenCalledWith(
        expect.objectContaining({
          embeds: undefined,
        }),
      );
    });

    it('uses normalized text in embed description when both castHash and title provided', async () => {
      const mockEmbed = {
        title: 'My Title',
        description: 'normalized text',
        color: 0xf5a623,
      };
      mockNormalizeForDiscord.mockReturnValue({ text: 'normalized text' });
      mockBuildZaoEmbed.mockReturnValue(mockEmbed);

      const res = await POST(
        makePostRequest('/api/publish/discord', {
          text: 'original text',
          title: 'My Title',
          castHash: 'abc123',
        }),
      );

      expect(res.status).toBe(200);
      expect(mockBuildZaoEmbed).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'normalized text',
        }),
      );
    });
  });

  describe('publish success', () => {
    it('publishes successfully and returns 200 with messageId', async () => {
      mockPublishToDiscord.mockResolvedValue({ success: true, messageId: 'msg-456' });

      const res = await POST(makePostRequest('/api/publish/discord', { text: 'hello' }));

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.messageId).toBe('msg-456');
    });

    it('publishes with correct input shape', async () => {
      const res = await POST(
        makePostRequest('/api/publish/discord', {
          text: 'hello world',
          title: 'Test',
          imageUrl: 'https://example.com/img.jpg',
        }),
      );

      expect(res.status).toBe(200);
      expect(mockPublishToDiscord).toHaveBeenCalledWith({
        text: 'hello world',
        embeds: expect.any(Array),
        webhookUrl: undefined,
      });
    });
  });

  describe('publish failure', () => {
    it('returns 502 when publishToDiscord returns success: false', async () => {
      mockPublishToDiscord.mockResolvedValue({
        success: false,
        error: 'Webhook URL is invalid',
      });

      const res = await POST(makePostRequest('/api/publish/discord', { text: 'hello' }));

      expect(res.status).toBe(502);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('Webhook URL is invalid');
    });

    it('returns 502 without logging to DB when publish fails', async () => {
      mockPublishToDiscord.mockResolvedValue({
        success: false,
        error: 'Discord API error',
      });

      const res = await POST(makePostRequest('/api/publish/discord', { text: 'hello' }));

      expect(res.status).toBe(502);
      // The insert should NOT be called since publish failed and route returns early
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('logging to publish_log', () => {
    it('logs to publish_log on successful publish', async () => {
      const insertChain: Record<string, ReturnType<typeof vi.fn>> = {};
      insertChain.insert = vi.fn(() => insertChain);
      // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
      (insertChain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) =>
        resolve({ data: null, error: null });
      mockFrom.mockReturnValue(insertChain);
      mockNormalizeForDiscord.mockReturnValue({ text: 'normalized text' });
      mockPublishToDiscord.mockResolvedValue({ success: true, messageId: 'msg-789' });

      const res = await POST(
        makePostRequest('/api/publish/discord', {
          text: 'hello',
          castHash: 'cast-abc',
        }),
      );

      expect(res.status).toBe(200);
      expect(mockFrom).toHaveBeenCalledWith('publish_log');
      expect(insertChain.insert).toHaveBeenCalledWith({
        platform: 'discord',
        cast_hash: 'cast-abc',
        platform_post_id: 'msg-789',
        published_by_fid: 123,
        text: 'normalized text',
        status: 'published',
      });
    });

    it('logs with null cast_hash when not provided', async () => {
      const insertChain: Record<string, ReturnType<typeof vi.fn>> = {};
      insertChain.insert = vi.fn(() => insertChain);
      // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
      (insertChain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) =>
        resolve({ data: null, error: null });
      mockFrom.mockReturnValue(insertChain);
      mockPublishToDiscord.mockResolvedValue({ success: true, messageId: 'msg-999' });

      const res = await POST(makePostRequest('/api/publish/discord', { text: 'hello' }));

      expect(res.status).toBe(200);
      expect(insertChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          cast_hash: null,
        }),
      );
    });

    it('logs normalized text when castHash was provided', async () => {
      const insertChain: Record<string, ReturnType<typeof vi.fn>> = {};
      insertChain.insert = vi.fn(() => insertChain);
      // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
      (insertChain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) =>
        resolve({ data: null, error: null });
      mockFrom.mockReturnValue(insertChain);
      mockNormalizeForDiscord.mockReturnValue({ text: 'normalized content' });
      mockPublishToDiscord.mockResolvedValue({ success: true, messageId: 'msg-111' });

      const res = await POST(
        makePostRequest('/api/publish/discord', {
          text: 'original',
          castHash: 'cast-123',
        }),
      );

      expect(res.status).toBe(200);
      expect(insertChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'normalized content',
        }),
      );
    });

    it('logs with null messageId when publishToDiscord does not return one', async () => {
      const insertChain: Record<string, ReturnType<typeof vi.fn>> = {};
      insertChain.insert = vi.fn(() => insertChain);
      // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
      (insertChain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) =>
        resolve({ data: null, error: null });
      mockFrom.mockReturnValue(insertChain);
      mockPublishToDiscord.mockResolvedValue({ success: true }); // No messageId

      const res = await POST(makePostRequest('/api/publish/discord', { text: 'hello' }));

      expect(res.status).toBe(200);
      expect(insertChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          platform_post_id: null,
        }),
      );
    });

    it('uses session fid for published_by_fid', async () => {
      const insertChain: Record<string, ReturnType<typeof vi.fn>> = {};
      insertChain.insert = vi.fn(() => insertChain);
      // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
      (insertChain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) =>
        resolve({ data: null, error: null });
      mockFrom.mockReturnValue(insertChain);
      mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 999 }));

      const res = await POST(makePostRequest('/api/publish/discord', { text: 'hello' }));

      expect(res.status).toBe(200);
      expect(insertChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          published_by_fid: 999,
        }),
      );
    });
  });

  describe('error handling', () => {
    it('returns 500 on caught exception with error message', async () => {
      mockPublishToDiscord.mockRejectedValue(new Error('Network timeout'));

      const res = await POST(makePostRequest('/api/publish/discord', { text: 'hello' }));

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('Network timeout');
    });

    it('returns 500 with generic message when error is not an Error instance', async () => {
      mockPublishToDiscord.mockRejectedValue('String error');

      const res = await POST(makePostRequest('/api/publish/discord', { text: 'hello' }));

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('Failed to publish to Discord');
    });

    it('returns 500 when supabase insert throws', async () => {
      const insertChain: Record<string, unknown> = {};
      insertChain.insert = vi.fn(() => insertChain);
      // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
      (insertChain as unknown as { then: unknown }).then = () => {
        throw new Error('DB connection failed');
      };
      mockFrom.mockReturnValue(insertChain);
      mockPublishToDiscord.mockResolvedValue({ success: true, messageId: 'msg-123' });

      const res = await POST(makePostRequest('/api/publish/discord', { text: 'hello' }));

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('DB connection failed');
    });
  });
});
