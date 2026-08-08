import { describe, expect, it, vi } from 'vitest';
import { ensureLeaseRun, resetRunReady, type RunTableClient } from '../heart-run';

/**
 * A minimal stand-in for the Supabase chains heart-run.ts uses. It records every
 * call so the tests can assert the SHAPE of the query - which is the whole point
 * here: the bug was querying the right table by the wrong column.
 */
function makeClient(opts: {
  existingId?: string | null;
  insertId?: string | null;
  insertError?: { message: string } | null;
  racedId?: string | null;
  throwOn?: 'select' | 'insert' | 'update';
}) {
  const calls: { op: string; args: unknown[] }[] = [];
  let selects = 0;
  const client = {
    from(table: string) {
      calls.push({ op: 'from', args: [table] });
      return {
        select() {
          return {
            eq(field: string, value: unknown) {
              calls.push({ op: 'select.eq', args: [field, value] });
              return {
                async maybeSingle() {
                  if (opts.throwOn === 'select') throw new Error('network down');
                  selects += 1;
                  // First read is the find; a second read is the raced re-read.
                  const id = selects === 1 ? (opts.existingId ?? null) : (opts.racedId ?? null);
                  return { data: id ? { id } : null, error: null };
                },
              };
            },
          };
        },
        insert(values: Record<string, unknown>) {
          calls.push({ op: 'insert', args: [values] });
          return {
            select() {
              return {
                async single() {
                  if (opts.throwOn === 'insert') throw new Error('insert exploded');
                  return {
                    data: opts.insertId ? { id: opts.insertId } : null,
                    error: opts.insertError ?? null,
                  };
                },
              };
            },
          };
        },
        update(values: Record<string, unknown>) {
          calls.push({ op: 'update', args: [values] });
          return {
            eq(field: string, value: unknown) {
              calls.push({ op: 'update.eq', args: [field, value] });
              return {
                async in(field2: string, values2: readonly string[]) {
                  if (opts.throwOn === 'update') throw new Error('update exploded');
                  calls.push({ op: 'update.in', args: [field2, [...values2]] });
                  return { data: null, error: null };
                },
              };
            },
          };
        },
      };
    },
  } as unknown as RunTableClient;
  return { client, calls };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe('ensureLeaseRun', () => {
  it('returns the existing row id when the resource already exists', async () => {
    const { client, calls } = makeClient({ existingId: 'a1b2c3d4-0000-4000-8000-000000000001' });
    const id = await ensureLeaseRun(client, 'zoe.work-loop', 'singleton', 'obj');
    expect(id).toBe('a1b2c3d4-0000-4000-8000-000000000001');
    // It must look the resource up by idempotency_key, never by id.
    expect(calls.find((c) => c.op === 'select.eq')?.args[0]).toBe('idempotency_key');
  });

  // THE BUG THIS MODULE EXISTS FOR. executeWithLease resolves a lease by PRIMARY
  // KEY, so what comes back here has to be the row's uuid - not the
  // `heart:resource:<sha>` idempotency key the scheduler used to pass straight
  // through, which no row can ever match.
  it('returns a row UUID, never the heart:resource idempotency key', async () => {
    const { client } = makeClient({ existingId: null, insertId: 'b1b2c3d4-0000-4000-8000-000000000002' });
    const id = await ensureLeaseRun(client, 'zoe.work-loop', 'singleton', 'obj');
    expect(id).toBe('b1b2c3d4-0000-4000-8000-000000000002');
    expect(id).not.toMatch(/^heart:resource:/);
  });

  it('creates the row with a schema-valid shape when it is missing', async () => {
    const { client, calls } = makeClient({ existingId: null, insertId: 'c1b2c3d4-0000-4000-8000-000000000003' });
    await ensureLeaseRun(client, 'zoe.orchestrator-tick', 'singleton', 'the objective');
    const inserted = calls.find((c) => c.op === 'insert')?.args[0] as Record<string, unknown>;
    expect(inserted.idempotency_key).toMatch(/^heart:resource:[0-9a-f]{64}$/);
    expect(String(inserted.id)).toMatch(UUID_RE);
    // agent_runs.assignment_id is a UUID column with a UNIQUE constraint.
    expect(String(inserted.assignment_id)).toMatch(UUID_RE);
    // visibility has a CHECK constraint: private | team | public.
    expect(['private', 'team', 'public']).toContain(inserted.visibility);
    expect(inserted.status).toBe('ready');
    expect(inserted.objective).toBe('the objective');
  });

  it('gives the same idempotency key for the same (kind, key) and different for different', async () => {
    const a = makeClient({ existingId: null, insertId: 'd1b2c3d4-0000-4000-8000-000000000004' });
    await ensureLeaseRun(a.client, 'zoe.work-loop', 'singleton', 'o');
    const b = makeClient({ existingId: null, insertId: 'd1b2c3d4-0000-4000-8000-000000000004' });
    await ensureLeaseRun(b.client, 'zoe.work-loop', 'singleton', 'o');
    const c = makeClient({ existingId: null, insertId: 'd1b2c3d4-0000-4000-8000-000000000004' });
    await ensureLeaseRun(c.client, 'zoe.orchestrator-tick', 'singleton', 'o');

    const keyOf = (m: ReturnType<typeof makeClient>) =>
      (m.calls.find((x) => x.op === 'insert')?.args[0] as Record<string, unknown>).idempotency_key;
    expect(keyOf(a)).toBe(keyOf(b));
    expect(keyOf(a)).not.toBe(keyOf(c));
  });

  it('re-reads instead of failing when a sibling host wins the insert race', async () => {
    const { client } = makeClient({
      existingId: null,
      insertId: null,
      insertError: { message: 'duplicate key value violates unique constraint' },
      racedId: 'e1b2c3d4-0000-4000-8000-000000000005',
    });
    expect(await ensureLeaseRun(client, 'zoe.work-loop', 'singleton', 'o')).toBe(
      'e1b2c3d4-0000-4000-8000-000000000005',
    );
  });

  it('returns null rather than throwing when the row can neither be read nor created', async () => {
    const { client } = makeClient({ existingId: null, insertId: null, insertError: { message: 'boom' }, racedId: null });
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await ensureLeaseRun(client, 'zoe.work-loop', 'singleton', 'o')).toBeNull();
    // Never silent: the caller has to be able to see why it fell back.
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('returns null rather than throwing when the client itself throws', async () => {
    const { client } = makeClient({ throwOn: 'select' });
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await ensureLeaseRun(client, 'zoe.work-loop', 'singleton', 'o')).toBeNull();
    spy.mockRestore();
  });
});

describe('resetRunReady', () => {
  // THE SECOND WEDGE. executeWithLease releases to a terminal status but
  // canAcquire only takes 'ready' or an expired lease, so without this the
  // resource works once and then refuses every later tick forever.
  it('parks the row back at ready, conditional on it still being terminal', async () => {
    const { client, calls } = makeClient({});
    await resetRunReady(client, 'f1b2c3d4-0000-4000-8000-000000000006');
    const update = calls.find((c) => c.op === 'update')?.args[0] as Record<string, unknown>;
    expect(update.status).toBe('ready');
    expect(calls.find((c) => c.op === 'update.eq')?.args).toEqual([
      'id',
      'f1b2c3d4-0000-4000-8000-000000000006',
    ]);
    // 'failed' too: a tick that throws must not wedge the loop permanently.
    expect(calls.find((c) => c.op === 'update.in')?.args[1]).toEqual(['completed', 'failed']);
  });

  it('swallows a failure - the tick it follows has already done its work', async () => {
    const { client } = makeClient({ throwOn: 'update' });
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(resetRunReady(client, 'f1b2c3d4-0000-4000-8000-000000000007')).resolves.toBeUndefined();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
