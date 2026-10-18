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
 * Nothing here deletes, bans or kicks. Members and roles are the next PR.
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
  | { kind: 'unknown'; text: string };

export const ARCHIVE_CATEGORY = 'archive';
const MAX_NAME = 100;

const PREFIX = /^admin:\s*/i;
const CHANNEL_MENTION = /^<#(\d{5,25})>$/;
const MESSAGE_LINK = /^https:\/\/(?:ptb\.|canary\.)?discord(?:app)?\.com\/channels\/(?:\d+|@me)\/(\d{5,25})\/(\d{5,25})$/;

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
].join('\n');

/** What runAdminCommand needs from the guild. discord.ts builds it from discord.js. */
export interface AdminEnv {
  findCategory(name: string): Promise<{ id: string; name: string } | null>;
  createCategory(name: string): Promise<{ id: string; name: string }>;
  createTextChannel(name: string, parentId?: string): Promise<{ id: string; name: string }>;
  channelName(id: string): Promise<string | null>;
  renameChannel(id: string, name: string): Promise<void>;
  archiveChannel(id: string, archiveCategoryId: string): Promise<void>;
  createThread(name: string): Promise<{ id: string; name: string }>;
  /** channelId undefined means the channel the command was sent in. */
  setPinned(channelId: string | undefined, messageId: string, pin: boolean): Promise<void>;
}

export interface AdminResult {
  reply: string;
  ok: boolean;
  action: AdminCommand['kind'];
  target?: string;
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
        await env.archiveChannel(cmd.channelId, cat.id);
        return { reply: `Archived <#${cmd.channelId}>: moved to "${cat.name}", and @everyone can no longer post there.`, ok: true, action: cmd.kind, target: cmd.channelId };
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
  } catch (err) {
    console.error(`[zoe/discord-admin] could not write ${path}: ${err instanceof Error ? err.message : String(err)}`);
  }
}
