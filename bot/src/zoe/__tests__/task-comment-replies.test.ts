import { test, beforeEach, afterEach } from 'vitest';
import assert from 'node:assert/strict';
import {
  findUnansweredMentions,
  runTaskCommentReplies,
  boardConfigured,
  type BoardTask,
  type BoardComment,
} from '../task-comment-replies';

function task(id: string, comments: BoardComment[]): BoardTask {
  return { id, legacy_id: null, title: `Task ${id}`, notes: null, status: 'todo', metadata: { comments } };
}

test('findUnansweredMentions: no comments -> empty', () => {
  assert.deepEqual(findUnansweredMentions([task('a', [])]), []);
});

test('findUnansweredMentions: an @zoe comment with no reply is surfaced', () => {
  const found = findUnansweredMentions([
    task('a', [{ id: 'c1', userId: 'iman', content: '@zoe how do I test this?' }]),
  ]);
  assert.equal(found.length, 1);
  assert.equal(found[0].comment.id, 'c1');
});

test('findUnansweredMentions: an @zoe comment already answered by ZOE is skipped', () => {
  const found = findUnansweredMentions([
    task('a', [
      { id: 'c1', userId: 'iman', content: '@zoe status?' },
      { id: 'c2', userId: 'zoe', displayName: 'ZOE', content: 'It shipped in PR #12.' },
    ]),
  ]);
  assert.equal(found.length, 0);
});

test('findUnansweredMentions: ZOE tagging itself is ignored', () => {
  const found = findUnansweredMentions([
    task('a', [{ id: 'c1', userId: 'zoe', content: 'reminder @zoe follow up' }]),
  ]);
  assert.equal(found.length, 0);
});

test('findUnansweredMentions: a plain comment (no @zoe) is ignored', () => {
  const found = findUnansweredMentions([
    task('a', [{ id: 'c1', userId: 'iman', content: 'looks good to me' }]),
  ]);
  assert.equal(found.length, 0);
});

test('findUnansweredMentions: re-mention after a ZOE reply is surfaced again', () => {
  const found = findUnansweredMentions([
    task('a', [
      { id: 'c1', userId: 'iman', content: '@zoe q1' },
      { id: 'c2', userId: 'zoe', content: 'a1' },
      { id: 'c3', userId: 'iman', content: '@zoe follow-up q2' },
    ]),
  ]);
  assert.equal(found.length, 1);
  assert.equal(found[0].comment.id, 'c3');
});

// --- runTaskCommentReplies integration (mocked fetch + model) ---

const ENV = { ...process.env };
beforeEach(() => {
  process.env.COWORK_TRACKER_URL = 'https://x.supabase.co';
  process.env.COWORK_TRACKER_KEY = 'test-key';
});
afterEach(() => {
  process.env = { ...ENV };
});

/** Fake fetch: returns `list` for the candidate/by-id GETs, records PATCH bodies. */
function makeFetch(list: BoardTask[], patched: unknown[]): typeof fetch {
  return (async (url: string, init?: RequestInit) => {
    if (init?.method === 'PATCH') {
      patched.push(JSON.parse(String(init.body)));
      return { ok: true, status: 200 } as Response;
    }
    // GET by-id returns the single matching task; candidate GET returns all.
    const m = /id=eq\.([^&]+)/.exec(url);
    const body = m ? list.filter((t) => t.id === m[1]) : list;
    return { ok: true, status: 200, json: async () => body } as unknown as Response;
  }) as unknown as typeof fetch;
}

const fakeCall = (async () =>
  ({ text: 'Here is the answer about the task.', isError: false })) as never;

test('boardConfigured reflects env', () => {
  assert.equal(boardConfigured(), true);
  delete process.env.COWORK_TRACKER_KEY;
  assert.equal(boardConfigured(), false);
});

test('runTaskCommentReplies is a no-op when unconfigured', async () => {
  delete process.env.COWORK_TRACKER_URL;
  const r = await runTaskCommentReplies(makeFetch([], []), fakeCall);
  assert.deepEqual(r, { answered: 0, scanned: 0 });
});

test('runTaskCommentReplies answers an unanswered @zoe mention and PATCHes a reply', async () => {
  const patched: unknown[] = [];
  const list = [task('t1', [{ id: 'c1', userId: 'iman', content: '@zoe whats left here?' }])];
  const r = await runTaskCommentReplies(makeFetch(list, patched), fakeCall);
  assert.equal(r.answered, 1);
  assert.equal(patched.length, 1);
  const md = (patched[0] as { metadata: { comments: Array<{ userId: string; content: string }> } }).metadata;
  assert.equal(md.comments.length, 2, 'original + ZOE reply');
  assert.equal(md.comments[1].userId, 'zoe');
  assert.match(md.comments[1].content, /answer about the task/);
});

test('runTaskCommentReplies does not re-answer an already-answered mention', async () => {
  const patched: unknown[] = [];
  const list = [
    task('t1', [
      { id: 'c1', userId: 'iman', content: '@zoe done?' },
      { id: 'c2', userId: 'zoe', content: 'yes' },
    ]),
  ];
  const r = await runTaskCommentReplies(makeFetch(list, patched), fakeCall);
  assert.equal(r.answered, 0);
  assert.equal(patched.length, 0);
});
