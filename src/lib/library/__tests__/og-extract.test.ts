// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { extractOGMetadata, isUrl } from '../og-extract';

describe('isUrl', () => {
  it('accepts http and https URLs', () => {
    expect(isUrl('https://example.com')).toBe(true);
    expect(isUrl('http://example.com/path?q=1')).toBe(true);
  });

  it('rejects non-URL strings', () => {
    expect(isUrl('not a url')).toBe(false);
    expect(isUrl('')).toBe(false);
    expect(isUrl('ftp://example.com')).toBe(false);
  });

  it('trims whitespace before checking', () => {
    expect(isUrl('  https://example.com  ')).toBe(true);
  });
});

describe('extractOGMetadata — SSRF protection', () => {
  it('blocks localhost', async () => {
    await expect(extractOGMetadata('http://localhost/secret')).resolves.toEqual({
      ogTitle: null,
      ogDescription: null,
      ogImage: null,
    });
  });

  it('blocks 169.254.169.254 (cloud metadata endpoint)', async () => {
    await expect(extractOGMetadata('http://169.254.169.254/latest/meta-data')).resolves.toEqual({
      ogTitle: null,
      ogDescription: null,
      ogImage: null,
    });
  });

  it('blocks 10.x private range', async () => {
    await expect(extractOGMetadata('http://10.0.0.1/internal')).resolves.toEqual({
      ogTitle: null,
      ogDescription: null,
      ogImage: null,
    });
  });

  it('blocks 192.168.x private range', async () => {
    await expect(extractOGMetadata('http://192.168.1.1/admin')).resolves.toEqual({
      ogTitle: null,
      ogDescription: null,
      ogImage: null,
    });
  });

  it('blocks 172.16.x-172.31.x private range', async () => {
    await expect(extractOGMetadata('http://172.16.0.1/data')).resolves.toEqual({
      ogTitle: null,
      ogDescription: null,
      ogImage: null,
    });
  });

  it('blocks 127.0.0.1 loopback', async () => {
    await expect(extractOGMetadata('http://127.0.0.1/secret')).resolves.toEqual({
      ogTitle: null,
      ogDescription: null,
      ogImage: null,
    });
  });
});

describe('extractOGMetadata — tag parsing', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function mockFetch(html: string, ok = true) {
    vi.mocked(fetch).mockResolvedValue({
      ok,
      text: async () => html,
    } as Response);
  }

  it('extracts og:title, og:description, og:image', async () => {
    mockFetch(`<html><head>
      <meta property="og:title" content="Test Title">
      <meta property="og:description" content="A description">
      <meta property="og:image" content="https://example.com/img.png">
    </head></html>`);
    const result = await extractOGMetadata('https://example.com');
    expect(result.ogTitle).toBe('Test Title');
    expect(result.ogDescription).toBe('A description');
    expect(result.ogImage).toBe('https://example.com/img.png');
  });

  it('falls back to twitter: tags when og: is absent', async () => {
    mockFetch(`<html><head>
      <meta name="twitter:title" content="Twitter Title">
      <meta name="twitter:image" content="https://example.com/tw.png">
    </head></html>`);
    const result = await extractOGMetadata('https://example.com');
    expect(result.ogTitle).toBe('Twitter Title');
    expect(result.ogImage).toBe('https://example.com/tw.png');
  });

  it('falls back to <title> when no og/twitter title meta', async () => {
    mockFetch('<html><head><title>Page Title</title></head></html>');
    const result = await extractOGMetadata('https://example.com');
    expect(result.ogTitle).toBe('Page Title');
  });

  it('decodes HTML entities in meta content', async () => {
    mockFetch(
      `<html><head><meta property="og:title" content="Rock &amp; Roll &lt;Live&gt;"></head></html>`,
    );
    const result = await extractOGMetadata('https://example.com');
    expect(result.ogTitle).toBe('Rock & Roll <Live>');
  });

  it('returns empty on non-ok response', async () => {
    mockFetch('', false);
    await expect(extractOGMetadata('https://example.com')).resolves.toEqual({
      ogTitle: null,
      ogDescription: null,
      ogImage: null,
    });
  });

  it('returns empty on fetch network error', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'));
    await expect(extractOGMetadata('https://example.com')).resolves.toEqual({
      ogTitle: null,
      ogDescription: null,
      ogImage: null,
    });
  });
});
