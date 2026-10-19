import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PermissionFlagsBits } from 'discord.js';
import { describe, expect, it } from 'vitest';
import { ADMIN_SLASH_COMMANDS, ADMIN_SLASH_NAMES, KICK_CONFIRM_PREFIX, type SlashOptions, slashToAdminCommand } from '../discord-slash';

function opts(sub: string | null, values: Record<string, string | number>): SlashOptions {
  return {
    sub,
    string: (n) => (typeof values[n] === 'string' ? (values[n] as string) : null),
    integer: (n) => (typeof values[n] === 'number' ? (values[n] as number) : null),
    id: (n) => (typeof values[n] === 'string' ? (values[n] as string) : null),
  };
}

describe('command definitions', () => {
  it('the eleven admin commands, each hidden from non-admins and not in DMs', () => {
    expect([...ADMIN_SLASH_NAMES].sort()).toEqual(['category', 'channel', 'event', 'kick', 'nick', 'pin', 'role', 'roles', 'thread', 'timeout', 'unpin'].sort());
    for (const c of ADMIN_SLASH_COMMANDS) {
      expect(c.default_member_permissions).toBe(String(PermissionFlagsBits.Administrator));
      expect(c.dm_permission).toBe(false);
      expect(c.description).toContain('Zaal only');
    }
  });

  it('timeout minutes are bounded by Discord itself', () => {
    const t = ADMIN_SLASH_COMMANDS.find((c) => c.name === 'timeout');
    const minutes = t?.options?.find((o) => o.name === 'minutes') as { min_value?: number; max_value?: number } | undefined;
    expect(minutes).toMatchObject({ min_value: 0, max_value: 40320 });
  });
});

describe('slashToAdminCommand', () => {
  it.each([
    ['channel', 'new', { name: 'Festival Planning', category: 'ZAO Music' }, { kind: 'new-channel', name: 'festival-planning', category: 'ZAO Music' }],
    ['channel', 'new', { name: 'plans' }, { kind: 'new-channel', name: 'plans' }],
    ['channel', 'rename', { channel: '123456', name: 'Old Stuff' }, { kind: 'rename', channelId: '123456', name: 'old-stuff' }],
    ['channel', 'archive', { channel: '123456' }, { kind: 'archive', channelId: '123456' }],
    ['category', 'new', { name: 'ZAO Festivals' }, { kind: 'new-category', name: 'ZAO Festivals' }],
    ['thread', 'new', { name: 'Set list ideas' }, { kind: 'new-thread', name: 'Set list ideas' }],
    ['pin', null, { link: 'https://discord.com/channels/111111/2222222/3333333' }, { kind: 'pin', pin: true, channelId: '2222222', messageId: '3333333' }],
    ['unpin', null, { link: 'https://discord.com/channels/111111/2222222/3333333' }, { kind: 'pin', pin: false, channelId: '2222222', messageId: '3333333' }],
    ['role', 'give', { user: 'u1', role: 'r1' }, { kind: 'role', give: true, userId: 'u1', roleId: 'r1' }],
    ['role', 'remove', { user: 'u1', role: 'r1' }, { kind: 'role', give: false, userId: 'u1', roleId: 'r1' }],
    ['nick', null, { user: 'u1', name: 'Iman' }, { kind: 'nick', userId: 'u1', nick: 'Iman' }],
    ['nick', null, { user: 'u1' }, { kind: 'nick', userId: 'u1', nick: '' }],
    ['timeout', null, { user: 'u1', minutes: 15 }, { kind: 'timeout', userId: 'u1', minutes: 15 }],
    ['kick', null, { user: 'u1', reason: 'spam' }, { kind: 'kick', userId: 'u1', confirmed: false, reason: 'spam' }],
    ['kick', null, { user: 'u1' }, { kind: 'kick', userId: 'u1', confirmed: false }],
    [
      'event',
      'new',
      { name: 'Listening party', date: '2026-10-23', time: '8pm', minutes: 90, channel: 'v1', description: 'new MixZ' },
      { kind: 'event', name: 'Listening party', date: '2026-10-23', time: '8pm', minutes: 90, channelId: 'v1', description: 'new MixZ' },
    ],
    [
      'event',
      'new',
      { name: 'Parklet set', date: '2026-10-23', time: '20:00', location: 'Franklin St Parklet' },
      { kind: 'event', name: 'Parklet set', date: '2026-10-23', time: '20:00', minutes: 60, location: 'Franklin St Parklet' },
    ],
  ] as const)('/%s %s', (command, sub, values, want) => {
    expect(slashToAdminCommand(command, opts(sub, values))).toEqual(want);
  });

  it('a kick from a slash command is never pre-confirmed', () => {
    expect(slashToAdminCommand('kick', opts(null, { user: 'u1' }))).toMatchObject({ confirmed: false });
  });

  it.each([
    ['channel', 'new', { name: '!!!' }],
    ['channel', 'rename', { name: 'x' }],
    ['pin', null, { link: 'https://evil.example/channels/1/2/3' }],
    ['role', 'give', { user: 'u1' }],
    ['timeout', null, { user: 'u1' }],
    ['event', 'new', { name: 'x', date: '2026-10-23' }],
  ] as const)('bad input becomes "unknown": /%s %s', (command, sub, values) => {
    expect(slashToAdminCommand(command, opts(sub, values))?.kind).toBe('unknown');
  });

  it('a command that is not ours is null', () => {
    expect(slashToAdminCommand('play', opts(null, {}))).toBeNull();
  });
});

describe('wiring in discord.ts', () => {
  const d = readFileSync(join(__dirname, '..', 'discord.ts'), 'utf8');
  const slash = d.slice(d.indexOf('async function handleAdminSlash('), d.indexOf('async function handleKickButton('));
  const button = d.slice(d.indexOf('async function handleKickButton('), d.indexOf('async function registerAdminSlash('));

  it('registers only while admin is on', () => {
    expect(d).toContain('if (discordAdminEnabled()) void registerAdminSlash(client);');
  });

  it('admin slash commands and the kick buttons are handled before the zask_ buttons', () => {
    const handler = d.slice(d.indexOf("client.on('interactionCreate'"));
    expect(handler.indexOf('await handleAdminSlash(interaction);')).toBeGreaterThan(-1);
    expect(handler.indexOf('await handleKickButton(interaction);')).toBeLessThan(handler.indexOf("startsWith('zask_')"));
    expect(handler.indexOf('await handleAdminSlash(interaction);')).toBeLessThan(handler.indexOf("startsWith('zask_')"));
  });

  it('a slash command checks the flag, the server and Zaal before running, logs, and answers only him', () => {
    const owner = slash.indexOf('if (!isDiscordOwner(by, DISCORD_ZAAL_ID)) {');
    expect(slash.indexOf('if (!discordAdminEnabled()) {')).toBeLessThan(owner);
    expect(slash.indexOf('if (!i.inCachedGuild()) {')).toBeLessThan(owner);
    expect(owner).toBeLessThan(slash.indexOf('runAdminCommand('));
    expect(slash.match(/await appendAdminLog\(/g)).toHaveLength(3);
    expect(slash).toContain('await i.deferReply({ ephemeral: true });');
    expect(slash).toContain('allowedMentions: { parse: [] }');
    expect(slash).not.toContain('confirmed: true');
  });

  it('the kick button is Zaal only, expires, and is the only place a kick is confirmed', () => {
    const owner = button.indexOf('isDiscordOwner(by, DISCORD_ZAAL_ID)');
    expect(owner).toBeGreaterThan(-1);
    expect(owner).toBeLessThan(button.indexOf('runAdminCommand('));
    expect(button).toContain('Date.now() - pending.at > KICK_CONFIRM_MS');
    expect(d.match(/confirmed: true/g)).toHaveLength(1);
    expect(button).toContain('confirmed: true');
    expect(d).toContain(`\${KICK_CONFIRM_PREFIX}\${userId}`);
    expect(KICK_CONFIRM_PREFIX).toBe('zadm_kick_');
  });
});
