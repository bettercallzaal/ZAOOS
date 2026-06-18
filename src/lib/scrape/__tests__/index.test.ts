// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { detectScrapeSource, scrapeContent } from '../index';
import type { FetchImpl } from '../x-fetch';

describe('detectScrapeSource', () => {
  it('detects X by tweet id and url', () => {
    expect(detectScrapeSource('2067194761446920264')).toBe('x');
    expect(detectScrapeSource('https://x.com/heynavtoor/status/2067194761446920264')).toBe('x');
    expect(detectScrapeSource('https://twitter.com/foo/status/123456789012')).toBe('x');
    expect(detectScrapeSource('https://x.com/heynavtoor')).toBe('x');
  });

  it('detects WaveWarZ artist and battles pages', () => {
    expect(detectScrapeSource('https://wavewarz-intelligence.vercel.app/artist/ABC123')).toBe(
      'wavewarz-artist',
    );
    expect(detectScrapeSource('https://wavewarz-intelligence.vercel.app/battles')).toBe(
      'wavewarz-battles',
    );
    expect(detectScrapeSource('https://wavewarz-intelligence.vercel.app/battles?page=3')).toBe(
      'wavewarz-battles',
    );
  });

  it('returns unknown for unsupported input', () => {
    expect(detectScrapeSource('https://example.com/foo')).toBe('unknown');
    expect(detectScrapeSource('not a url')).toBe('unknown');
    expect(detectScrapeSource('')).toBe('unknown');
  });
});

describe('scrapeContent', () => {
  const fakeFetch = (json: unknown): FetchImpl =>
    (async () => ({ ok: true, status: 200, json: async () => json }) as Response) as unknown as FetchImpl;

  it('resolves an X tweet through the dispatcher', async () => {
    const fetchImpl = fakeFetch({
      tweet: { text: 'hi', author: { name: 'Nav', screen_name: 'heynavtoor' } },
    });
    const res = await scrapeContent('123456789012', { fetchImpl });
    expect(res.source).toBe('x');
    if (res.source !== 'x') return;
    expect(res.data.text).toBe('hi');
  });

  it('points WaveWarZ urls at their dedicated functions', async () => {
    const res = await scrapeContent('https://wavewarz-intelligence.vercel.app/battles');
    expect(res.source).toBe('unsupported');
    if (res.source !== 'unsupported') return;
    expect(res.reason).toMatch(/scrapeWaveWarzBattles/);
  });

  it('returns unsupported for unknown input', async () => {
    const res = await scrapeContent('https://example.com');
    expect(res.source).toBe('unsupported');
  });
});