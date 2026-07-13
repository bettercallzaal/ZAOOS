import { test, beforeAll, beforeEach } from 'vitest';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Point ZOE_HOME at a throwaway dir BEFORE the app modules load, so the ingest
// log never touches the real ~/.zao/zoe. This runs at module-eval (after the
// static imports above, before any hook), and the app modules are imported
// dynamically in beforeAll so they read this value.
const TMP = join(tmpdir(), `zoe-inbox-test-${process.pid}-${Date.now()}`);
process.env.ZOE_HOME = TMP;

type IngestMod = typeof import('../inbox-ingest');
type MemMod = typeof import('../memory');
let ingest: IngestMod;
let mem: MemMod;

/** Minimal Response stand-in for an injected fetch. */
function fakeFetch(messages: unknown[], ok = true, status = 200): typeof fetch {
  return (async () =>
    ({
      ok,
      status,
      json: async () => ({ messages }),
    }) as unknown as Response) as unknown as typeof fetch;
}

beforeAll(async () => {
  await fs.mkdir(TMP, { recursive: true });
  ingest = await import('../inbox-ingest');
  mem = await import('../memory');
});

beforeEach(async () => {
  // Fresh log each test so dedup + counts are deterministic.
  await fs.rm(join(TMP, 'inbox_context.jsonl'), { force: true });
});

test('synthesizeSummary redacts a third-party email in the from + snippet', () => {
  const line = ingest.synthesizeSummary({
    from: 'Jane Doe <jane.doe@gmail.com>',
    subject: 'quick intro',
    preview: 'call me at 415-555-0100 when free',
  });
  assert.ok(!line.includes('jane.doe@gmail.com'), 'personal email must be redacted');
  assert.ok(!line.includes('415-555-0100'), 'phone must be redacted');
  assert.ok(line.includes('<redacted-email>'), 'email placeholder present');
  assert.ok(line.includes('quick intro'), 'subject preserved');
});

test('synthesizeSummary keeps an allowlisted ZAO email', () => {
  const line = ingest.synthesizeSummary({
    from: 'hello@thezao.com',
    subject: 'newsletter draft',
  });
  assert.ok(line.includes('hello@thezao.com'), 'allowlisted email survives');
});

test('ingestInbox is a no-op without AGENTMAIL_API_KEY', async () => {
  const prev = process.env.AGENTMAIL_API_KEY;
  delete process.env.AGENTMAIL_API_KEY;
  const r = await ingest.ingestInbox(fakeFetch([{ id: 'a', subject: 'x' }]));
  assert.deepEqual(r, { ingested: 0, skipped: 0, scanned: 0 });
  if (prev) process.env.AGENTMAIL_API_KEY = prev;
});

test('ingestInbox folds fresh mail and dedups on a second pass', async () => {
  process.env.AGENTMAIL_API_KEY = 'test-key';
  const msgs = [
    { id: 'm1', from: 'a@thezao.com', subject: 'one', preview: 'first' },
    { id: 'm2', from: 'b@thezao.com', subject: 'two', preview: 'second' },
  ];

  const first = await ingest.ingestInbox(fakeFetch(msgs));
  assert.equal(first.ingested, 2, 'both ingested on first pass');

  const stored = await mem.readInboxContext(10);
  assert.equal(stored.length, 2);

  // Same payload again -> nothing new.
  const second = await ingest.ingestInbox(fakeFetch(msgs));
  assert.equal(second.ingested, 0, 'dedup by source id');
  assert.equal(second.skipped, 0);

  // A new message alongside the old ones -> only the new one ingests.
  const third = await ingest.ingestInbox(
    fakeFetch([...msgs, { id: 'm3', from: 'c@thezao.com', subject: 'three', preview: 'third' }]),
  );
  assert.equal(third.ingested, 1, 'only the unseen message ingests');
});

test('ingestInbox caps at MAX_PER_TICK (15) new messages per pass', async () => {
  process.env.AGENTMAIL_API_KEY = 'test-key';
  const many = Array.from({ length: 40 }, (_, i) => ({
    id: `bulk-${i}`,
    from: `s${i}@thezao.com`,
    subject: `subject ${i}`,
    preview: `body ${i}`,
  }));
  const r = await ingest.ingestInbox(fakeFetch(many));
  assert.equal(r.ingested, 15, 'per-tick cap enforced');
});

test('ingestInbox survives a non-ok fetch without throwing', async () => {
  process.env.AGENTMAIL_API_KEY = 'test-key';
  const r = await ingest.ingestInbox(fakeFetch([], false, 500));
  assert.equal(r.ingested, 0);
});
