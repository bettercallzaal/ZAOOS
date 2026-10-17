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
