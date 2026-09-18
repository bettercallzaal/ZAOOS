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
 * A community ask that could not reach Zaal for approval is HELD, not sent.
 * The old fallback sent the unapproved draft "if Zaal DM fails", which is the
 * one case where the approval flow was doing its job.
 */
export function communityAskOutcome(zaalNotified: boolean): 'queued' | 'held' {
  return zaalNotified ? 'queued' : 'held';
}
