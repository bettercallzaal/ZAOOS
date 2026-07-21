// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock global fetch before importing the module
const mockFetch = vi.hoisted(() => vi.fn());
vi.stubGlobal('fetch', mockFetch);

// Must import AFTER stubbing fetch
const { postStatusToDiscord, postBriefToDiscord } = await import('../discord-webhook');

const OK_RESPONSE = { ok: true, status: 200, statusText: 'OK' } as Response;
const FAIL_RESPONSE = { ok: false, status: 429, statusText: 'Too Many Requests' } as Response;

describe('postStatusToDiscord', () => {
  beforeEach(() => {
    vi.stubEnv('DISCORD_WEBHOOK_STATUS', 'https://discord.com/api/webhooks/test/token');
    mockFetch.mockResolvedValue(OK_RESPONSE);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    mockFetch.mockReset();
  });

  it('no-ops and returns false when DISCORD_WEBHOOK_STATUS is unset', async () => {
    vi.stubEnv('DISCORD_WEBHOOK_STATUS', '');
    const result = await postStatusToDiscord({ title: 'test', body: 'hello' });
    expect(result).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('POSTs to the webhook URL with JSON content-type', async () => {
    await postStatusToDiscord({ title: 'Status', body: 'All good' });
    expect(mockFetch).toHaveBeenCalledWith(
      'https://discord.com/api/webhooks/test/token',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });

  it('includes title and body in the embed', async () => {
    await postStatusToDiscord({ title: 'My Title', body: 'My body text' });
    const [, opts] = mockFetch.mock.calls[0];
    const payload = JSON.parse((opts as RequestInit).body as string);
    expect(payload.embeds).toHaveLength(1);
    expect(payload.embeds[0].title).toContain('My Title');
    expect(payload.embeds[0].description).toBe('My body text');
  });

  it('prepends emoji to title when provided', async () => {
    await postStatusToDiscord({ title: 'Brief', body: 'content', emoji: '☀️' });
    const [, opts] = mockFetch.mock.calls[0];
    const payload = JSON.parse((opts as RequestInit).body as string);
    expect(payload.embeds[0].title).toBe('☀️ Brief');
  });

  it('includes fields in the embed when provided', async () => {
    await postStatusToDiscord({
      title: 'Report',
      body: 'text',
      fields: [{ name: 'PRs merged', value: '5' }],
    });
    const [, opts] = mockFetch.mock.calls[0];
    const payload = JSON.parse((opts as RequestInit).body as string);
    expect(payload.embeds[0].fields).toEqual([{ name: 'PRs merged', value: '5', inline: true }]);
  });

  it('returns true on HTTP 200', async () => {
    const result = await postStatusToDiscord({ title: 'T', body: 'B' });
    expect(result).toBe(true);
  });

  it('returns false and logs on non-OK response', async () => {
    mockFetch.mockResolvedValue(FAIL_RESPONSE);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await postStatusToDiscord({ title: 'T', body: 'B' });
    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('429'));
    consoleSpy.mockRestore();
  });

  it('returns false and logs on fetch network error', async () => {
    mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await postStatusToDiscord({ title: 'T', body: 'B' });
    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('post error'),
      expect.stringContaining('ECONNREFUSED'),
    );
    consoleSpy.mockRestore();
  });

  it('truncates body longer than 4096 chars', async () => {
    const longBody = 'x'.repeat(5000);
    await postStatusToDiscord({ title: 'T', body: longBody });
    const [, opts] = mockFetch.mock.calls[0];
    const payload = JSON.parse((opts as RequestInit).body as string);
    expect(payload.embeds[0].description.length).toBe(4096);
  });
});

describe('postBriefToDiscord', () => {
  beforeEach(() => {
    vi.stubEnv('DISCORD_WEBHOOK_STATUS', 'https://discord.com/api/webhooks/test/token');
    mockFetch.mockResolvedValue(OK_RESPONSE);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    mockFetch.mockReset();
  });

  it('posts with morning brief title and sunrise emoji', async () => {
    await postBriefToDiscord('Good morning!');
    const [, opts] = mockFetch.mock.calls[0];
    const payload = JSON.parse((opts as RequestInit).body as string);
    expect(payload.embeds[0].title).toBe('☀️ ZOE Morning Brief');
    expect(payload.embeds[0].description).toBe('Good morning!');
  });

  it('no-ops when webhook url is unset', async () => {
    vi.stubEnv('DISCORD_WEBHOOK_STATUS', '');
    const result = await postBriefToDiscord('anything');
    expect(result).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
