import { test } from 'node:test';
import assert from 'node:assert/strict';

import { runCrmOps, summarizeCrmResults } from '../crm.ts';
import type { CrmOp } from '../types.ts';

// A minimal chainable fake of the supabase-js client, capturing every
// upsert/insert so we can assert the C-H1 / C-M2 guards on the direct-write
// path. No network, no real DB.
interface Recorded {
  table: string;
  kind: 'upsert' | 'insert' | 'select-like';
  row?: Record<string, unknown>;
}

function makeFakeDb(opts: { existingSlugs?: string[]; contactId?: string } = {}) {
  const calls: Recorded[] = [];
  const existing = opts.existingSlugs ?? [];
  const contactId = opts.contactId ?? 'contact-1';

  function query(table: string) {
    let row: Record<string, unknown> | undefined;
    const builder: Record<string, unknown> = {
      upsert(r: Record<string, unknown>) {
        row = r;
        calls.push({ table, kind: 'upsert', row: r });
        return builder;
      },
      insert(r: Record<string, unknown>) {
        row = r;
        calls.push({ table, kind: 'insert', row: r });
        return builder;
      },
      select() {
        return builder;
      },
      like(_column: string, pattern: string) {
        calls.push({ table, kind: 'select-like' });
        const base = pattern.replace(/%$/, '');
        const data = existing
          .filter((s) => s.startsWith(base))
          .map((slug) => ({ slug }));
        return Promise.resolve({ data, error: null });
      },
      single() {
        return Promise.resolve({
          data: { id: contactId, slug: row?.slug ?? null },
          error: null,
        });
      },
    };
    return builder;
  }

  return { client: { from: query } as never, calls };
}

function op(overrides: Partial<CrmOp['contact']> = {}, interaction: Partial<CrmOp['interaction']> = {}): CrmOp {
  return {
    op: 'log_crm',
    contact: { name: 'Test Person', ...overrides },
    interaction: { type: 'note', ...interaction },
  };
}

test('C-H1: a bot write never publishes — is_public dropped, interaction forced private', async () => {
  const { client, calls } = makeFakeDb();
  const results = await runCrmOps(
    [op({ farcaster_handle: 'zaal', is_public: true }, { visibility: 'public', public_summary: 'x' })],
    client,
  );
  assert.equal(results[0].status, 'logged');

  const contactWrite = calls.find((c) => c.table === 'crm_contacts');
  assert.ok(contactWrite);
  assert.equal('is_public' in (contactWrite.row ?? {}), false);

  const interactionWrite = calls.find((c) => c.table === 'crm_interactions');
  assert.ok(interactionWrite);
  assert.equal(interactionWrite.row?.visibility, 'private');
  assert.equal(interactionWrite.row?.created_by, 'zoe');
  assert.equal(interactionWrite.row?.source, 'zoe');
});

test('C-M2: a name-only contact INSERTs with a uniquified slug (no overwrite)', async () => {
  const { client, calls } = makeFakeDb({ existingSlugs: ['test-person'] });
  const results = await runCrmOps([op()], client); // no handle => name-only
  assert.equal(results[0].status, 'logged');

  const contactWrite = calls.find((c) => c.table === 'crm_contacts' && c.kind !== 'select-like');
  assert.ok(contactWrite);
  assert.equal(contactWrite.kind, 'insert'); // never upsert for a name-only key
  assert.equal(contactWrite.row?.slug, 'test-person-2');
});

test('a contact WITH a handle upserts (stable, idempotent)', async () => {
  const { client, calls } = makeFakeDb();
  await runCrmOps([op({ x_handle: 'someone' })], client);
  const contactWrite = calls.find((c) => c.table === 'crm_contacts');
  assert.equal(contactWrite?.kind, 'upsert');
});

test('runCrmOps([]) is a no-op', async () => {
  const results = await runCrmOps([]);
  assert.deepEqual(results, []);
});

test('summarizeCrmResults renders per-status lines', () => {
  const o = op({ farcaster_handle: 'a' });
  const text = summarizeCrmResults([
    { op: o, status: 'logged', contact_id: 'c1' },
    { op: op({ name: 'Two' }), status: 'failed', error: 'boom' },
  ]);
  assert.match(text, /Logged Test Person to CRM\./);
  assert.match(text, /CRM write for Two failed: boom/);
});
