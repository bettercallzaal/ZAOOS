// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { BczHistory } from '../bcz-history';
import { scrapeBettercallzaalProfile } from '../bcz-profile';
import type { BczSite } from '../bcz-site';
import type { XTimeline } from '../x-timeline';

const fakeSite: BczSite = { title: 'BCZ', description: null, links: [], socials: [], projects: [] };
const fakeTimeline: XTimeline = { handle: 'bettercallzaal', total: 1, tweets: [] };
const fakeHistory: BczHistory = { fid: 8513, total: 2, casts: [], truncated: false };

describe('scrapeBettercallzaalProfile', () => {
  it('aggregates all three sources when they succeed', async () => {
    const profile = await scrapeBettercallzaalProfile({
      neynarApiKey: 'key',
      siteScraper: async () => fakeSite,
      timelineScraper: async () => fakeTimeline,
      farcasterScraper: async () => fakeHistory,
    });
    expect(profile.handle).toBe('bettercallzaal');
    expect(profile.site?.title).toBe('BCZ');
    expect(profile.xTimeline?.total).toBe(1);
    expect(profile.farcaster?.fid).toBe(8513);
    expect(profile.errors).toEqual([]);
  });

  it('records a failed source without sinking the others', async () => {
    const profile = await scrapeBettercallzaalProfile({
      neynarApiKey: 'key',
      siteScraper: async () => fakeSite,
      timelineScraper: async () => {
        throw new Error('timeline 503');
      },
      farcasterScraper: async () => fakeHistory,
    });
    expect(profile.site).not.toBeNull();
    expect(profile.farcaster).not.toBeNull();
    expect(profile.xTimeline).toBeNull();
    expect(profile.errors).toEqual([{ source: 'x-timeline', error: 'timeline 503' }]);
  });

  it('collects multiple failures', async () => {
    const profile = await scrapeBettercallzaalProfile({
      neynarApiKey: 'key',
      siteScraper: async () => {
        throw new Error('site down');
      },
      timelineScraper: async () => {
        throw new Error('tl down');
      },
      farcasterScraper: async () => fakeHistory,
    });
    expect(profile.errors.map((e) => e.source).sort()).toEqual(['site', 'x-timeline']);
    expect(profile.farcaster).not.toBeNull();
  });

  it('skips Farcaster (null, no error) when no Neynar key is given', async () => {
    let farcasterCalled = false;
    const profile = await scrapeBettercallzaalProfile({
      siteScraper: async () => fakeSite,
      timelineScraper: async () => fakeTimeline,
      farcasterScraper: async () => {
        farcasterCalled = true;
        return fakeHistory;
      },
    });
    expect(farcasterCalled).toBe(false);
    expect(profile.farcaster).toBeNull();
    expect(profile.errors).toEqual([]);
  });

  it('passes the handle through to the sub-scrapers, stripping @', async () => {
    let seenHandle = '';
    await scrapeBettercallzaalProfile({
      handle: '@someone',
      siteScraper: async () => fakeSite,
      timelineScraper: async (h) => {
        seenHandle = h;
        return fakeTimeline;
      },
    });
    expect(seenHandle).toBe('someone');
  });
});
