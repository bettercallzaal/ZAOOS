/**
 * discord-slash.ts - ZOE's admin commands as Discord slash commands.
 *
 * Zaal, 2026-10-18: "id rather use propepr /commands". Typing "/" in ZM shows
 * these with Discord's own pickers for the user, role and channel, so there is
 * no wording to remember. They map onto the same AdminCommand that "admin:"
 * text parses to, and run through the same runAdminCommand and log.
 *
 * Who can use them, twice over:
 * - Registered with default member permission Administrator and no DMs, so
 *   Discord hides them from everyone else (a server owner can change that in
 *   Server Settings, Integrations, which is why it is not the only check).
 * - discord.ts runs one only when the person is DISCORD_ZAAL_ID.
 *
 * slashToAdminCommand is pure: it reads options through a small getter so the
 * tests can drive it without discord.js.
 */
import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import {
  type AdminCommand,
  cleanChannelName,
  cleanLabel,
  MAX_TIMEOUT_MINUTES,
  MESSAGE_LINK,
} from './discord-admin';

/** Button id prefix for the kick confirmation. */
export const KICK_CONFIRM_PREFIX = 'zadm_kick_';

const admin = (b: SlashCommandBuilder): SlashCommandBuilder =>
  b.setDefaultMemberPermissions(PermissionFlagsBits.Administrator).setDMPermission(false);

/** The command definitions, as the JSON guild.commands.set takes. */
export const ADMIN_SLASH_COMMANDS = [
  admin(new SlashCommandBuilder().setName('channel').setDescription('Make, rename or archive a channel (Zaal only)'))
    .addSubcommand((s) =>
      s
        .setName('new')
        .setDescription('Make a text channel')
        .addStringOption((o) => o.setName('name').setDescription('Channel name').setRequired(true).setMaxLength(100))
        .addStringOption((o) => o.setName('category').setDescription('Category to put it in').setMaxLength(100)),
    )
    .addSubcommand((s) =>
      s
        .setName('rename')
        .setDescription('Rename a channel')
        .addChannelOption((o) => o.setName('channel').setDescription('Channel').setRequired(true))
        .addStringOption((o) => o.setName('name').setDescription('New name').setRequired(true).setMaxLength(100)),
    )
    .addSubcommand((s) =>
      s
        .setName('archive')
        .setDescription('Move a channel to "archive" and make it read-only')
        .addChannelOption((o) => o.setName('channel').setDescription('Channel').setRequired(true)),
    ),
  admin(new SlashCommandBuilder().setName('category').setDescription('Make a category (Zaal only)')).addSubcommand((s) =>
    s
      .setName('new')
      .setDescription('Make a category')
      .addStringOption((o) => o.setName('name').setDescription('Category name').setRequired(true).setMaxLength(100)),
  ),
  admin(new SlashCommandBuilder().setName('thread').setDescription('Start a thread here (Zaal only)')).addSubcommand((s) =>
    s
      .setName('new')
      .setDescription('Start a thread in this channel')
      .addStringOption((o) => o.setName('name').setDescription('Thread name').setRequired(true).setMaxLength(100)),
  ),
  admin(new SlashCommandBuilder().setName('pin').setDescription('Pin a message (Zaal only)')).addStringOption((o) =>
    o.setName('link').setDescription('Message link (right-click a message, Copy Message Link)').setRequired(true),
  ),
  admin(new SlashCommandBuilder().setName('unpin').setDescription('Unpin a message (Zaal only)')).addStringOption((o) =>
    o.setName('link').setDescription('Message link').setRequired(true),
  ),
  admin(new SlashCommandBuilder().setName('role').setDescription('Give or remove a role (Zaal only)'))
    .addSubcommand((s) =>
      s
        .setName('give')
        .setDescription('Give someone a role')
        .addUserOption((o) => o.setName('user').setDescription('Who').setRequired(true))
        .addRoleOption((o) => o.setName('role').setDescription('Role').setRequired(true)),
    )
    .addSubcommand((s) =>
      s
        .setName('remove')
        .setDescription('Take a role from someone')
        .addUserOption((o) => o.setName('user').setDescription('Who').setRequired(true))
        .addRoleOption((o) => o.setName('role').setDescription('Role').setRequired(true)),
    ),
  admin(new SlashCommandBuilder().setName('nick').setDescription("Set or clear someone's nickname (Zaal only)"))
    .addUserOption((o) => o.setName('user').setDescription('Who').setRequired(true))
    .addStringOption((o) => o.setName('name').setDescription('Leave empty to clear').setMaxLength(32)),
  admin(new SlashCommandBuilder().setName('timeout').setDescription('Time someone out, or lift it with 0 (Zaal only)'))
    .addUserOption((o) => o.setName('user').setDescription('Who').setRequired(true))
    .addIntegerOption((o) =>
      o.setName('minutes').setDescription('0 lifts it; 40320 is 28 days').setRequired(true).setMinValue(0).setMaxValue(MAX_TIMEOUT_MINUTES),
    ),
  admin(new SlashCommandBuilder().setName('kick').setDescription('Kick someone; asks you to confirm first (Zaal only)'))
    .addUserOption((o) => o.setName('user').setDescription('Who').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Shown in the audit log').setMaxLength(200)),
  admin(new SlashCommandBuilder().setName('roles').setDescription('Post the role picker here (Zaal only)')).addSubcommand((s) =>
    s.setName('post').setDescription('Post buttons members use to add or remove their own roles'),
  ),
].map((c) => c.toJSON());

export const ADMIN_SLASH_NAMES: ReadonlySet<string> = new Set(ADMIN_SLASH_COMMANDS.map((c) => c.name));

/** What slashToAdminCommand reads from an interaction. Missing options are null. */
export interface SlashOptions {
  sub: string | null;
  string(name: string): string | null;
  integer(name: string): number | null;
  id(name: string): string | null;
}

/** One slash command to the AdminCommand it means; null when it is not one of ours. */
export function slashToAdminCommand(command: string, o: SlashOptions): AdminCommand | null {
  const bad = (): AdminCommand => ({ kind: 'unknown', text: `/${command}${o.sub ? ` ${o.sub}` : ''}` });
  switch (command) {
    case 'channel': {
      if (o.sub === 'new') {
        const name = cleanChannelName(o.string('name') ?? '');
        const category = cleanLabel(o.string('category') ?? '');
        if (!name) return bad();
        return category ? { kind: 'new-channel', name, category } : { kind: 'new-channel', name };
      }
      const channelId = o.id('channel');
      if (!channelId) return bad();
      if (o.sub === 'rename') {
        const name = cleanChannelName(o.string('name') ?? '');
        return name ? { kind: 'rename', channelId, name } : bad();
      }
      return o.sub === 'archive' ? { kind: 'archive', channelId } : bad();
    }
    case 'category': {
      const name = cleanLabel(o.string('name') ?? '');
      return o.sub === 'new' && name ? { kind: 'new-category', name } : bad();
    }
    case 'thread': {
      const name = cleanLabel(o.string('name') ?? '');
      return o.sub === 'new' && name ? { kind: 'new-thread', name } : bad();
    }
    case 'pin':
    case 'unpin': {
      const link = (o.string('link') ?? '').trim().match(MESSAGE_LINK);
      return link ? { kind: 'pin', pin: command === 'pin', channelId: link[1], messageId: link[2] } : bad();
    }
    case 'role': {
      const userId = o.id('user');
      const roleId = o.id('role');
      if (!userId || !roleId || (o.sub !== 'give' && o.sub !== 'remove')) return bad();
      return { kind: 'role', give: o.sub === 'give', userId, roleId };
    }
    case 'nick': {
      const userId = o.id('user');
      return userId ? { kind: 'nick', userId, nick: o.string('name') ?? '' } : bad();
    }
    case 'timeout': {
      const userId = o.id('user');
      const minutes = o.integer('minutes');
      return userId && minutes !== null ? { kind: 'timeout', userId, minutes } : bad();
    }
    case 'kick': {
      const userId = o.id('user');
      const reason = o.string('reason') ?? undefined;
      return userId ? { kind: 'kick', userId, confirmed: false, ...(reason ? { reason } : {}) } : bad();
    }
    default:
      return null;
  }
}
