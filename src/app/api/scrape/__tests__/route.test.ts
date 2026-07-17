// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeGetRequest } from '@/test-utils/api-helpers';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockGetSessionData = vi.hoisted(() => vi.fn());
vi.mock('@/lib/auth/session', () => ({ getSessionData: mockGetSessionData }));

const mockScrapeContent = vi.hoisted(() => vi.fn());
const mockScrapeXUserTimeline = vi.hoisted(() => vi.fn());
const mockScrapeWaveWarzBattles = vi.hoisted(() => vi.fn());
const mockScrapeBczFarcasterHistory = vi.hoisted(() => vi.fn());
const mockScrapeFarcasterHistoryByUsername = vi.hoisted(() => vi.fn());
const mockScrapeBczSite = vi.hoisted(() => vi.fn());
vi.mock('@/lib/scrape', () => ({
  scrapeContent: mockScrapeContent,
  scrapeXUserTimeline: mockScrapeXUserTimeline,
  scrapeWaveWarzBattles: mockScrapeWaveWarzBattles,
  scrapeBczFarcasterHistory: mockScrapeBczFarcasterHistory,
  scrapeFarcasterHistoryByUsername: mockScrapeFarcasterHistoryByUsername,
  scrapeBczSite: mockScrapeBczSite,
}));

const mockCacheScrape = vi.hoisted(() => vi.fn().mockResolvedValue({ ok: false }));
vi.mock('@/lib/scrape/persist', () => ({ cacheScrape: mockCacheScrape }));

const mockScrapeArtistStats = vi.hoisted(() => vi.fn());
vi.mock('@/lib/wavewarz/scraper', () => ({ scrapeArtistStats: mockScrapeArtistStats }));

import { GET } from '../route';

afterEach(() => vi.clearAllMocks());

const AUTHED_SESSION = { fid: 10 };

describe('GET /api/scrape', () => {
  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const req = makeGetRequest('/api/scrape', { url: 'https://x.com/i/status/123' });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when no target query param is provided', async () => {
    mockGetSessionData.mockResolvedValue(AUTHED_SESSION);
    const req = makeGetRequest('/api/scrape');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns 200 with x source data on url scrape', async () => {
    mockGetSessionData.mockResolvedValue(AUTHED_SESSION);
    mockScrapeContent.mockResolvedValue({
      source: 'x',
      data: { id: 'tweet-123', text: 'Hello ZAO' },
    });
    const req = makeGetRequest('/api/scrape', { url: 'https://x.com/i/status/123' });
    const res = await GET(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.source).toBe('x');
    expect(body.data.id).toBe('tweet-123');
  });

  it('returns 200 with source:x-timeline on xUser scrape', async () => {
    mockGetSessionData.mockResolvedValue(AUTHED_SESSION);
    mockScrapeXUserTimeline.mockResolvedValue({ handle: 'zabal', tweets: [] });
    const req = makeGetRequest('/api/scrape', { xUser: 'zabal' });
    const res = await GET(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.source).toBe('x-timeline');
  });

  it('returns 404 when wavewarzArtist stats are unavailable', async () => {
    mockGetSessionData.mockResolvedValue(AUTHED_SESSION);
    mockScrapeArtistStats.mockResolvedValue(null);
    const req = makeGetRequest('/api/scrape', { wavewarzArtist: 'SomeWallet111' });
    const res = await GET(req);
    expect(res.status).toBe(404);
  });

  it('returns 502 when scrape function throws', async () => {
    mockGetSessionData.mockResolvedValue(AUTHED_SESSION);
    mockScrapeBczSite.mockRejectedValue(new Error('connection refused'));
    const req = makeGetRequest('/api/scrape', { bczSite: '1' });
    const res = await GET(req);
    expect(res.status).toBe(502);
  });
});
