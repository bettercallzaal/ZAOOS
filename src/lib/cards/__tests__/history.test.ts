// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createHistory, pushHistory, redo, undo } from '../history';

describe('history', () => {
  it('undoes and redoes in order', () => {
    let h = createHistory(1);
    h = pushHistory(h, 2);
    h = pushHistory(h, 3);
    h = undo(h);
    expect(h.present).toBe(2);
    h = undo(h);
    expect(h.present).toBe(1);
    h = redo(h);
    expect(h.present).toBe(2);
    expect(h.future).toEqual([3]);
  });

  it('clears redo when a new step is pushed', () => {
    const h = pushHistory(undo(pushHistory(createHistory('a'), 'b')), 'c');
    expect(h.present).toBe('c');
    expect(h.future).toEqual([]);
    expect(h.past).toEqual(['a']);
  });

  it('returns the same history when there is nothing to undo or redo', () => {
    const h = createHistory(0);
    expect(undo(h)).toBe(h);
    expect(redo(h)).toBe(h);
  });

  it('drops the oldest steps past the limit', () => {
    let h = createHistory(0);
    for (let i = 1; i <= 5; i++) h = pushHistory(h, i, 3);
    expect(h.past).toEqual([2, 3, 4]);
    expect(h.present).toBe(5);
  });

  it('does not mutate the history passed in', () => {
    const h = createHistory(0);
    pushHistory(h, 1);
    expect(h).toEqual({ past: [], present: 0, future: [] });
  });
});
