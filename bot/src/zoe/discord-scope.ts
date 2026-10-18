/**
 * Which memory scope a Discord message gets, and whether a community reply
 * may go out when Zaal could not be asked.
 *
 * Measured 2026-09-18 (zj seat audit): discord.ts loaded
 * buildMemoryBlocks('private') for EVERY reply, guild channels included. That
 * is Zaal's human profile, private tasks, decisions and inbox loaded into an
 * answer posted in a public channel. Telegram groups never got that: they go
 * through a chat-id scope and buildGroupContext's sanitized block. Discord now
 * takes the same path. Pure so it can be tested without a Discord client.
 */

import { allowMemberTurn, type MemberDmLimiter } from './member-dm';

export interface DiscordScopeInput {
  isDM: boolean;
  authorId: string;
  channelId: string;
  ownerId: string | undefined;
}

/**
 * 'private' only for Zaal's own DM. Any other DM is scoped to that user, any
 * guild channel to that channel, so nothing private is ever loaded for them.
 */
export function discordScopeFor(m: DiscordScopeInput): 'private' | string {
  if (m.isDM && m.ownerId && m.authorId === m.ownerId) return 'private';
  if (m.isDM) return `discord-dm:${m.authorId}`;
  return `discord:${m.channelId}`;
}

/**
 * Whether ZOE replies to a message at all. Reading a whole channel (Message
 * Content) never makes ZOE speak in it: only a DM, or an @mention of ZOE in a
 * guild text channel, gets a reply. Zaal, 2026-10-18, option A.
 */
export function discordShouldReply(m: { isDM: boolean; isGuildText: boolean; mentioned: boolean }): boolean {
  return m.isDM || (m.isGuildText && m.mentioned);
}

/** The one method of discord.js `MessageMentions` this needs. */
export interface MentionsLike {
  has(id: string, options?: { ignoreEveryone?: boolean; ignoreRoles?: boolean }): boolean;
}

/**
 * True only when ZOE itself is @mentioned. discord.js `has()` defaults to
 * ignoreEveryone=false and ignoreRoles=false (MessageMentions.js, 14.14.0), so
 * the bare call answered every @everyone and @here, and any role ZOE holds,
 * in every channel. Evaluator finding on #3998, 2026-10-17.
 */
export function mentionsZoe(mentions: MentionsLike, botId: string | undefined): boolean {
  if (!botId) return false;
  return mentions.has(botId, { ignoreEveryone: true, ignoreRoles: true });
}

/**
 * Turns per hour for anyone on Discord who is not Zaal. Every DM and every
 * @mention is a full model turn, and before 2026-10-17 nothing bounded them
 * (doc 2685 D1). Same default as Telegram member DMs (member-dm.ts).
 */
export const DISCORD_DEFAULT_PER_HOUR = 6;

export function discordTurnsPerHour(env: NodeJS.ProcessEnv = process.env): number {
  const n = Number(env.DISCORD_TURNS_PER_HOUR);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : DISCORD_DEFAULT_PER_HOUR;
}

/** Zaal is never limited; everyone else shares the per-user hourly window. */
export function discordTurnAllowed(
  limiter: MemberDmLimiter,
  authorId: string,
  ownerId: string | undefined,
  nowMs: number,
  perHour: number,
): boolean {
  if (ownerId && authorId === ownerId) return true;
  return allowMemberTurn(limiter, authorId, nowMs, perHour);
}

/**
 * A community ask that could not reach Zaal for approval is HELD, not sent.
 * The old fallback sent the unapproved draft "if Zaal DM fails", which is the
 * one case where the approval flow was doing its job.
 */
export function communityAskOutcome(zaalNotified: boolean): 'queued' | 'held' {
  return zaalNotified ? 'queued' : 'held';
}

/**
 * Whether ZOE reads whole guild channels (the privileged Message Content
 * intent). On unless DISCORD_CHANNEL_READ is "0". Zaal, 2026-10-18: ZOE helps
 * in the ZAO Discords, which means reading channels, not only DMs and
 * @mentions. With it on, the Developer Portal toggle must be on too, or Discord
 * closes the gateway with code 4014. "0" drops the intent and goes back to
 * DMs and @mentions only, with no Portal change needed.
 */
export function discordChannelRead(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.DISCORD_CHANNEL_READ !== '0';
}

/** How many earlier messages in the same channel an @mention reply sees. */
export const DISCORD_CONTEXT_MESSAGES = 15;
const DISCORD_CONTEXT_MAX_CHARS = 3000;

export interface ChannelMessageLike {
  author: string;
  content: string;
}

/**
 * The recent conversation in ONE channel, oldest first, as a block placed
 * before the question. Only that channel's own messages: nothing from another
 * channel, a DM or Zaal's private memory enters it, and the turn still runs
 * under the channel's group scope (discordScopeFor). Empty messages are
 * dropped; the oldest lines go first when the block is over the char cap.
 */
export function formatChannelContext(msgs: ChannelMessageLike[]): string {
  const lines = msgs
    .filter((m) => m.content.trim().length > 0)
    .map((m) => `${m.author}: ${m.content.trim().replace(/\s+/g, ' ')}`);
  while (lines.length > 0 && lines.join('\n').length > DISCORD_CONTEXT_MAX_CHARS) lines.shift();
  if (lines.length === 0) return '';
  return `Recent messages in this channel, oldest first:\n${lines.join('\n')}\n\nThe message to answer:\n`;
}
