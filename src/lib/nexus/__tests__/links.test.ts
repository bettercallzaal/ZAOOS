// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  flattenLinks,
  getNexusByTag,
  NEXUS_LINK_TYPES,
  NEXUS_LINKS,
  searchNexus,
} from '../links';

// ---------------------------------------------------------------------------
// NEXUS_LINKS data integrity
// ---------------------------------------------------------------------------
describe('NEXUS_LINKS', () => {
  it('is a non-empty array of categories', () => {
    expect(Array.isArray(NEXUS_LINKS)).toBe(true);
    expect(NEXUS_LINKS.length).toBeGreaterThan(0);
  });

  it('every category has a non-empty name', () => {
    for (const cat of NEXUS_LINKS) {
      expect(typeof cat.name).toBe('string');
      expect(cat.name.length).toBeGreaterThan(0);
    }
  });

  it('NEXUS_LINK_TYPES contains expected platform types', () => {
    expect(NEXUS_LINK_TYPES).toContain('website');
    expect(NEXUS_LINK_TYPES).toContain('social');
    expect(NEXUS_LINK_TYPES).toContain('platform');
    expect(NEXUS_LINK_TYPES).toContain('streaming');
  });
});

// ---------------------------------------------------------------------------
// flattenLinks
// ---------------------------------------------------------------------------
describe('flattenLinks', () => {
  it('returns an array of NexusLink objects', () => {
    const links = flattenLinks();
    expect(Array.isArray(links)).toBe(true);
    expect(links.length).toBeGreaterThan(10);
  });

  it('every flattened link has title, url, and type', () => {
    const links = flattenLinks();
    for (const link of links) {
      expect(typeof link.title).toBe('string');
      expect(link.title.length).toBeGreaterThan(0);
      expect(typeof link.url).toBe('string');
      expect(link.url.length).toBeGreaterThan(0);
      expect(typeof link.type).toBe('string');
    }
  });

  it('every link type is a valid NEXUS_LINK_TYPES value', () => {
    const links = flattenLinks();
    for (const link of links) {
      expect(NEXUS_LINK_TYPES as readonly string[]).toContain(link.type);
    }
  });

  it('includes links from nested subcategories', () => {
    // "ZAO Core" has subcategories with links — they should appear in flat list
    const links = flattenLinks();
    const hasWhitepaper = links.some((l) => l.title === 'ZAO Whitepaper');
    expect(hasWhitepaper).toBe(true);
  });

  it('accepts a custom category array', () => {
    const custom = [{ name: 'Test', links: [{ title: 'T', url: 'https://t.com', type: 'website' as const }] }];
    const links = flattenLinks(custom);
    expect(links).toHaveLength(1);
    expect(links[0].title).toBe('T');
  });

  it('returns empty array for empty input', () => {
    expect(flattenLinks([])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// searchNexus
// ---------------------------------------------------------------------------
describe('searchNexus', () => {
  it('returns empty array for a query that matches nothing', () => {
    const results = searchNexus('zzznomatch99999');
    expect(results).toEqual([]);
  });

  it('searches by title (case-insensitive)', () => {
    const results = searchNexus('DISCORD');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((l) => l.title.toLowerCase().includes('discord') ||
                                l.description?.toLowerCase().includes('discord') ||
                                l.tags?.some((t) => t.toLowerCase().includes('discord')))
    ).toBe(true);
  });

  it('searches by description', () => {
    const results = searchNexus('compete in music battles');
    expect(results.length).toBeGreaterThan(0);
  });

  it('searches by tags', () => {
    const results = searchNexus('streaming');
    expect(results.length).toBeGreaterThan(0);
    // All results should have "streaming" in title, description, or tags
    const matchedByTag = results.some((l) => l.tags?.includes('streaming'));
    expect(matchedByTag).toBe(true);
  });

  it('returns results for common ZAO-related term', () => {
    const results = searchNexus('zao');
    expect(results.length).toBeGreaterThan(5);
  });
});

// ---------------------------------------------------------------------------
// getNexusByTag
// ---------------------------------------------------------------------------
describe('getNexusByTag', () => {
  it('returns empty array when tag matches nothing', () => {
    expect(getNexusByTag('nonexistent-tag-xyz')).toEqual([]);
  });

  it('returns all links with the given tag (exact match, case-insensitive)', () => {
    const results = getNexusByTag('COMMUNITY');
    expect(results.length).toBeGreaterThan(0);
    for (const link of results) {
      expect(link.tags?.map((t) => t.toLowerCase())).toContain('community');
    }
  });

  it('does NOT return links where tag is only a partial match', () => {
    // "community" tag should not match "community-music" as a substring
    // (our implementation uses exact match via ===)
    const commResults = getNexusByTag('comm');
    // "comm" is not a full tag value — should return empty
    expect(commResults).toEqual([]);
  });

  it('blockchain tag returns only blockchain-tagged links', () => {
    const results = getNexusByTag('blockchain');
    expect(results.length).toBeGreaterThan(0);
    for (const link of results) {
      expect(link.tags?.includes('blockchain')).toBe(true);
    }
  });
});
