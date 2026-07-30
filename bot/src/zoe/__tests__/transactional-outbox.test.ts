import { describe, it, expect, beforeEach } from 'vitest';
import {
  HeartFleet,
  MemoryLeaseStore,
  DurableEffectLedger,
  sendOnce,
  effectKey,
  type FencingToken,
  type AgentRunRow,
  type OutboxClient,
} from '../../../../packages/heart-fleet/src/index';

/**
 * Transactional outbox - the durable at-most-once send path (doc 2145).
 * FakeOutboxClient models the two semantics the real Supabase gives: a PK
 * conflict on (run_id, effect_key) INSERT (23505) and conditional UPDATEs that
 * mutate only when the WHERE clauses hold. Proven: dedupe fires the send once,
 * a stale fence never sends, a crash before commit leaves a reconcilable row
 * and the retry dedupes (no resend), commit records evidence.
 */

interface Row {
  run_id: string;
  effect_key: string;
  state: string;
  channel: string;
  payload_digest: string;
  fence_owner: string | null;
  fence_expires_at: string | null;
  external_ref: Record<string, unknown> | null;
  attempts: number;
  last_error: string | null;
  created_at: string;
  committed_at: string | null;
}

class FakeOutboxClient implements OutboxClient {
  rows = new Map<string, Row>();
  log: Array<{ outcome: string; effect_key: string }> = [];
  private key(r: string, e: string) {
    return `${r}::${e}`;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from(table: string): any {
    const self = this;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const q: any = {
      _table: table,
      _op: null,
      _values: {},
      _eq: {},
      _in: {},
      _lt: {},
      insert(v: Record<string, unknown>) { q._op = 'insert'; q._values = v; return q; },
      update(v: Record<string, unknown>) { q._op = 'update'; q._values = v; return q; },
      select() { return q; },
      eq(f: string, v: unknown) { q._eq[f] = v; return q; },
      in(f: string, v: unknown[]) { q._in[f] = v; return q; },
      lt(f: string, v: string) { q._lt[f] = v; return q; },
      limit() { return Promise.resolve(self._runSelect(q)); },
      async maybeSingle() { return self._run(q); },
    };
    return q;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _matches(row: Row, q: any): boolean {
    for (const [f, v] of Object.entries(q._eq)) if ((row as unknown as Record<string, unknown>)[f] !== v) return false;
    for (const [f, vs] of Object.entries(q._in)) if (!(vs as unknown[]).includes((row as unknown as Record<string, unknown>)[f])) return false;
    for (const [f, b] of Object.entries(q._lt)) {
      const a = (row as unknown as Record<string, unknown>)[f];
      if (typeof a !== 'string' || new Date(a) >= new Date(b as string)) return false;
    }
    return true;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _runSelect(q: any) {
    if (q._table === 'outbox_dispatch_log') return { data: [], error: null };
    const out = [...this.rows.values()].filter((r) => this._matches(r, q));
    return { data: out, error: null };
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _run(q: any) {
    if (q._table === 'outbox_dispatch_log') {
      this.log.push({ outcome: String(q._values.outcome), effect_key: String(q._values.effect_key) });
      return { data: { id: 'log' }, error: null };
    }
    if (q._op === 'insert') {
      const k = this.key(String(q._values.run_id), String(q._values.effect_key));
      if (this.rows.has(k)) return { data: null, error: { code: '23505', message: 'duplicate key' } };
      this.rows.set(k, { fence_owner: null, fence_expires_at: null, external_ref: null, attempts: 0, last_error: null, committed_at: null, ...(q._values as Partial<Row>) } as Row);
      return { data: { run_id: q._values.run_id }, error: null };
    }
    for (const [k, row] of this.rows) {
      if (row.run_id === q._eq.run_id && row.effect_key === q._eq.effect_key) {
        if (!this._matches(row, q)) return { data: null, error: null };
        this.rows.set(k, { ...row, ...(q._values as Partial<Row>) });
        return { data: { run_id: row.run_id }, error: null };
      }
    }
    return { data: null, error: null };
  }
}

const RUN_ID = '00000000-0000-4000-8000-000000000001';
const T0 = new Date('2026-07-30T00:00:00.000Z');

function makeRun(): Omit<AgentRunRow, 'created_at' | 'updated_at'> {
  return {
    id: RUN_ID, task_id: null, assignment_id: 'a', objective: 'o', required_capabilities: [],
    status: 'ready', assigned_agent: null, lease_owner: null, lease_expires_at: null, retries: 0,
    budget: null, approval_state: 'auto', visibility: 'internal', idempotency_key: 'k', created_by: 't',
  };
}

let store: MemoryLeaseStore;
let heart: HeartFleet;
let client: FakeOutboxClient;
let ledger: DurableEffectLedger;
let fence: FencingToken;

beforeEach(async () => {
  store = new MemoryLeaseStore(T0);
  heart = new HeartFleet({ store });
  client = new FakeOutboxClient();
  ledger = new DurableEffectLedger({ client, now: () => store.now() });
  store.insert(makeRun());
  const acq = await heart.acquire(RUN_ID, 'worker-A', 60);
  fence = acq.fence as FencingToken;
});

const tg = (chatId: number, text: string) => ({
  fence,
  channel: 'telegram' as const,
  effectKey: effectKey('telegram', { chatId, text }),
  payload: { chatId, text },
  send: async () => ({ message_id: 555 }),
  toExternalRef: (r: { message_id: number }) => ({ message_id: r.message_id }),
});

describe('sendOnce', () => {
  it('sends once and records external evidence', async () => {
    let fired = 0;
    const res = await sendOnce(heart, ledger, { ...tg(1, 'hi'), send: async () => { fired++; return { message_id: 42 }; } });
    expect(res).toEqual({ sent: true, result: { message_id: 42 } });
    expect(fired).toBe(1);
    const row = [...client.rows.values()][0];
    expect(row.state).toBe('committed');
    expect(row.external_ref).toEqual({ message_id: 42 });
  });

  it('a duplicate effect_key dedupes - send fires exactly once across retries', async () => {
    let fired = 0;
    const mk = () => ({ ...tg(1, 'same'), send: async () => { fired++; return { message_id: 1 }; } });
    const r1 = await sendOnce(heart, ledger, mk());
    const r2 = await sendOnce(heart, ledger, mk());
    expect(r1.sent).toBe(true);
    expect(r2).toEqual({ sent: false, reason: 'deduped' });
    expect(fired).toBe(1);
  });

  it('NEVER fires the send on a stale fence', async () => {
    store.advance(61_000);
    await heart.reclaimExpired();
    await heart.acquire(RUN_ID, 'worker-B', 60);
    let fired = 0;
    const res = await sendOnce(heart, ledger, { ...tg(1, 'x'), send: async () => { fired++; return { message_id: 1 }; } });
    expect(res).toEqual({ sent: false, reason: 'fence-rejected' });
    expect(fired).toBe(0);
  });

  it('crash after send -> reconcilable dispatched row; retry dedupes, no resend', async () => {
    const ek = effectKey('telegram', { chatId: 1, text: 'crash' });
    await ledger.claimIntent({ runId: RUN_ID, effectKey: ek, channel: 'telegram', payloadDigest: 'sha256:x' });
    await ledger.markDispatched({ runId: RUN_ID, effectKey: ek, fenceOwner: fence.owner, fenceExpiresAt: fence.leaseExpiresAt });
    expect([...client.rows.values()][0].state).toBe('dispatched');

    store.advance(61_000);
    const stale = await ledger.findStaleDispatched(store.now().toISOString());
    expect(stale.map((r) => r.effect_key)).toContain(ek);

    let fired = 0;
    const res = await sendOnce(heart, ledger, {
      fence, channel: 'telegram', effectKey: ek, payload: { chatId: 1, text: 'crash' },
      send: async () => { fired++; return { message_id: 9 }; }, toExternalRef: (r: { message_id: number }) => ({ message_id: r.message_id }),
    });
    expect(res).toEqual({ sent: false, reason: 'deduped' });
    expect(fired).toBe(0);
  });
});

describe('effectKey', () => {
  it('is deterministic and identity-order independent', () => {
    expect(effectKey('telegram', { chatId: 1, text: 'a' })).toBe(effectKey('telegram', { text: 'a', chatId: 1 }));
    expect(effectKey('telegram', { chatId: 1, text: 'a' })).not.toBe(effectKey('telegram', { chatId: 1, text: 'b' }));
  });
});
