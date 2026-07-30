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
