/**
 * The replay guard.
 *
 * Execution happens BEFORE the caller's freshness re-check and before the
 * receipt that marks a comment answered is posted. Anything failing in that
 * window - an 8s PATCH timeout, a concurrent app write, a restart - leaves the
 * board already changed and the comment still unanswered, so the hourly cron
 * re-runs it. `create_task` INSERTs, so that replay used to add a duplicate
 * task every hour with nothing to stop it.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { executeBoardComment, type ExecContext } from '../board-command-executor';

const ctx: ExecContext = {
  taskId: 'task-uuid-1',
  taskTitle: 'ship the thing',
  commentId: 'comment-abc',
  commentContent: '@zoe make a new todo called zartizen ui cleanup and close this one',
  commentAuthor: 'Zaal',
};

/** The extraction step the executor injects - fixed output, no model. */
const extract = (json: unknown) => async () => JSON.stringify(json);

const CREATE_AND_CLOSE = [
  { action: 'create_task', title: 'zartizen ui cleanup' },
  { action: 'close_task', taskRef: 'this' },
];

/**
 * A fetch double that records calls and answers by URL shape.
 * `existingRows` is what the legacy_source lookup finds.
 */
function makeFetch(opts: { existingRows?: unknown[]; lookupOk?: boolean } = {}) {
  const calls: Array<{ url: string; method: string }> = [];
  const impl = (async (url: string | URL | Request, init?: RequestInit) => {
    const u = String(url);
    const method = init?.method ?? 'GET';
    calls.push({ url: u, method });
    if (method === 'GET' && u.includes('legacy_source=eq.')) {
      if (opts.lookupOk === false) return new Response('boom', { status: 500 });
      return Response.json(opts.existingRows ?? []);
    }
    if (method === 'POST') return Response.json([{ id: 'new-uuid', legacy_id: '9247' }]);
    return new Response(null, { status: 204 });
  }) as unknown as typeof fetch;
  return { impl, calls };
}

const creates = (calls: Array<{ url: string; method: string }>) =>
  calls.filter((c) => c.method === 'POST' && c.url.includes('/tasks'));

beforeEach(() => {
  process.env.COWORK_TRACKER_URL = 'https://board.example';
  process.env.COWORK_TRACKER_KEY = 'test-key';
});

afterEach(() => {
  delete process.env.COWORK_TRACKER_URL;
  delete process.env.COWORK_TRACKER_KEY;
  vi.restoreAllMocks();
});

describe('replay guard', () => {
  it('creates the task on the first run', async () => {
    const { impl, calls } = makeFetch({ existingRows: [] });
    const res = await executeBoardComment(ctx, extract(CREATE_AND_CLOSE), impl);
    expect(creates(calls)).toHaveLength(1);
    expect(res?.executed).toBe(2);
  });

  // The bug: without this guard the same comment re-created the task every
  // hour for as long as the receipt failed to post.
  it('creates nothing on a re-run of the same comment', async () => {
    const { impl, calls } = makeFetch({ existingRows: [{ id: 'already-there' }] });
    const res = await executeBoardComment(ctx, extract(CREATE_AND_CLOSE), impl);
    expect(creates(calls)).toHaveLength(0);
    expect(res?.receipt).toContain('already applied');
    expect(res?.executed).toBe(0);
  });

  // A re-run must not re-apply the OTHER actions either - the guard runs before
  // any of them, so a replay is a complete no-op, not a partial one.
  it('does not re-close on a re-run', async () => {
    const { impl, calls } = makeFetch({ existingRows: [{ id: 'already-there' }] });
    await executeBoardComment(ctx, extract(CREATE_AND_CLOSE), impl);
    expect(calls.filter((c) => c.method === 'PATCH')).toHaveLength(0);
  });

  // Fail closed. Running could duplicate; replying conversationally would mark
  // the comment handled and lose the command. So: do nothing, retry next tick.
  it('skips the tick when the lookup itself fails', async () => {
    const { impl, calls } = makeFetch({ lookupOk: false });
    const res = await executeBoardComment(ctx, extract(CREATE_AND_CLOSE), impl);
    expect(res?.skipped).toBeTruthy();
    expect(creates(calls)).toHaveLength(0);
    expect(calls.filter((c) => c.method === 'PATCH')).toHaveLength(0);
  });

  // close/assign are idempotent under replay, so a comment with no create pays
  // for no extra round-trip.
  it('does not look up when the comment creates nothing', async () => {
    const { impl, calls } = makeFetch();
    const res = await executeBoardComment(
      ctx,
      extract([{ action: 'close_task', taskRef: 'this' }]),
      impl,
    );
    expect(calls.filter((c) => c.url.includes('legacy_source=eq.'))).toHaveLength(0);
    expect(res?.executed).toBe(1);
  });
});

describe('authorization still gates everything', () => {
  it('a non-commander executes nothing and never queries', async () => {
    const { impl, calls } = makeFetch();
    const res = await executeBoardComment(
      { ...ctx, commentAuthor: 'Iman' },
      extract(CREATE_AND_CLOSE),
      impl,
    );
    expect(res).toBeNull();
    expect(calls).toHaveLength(0);
  });
});
