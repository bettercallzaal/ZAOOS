// @vitest-environment node
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { resolveMusicLinks, buildUniversalCard, RateLimitError } from '../songlink';

// ── Types ────────────────────────────────────────────────────────────────────

interface SonglinkResponse {
  entityUniqueId: string;
  pageUrl: string;
  entitiesByUniqueId: Record<
    string,
    {
      id: string;
      title?: string;
      artistName?: string;
      thumbnailUrl?: string;
      apiProvider?: string;
      platforms?: string[];
    }
  >;
  linksByPlatform: Record<string, { url: string; entityUniqueId: string }>;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeResponse(overrides = {}): SonglinkResponse {
  return {
    entityUniqueId: 'SPOTIFY::track::123',
    pageUrl: 'https://song.link/test',
    entitiesByUniqueId: {
      'SPOTIFY::track::123': {
        id: '123',
        title: 'Test Song',
        artistName: 'Test Artist',
        thumbnailUrl: 'https://thumb.jpg',
      },
    },
    linksByPlatform: {
      spotify: { url: 'https://spotify.com/track/123', entityUniqueId: 'SPOTIFY::track::123' },
    },
    ...overrides,
  };
}

function mockFetch(status: number, body: unknown) {
  (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

// ── Setup / teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ── resolveMusicLinks ─────────────────────────────────────────────────────────

describe('resolveMusicLinks', () => {
  it('returns parsed response on 200 OK', async () => {
    const response = makeResponse();
    mockFetch(200, response);

    const result = await resolveMusicLinks('https://spotify.com/track/123');

    expect(result).toEqual(response);
  });

  it('throws RateLimitError on HTTP 429', async () => {
    mockFetch(429, {});

    await expect(resolveMusicLinks('https://spotify.com/track/123')).rejects.toSatisfy(
      (err: unknown) =>
        err instanceof RateLimitError && (err as RateLimitError).name === 'RateLimitError',
    );
  });

  it('throws Error with message containing "500" on HTTP 500', async () => {
    mockFetch(500, {});

    await expect(resolveMusicLinks('https://spotify.com/track/123')).rejects.toThrow('500');
  });

  it('encodes the music URL in the query string', async () => {
    const inputUrl = 'https://spotify.com/track/123?si=abc&dl_branch=1';
    mockFetch(200, makeResponse());

    await resolveMusicLinks(inputUrl);

    const calledUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain(encodeURIComponent(inputUrl));
  });

  it('passes User-Agent: ZAO-OS/1.0 header', async () => {
    mockFetch(200, makeResponse());

    await resolveMusicLinks('https://spotify.com/track/123');

    const calledOptions = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit;
    expect((calledOptions.headers as Record<string, string>)['User-Agent']).toBe('ZAO-OS/1.0');
  });
});

// ── buildUniversalCard ────────────────────────────────────────────────────────

describe('buildUniversalCard', () => {
  it('returns title/artist/thumbnail from the primary entity', () => {
    const response = makeResponse();
    const card = buildUniversalCard(response);

    expect(card.title).toBe('Test Song');
    expect(card.artist).toBe('Test Artist');
    expect(card.thumbnail).toBe('https://thumb.jpg');
  });

  it('falls back to scanning all entities when primary entity has no title or thumbnail', () => {
    const response = makeResponse({
      entityUniqueId: 'SPOTIFY::track::123',
      entitiesByUniqueId: {
        // Primary entity exists but lacks title + thumbnail
        'SPOTIFY::track::123': { id: '123', artistName: 'Primary Artist' },
        // Secondary entity has the missing fields
        'APPLE::track::456': {
          id: '456',
          title: 'Fallback Title',
          artistName: 'Fallback Artist',
          thumbnailUrl: 'https://fallback-thumb.jpg',
        },
      },
    });

    const card = buildUniversalCard(response);

    expect(card.title).toBe('Fallback Title');
    // artist comes from primary entity since it has artistName
    expect(card.artist).toBe('Primary Artist');
    expect(card.thumbnail).toBe('https://fallback-thumb.jpg');
  });

  it('returns empty strings when no entity has metadata', () => {
    const response = makeResponse({
      entitiesByUniqueId: {},
    });

    const card = buildUniversalCard(response);

    expect(card.title).toBe('');
    expect(card.artist).toBe('');
    expect(card.thumbnail).toBe('');
  });

  it('ignores non-ZAO platform keys in linksByPlatform', () => {
    const response = makeResponse({
      linksByPlatform: {
        spotify: { url: 'https://spotify.com/track/123', entityUniqueId: 'SPOTIFY::track::123' },
        amazonMusic: { url: 'https://music.amazon.com/track/123', entityUniqueId: 'AMAZON::track::123' },
        deezer: { url: 'https://deezer.com/track/123', entityUniqueId: 'DEEZER::track::123' },
      },
    });

    const card = buildUniversalCard(response);
    const platformKeys = card.platforms.map((p) => p.platform);

    expect(platformKeys).toContain('spotify');
    expect(platformKeys).not.toContain('amazonMusic');
    expect(platformKeys).not.toContain('deezer');
  });

  it('returns platforms in ZAO priority order: audius, spotify, appleMusic', () => {
    const response = makeResponse({
      linksByPlatform: {
        appleMusic: { url: 'https://music.apple.com/track/123', entityUniqueId: 'APPLE::track::123' },
        spotify: { url: 'https://spotify.com/track/123', entityUniqueId: 'SPOTIFY::track::123' },
        audius: { url: 'https://audius.co/track/123', entityUniqueId: 'AUDIUS::track::123' },
      },
    });

    const card = buildUniversalCard(response);
    const platformKeys = card.platforms.map((p) => p.platform);

    expect(platformKeys[0]).toBe('audius');
    expect(platformKeys[1]).toBe('spotify');
    expect(platformKeys[2]).toBe('appleMusic');
  });

  it('returns empty platforms array when none of the ZAO platforms are present', () => {
    const response = makeResponse({
      linksByPlatform: {
        amazonMusic: { url: 'https://music.amazon.com/track/123', entityUniqueId: 'AMAZON::track::123' },
      },
    });

    const card = buildUniversalCard(response);

    expect(card.platforms).toEqual([]);
  });

  it('returns pageUrl from the response', () => {
    const response = makeResponse({ pageUrl: 'https://song.link/my-song' });

    const card = buildUniversalCard(response);

    expect(card.pageUrl).toBe('https://song.link/my-song');
  });
});
