// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InlineKeyboard } from 'grammy';
import type { Context } from 'grammy';

import { cmdBoard } from '../miniapp';

function makeCtx(): { ctx: Context; reply: ReturnType<typeof vi.fn> } {
  const reply = vi.fn().mockResolvedValue(undefined);
  const ctx = { reply } as unknown as Context;
  return { ctx, reply };
}

afterEach(() => {
  vi.clearAllMocks();
  delete process.env.BOARD_MINI_URL;
});

// ── BOARD_MINI_URL unset ──────────────────────────────────────────────────────

describe('cmdBoard — BOARD_MINI_URL not set', () => {
  it('replies with a plain text fallback link', async () => {
    const { ctx, reply } = makeCtx();
    await cmdBoard(ctx);
    expect(reply).toHaveBeenCalledOnce();
    const [text] = reply.mock.calls[0];
    expect(text).toContain('thezao.xyz/board');
    expect(text).not.toContain('BOARD_MINI_URL'); // instruction string shouldn't leak
  });

  it('does not include reply_markup in the fallback reply', async () => {
    const { ctx, reply } = makeCtx();
    await cmdBoard(ctx);
    const args = reply.mock.calls[0];
    // fallback is a text-only reply — no second options arg with reply_markup
    expect(args.length).toBe(1);
  });

  it('treats an empty BOARD_MINI_URL as unset (falls back to plain text)', async () => {
    process.env.BOARD_MINI_URL = '';
    const { ctx, reply } = makeCtx();
    await cmdBoard(ctx);
    const args = reply.mock.calls[0];
    expect(args.length).toBe(1);
  });

  it('treats a whitespace-only BOARD_MINI_URL as unset', async () => {
    process.env.BOARD_MINI_URL = '   ';
    const { ctx, reply } = makeCtx();
    await cmdBoard(ctx);
    const args = reply.mock.calls[0];
    expect(args.length).toBe(1);
  });
});

// ── BOARD_MINI_URL set ────────────────────────────────────────────────────────

describe('cmdBoard — BOARD_MINI_URL set', () => {
  const TEST_URL = 'https://thezao.xyz/board/mini';

  beforeEach(() => {
    process.env.BOARD_MINI_URL = TEST_URL;
  });

  it('replies with an InlineKeyboard containing a webApp button', async () => {
    const { ctx, reply } = makeCtx();
    await cmdBoard(ctx);
    expect(reply).toHaveBeenCalledOnce();
    const [, opts] = reply.mock.calls[0];
    expect(opts).toBeDefined();
    expect(opts.reply_markup).toBeInstanceOf(InlineKeyboard);
  });

  it('webApp button url matches BOARD_MINI_URL', async () => {
    const { ctx, reply } = makeCtx();
    await cmdBoard(ctx);
    const [, opts] = reply.mock.calls[0];
    const kb = opts.reply_markup as InlineKeyboard;
    const rows = kb.inline_keyboard;
    expect(rows.length).toBeGreaterThan(0);
    const firstBtn = rows[0]?.[0];
    expect(firstBtn).toMatchObject({ web_app: { url: TEST_URL } });
  });

  it('webApp button label is "Open Board"', async () => {
    const { ctx, reply } = makeCtx();
    await cmdBoard(ctx);
    const [, opts] = reply.mock.calls[0];
    const kb = opts.reply_markup as InlineKeyboard;
    const firstBtn = kb.inline_keyboard[0]?.[0];
    expect(firstBtn?.text).toBe('Open Board');
  });

  it('reply text mentions the board', async () => {
    const { ctx, reply } = makeCtx();
    await cmdBoard(ctx);
    const [text] = reply.mock.calls[0];
    expect(text).toContain('Board');
  });

  it('trims leading/trailing whitespace from BOARD_MINI_URL', async () => {
    process.env.BOARD_MINI_URL = `  ${TEST_URL}  `;
    const { ctx, reply } = makeCtx();
    await cmdBoard(ctx);
    const [, opts] = reply.mock.calls[0];
    const kb = opts.reply_markup as InlineKeyboard;
    const firstBtn = kb.inline_keyboard[0]?.[0];
    expect(firstBtn).toMatchObject({ web_app: { url: TEST_URL } });
  });
});
