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
 * what she should call them, and says how to answer. Only a message that is
 * nothing but "call me X" or "my name is X" sets the name (Evaluator, #4014:
 * guessing from short replies made "sounds good" and "Portland" into names, and
 * "call me tomorrow about the gig" into "tomorrow about the gig").
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
export const NAME_ASK_LINE = 'Quick one, so I get it right next time: what would you like me to call you? Reply "call me" and your name.';
/**
 * The thanks in a guild channel. It names nobody: the name is unreviewed text,
 * and in a channel the whole server would read it (Evaluator note 6, #4014).
 * A DM gets nameOnlyReply, which says the name back.
 */
export const NAME_SAVED_PUBLIC_LINE = 'Got it. I will use that name from now on.';

export type Platform = 'discord' | 'telegram';

export interface Person {
  platform: Platform;
  id: string;
  /** The platform username at the last turn. */
  handle: string;
  /** What they asked to be called. Absent until they say. */
  name?: string;
  /** When the name question was delivered. Set once, after it was sent; she never asks twice. */
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
 * . ' - only, at most three words, none of them a word no name is made of,
 * and never a name that would pass as Zaal or ZOE. The name goes into the
 * model's prompt as the sender label, so anything that could carry an
 * instruction is refused.
 */
export function cleanPreferredName(raw: string): string | null {
  const s = raw
    .trim()
    .replace(/^["'`]+|["'`.!]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!s || s.length > MAX_NAME_CHARS) return null;
  if (!/^[\p{L}\p{N}][\p{L}\p{N} .'-]*$/u.test(s)) return null;
  const words = s.toLowerCase().split(' ');
  if (words.length > 3) return null;
  if (RESERVED_NAMES.has(s.toLowerCase())) return null;
  // "call me back later", "call me tomorrow": a word no name is made of means
  // the phrase was an ordinary request (Evaluator, #4014).
  if (words.some((w) => NOT_NAME_WORDS.has(w))) return null;
  return s;
}

const NOT_NAME_WORDS = new Set([
  'a', 'an', 'the', 'about', 'after', 'again', 'at', 'back', 'before', 'by', 'for', 'if', 'in', 'later',
  'maybe', 'me', 'now', 'on', 'please', 'pls', 'soon', 'then', 'to', 'today', 'tomorrow', 'tonight',
  'when', 'whenever', 'with', 'you', 'asap', 'sometime', 'anytime', 'whatever', 'anything',
]);

/** Names that would pass as someone else in the prompt or on Zaal's approval card (Evaluator, #4014). */
const RESERVED_NAMES = new Set([
  'zaal', 'zaal panthaki', 'bettercallzaal', 'zoe', 'zoe agent', 'zao', 'the zao', 'admin', 'administrator',
  'mod', 'moderator', 'owner', 'system', 'assistant', 'user', 'claude', 'everyone', 'here', 'bot',
]);

/** The whole message, and nothing else: "call me X", "my name is X", "I go by X". */
const CALL_ME = /^\s*(?:please\s+)?(?:call me|my name is|my name's|i go by)\s+(.+?)\s*[.!]*\s*$/i;

/**
 * The name in a message, or null. Only a message that is nothing but the
 * phrase and the name counts, so a question that happens to contain "call me"
 * is answered, not mistaken for a name.
 */
export function parseNameAnswer(text: string): string | null {
  if (text.includes('\n') || text.includes('?')) return null;
  const m = CALL_ME.exec(text);
  return m ? cleanPreferredName(m[1]) : null;
}

export interface PeopleTurn {
  /** The table after this turn. Save it. */
  people: People;
  person: Person;
  /** What ZOE should call them in this turn. */
  label: string;
  /** Set when the message was only their name: reply with this, no model turn. */
  nameOnlyReply?: string;
  /** Append to ZOE's reply: the one-time name question. Call markAsked once it is sent. */
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

  // The message was nothing but their name, so it gets a short thanks instead of a model turn.
  let nameOnlyReply: string | undefined;
  const name = parseNameAnswer(input.text);
  if (name) {
    person.name = name;
    nameOnlyReply = `Nice to meet you, ${name}. I will call you that from now on.`;
  }

  // askedAt is set by markAsked, after the question was actually sent.
  const askSuffix = !person.name && !person.askedAt ? `\n\n${NAME_ASK_LINE}` : '';

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

/** Record that the name question reached them, so it is never asked again. Never throws. */
export async function markAsked(
  platform: Platform,
  id: string | number,
  now: Date = new Date(),
  path: string = peoplePath(),
): Promise<void> {
  try {
    const people = await loadPeople(path);
    const key = personKey(platform, id);
    const person = people[key];
    if (!person || person.askedAt) return;
    await savePeople({ ...people, [key]: { ...person, askedAt: now.toISOString() } }, path);
  } catch (err) {
    console.error('[zoe/people] ask not recorded:', err instanceof Error ? err.message : String(err));
  }
}
