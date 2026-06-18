// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseXTimelineHtml, scrapeXUserTimeline, XTimelineError } from '../x-timeline';
import type { FetchImpl } from '../x-fetch';

const fixture = readFileSync(join(__dirname, 'x-timeline-fixture.html'), 'utf-8');

describe('parseXTimelineHtml', () => {
  it('extracts normalized tweets from a real timeline-profile fixture', () => {
    const tweets = parseXTimelineHtml(fixture);
    expect(tweets.length).toBe(2);
    const first = tweets[0];
    expect(first.id).toBe('2061236082377990180');
    expect(first.text.length).toBeGreaterThan(0);
    expect(first.likes).toBeGreaterThanOrEqual(0);
    expect(typeof first.createdAt).toBe('string');
  });

  it('returns [] when no __NEXT_DATA__ blob is present', () => {
    expect(parseXTimelineHtml('<html><body>no data</body></html>')).toEqual([]);
  });

  it('returns [] on malformed JSON', () => {
    expect(parseXTimelineHtml('<script id="__NEXT_DATA__">{not json}</script>')).toEqual([]);
  });

  it('parses a minimal synthetic blob', () => {
    const blob = JSON.stringify({
      props: {
        pageProps: {
          timeline: {
            entries: [
              { content: { tweet: { id_str: '1', full_text: 'hi', favorite_count: 4, created_at: 'now' } } },
            ],
          },
        },
      },
    });
    const tweets = parseXTimelineHtml(`<script id="__NEXT_DATA__" type="application/json">${blob}</script>`);
    expect(tweets).toHaveLength(1);
    expect(tweets[0].text).toBe('hi');
    expect(tweets[0].likes).toBe(4);
  });

  it('dedupes repeated tweet ids', () => {
    const tweets = parseXTimelineHtml(fixture + fixture);
    const ids = tweets.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('scrapeXUserTimeline', () => {
  it('fetches and parses a handle, stripping a leading @', async () => {
    let seenUrl = '';
    const fetchImpl = (async (url: string) => {
      seenUrl = url;
      return { ok: true, status: 200, text: async () => fixture } as Response;
    }) as unknown as FetchImpl;
    const tl = await scrapeXUserTimeline('@bettercallzaal', { fetchImpl });
    expect(seenUrl).toContain('screen-name/bettercallzaal');
    expect(tl.handle).toBe('bettercallzaal');
    expect(tl.total).toBe(2);
  });

  it('throws on an empty handle', async () => {
    await expect(scrapeXUserTimeline('  ')).rejects.toBeInstanceOf(XTimelineError);
  });

  it('throws on an HTTP error', async () => {
    const fetchImpl = (async () => ({ ok: false, status: 404 }) as Response) as unknown as FetchImpl;
    await expect(scrapeXUserTimeline('nope', { fetchImpl })).rejects.toBeInstanceOf(XTimelineError);
  });
});
