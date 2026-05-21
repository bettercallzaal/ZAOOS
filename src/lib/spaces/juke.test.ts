import { describe, it, expect } from 'vitest';
import { JUKE_EMBED_ORIGIN, isValidJukeSpaceId, jukeEmbedUrl } from './juke';

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
