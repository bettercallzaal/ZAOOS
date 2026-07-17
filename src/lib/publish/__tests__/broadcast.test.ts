// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockPublishToTelegram = vi.hoisted(() => vi.fn());
const mockPublishToDiscord = vi.hoisted(() => vi.fn());
const mockBuildZaoEmbed = vi.hoisted(() => vi.fn());

vi.mock('@/lib/publish/telegram', () => ({ publishToTelegram: mockPublishToTelegram }));
vi.mock('@/lib/publish/discord', () => ({
  publishToDiscord: mockPublishToDiscord,
  buildZaoEmbed: mockBuildZaoEmbed,
}));

import { broadcastToChannels } from '../broadcast';

const TELEGRAM_TOKEN = 'tg-token-abc';
const DISCORD_URL = 'https://discord.com/api/webhooks/123/abc';

beforeEach(() => {
  vi.clearAllMocks();
  mockBuildZaoEmbed.mockReturnValue({ title: 'embed', description: '' });
  // Default: both configured. Tests that need a missing var explicitly delete it.
  process.env.TELEGRAM_BOT_TOKEN = TELEGRAM_TOKEN;
  process.env.DISCORD_WEBHOOK_URL = DISCORD_URL;
});

afterEach(() => {
  delete process.env.TELEGRAM_BOT_TOKEN;
  delete process.env.DISCORD_WEBHOOK_URL;
});

// ---------------------------------------------------------------------------
// Platform guards
// ---------------------------------------------------------------------------

describe('platform guards', () => {
  it('skips Telegram when TELEGRAM_BOT_TOKEN is not set', async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    mockPublishToDiscord.mockResolvedValue({ success: true });
    const result = await broadcastToChannels({ text: 'hi' });
    expect(mockPublishToTelegram).not.toHaveBeenCalled();
    expect(result.telegram).toEqual({ success: false, error: 'Telegram not configured' });
  });

  it('skips Discord when DISCORD_WEBHOOK_URL is not set', async () => {
    delete process.env.DISCORD_WEBHOOK_URL;
    mockPublishToTelegram.mockResolvedValue({ success: true });
    const result = await broadcastToChannels({ text: 'hi' });
    expect(mockPublishToDiscord).not.toHaveBeenCalled();
    expect(result.discord).toEqual({ success: false, error: 'Discord not configured' });
  });

  it('skips both when neither env var is set', async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.DISCORD_WEBHOOK_URL;
    const result = await broadcastToChannels({ text: 'hi' });
    expect(mockPublishToTelegram).not.toHaveBeenCalled();
    expect(mockPublishToDiscord).not.toHaveBeenCalled();
    expect(result.telegram.success).toBe(false);
    expect(result.discord.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Both succeed
// ---------------------------------------------------------------------------

describe('both platforms succeed', () => {
  it('returns success: true for both', async () => {
    mockPublishToTelegram.mockResolvedValue({ success: true });
    mockPublishToDiscord.mockResolvedValue({ success: true });
    const result = await broadcastToChannels({ text: 'test message' });
    expect(result.telegram).toEqual({ success: true, error: undefined });
    expect(result.discord).toEqual({ success: true, error: undefined });
  });
});

// ---------------------------------------------------------------------------
// Promise.allSettled isolation
// ---------------------------------------------------------------------------

describe('promise.allSettled isolation', () => {
  it('Telegram rejection does not prevent Discord success', async () => {
    mockPublishToTelegram.mockRejectedValue(new Error('tg network error'));
    mockPublishToDiscord.mockResolvedValue({ success: true });
    const result = await broadcastToChannels({ text: 'hi' });
    expect(result.telegram).toEqual({ success: false, error: 'tg network error' });
    expect(result.discord).toEqual({ success: true, error: undefined });
  });

  it('Discord rejection does not prevent Telegram success', async () => {
    mockPublishToTelegram.mockResolvedValue({ success: true });
    mockPublishToDiscord.mockRejectedValue(new Error('discord 503'));
    const result = await broadcastToChannels({ text: 'hi' });
    expect(result.telegram).toEqual({ success: true, error: undefined });
    expect(result.discord).toEqual({ success: false, error: 'discord 503' });
  });

  it('forwards error string from platform failure result', async () => {
    mockPublishToTelegram.mockResolvedValue({ success: false, error: 'rate limited' });
    mockPublishToDiscord.mockResolvedValue({ success: false, error: 'webhook gone' });
    const result = await broadcastToChannels({ text: 'hi' });
    expect(result.telegram.error).toBe('rate limited');
    expect(result.discord.error).toBe('webhook gone');
  });
});

// ---------------------------------------------------------------------------
// castHash link appended
// ---------------------------------------------------------------------------

describe('castHash link appending', () => {
  it('appends Farcaster link to Telegram text when castHash is present', async () => {
    mockPublishToTelegram.mockResolvedValue({ success: true });
    mockPublishToDiscord.mockResolvedValue({ success: true });
    await broadcastToChannels({ text: 'New post', castHash: 'abc123' });
    const telegramCall = mockPublishToTelegram.mock.calls[0][0];
    expect(telegramCall.text).toContain('warpcast.com/~/conversations/abc123');
  });

  it('appends default ZAO OS link when no castHash', async () => {
    mockPublishToTelegram.mockResolvedValue({ success: true });
    mockPublishToDiscord.mockResolvedValue({ success: true });
    await broadcastToChannels({ text: 'New post' });
    const telegramCall = mockPublishToTelegram.mock.calls[0][0];
    expect(telegramCall.text).toContain('zaoos.com');
    expect(telegramCall.text).not.toContain('warpcast');
  });

  it('uses options.url instead of default zaoos.com', async () => {
    mockPublishToTelegram.mockResolvedValue({ success: true });
    mockPublishToDiscord.mockResolvedValue({ success: true });
    await broadcastToChannels({ text: 'hi', url: 'https://custom.site' });
    const telegramCall = mockPublishToTelegram.mock.calls[0][0];
    expect(telegramCall.text).toContain('custom.site');
    expect(telegramCall.text).not.toContain('zaoos.com');
  });
});

// ---------------------------------------------------------------------------
// Discord embed vs plain text routing
// ---------------------------------------------------------------------------

describe('discord embed vs plain text', () => {
  it('sends embed when title is provided', async () => {
    mockPublishToTelegram.mockResolvedValue({ success: true });
    mockPublishToDiscord.mockResolvedValue({ success: true });
    await broadcastToChannels({ text: 'body', title: 'My Title' });
    const discordCall = mockPublishToDiscord.mock.calls[0][0];
    expect(discordCall.text).toBe('');
    expect(discordCall.embeds).toBeDefined();
    expect(discordCall.embeds!.length).toBe(1);
    expect(mockBuildZaoEmbed).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'My Title', description: expect.stringContaining('body') }),
    );
  });

  it('sends plain text when no title is provided', async () => {
    mockPublishToTelegram.mockResolvedValue({ success: true });
    mockPublishToDiscord.mockResolvedValue({ success: true });
    await broadcastToChannels({ text: 'just text' });
    const discordCall = mockPublishToDiscord.mock.calls[0][0];
    expect(discordCall.embeds).toBeUndefined();
    expect(discordCall.text).toBe('just text');
  });
});
