// @vitest-environment node
//
// POST on a draft card, wired to the real publish path behind a flag.
//
// Doc 2244 (2026-08-07) root-caused the "POST echoes the text" complaint to
// buttons.ts: the approve branch marked the draft approved and RESENT the bare
// text as a copy-target. Working as written, not what a button labelled POST
// implies. The orchestrator route /api/publish/compose shipped in #2946 and
// was proven deployed (401 unauthenticated, 2026-08-20), but nothing in ZOE
// called it. These are the red controls for the wiring:
//
//   flag unset  -> exactly today's behaviour: text resent, fetch never called
//   flag set    -> compose called ONCE with the draft text and dryRun:false,
//                  and the text is NOT resent as a copy-target
//   flag set, compose fails -> the copy-target resend still happens, plus the
//                  error, so a failed publish never loses the draft
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockAppendFile = vi.hoisted(() => vi.fn());
const mockMkdir = vi.hoisted(() => vi.fn());
const mockLoadPending = vi.hoisted(() => vi.fn());
const mockSavePending = vi.hoisted(() => vi.fn());
const mockClearPending = vi.hoisted(() => vi.fn());
const mockFeatureRan = vi.hoisted(() => vi.fn());

vi.mock('../../memory', () => ({ ZOE_PATHS: { home: '/tmp/zoe-post-publish-test' } }));
vi.mock('../../feature-ran', () => ({ featureRan: mockFeatureRan }));
vi.mock('../drafters', () => ({ draftPost: vi.fn() }));
vi.mock('../sources', () => ({
  gatherBuildSignals: vi.fn(),
  gatherEcosystemSignals: vi.fn(),
  gatherEventSignals: vi.fn(),
  gatherPersonalSignals: vi.fn(),
}));
vi.mock('../pending', () => ({
  loadPending: mockLoadPending,
  savePending: mockSavePending,
  clearPending: mockClearPending,
  newPendingId: (c: string) => `id-${c}`,
}));
vi.mock('node:fs', () => ({
  promises: { appendFile: mockAppendFile, mkdir: mockMkdir, writeFile: vi.fn(), readFile: vi.fn(), unlink: vi.fn() },
}));

import { handlePostCallback } from '../buttons';
import { isPostPublishEnabled, publishApprovedDraft } from '../publish';

const DRAFT = {
  id: 'id-build',
  category: 'build' as const,
  text: 'ZM shipped the thing',
  createdAt: '2026-10-07T12:00:00.000Z',
  lastSentAt: '2026-10-07T12:00:00.000Z',
  messageId: 7,
  resendCount: 0,
  state: 'pending' as const,
};

function makeCtx() {
  const sendMessage = vi.fn().mockResolvedValue({ message_id: 9 });
  const ctx = {
    callbackQuery: { data: 'post-approve:id-build' },
    answerCallbackQuery: vi.fn().mockResolvedValue(true),
    editMessageReplyMarkup: vi.fn().mockResolvedValue(true),
    api: { sendMessage },
  };
  return { ctx, sendMessage };
}

const SAVED_ENV = { ...process.env };

describe('POST button -> /api/publish/compose (flag ZOE_POST_PUBLISH)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadPending.mockResolvedValue({ ...DRAFT });
    delete process.env.ZOE_POST_PUBLISH;
    delete process.env.ZOE_PUBLISH_BEARER;
    delete process.env.ZOE_PUBLISH_URL;
    delete process.env.ZOE_PUBLISH_PLATFORMS;
  });
  afterEach(() => {
    process.env = { ...SAVED_ENV };
  });

  it('flag unset: isPostPublishEnabled is false and the approve branch resends the text, never fetches', async () => {
    const fetchImpl = vi.fn();
    expect(isPostPublishEnabled()).toBe(false);
    const { ctx, sendMessage } = makeCtx();
    await handlePostCallback({ ctx: ctx as never, repoDir: '/tmp/repo', zaalTgId: 1, fetchImpl });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith(1, DRAFT.text);
    expect(ctx.answerCallbackQuery).toHaveBeenCalledWith('approved - paste it');
  });

  it('flag set but no bearer: refuses to publish and falls back to the copy-target, says why', async () => {
    process.env.ZOE_POST_PUBLISH = '1';
    const fetchImpl = vi.fn();
    const { ctx, sendMessage } = makeCtx();
    await handlePostCallback({ ctx: ctx as never, repoDir: '/tmp/repo', zaalTgId: 1, fetchImpl });
    expect(fetchImpl).not.toHaveBeenCalled();
    const texts = sendMessage.mock.calls.map((c) => String(c[1]));
    expect(texts).toContain(DRAFT.text);
    expect(texts.some((t) => /ZOE_PUBLISH_BEARER/.test(t))).toBe(true);
  });

  it('flag set with bearer: calls compose once with the text, dryRun:false, default platforms farcaster+x, and does NOT resend the text', async () => {
    process.env.ZOE_POST_PUBLISH = '1';
    process.env.ZOE_PUBLISH_BEARER = 'a'.repeat(40);
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        dryRun: false,
        results: [
          { platform: 'farcaster', ok: true, detail: 'cast 0xabc', simulated: false },
          { platform: 'x', ok: true, detail: 'https://x.com/p/1', simulated: false },
        ],
      }),
    });
    const { ctx, sendMessage } = makeCtx();
    await handlePostCallback({ ctx: ctx as never, repoDir: '/tmp/repo', zaalTgId: 1, fetchImpl });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://zaoos.com/api/publish/compose');
    expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${'a'.repeat(40)}`);
    const body = JSON.parse(String(init.body));
    expect(body).toEqual({ text: DRAFT.text, platforms: ['farcaster', 'x'], dryRun: false });

    const texts = sendMessage.mock.calls.map((c) => String(c[1]));
    expect(texts).not.toContain(DRAFT.text);
    expect(texts.some((t) => /farcaster: cast 0xabc/.test(t) && /x: https:\/\/x\.com\/p\/1/.test(t))).toBe(true);
    expect(mockFeatureRan).toHaveBeenCalledWith('post-publish', expect.any(String));
    const events = mockAppendFile.mock.calls.map((c) => JSON.parse(String(c[1])).event);
    expect(events).toContain('published');
  });

  it('flag set, compose returns 400 (too long): the copy-target resend still happens and the detail is relayed', async () => {
    process.env.ZOE_POST_PUBLISH = '1';
    process.env.ZOE_PUBLISH_BEARER = 'b'.repeat(40);
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Text too long for selected platforms', details: ['x: 301/280'] }),
    });
    const { ctx, sendMessage } = makeCtx();
    await handlePostCallback({ ctx: ctx as never, repoDir: '/tmp/repo', zaalTgId: 1, fetchImpl });
    const texts = sendMessage.mock.calls.map((c) => String(c[1]));
    expect(texts).toContain(DRAFT.text);
    expect(texts.some((t) => /x: 301\/280/.test(t))).toBe(true);
    expect(mockFeatureRan).not.toHaveBeenCalled();
    const events = mockAppendFile.mock.calls.map((c) => JSON.parse(String(c[1])).event);
    expect(events).toContain('publish-error');
  });

  it('ZOE_PUBLISH_PLATFORMS and ZOE_PUBLISH_URL override the defaults; unknown platforms are dropped', async () => {
    process.env.ZOE_POST_PUBLISH = '1';
    process.env.ZOE_PUBLISH_BEARER = 'c'.repeat(40);
    process.env.ZOE_PUBLISH_URL = 'https://example.test/api/publish/compose';
    process.env.ZOE_PUBLISH_PLATFORMS = 'farcaster, bluesky, myspace';
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          results: [
            { platform: 'farcaster', ok: true, detail: 'cast 0x1', simulated: false },
            { platform: 'bluesky', ok: true, detail: 'https://bsky/p/1', simulated: false },
          ],
        },
      }),
    });
    const r = await publishApprovedDraft({ text: 'hi', fetchImpl });
    expect(r.ok).toBe(true);
    expect(r.summary).toContain('bluesky: https://bsky/p/1');
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://example.test/api/publish/compose');
    expect(JSON.parse(String(init.body)).platforms).toEqual(['farcaster', 'bluesky']);
  });

  it('a 200 with zero outcomes is NOT a success (nothing was proven published)', async () => {
    process.env.ZOE_POST_PUBLISH = '1';
    process.env.ZOE_PUBLISH_BEARER = 'e'.repeat(40);
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: { results: [] } }) });
    const r = await publishApprovedDraft({ text: 'hi', fetchImpl });
    expect(r.ok).toBe(false);
  });

  it('partial success (cast live, X failed): says so by platform and does NOT resend the text', async () => {
    process.env.ZOE_POST_PUBLISH = '1';
    process.env.ZOE_PUBLISH_BEARER = 'f'.repeat(40);
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: false,
        data: {
          results: [
            { platform: 'farcaster', ok: true, detail: 'cast 0xlive', simulated: false },
            { platform: 'x', ok: false, detail: 'rate limited', simulated: false },
          ],
        },
      }),
    });
    const { ctx, sendMessage } = makeCtx();
    await handlePostCallback({ ctx: ctx as never, repoDir: '/tmp/repo', zaalTgId: 1, fetchImpl });
    const texts = sendMessage.mock.calls.map((c) => String(c[1]));
    expect(texts).not.toContain(DRAFT.text);
    expect(texts.some((t) => /Partly published/.test(t) && /x: FAILED rate limited/.test(t))).toBe(true);
    expect(mockFeatureRan).not.toHaveBeenCalled();
  });

  it('two taps on POST in the same tick publish ONCE (the second is "already handled")', async () => {
    process.env.ZOE_POST_PUBLISH = '1';
    process.env.ZOE_PUBLISH_BEARER = 'g'.repeat(40);
    mockLoadPending.mockResolvedValue({ ...DRAFT, id: 'id-double' });
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: { results: [{ platform: 'farcaster', ok: true, detail: 'cast 0x2', simulated: false }] } }),
    });
    const a = makeCtx();
    const b = makeCtx();
    a.ctx.callbackQuery.data = 'post-approve:id-double';
    b.ctx.callbackQuery.data = 'post-approve:id-double';
    await Promise.all([
      handlePostCallback({ ctx: a.ctx as never, repoDir: '/tmp/repo', zaalTgId: 1, fetchImpl }),
      handlePostCallback({ ctx: b.ctx as never, repoDir: '/tmp/repo', zaalTgId: 1, fetchImpl }),
    ]);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const answers = [...a.ctx.answerCallbackQuery.mock.calls, ...b.ctx.answerCallbackQuery.mock.calls].map((c) => c[0]);
    expect(answers).toContain('already handled');
  });

  it('a thrown fetch (network down) is an error outcome, not an exception out of the button handler', async () => {
    process.env.ZOE_POST_PUBLISH = '1';
    process.env.ZOE_PUBLISH_BEARER = 'd'.repeat(40);
    const fetchImpl = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    const { ctx, sendMessage } = makeCtx();
    await expect(
      handlePostCallback({ ctx: ctx as never, repoDir: '/tmp/repo', zaalTgId: 1, fetchImpl }),
    ).resolves.toBeUndefined();
    const texts = sendMessage.mock.calls.map((c) => String(c[1]));
    expect(texts).toContain(DRAFT.text);
    expect(texts.some((t) => /ECONNREFUSED/.test(t))).toBe(true);
  });
});
