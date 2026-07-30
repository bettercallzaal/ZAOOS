import { describe, it, expect, vi } from 'vitest';
import { chunkForTelegram, sendChunkedToTelegram } from '../tg-chunk';

describe('chunkForTelegram', () => {
  it('returns one chunk when under the limit', () => {
    expect(chunkForTelegram('short')).toEqual(['short']);
  });

  it('splits long text into <=3900-char chunks', () => {
    const text = 'a'.repeat(10000);
    const chunks = chunkForTelegram(text);
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(3900);
    expect(chunks.join('').length).toBe(10000);
  });

  it('prefers paragraph/line boundaries over hard cuts', () => {
    const para = 'x'.repeat(3800);
    const text = `${para}\n\n${para}`;
    const chunks = chunkForTelegram(text);
    expect(chunks.length).toBe(2);
    expect(chunks[0]).toBe(para); // split on the \n\n, not mid-para
  });
});

describe('sendChunkedToTelegram', () => {
  it('sends one message unprefixed when short', async () => {
    const send = vi.fn(async (_c: number, _t: string) => {});
    await sendChunkedToTelegram(send, 42, 'hi');
    expect(send).toHaveBeenCalledExactlyOnceWith(42, 'hi');
  });

  it('sends multiple prefixed messages for long text, in order', async () => {
    const send = vi.fn(async (_c: number, _t: string) => {});
    await sendChunkedToTelegram(send, 42, 'a'.repeat(8000));
    expect(send.mock.calls.length).toBeGreaterThan(1);
    expect(send.mock.calls[0][1]).toMatch(/^\(1\/\d+\) /);
    expect(send.mock.calls.every((c) => (c[1] as string).length <= 3900 + 8)).toBe(true);
  });

  it('one failing chunk does not abort the rest', async () => {
    let n = 0;
    const send = vi.fn(async (_c: number, _t: string) => {
      n += 1;
      if (n === 1) throw new Error('telegram 400');
    });
    await sendChunkedToTelegram(send, 42, 'a'.repeat(8000));
    expect(send.mock.calls.length).toBeGreaterThan(1); // continued past the failure
  });
});

describe('sendChunkedToTelegram - opts, markup placement, return value', () => {
  const longText = `${'A'.repeat(3900)}\n\n${'B'.repeat(2000)}`;

  it('passes baseOpts on every chunk', async () => {
    const calls: Array<{ text: string; opts?: Record<string, unknown> }> = [];
    await sendChunkedToTelegram(
      async (_cid, text, opts) => {
        calls.push({ text, opts });
        return { message_id: calls.length };
      },
      1,
      longText,
      { baseOpts: { message_thread_id: 77 } },
    );
    expect(calls.length).toBeGreaterThan(1);
    for (const c of calls) expect(c.opts?.message_thread_id).toBe(77);
  });

  it("markupOn 'first' puts the keyboard only on chunk 1 (router behavior)", async () => {
    const calls: Array<Record<string, unknown> | undefined> = [];
    await sendChunkedToTelegram(
      async (_cid, _text, opts) => {
        calls.push(opts);
        return { message_id: calls.length };
      },
      1,
      longText,
      { replyMarkup: { inline_keyboard: [] } },
    );
    expect(calls[0]?.reply_markup).toBeDefined();
    for (const c of calls.slice(1)) expect(c?.reply_markup).toBeUndefined();
  });

  it("markupOn 'last' puts the keyboard only on the final chunk and returns THAT message", async () => {
    const calls: Array<Record<string, unknown> | undefined> = [];
    const result = await sendChunkedToTelegram(
      async (_cid, _text, opts) => {
        calls.push(opts);
        return { message_id: calls.length };
      },
      1,
      longText,
      { replyMarkup: { inline_keyboard: [] }, markupOn: 'last' },
    );
    expect(calls[calls.length - 1]?.reply_markup).toBeDefined();
    for (const c of calls.slice(0, -1)) expect(c?.reply_markup).toBeUndefined();
    expect((result as { message_id: number }).message_id).toBe(calls.length);
  });

  it('short text sends once with no prefix and returns the message', async () => {
    const calls: string[] = [];
    const result = await sendChunkedToTelegram(
      async (_cid, text) => {
        calls.push(text);
        return { message_id: 42 };
      },
      1,
      'short',
    );
    expect(calls).toEqual(['short']);
    expect((result as { message_id: number }).message_id).toBe(42);
  });

  it('a failed chunk does not abort the rest; returns last success', async () => {
    let n = 0;
    const result = await sendChunkedToTelegram(
      async () => {
        n++;
        if (n === 1) throw new Error('boom');
        return { message_id: n };
      },
      1,
      longText,
    );
    expect(n).toBeGreaterThan(1);
    expect((result as { message_id: number }).message_id).toBe(n);
  });
});
