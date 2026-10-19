import { chmodSync, mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PermissionFlagsBits, PermissionsBitField } from 'discord.js';
import { describe, expect, it } from 'vitest';
import {
  ADMIN_REFUSAL_LINE,
  type AdminCommand,
  type AdminEnv,
  appendAdminLog,
  ARCHIVE_CATEGORY,
  ARCHIVE_POST_PERMS,
  archivePerms,
  cleanChannelName,
  cleanLabel,
  discordAdminEnabled,
  isDiscordOwner,
  MAX_TIMEOUT_MINUTES,
  nyTimeToUtc,
  overridesToClear,
  parseAdminCommand,
  runAdminCommand,
} from '../discord-admin';

describe('flag and owner', () => {
  it.each([
    [undefined, false],
    ['0', false],
    ['true', false],
    ['1', true],
  ])('ZOE_DISCORD_ADMIN=%j is %s', (v, want) => {
    expect(discordAdminEnabled({ ZOE_DISCORD_ADMIN: v } as NodeJS.ProcessEnv)).toBe(want);
  });

  it('only the owner id, and nobody when it is unset', () => {
    expect(isDiscordOwner('42', '42')).toBe(true);
    expect(isDiscordOwner('43', '42')).toBe(false);
    expect(isDiscordOwner('42', undefined)).toBe(false);
    expect(isDiscordOwner('', '')).toBe(false);
  });
});

describe('names', () => {
  it.each([
    ['ZAOstock 2027 Planning', 'zaostock-2027-planning'],
    ['  new   music!! ', 'new-music'],
    ['@everyone', 'everyone'],
    ['--a--b--', 'a-b'],
    ['!!!', ''],
  ])('channel name %j -> %j', (raw, want) => {
    expect(cleanChannelName(raw)).toBe(want);
  });

  it('labels keep case but lose mentions and control characters', () => {
    expect(cleanLabel('ZAO Festivals')).toBe('ZAO Festivals');
    expect(cleanLabel('<@123> hi\nthere')).toBe('123 hi there');
    expect(cleanLabel('x'.repeat(150))).toHaveLength(100);
  });
});

describe('parseAdminCommand', () => {
  it('not an admin command: null, so the normal turn runs', () => {
    expect(parseAdminCommand('what is ZABAL Gamez?')).toBeNull();
    expect(parseAdminCommand('the admin: said hi')).toBeNull();
  });

  it.each([
    ['admin:', { kind: 'help' }],
    ['ADMIN: help', { kind: 'help' }],
    ['admin: new channel Festival Planning', { kind: 'new-channel', name: 'festival-planning' }],
    ['admin: new channel mixz-feedback in ZAO Music', { kind: 'new-channel', name: 'mixz-feedback', category: 'ZAO Music' }],
    ['admin: new category ZAO Festivals', { kind: 'new-category', name: 'ZAO Festivals' }],
    ['admin: rename <#1234567> to Old Stuff', { kind: 'rename', channelId: '1234567', name: 'old-stuff' }],
    ['admin: archive <#1234567>', { kind: 'archive', channelId: '1234567' }],
    ['admin: new thread Set list ideas', { kind: 'new-thread', name: 'Set list ideas' }],
    [
      'admin: pin https://discord.com/channels/111111/2222222/3333333',
      { kind: 'pin', pin: true, channelId: '2222222', messageId: '3333333' },
    ],
    [
      'admin: unpin https://discord.com/channels/111111/2222222/3333333',
      { kind: 'pin', pin: false, channelId: '2222222', messageId: '3333333' },
    ],
  ])('%j', (text, want) => {
    expect(parseAdminCommand(text)).toEqual(want);
  });

  it('"admin: pin" as a reply pins the replied-to message', () => {
    expect(parseAdminCommand('admin: pin', '9999999')).toEqual({ kind: 'pin', pin: true, messageId: '9999999' });
    expect(parseAdminCommand('admin: pin')).toEqual({ kind: 'unknown', text: 'pin' });
  });

  it.each([
    'admin: delete everything',
    'admin: archive general',
    'admin: rename general to x',
    'admin: pin https://evil.example/channels/1/2/3',
    'admin: new channel !!!',
    'admin: ban someone',
  ])('does not parse, so nothing runs: %j', (text) => {
    expect(parseAdminCommand(text)?.kind).toBe('unknown');
  });
});

function fakeGuild(archiveCleared = 0) {
  const calls: string[] = [];
  const cats = new Map<string, string>([['c1', 'ZAO Music']]);
  const chans = new Map<string, string>([['1234567', 'general']]);
  let n = 100;
  const all = { manageable: true, moderatable: true, kickable: true };
  const members = new Map([
    ['m1', { name: 'Iman', ...all }],
    ['zaal', { name: 'Zaal', ...all }],
    ['zoe', { name: 'ZOE', ...all }],
    ['mod', { name: 'Mod', manageable: false, moderatable: false, kickable: false }],
  ]);
  const roles = new Map([
    ['r1', { name: 'Artist', editable: true }],
    ['top', { name: 'Admin', editable: false }],
  ]);
  const env: AdminEnv = {
    async findCategory(name) {
      for (const [id, nm] of cats) if (nm.toLowerCase() === name.toLowerCase()) return { id, name: nm };
      return null;
    },
    async createCategory(name) {
      const id = `c${n++}`;
      cats.set(id, name);
      calls.push(`createCategory ${name}`);
      return { id, name };
    },
    async createTextChannel(name, parentId) {
      const id = `${n++}`;
      chans.set(id, name);
      calls.push(`createTextChannel ${name} ${parentId ?? '-'}`);
      return { id, name };
    },
    async channelName(id) {
      return chans.get(id) ?? null;
    },
    async renameChannel(id, name) {
      chans.set(id, name);
      calls.push(`rename ${id} ${name}`);
    },
    async archiveChannel(id, catId) {
      calls.push(`archive ${id} ${catId}`);
      return { cleared: archiveCleared };
    },
    async createThread(name) {
      calls.push(`thread ${name}`);
      return { id: 't1', name };
    },
    async setPinned(channelId, messageId, pin) {
      calls.push(`${pin ? 'pin' : 'unpin'} ${channelId ?? 'here'} ${messageId}`);
    },
    ownerId: 'zaal',
    selfId: 'zoe',
    async member(userId) {
      return members.get(userId) ?? null;
    },
    async role(roleId) {
      return roles.get(roleId) ?? null;
    },
    async setRole(userId, roleId, give) {
      calls.push(`${give ? 'add' : 'remove'}Role ${userId} ${roleId}`);
    },
    async setNick(userId, nick) {
      calls.push(`nick ${userId} ${nick ?? 'null'}`);
    },
    async timeout(userId, ms) {
      calls.push(`timeout ${userId} ${ms ?? 'null'}`);
    },
    async kick(userId, reason) {
      calls.push(`kick ${userId} ${reason}`);
    },
    now: () => Date.parse('2026-10-18T12:00:00Z'),
    async voiceChannel(id) {
      return id === 'v1' ? { name: 'Listening Room' } : null;
    },
    async createEvent(e) {
      calls.push(`event ${e.name} ${e.start.toISOString()} ${e.end.toISOString()} ${e.channelId ?? '-'} ${e.location ?? '-'} ${e.description ?? '-'}`);
      return { id: 'e1', url: 'https://discord.com/events/1/e1' };
    },
  };
  return { env, calls };
}

describe('runAdminCommand on a fake guild', () => {
  it('new channel, with and without a category', async () => {
    const g = fakeGuild();
    expect((await runAdminCommand({ kind: 'new-channel', name: 'plans' }, g.env)).ok).toBe(true);
    const r = await runAdminCommand({ kind: 'new-channel', name: 'mixz', category: 'zao music' }, g.env);
    expect(r.ok).toBe(true);
    expect(g.calls).toEqual(['createTextChannel plans -', 'createTextChannel mixz c1']);
  });

  it('a missing category is not created by "new channel"; it says how', async () => {
    const g = fakeGuild();
    const r = await runAdminCommand({ kind: 'new-channel', name: 'x', category: 'Nope' }, g.env);
    expect(r.ok).toBe(false);
    expect(r.reply).toContain('admin: new category Nope');
    expect(g.calls).toEqual([]);
  });

  it('new category is idempotent', async () => {
    const g = fakeGuild();
    expect((await runAdminCommand({ kind: 'new-category', name: 'ZAO Music' }, g.env)).reply).toContain('already exists');
    expect(g.calls).toEqual([]);
  });

  it('archive makes the archive category once, then moves the channel', async () => {
    const g = fakeGuild();
    await runAdminCommand({ kind: 'archive', channelId: '1234567' }, g.env);
    await runAdminCommand({ kind: 'archive', channelId: '1234567' }, g.env);
    expect(g.calls.filter((c) => c.startsWith('createCategory'))).toEqual([`createCategory ${ARCHIVE_CATEGORY}`]);
    expect(g.calls.filter((c) => c.startsWith('archive'))).toHaveLength(2);
  });

  it('the archive reply says read-only, counts cleared overrides, and names who can still post', async () => {
    const none = await runAdminCommand({ kind: 'archive', channelId: '1234567' }, fakeGuild(0).env);
    expect(none.reply).toBe('Archived <#1234567>: moved to "archive" and read-only. Server administrators can still post there.');
    const two = await runAdminCommand({ kind: 'archive', channelId: '1234567' }, fakeGuild(2).env);
    expect(two.reply).toContain('Cleared 2 role or member overrides that allowed posting.');
    expect((await runAdminCommand({ kind: 'archive', channelId: '1234567' }, fakeGuild(1).env)).reply).toContain('Cleared 1 role or member override that');
  });

  it('a channel from another server is refused before anything changes', async () => {
    const g = fakeGuild();
    expect((await runAdminCommand({ kind: 'archive', channelId: '7777777' }, g.env)).ok).toBe(false);
    expect((await runAdminCommand({ kind: 'rename', channelId: '7777777', name: 'x' }, g.env)).ok).toBe(false);
    expect(g.calls).toEqual([]);
  });

  it('rename, thread, pin and unpin', async () => {
    const g = fakeGuild();
    expect((await runAdminCommand({ kind: 'rename', channelId: '1234567', name: 'lobby' }, g.env)).reply).toBe(
      'Renamed #general to <#1234567>.',
    );
    await runAdminCommand({ kind: 'new-thread', name: 'Ideas' }, g.env);
    await runAdminCommand({ kind: 'pin', pin: true, messageId: '9' }, g.env);
    await runAdminCommand({ kind: 'pin', pin: false, channelId: '2', messageId: '9' }, g.env);
    expect(g.calls).toEqual(['rename 1234567 lobby', 'thread Ideas', 'pin here 9', 'unpin 2 9']);
  });

  it('a Discord error becomes the reply, never a throw', async () => {
    const g = fakeGuild();
    g.env.createThread = async () => {
      throw new Error('Missing Permissions');
    };
    const r = await runAdminCommand({ kind: 'new-thread', name: 'x' }, g.env);
    expect(r).toMatchObject({ ok: false, action: 'new-thread' });
    expect(r.reply).toContain('Missing Permissions');
  });

  it('unknown and help touch nothing', async () => {
    const g = fakeGuild();
    expect((await runAdminCommand({ kind: 'unknown', text: 'ban x' }, g.env)).ok).toBe(false);
    expect((await runAdminCommand({ kind: 'help' }, g.env)).reply).toContain('admin: archive #channel');
    expect(g.calls).toEqual([]);
  });
});

describe('archive permissions', () => {
  const bits = ARCHIVE_POST_PERMS.map((p) => PermissionFlagsBits[p]);
  const ow = (id: string, allow: bigint[] = [], deny: bigint[] = []) => ({
    id,
    allow: new PermissionsBitField(allow),
    deny: new PermissionsBitField(deny),
  });

  it('denies private threads as well as posting and public threads', () => {
    expect(archivePerms(false)).toEqual({
      SendMessages: false,
      SendMessagesInThreads: false,
      CreatePublicThreads: false,
      CreatePrivateThreads: false,
    });
    expect(Object.values(archivePerms(null)).every((v) => v === null)).toBe(true);
  });

  it('clears only overrides that ALLOW a posting permission, never @everyone', () => {
    const list = [
      ow('everyone', [PermissionFlagsBits.SendMessages]),
      ow('poster', [PermissionFlagsBits.SendMessages]),
      ow('private-threader', [PermissionFlagsBits.CreatePrivateThreads]),
      ow('deny-only', [], [PermissionFlagsBits.SendMessages]),
      ow('viewer', [PermissionFlagsBits.ViewChannel]),
    ];
    expect(overridesToClear(list, 'everyone', bits)).toEqual(['poster', 'private-threader']);
  });

  it('a deny-only SendMessages override is left alone', () => {
    expect(overridesToClear([ow('muted', [], [PermissionFlagsBits.SendMessages])], 'everyone', bits)).toEqual([]);
  });
});

describe('member commands on a fake guild', () => {
  it('give and remove a role', async () => {
    const g = fakeGuild();
    expect((await runAdminCommand({ kind: 'role', give: true, userId: 'm1', roleId: 'r1' }, g.env)).reply).toBe('Gave Iman the "Artist" role.');
    expect((await runAdminCommand({ kind: 'role', give: false, userId: 'm1', roleId: 'r1' }, g.env)).reply).toBe('Removed the "Artist" role from Iman.');
    expect(g.calls).toEqual(['addRole m1 r1', 'removeRole m1 r1']);
  });

  it.each([
    ['zaal', 'on Zaal'],
    ['zoe', 'on myself'],
    ['ghost', 'not in this server'],
    ['mod', 'top role is not below mine'],
  ])('refuses %s before anything changes', async (userId, why) => {
    const g = fakeGuild();
    const cmds = [
      { kind: 'role', give: true, userId, roleId: 'r1' },
      { kind: 'nick', userId, nick: 'x' },
      { kind: 'timeout', userId, minutes: 5 },
      { kind: 'kick', userId, confirmed: true },
    ] as const;
    for (const c of cmds) {
      const r = await runAdminCommand(c, g.env);
      expect(r.ok).toBe(false);
      expect(r.reply).toContain(why);
    }
    expect(g.calls).toEqual([]);
  });

  it('a role at or above ZOE, or a missing one, is refused', async () => {
    const g = fakeGuild();
    expect((await runAdminCommand({ kind: 'role', give: true, userId: 'm1', roleId: 'top' }, g.env)).reply).toContain('at or above my top role');
    expect((await runAdminCommand({ kind: 'role', give: true, userId: 'm1', roleId: 'nope' }, g.env)).ok).toBe(false);
    expect(g.calls).toEqual([]);
  });

  it('nick sets a cleaned name and clears with an empty one', async () => {
    const g = fakeGuild();
    await runAdminCommand({ kind: 'nick', userId: 'm1', nick: '<@1> IMan' }, g.env);
    await runAdminCommand({ kind: 'nick', userId: 'm1', nick: '' }, g.env);
    expect(g.calls).toEqual(['nick m1 1 IMan', 'nick m1 null']);
  });

  it('timeout in minutes, 0 lifts, out of range is refused', async () => {
    const g = fakeGuild();
    expect((await runAdminCommand({ kind: 'timeout', userId: 'm1', minutes: 10 }, g.env)).reply).toBe('Timed out Iman for 10 minutes.');
    expect((await runAdminCommand({ kind: 'timeout', userId: 'm1', minutes: 0 }, g.env)).reply).toBe("Lifted Iman's timeout.");
    for (const minutes of [-1, 1.5, MAX_TIMEOUT_MINUTES + 1]) {
      expect((await runAdminCommand({ kind: 'timeout', userId: 'm1', minutes }, g.env)).ok).toBe(false);
    }
    expect(g.calls).toEqual(['timeout m1 600000', 'timeout m1 null']);
  });

  it('kick asks first and kicks only when confirmed', async () => {
    const g = fakeGuild();
    const ask = await runAdminCommand({ kind: 'kick', userId: 'm1', confirmed: false }, g.env);
    expect(ask).toMatchObject({ ok: true, confirmKick: 'm1' });
    expect(ask.reply).toContain('Kick Iman');
    expect(g.calls).toEqual([]);
    await runAdminCommand({ kind: 'kick', userId: 'm1', confirmed: true, reason: 'spam links' }, g.env);
    await runAdminCommand({ kind: 'kick', userId: 'm1', confirmed: true }, g.env);
    expect(g.calls).toEqual(['kick m1 spam links', 'kick m1 Kicked by Zaal through ZOE']);
  });
});

describe('nyTimeToUtc', () => {
  it.each([
    ['2026-10-23', '20:00', '2026-10-24T00:00:00.000Z'], // EDT, UTC-4
    ['2026-10-23', '8pm', '2026-10-24T00:00:00.000Z'],
    ['2026-10-23', '8:30 PM', '2026-10-24T00:30:00.000Z'],
    ['2026-12-05', '12am', '2026-12-05T05:00:00.000Z'], // EST, UTC-5
    ['2026-12-05', '12pm', '2026-12-05T17:00:00.000Z'],
    ['2026-11-01', '09:00', '2026-11-01T14:00:00.000Z'], // the morning DST ends
    ['2026-03-08', '09:00', '2026-03-08T13:00:00.000Z'], // the morning DST starts
  ])('%s %s New York is %s', (date, time, want) => {
    expect(nyTimeToUtc(date, time)?.toISOString()).toBe(want);
  });

  it.each([
    ['2026-02-30', '20:00'],
    ['2026-10-23', '25:00'],
    ['2026-10-23', '13pm'],
    ['23-10-2026', '8pm'],
    ['2026-10-23', 'evening'],
  ])('rejects %s %s', (date, time) => {
    expect(nyTimeToUtc(date, time)).toBeNull();
  });
});

describe('event on a fake guild', () => {
  const ev = (over: Partial<Extract<AdminCommand, { kind: 'event' }>> = {}): AdminCommand => ({
    kind: 'event',
    name: 'Listening party',
    date: '2026-10-23',
    time: '8pm',
    minutes: 90,
    ...over,
  });

  it('a voice-channel event, with the New York time in the reply', async () => {
    const g = fakeGuild();
    const r = await runAdminCommand(ev({ channelId: 'v1', description: 'new MixZ drops' }), g.env);
    expect(r.ok).toBe(true);
    expect(r.reply).toContain('Created the event "Listening party" for Fri, Oct 23, 8:00 PM EDT, 90 minutes. https://discord.com/events/1/e1');
    expect(g.calls).toEqual(['event Listening party 2026-10-24T00:00:00.000Z 2026-10-24T01:30:00.000Z v1 - new MixZ drops']);
  });

  it('a location event, cleaned', async () => {
    const g = fakeGuild();
    await runAdminCommand(ev({ location: '<@1> the parklet stage' }), g.env);
    expect(g.calls[0]).toContain(' - 1 the parklet stage -');
  });

  it.each([
    [{ time: 'later' }, 'Date is YYYY-MM-DD'],
    [{ date: '2026-10-01' }, 'already passed'],
    [{ minutes: 5 }, 'Length is 15 to 1440'],
    [{ minutes: 2000 }, 'Length is 15 to 1440'],
    [{ name: '<>' }, 'needs a name'],
    [{ channelId: 'text1' }, 'voice or stage channel'],
    [{}, 'a voice channel or a location'],
  ])('refuses %j before creating anything', async (over, why) => {
    const g = fakeGuild();
    const r = await runAdminCommand(ev(over as Partial<Extract<AdminCommand, { kind: 'event' }>>), g.env);
    expect(r.ok).toBe(false);
    expect(r.reply).toContain(why);
    expect(g.calls).toEqual([]);
  });
});

describe('appendAdminLog', () => {
  it('writes one owner-only JSON line per call', async () => {
    const path = join(mkdtempSync(join(tmpdir(), 'zoe-admin-')), 'discord-admin.jsonl');
    await appendAdminLog({ action: 'archive', ok: true, target: '1', by: '42' }, new Date('2026-10-18T20:00:00Z'), path);
    await appendAdminLog({ action: 'archive', ok: false, by: '43', refused: 'not owner' }, new Date('2026-10-18T20:01:00Z'), path);
    const lines = readFileSync(path, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
    expect(lines).toEqual([
      { ts: '2026-10-18T20:00:00.000Z', action: 'archive', ok: true, target: '1', by: '42' },
      { ts: '2026-10-18T20:01:00.000Z', action: 'archive', ok: false, by: '43', refused: 'not owner' },
    ]);
    expect(statSync(path).mode & 0o777).toBe(0o600);
  });

  it('a log file that already exists with wider permissions is narrowed to 0600 on the next write', async () => {
    const path = join(mkdtempSync(join(tmpdir(), 'zoe-admin-')), 'discord-admin.jsonl');
    writeFileSync(path, '');
    chmodSync(path, 0o644);
    await appendAdminLog({ action: 'help', ok: true, by: '42' }, new Date(), path);
    expect(statSync(path).mode & 0o777).toBe(0o600);
  });
});

describe('wiring in discord.ts', () => {
  const d = readFileSync(join(__dirname, '..', 'discord.ts'), 'utf8');

  it('flag-gated, after the rate limit, before the model turn, and owner-checked', () => {
    const gate = d.indexOf('if (discordAdminEnabled()) {');
    expect(gate).toBeGreaterThan(d.indexOf('if (!discordTurnAllowed('));
    expect(gate).toBeLessThan(d.indexOf('const result = await runConciergeTurn({'));
    expect(gate).toBeLessThan(d.indexOf('await message.channel.sendTyping();'));
    expect(d).toContain('if (!isDiscordOwner(by, DISCORD_ZAAL_ID)) {');
    // The "admin:" text path inside messageCreate (the slash handler has its own owner check).
    const textGate = d.indexOf('if (!isDiscordOwner(by, DISCORD_ZAAL_ID)) {', d.indexOf('if (discordAdminEnabled()) {'));
    expect(textGate).toBeGreaterThan(d.indexOf('if (discordAdminEnabled()) {'));
    expect(textGate).toBeLessThan(d.indexOf('runAdminCommand(cmd, discordAdminEnv(message.guild, message.channel))'));
  });

  it('a non-owner is refused by DM, never in the channel, and nothing runs', () => {
    const block = d.slice(
      d.indexOf('if (!isDiscordOwner(by, DISCORD_ZAAL_ID)) {', d.indexOf('if (discordAdminEnabled()) {')),
      d.indexOf('} else if (!message.inGuild()) {'),
    );
    expect(block).toContain('await message.author.send({ content: ADMIN_REFUSAL_LINE, allowedMentions: { parse: [] } }).catch(() => undefined);');
    expect(block).toContain('return;');
    expect(block).not.toContain('message.reply(');
    expect(block).not.toContain('runAdminCommand(');
    expect(ADMIN_REFUSAL_LINE).toContain('Nothing was changed');
  });

  it('archive clears role and member overrides that allow posting, never @everyone', () => {
    const env = d.slice(d.indexOf('async archiveChannel('), d.indexOf('async createThread('));
    expect(env).toContain('archivePerms(false)');
    expect(env).toContain('overridesToClear(ch.permissionOverwrites.cache.values(), guild.roles.everyone.id, postBits)');
    expect(env).toContain('archivePerms(null)');
    expect(env).toContain('return { cleared: toClear.length };');
  });

  it('every branch logs, and the reply can ping nobody', () => {
    const block = d.slice(d.indexOf('if (discordAdminEnabled()) {'), d.indexOf('await message.channel.sendTyping();'));
    expect(block.match(/await appendAdminLog\(/g)).toHaveLength(3);
    expect(block).toContain("allowedMentions: { parse: [], repliedUser: false }");
    expect(block).toContain('return;');
  });

  it('events are members-only, carry the audit reason, and an outside event needs its location', () => {
    const env = d.slice(d.indexOf('async createEvent(e) {'), d.indexOf('/** Reasons for kicks waiting'));
    expect(env).toContain('privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,');
    expect(env).toContain('reason: ADMIN_AUDIT_REASON,');
    expect(env).toContain("entityType: GuildScheduledEventEntityType.External,\n            entityMetadata: { location: e.location ?? '' },");
  });

  it('nothing in the admin env deletes or bans, and it kicks in one place only', () => {
    const env = d.slice(d.indexOf('function discordAdminEnv('), d.indexOf('/** Reasons for kicks waiting'));
    expect(env.length).toBeGreaterThan(1000);
    expect(env).not.toMatch(/\.delete\(|\.ban\(|bulkDelete/);
    expect(env.match(/\.kick\(/g)).toHaveLength(1);
  });
});
