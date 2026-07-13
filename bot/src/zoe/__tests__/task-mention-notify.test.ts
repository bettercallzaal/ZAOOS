import { test, beforeAll, beforeEach } from 'vitest';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const TMP = join(tmpdir(), `zoe-mention-test-${process.pid}-${Date.now()}`);
process.env.ZOE_HOME = TMP;

type Mod = typeof import('../task-mention-notify');
let m: Mod;

beforeAll(async () => {
  await fs.mkdir(TMP, { recursive: true });
  m = await import('../task-mention-notify');
});

beforeEach(async () => {
  await fs.rm(join(TMP, 'mention_notify_seen.jsonl'), { force: true });
  process.env.COWORK_TRACKER_URL = 'https://x.supabase.co';
  process.env.COWORK_TRACKER_KEY = 'k';
  delete process.env.MENTION_NOTIFY_MAP;
});

function task(id: string, legacy: string | null, comments: import('../task-mention-notify').BoardComment[]) {
  return { id, legacy_id: legacy, title: `Task ${id}`, metadata: { comments } };
}

function fakeFetch(tasks: unknown[]): typeof fetch {
  return (async () =>
    ({ ok: true, status: 200, json: async () => tasks }) as unknown as Response) as unknown as typeof fetch;
}

test('parseMentions extracts handles, drops bots/broadcast + dups', () => {
  assert.deepEqual(m.parseMentions('hey @iman and @zaal, cc @zoe @here @iman'), ['iman', 'zaal']);
  assert.deepEqual(m.parseMentions('no mentions here'), []);
});

test('resolveDestinations parses env map + adds zaal default', () => {
  process.env.MENTION_NOTIFY_MAP = JSON.stringify({ iman: { chatId: -100, topicId: 7 } });
  const d = m.resolveDestinations(555);
  assert.equal(d.iman.chatId, -100);
  assert.equal(d.iman.topicId, 7);
  assert.equal(d.zaal.chatId, 555);
});

test('resolveDestinations survives a malformed map', () => {
  process.env.MENTION_NOTIFY_MAP = '{not json';
  const d = m.resolveDestinations(9);
  assert.deepEqual(d, { zaal: { chatId: 9 } });
});

test('findNewMentions: routes only mapped handles, skips self + seen', () => {
  const dests = { iman: { chatId: 1 }, zaal: { chatId: 2 } };
  const tasks = [
    task('t1', '10', [
      { id: 'c1', userId: 'zaal', content: '@iman can you check this?' },
      { id: 'c2', userId: 'iman', content: '@iman note to self' }, // self-mention -> skip
      { id: 'c3', userId: 'zaal', content: '@ghost unknown handle' }, // no route -> skip
    ]),
  ];
  const found = m.findNewMentions(tasks, dests, new Set());
  assert.equal(found.length, 1);
  assert.equal(found[0].handle, 'iman');
  assert.equal(found[0].comment.id, 'c1');

  // Once seen, it's skipped.
  const seen = new Set(['c1:iman']);
  assert.equal(m.findNewMentions(tasks, dests, seen).length, 0);
});

test('runMentionNotify sends a ping and dedups on the next pass', async () => {
  process.env.MENTION_NOTIFY_MAP = JSON.stringify({ iman: { chatId: -100, topicId: 5 } });
  const sent: Array<{ chatId: number; text: string; threadId?: number }> = [];
  const send = async (chatId: number, text: string, opts?: { threadId?: number }) => {
    sent.push({ chatId, text, threadId: opts?.threadId });
  };
  const tasks = [task('t1', '11', [{ id: 'c1', userId: 'zaal', content: '@iman look here' }])];

  const r1 = await m.runMentionNotify(send, 999, fakeFetch(tasks));
  assert.equal(r1.notified, 1);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].chatId, -100);
  assert.equal(sent[0].threadId, 5);
  assert.match(sent[0].text, /mentioned you on task #11/);

  const r2 = await m.runMentionNotify(send, 999, fakeFetch(tasks));
  assert.equal(r2.notified, 0, 'deduped');
  assert.equal(sent.length, 1);
});

test('runMentionNotify is a no-op with no board config', async () => {
  delete process.env.COWORK_TRACKER_URL;
  const r = await m.runMentionNotify(async () => {}, 1, fakeFetch([]));
  assert.deepEqual(r, { notified: 0, scanned: 0 });
});

test('runMentionNotify does not mark seen when the send fails (retries next tick)', async () => {
  process.env.MENTION_NOTIFY_MAP = JSON.stringify({ iman: { chatId: 1 } });
  const failing = async () => {
    throw new Error('telegram down');
  };
  const tasks = [task('t1', '12', [{ id: 'c9', userId: 'zaal', content: '@iman ping' }])];
  const r1 = await m.runMentionNotify(failing, 1, fakeFetch(tasks));
  assert.equal(r1.notified, 0);
  // Next tick with a working sender should still find + send it.
  const sent: number[] = [];
  const ok = async (chatId: number) => {
    sent.push(chatId);
  };
  const r2 = await m.runMentionNotify(ok, 1, fakeFetch(tasks));
  assert.equal(r2.notified, 1);
  assert.equal(sent.length, 1);
});
