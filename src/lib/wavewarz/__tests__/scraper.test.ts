// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/scrape/wavewarz', () => ({
  parseWaveWarzArtistPage: vi.fn(),
}));

import { parseWaveWarzArtistPage } from '@/lib/scrape/wavewarz';
import { scrapeArtistStats } from '../scraper';

const parseMock = parseWaveWarzArtistPage as ReturnType<typeof vi.fn>;

const WALLET = '0xAbCdEf1234567890AbCdEf1234567890AbCdEf12';

const SUCCESS_DATA = {
  name: 'WaveArtist',
  wins: 10,
  losses: 5,
  battlesCount: 15,
  totalVolumeSol: 42.5,
  careerEarningsSol: 20.1,
};

function mockFetch(ok: boolean, body = '<html>test</html>', status = ok ? 200 : 404) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      status,
      text: async () => body,
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('scrapeArtistStats', () => {
  it('returns null when fetch returns a non-OK response', async () => {
    mockFetch(false, '', 404);
    const result = await scrapeArtistStats(WALLET);
    expect(result).toBeNull();
  });

  it('returns null when parse fails', async () => {
    mockFetch(true, '<html>valid page</html>');
    parseMock.mockReturnValue({ ok: false, reason: 'no flight data found' });

    const result = await scrapeArtistStats(WALLET);
    expect(result).toBeNull();
  });

  it('returns ArtistStats on success', async () => {
    mockFetch(true, '<html>flight payload</html>');
    parseMock.mockReturnValue({ ok: true, data: SUCCESS_DATA });

    const result = await scrapeArtistStats(WALLET);
    expect(result).not.toBeNull();
    expect(result?.name).toBe('WaveArtist');
    expect(result?.wallet).toBe(WALLET);
    expect(result?.wins).toBe(10);
    expect(result?.losses).toBe(5);
    expect(result?.battlesCount).toBe(15);
    expect(result?.totalVolumeSol).toBe(42.5);
    expect(result?.careerEarningsSol).toBe(20.1);
    expect(result?.lastBattleId).toBeNull();
  });

  it('passes the HTML and wallet to parseWaveWarzArtistPage', async () => {
    const html = '<html>flight payload</html>';
    mockFetch(true, html);
    parseMock.mockReturnValue({ ok: true, data: SUCCESS_DATA });

    await scrapeArtistStats(WALLET);
    expect(parseMock).toHaveBeenCalledWith(html, WALLET);
  });

  it('returns null and does not throw when fetch rejects (network error)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const result = await scrapeArtistStats(WALLET);
    expect(result).toBeNull();
  });

  it('returns null and does not throw on AbortError (timeout)', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortError));

    const result = await scrapeArtistStats(WALLET);
    expect(result).toBeNull();
  });

  it('fetches the correct URL (INTELLIGENCE_BASE/artist/<wallet>)', async () => {
    mockFetch(true, '<html/>', 200);
    parseMock.mockReturnValue({ ok: true, data: SUCCESS_DATA });

    await scrapeArtistStats(WALLET);
    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(fetchCall[0]).toContain(`/artist/${WALLET}`);
    expect(fetchCall[0]).toContain('wavewarz');
  });
});
