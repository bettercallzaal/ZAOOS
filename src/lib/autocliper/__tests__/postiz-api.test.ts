// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildCaption, postToPostiz, validatePlatforms } from '../postiz-api';

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.unstubAllGlobals());

// ---------------------------------------------------------------------------
// validatePlatforms
// ---------------------------------------------------------------------------

describe('validatePlatforms', () => {
  it('returns true when all platforms are valid', () => {
    expect(validatePlatforms(['warpcast', 'x', 'bluesky', 'discord'])).toBe(true);
  });

  it('returns true for a single valid platform', () => {
    expect(validatePlatforms(['warpcast'])).toBe(true);
  });

  it('returns false for a single invalid platform', () => {
    expect(validatePlatforms(['tiktok'] as any)).toBe(false);
  });

  it('returns false when one invalid platform is mixed with valid ones', () => {
    expect(validatePlatforms(['warpcast', 'unknown'] as any)).toBe(false);
  });

  it('returns true for an empty array (vacuous truth)', () => {
    expect(validatePlatforms([])).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// buildCaption
// ---------------------------------------------------------------------------

describe('buildCaption', () => {
  it('returns title + newlines + description unchanged when short', () => {
    const result = buildCaption('My Title', 'My Description');
    expect(result).toBe('My Title\n\nMy Description');
  });

  it('returns caption unchanged when length equals maxChars', () => {
    const title = 'T';
    const desc = 'D'.repeat(295); // 1 + 2 (\n\n) + 295 = 298... let me calc: "T\n\nDDDD..." = 1+2+295=298
    const base = `${title}\n\n${desc}`;
    const result = buildCaption(title, desc, base.length);
    expect(result).toBe(base);
    expect(result.length).toBe(base.length);
  });

  it('truncates to maxChars and appends "..."', () => {
    const title = 'A'.repeat(50);
    const desc = 'B'.repeat(300);
    const result = buildCaption(title, desc, 100);
    expect(result).toHaveLength(100);
    expect(result).toMatch(/\.\.\.$/);
  });

  it('default maxChars is 300', () => {
    const title = 'T';
    const desc = 'D'.repeat(400);
    const result = buildCaption(title, desc);
    expect(result).toHaveLength(300);
    expect(result).toMatch(/\.\.\.$/);
  });

  it('custom maxChars is respected', () => {
    const title = 'Title';
    const desc = 'D'.repeat(200);
    const result = buildCaption(title, desc, 50);
    expect(result).toHaveLength(50);
  });

  it('truncated result ends with "..."', () => {
    const result = buildCaption('Hello', 'A'.repeat(500), 100);
    expect(result.endsWith('...')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// postToPostiz — stub path (no POSTIZ_API_KEY set in test env)
// ---------------------------------------------------------------------------

describe('postToPostiz stub path', () => {
  it('returns a stub response without calling fetch when apiKey is unset', async () => {
    vi.stubGlobal('fetch', vi.fn());
    const result = await postToPostiz({ content: 'test', platforms: ['warpcast'] });
    expect(result).toBeDefined();
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it('stub id starts with "stub-"', async () => {
    const result = await postToPostiz({ content: 'test', platforms: ['x'] });
    expect(result.id).toMatch(/^stub-/);
  });

  it('stub scheduled contains an entry for each requested platform', async () => {
    const result = await postToPostiz({
      content: 'hello',
      platforms: ['warpcast', 'bluesky'],
    });
    expect(result.scheduled).toHaveProperty('warpcast');
    expect(result.scheduled).toHaveProperty('bluesky');
  });

  it('stub scheduled entries have status: "scheduled"', async () => {
    const result = await postToPostiz({ content: 'test', platforms: ['discord'] });
    expect(result.scheduled['discord']?.status).toBe('scheduled');
  });
});
