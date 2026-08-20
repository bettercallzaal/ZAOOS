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
  reconcileBacklogState,
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

  /**
   * The 2026-08-09 jam, reproduced. Twenty cards sent over two days pinned the
   * cap and the drip stopped for five days, because the only thing that could
   * lower the count was Zaal answering cards buried a week deep in Telegram.
   *
   * The requirement Zaal set: this number must be able to reach ZERO on its
   * own. A flag that can never clear is a flag nobody reads.
   */
  describe('the 12h cap window - the count has to be able to reach zero', () => {
    const NOW = Date.UTC(2026, 7, 14, 14, 0, 0);
    const hoursAgo = (h: number) => new Date(NOW - h * 3_600_000).toISOString();

    it('counts a card sent inside the window', () => {
      const s = st({ asked: { a: { at: hoursAgo(11), title: 'A' } } });
      expect(outstandingCount(s, NOW)).toBe(1);
    });

    it('releases the slot once the card is older than 12h', () => {
      const s = st({ asked: { a: { at: hoursAgo(13), title: 'A' } } });
      expect(outstandingCount(s, NOW)).toBe(0);
    });

    // The whole point: twenty stale cards no longer latch the gate shut.
    it('falls from 20 to 0 as a day-old pile ages out, with nothing answered', () => {
      const asked: BacklogGrillState['asked'] = {};
      for (let i = 0; i < 20; i++) asked[`t${i}`] = { at: hoursAgo(30), title: `T${i}` };
      const s = st({ asked });

      expect(outstandingCount(s, NOW - 20 * 3_600_000)).toBe(20); // 10h old: all held
      expect(outstandingCount(s, NOW)).toBe(0); // 30h old: all released
      expect(Object.keys(s.asked)).toHaveLength(20); // released from the CAP, not the queue
    });

    // Between flooding him and holding a slot, holding the slot is the safe error.
    it('counts a card whose timestamp cannot be parsed', () => {
      const s = st({ asked: { a: { at: 'not-a-date', title: 'A' } } });
      expect(outstandingCount(s, NOW)).toBe(1);
    });
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

  // Park (card 1b7fe7c9): the task stays OPEN - the PATCH carries a resurface
  // note and NO status change. A drop that destroyed the row is off the menu.
  it('park appends a resurface note and never touches status', async () => {
    const r = await applyBacklogAnswer('4', fakeFetch, OLD);

    expect(r.ok).toBe(true);
    expect(r.message).toContain('Parked');
    expect(patched).toHaveLength(1);
    expect(patched[0].url).toContain(`id=eq.${OLD}`);
    const body = patched[0].body as { status?: string; notes?: string };
    expect(body.status).toBeUndefined();
    expect(body.notes).toContain('parked - stays on the board');
    expect((await readState()).answered[OLD]?.verdict).toBe('park');
  });

  it('does not park - or overwrite notes - when the notes read fails', async () => {
    const failingRead = (async (url: string, init?: RequestInit) => {
      if (init?.method === 'PATCH') {
        patched.push({ url: String(url), body: JSON.parse(String(init.body)) });
        return { ok: true, status: 200 } as unknown as Response;
      }
      return { ok: false, status: 500 } as unknown as Response;
    }) as unknown as typeof fetch;
    const r = await applyBacklogAnswer('4', failingRead, OLD);
    expect(r.ok).toBe(false);
    expect(patched).toHaveLength(0);
    expect((await readState()).answered[OLD]).toBeUndefined();
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
    // The reconcile pass asks for the asked-entries' board rows; everything in
    // these tests is a live todo task, so answer accordingly.
    if (String(url).includes('id=in.(')) {
      const ids = /id=in\.\(([^)]*)\)/.exec(String(url))?.[1]?.split(',') ?? [];
      return {
        ok: true,
        status: 200,
        json: async () => ids.map((id) => ({ id, status: 'todo', archived_at: null, notes: '' })),
      } as unknown as Response;
    }
    return { ok: true, status: 200, json: async () => [{ notes: '' }] } as unknown as Response;
  }) as unknown as typeof fetch;

  const sent: string[] = [];
  const tick = (now: number) =>
    runBacklogGrillTick({
      sendDM: async (text) => {
        sent.push(text);
        return { message_id: sent.length };
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

  /**
   * An asked-but-unanswered card matched neither tier - `fresh` excludes it
   * (it is in `asked`), `requeued` excludes it (no `requeuedAt`). So it went out
   * exactly ONCE, ever, and scrolling past it lost it for good while it went on
   * holding a cap slot. Twenty of those froze the drip for five days.
   */
  it('re-sends an unanswered card once its ladder cooldown has elapsed', async () => {
    const t0 = Date.UTC(2026, 7, 9, 14, 0, 0);
    const every = 2 * 60_000;

    await tick(t0);
    await tick(t0 + every);
    await tick(t0 + 2 * every);

    // All three seen, none answered. Six minutes in, the ladder's 3h fresh rung
    // is doing its job - re-asking here would be nagging, not surfacing.
    expect((await tick(t0 + 3 * every)).reason).toBe('nothing left to ask about');

    // 4h in, every card is past that rung. Before this change the queue stayed
    // empty here for ever, and these three cards were unreachable.
    const again = await tick(t0 + 4 * 3_600_000);
    expect(again.sent).toBe(true);
    expect(again.title).toBe('Oldest'); // longest since its last card leads
  });

  // Age drives the ladder, so it has to survive the re-send that answers it.
  it('keeps firstAskedAt across a re-send so the ladder can climb', async () => {
    const t0 = Date.UTC(2026, 7, 9, 14, 0, 0);
    await tick(t0);
    const first = (await readState()).asked.a?.firstAskedAt;
    expect(first).toBe(new Date(t0).toISOString());

    await tick(t0 + 4 * 3_600_000);
    const after = (await readState()).asked.a;
    expect(after?.firstAskedAt).toBe(first); // never overwritten
    expect(after?.at).not.toBe(first); // but the last-sent stamp moved
  });

  // The 324 never-seen tasks are the pile Zaal wants moving. A re-ask tier in
  // front of them would just starve them behind a different twenty.
  it('sends every unseen task before any re-ask, however overdue', async () => {
    const t0 = Date.UTC(2026, 7, 9, 14, 0, 0);
    await tick(t0);

    // A week later 'Oldest' is deep into the 45m rung - it still waits.
    const week = t0 + 7 * 86_400_000;
    expect((await tick(week)).title).toBe('Middle');
    expect((await tick(week + 2 * 60_000)).title).toBe('Newest');
    expect((await tick(week + 4 * 60_000)).title).toBe('Oldest');
  });
});

// ── grill unification (card 6b6875d1): both ends, one count ─────────────────

describe('reconcileBacklogState - the terminal end settles phone cards', () => {
  const NOW = Date.UTC(2026, 7, 19, 14, 0, 0);

  const askedThree = (): BacklogGrillState =>
    st({
      asked: {
        closed: { at: new Date(NOW - 3_600_000).toISOString(), title: 'Closed in terminal' },
        ruled: { at: new Date(NOW - 3_600_000).toISOString(), title: 'Verdict in notes' },
        open: { at: new Date(NOW - 3_600_000).toISOString(), title: 'Still open' },
      },
    });

  const boardWith =
    (rows: Array<{ id: string; status?: string; archived_at?: string | null; notes?: string }>) =>
    (async () =>
      ({ ok: true, status: 200, json: async () => rows }) as unknown as Response) as unknown as typeof fetch;

  beforeEach(() => {
    files.clear();
    process.env.COWORK_TRACKER_URL = 'https://tracker.test';
    process.env.COWORK_TRACKER_KEY = 'k';
  });

  it('marks board-closed and verdict-synced entries answered; the count reaches zero-able', async () => {
    const s = askedThree();
    expect(outstandingCount(s, NOW)).toBe(3);
    const rec = await reconcileBacklogState(
      s,
      boardWith([
        { id: 'closed', status: 'done', archived_at: null, notes: '' },
        { id: 'ruled', status: 'todo', archived_at: null, notes: 'context\nGRILL 2026-08-19 (Zaal): route to AGENT.' },
        { id: 'open', status: 'todo', archived_at: null, notes: 'nothing decided' },
      ]),
      NOW,
    );
    expect(rec).toEqual({ boardClosed: 1, verdictSynced: 1 });
    expect(s.answered.closed?.verdict).toBe('board-closed');
    expect(s.answered.ruled?.verdict).toBe('verdict-synced');
    expect(s.answered.open).toBeUndefined();
    // Spec point 4: the count now agrees with what would actually still send.
    expect(outstandingCount(s, NOW)).toBe(1);
  });

  it('treats a deleted task as board-closed', async () => {
    const s = st({ asked: { gone: { at: new Date(NOW).toISOString(), title: 'Deleted' } } });
    const rec = await reconcileBacklogState(s, boardWith([]), NOW);
    expect(rec.boardClosed).toBe(1);
    expect(s.answered.gone?.verdict).toBe('board-closed');
  });

  it('marks NOTHING when the board read fails - over-counting is the safe error', async () => {
    const s = askedThree();
    const failing = (async () => ({ ok: false, status: 500 }) as unknown as Response) as unknown as typeof fetch;
    const rec = await reconcileBacklogState(s, failing, NOW);
    expect(rec).toEqual({ boardClosed: 0, verdictSynced: 0 });
    expect(Object.keys(s.answered)).toHaveLength(0);
    expect(outstandingCount(s, NOW)).toBe(3);
  });

  it('settles a parked (requeued) card the terminal closed, clearing the park mark', async () => {
    const s = st({
      asked: { parked: { at: new Date(NOW).toISOString(), title: 'Parked', requeuedAt: new Date(NOW).toISOString() } },
    });
    await reconcileBacklogState(s, boardWith([{ id: 'parked', status: 'done', archived_at: null }]), NOW);
    expect(s.answered.parked?.verdict).toBe('board-closed');
    expect(s.asked.parked?.requeuedAt).toBeUndefined();
  });
});

describe('grill unification - the tick side', () => {
  beforeEach(() => {
    files.clear();
    process.env.COWORK_TRACKER_URL = 'https://tracker.test';
    process.env.COWORK_TRACKER_KEY = 'k';
  });

  it('never sends a fresh card for a task already carrying a terminal verdict, and queries ALL routes', async () => {
    const seenUrls: string[] = [];
    const rows = [
      { id: 'v', title: 'Already ruled', created_at: '2026-01-01T00:00:00Z', notes: 'ZAAL VERDICT 2026-08-19: do X.' },
      { id: 'n', title: 'Genuinely open', created_at: '2026-02-01T00:00:00Z', notes: '' },
    ];
    const f = (async (url: string) => {
      seenUrls.push(String(url));
      if (String(url).includes('order=created_at.asc')) {
        return { ok: true, status: 200, json: async () => rows } as unknown as Response;
      }
      return { ok: true, status: 200, json: async () => [] } as unknown as Response;
    }) as unknown as typeof fetch;

    const result = await runBacklogGrillTick({
      sendDM: async () => ({ message_id: 1 }),
      localHour: 10,
      now: Date.UTC(2026, 7, 19, 14, 0, 0),
      fetchImpl: f,
    });
    expect(result.sent).toBe(true);
    expect(result.title).toBe('Genuinely open');
    // Spec point 3: Zaal grills ALL routes - the board query must not filter one.
    const boardUrl = seenUrls.find((u) => u.includes('order=created_at.asc'));
    expect(boardUrl).toBeDefined();
    expect(boardUrl).not.toContain('route');
  });
});
