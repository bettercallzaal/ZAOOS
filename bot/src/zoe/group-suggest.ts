/**
 * group-suggest.ts - what a listed person says in a listed group becomes a
 * suggestion Zaal keeps or drops by DM.
 *
 * Zaal, 2026-11-16, in a group with another builder: he wants ZOE to learn from
 * what is said there. A group member must never steer ZOE, so nothing captured
 * here reaches a prompt: a capture is a pending card, Keep appends one line to
 * kept.md on ZOE's own disk, and turning a kept line into a real change stays a
 * PR. No model call (code-over-inference.md).
 *
 * Off unless ZOE_GROUP_SUGGEST=1 and both ZOE_GROUP_SUGGEST_CHATS and
 * ZOE_GROUP_SUGGEST_SENDERS list at least one numeric id. Bots are never
 * senders. A text that containsSecret (recall.ts) or containsPii (pii.ts) is
 * not stored. Automatic notices go out at most once per card and at most once
 * per SUGGEST_DM_MIN_GAP_MS; /gs in Zaal's DM intentionally resends all pending.
 */

import { randomBytes } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { containsPii } from './pii';
import { containsSecret } from './recall';

export interface GroupSuggestConfig {
  chats: Set<string>;
  senders: Set<string>;
}

export interface GroupSuggestion {
  id: string;
  chatId: string;
  chatTitle: string;
  sender: string;
  text: string;
  at: string;
  notifiedAt?: string;
}

const SuggestionSchema = z.object({
  id: z.string().regex(/^[0-9a-f]{8}$/),
  chatId: z.string().regex(/^-?\d+$/),
  chatTitle: z.string(),
  sender: z.string().min(1),
  text: z.string().max(500),
  at: z.string().datetime(),
  notifiedAt: z.string().datetime().optional(),
});
const PendingSchema = z.array(SuggestionSchema);
const mutationLocks = new Map<string, Promise<void>>();

export const SUGGESTION_MAX = 50;
export const SUGGESTION_TEXT_MAX = 500;
export const SUGGEST_DM_MIN_GAP_MS = 30 * 60_000;

export function readGroupSuggestConfig(
  env: NodeJS.ProcessEnv = process.env,
): GroupSuggestConfig | null {
  if (env.ZOE_GROUP_SUGGEST !== '1') return null;
  const parseIds = (raw: string | undefined): Set<string> =>
    new Set(
      (raw ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter((s) => /^-?\d+$/.test(s)),
    );
  const chats = parseIds(env.ZOE_GROUP_SUGGEST_CHATS);
  const senders = parseIds(env.ZOE_GROUP_SUGGEST_SENDERS);
  return chats.size && senders.size ? { chats, senders } : null;
}

export function shouldCapture(
  cfg: GroupSuggestConfig | null,
  input: { chatId: string | number; fromId: string | number; isBot: boolean; text: string },
): boolean {
  const text = input.text.trim();
  return (
    !!cfg &&
    cfg.chats.has(String(input.chatId)) &&
    cfg.senders.has(String(input.fromId)) &&
    !input.isBot &&
    text.length >= 12 &&
    !text.startsWith('/')
  );
}

function safeSender(raw: string): string {
  const clean = raw.trim().replace(/\s+/g, ' ');
  if (!clean || clean.startsWith('@') || /^user:/i.test(clean) || /^-?\d+$/.test(clean))
    return 'a member';
  return clean.replace(/[@<>`*#[\]{}]/g, '').slice(0, 80) || 'a member';
}

export function makeSuggestion(
  input: Omit<GroupSuggestion, 'id' | 'at'>,
  now: Date = new Date(),
): GroupSuggestion {
  return {
    ...input,
    sender: safeSender(input.sender),
    chatTitle: input.chatTitle.replace(/[\r\n]+/g, ' ').trim() || 'group',
    text: input.text.trim().slice(0, SUGGESTION_TEXT_MAX),
    id: randomBytes(4).toString('hex'),
    at: now.toISOString(),
  };
}

function pendingPath(home: string): string {
  return join(home, 'group-suggest', 'pending.json');
}

async function withStoreLock<T>(home: string, operation: () => Promise<T>): Promise<T> {
  const previous = mutationLocks.get(home) ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  mutationLocks.set(home, current);
  await previous;
  try {
    return await operation();
  } finally {
    release();
    if (mutationLocks.get(home) === current) mutationLocks.delete(home);
  }
}

async function readStored(home: string): Promise<GroupSuggestion[]> {
  let raw: string;
  try {
    raw = await fs.readFile(pendingPath(home), 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw err;
  }
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error('pending suggestions file contains invalid JSON');
  }
  const parsed = PendingSchema.safeParse(value);
  if (!parsed.success) throw new Error('pending suggestions file has an invalid shape');
  if (parsed.data.length > SUGGESTION_MAX)
    throw new Error(`pending suggestions file exceeds the ${SUGGESTION_MAX}-item safety cap`);
  return parsed.data;
}

async function writeStored(home: string, items: GroupSuggestion[]): Promise<void> {
  if (items.length > SUGGESTION_MAX)
    throw new Error(`refusing to write more than ${SUGGESTION_MAX} pending suggestions`);
  const dir = join(home, 'group-suggest');
  await fs.mkdir(dir, { recursive: true });
  const target = pendingPath(home);
  const temp = `${target}.${process.pid}.${randomBytes(4).toString('hex')}.tmp`;
  try {
    await fs.writeFile(temp, JSON.stringify(items, null, 2), {
      encoding: 'utf8',
      mode: 0o600,
    });
    await fs.rename(temp, target);
  } catch (err) {
    await fs.unlink(temp).catch(() => {});
    throw err;
  }
}

export async function addPending(home: string, suggestion: GroupSuggestion): Promise<boolean> {
  return withStoreLock(home, async () => {
    const kind = containsSecret(suggestion.text)
      ? 'secret'
      : containsPii(suggestion.text)
        ? 'PII'
        : null;
    if (kind) {
      console.error(`[zoe/group-suggest] skipped suggestion containing ${kind}`);
      return false;
    }
    const current = await readStored(home);
    if (current.length >= SUGGESTION_MAX) {
      console.error(`[zoe/group-suggest] queue is full at ${SUGGESTION_MAX}; new suggestion was not saved`);
      return false;
    }
    current.push(SuggestionSchema.parse(suggestion));
    await writeStored(home, current);
    return true;
  });
}

export async function readPending(home: string): Promise<GroupSuggestion[]> {
  return readStored(home);
}

export async function readUnnotifiedPending(home: string): Promise<GroupSuggestion[]> {
  return (await readStored(home)).filter((item) => !item.notifiedAt);
}

export async function markPendingNotified(home: string, id: string, at: Date = new Date()): Promise<boolean> {
  return withStoreLock(home, async () => {
    const current = await readStored(home);
    const item = current.find((suggestion) => suggestion.id === id);
    if (!item) return false;
    item.notifiedAt = at.toISOString();
    await writeStored(home, current);
    return true;
  });
}

export async function takePending(home: string, id: string): Promise<GroupSuggestion | null> {
  return withStoreLock(home, async () => removePending(home, id));
}

async function removePending(home: string, id: string): Promise<GroupSuggestion | null> {
  const current = await readStored(home);
  const index = current.findIndex((s) => s.id === id);
  if (index < 0) return null;
  const [item] = current.splice(index, 1);
  await writeStored(home, current);
  return item;
}

async function appendKeptUnlocked(home: string, suggestion: GroupSuggestion): Promise<void> {
  const dir = join(home, 'group-suggest');
  await fs.mkdir(dir, { recursive: true });
  const marker = `<!-- group-suggestion:${suggestion.id} -->`;
  const line = `- ${marker} ${suggestion.at.slice(0, 10)} ${suggestion.sender} in ${suggestion.chatTitle}: ${suggestion.text.replace(/[\r\n]+/g, ' ')}`;
  const path = join(dir, 'kept.md');
  try {
    const existing = await fs.readFile(path, 'utf8');
    if (existing.split(/\r?\n/).includes(line)) return;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
  }
  await fs.appendFile(path, `${line}\n`, 'utf8');
}

export async function appendKept(home: string, suggestion: GroupSuggestion): Promise<void> {
  return withStoreLock(home, () => appendKeptUnlocked(home, suggestion));
}

export async function keepPending(home: string, id: string): Promise<GroupSuggestion | null> {
  return withStoreLock(home, async () => {
    const current = await readStored(home);
    const item = current.find((s) => s.id === id);
    if (!item) return null;

    // Persist the kept record first. If removing it from pending then fails, a
    // retry is idempotent and the user's suggestion remains recoverable.
    await appendKeptUnlocked(home, item);
    await removePending(home, id);
    return item;
  });
}

export function dueToSend(lastSentMs: number | null, nowMs: number): boolean {
  return lastSentMs === null || nowMs - lastSentMs >= SUGGEST_DM_MIN_GAP_MS;
}

export function renderCard(s: GroupSuggestion): string {
  return `Suggestion from ${safeSender(s.sender)} in ${s.chatTitle.replace(/[@*`#]/g, '')}:\n${s.text.replace(/[@*`#]/g, '')}\nKeep saves it to your list. It does not change how I behave.`;
}
