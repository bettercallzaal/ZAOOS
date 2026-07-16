import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeGetRequest } from '@/test-utils/api-helpers';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET } from '../route';

describe('GET /api/music/frame', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 with HTML content-type on success', async () => {
    const res = await GET(
      makeGetRequest('/api/music/frame', {
        track: 'Midnight Dreams',
        artist: 'Neon Waves',
      }),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/html; charset=utf-8');
  });

  it('returns HTML document with Farcaster frame meta tags', async () => {
    const res = await GET(
      makeGetRequest('/api/music/frame', {
        track: 'Midnight Dreams',
        artist: 'Neon Waves',
      }),
    );

    const html = await res.text();

    // Assert Farcaster frame v2 tags
    expect(html).toContain('<meta property="fc:frame" content="vNext"/>');
    expect(html).toContain('<meta property="fc:frame:image:aspect_ratio" content="1.91:1"/>');
    expect(html).toContain('<meta property="fc:frame:button:1" content="Listen on ZAO"/>');
    expect(html).toContain('<meta property="fc:frame:button:1:action" content="link"/>');
    expect(html).toContain('<meta property="fc:frame:button:2" content="View Artist"/>');
    expect(html).toContain('<meta property="fc:frame:button:2:action" content="link"/>');
  });

  it('includes Open Graph meta tags in HTML', async () => {
    const res = await GET(
      makeGetRequest('/api/music/frame', {
        track: 'Midnight Dreams',
        artist: 'Neon Waves',
      }),
    );

    const html = await res.text();

    expect(html).toContain('<meta property="og:title"');
    expect(html).toContain('<meta property="og:description"');
    expect(html).toContain('<meta property="og:image"');
    expect(html).toContain('<meta property="og:image:width" content="1200"/>');
    expect(html).toContain('<meta property="og:image:height" content="630"/>');
    expect(html).toContain('<meta property="og:type" content="music.song"/>');
  });

  it('includes Twitter Card meta tags in HTML', async () => {
    const res = await GET(
      makeGetRequest('/api/music/frame', {
        track: 'Midnight Dreams',
        artist: 'Neon Waves',
      }),
    );

    const html = await res.text();

    expect(html).toContain('<meta name="twitter:card" content="summary_large_image"/>');
    expect(html).toContain('<meta name="twitter:title"');
    expect(html).toContain('<meta name="twitter:description"');
    expect(html).toContain('<meta name="twitter:image"');
  });

  it('escapes HTML special characters in track and artist names', async () => {
    const res = await GET(
      makeGetRequest('/api/music/frame', {
        track: 'Song <with> "quotes" & ampersands',
        artist: "Artist's Name",
      }),
    );

    const html = await res.text();

    expect(html).toContain('&lt;');
    expect(html).toContain('&gt;');
    expect(html).toContain('&quot;');
    expect(html).toContain('&amp;');
    expect(html).toContain('&#039;');

    // Track and artist should appear escaped in HTML title and content
    expect(html).toContain('Song &lt;with&gt; &quot;quotes&quot; &amp; ampersands');
  });

  it('constructs share-card image URL with query params', async () => {
    const res = await GET(
      makeGetRequest('/api/music/frame', {
        track: 'Test Track',
        artist: 'Test Artist',
        filter: 'blur',
      }),
    );

    const html = await res.text();

    // Image URL should include track, artist, and filter params (+ is URL encoding for space, &amp; is HTML-escaped &)
    expect(html).toContain(
      '/api/music/share-card?track=Test+Track&amp;artist=Test+Artist&amp;filter=blur',
    );
  });

  it('uses custom URL when provided via url param', async () => {
    const customUrl = 'https://custom.example.com/player';
    const res = await GET(
      makeGetRequest('/api/music/frame', {
        track: 'Test Track',
        artist: 'Test Artist',
        url: customUrl,
      }),
    );

    const html = await res.text();

    // Button target should be the custom URL, properly escaped
    expect(html).toContain(`fc:frame:button:1:target" content="${customUrl}"`);
  });

  it('defaults to /music when url param is not provided', async () => {
    const res = await GET(
      makeGetRequest('/api/music/frame', {
        track: 'Test Track',
        artist: 'Test Artist',
      }),
    );

    const html = await res.text();

    // Button target should default to /music
    expect(html).toContain('fc:frame:button:1:target" content="http://localhost:3000/music"');
  });

  it('includes artwork URL in share-card image when provided', async () => {
    const artworkUrl = 'https://example.com/artwork.jpg';
    const res = await GET(
      makeGetRequest('/api/music/frame', {
        track: 'Test Track',
        artist: 'Test Artist',
        artwork: artworkUrl,
      }),
    );

    const html = await res.text();

    // Share-card URL should include artwork param
    expect(html).toContain(`artwork=${encodeURIComponent(artworkUrl)}`);
  });

  it('returns 400 with text/plain when track param is missing', async () => {
    const res = await GET(makeGetRequest('/api/music/frame', { artist: 'Test Artist' }));

    expect(res.status).toBe(400);
    expect(res.headers.get('Content-Type')).toBe('text/plain');
    const body = await res.text();
    expect(body).toContain('Bad request');
  });

  it('returns 400 with text/plain when artist param is missing', async () => {
    const res = await GET(makeGetRequest('/api/music/frame', { track: 'Test Track' }));

    expect(res.status).toBe(400);
    expect(res.headers.get('Content-Type')).toBe('text/plain');
    const body = await res.text();
    expect(body).toContain('Bad request');
  });

  it('returns 400 when track is empty string', async () => {
    const res = await GET(
      makeGetRequest('/api/music/frame', {
        track: '',
        artist: 'Test Artist',
      }),
    );

    expect(res.status).toBe(400);
    const body = await res.text();
    expect(body).toContain('Bad request');
  });

  it('returns 400 when artist is empty string', async () => {
    const res = await GET(
      makeGetRequest('/api/music/frame', {
        track: 'Test Track',
        artist: '',
      }),
    );

    expect(res.status).toBe(400);
    const body = await res.text();
    expect(body).toContain('Bad request');
  });

  it('returns 400 when track exceeds max length (200 chars)', async () => {
    const longTrack = 'A'.repeat(201);
    const res = await GET(
      makeGetRequest('/api/music/frame', {
        track: longTrack,
        artist: 'Test Artist',
      }),
    );

    expect(res.status).toBe(400);
  });

  it('returns 400 when artist exceeds max length (200 chars)', async () => {
    const longArtist = 'A'.repeat(201);
    const res = await GET(
      makeGetRequest('/api/music/frame', {
        track: 'Test Track',
        artist: longArtist,
      }),
    );

    expect(res.status).toBe(400);
  });

  it('returns 400 when filter exceeds max length (50 chars)', async () => {
    const longFilter = 'A'.repeat(51);
    const res = await GET(
      makeGetRequest('/api/music/frame', {
        track: 'Test Track',
        artist: 'Test Artist',
        filter: longFilter,
      }),
    );

    expect(res.status).toBe(400);
  });

  it('returns 400 when artwork is not a valid URL', async () => {
    const res = await GET(
      makeGetRequest('/api/music/frame', {
        track: 'Test Track',
        artist: 'Test Artist',
        artwork: 'not-a-url',
      }),
    );

    expect(res.status).toBe(400);
  });

  it('returns 400 when url is not a valid URL', async () => {
    const res = await GET(
      makeGetRequest('/api/music/frame', {
        track: 'Test Track',
        artist: 'Test Artist',
        url: 'not-a-valid-url',
      }),
    );

    expect(res.status).toBe(400);
  });

  it('includes Cache-Control headers for public caching', async () => {
    const res = await GET(
      makeGetRequest('/api/music/frame', {
        track: 'Test Track',
        artist: 'Test Artist',
      }),
    );

    expect(res.headers.get('Cache-Control')).toBe('public, max-age=3600, s-maxage=86400');
  });

  it('includes track and artist in page title', async () => {
    const res = await GET(
      makeGetRequest('/api/music/frame', {
        track: 'Midnight Dreams',
        artist: 'Neon Waves',
      }),
    );

    const html = await res.text();

    expect(html).toContain('<title>Midnight Dreams by Neon Waves | THE ZAO</title>');
  });

  it('includes visible body content with track and artist info', async () => {
    const res = await GET(
      makeGetRequest('/api/music/frame', {
        track: 'Test Track',
        artist: 'Test Artist',
      }),
    );

    const html = await res.text();

    // Check for body content (h1 with track, p with artist, link button)
    expect(html).toContain('<h1');
    expect(html).toContain('Test Track');
    expect(html).toContain('<p');
    expect(html).toContain('Test Artist');
    expect(html).toContain('Listen on THE ZAO');
  });

  it('is publicly accessible (no auth guard present)', async () => {
    // Frame route should not require authentication — no getSessionData call
    const res = await GET(
      makeGetRequest('/api/music/frame', {
        track: 'Test Track',
        artist: 'Test Artist',
      }),
    );

    // Should return 200, not 401
    expect(res.status).toBe(200);
  });

  it('includes DOCTYPE and proper HTML structure', async () => {
    const res = await GET(
      makeGetRequest('/api/music/frame', {
        track: 'Test Track',
        artist: 'Test Artist',
      }),
    );

    const html = await res.text();

    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain('<html>');
    expect(html).toContain('</html>');
    expect(html).toContain('<head>');
    expect(html).toContain('</head>');
    expect(html).toContain('<body');
    expect(html).toContain('</body>');
  });
});
