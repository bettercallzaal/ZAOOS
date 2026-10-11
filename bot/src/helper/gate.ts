/**
 * gate.ts - every limit on the North Creek helper that must hold whatever the
 * model says. Design: research/agents/2661-north-creek-helper-telegram-bot.
 *
 * The helper answers one outside collaborator's questions about his own
 * website. He is not a ZAO member, so each rule that protects Zaal lives here
 * in code, not in the prompt: who may talk to it, how many questions a day,
 * the footer on every answer, and what is never forwarded to the model.
 *
 * Pure: no I/O, no clock of its own, no env reads. index.ts supplies those.
 */

/** Appended to every answer in code. The brief says the same; this does not rely on it. */
export const FOOTER = 'I cannot commit Zaal to anything.';

export const CAP_LINE = 'That is the limit for today. Ask Zaal directly or try tomorrow.';

export const SECRET_LINE =
  'That looks like a password, a login code or a key, so I did not read it. ' +
  'Change it now, and never send one here.';

export const DEFAULT_DAILY_CAP = 40;

/** Telegram refuses a message over 4096 characters; leave room for the footer. */
const MAX_ANSWER_CHARS = 3900;

export function withFooter(answer: string): string {
  const body = answer.trim().slice(0, MAX_ANSWER_CHARS);
  return `${body}\n\n${FOOTER}`;
}

/**
 * HELPER_ALLOWED_IDS is a comma-separated list of numeric Telegram user ids.
 * Anything that is not a positive integer is dropped, so a typo cannot widen
 * the list. An empty or unset value allows nobody.
 */
export function parseAllowedIds(raw: string | undefined): number[] {
  if (!raw) return [];
  const ids = raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => /^\d+$/.test(s))
    .map(Number)
    .filter((n) => Number.isSafeInteger(n) && n > 0);
  return [...new Set(ids)];
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

/** Token variables of the other bots in this repo. One poller per token (agent-loops rule 9). */
export const OTHER_TOKEN_VARS = [
  'ZOE_BOT_TOKEN',
  'BOT_TOKEN',
  'TELEGRAM_BOT_TOKEN',
  'ZAOSTOCK_BOT_TOKEN',
  'ZAO_DEVZ_BOT_TOKEN',
  'HERMES_BOT_TOKEN',
  'COWORK_BOT_TOKEN',
] as const;

/**
 * The name of another bot's token variable that holds the same value as ours,
 * or null. A match means this process would poll as that bot and split its
 * updates, so the caller must exit before polling.
 */
export function tokenCollision(
  env: Record<string, string | undefined>,
  ownToken: string,
): string | null {
  for (const name of OTHER_TOKEN_VARS) {
    const other = env[name]?.trim();
    if (other && other === ownToken.trim()) return name;
  }
  return null;
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

export function parseCap(raw: string | undefined): number {
  const n = Number(raw);
  return Number.isSafeInteger(n) && n > 0 ? n : DEFAULT_DAILY_CAP;
}

/**
 * Decide whether one more question fits under today's cap, and return the
 * state to store. A refused question is not counted. A new day starts at zero.
 * `prior` is null when the state file is missing or unreadable.
 */
export function capCheck(
  prior: CapState | null,
  now: Date,
  cap: number,
): { allowed: boolean; next: CapState } {
  const day = easternDay(now);
  const used = prior && prior.day === day && Number.isSafeInteger(prior.count) ? prior.count : 0;
  if (used >= cap) return { allowed: false, next: { day, count: used } };
  return { allowed: true, next: { day, count: used + 1 } };
}
