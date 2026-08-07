import { describe, expect, it, vi } from 'vitest';
import { LiveStatus, MIN_EDIT_INTERVAL_MS, renderBuildStatus } from '../live-status';

/** A fake Telegram with a controllable clock, so nothing sleeps. */
function harness(opts: { failEdits?: boolean } = {}) {
  const sends: string[] = [];
  const edits: Array<{ id: number; text: string }> = [];
  let clock = 1_000_000;
  let nextId = 100;
  const live = new LiveStatus({
    send: async (text) => {
      sends.push(text);
      return nextId++;
    },
    edit: async (id, text) => {
      if (opts.failEdits) throw new Error('message to edit not found');
      edits.push({ id, text });
    },
    now: () => clock,
  });
  return { live, sends, edits, tick: (ms: number) => { clock += ms; } };
}

describe('LiveStatus', () => {
  it('sends once, then edits - one message, not six', async () => {
    const h = harness();
    await h.live.render('coding');
    h.tick(MIN_EDIT_INTERVAL_MS);
    await h.live.render('critic reviewing');
    h.tick(MIN_EDIT_INTERVAL_MS);
    await h.live.render('opened PR');

    expect(h.sends).toEqual(['coding']);          // exactly one message created
    expect(h.edits.map((e) => e.text)).toEqual(['critic reviewing', 'opened PR']);
    expect(new Set(h.edits.map((e) => e.id)).size).toBe(1); // all edits hit the same message
  });

  // Telegram returns an ERROR for an identical edit, not a no-op.
  it('never re-sends identical text', async () => {
    const h = harness();
    await h.live.render('coding');
    h.tick(MIN_EDIT_INTERVAL_MS);
    await h.live.render('coding');
    await h.live.render('coding');
    expect(h.edits).toHaveLength(0);
  });

  it('throttles rapid updates', async () => {
    const h = harness();
    await h.live.render('a');
    await h.live.render('b'); // immediately after - throttled
    await h.live.render('c');
    expect(h.edits).toHaveLength(0);
  });

  // A dropped intermediate frame is invisible; a dropped FINAL frame is a lie.
  it('flush() lands the last throttled state', async () => {
    const h = harness();
    await h.live.render('a');
    await h.live.render('b');
    await h.live.render('c'); // c replaces b as the pending state
    await h.live.flush();
    expect(h.edits.map((e) => e.text)).toEqual(['c']);
  });

  it('flush() is a no-op when nothing is pending', async () => {
    const h = harness();
    await h.live.render('a');
    await h.live.flush();
    await h.live.flush();
    expect(h.edits).toHaveLength(0);
  });

  it('force bypasses the throttle, for terminal states', async () => {
    const h = harness();
    await h.live.render('coding');
    await h.live.render('Built it: PR #1', undefined, true); // no clock advance
    expect(h.edits.map((e) => e.text)).toEqual(['Built it: PR #1']);
  });

  it('falls back to a new message when the original is gone', async () => {
    const h = harness({ failEdits: true });
    await h.live.render('coding');
    h.tick(MIN_EDIT_INTERVAL_MS);
    await h.live.render('critic reviewing');
    // Losing the thread mid-build is worse than an extra message.
    expect(h.sends).toEqual(['coding', 'critic reviewing']);
  });

  it('keeps working after a failed edit', async () => {
    const h = harness({ failEdits: true });
    await h.live.render('one');
    h.tick(MIN_EDIT_INTERVAL_MS);
    await h.live.render('two');
    h.tick(MIN_EDIT_INTERVAL_MS);
    await h.live.render('three');
    expect(h.sends).toEqual(['one', 'two', 'three']);
  });

  it('exposes the live message id', async () => {
    const h = harness();
    expect(h.live.id).toBeNull();
    await h.live.render('x');
    expect(typeof h.live.id).toBe('number');
  });
});

describe('renderBuildStatus', () => {
  const base = { task: 'add a /health route', phase: 'coding', history: [], elapsedSec: 12 };

  it('leads with the phase - often the only line a notification shows', () => {
    expect(renderBuildStatus(base).split('\n')[0]).toBe('coding - 12s');
  });

  it('switches seconds to minutes as a run gets long', () => {
    expect(renderBuildStatus({ ...base, elapsedSec: 300 })).toContain('5m');
  });

  it('drops the timer once done - a finished build has no clock', () => {
    const out = renderBuildStatus({ ...base, phase: 'Built it: PR #12', done: true });
    expect(out.split('\n')[0]).toBe('Built it: PR #12');
    expect(out).not.toContain('12s');
  });

  it('shows history oldest-first so it reads as a growing log', () => {
    const out = renderBuildStatus({ ...base, history: ['wrote 3 files', 'critic 6/10'] });
    expect(out.indexOf('wrote 3 files')).toBeLessThan(out.indexOf('critic 6/10'));
  });

  // An unbounded log would eventually blow Telegram's 4096-char cap.
  it('keeps only the recent tail of a long history', () => {
    const history = Array.from({ length: 20 }, (_, i) => `step ${i}`);
    const out = renderBuildStatus({ ...base, history });
    expect(out).toContain('step 19');
    expect(out).not.toContain('step 0');
    expect(out.length).toBeLessThan(4096);
  });

  it('truncates a very long task rather than blowing the message', () => {
    const out = renderBuildStatus({ ...base, task: 'x'.repeat(500) });
    expect(out.length).toBeLessThan(400);
  });
});
