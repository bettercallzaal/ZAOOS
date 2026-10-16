import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  NO_SPINNER,
  SPINNER_MIN_EDIT_MS,
  SPINNER_START_DELAY_MS,
  TELEGRAM_TEXT_LIMIT,
  spinnerFrame,
  startThinkingSpinner,
  thinkingSpinnerEnabled,
} from '../thinking-spinner';

function makeDeps(opts: { sendFails?: boolean; editFails?: (text: string) => boolean } = {}) {
  const calls: Array<{ at: number; op: string; text?: string }> = [];
  const deps = {
    send: vi.fn(async (text: string) => {
      calls.push({ at: Date.now(), op: 'send', text });
      if (opts.sendFails) throw new Error('send failed');
      return 42;
    }),
    edit: vi.fn(async (_id: number, text: string) => {
      calls.push({ at: Date.now(), op: 'edit', text });
      if (opts.editFails?.(text)) throw new Error('edit failed');
    }),
    remove: vi.fn(async (_id: number) => {
      calls.push({ at: Date.now(), op: 'remove' });
    }),
  };
  return { deps, calls };
}

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('thinkingSpinnerEnabled', () => {
  it('is off by default and on only for the literal 1', () => {
    expect(thinkingSpinnerEnabled({})).toBe(false);
    expect(thinkingSpinnerEnabled({ ZOE_THINKING_SPINNER: 'true' })).toBe(false);
    expect(thinkingSpinnerEnabled({ ZOE_THINKING_SPINNER: '1' })).toBe(true);
  });
});

describe('spinnerFrame', () => {
  it('cycles | / - \\', () => {
    expect([0, 1, 2, 3, 4].map((t) => spinnerFrame('thinking', t))).toEqual([
      'thinking |',
      'thinking /',
      'thinking -',
      'thinking \\',
      'thinking |',
    ]);
  });
});

describe('startThinkingSpinner', () => {
  it('sends nothing on a fast turn and leaves the answer to the caller', async () => {
    const { deps } = makeDeps();
    const s = startThinkingSpinner(deps);
    await vi.advanceTimersByTimeAsync(SPINNER_START_DELAY_MS - 100);
    expect(await s.deliver('the answer')).toBe(false);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(deps.send).not.toHaveBeenCalled();
    expect(deps.edit).not.toHaveBeenCalled();
  });

  it('starts one placeholder, edits it through the frames, then edits it into the answer', async () => {
    const { deps } = makeDeps();
    const s = startThinkingSpinner(deps);
    await vi.advanceTimersByTimeAsync(SPINNER_START_DELAY_MS);
    expect(deps.send).toHaveBeenCalledTimes(1);
    expect(deps.send).toHaveBeenCalledWith('thinking |');

    await vi.advanceTimersByTimeAsync(SPINNER_MIN_EDIT_MS * 3);
    expect(deps.edit.mock.calls.map((c) => c[1])).toEqual(['thinking /', 'thinking -', 'thinking \\']);

    expect(await s.deliver('the answer')).toBe(true);
    expect(deps.edit).toHaveBeenLastCalledWith(42, 'the answer');
    expect(deps.remove).not.toHaveBeenCalled();

    // No frame ever lands after the answer.
    const before = deps.edit.mock.calls.length;
    await vi.advanceTimersByTimeAsync(10_000);
    expect(deps.edit.mock.calls.length).toBe(before);
    expect(deps.send).toHaveBeenCalledTimes(1);
  });

  it('never edits faster than the limit, even when asked to', async () => {
    const { deps, calls } = makeDeps();
    const s = startThinkingSpinner(deps, { intervalMs: 50 });
    await vi.advanceTimersByTimeAsync(SPINNER_START_DELAY_MS + 10_000);
    await s.stop();
    const edits = calls.filter((c) => c.op === 'edit').map((c) => c.at);
    expect(edits.length).toBeGreaterThan(0);
    for (let i = 1; i < edits.length; i++) {
      expect(edits[i] - edits[i - 1]).toBeGreaterThanOrEqual(SPINNER_MIN_EDIT_MS);
    }
  });

  it('skips a tick while the previous edit is still in flight', async () => {
    const { deps } = makeDeps();
    let release: () => void = () => {};
    deps.edit.mockImplementationOnce(
      () =>
        new Promise<void>((r) => {
          release = r;
        }),
    );
    const s = startThinkingSpinner(deps);
    await vi.advanceTimersByTimeAsync(SPINNER_START_DELAY_MS + SPINNER_MIN_EDIT_MS * 4);
    expect(deps.edit).toHaveBeenCalledTimes(1);
    release();
    await vi.advanceTimersByTimeAsync(SPINNER_MIN_EDIT_MS);
    expect(deps.edit).toHaveBeenCalledTimes(2);
    await s.stop();
  });

  it('stop removes the placeholder and halts the cycle (the error / timeout exit)', async () => {
    const { deps } = makeDeps();
    const s = startThinkingSpinner(deps);
    await vi.advanceTimersByTimeAsync(SPINNER_START_DELAY_MS + SPINNER_MIN_EDIT_MS);
    await s.stop();
    expect(deps.remove).toHaveBeenCalledWith(42);
    const edits = deps.edit.mock.calls.length;
    await vi.advanceTimersByTimeAsync(10_000);
    expect(deps.edit.mock.calls.length).toBe(edits);
    // A deliver after stop does not resurrect it.
    expect(await s.deliver('late')).toBe(false);
    await s.stop();
    expect(deps.remove).toHaveBeenCalledTimes(1);
  });

  it('stop in a try/finally clears the spinner when the turn throws', async () => {
    const { deps } = makeDeps();
    const turn = async () => {
      const s = startThinkingSpinner(deps);
      try {
        await new Promise((r) => setTimeout(r, SPINNER_START_DELAY_MS + 2500));
        throw new Error('llm timeout');
      } finally {
        await s.stop();
      }
    };
    const p = turn().catch((e: Error) => e.message);
    await vi.advanceTimersByTimeAsync(SPINNER_START_DELAY_MS + 3000);
    expect(await p).toBe('llm timeout');
    expect(deps.remove).toHaveBeenCalledWith(42);
  });

  it('stop before the placeholder exists sends nothing', async () => {
    const { deps } = makeDeps();
    const s = startThinkingSpinner(deps);
    await s.stop();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(deps.send).not.toHaveBeenCalled();
    expect(deps.remove).not.toHaveBeenCalled();
  });

  it('removes the placeholder and defers when the answer is too long for one message', async () => {
    const { deps } = makeDeps();
    const s = startThinkingSpinner(deps);
    await vi.advanceTimersByTimeAsync(SPINNER_START_DELAY_MS);
    expect(await s.deliver('x'.repeat(TELEGRAM_TEXT_LIMIT + 1))).toBe(false);
    expect(deps.remove).toHaveBeenCalledWith(42);
  });

  it('removes the placeholder and defers when the edit into the answer fails', async () => {
    const { deps } = makeDeps({ editFails: (t) => t === 'the answer' });
    const s = startThinkingSpinner(deps);
    await vi.advanceTimersByTimeAsync(SPINNER_START_DELAY_MS);
    expect(await s.deliver('the answer')).toBe(false);
    expect(deps.remove).toHaveBeenCalledWith(42);
  });

  it('waits for an in-flight placeholder send before delivering', async () => {
    const { deps } = makeDeps();
    let resolveSend: (id: number) => void = () => {};
    deps.send.mockImplementationOnce(
      () =>
        new Promise<number>((r) => {
          resolveSend = r;
        }),
    );
    const s = startThinkingSpinner(deps);
    await vi.advanceTimersByTimeAsync(SPINNER_START_DELAY_MS);
    const delivered = s.deliver('the answer');
    resolveSend(7);
    expect(await delivered).toBe(true);
    expect(deps.edit).toHaveBeenCalledWith(7, 'the answer');
  });

  it('a failed placeholder send leaves the answer to the caller', async () => {
    const { deps } = makeDeps({ sendFails: true });
    const s = startThinkingSpinner(deps);
    await vi.advanceTimersByTimeAsync(SPINNER_START_DELAY_MS + 3000);
    expect(deps.edit).not.toHaveBeenCalled();
    expect(await s.deliver('the answer')).toBe(false);
    expect(deps.remove).not.toHaveBeenCalled();
  });
});

describe('NO_SPINNER (flag off)', () => {
  it('never sends a placeholder and always defers', async () => {
    expect(await NO_SPINNER.deliver('the answer')).toBe(false);
    await NO_SPINNER.stop();
  });
});
