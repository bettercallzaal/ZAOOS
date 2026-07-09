// @vitest-environment node

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BczSiteError, parseBczSite, scrapeBczSite } from '../bcz-site';
import type { FetchImpl } from '../x-fetch';

const fixture = readFileSync(join(__dirname, 'bcz-site-fixture.html'), 'utf-8');

describe('parseBczSite', () => {
  it('extracts the title from the real fixture', () => {
    const site = parseBczSite(fixture);
    expect(site.title).toMatch(/BetterCallZaal/);
  });

  it('categorizes social and project links', () => {
    const site = parseBczSite(fixture);
    expect(site.socials.some((u) => u.includes('x.com/bettercallzaal'))).toBe(true);
    expect(site.socials.some((u) => u.includes('github.com/bettercallzaal'))).toBe(true);
    expect(site.projects.some((u) => u.includes('wavewarz.com'))).toBe(true);
    expect(site.projects.some((u) => u.includes('zaofestivals.com'))).toBe(true);
  });

  it('excludes font/asset and self links', () => {
    const site = parseBczSite(fixture);
    expect(site.links.every((l) => !l.host.includes('googleapis'))).toBe(true);
    expect(site.links.every((l) => l.host !== 'bettercallzaal.com')).toBe(true);
  });

  it('dedupes repeated links', () => {
    const site = parseBczSite(fixture);
    const urls = site.links.map((l) => l.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('parses a minimal synthetic page', () => {
    const html =
      '<title>Test &amp; Co</title>' +
      '<a href="https://x.com/foo">x</a>' +
      '<a href="https://wavewarz.com/">ww</a>' +
      '<a href="https://example.com/blog">other</a>';
    const site = parseBczSite(html);
    expect(site.title).toBe('Test & Co');
    expect(site.socials).toEqual(['https://x.com/foo']);
    expect(site.projects).toEqual(['https://wavewarz.com/']);
    expect(site.links.find((l) => l.host === 'example.com')?.category).toBe('other');
  });

  it('handles a page with no links', () => {
    const site = parseBczSite('<title>Empty</title><body>nothing</body>');
    expect(site.links).toEqual([]);
    expect(site.socials).toEqual([]);
  });
});

describe('scrapeBczSite', () => {
  it('fetches and parses the site', async () => {
    const fetchImpl = (async () =>
      ({ ok: true, status: 200, text: async () => fixture }) as Response) as unknown as FetchImpl;
    const site = await scrapeBczSite({ fetchImpl });
    expect(site.title).toMatch(/BetterCallZaal/);
    expect(site.projects.length).toBeGreaterThan(0);
  });

  it('throws on an HTTP error', async () => {
    const fetchImpl = (async () =>
      ({ ok: false, status: 503 }) as Response) as unknown as FetchImpl;
    await expect(scrapeBczSite({ fetchImpl })).rejects.toBeInstanceOf(BczSiteError);
  });
});
