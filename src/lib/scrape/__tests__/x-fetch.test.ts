// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { parseTweetId, fetchXContent, XFetchError, type FetchImpl } from '../x-fetch';

/**
 * Build a fake fetch that returns the given JSON for hosts matched by `routes`.
 * Each route maps a host substring to a { ok, status, json } response.
 */
function fakeFetch(routes: Array<{ host: string; ok?: boolean; status?: number; json?: unknown; throwName?: string }>): FetchImpl {
  return (async (url: string | URL | Request) => {
    const href = typeof url === 'string' ? url : url.toString();
    const route = routes.find((r) => href.includes(r.host));
    if (!route) throw new Error(`no fake route for ${href}`);
    if (route.throwName) {
      const e = new Error('aborted');
      e.name = route.throwName;
      throw e;
    }
    return {
      ok: route.ok ?? true,
      status: route.status ?? 200,
      json: async () => route.json,
    } as Response;
  }) as unknown as FetchImpl;
}

describe('parseTweetId', () => {
  it('accepts a bare numeric id', () => {
    expect(parseTweetId('2067194761446920264')).toBe('2067194761446920264');
  });

  it('extracts id from x.com status url', () => {
    expect(parseTweetId('https://x.com/heynavtoor/status/2067194761446920264?s=46')).toBe(
      '2067194761446920264',
    );
  });

  it('extracts id from twitter.com and mobile variants', () => {
    expect(parseTweetId('https://twitter.com/foo/status/123456789012')).toBe('123456789012');
    expect(parseTweetId('https://mobile.twitter.com/foo/statuses/987654321098')).toBe('987654321098');
  });

  it('returns null for non-tweet input', () => {
    expect(parseTweetId('https://x.com/heynavtoor')).toBeNull();
    expect(parseTweetId('')).toBeNull();
    expect(parseTweetId('not a url')).toBeNull();
  });
});

describe('fetchXContent', () => {
  it('throws XFetchError when id cannot be parsed', async () => {
    await expect(fetchXContent('https://x.com/heynavtoor')).rejects.toBeInstanceOf(XFetchError);
  });

  it('returns a plain tweet from FxTwitter', async () => {
    const fetchImpl = fakeFetch([
      {
        host: 'fxtwitter.com',
        json: {
          tweet: {
            text: 'hello world',
            likes: 12,
            author: { name: 'Nav', screen_name: 'heynavtoor' },
          },
        },
      },
    ]);
    const c = await fetchXContent('123456789012', { fetchImpl });
    expect(c.source).toBe('fxtwitter');
    expect(c.text).toBe('hello world');
    expect(c.authorHandle).toBe('heynavtoor');
    expect(c.likes).toBe(12);
    expect(c.isArticle).toBe(false);
  });

  it('returns a full X Article body from FxTwitter', async () => {
    const fetchImpl = fakeFetch([
      {
        host: 'fxtwitter.com',
        json: {
          tweet: {
            text: '',
            author: { name: 'Nav', screen_name: 'heynavtoor' },
            article: {
              title: 'The Stanford STORM Method',
              content: {
                blocks: [{ text: 'Most people use Claude like a search box.' }, { text: '' }, { text: 'Save this :)' }],
              },
            },
          },
        },
      },
    ]);
    const c = await fetchXContent('123456789012', { fetchImpl });
    expect(c.isArticle).toBe(true);
    expect(c.article?.title).toBe('The Stanford STORM Method');
    expect(c.article?.blocks).toEqual(['Most people use Claude like a search box.', 'Save this :)']);
    expect(c.article?.body).toContain('Save this');
    expect(c.article?.partial).toBe(false);
  });

  it('falls back to syndication when FxTwitter errors, marking article partial', async () => {
    const fetchImpl = fakeFetch([
      { host: 'fxtwitter.com', ok: false, status: 500 },
      {
        host: 'syndication.twimg.com',
        json: {
          text: 'preview tweet',
          favorite_count: 3,
          user: { name: 'Nav', screen_name: 'heynavtoor' },
          article: { title: 'Some Article', preview_text: 'first 200 chars only' },
        },
      },
    ]);
    const c = await fetchXContent('123456789012', { fetchImpl });
    expect(c.source).toBe('syndication');
    expect(c.isArticle).toBe(true);
    expect(c.article?.partial).toBe(true);
    expect(c.article?.blocks).toEqual([]);
    expect(c.article?.body).toBe('first 200 chars only');
  });

  it('throws XFetchError when every tier fails', async () => {
    const fetchImpl = fakeFetch([
      { host: 'fxtwitter.com', ok: false, status: 500 },
      { host: 'syndication.twimg.com', ok: false, status: 404 },
    ]);
    await expect(fetchXContent('123456789012', { fetchImpl })).rejects.toBeInstanceOf(XFetchError);
  });

  it('surfaces a timeout as XFetchError', async () => {
    const fetchImpl = fakeFetch([{ host: 'fxtwitter.com', throwName: 'AbortError' }, { host: 'syndication.twimg.com', throwName: 'AbortError' }]);
    await expect(fetchXContent('123456789012', { fetchImpl, timeoutMs: 5 })).rejects.toBeInstanceOf(
      XFetchError,
    );
  });
});