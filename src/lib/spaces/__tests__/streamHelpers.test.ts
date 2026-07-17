// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createGuestUser, createStreamUser, generateCallId, generateSlug } from '../streamHelpers';

// ---------------------------------------------------------------------------
// generateSlug
// ---------------------------------------------------------------------------

describe('generateSlug', () => {
  it('lowercases and converts spaces to hyphens', () => {
    const slug = generateSlug('My Awesome Session');
    expect(slug).toMatch(/^my-awesome-session-[a-z0-9]{4}$/);
  });

  it('strips special characters', () => {
    const slug = generateSlug('Hello! World & Co.');
    expect(slug).toMatch(/^hello-world-co-[a-z0-9]{4}$/);
  });

  it('collapses multiple hyphens', () => {
    const slug = generateSlug('A  B---C');
    expect(slug).toMatch(/^a-b-c-[a-z0-9]{4}$/);
  });

  it('strips leading and trailing hyphens', () => {
    const slug = generateSlug('!leading and trailing!');
    expect(slug).toMatch(/^leading-and-trailing-[a-z0-9]{4}$/);
  });

  it('truncates base to 60 chars before appending suffix', () => {
    const long = 'a'.repeat(70);
    const slug = generateSlug(long);
    // base is 60 chars + '-' + 4 suffix chars = 65
    expect(slug.length).toBeLessThanOrEqual(65);
  });

  it('always appends a 4-char alphanumeric suffix', () => {
    const slug = generateSlug('test');
    const parts = slug.split('-');
    const suffix = parts[parts.length - 1];
    expect(suffix).toMatch(/^[a-z0-9]{4}$/);
  });

  it('produces different slugs for the same title (random suffix)', () => {
    const a = generateSlug('same title');
    const b = generateSlug('same title');
    // With overwhelming probability the 4-char random suffixes differ
    // (fails ~1 in 36^4 ≈ 1.7M runs)
    expect(a).not.toBe(b);
  });
});

// ---------------------------------------------------------------------------
// generateCallId
// ---------------------------------------------------------------------------

describe('generateCallId', () => {
  it('returns a non-empty string', () => {
    expect(typeof generateCallId()).toBe('string');
    expect(generateCallId().length).toBeGreaterThan(0);
  });

  it('returns a UUID when crypto.randomUUID is available', () => {
    // Node 20 always has crypto.randomUUID — expect UUID format
    expect(generateCallId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it('produces unique ids on successive calls', () => {
    expect(generateCallId()).not.toBe(generateCallId());
  });
});

// ---------------------------------------------------------------------------
// createStreamUser
// ---------------------------------------------------------------------------

describe('createStreamUser', () => {
  it('maps fid to string id', () => {
    const user = createStreamUser({ fid: 42, displayName: 'Alice', username: 'alice' });
    expect(user.id).toBe('42');
  });

  it('uses displayName as name when present', () => {
    const user = createStreamUser({ fid: 1, displayName: 'Alice Real', username: 'alice' });
    expect(user.name).toBe('Alice Real');
  });

  it('falls back to username when displayName is empty string', () => {
    const user = createStreamUser({ fid: 1, displayName: '', username: 'alice' });
    expect(user.name).toBe('alice');
  });

  it('sets image from pfpUrl when provided', () => {
    const user = createStreamUser({
      fid: 1,
      displayName: 'Alice',
      username: 'alice',
      pfpUrl: 'https://example.com/pfp.png',
    });
    expect(user.image).toBe('https://example.com/pfp.png');
  });

  it('omits image when pfpUrl is null', () => {
    const user = createStreamUser({ fid: 1, displayName: 'Alice', username: 'alice', pfpUrl: null });
    expect(user.image).toBeUndefined();
  });

  it('omits image when pfpUrl is not provided', () => {
    const user = createStreamUser({ fid: 1, displayName: 'Alice', username: 'alice' });
    expect(user.image).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// createGuestUser
// ---------------------------------------------------------------------------

describe('createGuestUser', () => {
  it('returns type: guest', () => {
    expect(createGuestUser().type).toBe('guest');
  });

  it('returns name: "Guest Listener"', () => {
    expect(createGuestUser().name).toBe('Guest Listener');
  });

  it('id starts with "guest_"', () => {
    expect(createGuestUser().id).toMatch(/^guest_/);
  });

  it('produces unique ids on successive calls', () => {
    expect(createGuestUser().id).not.toBe(createGuestUser().id);
  });
});
