/**
 * discord-digest.ts - once a day, ZOE DMs Zaal what happened in the ZM Discord.
 *
 * Zaal, 2026-10-18, picking from five Discord ideas: "All of them". This is B,
 * the private one: at 18:00 ET (before his 20:30 quiet window) a Discord DM to
 * Zaal with the day's counts per channel, questions nobody answered, and the
 * times someone mentioned him and he has not posted since.
 *
 * Built in code, no model call (code-over-inference.md): it is counting and
 * filtering, the same judgment every day. Behind ZOE_DISCORD_DIGEST=1, default
 * off. A day with no messages sends nothing (noisy-signal-guard.md).
 *
 * buildDiscordDigest is pure; discord.ts does the fetching and the sending.
 */
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { cleanLabel } from './discord-admin';
import { ZOE_PATHS } from './memory';

export function discordDigestEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.ZOE_DISCORD_DIGEST === '1';
}

/** 18:00 America/New_York, every day. */
export const DIGEST_CRON = '0 18 * * *';
export const DIGEST_WINDOW_MS = 24 * 60 * 60 * 1000;
/** Per channel, newest first. A busier channel is reported as "100+". */
export const DIGEST_FETCH_LIMIT = 100;
const SNIPPET = 120;
const MAX_LISTED = 8;

export interface DigestMessage {
  id: string;
  authorId: string;
  authorName: string;
  bot: boolean;
  content: string;
  createdAt: number;
  /** The message this one replies to, if any. */
  replyToId?: string;
  mentionsOwner: boolean;
}

export interface DigestChannel {
  id: string;
  name: string;
  /** Oldest first, already limited to the window. */
  messages: DigestMessage[];
  /** True when the fetch hit DIGEST_FETCH_LIMIT, so the count is a floor. */
  capped: boolean;
}

/** cleanLabel's cleaning (no mentions, markup or control characters) with a visible cut. */
function snippet(text: string): string {
  const t = text
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/[@<>`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return t.length > SNIPPET ? `${t.slice(0, SNIPPET - 3)}...` : t;
}

const link = (guildId: string, channelId: string, messageId: string): string =>
  `https://discord.com/channels/${guildId}/${channelId}/${messageId}`;

/**
 * A question nobody answered: a person's message with a "?" that no later
 * message replies to, and whose next message from someone else is not an
 * answer either. The next message from someone else counts as the answer
 * unless it is itself a question. A heuristic, stated as one: a reply that
 * answers without Discord's reply link, several messages later, is missed.
 * Bots count as someone else, so a ZOE answer counts.
 */
function unansweredQuestions(ch: DigestChannel): DigestMessage[] {
  const out: DigestMessage[] = [];
  ch.messages.forEach((m, i) => {
    if (m.bot || !m.content.includes('?')) return;
    const later = ch.messages.slice(i + 1);
    if (later.some((l) => l.replyToId === m.id)) return;
    const next = later.find((l) => l.authorId !== m.authorId);
    if (next && !next.content.includes('?')) return;
    out.push(m);
  });
  return out;
}

/** Someone mentioned Zaal and he has not posted in that channel since. */
function openMentions(ch: DigestChannel, ownerId: string): DigestMessage[] {
  const out: DigestMessage[] = [];
  ch.messages.forEach((m, i) => {
    if (!m.mentionsOwner || m.authorId === ownerId || m.bot) return;
    if (!ch.messages.slice(i + 1).some((l) => l.authorId === ownerId)) out.push(m);
  });
  return out;
}

/** The digest text, or null when nobody posted in the window. */
export function buildDiscordDigest(guildName: string, guildId: string, channels: DigestChannel[], ownerId: string): string | null {
  const active = channels
    .map((c) => ({ c, people: c.messages.filter((m) => !m.bot) }))
    .filter((x) => x.people.length > 0)
    .sort((a, b) => b.people.length - a.people.length);
  if (active.length === 0) return null;

  const total = active.reduce((n, x) => n + x.people.length, 0);
  const people = new Set(active.flatMap((x) => x.people.map((m) => m.authorId)));
  const anyCapped = active.some((x) => x.c.capped);
  const lines: string[] = [
    `${guildName}, last 24 hours: ${total}${anyCapped ? '+' : ''} messages from ${people.size} ${people.size === 1 ? 'person' : 'people'} in ${active.length} ${active.length === 1 ? 'channel' : 'channels'}.`,
    '',
    ...active.slice(0, MAX_LISTED).map((x) => `#${x.c.name}: ${x.people.length}${x.c.capped ? '+' : ''}`),
  ];
  if (active.length > MAX_LISTED) lines.push(`and ${active.length - MAX_LISTED} more`);

  const questions = active.flatMap((x) => unansweredQuestions(x.c).map((m) => ({ c: x.c, m })));
  if (questions.length > 0) {
    lines.push('', `Questions nobody answered (${questions.length}):`);
    for (const { c, m } of questions.slice(0, MAX_LISTED)) {
      lines.push(`- #${c.name}, ${cleanLabel(m.authorName)}: "${snippet(m.content)}" ${link(guildId, c.id, m.id)}`);
    }
  }

  const mentions = active.flatMap((x) => openMentions(x.c, ownerId).map((m) => ({ c: x.c, m })));
  if (mentions.length > 0) {
    lines.push('', `Mentioned you, no reply from you yet (${mentions.length}):`);
    for (const { c, m } of mentions.slice(0, MAX_LISTED)) {
      lines.push(`- #${c.name}, ${cleanLabel(m.authorName)}: "${snippet(m.content)}" ${link(guildId, c.id, m.id)}`);
    }
  }
  return lines.join('\n');
}

/** One send per server per day, across restarts. False when today's already went. */
export async function claimDigestDay(guildId: string, now: Date = new Date(), dir: string = join(ZOE_PATHS.home, 'sentinels')): Promise<boolean> {
  const day = now.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.writeFile(join(dir, `discord-digest-${guildId}-${day}`), now.toISOString(), { flag: 'wx' });
    return true;
  } catch {
    return false;
  }
}
