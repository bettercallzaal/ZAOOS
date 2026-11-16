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
 * not stored. Cards go out at most once per SUGGEST_DM_MIN_GAP_MS; /gs in
 * Zaal's DM sends what is waiting at once.
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
}

const SuggestionSchema = z.object({
  id: z.string().regex(/^[0-9a-f]{8}$/),
  chatId: z.string().regex(/^-?\d+$/),
  chatTitle: z.string(),
  sender: z.string().min(1),
  text: z.string().max(500),
  at: z.string().datetime(),
});
const PendingSchema = z.array(SuggestionSchema);

export const SUGGESTION_MAX = 50;
export const SUGGESTION_TEXT_MAX = 500;
export const SUGGEST_DM_MIN_GAP_MS = 30 * 60_000;

export function readGroupSuggestConfig(env: NodeJS.ProcessEnv = process.env): GroupSuggestConfig | null {
  if (env.ZOE_GROUP_SUGGEST !== '1') return null;
  const parseIds = (raw: string | undefined): Set<string> => new Set(
    (raw ?? '').split(',').map((s) => s.trim()).filter((s) => /^-?\d+$/.test(s)),
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
  return !!cfg && cfg.chats.has(String(input.chatId)) && cfg.senders.has(String(input.fromId)) &&
    !input.isBot && text.length >= 12 && !text.startsWith('/');
}

function safeSender(raw: string): string {
  const clean = raw.trim().replace(/\s+/g, ' ');
  if (!clean || clean.startsWith('@') || /^user:/i.test(clean) || /^-?\d+$/.test(clean)) return 'a member';
  return clean.replace(/[@<>`*#\[\]{}]/g, '').slice(0, 80) || 'a member';
}

export function makeSuggestion(input: Omit<GroupSuggestion, 'id' | 'at'>, now: Date = new Date()): GroupSuggestion {
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

async function readStored(home: string): Promise<GroupSuggestion[]> {
  try {
    const raw = await fs.readFile(pendingPath(home), 'utf8');
    const parsed = PendingSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      console.error('[zoe/group-suggest] corrupt pending file; treating it as empty');
      return [];
    }
    return parsed.data.slice(-SUGGESTION_MAX);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error('[zoe/group-suggest] could not read pending file:', (err as Error).message);
    }
    return [];
  }
}

async function writeStored(home: string, items: GroupSuggestion[]): Promise<void> {
  const dir = join(home, 'group-suggest');
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(pendingPath(home), JSON.stringify(items.slice(-SUGGESTION_MAX), null, 2), 'utf8');
}

export async function addPending(home: string, suggestion: GroupSuggestion): Promise<boolean> {
  const kind = containsSecret(suggestion.text) ? 'secret' : containsPii(suggestion.text) ? 'PII' : null;
  if (kind) {
    console.error(`[zoe/group-suggest] skipped suggestion containing ${kind}`);
    return false;
  }
  const current = await readStored(home);
  current.push(SuggestionSchema.parse(suggestion));
  await writeStored(home, current);
  return true;
}

export async function readPending(home: string): Promise<GroupSuggestion[]> {
  return readStored(home);
}

export async function takePending(home: string, id: string): Promise<GroupSuggestion | null> {
  const current = await readStored(home);
  const index = current.findIndex((s) => s.id === id);
  if (index < 0) return null;
  const [item] = current.splice(index, 1);
  await writeStored(home, current);
  return item;
}

export async function appendKept(home: string, suggestion: GroupSuggestion): Promise<void> {
  const dir = join(home, 'group-suggest');
  await fs.mkdir(dir, { recursive: true });
  const line = `- ${suggestion.at.slice(0, 10)} ${suggestion.sender} in ${suggestion.chatTitle}: ${suggestion.text.replace(/[\r\n]+/g, ' ')}`;
  await fs.appendFile(join(dir, 'kept.md'), `${line}\n`, 'utf8');
}

export function dueToSend(lastSentMs: number | null, nowMs: number): boolean {
  return lastSentMs === null || nowMs - lastSentMs >= SUGGEST_DM_MIN_GAP_MS;
}

export function renderCard(s: GroupSuggestion): string {
  return `Suggestion from ${safeSender(s.sender)} in ${s.chatTitle.replace(/[@*`#]/g, '')}:\n${s.text.replace(/[@*`#]/g, '')}\nKeep saves it to your list. It does not change how I behave.`;
}
