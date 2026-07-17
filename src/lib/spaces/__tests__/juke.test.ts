// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  isValidJukeSpaceId,
  jukeAppDeeplinkUrl,
  jukeEmbedUrl,
  jukeSpaceOgImageUrl,
  jukeSpaceUrl,
  parseJukeSpaceId,
} from '../juke';

// ---------------------------------------------------------------------------
// isValidJukeSpaceId
// ---------------------------------------------------------------------------

describe('isValidJukeSpaceId', () => {
  it('accepts alphanumeric ids', () => {
    expect(isValidJukeSpaceId('abc123')).toBe(true);
  });

  it('accepts ids with underscores and hyphens', () => {
    expect(isValidJukeSpaceId('my-space_01')).toBe(true);
  });

  it('rejects an empty string', () => {
    expect(isValidJukeSpaceId('')).toBe(false);
  });

  it('rejects ids containing a slash (injection vector)', () => {
    expect(isValidJukeSpaceId('space/inject')).toBe(false);
  });

  it('rejects ids containing a query-string character (?)', () => {
    expect(isValidJukeSpaceId('space?q=evil')).toBe(false);
  });

  it('rejects ids longer than 128 characters', () => {
    expect(isValidJukeSpaceId('a'.repeat(129))).toBe(false);
  });

  it('rejects non-string values (number, null, object)', () => {
    expect(isValidJukeSpaceId(42)).toBe(false);
    expect(isValidJukeSpaceId(null)).toBe(false);
    expect(isValidJukeSpaceId({ id: 'abc' })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// jukeEmbedUrl
// ---------------------------------------------------------------------------

describe('jukeEmbedUrl', () => {
  it('returns the canonical embed URL for a valid space id', () => {
    expect(jukeEmbedUrl('my-space')).toBe('https://juke.audio/embed/my-space');
  });

  it('throws for an invalid space id', () => {
    expect(() => jukeEmbedUrl('bad/id')).toThrow('Invalid Juke space id');
  });

  it('appends ?audio=off when audioOff is true', () => {
    expect(jukeEmbedUrl('space1', { audioOff: true })).toBe(
      'https://juke.audio/embed/space1?audio=off',
    );
  });

  it('appends ?token=... when partnerToken is provided', () => {
    const url = jukeEmbedUrl('space1', { partnerToken: 'tok-abc' });
    expect(url).toContain('token=tok-abc');
  });

  it('appends both audio=off and token when both options are set', () => {
    const url = jukeEmbedUrl('space1', { audioOff: true, partnerToken: 'tok-xyz' });
    expect(url).toContain('audio=off');
    expect(url).toContain('token=tok-xyz');
  });
});

// ---------------------------------------------------------------------------
// jukeSpaceUrl
// ---------------------------------------------------------------------------

describe('jukeSpaceUrl', () => {
  it('returns the canonical space permalink', () => {
    expect(jukeSpaceUrl('abc123')).toBe('https://juke.audio/space/abc123');
  });

  it('throws for an invalid space id', () => {
    expect(() => jukeSpaceUrl('bad?id')).toThrow('Invalid Juke space id');
  });
});

// ---------------------------------------------------------------------------
// jukeSpaceOgImageUrl
// ---------------------------------------------------------------------------

describe('jukeSpaceOgImageUrl', () => {
  it('returns the OG image URL', () => {
    expect(jukeSpaceOgImageUrl('abc123')).toBe(
      'https://juke.audio/space/abc123/opengraph-image',
    );
  });
});

// ---------------------------------------------------------------------------
// jukeAppDeeplinkUrl
// ---------------------------------------------------------------------------

describe('jukeAppDeeplinkUrl', () => {
  it('returns the native-app deeplink with ?open=app', () => {
    expect(jukeAppDeeplinkUrl('abc123')).toBe(
      'https://juke.audio/space/abc123?open=app',
    );
  });
});

// ---------------------------------------------------------------------------
// parseJukeSpaceId
// ---------------------------------------------------------------------------

describe('parseJukeSpaceId', () => {
  it('returns null for an empty string', () => {
    expect(parseJukeSpaceId('')).toBeNull();
  });

  it('returns the id when input is a bare valid space id', () => {
    expect(parseJukeSpaceId('my-space-01')).toBe('my-space-01');
  });

  it('extracts id from a /embed/{id} URL', () => {
    expect(parseJukeSpaceId('https://juke.audio/embed/abc123')).toBe('abc123');
  });

  it('extracts id from a /space/{id} URL', () => {
    expect(parseJukeSpaceId('https://juke.audio/space/xyz789')).toBe('xyz789');
  });

  it('handles URLs without a protocol (juke.audio/space/id)', () => {
    expect(parseJukeSpaceId('juke.audio/space/bare-id')).toBe('bare-id');
  });

  it('accepts www.juke.audio URLs', () => {
    expect(parseJukeSpaceId('https://www.juke.audio/space/room1')).toBe('room1');
  });

  it('returns null for a non-juke URL', () => {
    expect(parseJukeSpaceId('https://evil.com/space/abc')).toBeNull();
  });

  it('returns null for a completely invalid string', () => {
    expect(parseJukeSpaceId('not a url at all!!!')).toBeNull();
  });
});
