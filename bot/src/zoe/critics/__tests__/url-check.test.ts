import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyUrlResults, checkUrl, checkUrls, extractUrls, verdictFor, withUrlCheck, type Fetcher } from '../url-check';
import type { CritiqueOutput } from '../types';

const BASE: CritiqueOutput = {
  score: 88, summary: 'solid doc', issues: [], ships_as_is: true,
  model: 'haiku', inputTokens: 1, outputTokens: 1, costUsd: 0, durationMs: 1,
};

/** A fake web: status by URL, or an error code to throw. */
function web(map: Record<string, number | string>): Fetcher {
  return vi.fn(async (url: string) => {
    const v = map[url];
    if (typeof v === 'string') throw Object.assign(new Error('fetch failed'), { cause: { code: v } });
    return { status: v ?? 200 };
  });
}

afterEach(() => vi.unstubAllEnvs());

describe('extractUrls', () => {
  it('finds distinct URLs and trims markdown and sentence punctuation', () => {
    const doc = 'See [x](https://a.example/p). Also https://b.example/q, and https://a.example/p again.\n- https://c.example/wiki/Foo_(bar)';
    expect(extractUrls(doc)).toEqual(['https://a.example/p', 'https://b.example/q', 'https://c.example/wiki/Foo_(bar)']);
  });
  it('caps the count', () => {
    const doc = Array.from({ length: 40 }, (_, i) => `https://x.example/${i}`).join(' ');
    expect(extractUrls(doc)).toHaveLength(25);
  });
});

describe('verdictFor: only a definite absence is dead', () => {
  it.each([
    [200, undefined, 'alive'], [301, undefined, 'alive'],
    [404, undefined, 'dead'], [410, undefined, 'dead'],
    [403, undefined, 'unknown'], [401, undefined, 'unknown'], [429, undefined, 'unknown'], [503, undefined, 'unknown'],
    [null, 'ENOTFOUND', 'dead'], [null, 'TIMEOUT', 'unknown'], [null, 'ECONNRESET', 'unknown'],
  ] as const)('status %s / %s -> %s', (status, code, want) => {
    expect(verdictFor(status, code)).toBe(want);
  });
});

describe('checkUrl / checkUrls', () => {
  it('sends a GET with a browser User-Agent and follows redirects', async () => {
    const f = web({});
    await checkUrl('https://a.example/', f);
    const init = (f as unknown as { mock: { calls: [string, { method: string; redirect: string; headers: Record<string, string> }][] } }).mock.calls[0][1];
    expect(init.method).toBe('GET');
    expect(init.redirect).toBe('follow');
    expect(init.headers['User-Agent']).toContain('Mozilla');
  });
  it('maps an invented host to dead and keeps the order of the input', async () => {
    const r = await checkUrls(['https://ok.example/', 'https://nope.invalid/', 'https://gone.example/'], web({ 'https://nope.invalid/': 'ENOTFOUND', 'https://gone.example/': 404 }));
    expect(r.map((x) => x.verdict)).toEqual(['alive', 'dead', 'dead']);
    expect(r[1].detail).toBe('ENOTFOUND');
  });
});

describe('applyUrlResults', () => {
  it('leaves the critique unchanged when nothing is dead (blocked and unknown never fail a doc)', () => {
    const out = applyUrlResults(BASE, [
      { url: 'https://a.example/', verdict: 'alive', detail: '200' },
      { url: 'https://x.com/p', verdict: 'unknown', detail: '403' },
    ]);
    expect(out).toBe(BASE);
  });
  it('adds a critical issue per dead URL and caps the score under the pass line', () => {
    const out = applyUrlResults(BASE, [{ url: 'https://arxiv.org/abs/9999.99999', verdict: 'dead', detail: '404' }]);
    expect(out.score).toBe(69);
    expect(out.ships_as_is).toBe(false);
    expect(out.issues[0]).toMatchObject({ severity: 'critical', location: 'https://arxiv.org/abs/9999.99999' });
    expect(out.summary).toContain('1 cited URL(s) do not exist');
  });
  it('never raises a score that was already low', () => {
    expect(applyUrlResults({ ...BASE, score: 40 }, [{ url: 'u', verdict: 'dead', detail: '404' }]).score).toBe(40);
  });
});

describe('withUrlCheck', () => {
  const doc = 'Sources: https://real.example/a and https://arxiv.org/abs/9999.99999';
  it('is off without the flag and fetches nothing', async () => {
    const f = web({});
    expect(await withUrlCheck(BASE, doc, f)).toBe(BASE);
    expect(f).not.toHaveBeenCalled();
  });
  it('with ZOE_RESEARCH_URL_CHECK=1 a fabricated citation fails the critique', async () => {
    vi.stubEnv('ZOE_RESEARCH_URL_CHECK', '1');
    const out = await withUrlCheck(BASE, doc, web({ 'https://arxiv.org/abs/9999.99999': 404 }));
    expect(out?.score).toBe(69);
    expect(out?.issues.map((i) => i.location)).toEqual(['https://arxiv.org/abs/9999.99999']);
  });
  it('passes a null critique through', async () => {
    vi.stubEnv('ZOE_RESEARCH_URL_CHECK', '1');
    expect(await withUrlCheck(null, doc, web({}))).toBeNull();
  });
});
