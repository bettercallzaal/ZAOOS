// @vitest-environment node
//
// Zaal ruling (vault 2e556756, 20 Nov 2026): every event-driven @thezao
// auto-post becomes a ZOE Telegram draft for his tap. These tests are the
// contract. The first one is the red control: run it against the old
// auto-cast.ts (origin/main 8c5a0f1eb) and it fails, because the old
// autoCastToZao called postCast and posted to /zao directly.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockPostCast = vi.hoisted(() => vi.fn());

vi.mock('@/lib/farcaster/neynar', () => ({ postCast: mockPostCast }));
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { autoCastToZao } from '../auto-cast';
import { formatOfficialDraft } from '../official-draft';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  // The official signer IS configured, exactly as production is today
  // (zaoos.com/api/agents/health: "Signer configured").
  process.env.ZAO_OFFICIAL_SIGNER_UUID = 'signer-uuid';
  process.env.ZAO_OFFICIAL_NEYNAR_API_KEY = 'api-key';
  process.env.ZOE_DRAFTS_BOT_TOKEN = 'test-bot-token';
  process.env.ZOE_DRAFTS_CHAT_ID = '12345';
  mockPostCast.mockResolvedValue({ cast: { hash: '0xposted' } });
  fetchMock.mockResolvedValue({ ok: true, status: 200 });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.ZAO_OFFICIAL_SIGNER_UUID;
  delete process.env.ZAO_OFFICIAL_NEYNAR_API_KEY;
  delete process.env.ZOE_DRAFTS_BOT_TOKEN;
  delete process.env.ZOE_DRAFTS_CHAT_ID;
});

describe('autoCastToZao drafts instead of posting', () => {
  it('RED CONTROL: never posts to Farcaster, even with the official signer configured', async () => {
    const result = await autoCastToZao('Welcome @newmember to The ZAO!');
    expect(mockPostCast).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('sends the text to Zaal as a ZOE Telegram draft', async () => {
    await autoCastToZao('ZAO Daily: 3 active members', 'https://zaoos.com');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.telegram.org/bottest-bot-token/sendMessage');
    const body = JSON.parse(init.body);
    expect(body.chat_id).toBe('12345');
    expect(body.text).toContain('ZAO Daily: 3 active members');
    expect(body.text).toContain('Embed: https://zaoos.com');
    expect(body.text).toContain('Not posted.');
    expect(body.parse_mode).toBeUndefined();
  });

  it('fails closed: with the ZOE draft chat unset it neither sends nor posts', async () => {
    delete process.env.ZOE_DRAFTS_BOT_TOKEN;
    delete process.env.ZOE_DRAFTS_CHAT_ID;
    const result = await autoCastToZao('hello');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(mockPostCast).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('fails closed: a Telegram outage does not fall back to posting', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));
    const result = await autoCastToZao('hello');
    expect(mockPostCast).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('a non-2xx Telegram reply does not fall back to posting', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 403 });
    await autoCastToZao('hello');
    expect(mockPostCast).not.toHaveBeenCalled();
  });
});

describe('formatOfficialDraft', () => {
  it('names the target and source and says it was not posted', () => {
    const text = formatOfficialDraft({
      text: 'body',
      target: 'Farcaster /wavewarz plus the mirrors',
      source: 'proposal-approved p1',
    });
    expect(text.startsWith('Draft for Farcaster /wavewarz plus the mirrors (from proposal-approved p1). Not posted.')).toBe(true);
    expect(text).toContain('body');
  });

  it('caps the message at the Telegram limit', () => {
    expect(formatOfficialDraft({ text: 'x'.repeat(5000) }).length).toBe(4096);
  });
});
