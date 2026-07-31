import { test, beforeAll, beforeEach } from 'vitest';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Isolate ZOE_HOME before the app modules load (same pattern as inbox-ingest.test).
const TMP = join(tmpdir(), `zoe-ns-test-${process.pid}-${Date.now()}`);
process.env.ZOE_HOME = TMP;

type MemMod = typeof import('../memory');
let mem: MemMod;

beforeAll(async () => {
  await fs.mkdir(TMP, { recursive: true });
  mem = await import('../memory');
});

beforeEach(async () => {
  // Clear all inbox_context logs between tests.
  for (const f of ['inbox_context.jsonl', 'inbox_context.wavewarz.jsonl', 'inbox_context.sparkz.jsonl']) {
    await fs.rm(join(TMP, f), { force: true });
  }
});

test('no namespace writes/reads the shared ZOE log (unchanged)', async () => {
  await mem.appendInboxContext({ source_id: 'z1', summary: 'zoe mail' });
  const rows = await mem.readInboxContext(10);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].source_id, 'z1');
  // the shared file exists
  const shared = await fs.readFile(join(TMP, 'inbox_context.jsonl'), 'utf8');
  assert.ok(shared.includes('z1'));
});

test('two namespaces do NOT cross-contaminate (the doc 2159 guarantee)', async () => {
  await mem.appendInboxContext({ source_id: 'w1', summary: 'wavewarz mail' }, 'wavewarz');
  await mem.appendInboxContext({ source_id: 's1', summary: 'sparkz mail' }, 'sparkz');
  await mem.appendInboxContext({ source_id: 'z1', summary: 'zoe mail' }); // shared

  const ww = await mem.readInboxContext(10, 'wavewarz');
  const sp = await mem.readInboxContext(10, 'sparkz');
  const zoe = await mem.readInboxContext(10);

  assert.deepEqual(ww.map((r) => r.source_id), ['w1'], 'wavewarz sees only its own');
  assert.deepEqual(sp.map((r) => r.source_id), ['s1'], 'sparkz sees only its own');
  assert.deepEqual(zoe.map((r) => r.source_id), ['z1'], 'ZOE shared log has only ZOE mail, not the brands');

  // separate files on disk
  assert.ok(await fs.readFile(join(TMP, 'inbox_context.wavewarz.jsonl'), 'utf8'));
  assert.ok(await fs.readFile(join(TMP, 'inbox_context.sparkz.jsonl'), 'utf8'));
});

test('dedup is per-namespace', async () => {
  await mem.appendInboxContext({ source_id: 'x1', summary: 'a' }, 'wavewarz');
  const wwIds = await mem.readIngestedSourceIds('wavewarz');
  const zoeIds = await mem.readIngestedSourceIds();
  assert.ok(wwIds.has('x1'), 'wavewarz dedup set has its id');
  assert.ok(!zoeIds.has('x1'), 'ZOE dedup set does NOT see the wavewarz id');
});
