// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { detectPlatform } from '../reader';

// detectPlatform is a pure URL-to-platform classifier that parses the hostname.

describe('detectPlatform', () => {
  // ── Guard cases ──────────────────────────────────────────────────

  it('returns "website" for empty string', () => {
    expect(detectPlatform('')).toBe('website');
  });

  it('returns "website" for a non-URL string (URL parse error)', () => {
    expect(detectPlatform('not a url at all')).toBe('website');
  });

  // ── x / twitter ─────────────────────────────────────────────────

  it('returns "x" for x.com URLs', () => {
    expect(detectPlatform('https://x.com/STILOWORLD')).toBe('x');
  });

  it('returns "x" for twitter.com URLs (maps to "x", not "twitter")', () => {
    expect(detectPlatform('https://twitter.com/user')).toBe('x');
  });

  // ── youtube ──────────────────────────────────────────────────────

  it('returns "youtube" for youtube.com URLs', () => {
    expect(detectPlatform('https://www.youtube.com/watch?v=abc')).toBe('youtube');
  });

  it('returns "youtube" for youtu.be short links', () => {
    expect(detectPlatform('https://youtu.be/abc123')).toBe('youtube');
  });

  // ── reddit ───────────────────────────────────────────────────────

  it('returns "reddit" for reddit.com URLs', () => {
    expect(detectPlatform('https://www.reddit.com/r/music')).toBe('reddit');
  });

  // ── linktree ─────────────────────────────────────────────────────

  it('returns "linktree" for linktree.com URLs', () => {
    expect(detectPlatform('https://linktree.com/user')).toBe('linktree');
  });

  it('returns "website" for linktr.ee (only linktree.com is matched)', () => {
    // linktr.ee is the common short domain but the check is for 'linktree.com'
    expect(detectPlatform('https://linktr.ee/user')).toBe('website');
  });

  // ── spotify ──────────────────────────────────────────────────────

  it('returns "spotify" for open.spotify.com URLs', () => {
    expect(detectPlatform('https://open.spotify.com/track/abc')).toBe('spotify');
  });

  // ── website fallback ─────────────────────────────────────────────

  it('returns "website" for an unknown domain', () => {
    expect(detectPlatform('https://example.com/page')).toBe('website');
  });

  it('returns "website" for a github.com URL', () => {
    expect(detectPlatform('https://github.com/bettercallzaal')).toBe('website');
  });

  it('is case-insensitive for hostnames', () => {
    expect(detectPlatform('https://X.COM/user')).toBe('x');
    expect(detectPlatform('https://YOUTUBE.COM/watch')).toBe('youtube');
  });
});
