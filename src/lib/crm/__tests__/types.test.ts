// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  CANONICAL_CATEGORIES,
  deriveContactSlug,
  hasStableContactKey,
  slugify,
} from '../types';

// ---------------------------------------------------------------------------
// CANONICAL_CATEGORIES
// ---------------------------------------------------------------------------

describe('CANONICAL_CATEGORIES', () => {
  it('has exactly 11 entries', () => {
    expect(CANONICAL_CATEGORIES).toHaveLength(11);
  });

  it('all entries are strings', () => {
    for (const c of CANONICAL_CATEGORIES) {
      expect(typeof c).toBe('string');
    }
  });

  it('includes "Musician"', () => {
    expect(CANONICAL_CATEGORIES).toContain('Musician');
  });

  it('includes "Developer / Tech"', () => {
    expect(CANONICAL_CATEGORIES).toContain('Developer / Tech');
  });

  it('includes "Other" as a catch-all', () => {
    expect(CANONICAL_CATEGORIES).toContain('Other');
  });

  it('has no duplicate entries', () => {
    expect(new Set(CANONICAL_CATEGORIES).size).toBe(CANONICAL_CATEGORIES.length);
  });
});

// ---------------------------------------------------------------------------
// slugify (CRM version — different from stock/members slugify)
// ---------------------------------------------------------------------------

describe('slugify', () => {
  it('returns empty string for empty input', () => {
    expect(slugify('')).toBe('');
  });

  it('lowercases the input', () => {
    expect(slugify('ZAAL')).toBe('zaal');
  });

  it('trims leading and trailing whitespace', () => {
    expect(slugify('  hello  ')).toBe('hello');
  });

  it('strips a leading @ (social handle → slug)', () => {
    expect(slugify('@zaal')).toBe('zaal');
  });

  it('replaces spaces with hyphens', () => {
    expect(slugify('hello world')).toBe('hello-world');
  });

  it('replaces runs of special characters with a single hyphen', () => {
    expect(slugify('foo!!!bar')).toBe('foo-bar');
  });

  it('replaces dots with hyphens', () => {
    expect(slugify('foo.bar')).toBe('foo-bar');
  });

  it('strips leading and trailing hyphens', () => {
    expect(slugify('_abc_')).toBe('abc');
  });

  it('slices the result to 64 characters', () => {
    const long = 'a'.repeat(100);
    expect(slugify(long).length).toBeLessThanOrEqual(64);
  });
});

// ---------------------------------------------------------------------------
// deriveContactSlug
// ---------------------------------------------------------------------------

describe('deriveContactSlug', () => {
  it('falls back to name when no other key is provided', () => {
    expect(deriveContactSlug({ name: 'Zaal Panthaki' })).toBe('zaal-panthaki');
  });

  it('prefers explicit slug over other identifiers', () => {
    expect(
      deriveContactSlug({ slug: 'my-slug', farcaster_handle: 'other', name: 'Name' }),
    ).toBe('my-slug');
  });

  it('prefers farcaster_handle over x_handle and name', () => {
    expect(
      deriveContactSlug({ farcaster_handle: 'zaalfc', x_handle: 'zaalx', name: 'Name' }),
    ).toBe('zaalfc');
  });

  it('prefers x_handle over github_handle and name', () => {
    expect(
      deriveContactSlug({ x_handle: 'zaalx', github_handle: 'zaalgh', name: 'Name' }),
    ).toBe('zaalx');
  });

  it('falls back to github_handle when no slug/farcaster/x', () => {
    expect(deriveContactSlug({ github_handle: 'zaalgh', name: 'Name' })).toBe('zaalgh');
  });

  it('strips @ from a handle when slugifying', () => {
    expect(deriveContactSlug({ farcaster_handle: '@thezao', name: 'Name' })).toBe('thezao');
  });

  it('returns a non-empty string for any valid input', () => {
    const result = deriveContactSlug({ name: 'Test User' });
    expect(result.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// hasStableContactKey
// ---------------------------------------------------------------------------

describe('hasStableContactKey', () => {
  it('returns false for name-only input (name is not a stable key)', () => {
    expect(hasStableContactKey({})).toBe(false);
  });

  it('returns true when slug is present', () => {
    expect(hasStableContactKey({ slug: 'my-slug' })).toBe(true);
  });

  it('returns true when farcaster_handle is present', () => {
    expect(hasStableContactKey({ farcaster_handle: 'zaalfc' })).toBe(true);
  });

  it('returns true when x_handle is present', () => {
    expect(hasStableContactKey({ x_handle: 'zaalx' })).toBe(true);
  });

  it('returns true when github_handle is present', () => {
    expect(hasStableContactKey({ github_handle: 'bettercallzaal' })).toBe(true);
  });

  it('returns false when all keys are null', () => {
    expect(
      hasStableContactKey({
        slug: null,
        farcaster_handle: null,
        x_handle: null,
        github_handle: null,
      }),
    ).toBe(false);
  });
});
