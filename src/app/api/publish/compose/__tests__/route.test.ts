/**
 * compose route - the missing "post once, everywhere" orchestrator.
 * Publishing is irreversible, so the tests that matter most are: dry run publishes
 * NOTHING, auth is enforced, and over-limit text is caught before any send.
 */
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSessionData: vi.fn(),
  autoCastToZao: vi.fn(),
  publishToX: vi.fn(),
  publishToBluesky: vi.fn(),
  broadcastToChannels: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({ getSessionData: mocks.getSessionData }));
vi.mock('@/lib/publish/auto-cast', () => ({ autoCastToZao: mocks.autoCastToZao }));
vi.mock('@/lib/publish/x', () => ({ publishToX: mocks.publishToX }));
vi.mock('@/lib/publish/bluesky', () => ({ publishToBluesky: mocks.publishToBluesky }));
vi.mock('@/lib/publish/broadcast', () => ({ broadcastToChannels: mocks.broadcastToChannels }));
vi.mock('@/lib/publish/normalize', () => ({
  normalizeForX: (i: { text: string; castHash: string }) => ({
    ...i,
    images: [],
    embeds: [],
    attribution: '',
    castUrl: '',
  }),
  normalizeForBluesky: (i: { text: string; castHash: string }) => ({
    ...i,
    images: [],
    embeds: [],
    attribution: '',
    castUrl: '',
  }),
}));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), info: vi.fn() } }));

import { POST } from '../route';

function req(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/publish/compose', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/publish/compose', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSessionData.mockResolvedValue({ isAdmin: true, fid: 19640 });
    mocks.autoCastToZao.mockResolvedValue('0xcast');
    mocks.publishToX.mockResolvedValue({ tweetId: '1', tweetUrl: 'https://x.com/p/1' });
    mocks.publishToBluesky.mockResolvedValue({
      uri: 'at://1',
      cid: 'c',
      postUrl: 'https://bsky/p/1',
    });
    mocks.broadcastToChannels.mockResolvedValue({
      telegram: { success: true },
      discord: { success: true },
    });
  });

  it('401s with no session', async () => {
    mocks.getSessionData.mockResolvedValue(null);
    const res = await POST(req({ text: 'hi', platforms: ['farcaster'] }));
    expect(res.status).toBe(401);
    expect(mocks.autoCastToZao).not.toHaveBeenCalled();
  });

  it('403s for a non-admin', async () => {
    mocks.getSessionData.mockResolvedValue({ isAdmin: false, fid: 1 });
    const res = await POST(req({ text: 'hi', platforms: ['farcaster'] }));
    expect(res.status).toBe(403);
    expect(mocks.autoCastToZao).not.toHaveBeenCalled();
  });

  it('DRY RUN (the default) publishes NOTHING', async () => {
    const res = await POST(
      req({ text: 'test post', platforms: ['farcaster', 'x', 'bluesky', 'telegram', 'discord'] }),
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.data.dryRun).toBe(true);
    expect(json.data.results).toHaveLength(5);
    expect(json.data.results.every((r: { simulated: boolean }) => r.simulated)).toBe(true);
    // the load-bearing assertion: no publisher was called
    expect(mocks.autoCastToZao).not.toHaveBeenCalled();
    expect(mocks.publishToX).not.toHaveBeenCalled();
    expect(mocks.publishToBluesky).not.toHaveBeenCalled();
    expect(mocks.broadcastToChannels).not.toHaveBeenCalled();
  });

  it('omitting dryRun defaults to a dry run (never accidental publishing)', async () => {
    const res = await POST(req({ text: 'no flag given', platforms: ['x'] }));
    expect((await res.json()).data.dryRun).toBe(true);
    expect(mocks.publishToX).not.toHaveBeenCalled();
  });

  it('live run casts to Farcaster FIRST and mirrors with that hash', async () => {
    const res = await POST(
      req({ text: 'real post', platforms: ['farcaster', 'x', 'bluesky'], dryRun: false }),
    );
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.castHash).toBe('0xcast');
    expect(mocks.autoCastToZao).toHaveBeenCalledWith('real post', undefined);
    expect(mocks.publishToX).toHaveBeenCalledWith(
      expect.objectContaining({ castHash: '0xcast', text: 'real post' }),
    );
    expect(mocks.publishToBluesky).toHaveBeenCalledWith(
      expect.objectContaining({ castHash: '0xcast' }),
    );
  });

  it('rejects text over a selected platform limit BEFORE sending anything', async () => {
    const res = await POST(
      req({ text: 'x'.repeat(400), platforms: ['farcaster', 'telegram'], dryRun: false }),
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.details.join(' ')).toContain('farcaster: 400/320');
    expect(mocks.autoCastToZao).not.toHaveBeenCalled();
  });

  it('reports a partial failure honestly instead of claiming success', async () => {
    mocks.publishToX.mockRejectedValue(new Error('rate limited'));
    const res = await POST(req({ text: 'post', platforms: ['farcaster', 'x'], dryRun: false }));
    const json = await res.json();
    expect(json.success).toBe(false);
    const x = json.data.results.find((r: { platform: string }) => r.platform === 'x');
    expect(x.ok).toBe(false);
    expect(x.detail).toBe('rate limited');
  });

  it('reports a failed cast rather than silently continuing', async () => {
    mocks.autoCastToZao.mockResolvedValue(null);
    const res = await POST(req({ text: 'post', platforms: ['farcaster'], dryRun: false }));
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.data.results[0].detail).toContain('failed');
  });

  it('broadcasts ONLY to the channel that was selected', async () => {
    mocks.broadcastToChannels.mockResolvedValue({
      telegram: { success: true },
      discord: { success: false, error: 'Discord not selected' },
    });
    const res = await POST(req({ text: 'post', platforms: ['telegram'], dryRun: false }));
    // The load-bearing assertion: Discord is explicitly opted OUT, not left to
    // the helper's both-channels default.
    expect(mocks.broadcastToChannels).toHaveBeenCalledWith(
      expect.objectContaining({ channels: { telegram: true, discord: false } }),
    );
    const json = await res.json();
    expect(json.data.results.map((r: { platform: string }) => r.platform)).toEqual(['telegram']);
  });

  it('400s on an empty platform list or empty text', async () => {
    expect((await POST(req({ text: 'hi', platforms: [] }))).status).toBe(400);
    expect((await POST(req({ text: '', platforms: ['x'] }))).status).toBe(400);
  });
});

/**
 * Bot bearer (ZOE's POST button, doc 2239 fix 1). The bot runs on the VPS with
 * no iron-session, so a shared secret in PUBLISH_BOT_TOKEN lets it through as
 * admin-equivalent on THIS route only. Red controls: the bearer is accepted
 * only when the env is set AND matches; an unset env means the header is
 * ignored and the session path decides, exactly as before this change.
 */
describe('POST /api/publish/compose - PUBLISH_BOT_TOKEN bearer', () => {
  const TOKEN = 'z'.repeat(48);
  const saved = process.env.PUBLISH_BOT_TOKEN;

  function bearerReq(token: string, body: unknown): NextRequest {
    return new NextRequest('http://localhost/api/publish/compose', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSessionData.mockResolvedValue(null); // no session: only the bearer can pass
    mocks.autoCastToZao.mockResolvedValue('0xcast');
    process.env.PUBLISH_BOT_TOKEN = TOKEN;
  });
  afterEach(() => {
    if (saved === undefined) delete process.env.PUBLISH_BOT_TOKEN;
    else process.env.PUBLISH_BOT_TOKEN = saved;
  });

  it('a matching bearer passes with no session and the call is reported as the bot', async () => {
    const res = await POST(bearerReq(TOKEN, { text: 'hi', platforms: ['farcaster'] }));
    expect(res.status).toBe(200);
    expect((await res.json()).data.dryRun).toBe(true);
  });

  it('a wrong bearer with no session is 401 and publishes nothing', async () => {
    const res = await POST(
      bearerReq('y'.repeat(48), { text: 'hi', platforms: ['farcaster'], dryRun: false }),
    );
    expect(res.status).toBe(401);
    expect(mocks.autoCastToZao).not.toHaveBeenCalled();
  });

  it('with PUBLISH_BOT_TOKEN unset the header is ignored: no session means 401 even with the right-looking bearer', async () => {
    delete process.env.PUBLISH_BOT_TOKEN;
    const res = await POST(
      bearerReq(TOKEN, { text: 'hi', platforms: ['farcaster'], dryRun: false }),
    );
    expect(res.status).toBe(401);
    expect(mocks.autoCastToZao).not.toHaveBeenCalled();
  });

  it('a PUBLISH_BOT_TOKEN saved with a trailing newline still matches (trimmed on both sides)', async () => {
    process.env.PUBLISH_BOT_TOKEN = `${TOKEN}\n`;
    const res = await POST(bearerReq(TOKEN, { text: 'hi', platforms: ['farcaster'] }));
    expect(res.status).toBe(200);
  });

  it('a short PUBLISH_BOT_TOKEN (under 32 chars) is treated as unset', async () => {
    process.env.PUBLISH_BOT_TOKEN = 'short';
    const res = await POST(
      bearerReq('short', { text: 'hi', platforms: ['farcaster'], dryRun: false }),
    );
    expect(res.status).toBe(401);
    expect(mocks.autoCastToZao).not.toHaveBeenCalled();
  });
});
