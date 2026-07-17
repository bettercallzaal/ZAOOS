// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { escapeMarkdownV2, publishToTelegram } from '../telegram';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockFetch(ok: boolean, data: unknown) {
  (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
    ok: ok as any,
    json: () => Promise.resolve(data),
  });
}

function getBody(): Record<string, unknown> {
  const [, opts] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
  return JSON.parse(opts.body as string);
}

function getUrl(): string {
  return (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
  process.env.TELEGRAM_BOT_TOKEN = 'test-token';
  process.env.TELEGRAM_CHAT_ID = '-1001234';
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.TELEGRAM_BOT_TOKEN;
  delete process.env.TELEGRAM_CHAT_ID;
});

// ---------------------------------------------------------------------------
// escapeMarkdownV2
// ---------------------------------------------------------------------------

describe('escapeMarkdownV2', () => {
  it('escapes underscore', () => {
    expect(escapeMarkdownV2('hello_world')).toBe('hello\\_world');
  });

  it('escapes asterisk', () => {
    expect(escapeMarkdownV2('*bold*')).toBe('\\*bold\\*');
  });

  it('escapes period', () => {
    expect(escapeMarkdownV2('v1.0.0')).toBe('v1\\.0\\.0');
  });

  it('leaves plain alphanumeric text unchanged', () => {
    expect(escapeMarkdownV2('HelloWorld123')).toBe('HelloWorld123');
  });
});

// ---------------------------------------------------------------------------
// publishToTelegram
// ---------------------------------------------------------------------------

describe('publishToTelegram', () => {
  it('returns not-configured error when TELEGRAM_BOT_TOKEN is missing', async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    const result = await publishToTelegram({ text: 'hello' });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Telegram not configured/);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns not-configured error when TELEGRAM_CHAT_ID is missing', async () => {
    delete process.env.TELEGRAM_CHAT_ID;
    const result = await publishToTelegram({ text: 'hello' });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Telegram not configured/);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('uses content.chatId override instead of env var', async () => {
    mockFetch(true, { ok: true, result: { message_id: 1 } });
    await publishToTelegram({ text: 'hi', chatId: '-9999999' });
    const body = getBody();
    expect(body.chat_id).toBe('-9999999');
  });

  it('text-only: calls sendMessage endpoint', async () => {
    mockFetch(true, { ok: true, result: { message_id: 1 } });
    await publishToTelegram({ text: 'hello' });
    expect(getUrl()).toContain('/sendMessage');
  });

  it('with imageUrl: calls sendPhoto endpoint', async () => {
    mockFetch(true, { ok: true, result: { message_id: 2 } });
    await publishToTelegram({ text: 'caption', imageUrl: 'https://example.com/img.png' });
    expect(getUrl()).toContain('/sendPhoto');
  });

  it('truncates caption to 1024 chars for sendPhoto', async () => {
    mockFetch(true, { ok: true, result: { message_id: 3 } });
    const longText = 'word '.repeat(300); // 1500 chars
    await publishToTelegram({ text: longText, imageUrl: 'https://example.com/img.png' });
    const body = getBody();
    expect((body.caption as string).length).toBeLessThanOrEqual(1027); // 1024 + '...'
    expect((body.caption as string).endsWith('...')).toBe(true);
  });

  it('does not truncate text under 4096 chars for sendMessage', async () => {
    mockFetch(true, { ok: true, result: { message_id: 4 } });
    const shortText = 'hello world';
    await publishToTelegram({ text: shortText });
    const body = getBody();
    expect(body.text).toBe(shortText);
  });

  it('returns { success: true, messageId: 42 } on success', async () => {
    mockFetch(true, { ok: true, result: { message_id: 42 } });
    const result = await publishToTelegram({ text: 'hi' });
    expect(result).toEqual({ success: true, messageId: 42 });
  });

  it('returns API error description when ok: false', async () => {
    mockFetch(true, { ok: false, description: 'Bad Request' });
    const result = await publishToTelegram({ text: 'hi' });
    expect(result.success).toBe(false);
    expect(result.error).toBe('Telegram API error: Bad Request');
  });

  it('returns error.message when fetch throws', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('network error'));
    const result = await publishToTelegram({ text: 'hi' });
    expect(result.success).toBe(false);
    expect(result.error).toBe('network error');
  });

  it('sends parse_mode HTML when content.parseMode is HTML', async () => {
    mockFetch(true, { ok: true, result: { message_id: 5 } });
    await publishToTelegram({ text: 'hi', parseMode: 'HTML' });
    const body = getBody();
    expect(body.parse_mode).toBe('HTML');
  });
});
