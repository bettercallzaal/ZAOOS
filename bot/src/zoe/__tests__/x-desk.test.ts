// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  ageWarning,
  buildReplyPrompt,
  fetchXPost,
  loadCard,
  ownRecentPosts,
  parseReplies,
  parseTimelineTexts,
  parseXLink,
  recentUsed,
  recordUsed,
  renderCard,
  REPLY_SYSTEM,
  runDesk,
  X_CHAR_LIMIT,
  XD_CALLBACK,
  xDeskEnabled,
  type FetchImpl,
  type XPost,
} from '../x-desk';
import { VOICE_RULES } from '../posts/drafters';

let tmp: string;
beforeEach(async () => {
  tmp = join(tmpdir(), 'zoe-xdesk-test-' + Math.random().toString(36).slice(2));
  await fs.mkdir(tmp, { recursive: true });
  vi.stubEnv('ZOE_HOME', tmp);
});
afterEach(async () => {
  vi.unstubAllEnvs();
  await fs.rm(tmp, { recursive: true, force: true });
});

// The FxTwitter shape, from a live fetch of /status/20 on 2026-10-09.
const fxBody = (over: Record<string, unknown> = {}) => ({
  code: 200,
  message: 'OK',
  tweet: {
    url: 'https://x.com/jack/status/20',
    id: '20',
    text: 'just setting up my twttr',
    author: { screen_name: 'jack', name: 'jack' },
    replies: 18073,
    likes: 309454,
    created_timestamp: 1142974214,
    ...over,
  },
});

const jsonFetch = (status: number, body: unknown): FetchImpl =>
  (async () => new Response(JSON.stringify(body), { status })) as unknown as FetchImpl;

describe('xDeskEnabled', () => {
  it('is on only for the literal 1', () => {
    expect(xDeskEnabled({ ZOE_X_DESK: '1' })).toBe(true);
    expect(xDeskEnabled({ ZOE_X_DESK: 'true' })).toBe(false);
    expect(xDeskEnabled({})).toBe(false);
  });
});

describe('parseXLink', () => {
  it.each([
    ['https://x.com/someone/status/1234567890', 'someone', '1234567890', ''],
    ['https://twitter.com/Some_One/status/1234567890?s=20 reply to this', 'Some_One', '1234567890', 'reply to this'],
    ['look at https://mobile.x.com/a/status/55555/photo/1 and be funny', 'a', '55555', 'look at and be funny'],
    ['https://www.twitter.com/a/statuses/98765', 'a', '98765', ''],
  ])('%s', (text, handle, id, note) => {
    expect(parseXLink(text)).toEqual({ url: `https://x.com/${handle}/status/${id}`, handle, id, note });
  });

  it('ignores links that are not a post', () => {
    expect(parseXLink('https://x.com/bettercallzaal')).toBeNull();
    expect(parseXLink('https://example.com/a/status/12345')).toBeNull();
    expect(parseXLink('no link here')).toBeNull();
  });
});

describe('fetchXPost', () => {
  it('reads a post', async () => {
    const p = await fetchXPost('20', jsonFetch(200, fxBody()));
    expect(p).toMatchObject({ id: '20', authorHandle: 'jack', text: 'just setting up my twttr', likes: 309454 });
    expect(p?.createdMs).toBe(1142974214 * 1000);
  });

  it.each([
    ['a 404 status', jsonFetch(404, {})],
    ['a non-200 code in the body', jsonFetch(200, { code: 404, message: 'NOT_FOUND' })],
    ['a 200 with empty text', jsonFetch(200, fxBody({ text: '   ' }))],
    ['a malformed body', jsonFetch(200, { code: 200, tweet: { id: 1 } })],
    [
      'a thrown fetch',
      (async () => {
        throw new Error('network');
      }) as unknown as FetchImpl,
    ],
  ])('returns null for %s', async (_label, f) => {
    expect(await fetchXPost('20', f)).toBeNull();
  });
});

const timelineHtml = (tweets: Array<Record<string, unknown>>) =>
  `<html><script id="__NEXT_DATA__" type="application/json">${JSON.stringify({
    props: { pageProps: { timeline: { entries: tweets.map((t) => ({ content: { tweet: t } })) } } },
  })}</script></html>`;

describe('voice examples', () => {
  it('parses the timeline embed and drops reposts', () => {
    const html = timelineHtml([
      { full_text: 'shipped the thing', favorite_count: 4 },
      { full_text: 'RT @other: their words', favorite_count: 90 },
      { text: 'fallback field', favorite_count: 1 },
    ]);
    expect(parseTimelineTexts(html)).toEqual([
      { text: 'shipped the thing', likes: 4 },
      { text: 'fallback field', likes: 1 },
    ]);
    expect(parseTimelineTexts('Rate limit exceeded')).toEqual([]);
  });

  it('caches for a day, and falls back to the stale cache on a 429', async () => {
    const now = Date.parse('2026-10-09T12:00:00Z');
    const ok = (async () =>
      new Response(timelineHtml([{ full_text: 'low', favorite_count: 1 }, { full_text: 'high', favorite_count: 9 }]), {
        status: 200,
      })) as unknown as FetchImpl;
    expect(await ownRecentPosts(8, ok, now)).toEqual(['high', 'low']);
    // Measured 2026-10-09: the feed answered "Rate limit exceeded" with 429.
    const limited = vi.fn(async () => new Response('Rate limit exceeded', { status: 429 })) as unknown as FetchImpl;
    expect(await ownRecentPosts(8, limited, now + 60_000)).toEqual(['high', 'low']);
    expect(limited).not.toHaveBeenCalled(); // inside the cache window
    expect(await ownRecentPosts(8, limited, now + 2 * 24 * 60 * 60 * 1000)).toEqual(['high', 'low']);
    expect(limited).toHaveBeenCalledTimes(1);
  });

  it('returns nothing with no cache and a rate-limited feed', async () => {
    const limited = (async () => new Response('Rate limit exceeded', { status: 429 })) as unknown as FetchImpl;
    expect(await ownRecentPosts(8, limited)).toEqual([]);
  });

  it('records used drafts and returns them newest first', async () => {
    await recordUsed('1', 'first');
    await recordUsed('2', 'second');
    expect(await recentUsed()).toEqual(['second', 'first']);
  });
});

describe('drafting', () => {
  it('the reply system prompt carries the shared voice rules and no retired name', () => {
    expect(REPLY_SYSTEM).toContain(VOICE_RULES);
    expect(REPLY_SYSTEM).toContain('Do not start with "ZM."');
    expect(VOICE_RULES).not.toMatch(/\bSANG\b/);
  });

  it('the prompt includes the post, the steer, used replies and own posts', () => {
    const post: XPost = {
      id: '1',
      url: 'u',
      text: 'what is the best music dao',
      authorHandle: 'a',
      authorName: 'A',
      createdMs: null,
      replies: 0,
      likes: 0,
    };
    const p = buildReplyPrompt(post, 'mention ZAOstock', ['a used reply'], ['an own post']);
    expect(p).toContain('POST by @a (A):');
    expect(p).toContain("ZAAL'S STEER: mention ZAOstock");
    expect(p).toContain('- a used reply');
    expect(p).toContain('- an own post');
  });

  it('parses replies, tolerating fences, and cleans them', () => {
    const raw = 'here you go\n```json\n{"replies": ["one \u2014 two", "one - two", "' + 'x'.repeat(X_CHAR_LIMIT + 1) + '", "three", "four", "five"]}\n```';
    expect(parseReplies(raw)).toEqual(['one - two', 'three', 'four']);
    expect(parseReplies('not json')).toEqual([]);
    expect(parseReplies('{"replies": []}')).toEqual([]);
  });
});

describe('the card', () => {
  const card = {
    postId: '1234567890123456789',
    url: 'https://x.com/a/status/1234567890123456789',
    author: 'a',
    postText: 'a post',
    note: '',
    drafts: ['d1', 'd2', 'd3'],
    createdMs: Date.parse('2026-10-09T00:00:00Z'),
    at: '2026-10-09T01:00:00Z',
  };

  it('has Copy, I used, and Open / Redo / Skip rows that fit Telegram limits', () => {
    const { text, keyboard } = renderCard(card, Date.parse('2026-10-09T02:00:00Z'));
    expect(text).toContain('1. d1');
    expect(text).toContain('(2/280)');
    expect(text).not.toContain('Heads up');
    expect(keyboard[0]).toEqual([
      { text: 'Copy 1', copy_text: { text: 'd1' } },
      { text: 'Copy 2', copy_text: { text: 'd2' } },
      { text: 'Copy 3', copy_text: { text: 'd3' } },
    ]);
    for (const b of [...keyboard[1], ...keyboard[2]]) {
      if ('callback_data' in b) {
        expect(Buffer.byteLength(b.callback_data, 'utf8')).toBeLessThanOrEqual(64);
        expect(XD_CALLBACK.test(b.callback_data)).toBe(true);
      }
    }
    expect(keyboard[2][0]).toEqual({ text: 'Open post', url: card.url });
  });

  it('warns when the post is older than the 48-hour ranking window', () => {
    const now = Date.parse('2026-10-12T00:00:00Z');
    expect(ageWarning(card.createdMs, now)).toContain('3 days old');
    expect(ageWarning(null, now)).toBe('');
    expect(renderCard(card, now).text).toContain('X stops ranking posts after 48 hours');
  });

  it('the callback pattern parses each action', () => {
    expect(XD_CALLBACK.exec('xd:used:2:1234567890')?.slice(1, 4)).toEqual(['used', '2', '1234567890']);
    expect(XD_CALLBACK.exec('xd:redo:1234567890')?.slice(1, 4)).toEqual(['redo', undefined, '1234567890']);
    expect(XD_CALLBACK.test('xd:used:4:1234567890')).toBe(false);
    expect(XD_CALLBACK.test('xd:post:1234567890')).toBe(false);
  });
});

describe('runDesk', () => {
  const link = parseXLink('https://x.com/jack/status/20 be brief')!;
  const limited = (async (url: string) =>
    String(url).includes('syndication')
      ? new Response('Rate limit exceeded', { status: 429 })
      : new Response(JSON.stringify(fxBody()), { status: 200 })) as unknown as FetchImpl;

  it('reads, drafts, saves the card, and passes the steer to the model', async () => {
    const draft = vi.fn(async (_system: string, _prompt: string) => '{"replies": ["a", "b", "c"]}');
    const r = await runDesk(link, { fetchImpl: limited, draft, now: () => Date.parse('2026-10-09T12:00:00Z') });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.card.drafts).toEqual(['a', 'b', 'c']);
    expect(draft.mock.calls[0][0]).toBe(REPLY_SYSTEM);
    expect(draft.mock.calls[0][1]).toContain("ZAAL'S STEER: be brief");
    expect(await loadCard('20')).toMatchObject({ postId: '20', drafts: ['a', 'b', 'c'] });
  });

  it('says plainly when the post cannot be read, and never calls the model', async () => {
    const draft = vi.fn(async () => '{"replies": ["a"]}');
    const r = await runDesk(link, { fetchImpl: jsonFetch(404, {}), draft });
    expect(r).toMatchObject({ ok: false, reason: 'unreadable' });
    expect(draft).not.toHaveBeenCalled();
  });

  it('reports empty drafts instead of sending an empty card, including a thrown model call', async () => {
    expect(await runDesk(link, { fetchImpl: limited, draft: async () => 'nope' })).toMatchObject({
      ok: false,
      reason: 'no-drafts',
    });
    expect(
      await runDesk(link, {
        fetchImpl: limited,
        draft: async () => {
          throw new Error('cap');
        },
      }),
    ).toMatchObject({ ok: false, reason: 'no-drafts' });
  });

  it('loadCard refuses a non-numeric id (no path escape)', async () => {
    expect(await loadCard('../secrets')).toBeNull();
  });
});

describe('the DM gate (claimXLink) and its wiring in index.ts', () => {
  const LINK = 'https://x.com/someone/status/1234567890';
  const idle = { pendingArmed: false, whyArmed: false };

  it('flag unset: a pasted X link is NOT claimed, so it takes the pre-desk path', async () => {
    const { claimXLink } = await import('../x-desk');
    expect(claimXLink(LINK, idle, {})).toBeNull();
    expect(claimXLink(`${LINK} reply to this`, idle, { ZOE_X_DESK: 'true' })).toBeNull();
  });

  it('flag on: claimed, unless a pending answer or an Add-a-why reply is armed', async () => {
    const { claimXLink } = await import('../x-desk');
    const on = { ZOE_X_DESK: '1' };
    expect(claimXLink(LINK, idle, on)?.id).toBe('1234567890');
    expect(claimXLink(LINK, { pendingArmed: true, whyArmed: false }, on)).toBeNull();
    expect(claimXLink(LINK, { pendingArmed: false, whyArmed: true }, on)).toBeNull();
    expect(claimXLink('no link at all', idle, on)).toBeNull();
  });

  // index.ts cannot be imported in a test (it boots a live poller), so the
  // wiring is pinned in its source, the same way swallow-registry does it.
  const src = readFileSync(fileURLToPath(new URL('../index.ts', import.meta.url)), 'utf8');

  it('the DM branch goes through claimXLink, with the pending state read correctly', () => {
    const at = src.indexOf('const xLink = claimXLink(text, {');
    expect(at).toBeGreaterThan(-1);
    const call = src.slice(at, at + 400);
    // getPending returns undefined when idle: a `!== null` check would read
    // "armed" forever and the desk would never fire.
    expect(call).toContain("pendingArmed: Boolean(getPending('private'))");
    expect(call).toContain('whyArmed: pendingWhyReplies.has(dmChatId)');
  });

  it('the branch sits after the pending block and before the generic handlers', () => {
    const claim = src.indexOf('const xLink = claimXLink(text, {');
    const pendingBlock = src.indexOf("const pending = getPending('private');");
    const nudgeToggle = src.indexOf('const nudgeToggle = /^(stop|pause|disable)');
    const concierge = src.indexOf("await dispatchConcierge(ctx, text, 'private'");
    expect(pendingBlock).toBeGreaterThan(-1);
    expect(claim).toBeGreaterThan(pendingBlock);
    expect(claim).toBeLessThan(nudgeToggle);
    expect(concierge === -1 || claim < concierge).toBe(true);
  });

  it('no other DM path can start the desk: sendXDeskCard runs only from the gate and the Redo button', () => {
    const calls = src.split('sendXDeskCard(').length - 1;
    // the definition + the gated DM call + the Redo callback
    expect(calls).toBe(3);
    expect(src).not.toMatch(/\bparseXLink\(/);
  });
});
