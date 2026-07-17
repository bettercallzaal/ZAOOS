// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildCaption, postToPostiz, validatePlatforms } from '../postiz-api';
import type { PostizPostRequest } from '../types';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// validatePlatforms — pure
// ---------------------------------------------------------------------------

describe('validatePlatforms', () => {
  it('returns true for all supported platforms', () => {
    expect(validatePlatforms(['warpcast', 'x', 'bluesky', 'discord'])).toBe(true);
  });

  it('returns true for a valid subset', () => {
    expect(validatePlatforms(['x', 'bluesky'])).toBe(true);
  });

  it('returns false when an unknown platform is included', () => {
    expect(validatePlatforms(['x', 'tiktok' as never])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// buildCaption — pure
// ---------------------------------------------------------------------------

describe('buildCaption', () => {
  it('returns the full caption when within the default 300-char limit', () => {
    const result = buildCaption('Short Title', 'Short description.');
    expect(result).toBe('Short Title\n\nShort description.');
  });

  it('truncates with "..." when caption exceeds maxChars', () => {
    const longDesc = 'a'.repeat(300);
    const result = buildCaption('T', longDesc, 50);
    expect(result).toHaveLength(50);
    expect(result.endsWith('...')).toBe(true);
  });

  it('returns exactly maxChars characters on boundary', () => {
    // "T\n\nddddd" — total must == maxChars exactly to NOT truncate
    const caption = 'T\n\n' + 'x'.repeat(7); // len = 10
    const result = buildCaption('T', 'x'.repeat(7), 10);
    expect(result).toHaveLength(10);
    expect(result.endsWith('...')).toBe(false);
  });

  it('uses 300 as the default maxChars', () => {
    const base = 'Title\n\n' + 'x'.repeat(310);
    const result = buildCaption('Title', 'x'.repeat(310));
    expect(result).toHaveLength(300);
    expect(result.endsWith('...')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// postToPostiz — no API key → stub response
// ---------------------------------------------------------------------------

const BASE_REQUEST: PostizPostRequest = {
  content: 'Check out this clip!',
  platforms: ['x', 'bluesky'],
};

describe('postToPostiz (no API key)', () => {
  it('returns a stub id and scheduled map when POSTIZ_API_KEY is not set', async () => {
    // In test env POSTIZ_API_KEY is absent → stub path
    const result = await postToPostiz(BASE_REQUEST);
    expect(result.id).toMatch(/^stub-\d+$/);
    expect(result.scheduled).toHaveProperty('x');
    expect(result.scheduled).toHaveProperty('bluesky');
  });

  it('includes all requested platforms in the stub scheduled object', async () => {
    const req: PostizPostRequest = { content: 'hello', platforms: ['discord', 'warpcast'] };
    const result = await postToPostiz(req);
    expect(Object.keys(result.scheduled)).toContain('discord');
    expect(Object.keys(result.scheduled)).toContain('warpcast');
    expect(result.scheduled['discord']?.status).toBe('scheduled');
  });
});
