import { describe, it, expect, beforeEach } from 'vitest';
import { enqueueTurn, pendingTurns, isChatBusy, _resetTurnQueues } from '../turn-queue';

function deferred<T = void>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('turn-queue (finish then apply)', () => {
  beforeEach(() => {
    _resetTurnQueues();
  });

  it('runs same-chat turns one at a time in arrival order', async () => {
    const order: string[] = [];
    const a = deferred();
    const b = deferred();

    const pA = enqueueTurn(1, async () => {
      order.push('A:start');
      await a.promise;
      order.push('A:end');
    });
    const pB = enqueueTurn(1, async () => {
      order.push('B:start');
      await b.promise;
      order.push('B:end');
    });

    const flush = () => new Promise((r) => setTimeout(r, 0));

    // Turns start on a microtask, so let A begin. B must NOT start until A ends.
    await flush();
    expect(order).toEqual(['A:start']);
    a.resolve();
    await pA;
    await flush();
    // A finished and B has now started, but B has not ended yet.
    expect(order).toEqual(['A:start', 'A:end', 'B:start']);
    b.resolve();
    await pB;
    expect(order).toEqual(['A:start', 'A:end', 'B:start', 'B:end']);
  });

  it('fires onDeferred only for turns queued behind an in-flight turn', async () => {
    let deferredCalls = 0;
    const a = deferred();

    const pA = enqueueTurn(2, async () => {
      await a.promise;
    }, { onDeferred: () => { deferredCalls += 1; } });
    // first turn is not deferred
    expect(deferredCalls).toBe(0);

    enqueueTurn(2, async () => {}, { onDeferred: () => { deferredCalls += 1; } });
    // second turn lands while first is running -> deferred ack fires once
    expect(deferredCalls).toBe(1);

    a.resolve();
    await pA;
  });

  it('isolates different chats (no cross-chat blocking)', async () => {
    const order: string[] = [];
    const a = deferred();

    const pChat1 = enqueueTurn(10, async () => {
      order.push('c1:start');
      await a.promise;
      order.push('c1:end');
    });
    const pChat2 = enqueueTurn(20, async () => {
      order.push('c2:ran');
    });

    await pChat2; // chat 2 runs without waiting on chat 1
    expect(order).toContain('c2:ran');
    expect(order).not.toContain('c1:end');

    a.resolve();
    await pChat1;
    expect(order).toEqual(['c1:start', 'c2:ran', 'c1:end']);
  });

  it('a failing turn does not wedge the queue', async () => {
    const order: string[] = [];
    const pA = enqueueTurn(3, async () => {
      order.push('A');
      throw new Error('boom');
    });
    const pB = enqueueTurn(3, async () => {
      order.push('B');
    });

    await expect(pA).rejects.toThrow('boom');
    await pB;
    expect(order).toEqual(['A', 'B']);
    expect(pendingTurns(3)).toBe(0);
    expect(isChatBusy(3)).toBe(false);
  });

  it('tracks depth and clears when idle', async () => {
    const a = deferred();
    expect(pendingTurns(4)).toBe(0);
    const pA = enqueueTurn(4, async () => { await a.promise; });
    expect(pendingTurns(4)).toBe(1);
    enqueueTurn(4, async () => {});
    expect(pendingTurns(4)).toBe(2);
    a.resolve();
    await pA;
    // allow the chained turn to settle
    await new Promise((r) => setTimeout(r, 0));
    expect(pendingTurns(4)).toBe(0);
  });
});
