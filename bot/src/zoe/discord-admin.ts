/**
 * discord-admin.ts - Zaal runs the ZM Discord through ZOE: channels, threads, pins.
 *
 * Zaal, 2026-10-18, installing ZOE in ZM with Administrator: "it means its the
 * full admin and manager of the discord". Administrator is what the bot MAY do;
 * this module is what it DOES, and only on his word.
 *
 * With ZOE_DISCORD_ADMIN=1 (default OFF), a message that @mentions ZOE and
 * starts "admin:" is parsed by code, never by the model, and runs only when the
 * author is DISCORD_ZAAL_ID. Anyone else gets a refusal and nothing happens; no
 * admin text ever reaches a model turn. Every action is logged to journald and
 * appended to discord-admin.jsonl in ZOE's home (owner-only, 0600).
 *
 *   admin: help
 *   admin: new channel <name> [in <category>]
 *   admin: new category <name>
 *   admin: rename <#channel> to <name>
 *   admin: archive <#channel>        moves it to the "archive" category and stops @everyone posting
 *   admin: new thread <name>          in the channel the command was sent in
 *   admin: pin <message link>         or reply to a message with "admin: pin"
 *   admin: unpin <message link>
 *
 * Members (also slash commands, see discord-slash.ts):
 *   give or remove a role, set or clear a nickname, time out, kick
 * ZOE never acts on Zaal, on itself, or on anyone whose top role is not below
 * its own (Discord's own hierarchy check). A kick needs a second, confirming
 * press. Nothing here deletes a channel or a message, or bans.
 *
 * parseAdminCommand and runAdminCommand are pure apart from the AdminEnv they
 * are handed, so the tests drive them with a fake guild.
 */
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { ZOE_PATHS } from './memory';

export function discordAdminEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.ZOE_DISCORD_ADMIN === '1';
}

/** True only for Zaal. An unset owner id means nobody, so it fails closed. */
export function isDiscordOwner(authorId: string, ownerId: string | undefined): boolean {
  return !!ownerId && authorId === ownerId;
}

export type AdminCommand =
  | { kind: 'help' }
  | { kind: 'new-channel'; name: string; category?: string }
  | { kind: 'new-category'; name: string }
  | { kind: 'rename'; channelId: string; name: string }
  | { kind: 'archive'; channelId: string }
  | { kind: 'new-thread'; name: string }
  | { kind: 'pin'; pin: boolean; channelId?: string; messageId?: string }
  | { kind: 'role'; give: boolean; userId: string; roleId: string }
  | { kind: 'nick'; userId: string; nick: string }
  | { kind: 'timeout'; userId: string; minutes: number }
  | { kind: 'kick'; userId: string; reason?: string; confirmed: boolean }
  | { kind: 'unknown'; text: string };

/** Discord's longest timeout: 28 days. 0 minutes lifts a timeout. */
export const MAX_TIMEOUT_MINUTES = 28 * 24 * 60;

export const ARCHIVE_CATEGORY = 'archive';

/**
 * The posting permissions "archive" takes away. CreatePrivateThreads is here
 * too: without it a member could still open a private thread in an archived
 * channel (evaluator note on #4024).
 */
export const ARCHIVE_POST_PERMS = [
  'SendMessages',
  'SendMessagesInThreads',
  'CreatePublicThreads',
  'CreatePrivateThreads',
] as const;
export type ArchivePerm = (typeof ARCHIVE_POST_PERMS)[number];

/** Every archive posting permission set to one value: false to deny, null to clear. */
export function archivePerms<T extends boolean | null>(value: T): Record<ArchivePerm, T> {
  return {
    SendMessages: value,
    SendMessagesInThreads: value,
    CreatePublicThreads: value,
    CreatePrivateThreads: value,
  };
}

/**
 * Which role or member overrides to clear on archive: those that ALLOW any
 * posting permission, because an allow beats the @everyone deny. An override
 * that only denies is left alone, and @everyone itself is never touched here.
 */
export function overridesToClear<B>(
  overwrites: Iterable<{ id: string; allow: { any(bits: B[]): boolean } }>,
  everyoneId: string,
  postBits: B[],
): string[] {
  const ids: string[] = [];
  for (const ow of overwrites) {
    if (ow.id === everyoneId) continue;
    if (ow.allow.any(postBits)) ids.push(ow.id);
  }
  return ids;
}

/** Sent privately to anyone who is not Zaal. */
export const ADMIN_REFUSAL_LINE = 'Only Zaal can run admin commands. Nothing was changed.';
const MAX_NAME = 100;

const PREFIX = /^admin:\s*/i;
const CHANNEL_MENTION = /^<#(\d{5,25})>$/;
export const MESSAGE_LINK = /^https:\/\/(?:ptb\.|canary\.)?discord(?:app)?\.com\/channels\/(?:\d+|@me)\/(\d{5,25})\/(\d{5,25})$/;

/** Discord text-channel names: lower case, dashes for spaces, letters, digits, - and _. */
export function cleanChannelName(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}_-]/gu, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_NAME);
}

/** Category and thread names keep their case and spaces; control characters and mentions go. */
export function cleanLabel(raw: string): string {
  return raw
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/[@<>`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_NAME);
}

/**
 * null when the text is not an admin command at all (no "admin:" prefix), so the
 * caller hands it to the normal turn. Anything with the prefix returns a
 * command, with "unknown" for text that does not parse.
 */
export function parseAdminCommand(text: string, replyToMessageId?: string): AdminCommand | null {
  const t = text.trim();
  if (!PREFIX.test(t)) return null;
  const body = t.replace(PREFIX, '').trim();
  let m: RegExpMatchArray | null;

  if (/^(?:help)?$/i.test(body)) return { kind: 'help' };

  if ((m = body.match(/^new\s+category\s+(.+)$/i))) {
    const name = cleanLabel(m[1]);
    return name ? { kind: 'new-category', name } : { kind: 'unknown', text: body };
  }
  if ((m = body.match(/^new\s+channel\s+(.+?)(?:\s+in\s+(.+))?$/i))) {
    const name = cleanChannelName(m[1]);
    const category = m[2] ? cleanLabel(m[2]) : undefined;
    if (!name) return { kind: 'unknown', text: body };
    return category ? { kind: 'new-channel', name, category } : { kind: 'new-channel', name };
  }
  if ((m = body.match(/^rename\s+(\S+)\s+to\s+(.+)$/i))) {
    const ch = m[1].match(CHANNEL_MENTION);
    const name = cleanChannelName(m[2]);
    return ch && name ? { kind: 'rename', channelId: ch[1], name } : { kind: 'unknown', text: body };
  }
  if ((m = body.match(/^archive\s+(\S+)$/i))) {
    const ch = m[1].match(CHANNEL_MENTION);
    return ch ? { kind: 'archive', channelId: ch[1] } : { kind: 'unknown', text: body };
  }
  if ((m = body.match(/^new\s+thread\s+(.+)$/i))) {
    const name = cleanLabel(m[1]);
    return name ? { kind: 'new-thread', name } : { kind: 'unknown', text: body };
  }
  if ((m = body.match(/^(pin|unpin)(?:\s+(\S+))?$/i))) {
    const pin = m[1].toLowerCase() === 'pin';
    if (m[2]) {
      const link = m[2].match(MESSAGE_LINK);
      return link ? { kind: 'pin', pin, channelId: link[1], messageId: link[2] } : { kind: 'unknown', text: body };
    }
    return replyToMessageId ? { kind: 'pin', pin, messageId: replyToMessageId } : { kind: 'unknown', text: body };
  }
  return { kind: 'unknown', text: body };
}

export const ADMIN_HELP = [
  'Admin commands (Zaal only), after an @mention:',
  'admin: new channel <name> [in <category>]',
  'admin: new category <name>',
  'admin: rename #channel to <name>',
  'admin: archive #channel',
  'admin: new thread <name>',
  'admin: pin <message link>  (or reply to a message with "admin: pin")',
  'admin: unpin <message link>',
  'Members and roles: the /role, /nick, /timeout and /kick slash commands.',
].join('\n');

/** What runAdminCommand needs from the guild. discord.ts builds it from discord.js. */
export interface AdminEnv {
  findCategory(name: string): Promise<{ id: string; name: string } | null>;
  createCategory(name: string): Promise<{ id: string; name: string }>;
  createTextChannel(name: string, parentId?: string): Promise<{ id: string; name: string }>;
  channelName(id: string): Promise<string | null>;
  renameChannel(id: string, name: string): Promise<void>;
  /**
   * Move to the archive category and make it read-only: deny posting for
   * @everyone and clear any role or member override that allows it. Returns
   * how many overrides were cleared. Server administrators still post.
   */
  archiveChannel(id: string, archiveCategoryId: string): Promise<{ cleared: number }>;
  createThread(name: string): Promise<{ id: string; name: string }>;
  /** channelId undefined means the channel the command was sent in. */
  setPinned(channelId: string | undefined, messageId: string, pin: boolean): Promise<void>;
  /** Zaal's id and ZOE's own: member commands never touch either. */
  ownerId?: string;
  selfId?: string;
  /**
   * A member of this server, with Discord's hierarchy answers for ZOE: can it
   * change their roles and nickname, time them out, kick them. null if not here.
   */
  member(userId: string): Promise<{ name: string; manageable: boolean; moderatable: boolean; kickable: boolean } | null>;
  /** A role of this server; editable is false when it is at or above ZOE's top role, or managed. */
  role(roleId: string): Promise<{ name: string; editable: boolean } | null>;
  setRole(userId: string, roleId: string, give: boolean): Promise<void>;
  /** null clears the nickname. */
  setNick(userId: string, nick: string | null): Promise<void>;
  /** null lifts the timeout. */
  timeout(userId: string, ms: number | null): Promise<void>;
  kick(userId: string, reason: string): Promise<void>;
}

export interface AdminResult {
  reply: string;
  ok: boolean;
  action: AdminCommand['kind'];
  target?: string;
  /** Set on an unconfirmed kick: the caller shows a Confirm button for this user. */
  confirmKick?: string;
}

/**
 * The member a command may act on, or the reason it may not. Zaal and ZOE are
 * never targets, and Discord's hierarchy answer for the action decides the rest.
 */
async function memberTarget(
  env: AdminEnv,
  userId: string,
  need: 'manageable' | 'moderatable' | 'kickable',
): Promise<{ name: string } | { refuse: string }> {
  if (env.ownerId && userId === env.ownerId) return { refuse: 'I do not run member commands on Zaal.' };
  if (env.selfId && userId === env.selfId) return { refuse: 'I do not run member commands on myself.' };
  const m = await env.member(userId);
  if (!m) return { refuse: 'That person is not in this server.' };
  if (!m[need]) return { refuse: `I cannot do that to ${m.name}: their top role is not below mine. Move my role higher in Server Settings, Roles.` };
  return { name: m.name };
}

/** Run one parsed command. Never throws: a Discord error becomes the reply. */
export async function runAdminCommand(cmd: AdminCommand, env: AdminEnv): Promise<AdminResult> {
  const fail = (target: string | undefined, err: unknown): AdminResult => ({
    reply: `That did not work: ${err instanceof Error ? err.message : String(err)}`,
    ok: false,
    action: cmd.kind,
    target,
  });
  switch (cmd.kind) {
    case 'help':
      return { reply: ADMIN_HELP, ok: true, action: 'help' };
    case 'unknown':
      return { reply: `I did not understand "admin: ${cleanLabel(cmd.text)}".\n\n${ADMIN_HELP}`, ok: false, action: 'unknown' };
    case 'new-category':
      try {
        const existing = await env.findCategory(cmd.name);
        if (existing) return { reply: `Category "${existing.name}" already exists.`, ok: true, action: cmd.kind, target: existing.id };
        const c = await env.createCategory(cmd.name);
        return { reply: `Created category "${c.name}".`, ok: true, action: cmd.kind, target: c.id };
      } catch (err) {
        return fail(cmd.name, err);
      }
    case 'new-channel':
      try {
        let parentId: string | undefined;
        if (cmd.category) {
          const cat = await env.findCategory(cmd.category);
          if (!cat) return { reply: `No category called "${cmd.category}". Make it first: admin: new category ${cmd.category}`, ok: false, action: cmd.kind };
          parentId = cat.id;
        }
        const ch = await env.createTextChannel(cmd.name, parentId);
        return { reply: `Created <#${ch.id}>${cmd.category ? ` in ${cmd.category}` : ''}.`, ok: true, action: cmd.kind, target: ch.id };
      } catch (err) {
        return fail(cmd.name, err);
      }
    case 'rename':
      try {
        const before = await env.channelName(cmd.channelId);
        if (before === null) return { reply: 'I cannot find that channel in this server.', ok: false, action: cmd.kind, target: cmd.channelId };
        await env.renameChannel(cmd.channelId, cmd.name);
        return { reply: `Renamed #${before} to <#${cmd.channelId}>.`, ok: true, action: cmd.kind, target: cmd.channelId };
      } catch (err) {
        return fail(cmd.channelId, err);
      }
    case 'archive':
      try {
        if ((await env.channelName(cmd.channelId)) === null) {
          return { reply: 'I cannot find that channel in this server.', ok: false, action: cmd.kind, target: cmd.channelId };
        }
        const cat = (await env.findCategory(ARCHIVE_CATEGORY)) ?? (await env.createCategory(ARCHIVE_CATEGORY));
        const { cleared } = await env.archiveChannel(cmd.channelId, cat.id);
        const overrides = cleared ? ` Cleared ${cleared} role or member ${cleared === 1 ? 'override' : 'overrides'} that allowed posting.` : '';
        return {
          reply: `Archived <#${cmd.channelId}>: moved to "${cat.name}" and read-only.${overrides} Server administrators can still post there.`,
          ok: true,
          action: cmd.kind,
          target: cmd.channelId,
        };
      } catch (err) {
        return fail(cmd.channelId, err);
      }
    case 'new-thread':
      try {
        const th = await env.createThread(cmd.name);
        return { reply: `Started thread <#${th.id}>.`, ok: true, action: cmd.kind, target: th.id };
      } catch (err) {
        return fail(cmd.name, err);
      }
    case 'pin':
      try {
        await env.setPinned(cmd.channelId, cmd.messageId ?? '', cmd.pin);
        return { reply: cmd.pin ? 'Pinned.' : 'Unpinned.', ok: true, action: cmd.kind, target: cmd.messageId };
      } catch (err) {
        return fail(cmd.messageId, err);
      }
    case 'role':
      try {
        const t = await memberTarget(env, cmd.userId, 'manageable');
        if ('refuse' in t) return { reply: t.refuse, ok: false, action: cmd.kind, target: cmd.userId };
        const r = await env.role(cmd.roleId);
        if (!r) return { reply: 'That role is not in this server.', ok: false, action: cmd.kind, target: cmd.userId };
        if (!r.editable) {
          return { reply: `I cannot hand out "${r.name}": it is at or above my top role, or Discord manages it.`, ok: false, action: cmd.kind, target: cmd.userId };
        }
        await env.setRole(cmd.userId, cmd.roleId, cmd.give);
        return {
          reply: cmd.give ? `Gave ${t.name} the "${r.name}" role.` : `Removed the "${r.name}" role from ${t.name}.`,
          ok: true,
          action: cmd.kind,
          target: cmd.userId,
        };
      } catch (err) {
        return fail(cmd.userId, err);
      }
    case 'nick':
      try {
        const t = await memberTarget(env, cmd.userId, 'manageable');
        if ('refuse' in t) return { reply: t.refuse, ok: false, action: cmd.kind, target: cmd.userId };
        const nick = cleanLabel(cmd.nick).slice(0, 32);
        await env.setNick(cmd.userId, nick || null);
        return { reply: nick ? `${t.name} is now "${nick}" here.` : `Cleared ${t.name}'s nickname.`, ok: true, action: cmd.kind, target: cmd.userId };
      } catch (err) {
        return fail(cmd.userId, err);
      }
    case 'timeout':
      try {
        if (!Number.isInteger(cmd.minutes) || cmd.minutes < 0 || cmd.minutes > MAX_TIMEOUT_MINUTES) {
          return { reply: `Minutes must be a whole number from 0 (lift) to ${MAX_TIMEOUT_MINUTES} (28 days).`, ok: false, action: cmd.kind, target: cmd.userId };
        }
        const t = await memberTarget(env, cmd.userId, 'moderatable');
        if ('refuse' in t) return { reply: t.refuse, ok: false, action: cmd.kind, target: cmd.userId };
        await env.timeout(cmd.userId, cmd.minutes === 0 ? null : cmd.minutes * 60_000);
        return {
          reply: cmd.minutes === 0 ? `Lifted ${t.name}'s timeout.` : `Timed out ${t.name} for ${cmd.minutes} minute${cmd.minutes === 1 ? '' : 's'}.`,
          ok: true,
          action: cmd.kind,
          target: cmd.userId,
        };
      } catch (err) {
        return fail(cmd.userId, err);
      }
    case 'kick':
      try {
        const t = await memberTarget(env, cmd.userId, 'kickable');
        if ('refuse' in t) return { reply: t.refuse, ok: false, action: cmd.kind, target: cmd.userId };
        if (!cmd.confirmed) {
          return { reply: `Kick ${t.name} from the server? They can rejoin with an invite.`, ok: true, action: cmd.kind, target: cmd.userId, confirmKick: cmd.userId };
        }
        await env.kick(cmd.userId, cleanLabel(cmd.reason ?? '') || 'Kicked by Zaal through ZOE');
        return { reply: `Kicked ${t.name}.`, ok: true, action: cmd.kind, target: cmd.userId };
      } catch (err) {
        return fail(cmd.userId, err);
      }
  }
}

export const adminLogPath = (): string => join(ZOE_PATHS.home, 'discord-admin.jsonl');

/** One line per command, refused ones included. Never throws. */
export async function appendAdminLog(
  row: { action: string; ok: boolean; target?: string; by: string; guildId?: string; refused?: string },
  now: Date = new Date(),
  path: string = adminLogPath(),
): Promise<void> {
  try {
    await fs.mkdir(join(path, '..'), { recursive: true });
    await fs.appendFile(path, `${JSON.stringify({ ts: now.toISOString(), ...row })}\n`, { mode: 0o600 });
    // appendFile's mode applies only when it creates the file (Evaluator note, #4022).
    await fs.chmod(path, 0o600);
  } catch (err) {
    console.error(`[zoe/discord-admin] could not write ${path}: ${err instanceof Error ? err.message : String(err)}`);
  }
}
