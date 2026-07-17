// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { parseLinks, slugify } from '../members';

// ---------------------------------------------------------------------------
// slugify
// ---------------------------------------------------------------------------

describe('slugify', () => {
  it('returns empty string for empty input', () => {
    expect(slugify('')).toBe('');
  });

  it('lowercases the name', () => {
    expect(slugify('ZAO')).toBe('zao');
  });

  it('replaces spaces with hyphens', () => {
    expect(slugify('Zaal Panthaki')).toBe('zaal-panthaki');
  });

  it('collapses multiple spaces into a single hyphen', () => {
    expect(slugify('hello   world')).toBe('hello-world');
  });

  it('trims leading and trailing whitespace', () => {
    expect(slugify('  ZAO  ')).toBe('zao');
  });

  it('strips special characters (punctuation other than hyphens)', () => {
    expect(slugify("Don't Stop!")).toBe('dont-stop');
  });

  it('preserves existing hyphens', () => {
    expect(slugify('pre-existing')).toBe('pre-existing');
  });

  it('preserves digits', () => {
    expect(slugify('Agent007')).toBe('agent007');
  });

  it('handles a mixed real name', () => {
    expect(slugify('ZAO OS')).toBe('zao-os');
  });

  it('strips parentheses and brackets', () => {
    expect(slugify('member (admin)')).toBe('member-admin');
  });
});

// ---------------------------------------------------------------------------
// parseLinks
// ---------------------------------------------------------------------------

describe('parseLinks', () => {
  it('returns empty array for empty string', () => {
    expect(parseLinks('')).toEqual([]);
  });

  it('returns empty array for whitespace-only string', () => {
    expect(parseLinks('   ')).toEqual([]);
  });

  it('parses a URL with protocol as-is', () => {
    const result = parseLinks('https://thezao.com');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ href: 'https://thezao.com', display: 'https://thezao.com' });
  });

  it('prepends https:// to a bare domain', () => {
    const result = parseLinks('example.com');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ href: 'https://example.com', display: 'example.com' });
  });

  it('converts an email to a mailto: href', () => {
    const result = parseLinks('zaal@thezao.com');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ href: 'mailto:zaal@thezao.com', display: 'zaal@thezao.com' });
  });

  it('converts a @handle to an x.com profile link', () => {
    const result = parseLinks('@zaal');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ href: 'https://x.com/zaal', display: '@zaal' });
  });

  it('splits on spaces', () => {
    const result = parseLinks('https://a.com https://b.com');
    expect(result).toHaveLength(2);
  });

  it('splits on commas', () => {
    const result = parseLinks('https://a.com,https://b.com');
    expect(result).toHaveLength(2);
  });

  it('splits on semicolons', () => {
    const result = parseLinks('https://a.com;https://b.com');
    expect(result).toHaveLength(2);
  });

  it('handles mixed types in one string', () => {
    const result = parseLinks('@alice user@example.com https://zaoos.com');
    expect(result).toHaveLength(3);
    expect(result[0].href).toBe('https://x.com/alice');
    expect(result[1].href).toBe('mailto:user@example.com');
    expect(result[2].href).toBe('https://zaoos.com');
  });

  it('preserves display text as the original token', () => {
    const result = parseLinks('@alice');
    expect(result[0].display).toBe('@alice');
  });
});
