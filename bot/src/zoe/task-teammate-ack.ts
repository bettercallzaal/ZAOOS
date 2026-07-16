/**
 * task-teammate-ack.ts - when a team member (e.g. Iman) comments on a cowork
 * task, ZOE acknowledges and pings Zaal on Telegram.
 *
 * Two flows (controlled by ZOE_DRAFT_ANSWERS flag, default OFF):
 *
 * 1. Draft-first (flag ON): ZOE drafts a proposed answer using Claude and asks
 *    Zaal to approve, edit, or skip. Only posts to the task on Zaal's approval.
 *    Approve -> post draft as Zaal. Edit -> await Zaal's version. Skip -> post ack.
 *
 * 2. Ask-first (flag OFF, legacy): ZOE posts "Noted" and asks Zaal "What should
 *    I reply?" His TG reply gets posted back to the task as-is.
 *
 * Both routes bridge the cowork board into Zaal's Telegram workflow: teammates
 * see their comments acknowledged, Zaal gets pulled into the loop, and the result
 * lands back on the board.
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
import { callClaudeCli } from '../hermes/claude-cli';
import { ZOE_DEFAULT_MODEL } from './types';

const ZOE_HOME = process.env.ZOE_HOME ?? join(homedir(), '.zao', 'zoe');
const SEEN_PATH = join(ZOE_HOME, 'teammate_ack_seen.jsonl');
const PENDING_REPLIES_PATH = join(ZOE_HOME, 'teammate_ack_pending.jsonl');
const PENDING_DRAFTS_PATH = join(ZOE_HOME, 'teammate_ack_drafts.jsonl');
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
  originalAskerId?: string;
  originalAskerName?: string;
}

/** Pending draft answer awaiting Zaal's approval/edit/skip. */
export interface PendingDraftAnswer {
  messageId: number;
  taskId: string;
  commentId: string;
  commentText: string;
  taskTitle: string;
  askerName: string;
  draftAnswer: string;
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

async function readPendingDrafts(): Promise<Map<number, PendingDraftAnswer>> {
  const map = new Map<number, PendingDraftAnswer>();
  try {
    const raw = await fs.readFile(PENDING_DRAFTS_PATH, 'utf8');
    for (const line of raw.trim().split('\n').filter(Boolean)) {
      try {
        const entry = JSON.parse(line) as PendingDraftAnswer;
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

async function writePendingDraft(pending: PendingDraftAnswer): Promise<void> {
  await fs.mkdir(ZOE_HOME, { recursive: true });
  await fs.appendFile(PENDING_DRAFTS_PATH, JSON.stringify(pending) + '\n', 'utf8');
}

async function removePendingDraft(messageId: number): Promise<void> {
  const map = await readPendingDrafts();
  map.delete(messageId);
  await fs.mkdir(ZOE_HOME, { recursive: true });
  // Rewrite the whole file with remaining entries.
  const lines = Array.from(map.values()).map((p) => JSON.stringify(p));
  await fs.writeFile(PENDING_DRAFTS_PATH, lines.length > 0 ? lines.join('\n') + '\n' : '', 'utf8');
}

/** Helper to gather task context for drafting. */
function buildTaskContext(task: BoardTask): string {
  const lines: string[] = [];
  lines.push(`Task: "${task.title}"`);
  if (task.legacy_id) lines.push(`ID: #${task.legacy_id}`);
  if (task.notes) lines.push(`Notes: ${task.notes}`);
  const comments = Array.isArray(task.metadata?.comments) ? (task.metadata.comments as BoardComment[]) : [];
  if (comments.length > 0) {
    lines.push('Recent comments:');
    const recent = comments.slice(-5); // Last 5 comments for context
    for (const c of recent) {
      const who = c.displayName || c.userId || 'Unknown';
      const text = c.content.replace(/\s+/g, ' ').trim().slice(0, 150);
      lines.push(`  - ${who}: ${text}`);
    }
  }
  return lines.join('\n');
}

/** Draft a proposed answer to a team member's question. Best-effort; returns empty string on failure. */
async function draftAnswerForQuestion(task: BoardTask, question: string, workspace_dir: string): Promise<string> {
  try {
    const context = buildTaskContext(task);
    const systemPrompt = `You are ZOE, a cowork assistant. Your job is to draft concise, helpful answers to team member questions about tasks.

Keep responses short (2-3 sentences max, under 150 chars). Ground answers ONLY in the task context provided - if you don't have enough info, say "need more context from Zaal" rather than inventing details.

Respond as if Zaal would: direct, practical, no fluff.`;

    const prompt = `Task context:
${context}

Team member's question: "${question}"

Draft a brief answer (as Zaal would respond). Keep it short and grounded in the context above.`;

    const result = await callClaudeCli({
      model: ZOE_DEFAULT_MODEL,
      prompt,
      cwd: workspace_dir,
      appendSystemPrompt: systemPrompt,
      allowedTools: [],
      disallowedTools: ['Bash', 'Read', 'Edit', 'Write', 'Grep', 'Glob', 'WebFetch', 'Task', 'Agent'],
      permissionMode: 'default',
      outputFormat: 'text',
      timeoutMs: 15 * 1000, // 15 sec timeout
    });

    return result.text.trim();
  } catch (err) {
    console.warn('[zoe/teammate-ack] draft answer failed (nbd):', (err as Error).message);
    return '';
  }
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
async function postNotedAck(
  task: BoardTask,
  comment: BoardComment,
  fetchImpl: typeof fetch,
): Promise<boolean> {
  const base = process.env.COWORK_TRACKER_URL;
  const key = process.env.COWORK_TRACKER_KEY;
  if (!base || !key) return false;
  const taskLabel = task.legacy_id ? `#${task.legacy_id}` : task.id;
  const snippet = comment.content.replace(/\s+/g, ' ').trim().slice(0, 60);
  const ack: BoardComment = {
    id: `zoe-ack-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId: ZOE_USER_ID,
    displayName: ZOE_DISPLAY,
    content: `Noted on ${taskLabel} - flagged to Zaal: "${snippet}". He will reply here.`,
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

function buildDraftApprovalMessage(draft: PendingDraftAnswer): string {
  const taskLink = `thezao.xyz/board?task=draft_${draft.taskId}`;
  return (
    `[${draft.askerName}] on "${draft.taskTitle}":\n"${draft.commentText.replace(/\s+/g, ' ').trim().slice(0, 100)}"\n\n` +
    `DRAFT ANSWER:\n"${draft.draftAnswer}"\n\n` +
    `Reply 1: APPROVE | 2: EDIT | 3: SKIP\n\n` +
    `Task: ${taskLink}`
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
  workspaceDir: string = process.cwd(),
): Promise<TeammateAckResult> {
  if (!boardConfigured()) return { asked: 0, scanned: 0 };
  const teamMembers = getTeamMembers();
  const tasks = await fetchCandidateTasks(fetchImpl);
  const seen = await readSeen();
  const pending = findNewTeamComments(tasks, teamMembers, seen).slice(0, MAX_ACKS_PER_TICK);

  const done: string[] = [];
  let asked = 0;
  const draftAnswersEnabled = process.env.ZOE_DRAFT_ANSWERS === '1';

  for (const pend of pending) {
    const task = pend.task;
    const comment = pend.comment;

    if (draftAnswersEnabled) {
      // Draft-first flow: draft answer, ask Zaal for approval
      const askerName = comment.displayName || comment.userId || 'Someone';
      const draft = await draftAnswerForQuestion(task, comment.content, workspaceDir);

      if (!draft) {
        // Draft failed; fall back to ask-first flow
        console.warn('[zoe/teammate-ack] draft failed for', task.id, 'falling back to ask-first');
        // Continue to ask-first flow below
      } else {
        // Post acknowledgment to the task
        const ackPosted = await postNotedAck(task, fetchImpl);
        if (!ackPosted) {
          console.warn('[zoe/teammate-ack] ack post failed, skipping telegram ask for', task.id);
          continue;
        }

        // Send Zaal the draft for approval
        const draftPending: PendingDraftAnswer = {
          messageId: 0, // Will be set after sending
          taskId: task.id,
          commentId: comment.id,
          commentText: comment.content,
          taskTitle: task.title,
          askerName,
          draftAnswer: draft,
          createdAt: new Date().toISOString(),
        };

        const message = buildDraftApprovalMessage(draftPending);
        let messageId: number | null = null;
        try {
          messageId = await sendTg(zaalChatId, message);
        } catch (err) {
          console.warn('[zoe/teammate-ack] draft telegram send failed (nbd):', (err as Error).message);
        }

        if (messageId !== null) {
          draftPending.messageId = messageId;
          try {
            await writePendingDraft(draftPending);
            asked++;
            done.push(seenKey(task.id, comment.id));
          } catch (err) {
            console.warn('[zoe/teammate-ack] failed to store pending draft (nbd):', (err as Error).message);
          }
        }
        continue; // Don't fall through to ask-first for this comment
      }
    }

    // Ask-first flow (legacy or fallback from draft)
    // Post the "noted" ack to the task.
    const ackPosted = await postNotedAck(task, comment, fetchImpl);
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
        originalAskerId: comment.userId,
        originalAskerName: comment.displayName,
      };
      try {
        await writePendingReply(pending_);
        asked++;
        done.push(seenKey(task.id, comment.id));
      } catch (err) {
        console.warn('[zoe/teammate-ack] failed to store pending reply (nbd):', (err as Error).message);
      }
    } else {
      // Log the TG send failure clearly (P3 reliability)
      console.error(
        '[zoe/teammate-ack] telegram send failed for',
        task.id,
        '- will retry next cycle',
      );
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
  // Prefix with @mention of the original asker so they get notified.
  const askerHandle = pending.originalAskerId ? `@${pending.originalAskerId}` : '';
  const contentWithMention = askerHandle ? `${askerHandle} ${replyText.trim()}` : replyText.trim();

  const reply: BoardComment = {
    id: `zaal-reply-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId: 'zaal',
    displayName: 'Zaal',
    content: contentWithMention,
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

/** For index.ts reply-bridge handler: get the pending draft answer. */
export async function getPendingDraft(messageId: number): Promise<PendingDraftAnswer | null> {
  const map = await readPendingDrafts();
  return map.get(messageId) ?? null;
}

/** For index.ts reply-bridge handler: remove draft after posting. */
export async function clearPendingDraft(messageId: number): Promise<void> {
  await removePendingDraft(messageId);
}

/** For index.ts reply-bridge handler: post approved/edited draft to the task. */
export async function postDraftAnswerToTask(
  draft: PendingDraftAnswer,
  answerText: string,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  const base = process.env.COWORK_TRACKER_URL;
  const key = process.env.COWORK_TRACKER_KEY;
  if (!base || !key) return false;

  const SELECT_FOR_REPLY = 'select=id,legacy_id,title,notes,status,metadata';
  const url = `${base.replace(/\/$/, '')}/rest/v1/tasks?id=eq.${draft.taskId}&${SELECT_FOR_REPLY}&limit=1`;
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

  // Append the answer as a comment attributed to Zaal.
  const reply: BoardComment = {
    id: `zaal-reply-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId: 'zaal',
    displayName: 'Zaal',
    content: answerText.trim(),
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
    console.warn('[zoe/teammate-ack] post draft answer failed (nbd):', (err as Error).message);
    return false;
  }
}
