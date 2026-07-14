/**
 * task-teammate-ack.ts - when a team member (e.g. Iman) comments on a cowork
 * task, ZOE posts a brief "noted" acknowledgment AND pings Zaal on Telegram
 * asking what to reply. When Zaal replies to that TG message, his reply gets
 * posted back to the task comment thread.
 *
 * This bridges the cowork board into Zaal's Telegram workflow: teammates see
 * their comments acknowledged, Zaal gets pulled into the loop, and his reply
 * lands back on the board.
 *
 * Flow each tick:
 *   1. Fetch recent non-archived tasks with comments.
 *   2. Find new comments from team members (not @zoe, not from Zaal, not from ZOE).
 *   3. Post a brief "noted" acknowledgment as ZOE.
 *   4. Send Zaal a Telegram message with task/comment details, asking what to reply.
 *   5. Store the mapping: TG message_id -> (task_id, comment_id) for the reply bridge.
 *
 * The reply bridge is wired in index.ts: when Zaal replies to one of these asks,
 * the handler checks if it's a reply_to_message_id in our pending map, then
 * posts Zaal's reply back to the task.
 *
 * Config: reuses COWORK_TRACKER_URL + COWORK_TRACKER_KEY; the key needs PATCH
 * access to public.tasks. Team members are read from TEAM_MEMBER_IDS env var
 * (comma-separated, e.g. "iman,jose,chikodi") with fallback to a hardcoded list.
 * Best-effort: no-op when unconfigured, capped per tick, never throws into the
 * scheduler.
 */

import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const ZOE_HOME = process.env.ZOE_HOME ?? join(homedir(), '.zao', 'zoe');
const SEEN_PATH = join(ZOE_HOME, 'teammate_ack_seen.jsonl');
const PENDING_REPLIES_PATH = join(ZOE_HOME, 'teammate_ack_pending.jsonl');
const CANDIDATE_LIMIT = 200;
const MAX_ACKS_PER_TICK = 10;

// Default team members (can override with TEAM_MEMBER_IDS env var)
const DEFAULT_TEAM_MEMBERS = ['iman', 'jose', 'chikodi', 'attabotty', 'zee3', 'failoften'];

const ZOE_USER_ID = 'zoe';
const ZOE_DISPLAY = 'ZOE';

export interface BoardComment {
  id: string;
  userId?: string;
  displayName?: string;
  content: string;
  createdAt?: string;
  editedAt?: string;
}

export interface BoardTask {
  id: string;
  legacy_id: string | null;
  title: string;
  notes?: string | null;
  status?: string | null;
  metadata?: (Record<string, unknown> & { comments?: BoardComment[] }) | null;
}

export interface PendingReply {
  messageId: number;
  taskId: string;
  commentId: string;
  taskTitle: string;
  createdAt: string;
}

export type SendTgFn = (chatId: number, text: string, opts?: { replyToMessageId?: number }) => Promise<number | null>;

function getTeamMembers(): Set<string> {
  const env = process.env.TEAM_MEMBER_IDS;
  const members = env ? env.split(',').map((m) => m.trim().toLowerCase()) : DEFAULT_TEAM_MEMBERS;
  return new Set(members);
}

export function boardConfigured(): boolean {
  return Boolean(process.env.COWORK_TRACKER_URL && process.env.COWORK_TRACKER_KEY);
}

function commentsOf(t: BoardTask): BoardComment[] {
  const c = t.metadata?.comments;
  return Array.isArray(c) ? c : [];
}

/** True if the comment is from a team member (not Zaal, not ZOE). */
function isFromTeamMember(c: BoardComment, teamMembers: Set<string>): boolean {
  return (
    typeof c.userId === 'string' &&
    c.userId !== ZOE_USER_ID &&
    c.userId !== 'zaal' &&
    teamMembers.has(c.userId.toLowerCase())
  );
}

async function readSeen(): Promise<Set<string>> {
  try {
    const raw = await fs.readFile(SEEN_PATH, 'utf8');
    return new Set(raw.trim().split('\n').filter(Boolean));
  } catch {
    return new Set();
  }
}

async function markSeen(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  await fs.mkdir(ZOE_HOME, { recursive: true });
  await fs.appendFile(SEEN_PATH, keys.map((k) => k).join('\n') + '\n', 'utf8');
}

/** Dedup key for one (task_id, comment_id) pair. */
function seenKey(taskId: string, commentId: string): string {
  return `${taskId}:${commentId}`;
}

async function readPendingReplies(): Promise<Map<number, PendingReply>> {
  const map = new Map<number, PendingReply>();
  try {
    const raw = await fs.readFile(PENDING_REPLIES_PATH, 'utf8');
    for (const line of raw.trim().split('\n').filter(Boolean)) {
      try {
        const entry = JSON.parse(line) as PendingReply;
        map.set(entry.messageId, entry);
      } catch {
        // Skip malformed lines.
      }
    }
  } catch {
    // File doesn't exist yet.
  }
  return map;
}

async function writePendingReply(pending: PendingReply): Promise<void> {
  await fs.mkdir(ZOE_HOME, { recursive: true });
  await fs.appendFile(PENDING_REPLIES_PATH, JSON.stringify(pending) + '\n', 'utf8');
}

async function removePendingReply(messageId: number): Promise<void> {
  const map = await readPendingReplies();
  map.delete(messageId);
  await fs.mkdir(ZOE_HOME, { recursive: true });
  // Rewrite the whole file with remaining entries.
  const lines = Array.from(map.values()).map((p) => JSON.stringify(p));
  await fs.writeFile(PENDING_REPLIES_PATH, lines.length > 0 ? lines.join('\n') + '\n' : '', 'utf8');
}

export interface TeamCommentPending {
  task: BoardTask;
  comment: BoardComment;
}

/**
 * Every team-member comment not already in `seen`. Pure + exported for testing.
 */
export function findNewTeamComments(
  tasks: BoardTask[],
  teamMembers: Set<string>,
  seen: Set<string>,
): TeamCommentPending[] {
  const out: TeamCommentPending[] = [];
  for (const task of tasks) {
    const comments = commentsOf(task);
    for (const comment of comments) {
      if (!isFromTeamMember(comment, teamMembers)) continue;
      if (seen.has(seenKey(task.id, comment.id))) continue;
      out.push({ task, comment });
    }
  }
  return out;
}

function trackerHeaders(key: string): Record<string, string> {
  return { apikey: key, Authorization: `Bearer ${key}` };
}

const SELECT = 'select=id,legacy_id,title,notes,status,metadata';

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

/** Append a "noted" ack to the task's metadata.comments. */
async function postNotedAck(task: BoardTask, fetchImpl: typeof fetch): Promise<boolean> {
  const base = process.env.COWORK_TRACKER_URL;
  const key = process.env.COWORK_TRACKER_KEY;
  if (!base || !key) return false;
  const ack: BoardComment = {
    id: `zoe-ack-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId: ZOE_USER_ID,
    displayName: ZOE_DISPLAY,
    content: 'Noted - looping Zaal in.',
    createdAt: new Date().toISOString(),
  };
  const metadata = { ...(task.metadata ?? {}) };
  const existing = Array.isArray(metadata.comments) ? (metadata.comments as BoardComment[]) : [];
  metadata.comments = [...existing, ack];
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
    console.warn('[zoe/teammate-ack] post noted ack failed (nbd):', (err as Error).message);
    return false;
  }
}

function buildTeammateAskMessage(pending: TeamCommentPending): string {
  const { task, comment } = pending;
  const who = comment.displayName || comment.userId || 'Someone';
  const snippet = comment.content.replace(/\s+/g, ' ').trim().slice(0, 200);
  const taskLabel = task.legacy_id ? `#${task.legacy_id}` : task.title;
  return (
    `[${who}] on task "${task.title}":\n\n"${snippet}"\n\n` +
    `What should I reply?\n\n` +
    `Task: thezao.xyz/board?task=${task.legacy_id ?? task.id}`
  );
}

export interface TeammateAckResult {
  asked: number;
  scanned: number;
}

/**
 * One ack pass. Fetch candidates, post acks and ask Zaal for replies (capped).
 * Best-effort; never throws.
 * @param sendTg injected Telegram sender (returns message ID or null on failure).
 * @param zaalChatId Zaal's DM chat id.
 * @param fetchImpl injectable for tests.
 */
export async function runTaskTeammateAck(
  sendTg: SendTgFn,
  zaalChatId: number,
  fetchImpl: typeof fetch = fetch,
): Promise<TeammateAckResult> {
  if (!boardConfigured()) return { asked: 0, scanned: 0 };
  const teamMembers = getTeamMembers();
  const tasks = await fetchCandidateTasks(fetchImpl);
  const seen = await readSeen();
  const pending = findNewTeamComments(tasks, teamMembers, seen).slice(0, MAX_ACKS_PER_TICK);

  const done: string[] = [];
  let asked = 0;

  for (const pend of pending) {
    const task = pend.task;
    const comment = pend.comment;

    // Post the "noted" ack to the task.
    const ackPosted = await postNotedAck(task, fetchImpl);
    if (!ackPosted) {
      console.warn('[zoe/teammate-ack] ack post failed, skipping telegram ask for', task.id);
      continue;
    }

    // Send Zaal the ask on Telegram.
    const message = buildTeammateAskMessage(pend);
    let messageId: number | null = null;
    try {
      messageId = await sendTg(zaalChatId, message);
    } catch (err) {
      console.warn('[zoe/teammate-ack] telegram send failed (nbd):', (err as Error).message);
    }

    if (messageId !== null) {
      // Store the pending reply mapping for the bridge.
      const pending_: PendingReply = {
        messageId,
        taskId: task.id,
        commentId: comment.id,
        taskTitle: task.title,
        createdAt: new Date().toISOString(),
      };
      try {
        await writePendingReply(pending_);
        asked++;
        done.push(seenKey(task.id, comment.id));
      } catch (err) {
        console.warn('[zoe/teammate-ack] failed to store pending reply (nbd):', (err as Error).message);
      }
    }
  }

  await markSeen(done);

  if (asked > 0) {
    console.log(`[zoe/teammate-ack] acked ${asked} team comment(s)`);
  }
  return { asked, scanned: tasks.length };
}

/** For index.ts reply-bridge handler: get the pending reply mapping. */
export async function getPendingReply(messageId: number): Promise<PendingReply | null> {
  const map = await readPendingReplies();
  return map.get(messageId) ?? null;
}

/** For index.ts reply-bridge handler: remove after posting reply to task. */
export async function clearPendingReply(messageId: number): Promise<void> {
  await removePendingReply(messageId);
}

/** For index.ts reply-bridge handler: post Zaal's reply to the task. */
export async function postZaalReplyToTask(
  pending: PendingReply,
  replyText: string,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  const base = process.env.COWORK_TRACKER_URL;
  const key = process.env.COWORK_TRACKER_KEY;
  if (!base || !key) return false;

  const SELECT_FOR_REPLY = 'select=id,legacy_id,title,notes,status,metadata';
  const url = `${base.replace(/\/$/, '')}/rest/v1/tasks?id=eq.${pending.taskId}&${SELECT_FOR_REPLY}&limit=1`;
  let task: BoardTask | null = null;
  try {
    const res = await fetchImpl(url, {
      headers: trackerHeaders(key),
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
    if (!res.ok) return false;
    const data = (await res.json()) as BoardTask[];
    task = Array.isArray(data) && data[0] ? data[0] : null;
  } catch {
    return false;
  }

  if (!task) return false;

  // Append Zaal's reply as a comment (attributed to Zaal, not ZOE).
  const reply: BoardComment = {
    id: `zaal-reply-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId: 'zaal',
    displayName: 'Zaal',
    content: replyText.trim(),
    createdAt: new Date().toISOString(),
  };
  const metadata = { ...(task.metadata ?? {}) };
  const existing = Array.isArray(metadata.comments) ? (metadata.comments as BoardComment[]) : [];
  metadata.comments = [...existing, reply];

  const patchUrl = `${base.replace(/\/$/, '')}/rest/v1/tasks?id=eq.${task.id}`;
  try {
    const res = await fetchImpl(patchUrl, {
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
    console.warn('[zoe/teammate-ack] post zaal reply failed (nbd):', (err as Error).message);
    return false;
  }
}
