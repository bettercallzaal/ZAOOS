// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { generateClaimToken, slugify, verifyClaimToken } from '../artists';

// ---------------------------------------------------------------------------
// slugify — pure
// ---------------------------------------------------------------------------

describe('slugify', () => {
  it('lowercases and hyphenates words', () => {
    expect(slugify('ZAO Records')).toBe('zao-records');
  });

  it('collapses multiple spaces into a single hyphen', () => {
    expect(slugify('hello  world')).toBe('hello-world');
  });

  it('strips special characters', () => {
    expect(slugify("Zaal's Band!")).toBe('zaals-band');
  });

  it('returns an empty string for empty input', () => {
    expect(slugify('')).toBe('');
  });
});

// ---------------------------------------------------------------------------
// generateClaimToken — uses crypto.randomBytes
// ---------------------------------------------------------------------------

describe('generateClaimToken', () => {
  it('returns a 16-character hex string', () => {
    const token = generateClaimToken();
    expect(token).toMatch(/^[0-9a-f]{16}$/);
  });

  it('returns a unique value on each call', () => {
    expect(generateClaimToken()).not.toBe(generateClaimToken());
  });
});

// ---------------------------------------------------------------------------
// verifyClaimToken — early-exit guard (no Supabase call on short tokens)
// ---------------------------------------------------------------------------

describe('verifyClaimToken (short-token guard)', () => {
  it('returns null for an empty token without hitting Supabase', async () => {
    const result = await verifyClaimToken('some-slug', '');
    expect(result).toBeNull();
  });

  it('returns null for a token shorter than 4 characters', async () => {
    const result = await verifyClaimToken('some-slug', 'abc');
    expect(result).toBeNull();
  });
});
