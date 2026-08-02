import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rolloverNotes } from '../daily-note';

/**
 * Tests for the daily-note rollover job. Database I/O is mocked; what is under
 * test is the STATUS the job reports back to the scheduler.
 *
 * This matters because the scheduler logs an 'error' status at error level and
 * releases the day's fire sentinel, while a 'silent' or 'success' status marks
 * the day as rolled. A DB failure that reports anything other than 'error' is a
 * green-while-broken outage (.claude/rules/silent-failure-guard.md), and it
 * strands yesterday's unchecked items: tomorrow's run only looks at TODAY's
 * note, so nothing ever picks them up again.
 */

const state = vi.hoisted(() => ({
  // Result of an awaited select chain (the "notes due yesterday" query).
  listResult: { data: [] as unknown[], error: null as { message: string } | null },
  // Result of a select chain ending in .single() (get today's note).
  selectSingleResult: { data: null as unknown, error: null as { message: string } | null },
  // Result of an awaited update chain (write today's rolled items).
  updateResult: { error: null as { message: string } | null },
  // Result of an update chain ending in .select().single() (promotion save).
  updateSelectResult: { data: null as unknown, error: null as { message: string } | null },
  // Result of an insert chain ending in .select().single() (create promoted task).
  insertResult: { data: null as unknown, error: null as { message: string } | null },
}));

vi.mock('../../supabase', () => ({
  db: vi.fn(() => ({
    from: () => {
      // A chainable stub whose terminal value depends on which write verb was
      // used, so one builder can stand in for select / insert / update chains.
      const builder: Record<string, unknown> = { op: 'select' };
      const chain = () => builder;
      builder.select = chain;
      builder.eq = chain;
      builder.gte = chain;
      builder.order = chain;
      builder.limit = chain;
      builder.insert = () => {
        builder.op = 'insert';
        return builder;
      };
      builder.update = () => {
        builder.op = 'update';
        return builder;
      };
      builder.single = () =>
        Promise.resolve(
          builder.op === 'insert'
            ? state.insertResult
            : builder.op === 'update'
              ? state.updateSelectResult
              : state.selectSingleResult,
        );
      builder.then = (onOk: (v: unknown) => unknown, onErr?: (e: unknown) => unknown) =>
        Promise.resolve(builder.op === 'update' ? state.updateResult : state.listResult).then(onOk, onErr);
      return builder;
    },
  })),
}));

const ITEM = {
  id: 'it-1',
  text: 'ship the rollover fix',
  done: false,
  roll_count: 0,
  created_at: '2026-08-01T12:00:00.000Z',
  promoted_task_id: null,
};

const YESTERDAY_NOTE = {
  id: 'note-yesterday',
  owner_id: 'zaal',
  metadata: { items: [ITEM], note_date: '2026-08-01' },
};

const TODAY_NOTE = {
  id: 'note-today',
  kind: 'daily_note',
  owner_id: 'zaal',
  metadata: { items: [], note_date: '2026-08-02' },
};

describe('rolloverNotes', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    state.listResult = { data: [YESTERDAY_NOTE], error: null };
    state.selectSingleResult = { data: TODAY_NOTE, error: null };
    state.updateResult = { error: null };
    state.updateSelectResult = {
      data: { ...TODAY_NOTE, metadata: { items: [{ ...ITEM, promoted_task_id: 'task-1' }], note_date: '2026-08-02' } },
      error: null,
    };
    state.insertResult = { data: { id: 'task-1' }, error: null };
  });

  it('reports success when items roll', async () => {
    const result = await rolloverNotes();
    expect(result.status).toBe('success');
    expect(result.summary).toContain('rolled 1 items');
  });

  it('reports silent when there are no notes to roll', async () => {
    state.listResult = { data: [], error: null };
    const result = await rolloverNotes();
    expect(result.status).toBe('silent');
  });

  it('reports error (not silent) when the lookup query fails', async () => {
    state.listResult = { data: [], error: { message: 'connection refused' } };
    const result = await rolloverNotes();
    expect(result.status).toBe('error');
    expect(result.summary).toContain('connection refused');
  });

  it('reports error when an owner write fails, even though other work succeeded', async () => {
    state.updateResult = { error: { message: 'permission denied for table tasks' } };
    const result = await rolloverNotes();
    expect(result.status).toBe('error');
    expect(result.summary).toContain('1/1 owners failed');
  });

  it('reports error when today note creation fails for an owner', async () => {
    state.selectSingleResult = { data: null, error: { message: 'no rows' } };
    state.insertResult = { data: null, error: { message: 'insert rejected' } };
    const result = await rolloverNotes();
    expect(result.status).toBe('error');
    expect(result.summary).toContain('owners failed');
  });
});
