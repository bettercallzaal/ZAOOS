/**
 * gate.ts - every limit on the North Creek helper that must hold whatever the
 * model says. Design: research/agents/2661-north-creek-helper-telegram-bot.
 *
 * The helper answers one outside collaborator's questions about his own
 * website. He is not a ZAO member, so each rule that protects Zaal lives here
 * in code, not in the prompt: who may talk to it, how much, the footer on
 * every answer, and what is never forwarded to the model.
 *
 * FAIL CLOSED. Every function here that reads configuration or state has
 * three answers, not two: good, absent, and unreadable. Absent or unreadable
 * never means "allow": the process refuses to start, or the bot refuses to
 * answer. A missing setting must not read as "no limit".
 *
 * Pure: no I/O, no clock of its own, no env reads. index.ts supplies those.
 */

/** Appended to every answer in code. The brief says the same; this does not rely on it. */
export const FOOTER = 'I cannot commit Zaal to anything.';

export const CAP_LINE = 'That is the limit for today. Ask Zaal directly or try tomorrow.';
export const CAP_UNREADABLE_LINE =
  'I cannot check how many questions have been asked today, so I am not answering. Tell Zaal.';
export const SLOW_LINE = 'That is a lot of questions at once. Give me a few minutes.';
export const TOO_LONG_LINE =
  'That message is too long for me. Send the one part you are stuck on, in a few lines.';
export const SECRET_LINE =
  'That looks like a password, a login code or a key, so I did not read it. ' +
  'Change it now, and never send one here.';

/** Sent in place of an answer that itself looks like a credential. */
export const OUTGOING_SECRET_LINE =
  'My answer had something in it that looked like a password or a key, so I did not send it. Ask me again another way.';

export const DEFAULT_DAILY_CAP = 40;
/** Above this a cap is a typo, not a limit. */
export const MAX_DAILY_CAP = 500;

/** Longest question forwarded to the model. A pasted page is not a question. */
export const MAX_QUESTION_CHARS = 2000;

/** Telegram refuses a message over 4096 characters; leave room for the footer. */
const MAX_ANSWER_CHARS = 3900;

export function withFooter(answer: string): string {
  const body = answer.trim().slice(0, MAX_ANSWER_CHARS);
  return `${body}\n\n${FOOTER}`;
}

export type Parsed<T> = { ok: true; value: T } | { ok: false; why: string };

/** The collaborator and Zaal. A third id is a change to the design (doc 2661), not a setting. */
export const MAX_ALLOWED_IDS = 2;

/**
 * HELPER_ALLOWED_IDS: a comma-separated list of numeric Telegram user ids.
 * Unset, empty, or holding any entry that is not a positive whole number is a
 * refusal to start. A typo is reported, never dropped: a list that silently
 * shrank or silently accepted a stray token is a list nobody checked.
 */
export function parseAllowedIds(raw: string | undefined): Parsed<number[]> {
  if (raw === undefined || !raw.trim()) return { ok: false, why: 'HELPER_ALLOWED_IDS is not set' };
  const ids: number[] = [];
  for (const part of raw.split(',')) {
    const entry = part.trim();
    if (!/^\d+$/.test(entry)) {
      return { ok: false, why: `HELPER_ALLOWED_IDS has an entry that is not a numeric id` };
    }
    const n = Number(entry);
    if (!Number.isSafeInteger(n) || n <= 0) {
      return { ok: false, why: 'HELPER_ALLOWED_IDS has an entry that is not a valid id' };
    }
    if (!ids.includes(n)) ids.push(n);
  }
  if (ids.length > MAX_ALLOWED_IDS) {
    return { ok: false, why: `HELPER_ALLOWED_IDS holds more than ${MAX_ALLOWED_IDS} ids` };
  }
  return { ok: true, value: ids };
}

export function isAllowed(allowed: readonly number[], fromId: number | undefined): boolean {
  return fromId !== undefined && allowed.includes(fromId);
}

/**
 * What a stranger hears. It tells them their own id because a bot cannot look
 * a person up: this is how Zaal learns the number to add to the allowlist.
 */
export function refusalLine(fromId: number): string {
  return `This helper is private. Your id is ${fromId}. Send that number to Zaal.`;
}

/**
 * HELPER_DAILY_CAP. Unset means the default. Set to anything that is not a
 * whole number from 1 to MAX_DAILY_CAP is a refusal to start: "lots" must not
 * quietly become 40, and 400000 must not quietly become a limit.
 */
export function parseCap(raw: string | undefined): Parsed<number> {
  if (raw === undefined || !raw.trim()) return { ok: true, value: DEFAULT_DAILY_CAP };
  const entry = raw.trim();
  const n = Number(entry);
  if (!/^\d+$/.test(entry) || !Number.isSafeInteger(n) || n < 1 || n > MAX_DAILY_CAP) {
    return { ok: false, why: `HELPER_DAILY_CAP must be a whole number from 1 to ${MAX_DAILY_CAP}` };
  }
  return { ok: true, value: n };
}

/**
 * The bot this process is allowed to be. A Telegram token is `<bot id>:<secret>`,
 * so the id it will poll as can be read before any network call.
 *
 * The earlier design compared the token with the other bots' token variables
 * "in the environment". This process loads only its own env file, so none of
 * them is ever there and that check could not fire (review of doc 2661). This
 * one needs nothing but the pinned id: HELPER_BOT_ID unset is a refusal to
 * start, and a token for any other bot does not match it.
 */
export function parseBotId(raw: string | undefined): Parsed<number> {
  const entry = raw?.trim() ?? '';
  const n = Number(entry);
  if (!/^\d+$/.test(entry) || !Number.isSafeInteger(n) || n <= 0) {
    return { ok: false, why: 'HELPER_BOT_ID is not set to a numeric bot id' };
  }
  return { ok: true, value: n };
}

/** The bot id a token claims, or null when the token is not shaped like one. */
export function tokenBotId(token: string): number | null {
  const m = /^(\d+):[A-Za-z0-9_-]{20,}$/.exec(token.trim());
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

/**
 * Why this process must not poll, or null when it may. `actualId` is what
 * Telegram's getMe returned; pass undefined for the check before the network.
 */
export function identityProblem(
  expected: number,
  token: string,
  actualId?: number,
): string | null {
  const claimed = tokenBotId(token);
  if (claimed === null) return 'HELPER_BOT_TOKEN is not shaped like a bot token';
  if (claimed !== expected) return 'HELPER_BOT_TOKEN belongs to a different bot than HELPER_BOT_ID';
  if (actualId !== undefined && actualId !== expected) {
    return 'Telegram says this token is a different bot than HELPER_BOT_ID';
  }
  return null;
}

/**
 * The boot check, whole: the token must be for the pinned bot, and Telegram's
 * getMe must agree. A getMe that fails is a refusal too: "could not ask" is
 * never "it is fine". `getMe` is passed in so this can be tested without a bot.
 */
export async function checkIdentity(
  expected: number,
  token: string,
  getMe: () => Promise<{ id: number }>,
): Promise<string | null> {
  const before = identityProblem(expected, token);
  if (before) return before;
  let me: { id: number };
  try {
    me = await getMe();
  } catch {
    return 'could not ask Telegram which bot this token is';
  }
  return identityProblem(expected, token, me.id);
}

/**
 * Is the process that wrote the lock's pid file still running? A live holder
 * blocks a second instance however old the lock's timestamp is, and a dead one
 * frees it at once. Text that is not a pid counts as alive: when in doubt, do
 * not start a second poller.
 */
export function holderAlive(pidText: string | null, isAlive: (pid: number) => boolean): boolean {
  if (pidText === null) return false;
  const entry = pidText.trim();
  const pid = Number(entry);
  if (!/^\d+$/.test(entry) || !Number.isSafeInteger(pid) || pid <= 0) return true;
  return isAlive(pid);
}

const SECRET_SHAPES: readonly RegExp[] = [
  /\bgh[pousr]_[A-Za-z0-9]{20,}/, // GitHub tokens
  /\bgithub_pat_[A-Za-z0-9_]{20,}/,
  /\bsk-[A-Za-z0-9_-]{20,}/, // model API keys
  /\bxox[abprs]-[A-Za-z0-9-]{10,}/, // Slack
  /\bAKIA[0-9A-Z]{16}\b/, // AWS access key id
  /\b\d{8,10}:[A-Za-z0-9_-]{30,}/, // Telegram bot token
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\b[0-9a-fA-F]{64}\b/, // raw 32-byte key. A 40-character git commit id is not matched.
  /\b(pass(word|code)?|login code|verification code|2fa code|recovery code)\b\s*(is|:|=)\s*\S+/i,
];

/** True when a message should not reach the model or the log. */
export function looksLikeSecret(text: string): boolean {
  return SECRET_SHAPES.some((re) => re.test(text));
}

/** YYYY-MM-DD in America/New_York, the day the cap is counted in. */
export function easternDay(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export interface CapState {
  day: string;
  count: number;
}

/** What reading the cap file produced: a state, no file yet, or a file that cannot be trusted. */
export type CapRead = CapState | null | 'unreadable';

/**
 * Turn the cap file's text into a state. Anything that is not exactly
 * `{"day":"YYYY-MM-DD","count":<whole number, 0 or more>}` is 'unreadable'.
 * A corrupt file must not read as "nothing asked yet": that would hand out a
 * fresh day's budget to whoever, or whatever, damaged it.
 */
export function parseCapState(text: string): CapState | 'unreadable' {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return 'unreadable';
  }
  if (typeof raw !== 'object' || raw === null) return 'unreadable';
  const { day, count } = raw as { day?: unknown; count?: unknown };
  if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return 'unreadable';
  if (typeof count !== 'number' || !Number.isSafeInteger(count) || count < 0) return 'unreadable';
  return { day, count };
}

export type CapDecision =
  | { allowed: true; next: CapState }
  | { allowed: false; reason: 'capped' | 'unreadable' };

/**
 * Decide whether one more question fits under today's cap. `prior` is null
 * only when there is no state file at all (the first question ever). An
 * unreadable file, a count that is not a whole number, or a day later than
 * today (a clock that went backwards) is a refusal, not a reset.
 */
export function capCheck(prior: CapRead, now: Date, cap: number): CapDecision {
  if (prior === 'unreadable') return { allowed: false, reason: 'unreadable' };
  const day = easternDay(now);
  let used = 0;
  if (prior !== null) {
    if (!Number.isSafeInteger(prior.count) || prior.count < 0) return { allowed: false, reason: 'unreadable' };
    if (prior.day > day) return { allowed: false, reason: 'unreadable' };
    if (prior.day === day) used = prior.count;
  }
  if (used >= cap) return { allowed: false, reason: 'capped' };
  return { allowed: true, next: { day, count: used + 1 } };
}

/** Per-user burst limit, on top of the daily cap. */
export const RATE_LIMIT = 5;
export const RATE_WINDOW_MS = 5 * 60 * 1000;

/**
 * At most RATE_LIMIT questions per user in any RATE_WINDOW_MS. Returns the
 * stamps to keep. A refused question is not recorded, so waiting works.
 */
export function rateCheck(
  stamps: readonly number[],
  nowMs: number,
): { allowed: boolean; stamps: number[] } {
  const recent = stamps.filter((t) => nowMs - t < RATE_WINDOW_MS && t <= nowMs);
  if (recent.length >= RATE_LIMIT) return { allowed: false, stamps: recent };
  return { allowed: true, stamps: [...recent, nowMs] };
}

/** How long after the last successful poll the heartbeat may still be written. */
export const POLL_FRESH_MS = 2 * 60 * 1000;

/**
 * The heartbeat says "this bot is receiving messages", not "this process
 * exists". If polling has stopped answering, the beat must stop too, or a dead
 * poller looks healthy for as long as the process lingers.
 */
export function pollIsFresh(lastPollOkMs: number | null, nowMs: number): boolean {
  return lastPollOkMs !== null && nowMs - lastPollOkMs >= 0 && nowMs - lastPollOkMs < POLL_FRESH_MS;
}
