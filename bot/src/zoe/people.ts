/**
 * people.ts - who has talked to ZOE, and what they want to be called.
 *
 * Zaal, 2026-10-18: "we should log every person who talks to zoe as well by
 * asking them their preferred name". He chose a private list on the VPS with
 * nothing sent to Bonfire (option A), because Bonfire is read by every agent
 * on the graph and pii-hygiene.md bans contact data there.
 *
 * With ZOE_PEOPLE_LOG=1 (default OFF), every turn from someone who is not Zaal
 * (a Discord DM or @mention, a Telegram member DM) updates one row:
 * platform, id, handle, preferred name, first seen, last seen, turn count.
 * The first time someone talks to ZOE she answers them and then asks, once,
 * what she should call them. A short reply to that question, or "call me X"
 * at any time, sets the name, and ZOE uses it from then on.
 *
 * The file lives in ZOE's home (outside the repo), owner-only (0600), and is
 * capped at MAX_PEOPLE rows. Nothing here is sent anywhere.
 *
 * Everything but loadPeople and savePeople is pure.
 */
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { ZOE_PATHS } from './memory';

export const MAX_PEOPLE = 5000;
export const MAX_NAME_CHARS = 32;
/** Asked once, appended to ZOE's first reply to someone new. */
export const NAME_ASK_LINE = 'Quick one, so I get it right next time: what would you like me to call you?';

export type Platform = 'discord' | 'telegram';

export interface Person {
  platform: Platform;
  id: string;
  /** The platform username at the last turn. */
  handle: string;
  /** What they asked to be called. Absent until they say. */
  name?: string;
  /** When ZOE asked for a name. Set once; she never asks twice. */
  askedAt?: string;
  firstSeen: string;
  lastSeen: string;
  turns: number;
}

export type People = Record<string, Person>;

export function peopleLogEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.ZOE_PEOPLE_LOG === '1';
}

export const peoplePath = (): string => join(ZOE_PATHS.home, 'people.json');

export const personKey = (platform: Platform, id: string | number): string => `${platform}:${id}`;

/**
 * A name a person may be called: letters (any script), digits, spaces and
 * . ' - only, at most four words. The name goes into the model's prompt as the
 * sender label, so anything that could carry an instruction is refused.
 */
export function cleanPreferredName(raw: string): string | null {
  const s = raw
    .trim()
    .replace(/^["'`]+|["'`.!]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!s || s.length > MAX_NAME_CHARS) return null;
  if (!/^[\p{L}\p{N}][\p{L}\p{N} .'-]*$/u.test(s)) return null;
  if (s.split(' ').length > 4) return null;
  return s;
}

const CALL_ME = /\b(?:call me|my name is|my name's|i go by)\s+(.+)$/i;
const SHORT_ANSWER_PREFIX = /^(?:it'?s|i'?m|im|just|you can call me|call me)\s+/i;

/**
 * The name in a message, if it gives one. "call me X" and "my name is X" count
 * at any time. Right after ZOE asked, a short reply on its own ("Ilana", "it's
 * Ilana") counts too. A question or a sentence never does.
 */
export function parseNameAnswer(text: string, justAsked: boolean): string | null {
  const t = text.trim();
  const explicit = CALL_ME.exec(t);
  if (explicit) return cleanPreferredName(explicit[1].split(/[,;\n]/)[0]);
  if (!justAsked || t.includes('?') || t.includes('\n')) return null;
  const firstWord = t.toLowerCase().split(/[\s,.!]+/)[0];
  if (NOT_A_NAME.has(firstWord)) return null;
  return cleanPreferredName(t.replace(SHORT_ANSWER_PREFIX, ''));
}

/** Short replies that answer something else ("ok thanks") and are not names. */
const NOT_A_NAME = new Set([
  'ok', 'okay', 'k', 'thanks', 'thank', 'thx', 'ty', 'yes', 'yeah', 'yep', 'no', 'nope', 'nah',
  'sure', 'cool', 'nice', 'great', 'lol', 'haha', 'hi', 'hello', 'hey', 'gm', 'gn', 'what', 'why',
  'how', 'who', 'when', 'where', 'please', 'pls', 'later', 'idk', 'whatever', 'anything', 'none',
]);

export interface PeopleTurn {
  /** The table after this turn. Save it. */
  people: People;
  person: Person;
  /** What ZOE should call them in this turn. */
  label: string;
  /** Set when the message was only their name: reply with this, no model turn. */
  nameOnlyReply?: string;
  /** Append to ZOE's reply: the one-time name question. */
  askSuffix: string;
}

/** One turn from someone who is not Zaal. Pure: the caller loads and saves. */
export function notePersonTurn(
  people: People,
  input: { platform: Platform; id: string | number; handle: string; text: string; now: Date },
): PeopleTurn {
  const key = personKey(input.platform, input.id);
  const ts = input.now.toISOString();
  const prev = people[key];
  if (!prev && Object.keys(people).length >= MAX_PEOPLE) {
    console.warn(`[zoe/people] list is at ${MAX_PEOPLE} people; ${key} not recorded`);
    const label = input.handle;
    return { people, person: { platform: input.platform, id: String(input.id), handle: input.handle, firstSeen: ts, lastSeen: ts, turns: 1 }, label, askSuffix: '' };
  }
  const person: Person = prev
    ? { ...prev, handle: input.handle, lastSeen: ts, turns: prev.turns + 1 }
    : { platform: input.platform, id: String(input.id), handle: input.handle, firstSeen: ts, lastSeen: ts, turns: 1 };

  let nameOnlyReply: string | undefined;
  // "Just asked" means the question rode on ZOE's reply to their previous turn.
  const justAsked = !!prev?.askedAt && prev.askedAt === prev.lastSeen && !prev.name;
  const name = parseNameAnswer(input.text, justAsked);
  if (name) {
    person.name = name;
    // A reply that was nothing but the name gets a short thanks instead of a model turn.
    if (!CALL_ME.test(input.text) || input.text.trim().split(/\s+/).length <= 6) {
      nameOnlyReply = `Nice to meet you, ${name}. I will call you that from now on.`;
    }
  }

  let askSuffix = '';
  if (!person.name && !person.askedAt) {
    person.askedAt = ts;
    askSuffix = `\n\n${NAME_ASK_LINE}`;
  }

  return {
    people: { ...people, [key]: person },
    person,
    label: person.name ?? input.handle,
    nameOnlyReply,
    askSuffix,
  };
}

/** A missing or damaged file is an empty list; damage is logged, never thrown. */
export async function loadPeople(path: string = peoplePath()): Promise<People> {
  let text: string;
  try {
    text = await fs.readFile(path, 'utf8');
  } catch {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(text);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as People;
  } catch {
    // fall through
  }
  console.error(`[zoe/people] ${path} did not parse; treating as empty and not overwriting it this turn`);
  throw new Error('people file unreadable');
}

/** Owner-only, written to a temp file and renamed so a crash never leaves half a file. */
export async function savePeople(people: People, path: string = peoplePath()): Promise<void> {
  await fs.mkdir(join(path, '..'), { recursive: true });
  const tmp = `${path}.tmp`;
  await fs.writeFile(tmp, `${JSON.stringify(people, null, 1)}\n`, { mode: 0o600 });
  await fs.rename(tmp, path);
}

/**
 * Load, note, save. Any file error leaves the turn exactly as it was without
 * the list: the person still gets their answer, under their handle.
 */
export async function recordPersonTurn(
  input: { platform: Platform; id: string | number; handle: string; text: string; now?: Date },
  path: string = peoplePath(),
): Promise<PeopleTurn | null> {
  try {
    const people = await loadPeople(path);
    const turn = notePersonTurn(people, { ...input, now: input.now ?? new Date() });
    await savePeople(turn.people, path);
    return turn;
  } catch (err) {
    console.error('[zoe/people] person not recorded:', err instanceof Error ? err.message : String(err));
    return null;
  }
}
