import { beforeEach, describe, expect, it, vi } from 'vitest';

// Ruling 305 (2026-11-07): ZOE does not post to Farcaster. The caster card's approve tap must
// hand the draft back to Zaal as text, and must never publish through FFX or publishCast.

const { executeActionOnFfx, publishCast, ffx } = vi.hoisted(() => ({
  executeActionOnFfx: vi.fn(async () => ({ ok: true })),
  publishCast: vi.fn(async () => ({ hash: '0x01', fid: 1, endpoint: 'x' })),
  ffx: { available: true },
}));

vi.mock('../reason', () => ({
  draftCast: vi.fn(async () => ({ text: 'a drafted cast', model: 'test-model' })),
}));
vi.mock('../../safety/klearu', () => ({
  checkCast: vi.fn(async () => ({ safe: true, label: 'ok', reason: '' })),
}));
vi.mock('../../exec/ffx', () => ({ ffxAvailable: () => ffx.available, executeActionOnFfx }));
vi.mock('../../farcaster/write', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../farcaster/write')>()),
  publishCast,
}));
vi.mock('../../feature-ran', () => ({ featureRan: vi.fn() }));

import { attachCaster, runCasterPipeline } from '../index';

type Handler = (ctx: unknown) => Promise<void>;

function fakeBot() {
  let handler: Handler | undefined;
  const bot = {
    api: { sendMessage: vi.fn(async () => ({ message_id: 7 })) },
    callbackQuery: vi.fn((_re: RegExp, h: Handler) => {
      handler = h;
    }),
  };
  return { bot: bot as never, tap: (ctx: unknown) => handler?.(ctx) };
}

function approveCtx(id: string, fromId = 1) {
  return {
    from: { id: fromId },
    callbackQuery: { data: `cast-approve:${id}` },
    answerCallbackQuery: vi.fn(async () => {}),
    editMessageText: vi.fn(async (_text: string) => {}),
  };
}

const ZAAL = 1;

describe('caster approve tap hands the draft to Zaal (ruling 305)', () => {
  beforeEach(() => {
    executeActionOnFfx.mockClear();
    publishCast.mockClear();
  });

  it.each([
    ['FFX available', true],
    ['FFX unavailable', false],
  ])('never publishes when %s', async (_label, available) => {
    ffx.available = available;
    const { bot, tap } = fakeBot();
    attachCaster(bot, { zaalId: ZAAL });
    const res = await runCasterPipeline(bot, ZAAL, { agentId: 'zol', persona: 'p', context: 'c' });
    expect(res.status).toBe('awaiting_approval');

    const ctx = approveCtx(res.id as string);
    await tap(ctx);

    expect(executeActionOnFfx).not.toHaveBeenCalled();
    expect(publishCast).not.toHaveBeenCalled();
    const text = String(ctx.editMessageText.mock.calls[0]?.[0]);
    expect(text).toContain('a drafted cast');
    expect(text).toContain('ruling 305');
    expect(text).not.toContain('PUBLISHED');
  });

  it('names the cast to reply to on a reply draft', async () => {
    const { bot, tap } = fakeBot();
    attachCaster(bot, { zaalId: ZAAL });
    const hash = `0x${'cd'.repeat(20)}` as `0x${string}`;
    const res = await runCasterPipeline(bot, ZAAL, {
      agentId: 'zol',
      persona: 'p',
      context: 'c',
      parent: { fid: 42, hash },
    });
    const ctx = approveCtx(res.id as string);
    await tap(ctx);
    expect(String(ctx.editMessageText.mock.calls[0]?.[0])).toContain(`Reply to cast ${hash} (fid 42)`);
  });

  it('labels the button "Ready to post", not Approve', async () => {
    const { bot } = fakeBot();
    await runCasterPipeline(bot, ZAAL, { agentId: 'zol', persona: 'p', context: 'c' });
    const opts = (bot as unknown as { api: { sendMessage: { mock: { calls: unknown[][] } } } }).api
      .sendMessage.mock.calls[0][2] as { reply_markup: { inline_keyboard: { text: string }[][] } };
    const labels = opts.reply_markup.inline_keyboard.flat().map((b) => b.text);
    expect(labels).toContain('Ready to post');
    expect(labels).not.toContain('Approve');
  });

  it('still refuses a tap from anyone but Zaal', async () => {
    const { bot, tap } = fakeBot();
    attachCaster(bot, { zaalId: ZAAL });
    const res = await runCasterPipeline(bot, ZAAL, { agentId: 'zol', persona: 'p', context: 'c' });
    const ctx = approveCtx(res.id as string, 999);
    await tap(ctx);
    expect(ctx.answerCallbackQuery).toHaveBeenCalledWith('not authorized');
    expect(ctx.editMessageText).not.toHaveBeenCalled();
  });
});
