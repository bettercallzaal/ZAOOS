/**
 * task-mention-notify.ts - when someone @mentions a PERSON in a board task
 * comment, ZOE pings that person on Telegram so they see it without opening the
 * board. Companion to task-comment-replies.ts: that one answers @zoe; this one
 * forwards @person mentions to the mentioned person's Telegram.
 *
 * Destinations come from MENTION_NOTIFY_MAP (JSON env), a handle -> {chatId,
 * topicId?} map, so a mention of @iman lands in Iman's topic and @zaal in his
 * DM. @zoe is never notified here (that path is task-comment-replies).
 *
 * Best-effort: no-op when the board or the map is unconfigured, deduped by
 * (comment id + handle) so nobody is pinged twice, capped per tick, never
 * throws into the scheduler.
 */

import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const ZOE_HOME = process.env.ZOE_HOME ?? join(homedir(), '.zao', 'zoe');
const SEEN_PATH = join(ZOE_HOME, 'mention_notify_seen.jsonl');
const CANDIDATE_LIMIT = 200;
const MAX_NOTIFY_PER_TICK = 20;
const SNIPPET_LEN = 240;
/** Handles that are bots / never get a person-notification. */
const SKIP_HANDLES = new Set(['zoe', 'zaoclaw_bot', 'here', 'everyone', 'all']);

export interface BoardComment {
  id: string;
  userId?: string;
  displayName?: string;
  content: string;
  createdAt?: string;
}

export interface BoardTask {
  id: string;
  legacy_id: string | null;
  title: string;
  metadata?: (Record<string, unknown> & { comments?: BoardComment[] }) | null;
}

export interface Destination {
  chatId: number;
  topicId?: number;
}

/** send(chatId, text, {threadId}) -> resolves when sent. Injected by scheduler. */
export type SendFn = (chatId: number, text: string, opts?: { threadId?: number }) => Promise<void>;

export function boardConfigured(): boolean {
  return Boolean(process.env.COWORK_TRACKER_URL && process.env.COWORK_TRACKER_KEY);
}

/**
 * Resolve the handle -> Destination map from MENTION_NOTIFY_MAP (JSON), plus a
 * default 'zaal' -> DM when zaalChatId is supplied and not already mapped.
 * Handles are lowercased. Returns {} on parse failure (best-effort).
 */
export function resolveDestinations(zaalChatId?: number): Record<string, Destination> {
  const out: Record<string, Destination> = {};
  const raw = process.env.MENTION_NOTIFY_MAP;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Record<string, Destination>;
      for (const [handle, dest] of Object.entries(parsed)) {
        if (dest && typeof dest.chatId === 'number') out[handle.toLowerCase()] = dest;
      }
    } catch {
      // ignore malformed map - fall through to the zaal default
    }
  }
  if (zaalChatId && !out.zaal) out.zaal = { chatId: zaalChatId };
  return out;
}

/** Lowercased @handles in a comment, excluding bot/broadcast handles. */
export function parseMentions(content: string): string[] {
  if (!content) return [];
  const found = content.match(/@([a-z0-9_]{2,32})/gi) ?? [];
  const handles = found.map((m) => m.slice(1).toLowerCase()).filter((h) => !SKIP_HANDLES.has(h));
  return [...new Set(handles)];
}

function commentsOf(t: BoardTask): BoardComment[] {
  const c = t.metadata?.comments;
  return Array.isArray(c) ? c : [];
}

/** Dedup key for one (comment, mentioned-handle) pair. */
function seenKey(commentId: string, handle: string): string {
  return `${commentId}:${handle}`;
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

export interface PendingMention {
  task: BoardTask;
  comment: BoardComment;
  handle: string;
}

/**
 * Every (comment, mentioned-handle) pair whose handle is in `destinations`,
 * was not authored by the mentioned person, and is not already in `seen`.
 * Pure + exported for unit testing.
 */
export function findNewMentions(
  tasks: BoardTask[],
  destinations: Record<string, Destination>,
  seen: Set<string>,
): PendingMention[] {
  const out: PendingMention[] = [];
  for (const task of tasks) {
    for (const comment of commentsOf(task)) {
      for (const handle of parseMentions(comment.content)) {
        if (!destinations[handle]) continue; // no route -> skip silently
        if (comment.userId && comment.userId.toLowerCase() === handle) continue; // self-mention
        if (seen.has(seenKey(comment.id, handle))) continue;
        out.push({ task, comment, handle });
      }
    }
  }
  return out;
}

async function fetchRecentBoardTasks(fetchImpl: typeof fetch): Promise<BoardTask[]> {
  const base = process.env.COWORK_TRACKER_URL;
  const key = process.env.COWORK_TRACKER_KEY;
  if (!base || !key) return [];
  const url =
    `${base.replace(/\/$/, '')}/rest/v1/tasks` +
    `?archived_at=is.null&metadata=not.is.null` +
    `&select=id,legacy_id,title,metadata` +
    `&order=updated_at.desc.nullslast&limit=${CANDIDATE_LIMIT}`;
  try {
    const res = await fetchImpl(url, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
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

function notifyText(m: PendingMention): string {
  const who = m.comment.displayName || m.comment.userId || 'Someone';
  const snippet = m.comment.content.replace(/\s+/g, ' ').trim().slice(0, SNIPPET_LEN);
  const label = m.task.legacy_id ? `#${m.task.legacy_id}` : m.task.title;
  return `${who} mentioned you on task ${label} ("${m.task.title}"):\n${snippet}\n\nthezao.xyz/board?task=${m.task.legacy_id ?? m.task.id}`;
}

export interface NotifyResult {
  notified: number;
  scanned: number;
}

/**
 * One notification pass. Best-effort; never throws.
 * @param send injected Telegram sender.
 * @param zaalChatId Zaal's DM chat id (default 'zaal' route).
 * @param fetchImpl injectable for tests.
 */
export async function runMentionNotify(
  send: SendFn,
  zaalChatId?: number,
  fetchImpl: typeof fetch = fetch,
): Promise<NotifyResult> {
  if (!boardConfigured()) return { notified: 0, scanned: 0 };
  const destinations = resolveDestinations(zaalChatId);
  if (Object.keys(destinations).length === 0) return { notified: 0, scanned: 0 };

  const tasks = await fetchRecentBoardTasks(fetchImpl);
  const seen = await readSeen();
  const pending = findNewMentions(tasks, destinations, seen).slice(0, MAX_NOTIFY_PER_TICK);

  const done: string[] = [];
  let notified = 0;
  for (const m of pending) {
    const dest = destinations[m.handle];
    try {
      await send(dest.chatId, notifyText(m), dest.topicId ? { threadId: dest.topicId } : undefined);
      notified++;
      done.push(seenKey(m.comment.id, m.handle));
    } catch (err) {
      console.warn('[zoe/mention-notify] send failed (nbd):', (err as Error).message);
      // Do NOT mark seen on failure - retry next tick.
    }
  }
  await markSeen(done);

  if (notified > 0) console.log(`[zoe/mention-notify] pinged ${notified} board mention(s)`);
  return { notified, scanned: tasks.length };
}
