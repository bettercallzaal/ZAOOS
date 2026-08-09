import { beforeEach, describe, expect, it, vi } from 'vitest';

// An in-memory stand-in for ~/.zao/zoe/backlog-grill-state.json, so the answer
// path can be exercised without touching the real state file.
const files = new Map<string, string>();
vi.mock('node:fs', () => ({
  promises: {
    readFile: async (p: string) => {
      const v = files.get(p);
      if (v === undefined) throw new Error('ENOENT');
      return v;
    },
    writeFile: async (p: string, data: string) => {
      files.set(p, data);
    },
    mkdir: async () => undefined,
  },
}));

import {
  applyBacklogAnswer,
  outstandingCount,
  readState,
  runBacklogGrillTick,
  writeState,
  type BacklogGrillState,
} from '../backlog-grill-runner';

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

  // A requeued task keeps its `asked` mark (that is what stops it jumping the
  // queue), so the cap has to look past it - otherwise twenty skips would pin
  // the outstanding count at 20 and the drip would stop for good.
  it('does not count a task parked for requeue', () => {
    const s = st({ asked: { a: { at: 'x', title: 'A', requeuedAt: 'y' } } });
    expect(outstandingCount(s)).toBe(0);
  });
});

/**
 * The pile is the feature: up to 20 cards sit unanswered at once. So the card
 * Zaal taps is usually NOT the newest one, and the answer has to follow his
 * thumb rather than the cursor.
 */
describe('applyBacklogAnswer - the answer follows the card, not the cursor', () => {
  const OLD = 'task-old';
  const NEW = 'task-new';
  const patched: Array<{ url: string; body: unknown }> = [];

  const fakeFetch = (async (url: string, init?: RequestInit) => {
    if (init?.method === 'PATCH') {
      patched.push({ url: String(url), body: JSON.parse(String(init.body)) });
      return { ok: true, status: 200 } as unknown as Response;
    }
    return { ok: true, status: 200, json: async () => [{ notes: '' }] } as unknown as Response;
  }) as unknown as typeof fetch;

  beforeEach(async () => {
    files.clear();
    patched.length = 0;
    process.env.COWORK_TRACKER_URL = 'https://tracker.test';
    process.env.COWORK_TRACKER_KEY = 'k';
    await writeState(
      st({
        asked: { [OLD]: { at: 'x', title: 'Old' }, [NEW]: { at: 'x', title: 'New' } },
        activeTaskId: NEW,
      }),
    );
  });

  it('closes the task the tap named, not the newest card', async () => {
    const r = await applyBacklogAnswer('done', fakeFetch, OLD);

    expect(r.ok).toBe(true);
    expect(patched).toHaveLength(1);
    expect(patched[0].url).toContain(`id=eq.${OLD}`);
    expect(patched[0].url).not.toContain(NEW);
    expect(patched[0].body).toMatchObject({ status: 'done' });

    const after = await readState();
    expect(after.answered[OLD]?.verdict).toBe('done');
    expect(after.answered[NEW]).toBeUndefined();
    // The newest card is still the one a typed bare "1" would answer.
    expect(after.activeTaskId).toBe(NEW);
  });

  // No id means a typed answer with nothing attached, which can only mean the
  // card in play.
  it('falls back to the card in play when no task is named', async () => {
    const r = await applyBacklogAnswer('done', fakeFetch);

    expect(r.ok).toBe(true);
    expect(patched[0].url).toContain(`id=eq.${NEW}`);
    expect((await readState()).activeTaskId).toBeNull();
  });

  it('refuses to answer the same card twice', async () => {
    await applyBacklogAnswer('done', fakeFetch, OLD);
    const again = await applyBacklogAnswer('drop', fakeFetch, OLD);

    expect(again.ok).toBe(false);
    expect(patched).toHaveLength(1);
  });

  /**
   * Closing REPLACES `notes`, so it has to read them first. When that read
   * fails there is nothing to preserve, and writing anyway replaced the whole
   * note history with one grill line while telling Zaal "Closed."
   */
  it('does not close - or overwrite notes - when the notes read fails', async () => {
    const failingRead = (async (url: string, init?: RequestInit) => {
      if (init?.method === 'PATCH') {
        patched.push({ url: String(url), body: JSON.parse(String(init.body)) });
        return { ok: true, status: 200 } as unknown as Response;
      }
      return { ok: false, status: 503, json: async () => [] } as unknown as Response;
    }) as unknown as typeof fetch;

    const r = await applyBacklogAnswer('done', failingRead, OLD);

    expect(r.ok).toBe(false);
    expect(r.message).toContain('503');
    expect(patched).toHaveLength(0);
    // Still unanswered, so the next tap retries instead of losing the card.
    expect((await readState()).answered[OLD]).toBeUndefined();
  });

  // A requeued verdict forgets the `answered` mark, so the task is answerable
  // the second time - but KEEPS `asked`, stamped, so it does not jump the queue.
  it('lets a requeued task be answered again when it returns', async () => {
    await applyBacklogAnswer('skip', fakeFetch, OLD);
    const after = await readState();
    expect(after.asked[OLD]?.requeuedAt).toBeTruthy();
    expect(after.answered[OLD]).toBeUndefined();

    await writeState({ ...after, asked: { ...after.asked, [OLD]: { at: 'y', title: 'Old' } } });
    const second = await applyBacklogAnswer('done', fakeFetch, OLD);
    expect(second.ok).toBe(true);
    expect(patched.some((p) => p.url.includes(`id=eq.${OLD}`))).toBe(true);
  });
});

/**
 * The bug this guards: cards go out oldest-first, so the card just skipped was
 * the oldest one. Un-asking it made it the oldest UNASKED one too, and the next
 * tick re-sent the same card - forever. Skip meant "show me this again in two
 * minutes, and never show me anything else".
 */
describe('runBacklogGrillTick - a skipped card goes to the back, not the front', () => {
  const rows = [
    { id: 'a', title: 'Oldest', created_at: '2026-01-01T00:00:00Z' },
    { id: 'b', title: 'Middle', created_at: '2026-02-01T00:00:00Z' },
    { id: 'c', title: 'Newest', created_at: '2026-03-01T00:00:00Z' },
  ];

  const boardFetch = (async (url: string, init?: RequestInit) => {
    if (init?.method === 'PATCH') return { ok: true, status: 200 } as unknown as Response;
    if (String(url).includes('order=created_at.asc')) {
      return { ok: true, status: 200, json: async () => rows } as unknown as Response;
    }
    return { ok: true, status: 200, json: async () => [{ notes: '' }] } as unknown as Response;
  }) as unknown as typeof fetch;

  const sent: string[] = [];
  const tick = (now: number) =>
    runBacklogGrillTick({
      sendDM: async (text) => {
        sent.push(text);
      },
      localHour: 10,
      now,
      fetchImpl: boardFetch,
    });

  beforeEach(async () => {
    files.clear();
    sent.length = 0;
    process.env.COWORK_TRACKER_URL = 'https://tracker.test';
    process.env.COWORK_TRACKER_KEY = 'k';
  });

  it('sends the next unseen task after a skip, then returns the skipped one last', async () => {
    const t0 = Date.UTC(2026, 7, 9, 14, 0, 0);
    const every = 2 * 60_000;

    expect((await tick(t0)).title).toBe('Oldest');
    await applyBacklogAnswer('skip', boardFetch, 'a');

    // Before the fix this was 'Oldest' again - and every tick after it.
    expect((await tick(t0 + every)).title).toBe('Middle');
    expect((await tick(t0 + 2 * every)).title).toBe('Newest');
    // Only now, with nothing unseen left, does the skipped one come round.
    expect((await tick(t0 + 3 * every)).title).toBe('Oldest');
  });

  it('does not re-send a requeued card while unseen tasks remain', async () => {
    const t0 = Date.UTC(2026, 7, 9, 14, 0, 0);
    await tick(t0);
    await applyBacklogAnswer('work', boardFetch, 'a');
    const second = await tick(t0 + 2 * 60_000);

    expect(second.sent).toBe(true);
    expect(second.title).not.toBe('Oldest');
    expect((await readState()).asked.a?.requeuedAt).toBeTruthy();
  });
});
