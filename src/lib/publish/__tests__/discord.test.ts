// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildZaoEmbed, publishToDiscord } from '../discord';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const WEBHOOK = 'https://discord.com/api/webhooks/123/token';

function mockFetch(status: number, body: unknown = { id: 'msg-1' }) {
  (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  });
}

function getRequestBody(): Record<string, unknown> {
  const [, opts] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
  return JSON.parse(opts.body as string);
}

function getRequestUrl(): string {
  const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
  return url;
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
  delete process.env.DISCORD_WEBHOOK_URL;
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.DISCORD_WEBHOOK_URL;
});

// ---------------------------------------------------------------------------
// publishToDiscord
// ---------------------------------------------------------------------------

describe('publishToDiscord', () => {
  it('returns not-configured error when no webhook URL is set', async () => {
    const result = await publishToDiscord({ text: 'hello' });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Discord not configured/);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('uses DISCORD_WEBHOOK_URL env var when no override provided', async () => {
    process.env.DISCORD_WEBHOOK_URL = WEBHOOK;
    mockFetch(200);
    const result = await publishToDiscord({ text: 'env-driven' });
    expect(result.success).toBe(true);
    expect(fetch).toHaveBeenCalledOnce();
    const url = getRequestUrl();
    expect(url).toContain(WEBHOOK);
  });

  it('prefers content.webhookUrl over env var', async () => {
    process.env.DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/env/token';
    mockFetch(200);
    await publishToDiscord({ text: 'override', webhookUrl: WEBHOOK });
    const url = getRequestUrl();
    expect(url).toContain('webhooks/123/token');
  });

  it('appends ?wait=true to a plain webhook URL', async () => {
    mockFetch(200);
    await publishToDiscord({ text: 'hi', webhookUrl: WEBHOOK });
    const url = getRequestUrl();
    expect(url).toBe(`${WEBHOOK}?wait=true`);
  });

  it('appends &wait=true when webhook URL already has a query string', async () => {
    const webhookWithQuery = `${WEBHOOK}?thread_id=abc`;
    mockFetch(200);
    await publishToDiscord({ text: 'hi', webhookUrl: webhookWithQuery });
    const url = getRequestUrl();
    expect(url).toBe(`${webhookWithQuery}&wait=true`);
  });

  it('returns success with messageId on 200 OK', async () => {
    mockFetch(200, { id: 'abc-123' });
    const result = await publishToDiscord({ text: 'good', webhookUrl: WEBHOOK });
    expect(result.success).toBe(true);
    expect(result.messageId).toBe('abc-123');
  });

  it('returns generic error message on non-ok response with no JSON body', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 400,
      text: () => Promise.resolve('not json at all'),
      json: () => Promise.reject(new SyntaxError('bad json')),
    });
    const result = await publishToDiscord({ text: 'bad', webhookUrl: WEBHOOK });
    expect(result.success).toBe(false);
    expect(result.error).toBe('Discord API error (400)');
  });

  it('returns Discord error message on non-ok response with JSON { message }', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 400,
      text: () => Promise.resolve(JSON.stringify({ message: 'Unknown Webhook' })),
      json: () => Promise.resolve({ message: 'Unknown Webhook' }),
    });
    const result = await publishToDiscord({ text: 'bad', webhookUrl: WEBHOOK });
    expect(result.success).toBe(false);
    expect(result.error).toBe('Discord API error: Unknown Webhook');
  });

  it('returns error.message when fetch throws', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('network down'));
    const result = await publishToDiscord({ text: 'crash', webhookUrl: WEBHOOK });
    expect(result.success).toBe(false);
    expect(result.error).toBe('network down');
  });

  it('truncates text longer than 2000 chars at a word boundary', async () => {
    mockFetch(200);
    // Build a string >2000 chars with a clear word boundary near the limit
    const prefix = 'word '.repeat(399); // 399 * 5 = 1995 chars
    const longText = prefix + 'overflow extra words here';
    await publishToDiscord({ text: longText, webhookUrl: WEBHOOK });
    const body = getRequestBody();
    const sent = body.content as string;
    expect(sent.length).toBeLessThanOrEqual(2003); // maxLen + '...' (3)
    expect(sent.endsWith('...')).toBe(true);
    // Must not have split mid-word — every segment before '...' should end at a space boundary
    const withoutEllipsis = sent.slice(0, -3);
    expect(withoutEllipsis.endsWith(' ')).toBe(false); // trailing space is trimmed before '...'
    expect(longText.startsWith(withoutEllipsis)).toBe(true);
  });

  it('sends username in payload when provided', async () => {
    mockFetch(200);
    await publishToDiscord({ text: 'hi', webhookUrl: WEBHOOK, username: 'ZAO Bot' });
    const body = getRequestBody();
    expect(body.username).toBe('ZAO Bot');
  });

  it('sends avatar_url in payload when avatarUrl provided', async () => {
    mockFetch(200);
    await publishToDiscord({
      text: 'hi',
      webhookUrl: WEBHOOK,
      avatarUrl: 'https://example.com/avatar.png',
    });
    const body = getRequestBody();
    expect(body.avatar_url).toBe('https://example.com/avatar.png');
  });

  it('omits embeds key when no embeds provided', async () => {
    mockFetch(200);
    await publishToDiscord({ text: 'plain text', webhookUrl: WEBHOOK });
    const body = getRequestBody();
    expect(Object.prototype.hasOwnProperty.call(body, 'embeds')).toBe(false);
  });

  it('omits embeds key when empty embeds array provided', async () => {
    mockFetch(200);
    await publishToDiscord({ text: 'plain text', webhookUrl: WEBHOOK, embeds: [] });
    const body = getRequestBody();
    expect(Object.prototype.hasOwnProperty.call(body, 'embeds')).toBe(false);
  });

  it('slices embeds to maximum 10 and includes them in payload', async () => {
    mockFetch(200);
    const embeds = Array.from({ length: 15 }, (_, i) => ({
      title: `Embed ${i}`,
      description: 'short',
    }));
    await publishToDiscord({ text: 'many embeds', webhookUrl: WEBHOOK, embeds });
    const body = getRequestBody();
    expect(Array.isArray(body.embeds)).toBe(true);
    expect((body.embeds as unknown[]).length).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// buildZaoEmbed
// ---------------------------------------------------------------------------

describe('buildZaoEmbed', () => {
  it('uses ZAO gold color (0xf5a623)', () => {
    const embed = buildZaoEmbed({ title: 'T', description: 'D' });
    expect(embed.color).toBe(0xf5a623);
  });

  it('uses default footer text when footerText is not provided', () => {
    const embed = buildZaoEmbed({ title: 'T', description: 'D' });
    expect(embed.footer?.text).toBe('Posted via ZAO OS');
  });

  it('accepts a custom footerText', () => {
    const embed = buildZaoEmbed({ title: 'T', description: 'D', footerText: 'Custom Footer' });
    expect(embed.footer?.text).toBe('Custom Footer');
  });

  it('truncates description longer than 4096 chars', () => {
    const longDesc = 'a'.repeat(5000);
    const embed = buildZaoEmbed({ title: 'T', description: longDesc });
    expect((embed.description ?? '').length).toBeLessThanOrEqual(4099); // 4096 + '...'
    expect(embed.description?.endsWith('...')).toBe(true);
  });

  it('includes image.url when imageUrl is provided', () => {
    const embed = buildZaoEmbed({
      title: 'T',
      description: 'D',
      imageUrl: 'https://example.com/img.png',
    });
    expect(embed.image?.url).toBe('https://example.com/img.png');
  });

  it('omits image when imageUrl is not provided', () => {
    const embed = buildZaoEmbed({ title: 'T', description: 'D' });
    expect(embed.image).toBeUndefined();
  });

  it('includes a timestamp as an ISO string', () => {
    const before = Date.now();
    const embed = buildZaoEmbed({ title: 'T', description: 'D' });
    const after = Date.now();
    expect(typeof embed.timestamp).toBe('string');
    const ts = new Date(embed.timestamp!).getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it('includes url when provided', () => {
    const embed = buildZaoEmbed({ title: 'T', description: 'D', url: 'https://zao.ai' });
    expect(embed.url).toBe('https://zao.ai');
  });
});
