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

  // A requeued task has its `asked` mark deleted so it comes round again -
  // so it must not still count against the outstanding cap.
  it('does not count a requeued task that was un-asked', () => {
    const s = st({ asked: {}, answered: { a: { at: 'x', verdict: 'work' } } });
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

  // A requeued verdict forgets BOTH marks, so the task comes round again and is
  // answerable the second time.
  it('lets a requeued task be answered again when it returns', async () => {
    await applyBacklogAnswer('skip', fakeFetch, OLD);
    const after = await readState();
    expect(after.asked[OLD]).toBeUndefined();
    expect(after.answered[OLD]).toBeUndefined();

    await writeState({ ...after, asked: { ...after.asked, [OLD]: { at: 'y', title: 'Old' } } });
    const second = await applyBacklogAnswer('done', fakeFetch, OLD);
    expect(second.ok).toBe(true);
    expect(patched.some((p) => p.url.includes(`id=eq.${OLD}`))).toBe(true);
  });
});
