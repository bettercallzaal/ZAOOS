/**
 * task-comment-replies.ts - ZOE watches the cowork board for task comments that
 * tag @zoe and replies in-thread.
 *
 * The board (thezao.xyz/board, ZAODEVZ/ZAOcowork) already stores per-task
 * comments in public.tasks.metadata.comments, where each comment is
 * { id, userId, displayName, content, createdAt }. A teammate can already type
 * "@zoe how do I test this?" in a task's comment box - it saves fine. The only
 * missing piece (this module) is ZOE noticing those @zoe comments and replying.
 *
 * Flow each tick:
 *   1. Fetch recent non-archived tasks that have comments (via PostgREST).
 *   2. Find @zoe-tagging comments with no ZOE reply after them.
 *   3. Answer each with the task loaded as context (callClaudeCli, cheap model).
 *   4. Re-fetch the task, re-check it's still unanswered (concurrency guard),
 *      append ZOE's reply to metadata.comments, PATCH the row.
 *
 * Config: reuses COWORK_TRACKER_URL + COWORK_TRACKER_KEY (team-tracker.ts); the
 * key needs PATCH access to public.tasks. Best-effort: no-op when unconfigured,
 * capped per tick, never throws into the scheduler.
 */

import { callClaudeCli } from '../hermes/claude-cli';

export interface BoardComment {
  id: string;
  userId?: string;
  displayName?: string;
  content: string;
  createdAt?: string;
  editedAt?: string;
}

export interface BoardTask {
  id: string; // uuid (DB primary key)
  legacy_id: string | null;
  title: string;
  notes?: string | null;
  status?: string | null;
  metadata?: (Record<string, unknown> & { comments?: BoardComment[] }) | null;
}

const ZOE_USER_ID = 'zoe';
const ZOE_DISPLAY = 'ZOE';
const MENTION_RE = /@zoe\b/i;
const MAX_REPLIES_PER_TICK = 5;
const CANDIDATE_LIMIT = 200;

export function boardConfigured(): boolean {
  return Boolean(process.env.COWORK_TRACKER_URL && process.env.COWORK_TRACKER_KEY);
}

function commentsOf(t: BoardTask): BoardComment[] {
  const c = t.metadata?.comments;
  return Array.isArray(c) ? c : [];
}

/** True if the comment tags @zoe and was NOT authored by ZOE itself. */
function tagsZoe(c: BoardComment): boolean {
  return (
    typeof c.content === 'string' && MENTION_RE.test(c.content) && c.userId !== ZOE_USER_ID
  );
}

/**
 * Every @zoe-tagging comment that has no ZOE reply after it. A reply is any
 * ZOE-authored comment (userId === 'zoe') appearing later in the ordered
 * comments array. Pure + exported for unit testing.
 */
export function findUnansweredMentions(
  tasks: BoardTask[],
): Array<{ task: BoardTask; comment: BoardComment }> {
  const out: Array<{ task: BoardTask; comment: BoardComment }> = [];
  for (const task of tasks) {
    const comments = commentsOf(task);
    for (let i = 0; i < comments.length; i++) {
      const c = comments[i];
      if (!tagsZoe(c)) continue;
      const answered = comments.slice(i + 1).some((later) => later.userId === ZOE_USER_ID);
      if (!answered) out.push({ task, comment: c });
    }
  }
  return out;
}

function trackerHeaders(key: string): Record<string, string> {
  return { apikey: key, Authorization: `Bearer ${key}` };
}

const SELECT = 'select=id,legacy_id,title,notes,status,metadata';

/**
 * Recent non-archived tasks that carry metadata (candidate comment holders).
 * PostgREST can't substring-match inside a jsonb array, so we fetch a bounded
 * recent set and filter for @zoe in JS.
 */
async function fetchCandidateTasks(fetchImpl: typeof fetch): Promise<BoardTask[]> {
  const base = process.env.COWORK_TRACKER_URL;
  const key = process.env.COWORK_TRACKER_KEY;
  if (!base || !key) return [];
  const url =
    `${base.replace(/\/$/, '')}/rest/v1/tasks` +
    `?archived_at=is.null&metadata=not.is.null&${SELECT}` +
    `&order=updated_at.desc.nullslast&limit=${CANDIDATE_LIMIT}`;
  try {
    const res = await fetchImpl(url, {
      headers: trackerHeaders(key),
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = (await res.json()) as BoardTask[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/** Fetch a single task fresh (for the pre-write concurrency re-check). */
async function fetchTaskById(id: string, fetchImpl: typeof fetch): Promise<BoardTask | null> {
  const base = process.env.COWORK_TRACKER_URL;
  const key = process.env.COWORK_TRACKER_KEY;
  if (!base || !key) return null;
  const url = `${base.replace(/\/$/, '')}/rest/v1/tasks?id=eq.${id}&${SELECT}&limit=1`;
  try {
    const res = await fetchImpl(url, {
      headers: trackerHeaders(key),
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as BoardTask[];
    return Array.isArray(data) && data[0] ? data[0] : null;
  } catch {
    return null;
  }
}

/**
 * Ask the model to answer a @zoe task comment, with the task as context.
 * Returns the reply text, or null on any failure. Exported for testing via an
 * injectable caller.
 */
export async function answerMention(
  task: BoardTask,
  comment: BoardComment,
  call: typeof callClaudeCli = callClaudeCli,
): Promise<string | null> {
  const system = [
    'You are ZOE, replying inside a comment thread on a ZAO board task.',
    `Task: "${task.title}" (status: ${task.status ?? 'unknown'}).`,
    task.notes ? `Task notes: ${String(task.notes).slice(0, 800)}` : '',
    'A teammate tagged you in a comment. Answer their question about THIS task,',
    "concisely (2-5 sentences), in ZOE's plain voice. No emojis, no em dashes.",
    "If you genuinely cannot answer from the task, say what you'd need. Never invent facts.",
  ]
    .filter(Boolean)
    .join('\n');
  try {
    const res = await call({
      model: 'haiku',
      prompt: `Comment tagging you: ${comment.content}`,
      cwd: process.cwd(),
      appendSystemPrompt: system,
      allowedTools: ['Read', 'Grep', 'Glob'],
      timeoutMs: 90_000,
      maxBudgetUsd: 0.25,
    });
    const text = (res.text || '').trim();
    return text && !res.isError ? text : null;
  } catch (err) {
    console.warn('[zoe/task-replies] answer failed (nbd):', (err as Error).message);
    return null;
  }
}

/** Append ZOE's reply to a task's metadata.comments and PATCH the row. */
async function postReply(
  task: BoardTask,
  answer: string,
  fetchImpl: typeof fetch,
): Promise<boolean> {
  const base = process.env.COWORK_TRACKER_URL;
  const key = process.env.COWORK_TRACKER_KEY;
  if (!base || !key) return false;
  const reply: BoardComment = {
    id: `zoe-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId: ZOE_USER_ID,
    displayName: ZOE_DISPLAY,
    content: answer,
    createdAt: new Date().toISOString(),
  };
  const metadata = { ...(task.metadata ?? {}) };
  const existing = Array.isArray(metadata.comments) ? (metadata.comments as BoardComment[]) : [];
  metadata.comments = [...existing, reply];
  const url = `${base.replace(/\/$/, '')}/rest/v1/tasks?id=eq.${task.id}`;
  try {
    const res = await fetchImpl(url, {
      method: 'PATCH',
      headers: {
        ...trackerHeaders(key),
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ metadata }),
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch (err) {
    console.warn('[zoe/task-replies] post failed (nbd):', (err as Error).message);
    return false;
  }
}

export interface ReplyTickResult {
  answered: number;
  scanned: number;
}

/**
 * One reply pass. Fetch candidates, answer each unanswered @zoe mention (capped),
 * re-check freshness, and post. Best-effort; never throws.
 * @param fetchImpl injectable for tests.
 * @param call injectable model caller for tests.
 */
export async function runTaskCommentReplies(
  fetchImpl: typeof fetch = fetch,
  call: typeof callClaudeCli = callClaudeCli,
): Promise<ReplyTickResult> {
  if (!boardConfigured()) return { answered: 0, scanned: 0 };
  const tasks = await fetchCandidateTasks(fetchImpl);
  const pending = findUnansweredMentions(tasks).slice(0, MAX_REPLIES_PER_TICK);
  let answered = 0;

  for (const { task, comment } of pending) {
    const ans = await answerMention(task, comment, call);
    if (!ans) continue;
    // Re-fetch just before writing to shrink the window where a concurrent app
    // write clobbers our append or someone else already answered.
    const fresh = (await fetchTaskById(task.id, fetchImpl)) ?? task;
    const stillUnanswered = findUnansweredMentions([fresh]).some(
      (m) => m.comment.id === comment.id,
    );
    if (!stillUnanswered) continue;
    if (await postReply(fresh, ans, fetchImpl)) answered++;
  }

  if (answered > 0) {
    console.log(`[zoe/task-replies] answered ${answered} @zoe task comment(s)`);
  }
  return { answered, scanned: tasks.length };
}
