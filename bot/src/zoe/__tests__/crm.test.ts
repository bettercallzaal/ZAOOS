import { test } from 'vitest';
import assert from 'node:assert/strict';

import { runCrmOps, summarizeCrmResults } from '../crm.ts';
import type { CrmOp } from '../types.ts';

// Minimal chainable fake of the supabase-js client, capturing every insert so we
// can assert the direct-write path. runCrmOps now uses:
//   contacts:    .select('id').eq('name', n).limit(1).maybeSingle()  (dedup by name)
//                .insert(row).select('id').single()                   (new contact)
//   contact_log: .insert(row)  (awaited directly)                     (interaction)
// No network, no real DB.
interface Recorded {
  table: string;
  kind: 'insert';
  row?: Record<string, unknown>;
}

function makeFakeDb(opts: { existingContact?: { id: string } | null; contactId?: string } = {}) {
  const calls: Recorded[] = [];
  const contactId = opts.contactId ?? 'contact-1';
  const existingContact = opts.existingContact ?? null;

  function query(table: string) {
    let insertedRow: Record<string, unknown> | undefined;
    const builder: Record<string, unknown> = {
      insert(r: Record<string, unknown>) {
        insertedRow = r;
        calls.push({ table, kind: 'insert', row: r });
        return builder;
      },
      select() {
        return builder;
      },
      eq() {
        return builder;
      },
      limit() {
        return builder;
      },
      maybeSingle() {
        return Promise.resolve({ data: existingContact, error: null });
      },
      single() {
        return Promise.resolve({ data: { id: contactId }, error: null });
      },
      // thenable so `await from('contact_log').insert(...)` resolves.
      then(resolve: (v: { data: unknown; error: null }) => void) {
        resolve({ data: insertedRow ?? null, error: null });
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

test('C-H1: a bot write never publishes — is_public dropped, interaction stays internal', async () => {
  const { client, calls } = makeFakeDb({ existingContact: null });
  const results = await runCrmOps(
    [op({ farcaster_handle: 'zaal', is_public: true }, { public_summary: 'x' })],
    client,
  );
  assert.equal(results[0].status, 'logged');

  const contactWrite = calls.find((c) => c.table === 'contacts');
  assert.ok(contactWrite);
  assert.equal('is_public' in (contactWrite.row ?? {}), false);
  assert.equal(contactWrite.row?.source, 'zoe');
  // the handle rides into tags, not a dedicated column
  assert.ok(
    Array.isArray(contactWrite.row?.tags) && (contactWrite.row?.tags as string[]).includes('fc:zaal'),
  );

  const interactionWrite = calls.find((c) => c.table === 'contact_log');
  assert.ok(interactionWrite);
  // contact_log has no visibility/is_public column: internal by design.
  assert.equal('visibility' in (interactionWrite.row ?? {}), false);
  assert.equal(interactionWrite.row?.contact, 'Test Person');
});

test('an existing contact is reused (dedup by name, no duplicate insert)', async () => {
  const { client, calls } = makeFakeDb({ existingContact: { id: 'existing-1' } });
  const results = await runCrmOps([op()], client);
  assert.equal(results[0].status, 'logged');
  assert.equal(results[0].contact_id, 'existing-1');
  // no contacts INSERT when the person already exists
  assert.equal(
    calls.some((c) => c.table === 'contacts'),
    false,
  );
  // interaction is still logged against the existing contact
  assert.ok(calls.find((c) => c.table === 'contact_log'));
});

test('a new contact is INSERTed into contacts with fields mapped + handles in tags', async () => {
  const { client, calls } = makeFakeDb({ existingContact: null });
  await runCrmOps([op({ x_handle: 'someone', org: 'Acme', role: 'Founder' })], client);
  const contactWrite = calls.find((c) => c.table === 'contacts');
  assert.ok(contactWrite);
  assert.equal(contactWrite.row?.name, 'Test Person');
  assert.equal(contactWrite.row?.company, 'Acme'); // org -> company
  assert.equal(contactWrite.row?.role, 'Founder');
  assert.ok((contactWrite.row?.tags as string[]).includes('x:someone'));
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
