/**
 * board-command-executor.ts - apply the commands parsed out of an @zoe comment.
 *
 * The split is deliberate. board-commands.ts is pure: it decides WHAT is a valid
 * command and WHO may issue one, and it is fully unit-tested. This file does the
 * IO, and holds no policy of its own - it refuses to act on anything the pure
 * layer has not already authorized.
 *
 * Every write here is reversible by design: a created task can be closed, a
 * closed task reopened, an assignment changed. There is no delete path, and
 * there never should be - a comment box is not a place from which rows should
 * be destroyable.
 */

import {
  parseCommands,
  renderReceipt,
  shouldExecute,
  EXTRACTION_PROMPT,
  type BoardCommand,
} from './board-commands';
import { featureRan } from './feature-ran';

export interface ExecContext {
  /** The task the comment lives on - "this one" in Zaal\'s phrasing. */
  taskId: string;
  taskTitle: string;
  commentId: string;
  commentContent: string;
  commentAuthor?: string | null;
}

export interface ExecResult {
  executed: number;
  receipt: string;
  /**
   * Set when this tick deliberately did nothing and the comment must be tried
   * again later. The caller must NOT fall through to the reply path on a
   * skip: answering conversationally marks the comment as handled, which would
   * throw the command away permanently.
   */
  skipped?: string;
}

/**
 * The `legacy_source` stamped on every task created from a comment.
 *
 * This doubles as the execution marker - see `alreadyExecuted`.
 */
export function commandSource(commentId: string): string {
  return `zoe-command:${commentId}`;
}

function cfg(): { root: string; headers: Record<string, string> } | null {
  const base = process.env.COWORK_TRACKER_URL;
  const key = process.env.COWORK_TRACKER_KEY;
  if (!base || !key) return null;
  return {
    root: base.replace(/\/$/, ''),
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
  };
}

/** Resolve a name slug to a team_members row id. Never guesses. */
async function resolveOwner(slug: string, fetchImpl: typeof fetch): Promise<string | null> {
  const c = cfg();
  if (!c) return null;
  try {
    const r = await fetchImpl(
      `${c.root}/rest/v1/team_members?select=id,legacy_owner&legacy_owner=ilike.${encodeURIComponent(slug)}&limit=1`,
      { headers: c.headers },
    );
    if (!r.ok) return null;
    const rows = (await r.json()) as Array<{ id: string }>;
    return rows[0]?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Has this comment already been executed on an earlier tick?
 *
 * WHY THIS IS NEEDED. Execution runs BEFORE the caller's freshness re-check and
 * before the receipt is posted, and the receipt is the only thing that marks a
 * comment as handled. So any failure between the two - `postReply` timing out
 * on its 8s AbortSignal, the row being PATCHed by the app in between, the
 * process restarting - leaves the board already mutated and the comment still
 * looking unanswered. The hourly cron then re-runs the whole comment.
 *
 * `close_task` and `assign_task` are idempotent under a replay (setting status
 * to 'done' twice, or the same owner_id twice, changes nothing the second
 * time). `create_task` is not: it INSERTs, so one transient failure produced a
 * duplicate task every hour, forever, with no unique constraint to stop it.
 *
 * The marker is the `legacy_source` already written on every created task, so
 * this needs no schema change - just a read of what the previous run left
 * behind.
 *
 * Returns 'unknown' when the lookup itself fails, which the caller treats as
 * "skip this tick and retry", never as "safe to run again".
 */
async function alreadyExecuted(
  commentId: string,
  fetchImpl: typeof fetch,
): Promise<boolean | 'unknown'> {
  const c = cfg();
  if (!c) return 'unknown';
  try {
    const r = await fetchImpl(
      `${c.root}/rest/v1/tasks?select=id&legacy_source=eq.${encodeURIComponent(commandSource(commentId))}&limit=1`,
      { headers: c.headers },
    );
    if (!r.ok) return 'unknown';
    const rows = (await r.json()) as unknown;
    return Array.isArray(rows) && rows.length > 0;
  } catch {
    return 'unknown';
  }
}

async function applyOne(
  cmd: BoardCommand,
  ctx: ExecContext,
  fetchImpl: typeof fetch,
): Promise<{ ok: boolean; detail: string }> {
  const c = cfg();
  if (!c) return { ok: false, detail: 'board not configured' };

  if (cmd.action === 'create_task') {
    const ownerId = cmd.assignee ? await resolveOwner(cmd.assignee, fetchImpl) : null;
    if (cmd.assignee && !ownerId) {
      // Never invent an owner. An unassigned task is honest; a wrongly-assigned
      // one is invisible to the person who should see it.
      return { ok: false, detail: `no team member matches "${cmd.assignee}"` };
    }
    const why = cmd.why || `Created by ZOE from a board comment on "${ctx.taskTitle}".`;
    const body = {
      title: cmd.title,
      status: 'todo',
      owner_id: ownerId,
      notes: `${why}\n\nSource: @zoe command in a comment on task ${ctx.taskId}.`,
      legacy_source: commandSource(ctx.commentId),
      project: 'zaodevz',
    };
    try {
      const r = await fetchImpl(`${c.root}/rest/v1/tasks`, {
        method: 'POST',
        headers: { ...c.headers, Prefer: 'return=representation' },
        body: JSON.stringify(body),
      });
      if (!r.ok) return { ok: false, detail: `create returned ${r.status}` };
      const rows = (await r.json()) as Array<{ id: string; legacy_id?: string }>;
      return { ok: true, detail: rows[0]?.legacy_id ? `#${rows[0].legacy_id}` : (rows[0]?.id ?? '') };
    } catch (e) {
      return { ok: false, detail: e instanceof Error ? e.message : 'create failed' };
    }
  }

  if (cmd.action === 'close_task') {
    // "done", never "completed" - tasks.status carries a CHECK constraint that
    // rejects anything else with a 400, and the rejection is easy to misread as
    // "nothing to close".
    try {
      const r = await fetchImpl(`${c.root}/rest/v1/tasks?id=eq.${ctx.taskId}`, {
        method: 'PATCH',
        headers: { ...c.headers, Prefer: 'return=minimal' },
        body: JSON.stringify({ status: 'done' }),
      });
      return r.ok ? { ok: true, detail: '' } : { ok: false, detail: `close returned ${r.status}` };
    } catch (e) {
      return { ok: false, detail: e instanceof Error ? e.message : 'close failed' };
    }
  }

  const ownerId = await resolveOwner(cmd.assignee, fetchImpl);
  if (!ownerId) return { ok: false, detail: `no team member matches "${cmd.assignee}"` };
  try {
    const r = await fetchImpl(`${c.root}/rest/v1/tasks?id=eq.${ctx.taskId}`, {
      method: 'PATCH',
      headers: { ...c.headers, Prefer: 'return=minimal' },
      body: JSON.stringify({ owner_id: ownerId }),
    });
    return r.ok ? { ok: true, detail: '' } : { ok: false, detail: `assign returned ${r.status}` };
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : 'assign failed' };
  }
}

/**
 * Turn one @zoe comment into board changes, and return the receipt to post.
 *
 * `extract` is injected so the caller supplies the model call (and tests do not
 * need one). Returning null means "nothing to execute" - the caller should fall
 * through to the normal reply path, because most @zoe comments are questions.
 */
export async function executeBoardComment(
  ctx: ExecContext,
  extract: (prompt: string) => Promise<string | null>,
  fetchImpl: typeof fetch = fetch,
): Promise<ExecResult | null> {
  const gate = shouldExecute({ content: ctx.commentContent, displayName: ctx.commentAuthor });
  if (!gate.execute) return null;

  let raw: unknown = null;
  try {
    const text = await extract(`${EXTRACTION_PROMPT}${ctx.commentContent}`);
    if (!text) return null;
    // Tolerate a fenced block; refuse anything that is not JSON.
    const cleaned = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    raw = JSON.parse(cleaned);
  } catch {
    return null; // Unparseable extraction executes nothing.
  }

  const { commands, rejected, dropped } = parseCommands(raw);
  if (commands.length === 0 && rejected.length === 0) return null;

  // Replay guard, and only where a replay actually costs something: create is
  // the sole INSERT, so it is the sole action a re-run can duplicate. Checked
  // before ANY action runs, so a replayed comment re-applies nothing at all.
  if (commands.some((cmd) => cmd.action === 'create_task')) {
    const done = await alreadyExecuted(ctx.commentId, fetchImpl);
    if (done === 'unknown') {
      // Fail closed. The comment stays unanswered, so the next tick retries it -
      // whereas running now could duplicate, and falling through to a chat reply
      // would mark it handled and lose the command outright.
      return {
        executed: 0,
        receipt: '',
        skipped: 'could not confirm whether this comment already ran; will retry',
      };
    }
    if (done) {
      return {
        executed: 0,
        receipt: 'already applied on an earlier run - nothing re-run.',
      };
    }
  }

  featureRan('board-commands', `task ${ctx.taskId}`);

  const applied: Array<{ command: BoardCommand; ok: boolean; detail: string }> = [];
  for (const cmd of commands) {
    // Close last, so a create/assign on the same comment still lands even if
    // closing the parent would otherwise end the tick.
    if (cmd.action === 'close_task') continue;
    applied.push({ command: cmd, ...(await applyOne(cmd, ctx, fetchImpl)) });
  }
  for (const cmd of commands.filter((x) => x.action === 'close_task')) {
    applied.push({ command: cmd, ...(await applyOne(cmd, ctx, fetchImpl)) });
  }

  const receipt = renderReceipt(applied, rejected, dropped);
  console.log(`[zoe/board-commands] task ${ctx.taskId}: ${applied.filter((a) => a.ok).length}/${applied.length} applied`);
  return { executed: applied.filter((a) => a.ok).length, receipt };
}
