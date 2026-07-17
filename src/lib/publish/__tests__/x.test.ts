// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — must be declared before any imports that touch the mocked modules
// ---------------------------------------------------------------------------

vi.mock('twitter-api-v2', () => ({
  TwitterApi: vi.fn().mockImplementation(() => ({})),
}));

// vi.hoisted ensures mockENV is created before the module factory below runs.
const mockENV = vi.hoisted(() => ({
  X_API_KEY: '',
  X_API_SECRET: '',
  X_ACCESS_TOKEN: '',
  X_ACCESS_SECRET: '',
}));

vi.mock('@/lib/env', () => ({ ENV: mockENV }));

// ---------------------------------------------------------------------------
// Subject under test
// ---------------------------------------------------------------------------

import { splitIntoThread, getXClient } from '@/lib/publish/x';

// ---------------------------------------------------------------------------
// Constants (mirror the module)
// ---------------------------------------------------------------------------

const CAST_URL = 'https://warpcast.com/thezao/0xdeadbeef'; // 23 chars when t.co-ified
const FIRST_MAX = 256; // 280 - 23 - 1

// ---------------------------------------------------------------------------
// splitIntoThread
// ---------------------------------------------------------------------------

describe('splitIntoThread', () => {
  // 1. Short text (well under 256 chars) — single element with castUrl appended
  it('returns single-element array when text fits within 256 chars', () => {
    const text = 'Hello, world!';
    const result = splitIntoThread(text, CAST_URL);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(`${text} ${CAST_URL}`);
  });

  // 2. Text exactly 256 chars — still fits, returns single element
  it('returns single-element array when text is exactly 256 chars (borderline)', () => {
    const text = 'a'.repeat(FIRST_MAX);
    expect(text.length).toBe(256);
    const result = splitIntoThread(text, CAST_URL);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(`${text} ${CAST_URL}`);
  });

  // 3. Text 257 chars (one over limit) — splits into two chunks
  it('produces two chunks when text is 257 chars (one over first-chunk limit)', () => {
    const text = 'a'.repeat(FIRST_MAX + 1); // no spaces → hard cut at 256
    const result = splitIntoThread(text, CAST_URL);
    expect(result).toHaveLength(2);
    // First chunk: first 256 chars + ' ' + castUrl
    expect(result[0]).toBe(`${'a'.repeat(256)} ${CAST_URL}`);
    // Second chunk: remainder
    expect(result[1]).toBe('a');
  });

  // 4. castUrl always appended to first chunk only
  it('appends castUrl to the first chunk only (never to subsequent chunks)', () => {
    const text = 'word '.repeat(100).trim(); // >256 chars, multiple words
    const result = splitIntoThread(text, CAST_URL);
    expect(result[0]).toContain(CAST_URL);
    for (let i = 1; i < result.length; i++) {
      expect(result[i]).not.toContain(CAST_URL);
    }
  });

  // 5. Word-boundary break: last space before 256 is used
  it('breaks at the last word boundary before 256 chars', () => {
    // Build text: 250 'a' chars, a space, then more chars to push over 256
    const prefix = 'a'.repeat(250);
    const suffix = 'b'.repeat(20);
    const text = `${prefix} ${suffix}`; // space at index 250, total 271 chars
    const result = splitIntoThread(text, CAST_URL);
    expect(result).toHaveLength(2);
    // First chunk should break at the space (index 250), not at 256
    expect(result[0]).toBe(`${prefix} ${CAST_URL}`);
    expect(result[1]).toBe(suffix);
  });

  // 6. No-space text longer than 256 — hard cut at 256
  it('hard-cuts at 256 when there are no spaces in a long text', () => {
    const text = 'z'.repeat(300);
    const result = splitIntoThread(text, CAST_URL);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe(`${'z'.repeat(256)} ${CAST_URL}`);
    expect(result[1]).toBe('z'.repeat(44));
  });

  // 7. Three-chunk scenario: text long enough to need 3 tweets
  it('produces three chunks for text spanning 3 tweets', () => {
    // ~700 chars with spaces to force 3 splits
    const segment = 'word '.repeat(56).trim(); // 56*5-1 = 279 chars each, no natural break at 256
    const text = `${segment} ${segment} ${segment}`; // well over 256+280+280
    const result = splitIntoThread(text, CAST_URL);
    expect(result.length).toBeGreaterThanOrEqual(3);
    // First chunk always ends with castUrl
    expect(result[0].endsWith(CAST_URL)).toBe(true);
    // First chunk text portion (before " <castUrl>") must be ≤ FIRST_MAX (256)
    const firstTextPart = result[0].slice(0, result[0].length - 1 - CAST_URL.length);
    expect(firstTextPart.length).toBeLessThanOrEqual(FIRST_MAX);
    // Subsequent chunks are standalone ≤ 280 chars each
    result.slice(1).forEach((chunk) => {
      expect(chunk.length).toBeLessThanOrEqual(280);
    });
  });

  // 8. Subsequent chunks are standalone (no trailing castUrl, no leading noise)
  it('subsequent chunks contain only text content with no trailing castUrl', () => {
    const text = 'hello '.repeat(60).trim(); // forces multiple chunks
    const result = splitIntoThread(text, CAST_URL);
    expect(result.length).toBeGreaterThan(1);
    result.slice(1).forEach((chunk) => {
      expect(chunk).not.toContain(CAST_URL);
      expect(chunk.trim()).toBe(chunk); // no leading/trailing whitespace
    });
  });

  // 9. Empty text → single element " <castUrl>" (space + url, as per implementation)
  it('handles empty text — returns single element with space+castUrl', () => {
    const result = splitIntoThread('', CAST_URL);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(` ${CAST_URL}`);
  });

  // 10. First chunk text portion never exceeds FIRST_MAX (256) chars
  it('first chunk text portion never exceeds 256 chars (regardless of castUrl length)', () => {
    // Use text with no spaces so we get a hard cut at exactly 256
    const text = 'x'.repeat(500);
    const result = splitIntoThread(text, CAST_URL);
    // The first chunk is "<256 chars> <castUrl>" — strip the " <castUrl>" suffix
    const textPart = result[0].slice(0, result[0].length - 1 - CAST_URL.length);
    expect(textPart.length).toBeLessThanOrEqual(FIRST_MAX);
    // And verify the structure
    expect(result[0].endsWith(` ${CAST_URL}`)).toBe(true);
  });

  // 11. Multiple word boundaries near 256 — picks the LAST space before limit
  it('picks the last available space before 256 when multiple spaces exist near boundary', () => {
    // Spaces at 240 and 248, text extends to 270
    const part1 = 'a'.repeat(240);
    const part2 = 'b'.repeat(7);
    const part3 = 'c'.repeat(22);
    const text = `${part1} ${part2} ${part3}`; // spaces at 240 and 248, total 272
    const result = splitIntoThread(text, CAST_URL);
    expect(result).toHaveLength(2);
    // Last space before 256 is at index 248 → first chunk is "aaa...aaa bbbbbbb"
    expect(result[0]).toBe(`${part1} ${part2} ${CAST_URL}`);
    expect(result[1]).toBe(part3);
  });

  // 12. Single chunk: first chunk length is at most FIRST_MAX (256) + space + castUrl len
  it('single-chunk result is correctly formatted as "<text> <castUrl>"', () => {
    const text = 'Short enough text';
    const result = splitIntoThread(text, CAST_URL);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatch(/^.+ https?:\/\//);
    expect(result[0]).toBe(`${text} ${CAST_URL}`);
  });
});

// ---------------------------------------------------------------------------
// getXClient
// ---------------------------------------------------------------------------

describe('getXClient', () => {
  // Reset mocked env fields before each test
  function setEnv(overrides: Partial<typeof mockENV>) {
    mockENV.X_API_KEY = overrides.X_API_KEY ?? '';
    mockENV.X_API_SECRET = overrides.X_API_SECRET ?? '';
    mockENV.X_ACCESS_TOKEN = overrides.X_ACCESS_TOKEN ?? '';
    mockENV.X_ACCESS_SECRET = overrides.X_ACCESS_SECRET ?? '';
  }

  // 1. All 4 env vars missing → null
  it('returns null when all four env vars are missing', () => {
    setEnv({});
    expect(getXClient()).toBeNull();
  });

  // 2. Partial env vars (3 of 4) → null
  it('returns null when only three of four env vars are set (missing X_ACCESS_SECRET)', () => {
    setEnv({
      X_API_KEY: 'key',
      X_API_SECRET: 'secret',
      X_ACCESS_TOKEN: 'token',
      // X_ACCESS_SECRET intentionally omitted
    });
    expect(getXClient()).toBeNull();
  });

  it('returns null when only three of four env vars are set (missing X_API_KEY)', () => {
    setEnv({
      // X_API_KEY intentionally omitted
      X_API_SECRET: 'secret',
      X_ACCESS_TOKEN: 'token',
      X_ACCESS_SECRET: 'access-secret',
    });
    expect(getXClient()).toBeNull();
  });

  // 3. All 4 env vars set → returns non-null TwitterApi instance
  it('returns a non-null client when all four env vars are set', () => {
    setEnv({
      X_API_KEY: 'key',
      X_API_SECRET: 'secret',
      X_ACCESS_TOKEN: 'token',
      X_ACCESS_SECRET: 'access-secret',
    });
    const client = getXClient();
    expect(client).not.toBeNull();
  });
});
