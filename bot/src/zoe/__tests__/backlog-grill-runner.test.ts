import { describe, expect, it } from 'vitest';
import { outstandingCount, type BacklogGrillState } from '../backlog-grill-runner';

const st = (over: Partial<BacklogGrillState> = {}): BacklogGrillState => ({
  asked: {}, answered: {}, activeTaskId: null, lastSentMs: null, ...over,
});

describe('outstandingCount - the backpressure signal', () => {
  it('is zero on a fresh state', () => {
    expect(outstandingCount(st())).toBe(0);
  });

  it('counts cards sent but not answered', () => {
    const s = st({ asked: { a: { at: 'x', title: 'A' }, b: { at: 'x', title: 'B' } } });
    expect(outstandingCount(s)).toBe(2);
  });

  // This is what stops the pile becoming a wall he never opens.
  it('drops back as he answers', () => {
    const s = st({
      asked: { a: { at: 'x', title: 'A' }, b: { at: 'x', title: 'B' } },
      answered: { a: { at: 'x', verdict: 'done' } },
    });
    expect(outstandingCount(s)).toBe(1);
  });

  it('is zero once everything is answered', () => {
    const s = st({
      asked: { a: { at: 'x', title: 'A' } },
      answered: { a: { at: 'x', verdict: 'keep' } },
    });
    expect(outstandingCount(s)).toBe(0);
  });

  // A requeued task has its `asked` mark deleted so it comes round again -
  // so it must not still count against the outstanding cap.
  it('does not count a requeued task that was un-asked', () => {
    const s = st({ asked: {}, answered: { a: { at: 'x', verdict: 'work' } } });
    expect(outstandingCount(s)).toBe(0);
  });
});
