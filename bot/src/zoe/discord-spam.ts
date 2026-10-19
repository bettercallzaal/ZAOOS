/**
 * discord-spam.ts - ZOE watches ZM for likely spam and tells Zaal; it never acts alone.
 *
 * Zaal, 2026-10-18, picking from five Discord ideas: "All of them". This is E:
 * a message that looks like a scam gets DMed to Zaal with the reasons, a link,
 * and buttons to time the person out or kick them. Nothing happens until he
 * presses one, and kick asks him twice. Deleting the message stays his own
 * hand in Discord: it cannot be undone.
 *
 * Behind ZOE_DISCORD_SPAM_WATCH=1, default off. Scoring is pure and in code;
 * discord.ts supplies the message, the account age and the recent history.
 * The heuristics are stated as heuristics: a false alarm costs Zaal one look,
 * and nothing is done to the member without his press.
 */
export function spamWatchEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.ZOE_DISCORD_SPAM_WATCH === '1';
}

/** Score at which ZOE tells Zaal. */
export const SPAM_ALERT_SCORE = 3;
const NEW_ACCOUNT_DAYS = 7;
const CROSS_POST_WINDOW_MS = 2 * 60 * 1000;
const CROSS_POST_CHANNELS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

const LINK = /\bhttps?:\/\/\S+|\bwww\.\S+/i;
const INVITE = /\b(?:discord\.gg|discord(?:app)?\.com\/invite)\/[\w-]+/i;
/** Domains that pose as Discord or Steam but are not them. */
const LOOKALIKE = /\b(?!discord\.com\b|discord\.gg\b|discordapp\.com\b)d[il1]s[ckq]o?r[dcl]\w*[-.][\w.-]*\.[a-z]{2,}|\bst[ea]{2}mc?o?mm?un\w*\.[a-z]{2,}/i;
const LURE =
  /\b(?:free\s+nitro|nitro\s+(?:gift|free)|steam\s+gift|airdrop|claim\s+(?:your|now|reward|prize)|connect\s+(?:your\s+)?wallet|validate\s+(?:your\s+)?wallet|wallet\s+(?:sync|verification)|mint\s+(?:now|live)|giveaway\s+winner|dm\s+me\s+for|crypto\s+(?:signals?|profits?)|guaranteed\s+(?:profit|returns?))\b/i;
const MASS_PING = /@(?:everyone|here)\b/;

export interface SpamInput {
  content: string;
  accountAgeMs: number;
  /** The author may mention everyone (an admin or mod): their pings are not spam. */
  canMentionEveryone: boolean;
  /** How many other channels got the same text from this person in the last two minutes. */
  sameTextOtherChannels: number;
}

export interface SpamVerdict {
  score: number;
  reasons: string[];
}

/** Pure scoring. Each reason says what tripped it, in plain words. */
export function scoreSpam(m: SpamInput): SpamVerdict {
  const reasons: string[] = [];
  let score = 0;
  const add = (n: number, why: string): void => {
    score += n;
    reasons.push(why);
  };
  const hasLink = LINK.test(m.content);
  const newAccount = m.accountAgeMs < NEW_ACCOUNT_DAYS * DAY_MS;
  if (LOOKALIKE.test(m.content)) add(3, 'a link that imitates Discord or Steam');
  if (LURE.test(m.content)) add(hasLink ? 2 : 1, hasLink ? 'a giveaway, wallet or airdrop lure with a link' : 'giveaway, wallet or airdrop wording');
  if (INVITE.test(m.content)) add(newAccount ? 2 : 1, 'an invite to another Discord server');
  if (MASS_PING.test(m.content) && !m.canMentionEveryone) add(2, 'tries to ping everyone');
  if (m.sameTextOtherChannels + 1 >= CROSS_POST_CHANNELS) add(3, `the same message in ${m.sameTextOtherChannels + 1} channels within two minutes`);
  if (newAccount && (hasLink || INVITE.test(m.content))) {
    add(1, `account is ${Math.max(0, Math.floor(m.accountAgeMs / DAY_MS))} day(s) old and posts a link`);
  }
  return { score, reasons };
}

/** Recent posts per person, for the cross-post check. In memory, two minutes deep. */
export interface RecentPosts {
  byUser: Map<string, Array<{ text: string; channelId: string; at: number }>>;
}

export function newRecentPosts(): RecentPosts {
  return { byUser: new Map() };
}

/** Record this post and return how many OTHER channels got the same text inside the window. */
export function recordPost(state: RecentPosts, userId: string, channelId: string, text: string, nowMs: number): number {
  const norm = text.trim().toLowerCase().replace(/\s+/g, ' ');
  const kept = (state.byUser.get(userId) ?? []).filter((p) => nowMs - p.at < CROSS_POST_WINDOW_MS);
  const others = new Set(kept.filter((p) => p.text === norm && p.channelId !== channelId).map((p) => p.channelId));
  kept.push({ text: norm, channelId, at: nowMs });
  state.byUser.set(userId, kept);
  for (const [id, posts] of state.byUser) {
    if (!posts.some((p) => nowMs - p.at < CROSS_POST_WINDOW_MS)) state.byUser.delete(id);
  }
  return others.size;
}

/** One alert per person per ten minutes, and at most 30 a day, so a raid cannot flood his DMs. */
export interface AlertLimiter {
  lastByUser: Map<string, number>;
  day: number[];
}

export function newAlertLimiter(): AlertLimiter {
  return { lastByUser: new Map(), day: [] };
}

export function allowAlert(state: AlertLimiter, userId: string, nowMs: number): boolean {
  state.day = state.day.filter((t) => nowMs - t < DAY_MS);
  const last = state.lastByUser.get(userId);
  if ((last !== undefined && nowMs - last < 10 * 60 * 1000) || state.day.length >= 30) return false;
  state.lastByUser.set(userId, nowMs);
  state.day.push(nowMs);
  return true;
}

/** The DM text. Member text is cleaned so it cannot ping or carry markup. */
export function spamAlertText(p: { authorName: string; channelName: string; content: string; url: string; verdict: SpamVerdict }): string {
  const t = p.content
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/[@<>`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const snippet = t.length > 200 ? `${t.slice(0, 197)}...` : t;
  return [
    `Possible spam in #${p.channelName} from ${p.authorName.replace(/[@<>`]/g, '')}:`,
    `"${snippet}"`,
    p.url,
    `Why: ${p.verdict.reasons.join('; ')}.`,
    'Nothing has been done. Deleting the message is yours in Discord.',
  ].join('\n');
}

/** Button ids carry the server, because the press happens in a DM. */
export const SPAM_BUTTON_PREFIX = 'zadm_spam_';
export type SpamAction = 'to60' | 'to1440' | 'kick' | 'kickyes' | 'ignore';

export function spamButtonId(action: SpamAction, guildId: string, userId: string): string {
  return `${SPAM_BUTTON_PREFIX}${action}_${guildId}_${userId}`;
}

export function parseSpamButton(id: string): { action: SpamAction; guildId: string; userId: string } | null {
  const m = id.match(/^zadm_spam_(to60|to1440|kick|kickyes|ignore)_(\d{5,25})_(\d{5,25})$/);
  return m ? { action: m[1] as SpamAction, guildId: m[2], userId: m[3] } : null;
}
