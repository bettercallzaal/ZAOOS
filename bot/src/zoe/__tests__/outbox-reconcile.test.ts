import { describe, it, expect, beforeEach } from 'vitest';
import {
  DurableEffectLedger,
  reconcileOutbox,
  type OutboxClient,
  type IntentRow,
  type ChannelProbe,
} from '../../../../packages/heart-fleet/src/index';

/**
 * Outbox reconciler (doc 2145, the crash-window closer). Proves the three
 * probe outcomes on a fake effect_intents store:
 *  - 'sent'      -> the stale row is committed with the recovered evidence
 *  - 'not-sent'  -> reopened for retry
 *  - 'unknown'   -> NEVER resent; abandoned only past the attempt ceiling
 */

interface Row {
  run_id: string; effect_key: string; state: string; channel: string; payload_digest: string;
  fence_owner: string | null; fence_expires_at: string | null; external_ref: Record<string, unknown> | null;
  attempts: number; last_error: string | null; created_at: string; committed_at: string | null;
}

class FakeOutboxClient implements OutboxClient {
  rows = new Map<string, Row>();
  private key(r: string, e: string) { return `${r}::${e}`; }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from(table: string): any {
    const self = this;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const q: any = {
      _table: table, _op: null, _values: {}, _eq: {}, _in: {}, _lt: {},
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
  private _match(row: Row, q: any): boolean {
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
    return { data: [...this.rows.values()].filter((r) => this._match(r, q)), error: null };
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _run(q: any) {
    if (q._table === 'outbox_dispatch_log') return { data: { id: 'log' }, error: null };
    if (q._op === 'insert') {
      const k = this.key(String(q._values.run_id), String(q._values.effect_key));
      if (this.rows.has(k)) return { data: null, error: { code: '23505', message: 'dup' } };
      this.rows.set(k, { fence_owner: null, fence_expires_at: null, external_ref: null, attempts: 0, last_error: null, committed_at: null, ...(q._values as Partial<Row>) } as Row);
      return { data: { run_id: q._values.run_id }, error: null };
    }
    for (const [k, row] of this.rows) {
      if (row.run_id === q._eq.run_id && row.effect_key === q._eq.effect_key) {
        if (!this._match(row, q)) return { data: null, error: null };
        this.rows.set(k, { ...row, ...(q._values as Partial<Row>) });
        return { data: { run_id: row.run_id }, error: null };
      }
    }
    return { data: null, error: null };
  }
  seedDispatched(effectKey: string, channel: string, attempts: number) {
    const runId = 'run-1';
    this.rows.set(this.key(runId, effectKey), {
      run_id: runId, effect_key: effectKey, state: 'dispatched', channel, payload_digest: 'd',
      fence_owner: 'dead-worker', fence_expires_at: '2026-07-30T09:00:00.000Z', external_ref: null,
      attempts, last_error: null, created_at: '2026-07-30T08:00:00.000Z', committed_at: null,
    });
  }
}

const NOW = () => new Date('2026-07-30T10:00:00.000Z'); // past the seeded fence expiry

let client: FakeOutboxClient;
let ledger: DurableEffectLedger;

beforeEach(() => {
  client = new FakeOutboxClient();
  ledger = new DurableEffectLedger({ client, now: NOW });
});

describe('reconcileOutbox', () => {
  it("commits a stale row the probe proves was 'sent'", async () => {
    client.seedDispatched('e-sent', 'farcaster', 1);
    const probe: ChannelProbe = async () => ({ status: 'sent', externalRef: { cast_hash: '0xabc' } });
    const s = await reconcileOutbox(ledger, { probes: { farcaster: probe }, now: NOW });
    expect(s.committed).toBe(1);
    const row = [...client.rows.values()][0];
    expect(row.state).toBe('committed');
    expect(row.external_ref).toEqual({ cast_hash: '0xabc' });
  });

  it("reopens a stale row the probe proves was 'not-sent'", async () => {
    client.seedDispatched('e-notsent', 'farcaster', 1);
    const probe: ChannelProbe = async () => ({ status: 'not-sent' });
    const s = await reconcileOutbox(ledger, { probes: { farcaster: probe }, now: NOW });
    expect(s.reopened).toBe(1);
    expect([...client.rows.values()][0].state).toBe('intent');
  });

  it("NEVER resends an 'unknown' row under the ceiling - leaves it dispatched", async () => {
    client.seedDispatched('e-unknown', 'telegram', 2); // no probe -> unknown, attempts < 5
    const s = await reconcileOutbox(ledger, { now: NOW }); // telegram has no probe
    expect(s.left).toBe(1);
    expect(s.abandoned).toBe(0);
    expect([...client.rows.values()][0].state).toBe('dispatched'); // untouched, revisited next run
  });

  it("abandons an 'unknown' row past the ceiling (at-most-once: never resent)", async () => {
    client.seedDispatched('e-old', 'telegram', 5); // attempts >= maxAttempts
    const s = await reconcileOutbox(ledger, { maxAttempts: 5, now: NOW });
    expect(s.abandoned).toBe(1);
    const row = [...client.rows.values()][0];
    expect(row.state).toBe('abandoned');
    expect(row.last_error).toContain('at-most-once');
  });

  it("counts each unresolved pass so an 'unknown' row reaches the ceiling (production starts at attempts=0)", async () => {
    // claimIntent inserts attempts=0 and nothing else ever writes the column, so
    // a real stale row starts here. Without per-pass counting the ceiling is
    // unreachable and the row is revisited forever, never reaching a terminal state.
    client.seedDispatched('e-real', 'telegram', 0);

    const first = await reconcileOutbox(ledger, { maxAttempts: 2, now: NOW });
    expect(first.left).toBe(1);
    expect([...client.rows.values()][0].attempts).toBe(1);

    const second = await reconcileOutbox(ledger, { maxAttempts: 2, now: NOW });
    expect(second.left).toBe(1);
    expect([...client.rows.values()][0].attempts).toBe(2);

    const third = await reconcileOutbox(ledger, { maxAttempts: 2, now: NOW });
    expect(third.abandoned).toBe(1);
    expect([...client.rows.values()][0].state).toBe('abandoned');
  });

  it('scans nothing when there are no stale dispatched rows', async () => {
    const s = await reconcileOutbox(ledger, { now: NOW });
    expect(s.scanned).toBe(0);
  });
});
