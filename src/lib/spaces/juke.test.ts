import { describe, expect, it } from 'vitest';
import { isValidJukeSpaceId, JUKE_EMBED_ORIGIN, jukeEmbedUrl, parseJukeSpaceId } from './juke';

describe('isValidJukeSpaceId', () => {
  it('accepts plain alphanumeric ids', () => {
    expect(isValidJukeSpaceId('abc123')).toBe(true);
  });

  it('accepts ids with hyphens and underscores', () => {
    expect(isValidJukeSpaceId('zao-live_42')).toBe(true);
    expect(isValidJukeSpaceId('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('accepts a 128-char id but rejects 129', () => {
    expect(isValidJukeSpaceId('a'.repeat(128))).toBe(true);
    expect(isValidJukeSpaceId('a'.repeat(129))).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isValidJukeSpaceId('')).toBe(false);
  });

  it('rejects path-traversal and slash injection', () => {
    expect(isValidJukeSpaceId('../admin')).toBe(false);
    expect(isValidJukeSpaceId('abc/def')).toBe(false);
  });

  it('rejects query-string and fragment smuggling', () => {
    expect(isValidJukeSpaceId('abc?evil=1')).toBe(false);
    expect(isValidJukeSpaceId('abc#frag')).toBe(false);
  });

  it('rejects a smuggled absolute URL', () => {
    expect(isValidJukeSpaceId('https://evil.example.com')).toBe(false);
  });

  it('rejects whitespace and angle brackets', () => {
    expect(isValidJukeSpaceId('abc def')).toBe(false);
    expect(isValidJukeSpaceId('<script>')).toBe(false);
  });

  it('rejects non-string input', () => {
    expect(isValidJukeSpaceId(undefined)).toBe(false);
    expect(isValidJukeSpaceId(null)).toBe(false);
    expect(isValidJukeSpaceId(42)).toBe(false);
  });
});

describe('jukeEmbedUrl', () => {
  it('builds the embed URL for a valid id', () => {
    expect(jukeEmbedUrl('abc123')).toBe(`${JUKE_EMBED_ORIGIN}/embed/abc123`);
  });

  it('always points at the canonical Juke origin', () => {
    expect(jukeEmbedUrl('zao-live')).toMatch(/^https:\/\/juke\.audio\/embed\//);
  });

  it('throws on an invalid id rather than emitting a bad URL', () => {
    expect(() => jukeEmbedUrl('../evil')).toThrow('Invalid Juke space id');
    expect(() => jukeEmbedUrl('')).toThrow('Invalid Juke space id');
  });
});

describe('parseJukeSpaceId', () => {
  it('returns a bare id pasted directly', () => {
    expect(parseJukeSpaceId('zao-live-42')).toBe('zao-live-42');
  });

  it('trims surrounding whitespace', () => {
    expect(parseJukeSpaceId('  abc123  ')).toBe('abc123');
  });

  it('extracts the id from a full embed URL', () => {
    expect(parseJukeSpaceId('https://juke.audio/embed/abc123')).toBe('abc123');
  });

  it('extracts the id from any juke.audio path shape', () => {
    expect(parseJukeSpaceId('https://juke.audio/space/xyz789')).toBe('xyz789');
    expect(parseJukeSpaceId('https://juke.audio/rooms/room-1')).toBe('room-1');
    expect(parseJukeSpaceId('https://juke.audio/abc123')).toBe('abc123');
  });

  it('tolerates a missing protocol', () => {
    expect(parseJukeSpaceId('juke.audio/embed/abc123')).toBe('abc123');
  });

  it('accepts the www host', () => {
    expect(parseJukeSpaceId('https://www.juke.audio/embed/abc123')).toBe('abc123');
  });

  it('ignores query strings and trailing slashes on a link', () => {
    expect(parseJukeSpaceId('https://juke.audio/embed/abc123?utm=x')).toBe('abc123');
    expect(parseJukeSpaceId('https://juke.audio/embed/abc123/')).toBe('abc123');
  });

  it('rejects a non-Juke host', () => {
    expect(parseJukeSpaceId('https://evil.example.com/embed/abc123')).toBeNull();
    expect(parseJukeSpaceId('https://juke.audio.evil.com/embed/abc')).toBeNull();
  });

  it('rejects empty or unparseable input', () => {
    expect(parseJukeSpaceId('')).toBeNull();
    expect(parseJukeSpaceId('   ')).toBeNull();
  });

  it('rejects a juke.audio link whose last segment is not a valid id', () => {
    expect(parseJukeSpaceId('https://juke.audio/embed/has spaces')).toBeNull();
  });
});
